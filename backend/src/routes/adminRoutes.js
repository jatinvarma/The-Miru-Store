const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// ── IMAGE UPLOAD CONFIGURATION ────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpg, jpeg, png, gif, webp) are allowed'));
  }
});

// Image Upload Endpoint
router.post('/upload', adminAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ── STATS & GENERAL OVERVIEW ──────────────────────────────────
router.get('/stats', adminAuth, (req, res) => {
  const totalRevenue = db.prepare("SELECT IFNULL(SUM(total),0) as revenue FROM orders WHERE status != 'cancelled'").get().revenue;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  
  const recentOrders = db.prepare(`
    SELECT orders.*, users.name as user_name, users.email as user_email
    FROM orders JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC LIMIT 10
  `).all().map(o => ({ ...o, items: JSON.parse(o.items) }));
  
  const topProducts = db.prepare(`
    SELECT products.name, SUM(cart.quantity) as total_sold
    FROM cart JOIN products ON cart.product_id = products.id
    GROUP BY products.id ORDER BY total_sold DESC LIMIT 5
  `).all();
  
  res.json({ totalRevenue, totalOrders, totalUsers, totalProducts, recentOrders, topProducts });
});

// ── ORDERS MANAGEMENT ──────────────────────────────────────────
router.get('/orders', adminAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT orders.*, users.name as user_name, users.email as user_email
    FROM orders JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC
  `).all().map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json(orders);
});

router.put('/orders/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ── PRODUCTS CRUD ──────────────────────────────────────────────
router.get('/products', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY id ASC').all());
});

router.post('/products', adminAuth, (req, res) => {
  const { name, description, price, image, images, category, stock, is_new, is_sale, sale_price } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  
  // Format images array or keep empty array if not supplied
  let imagesJson = '[]';
  if (images) {
    imagesJson = Array.isArray(images) ? JSON.stringify(images) : images;
  } else if (image) {
    imagesJson = JSON.stringify([image]);
  }

  const result = db.prepare('INSERT INTO products (name, description, price, image, images, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, description || '', parseFloat(price), image || '', imagesJson, category || 'Accessories', parseInt(stock) || 100, is_new ? 1 : 0, is_sale ? 1 : 0, sale_price ? parseFloat(sale_price) : null);
  
  res.json({ id: result.lastInsertRowid, success: true });
});

router.put('/products/:id', adminAuth, (req, res) => {
  const { name, description, price, image, images, category, stock, is_new, is_sale, sale_price } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  
  let imagesJson = '[]';
  if (images) {
    imagesJson = Array.isArray(images) ? JSON.stringify(images) : images;
  } else if (image) {
    imagesJson = JSON.stringify([image]);
  }

  db.prepare('UPDATE products SET name=?, description=?, price=?, image=?, images=?, category=?, stock=?, is_new=?, is_sale=?, sale_price=? WHERE id=?')
    .run(name, description || '', parseFloat(price), image || '', imagesJson, category || 'Accessories', parseInt(stock) || 0, is_new ? 1 : 0, is_sale ? 1 : 0, sale_price ? parseFloat(sale_price) : null, req.params.id);
  
  res.json({ success: true });
});

router.delete('/products/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── COUPON MANAGER ROUTES ──────────────────────────────────────
router.get('/coupons', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY id DESC').all());
});

router.post('/coupons', adminAuth, (req, res) => {
  const { code, discount_pct } = req.body;
  if (!code || !discount_pct) return res.status(400).json({ error: 'Code and discount percentage are required' });
  try {
    const result = db.prepare('INSERT INTO coupons (code, discount_pct, active) VALUES (?, ?, 1)')
      .run(code.toUpperCase().trim(), parseInt(discount_pct));
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/coupons/:id/toggle', adminAuth, (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  const newActive = coupon.active === 1 ? 0 : 1;
  db.prepare('UPDATE coupons SET active = ? WHERE id = ?').run(newActive, req.params.id);
  res.json({ success: true, active: newActive });
});

router.delete('/coupons/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── MESSAGES & NEWSLETTER SUBSCRIBERS ─────────────────────────
router.get('/messages', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all());
});

router.get('/newsletter', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all());
});

module.exports = router;
