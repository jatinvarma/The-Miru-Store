const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'shop.db');
const db = new DatabaseSync(dbPath);

console.log('Updating Minimalist Backpack image...');

const imageUrl = 'https://www.cabinzero.com/cdn/shop/files/Banner-phone_0738f606-d0da-49c7-8a18-ebcb34d565dd.jpg?v=1704338965&width=768';
const update = db.prepare(`UPDATE products SET image = ? WHERE name = 'Minimalist Backpack'`);
const res = update.run(imageUrl);

console.log('Changes made:', res.changes);
db.close();
console.log('Done!');
