const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const db = new Database(path.join(__dirname, 'shop.db'));

try {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const products = [
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
  ];
  products.forEach(p => insert.run(...p));
  console.log('Inserted 10 new products into shop.db successfully.');
} catch (e) {
  console.error('Error inserting products:', e);
}
