const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');

const db = new Database(path.join(__dirname, 'shop.db'));

try {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, images, category, stock, is_new, is_sale, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const additionalProducts = [
    [
      'Silk Sleep Mask',
      '100% mulberry silk sleep mask filled with silk floss',
      2200,
      'https://images.unsplash.com/photo-1590577976322-3d2d6e213065?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1590577976322-3d2d6e213065?w=400']),
      'Wellness',
      30, 1, 0, null
    ],
    [
      'Acoustic Wood Panel',
      'Oak veneer acoustic slat panel with recycled felt backing',
      14500,
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400']),
      'Workspace',
      10, 0, 0, null
    ],
    [
      'Solid Brass Incense Burner',
      'Minimalist brass bowl incense burner with sand base',
      3800,
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400']),
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
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=400']),
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
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400']),
      'Workspace',
      18, 1, 0, null
    ],
    [
      'Japanese Matcha Whisk',
      'Traditional 80-prong bamboo chasen whisk for perfect matcha froth',
      1800,
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400']),
      'Kitchen',
      35, 1, 0, null
    ],
    [
      'Travertine Coaster Set',
      'Set of 4 raw, unfilled natural travertine stone coasters',
      3100,
      'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1606744824163-985d376605aa?w=400']),
      'Home',
      40, 0, 0, null
    ],
    [
      'Portable Espresso Maker',
      'Hand-powered portable espresso machine for travel and camping',
      9500,
      'https://images.unsplash.com/photo-1519082836055-472722fc5902?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1519082836055-472722fc5902?w=400']),
      'Kitchen',
      12, 0, 1, 7999
    ],
    [
      'Rattan Storage Basket',
      'Hand-woven natural rattan basket with dual handles',
      3600,
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1544816155-12df9643f363?w=400']),
      'Home',
      30, 0, 0, null
    ],
    [
      'Oak Wood Bench',
      'Minimalist solid oak entryway bench with tapered wooden legs',
      21000,
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400']),
      'Furniture',
      8, 1, 0, null
    ],
    [
      'USB Rechargeable Lighter',
      'Sleek zinc alloy arc lighter with flexible neck and battery indicators',
      2900,
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400']),
      'Tech',
      25, 0, 0, null
    ]
  ];

  additionalProducts.forEach(p => {
    // Check if product already exists to prevent duplicate runs
    const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(p[0]);
    if (!existing) {
      insert.run(...p);
      console.log(`Inserted product: ${p[0]}`);
    } else {
      console.log(`Product already exists: ${p[0]}`);
    }
  });
  console.log('Successfully completed additional products check/insertion.');
} catch (e) {
  console.error('Error inserting products:', e);
}
