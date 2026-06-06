import React, { useState, useEffect, useCallback } from 'react';
import Nav from './components/Nav';
import CartDrawer from './components/CartDrawer';
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
import About from './pages/About';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnsRefunds from './pages/ReturnsRefunds';
import PrivacyPolicy from './pages/PrivacyPolicy';
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
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [page, setPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishIds, setWishIds] = useState(new Set());
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [preloaderFade, setPreloaderFade] = useState(false);

  const api = useApi(token);
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setPreloaderFade(true);
    }, 1500);

    const removeTimer = setTimeout(() => {
      setPreloaderActive(false);
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  const scrollToShop = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('shop');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

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

  const updateCartQty = async (productId, quantity) => {
    if (!token) { setAuthOpen(true); return; }
    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) {
      if (quantity > 0) {
        await api.post('/cart', { product_id: productId, quantity });
        setCartDrawerOpen(true); // Auto-open on addition
      }
    } else {
      if (quantity < 1) {
        await api.del(`/cart/${cartItem.id}`);
      } else {
        await api.put(`/cart/${cartItem.id}`, { quantity });
      }
    }
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
      {preloaderActive && (
        <div className={`welcome-preloader ${preloaderFade ? 'fade-out' : ''}`}>
          <div className="preloader-content">
            <div className="preloader-logo">MIRU<span>.</span></div>
            <div className="preloader-line">
              <div className="preloader-progress" />
            </div>
            <p className="preloader-subtitle">Curated objects for a considered life</p>
          </div>
        </div>
      )}

      <Nav
        user={user}
        cartCount={cartCount}
        onCartOpen={() => setCartDrawerOpen(true)}
        onAuthOpen={() => setAuthOpen(true)}
        onLogout={handleLogout}
        page={page}
        setPage={setPage}
        theme={theme}
        toggleTheme={toggleTheme}
        isAdmin={isAdmin}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onUpdateCartQty={updateCartQty}
        onCheckout={() => setPage('checkout')}
      />

      {page === 'home' && (
        <Home
          token={token}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateCartQty={updateCartQty}
          onAuthRequired={() => setAuthOpen(true)}
          wishIds={wishIds}
          onWishToggle={toggleWishlist}
          activeCategory={selectedCategory}
          setActiveCategory={setSelectedCategory}
        />
      )}

      {page === 'contact' && <Contact />}

      {page === 'about' && <About onExplore={() => setPage('home')} />}

      {page === 'shipping-policy' && <ShippingPolicy onBackToShop={() => setPage('home')} />}

      {page === 'returns-refunds' && <ReturnsRefunds onBackToShop={() => setPage('home')} />}

      {page === 'privacy-policy' && <PrivacyPolicy onBackToShop={() => setPage('home')} />}

      {page === 'wishlist' && (
        <WishlistPage
          token={token}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateCartQty={updateCartQty}
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
              <a onClick={() => { setSelectedCategory('All'); setPage('home'); scrollToShop(); }}>All Products</a>
              <a onClick={() => { setSelectedCategory('Home'); setPage('home'); scrollToShop(); }}>Home</a>
              <a onClick={() => { setSelectedCategory('Apparel'); setPage('home'); scrollToShop(); }}>Apparel</a>
              <a onClick={() => { setSelectedCategory('Kitchen'); setPage('home'); scrollToShop(); }}>Kitchen</a>
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
              <a onClick={() => setPage('about')}>About Us</a>
              <a onClick={() => setPage('shipping-policy')}>Shipping Policy</a>
              <a onClick={() => setPage('returns-refunds')}>Returns &amp; Refunds</a>
              <a onClick={() => setPage('privacy-policy')}>Privacy Policy</a>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', maxWidth: '1300px', margin: '0 auto' }}>
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
