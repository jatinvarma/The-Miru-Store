const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'shop.db'));

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
    images TEXT, -- Store JSON array of additional image URLs
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

// Add images column to products if it doesn't exist (in case database was already created)
try {
  db.exec('ALTER TABLE products ADD COLUMN images TEXT;');
} catch (e) {
  // Column already exists or other error (ignored)
}

// Add image column to reviews if it doesn't exist
try {
  db.exec('ALTER TABLE reviews ADD COLUMN image TEXT;');
} catch (e) {
  // Column already exists or other error (ignored)
}

// ── SEED PRODUCTS ─────────────────────────────────────────────
const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (existingProducts.count === 0) {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, images, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  // Seed products with multiple images
  const products = [
    [
      'Obsidian Watch', 
      'Minimalist timepiece with a matte black case and sapphire crystal glass', 
      24899, 
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400',
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400'
      ]),
      'Accessories', 
      15, 0, 0, null
    ],
    [
      'Marble Desk Lamp', 
      'Architectural lamp with a genuine white marble base and brass arm', 
      15769, 
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
        'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=400'
      ]),
      'Home', 
      22, 1, 0, null
    ],
    [
      'Leather Portfolio', 
      'Full-grain tan leather portfolio with internal pockets and pen holder', 
      12449, 
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
        'https://images.unsplash.com/photo-1517254485387-ac1a94294025?w=400'
      ]),
      'Accessories', 
      40, 0, 0, null
    ],
    [
      'Ceramic Pour-Over', 
      'Hand-thrown ceramic pour-over dripper with natural ash glaze', 
      6639, 
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'
      ]),
      'Kitchen', 
      55, 0, 1, 4979
    ],
    [
      'Merino Crewneck', 
      'Ultra-soft 100% merino wool crewneck in natural oatmeal', 
      19089, 
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400'
      ]),
      'Apparel', 
      30, 0, 0, null
    ],
    [
      'Brass Bookends', 
      'Solid cast brass bookends with a brushed satin finish', 
      9959, 
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'
      ]),
      'Home', 
      18, 1, 0, null
    ],
    [
      'Linen Tote Bag', 
      'Heavyweight washed linen tote with leather handles and inner zipper', 
      7469, 
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400'
      ]),
      'Accessories', 
      60, 0, 0, null
    ],
    [
      'Walnut Coasters', 
      'Set of 4 solid black walnut coasters with felt backing', 
      4979, 
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 
      JSON.stringify([
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      ]),
      'Home', 
      45, 0, 1, 3319
    ],
    [
      'Matte Black Teapot', 
      'Cast iron teapot with an enamel interior and stainless steel infuser', 
      10789, 
      'https://upload.wikimedia.org/wikipedia/commons/6/66/Cast_iron_teapot.jpg', 
      JSON.stringify([
        'https://upload.wikimedia.org/wikipedia/commons/6/66/Cast_iron_teapot.jpg'
      ]),
      'Kitchen', 
      25, 1, 0, null
    ],
    [
      'Cashmere Throw', 
      'Generously sized throw blanket spun from 100% pure Mongolian cashmere', 
      29049, 
      'https://images.pexels.com/photos/5696582/pexels-photo-5696582.jpeg?auto=compress&cs=tinysrgb&w=400', 
      JSON.stringify([
        'https://images.pexels.com/photos/5696582/pexels-photo-5696582.jpeg?auto=compress&cs=tinysrgb&w=400'
      ]),
      'Home', 
      12, 0, 0, null
    ],
    [
      'Silk Sleep Mask',
      '100% mulberry silk sleep mask filled with silk floss',
      2200,
      '/img/silk_mask.jpg',
      JSON.stringify(['/img/silk_mask.jpg']),
      'Wellness',
      30, 1, 0, null
    ],
    [
      'Acoustic Wood Panel',
      'Oak veneer acoustic slat panel with recycled felt backing',
      14500,
      '/img/acoustic_panel.jpg',
      JSON.stringify(['/img/acoustic_panel.jpg']),
      'Workspace',
      10, 0, 0, null
    ],
    [
      'Solid Brass Incense Burner',
      'Minimalist brass bowl incense burner with sand base',
      3800,
      '/img/brass_burner.jpg',
      JSON.stringify(['/img/brass_burner.jpg']),
      'Wellness',
      25, 0, 1, 3200
    ],
    [
      'Stoneware Serving Bowl',
      'Large hand-glazed stoneware bowl perfect for family-style dining',
      5200,
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400']),
      'Kitchen',
      15, 1, 0, null
    ],
    [
      'Linen Throw Pillow',
      '100% heavy linen cushion cover with premium duck feather insert',
      4500,
      '/img/linen_pillow.jpg',
      JSON.stringify(['/img/linen_pillow.jpg']),
      'Home',
      20, 0, 0, null
    ],
    [
      'Merino Wool Socks',
      'Thick, insulating merino wool socks in charcoal grey',
      1400,
      'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1582966772680-860e372bb558?w=400']),
      'Apparel',
      50, 0, 1, 1120
    ],
    [
      'Leather Tech Organizer',
      'Genuine leather roll-up pouch for cables, chargers, and SD cards',
      4900,
      '/img/leather_organizer.jpg',
      JSON.stringify(['/img/leather_organizer.jpg']),
      'Workspace',
      18, 1, 0, null
    ],
    [
      'Japanese Matcha Whisk',
      'Traditional 80-prong bamboo chasen whisk for perfect matcha froth',
      1800,
      '/img/matcha_whisk.jpg',
      JSON.stringify(['/img/matcha_whisk.jpg']),
      'Kitchen',
      35, 1, 0, null
    ],
    [
      'Travertine Coaster Set',
      'Set of 4 raw, unfilled natural travertine stone coasters',
      3100,
      '/img/travertine_coasters.jpg',
      JSON.stringify(['/img/travertine_coasters.jpg']),
      'Home',
      40, 0, 0, null
    ],
    [
      'Portable Espresso Maker',
      'Hand-powered portable espresso machine for travel and camping',
      9500,
      '/img/espresso_maker.jpg',
      JSON.stringify(['/img/espresso_maker.jpg']),
      'Kitchen',
      12, 0, 1, 7999
    ],
    [
      'Rattan Storage Basket',
      'Hand-woven natural rattan basket with dual handles',
      3600,
      '/img/rattan_basket.jpg',
      JSON.stringify(['/img/rattan_basket.jpg']),
      'Home',
      30, 0, 0, null
    ],
    [
      'Oak Wood Bench',
      'Minimalist solid oak entryway bench with tapered wooden legs',
      21000,
      '/img/oak_bench.jpg',
      JSON.stringify(['/img/oak_bench.jpg']),
      'Furniture',
      8, 1, 0, null
    ],
    [
      'USB Rechargeable Lighter',
      'Sleek zinc alloy arc lighter with flexible neck and battery indicators',
      2900,
      '/img/usb_lighter.jpg',
      JSON.stringify(['/img/usb_lighter.jpg']),
      'Tech',
      25, 0, 0, null
    ]
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

module.exports = db;
