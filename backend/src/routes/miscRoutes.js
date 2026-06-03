const express = require('express');
const db = require('../db');

const router = express.Router();

// Newsletter Subscription
router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
    res.json({ success: true });
  } catch (e) {
    res.status(409).json({ error: 'Already subscribed' });
  }
});

// Contact Form Message
router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(name, email, subject, message);
  res.json({ success: true, message: 'Message received! We will get back to you soon.' });
});

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
