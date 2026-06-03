const jwt = require('jsonwebtoken');

const JWT_SECRET = 'shop_secret_key_2024';
const ADMIN_EMAIL = 'admin@miru.co';

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

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin only' });
    }
    next();
  });
};

module.exports = {
  auth,
  adminAuth,
  JWT_SECRET,
  ADMIN_EMAIL
};
