const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'shop_secret_key_2024';
const ADMIN_EMAIL = 'admin@miru.co';

// Allow frontend tunnel URL
app.use(cors({ origin: ['http://localhost:3000', 'https://clinton-realty-bills-get.trycloudflare.com', 'https://project-theaters-seeker-democratic.trycloudflare.com'], credentials: true }));
app.use(express.json());

const db = new Database(path.join(__dirname, 'shop.db'));

// ── TABLES ────────────────────────────────────────────────────
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
    stock INTEGER DEFAULT 100,
    is_new INTEGER DEFAULT 0,
    is_sale INTEGER DEFAULT 0,
    sale_price REAL
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
    status TEXT DEFAULT 'confirmed',
    items TEXT,
    shipping_address TEXT,
    payment_method TEXT,
    payment_details TEXT,
    coupon_code TEXT,
    discount_amount REAL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_pct INTEGER NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── SEED PRODUCTS ─────────────────────────────────────────────
const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (existingProducts.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const products = [
    ['Obsidian Watch', 'Minimalist timepiece with a matte black case and sapphire crystal glass', 24899, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Accessories', 15, 0, 0, null],
    ['Marble Desk Lamp', 'Architectural lamp with a genuine white marble base and brass arm', 15769, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 'Home', 22, 1, 0, null],
    ['Leather Portfolio', 'Full-grain tan leather portfolio with internal pockets and pen holder', 12449, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', 'Accessories', 40, 0, 0, null],
    ['Ceramic Pour-Over', 'Hand-thrown ceramic pour-over dripper with natural ash glaze', 6639, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'Kitchen', 55, 0, 1, 4979],
    ['Merino Crewneck', 'Ultra-soft 100% merino wool crewneck in natural oatmeal', 19089, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 'Apparel', 30, 0, 0, null],
    ['Brass Bookends', 'Solid cast brass bookends with a brushed satin finish', 9959, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', 'Home', 18, 1, 0, null],
    ['Linen Tote Bag', 'Heavyweight washed linen tote with leather handles and inner zipper', 7469, 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400', 'Accessories', 60, 0, 0, null],
    ['Walnut Coasters', 'Set of 4 solid black walnut coasters with felt backing', 4979, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Home', 45, 0, 1, 3319],
    ['Matte Black Teapot', 'Cast iron teapot with an enamel interior and stainless steel infuser', 10789, 'https://upload.wikimedia.org/wikipedia/commons/6/66/Cast_iron_teapot.jpg', 'Kitchen', 25, 1, 0, null],
    ['Cashmere Throw', 'Generously sized throw blanket spun from 100% pure Mongolian cashmere', 29049, 'https://images.pexels.com/photos/5696582/pexels-photo-5696582.jpeg?auto=compress&cs=tinysrgb&w=400', 'Home', 12, 0, 0, null],
    ['Steel Rollerball Pen', 'Machined from solid stainless steel, perfectly balanced for writing', 7055, 'https://images.pexels.com/photos/3782226/pexels-photo-3782226.jpeg?auto=compress&cs=tinysrgb&w=400', 'Accessories', 80, 0, 0, null],
    ['Japanese Chef Knife', 'Hand-forged Damascus steel Santoku knife with a rosewood handle', 20749, 'https://images.pexels.com/photos/4230623/pexels-photo-4230623.jpeg?auto=compress&cs=tinysrgb&w=400', 'Kitchen', 3, 0, 0, null],
    ['Beeswax Candle', 'Hand-poured pure beeswax candle in a smoked glass tumbler', 3735, 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Burning_candle.jpg', 'Home', 100, 1, 1, 2656],
    ['Linen Apron', 'Cross-back stonewashed linen apron with large utility pockets', 6225, 'https://images.pexels.com/photos/8522774/pexels-photo-8522774.jpeg?auto=compress&cs=tinysrgb&w=400', 'Kitchen', 45, 0, 0, null],
    ['Minimalist Backpack', 'Water-resistant daily carry backpack with a padded laptop sleeve', 15355, 'https://images.pexels.com/photos/15459359/pexels-photo-15459359.jpeg?auto=compress&cs=tinysrgb&w=400', 'Accessories', 35, 1, 0, null],
    ['Cashmere Beanie', 'Rib-knit pure cashmere beanie designed for exceptional warmth', 7885, 'https://images.pexels.com/photos/5804300/pexels-photo-5804300.jpeg?auto=compress&cs=tinysrgb&w=400', 'Apparel', 50, 0, 0, null],
    ['Ceramic Plate Set', 'A minimalist, aesthetic ceramic plate set for modern dining', 4500, '/img/ceramic_plates_1776351577027.png', 'Home', 20, 1, 0, null],
    ['Stonewashed Linen Napkins', 'Set of 4 minimal stonewashed linen napkins', 2500, '/img/linen_napkins_1776351606571.png', 'Kitchen', 40, 0, 0, null],
    ['Minimalist Wall Clock', 'A sleek, modern wall clock with no numbers in brushed steel', 6000, '/img/wall_clock_1776351621960.png', 'Home', 15, 1, 0, null],
    ['Artisan Leather Belt', 'Handcrafted genuine leather belt with a solid brass buckle', 4000, '/img/leather_belt_1776351639269.png', 'Accessories', 30, 0, 0, null],
    ['Glass French Press', 'Modern glass and matte black steel french press coffee maker', 4200, '/img/french_press_1776351658275.png', 'Kitchen', 25, 1, 0, null],
    ['Walnut Desk Organizer', 'Premium walnut wood minimalist desk organizer', 3500, '/img/desk_organizer_1776351676217.png', 'Accessories', 20, 0, 0, null],
    ['Sculptural Ceramic Vase', 'White ceramic sculptural vase for dried arrangements', 5500, '/img/sculptural_vase_1776351756955.png', 'Home', 12, 1, 0, null],
    ['Ribbed Glass Carafe', 'Elegant thin-glass ribbed carafe for the modern table', 3200, '/img/glass_carafe_1776351788243.png', 'Kitchen', 35, 0, 1, 2800],
    ['Pure Cashmere Socks', 'Neatly folded premium grey cashmere socks for ultimate comfort', 1800, '/img/cashmere_socks_1776351806503.png', 'Apparel', 60, 0, 0, null],
    ['Minimalist Leather Wallet', 'Slim minimalist tan leather wallet for everyday carry', 2900, '/img/leather_wallet_1776351830064.png', 'Accessories', 45, 1, 0, null],
    ['Bouclé Curved Sofa', 'A modern sculptural curved sofa in premium beige bouclé fabric', 85000, '/img/cat_furniture_1776352020444.png', 'Furniture', 5, 1, 0, null],
    ['Minimalist Desk Setup', 'Warm wooden desk complete with premium productivity accessories', 45000, '/img/cat_workspace_1776352038213.png', 'Workspace', 10, 1, 0, null],
    ['Wireless Over-Ear Headphones', 'Modern minimalist wireless metal headphones', 25000, '/img/cat_tech_1776352060324.png', 'Tech', 20, 1, 0, null],
    ['Curated Wellness Set', 'High-end skincare bottles, sea sponge, and a soy candle', 12000, '/img/cat_wellness_1776352078553.png', 'Wellness', 15, 1, 0, null],
  ];
  products.forEach(p => insert.run(...p));
}

// Seed demo coupon codes
const existingCoupons = db.prepare('SELECT COUNT(*) as count FROM coupons').get();
if (existingCoupons.count === 0) {
  db.prepare("INSERT INTO coupons (code, discount_pct) VALUES ('MIRU10', 10)").run();
  db.prepare("INSERT INTO coupons (code, discount_pct) VALUES ('SAVE20', 20)").run();
  db.prepare("INSERT INTO coupons (code, discount_pct) VALUES ('FIRST50', 50)").run();
}

// ── MIDDLEWARES ───────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Admin only' });
    next();
  });
};

// ── AUTH ROUTES ───────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashed);
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

app.put('/api/auth/profile', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  const token = jwt.sign({ id: req.user.id, name, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: req.user.id, name, email: req.user.email } });
});

// ── PRODUCTS ROUTES ───────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const { category, search, sort, minPrice, maxPrice } = req.query;
  let query = `
    SELECT products.*, 
      IFNULL(AVG(reviews.rating), 0) as avg_rating,
      COUNT(reviews.id) as review_count
    FROM products LEFT JOIN reviews ON products.id = reviews.product_id
    WHERE 1=1
  `;
  const params = [];
  if (category && category !== 'All') { query += ' AND products.category = ?'; params.push(category); }
  if (search) { query += ' AND (products.name LIKE ? OR products.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (minPrice) { query += ' AND products.price >= ?'; params.push(parseFloat(minPrice)); }
  if (maxPrice) { query += ' AND products.price <= ?'; params.push(parseFloat(maxPrice)); }
  query += ' GROUP BY products.id';
  if (sort === 'price_asc') query += ' ORDER BY products.price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY products.price DESC';
  else if (sort === 'rating') query += ' ORDER BY avg_rating DESC';
  else query += ' ORDER BY products.id ASC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/products/:id', (req, res) => {
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

// ── REVIEWS ROUTES ────────────────────────────────────────────
app.get('/api/products/:id/reviews', (req, res) => {
  const reviews = db.prepare(`
    SELECT reviews.*, users.name as user_name
    FROM reviews JOIN users ON reviews.user_id = users.id
    WHERE reviews.product_id = ?
    ORDER BY reviews.created_at DESC
  `).all(req.params.id);
  res.json(reviews);
});

app.post('/api/products/:id/reviews', auth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  try {
    const result = db.prepare('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)')
      .run(req.user.id, req.params.id, rating, comment || '');
    res.json({ id: result.lastInsertRowid, rating, comment, user_name: req.user.name });
  } catch (e) {
    res.status(500).json({ error: 'Could not save review' });
  }
});

// ── WISHLIST ROUTES ───────────────────────────────────────────
app.get('/api/wishlist', auth, (req, res) => {
  const items = db.prepare(`
    SELECT wishlists.id, products.*
    FROM wishlists JOIN products ON wishlists.product_id = products.id
    WHERE wishlists.user_id = ?
  `).all(req.user.id);
  res.json(items);
});

app.post('/api/wishlist', auth, (req, res) => {
  const { product_id } = req.body;
  try {
    db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
    res.json({ success: true, wishlisted: true });
  } catch {
    res.status(409).json({ error: 'Already in wishlist' });
  }
});

app.delete('/api/wishlist/:productId', auth, (req, res) => {
  db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ success: true, wishlisted: false });
});

// ── COUPON ROUTES ─────────────────────────────────────────────
app.get('/api/coupons/:code', (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(req.params.code.toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
  res.json({ code: coupon.code, discount_pct: coupon.discount_pct });
});

// ── NEWSLETTER ROUTE ──────────────────────────────────────────
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
    res.json({ success: true });
  } catch {
    res.status(409).json({ error: 'Already subscribed' });
  }
});

// ── CART ROUTES ───────────────────────────────────────────────
app.get('/api/cart', auth, (req, res) => {
  const items = db.prepare(`
    SELECT products.*, cart.quantity, cart.id
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

// ── ORDERS ROUTES ─────────────────────────────────────────────
app.post('/api/orders', auth, (req, res) => {
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

  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
  res.json({ orderId: result.lastInsertRowid, total, status: 'confirmed' });
});

app.get('/api/orders', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items), shipping_address: o.shipping_address })));
});

// ── ADMIN ROUTES ──────────────────────────────────────────────
app.get('/api/admin/stats', adminAuth, (req, res) => {
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

app.put('/api/admin/orders/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT orders.*, users.name as user_name, users.email as user_email
    FROM orders JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC
  `).all().map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json(orders);
});

// ── CONTACT ROUTE ─────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(name, email, subject, message);
  res.json({ success: true, message: 'Message received! We will get back to you soon.' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.listen(PORT, () => console.log(`🚀 API Server running on http://localhost:${PORT}`));
