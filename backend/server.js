const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const miscRoutes = require('./src/routes/miscRoutes');

const app = express();
const PORT = 3001;

// CORS settings - Allow localhost frontend and default tunnels
app.use(cors({ 
  origin: [
    'http://localhost:3000', 
    'https://clinton-realty-bills-get.trycloudflare.com', 
    'https://project-theaters-seeker-democratic.trycloudflare.com'
  ], 
  credentials: true 
}));

app.use(express.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', miscRoutes);

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
