const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get cart
router.get('/', auth, (req, res) => {
  const items = db.prepare(`
    SELECT products.*, products.id AS product_id, cart.id AS id, cart.quantity
    FROM cart JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `).all(req.user.id);
  res.json(items);
});

// Add to cart
router.post('/', auth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock <= 0) return res.status(400).json({ error: 'This product is out of stock' });

  const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }
  res.json({ success: true });
});

// Update cart item quantity
router.put('/:id', auth, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  } else {
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.id, req.user.id);
  }
  res.json({ success: true });
});

// Delete cart item
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
