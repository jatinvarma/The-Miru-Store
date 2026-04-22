const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const db = new Database(path.join(__dirname, 'shop.db'));
try {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const products = [
    ['Bouclé Curved Sofa', 'A modern sculptural curved sofa in premium beige bouclé fabric', 85000, '/img/cat_furniture_1776352020444.png', 'Furniture', 5, 1, 0, null],
    ['Minimalist Desk Setup', 'Warm wooden desk complete with premium productivity accessories', 45000, '/img/cat_workspace_1776352038213.png', 'Workspace', 10, 1, 0, null],
    ['Wireless Over-Ear Headphones', 'Modern minimalist wireless metal headphones', 25000, '/img/cat_tech_1776352060324.png', 'Tech', 20, 1, 0, null],
    ['Curated Wellness Set', 'High-end skincare bottles, sea sponge, and a soy candle', 12000, '/img/cat_wellness_1776352078553.png', 'Wellness', 15, 1, 0, null],
  ];
  products.forEach(p => insert.run(...p));
  console.log('Inserted products for new categories');
} catch(e) { console.error(e) }
