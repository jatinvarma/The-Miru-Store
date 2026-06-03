const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Place order
router.post('/', auth, (req, res) => {
  const { shipping_address, payment_method, payment_details, coupon_code, discount_amount = 0 } = req.body;
  if (!shipping_address || !payment_method)
    return res.status(400).json({ error: 'Shipping address and payment method required' });

  const cartItems = db.prepare(`
    SELECT cart.quantity, products.price, products.name, products.id as product_id
    FROM cart JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `).all(req.user.id);

  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - (discount_amount || 0));

  const result = db.prepare(
    'INSERT INTO orders (user_id, total, items, shipping_address, payment_method, payment_details, coupon_code, discount_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, total, JSON.stringify(cartItems), JSON.stringify(shipping_address), payment_method,
    payment_details ? JSON.stringify(payment_details) : null, coupon_code || null, discount_amount, 'confirmed');

  // Deduct stock for each ordered item
  cartItems.forEach(item => {
    db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(item.quantity, item.product_id);
  });

  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
  res.json({ orderId: result.lastInsertRowid, total, status: 'confirmed' });
});

// Get order history
router.get('/', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders.map(o => ({ 
    ...o, 
    items: JSON.parse(o.items), 
    shipping_address: o.shipping_address 
  })));
});

// Cancel order
router.put('/:id/cancel', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['confirmed', 'packed'].includes(order.status)) 
    return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    
  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  const items = JSON.parse(order.items);
  items.forEach(item => db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id));
  res.json({ success: true });
});

module.exports = router;
