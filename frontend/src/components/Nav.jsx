import React, { useState } from 'react';

export default function Nav({ user, cartCount, onAuthOpen, onLogout, page, setPage, theme, toggleTheme, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (p) => { setPage(p); setMenuOpen(false); };
  
  return (
    <nav>
      <a className="nav-logo" onClick={() => go('home')} style={{ cursor: 'pointer' }}>
        MIRU<span>.</span>
      </a>
      <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        <span className={menuOpen ? 'open' : ''}></span>
        <span className={menuOpen ? 'open' : ''}></span>
        <span className={menuOpen ? 'open' : ''}></span>
      </button>
      <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
        <label className="theme-switch" aria-label="Toggle dark mode">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <div className="slider">
            <span className="icon sun">☀️</span>
            <span className="icon moon">🌙</span>
            <div className="thumb" />
          </div>
        </label>
        <a onClick={() => go('home')} className={page === 'home' ? 'active-link' : ''}>Shop</a>
        <a onClick={() => go('about')} className={page === 'about' ? 'active-link' : ''}>About</a>
        <a onClick={() => go('contact')} className={page === 'contact' ? 'active-link' : ''}>Contact</a>
        {user && (
          <>
            <a onClick={() => go('wishlist')} className={page === 'wishlist' ? 'active-link' : ''}>Wishlist</a>
            <a onClick={() => go('orders')} className={page === 'orders' || page === 'profile' ? 'active-link' : ''}>Account</a>
            {isAdmin && <a onClick={() => go('admin')} style={{ color: 'var(--gold)' }} className={page === 'admin' ? 'active-link' : ''}>Admin</a>}
            <a onClick={() => { onLogout(); setMenuOpen(false); }}>Sign out</a>
          </>
        )}
        {!user && <a onClick={() => { onAuthOpen(); setMenuOpen(false); }}>Sign in</a>}
        <button className="cart-btn" onClick={() => { go('cart'); }}>
          Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
