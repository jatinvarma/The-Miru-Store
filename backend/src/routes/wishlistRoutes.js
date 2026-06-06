const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get wishlist items
router.get('/', auth, (req, res) => {
  const items = db.prepare(`
    SELECT products.*, wishlists.id AS wishlist_id
    FROM wishlists JOIN products ON wishlists.product_id = products.id
    WHERE wishlists.user_id = ?
  `).all(req.user.id);
  res.json(items);
});

// Add to wishlist
router.post('/', auth, (req, res) => {
  const { product_id } = req.body;
  try {
    db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
    res.json({ success: true, wishlisted: true });
  } catch (e) {
    res.status(409).json({ error: 'Already in wishlist' });
  }
});

// Remove from wishlist
router.delete('/:productId', auth, (req, res) => {
  db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ success: true, wishlisted: false });
});

module.exports = router;
