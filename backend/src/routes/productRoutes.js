const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// List products
router.get('/', (req, res) => {
  const { category, search, sort, minPrice, maxPrice } = req.query;
  let query = `
    SELECT products.*, 
      IFNULL(AVG(reviews.rating), 0) as avg_rating,
      COUNT(reviews.id) as review_count
    FROM products LEFT JOIN reviews ON products.id = reviews.product_id
    WHERE 1=1
  `;
  const params = [];
  if (category && category !== 'All') { 
    query += ' AND products.category = ?'; 
    params.push(category); 
  }
  if (search) { 
    query += ' AND (products.name LIKE ? OR products.description LIKE ?)'; 
    params.push(`%${search}%`, `%${search}%`); 
  }
  if (minPrice) { 
    query += ' AND products.price >= ?'; 
    params.push(parseFloat(minPrice)); 
  }
  if (maxPrice) { 
    query += ' AND products.price <= ?'; 
    params.push(parseFloat(maxPrice)); 
  }
  query += ' GROUP BY products.id';
  if (sort === 'price_asc') query += ' ORDER BY products.price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY products.price DESC';
  else if (sort === 'rating') query += ' ORDER BY avg_rating DESC';
  else query += ' ORDER BY products.id ASC';
  
  res.json(db.prepare(query).all(...params));
});

// Single product
router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT products.*, 
      IFNULL(AVG(reviews.rating), 0) as avg_rating,
      COUNT(reviews.id) as review_count
    FROM products LEFT JOIN reviews ON products.id = reviews.product_id
    WHERE products.id = ?
    GROUP BY products.id
  `).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// Get product reviews
router.get('/:id/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT reviews.*, users.name as user_name
    FROM reviews JOIN users ON reviews.user_id = users.id
    WHERE reviews.product_id = ?
    ORDER BY reviews.created_at DESC
  `).all(req.params.id);
  res.json(reviews);
});

// Post review
router.post('/:id/reviews', auth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.user.id, req.params.id);
  if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });
  try {
    const result = db.prepare('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)')
      .run(req.user.id, req.params.id, rating, comment || '');
    res.json({ id: result.lastInsertRowid, rating, comment, user_name: req.user.name });
  } catch (e) {
    res.status(500).json({ error: 'Could not save review' });
  }
});

module.exports = router;
