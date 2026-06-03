import React, { useState, useEffect, useCallback } from 'react';
import Nav from './components/Nav';
import ChatWidget from './components/ChatWidget';
import ScrollToTopFAB from './components/ScrollToTopFAB';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Contact from './pages/Contact';
import WishlistPage from './pages/WishlistPage';
import AccountDashboard from './pages/AccountDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPanel from './pages/AdminPanel';
import useApi from './hooks/useApi';
import { showToast } from './utils/toast';

const ADMIN_EMAIL = 'admin@miru.co';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('miru_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('miru_user') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('miru_theme') || 'light');
  const [cart, setCart] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [page, setPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishIds, setWishIds] = useState(new Set());
  
  const api = useApi(token);
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => { 
    document.documentElement.setAttribute('data-theme', theme); 
  }, [theme]);

  const loadCart = useCallback(async () => {
    if (!token) { setCart([]); return; }
    const data = await api.get('/cart');
    setCart(Array.isArray(data) ? data : []);
  }, [token]);

  useEffect(() => { 
    loadCart(); 
  }, [loadCart]);

  const loadWishlist = useCallback(async () => {
    if (!token) { setWishIds(new Set()); return; }
    const data = await api.get('/wishlist');
    setWishIds(new Set(Array.isArray(data) ? data.map(i => i.id) : []));
  }, [token]);

  useEffect(() => { 
    loadWishlist(); 
  }, [loadWishlist]);

  const toggleWishlist = async (productId) => {
    if (!token) { setAuthOpen(true); return; }
    if (wishIds.has(productId)) {
      await api.del(`/wishlist/${productId}`);
      setWishIds(s => { 
        const n = new Set(s); 
        n.delete(productId); 
        return n; 
      });
      showToast('Removed from wishlist');
    } else {
      await api.post('/wishlist', { product_id: productId });
      setWishIds(s => new Set([...s, productId]));
      showToast('Added to wishlist ♥');
    }
  };

  const handleLogin = (tok, usr) => {
    setToken(tok); 
    setUser(usr);
    localStorage.setItem('miru_token', tok);
    localStorage.setItem('miru_user', JSON.stringify(usr));
  };

  const handleLogout = () => {
    setToken(null); 
    setUser(null); 
    setCart([]); 
    setWishIds(new Set());
    localStorage.removeItem('miru_token'); 
    localStorage.removeItem('miru_user');
    showToast('Signed out'); 
    setPage('home');
  };

  const addToCart = async (productId) => {
    await api.post('/cart', { product_id: productId });
    await loadCart();
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); 
    localStorage.setItem('miru_theme', next);
  };

  const submitCheckoutFinal = async (checkoutData) => {
    const data = await api.post('/orders', checkoutData);
    if (data.error) { 
      showToast('Error: ' + data.error); 
      throw new Error(data.error);
    }
    setCart([]);
    showToast(`Order #${String(data.orderId).padStart(5, '0')} confirmed! ₹${data.total.toFixed(2)}`);
    setPage('orders');
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <Nav 
        user={user} 
        cartCount={cartCount} 
        onCartOpen={() => setPage('cart')} 
        onAuthOpen={() => setAuthOpen(true)} 
        onLogout={handleLogout} 
        page={page} 
        setPage={setPage} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        isAdmin={isAdmin} 
      />

      {page === 'home' && (
        <Home 
          token={token} 
          onAddToCart={addToCart} 
          onAuthRequired={() => setAuthOpen(true)} 
          wishIds={wishIds} 
          onWishToggle={toggleWishlist} 
          activeCategory={selectedCategory} 
          setActiveCategory={setSelectedCategory} 
        />
      )}
      
      {page === 'contact' && <Contact />}
      
      {page === 'wishlist' && (
        <WishlistPage 
          token={token} 
          onAddToCart={addToCart} 
          onWishToggle={toggleWishlist} 
        />
      )}
      
      {(page === 'orders' || page === 'profile') && (
        <AccountDashboard 
          token={token} 
          user={user} 
          page={page} 
          setPage={setPage} 
          onUpdate={handleLogin} 
        />
      )}
      
      {page === 'admin' && (
        isAdmin ? (
          <AdminPanel token={token} />
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-soft)' }}>Access denied.</p>
          </div>
        )
      )}
      
      {page === 'cart' && (
        <CartPage
          token={token}
          cart={cart}
          onCartChange={loadCart}
          onCheckout={() => setPage('checkout')}
          onShop={() => setPage('home')}
        />
      )}
      
      {page === 'checkout' && (
        <CheckoutPage
          cart={cart}
          submitCheckout={submitCheckoutFinal}
          token={token}
          onBack={() => setPage('cart')}
        />
      )}

      {page !== 'cart' && page !== 'checkout' && (
        <footer>
          <div className="footer-inner">
            <div>
              <div className="footer-logo">MIRU<span>.</span></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', maxWidth: '220px', lineHeight: 1.6, marginTop: '0.5rem' }}>
                Curated objects for a considered life. Quality over quantity, always.
              </p>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Shop</div>
              <a onClick={() => { setSelectedCategory('All'); setPage('home'); }}>All Products</a>
              <a onClick={() => { setSelectedCategory('Home'); setPage('home'); }}>Home</a>
              <a onClick={() => { setSelectedCategory('Apparel'); setPage('home'); }}>Apparel</a>
              <a onClick={() => { setSelectedCategory('Kitchen'); setPage('home'); }}>Kitchen</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Account</div>
              <a onClick={() => setPage('orders')}>Orders</a>
              <a onClick={() => setPage('profile')}>Profile</a>
              <a onClick={() => setPage('wishlist')}>Wishlist</a>
              <a onClick={() => setPage('contact')}>Contact Us</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Info</div>
              <a>Shipping Policy</a>
              <a>Returns &amp; Refunds</a>
              <a>Privacy Policy</a>
              <a>Terms of Service</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="footer-copy">© 2026 MIRU. All rights reserved.</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>hello@miru.co &nbsp;·&nbsp; Mon–Fri 9am–6pm</div>
          </div>
        </footer>
      )}

      <ChatWidget />
      <ScrollToTopFAB />

      {authOpen && (
        <AuthModal 
          onClose={() => setAuthOpen(false)} 
          onLogin={handleLogin} 
        />
      )}
    </>
  );
}
