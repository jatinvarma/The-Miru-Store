const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'shop_secret_key_2024';

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Database setup
const db = new Database(path.join(__dirname, 'shop.db'));

// Init tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL,
    status TEXT DEFAULT 'pending',
    items TEXT,
    shipping_address TEXT,
    payment_method TEXT,
    payment_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed products
const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (existingProducts.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)');
  const products = [
    ['Obsidian Watch', 'Minimalist timepiece with a matte black case and sapphire crystal glass', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Accessories', 15],
    ['Marble Desk Lamp', 'Architectural lamp with a genuine white marble base and brass arm', 189.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 'Home', 22],
    ['Leather Portfolio', 'Full-grain tan leather portfolio with internal pockets and pen holder', 149.99, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', 'Accessories', 40],
    ['Ceramic Pour-Over', 'Hand-thrown ceramic pour-over dripper with natural ash glaze', 79.99, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'Kitchen', 55],
    ['Merino Crewneck', 'Ultra-soft 100% merino wool crewneck in natural oatmeal', 229.99, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 'Apparel', 30],
    ['Brass Bookends', 'Solid cast brass bookends with a brushed satin finish', 119.99, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', 'Home', 18],
    ['Linen Tote Bag', 'Heavyweight washed linen tote with leather handles and inner zipper', 89.99, 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400', 'Accessories', 60],
    ['Walnut Coasters', 'Set of 4 solid black walnut coasters with felt backing', 59.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Home', 45],
    ['Matte Black Teapot', 'Cast iron teapot with an enamel interior and stainless steel infuser', 129.99, 'https://upload.wikimedia.org/wikipedia/commons/6/66/Cast_iron_teapot.jpg', 'Kitchen', 25],
    ['Cashmere Throw', 'Generously sized throw blanket spun from 100% pure Mongolian cashmere', 349.99, 'https://images.pexels.com/photos/5696582/pexels-photo-5696582.jpeg?auto=compress&cs=tinysrgb&w=400', 'Home', 12],
    ['Steel Rollerball Pen', 'Machined from solid stainless steel, perfectly balanced for writing', 85.00, 'https://images.pexels.com/photos/3782226/pexels-photo-3782226.jpeg?auto=compress&cs=tinysrgb&w=400', 'Accessories', 80],
    ['Japanese Chef Knife', 'Hand-forged Damascus steel Santoku knife with a rosewood handle', 249.99, 'https://images.pexels.com/photos/4230623/pexels-photo-4230623.jpeg?auto=compress&cs=tinysrgb&w=400', 'Kitchen', 10],
    ['Beeswax Candle', 'Hand-poured pure beeswax candle in a smoked glass tumbler', 45.00, 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Burning_candle.jpg', 'Home', 100],
    ['Linen Apron', 'Cross-back stonewashed linen apron with large utility pockets', 75.00, 'https://images.pexels.com/photos/8522774/pexels-photo-8522774.jpeg?auto=compress&cs=tinysrgb&w=400', 'Kitchen', 45],
    ['Minimalist Backpack', 'Water-resistant daily carry backpack with a padded laptop sleeve', 185.00, 'https://images.pexels.com/photos/15459359/pexels-photo-15459359.jpeg?auto=compress&cs=tinysrgb&w=400', 'Accessories', 35],
    ['Cashmere Beanie', 'Rib-knit pure cashmere beanie designed for exceptional warmth', 95.00, 'https://images.pexels.com/photos/5804300/pexels-photo-5804300.jpeg?auto=compress&cs=tinysrgb&w=400', 'Apparel', 50]
  ];
  products.forEach(p => insert.run(...p));
}

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashed);
    const token = jwt.sign({ id: result.lastInsertRowid, name, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, name, email } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ── PRODUCTS ROUTES ──────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const { category, search, sort } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category && category !== 'All') { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (sort === 'price_asc') query += ' ORDER BY price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY price DESC';
  else query += ' ORDER BY id ASC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// ── CART ROUTES ──────────────────────────────────────────────
app.get('/api/cart', auth, (req, res) => {
  const items = db.prepare(`
    SELECT cart.id, cart.quantity, products.* 
    FROM cart JOIN products ON cart.product_id = products.id 
    WHERE cart.user_id = ?
  `).all(req.user.id);
  res.json(items);
});

app.post('/api/cart', auth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }
  res.json({ success: true });
});

app.put('/api/cart/:id', auth, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  } else {
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.id, req.user.id);
  }
  res.json({ success: true });
});

app.delete('/api/cart/:id', auth, (req, res) => {
  db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ── ORDERS ROUTES ────────────────────────────────────────────
app.post('/api/orders', auth, (req, res) => {
  const { shipping_address, payment_method, payment_details } = req.body;

  if (!shipping_address || !payment_method) {
    return res.status(400).json({ error: 'Shipping address and payment method required' });
  }

  const cartItems = db.prepare(`
    SELECT cart.quantity, products.price, products.name, products.id as product_id
    FROM cart JOIN products ON cart.product_id = products.id 
    WHERE cart.user_id = ?
  `).all(req.user.id);

  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const result = db.prepare('INSERT INTO orders (user_id, total, items, shipping_address, payment_method, payment_details, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    req.user.id, total, JSON.stringify(cartItems), JSON.stringify(shipping_address), payment_method, payment_details ? JSON.stringify(payment_details) : null, 'confirmed'
  );

  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);

  res.json({ orderId: result.lastInsertRowid, total, status: 'confirmed' });
});

app.get('/api/orders', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
});

// ── CONTACT ROUTE ────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(name, email, subject, message);
  res.json({ success: true, message: 'Message received! We will get back to you soon.' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => console.log(`🚀 API Server running on http://localhost:${PORT}`));
