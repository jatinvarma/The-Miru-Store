const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const db = new Database(path.join(__dirname, 'shop.db'));

try {
  // Update prices by multiplying by 83
  // only if they look like USD prices (e.g. less than 1000)
  // to avoid multiplying multiple times by mistake
  const info1 = db.prepare('UPDATE products SET price = round(price * 83) WHERE price < 1000').run();
  console.log(`Updated price for ${info1.changes} products.`);

  const info2 = db.prepare('UPDATE products SET sale_price = round(sale_price * 83) WHERE sale_price IS NOT NULL AND sale_price < 1000').run();
  console.log(`Updated sale_price for ${info2.changes} products.`);
  
  // also update prices in the cart just in case they were cached or referenced when added? 
  // Cart only stores product_id and quantity, price is joined from products.

  // Also update coupon minimums/maximums if there are any, but coupons just have percentage discount.
  // The maxPrice filter on frontend index.html needs to be changed.
  
  console.log('Prices updated successfully in the database.');
} catch (e) {
  console.error('Error updating prices:', e);
}
