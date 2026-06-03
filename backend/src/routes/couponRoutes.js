const express = require('express');
const db = require('../db');

const router = express.Router();

// Get coupon details
router.get('/:code', (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(req.params.code.toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
  res.json({ code: coupon.code, discount_pct: coupon.discount_pct });
});

module.exports = router;
