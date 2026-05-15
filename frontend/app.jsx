const { useState, useEffect, useCallback, useRef } = React;

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Use local backend server API
const API = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@miru.co';

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function useApi(token) {
  const headers = (extra = {}) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra });
  const get = p => fetch(API + p, { headers: headers() }).then(r => r.json()).catch(() => ({}));
  const post = (p, b) => fetch(API + p, { method: 'POST', headers: headers(), body: JSON.stringify(b) }).then(r => r.json()).catch(() => ({}));
  const put = (p, b) => fetch(API + p, { method: 'PUT', headers: headers(), body: JSON.stringify(b) }).then(r => r.json()).catch(() => ({}));
  const del = p => fetch(API + p, { method: 'DELETE', headers: headers() }).then(r => r.json()).catch(() => ({}));
  return { get, post, put, del };
}

// ── STARS ──────────────────────────────────────────────────────
function Stars({ rating, count }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span className="stars">{[1, 2, 3, 4, 5].map(n => <span key={n} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>★</span>)}</span>
      {count !== undefined && <span className="review-count">({count})</span>}
    </span>
  );
}

// ── SKELETON ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card skeleton-pulse">
      <div className="skeleton skeleton-img" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line med" />
      <div className="skeleton skeleton-line" />
      <div style={{ height: '2rem' }} />
    </div>
  );
}

// ── FAB ──────────────────────────────────────────────────────────
function ScrollToTopFAB() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <button className={`fab-top ${visible ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      ↑
    </button>
  );
}

// ── NAV ──────────────────────────────────────────────────────────
function Nav({ user, cartCount, onCartOpen, onAuthOpen, onLogout, page, setPage, theme, toggleTheme, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (p) => { setPage(p); setMenuOpen(false); };
  return (
    <nav>
      <a className="nav-logo" onClick={() => go('home')} style={{ cursor: 'pointer' }}>MIRU<span>.</span></a>
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
        <a onClick={() => go('home')}>Shop</a>
        <a onClick={() => go('contact')}>Contact</a>
        {user && <>
          <a onClick={() => go('wishlist')}>Wishlist</a>
          <a onClick={() => go('orders')}>Orders</a>
          <a onClick={() => go('profile')}>Profile</a>
          {isAdmin && <a onClick={() => go('admin')} style={{ color: 'var(--gold)' }}>Admin</a>}
          <a onClick={() => { onLogout(); setMenuOpen(false); }}>Sign out</a>
        </>}
        {!user && <a onClick={() => { onAuthOpen(); setMenuOpen(false); }}>Sign in</a>}
        <button className="cart-btn" onClick={() => { go('cart'); }}>Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button>
      </div>
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}

// ── WISHLIST PAGE ─────────────────────────────────────────────────
function WishlistPage({ token, onAddToCart, onWishToggle, wishIds }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi(token);
  const load = () => {
    setLoading(true);
    api.get('/wishlist').then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);
  const handleRemove = async (productId) => {
    await api.del(`/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.id !== productId));
    showToast('Removed from wishlist');
  };
  return (
    <div className="section">
      <div className="section-header">
        <h2>My Wishlist</h2>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{items.length} items</span>
      </div>
      {loading ? (
        <div className="products-grid">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--ink-soft)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>♡</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Your wishlist is empty.</p>
          <p style={{ fontSize: '0.8rem' }}>Browse the shop and heart the items you love.</p>
        </div>
      ) : (
        <div className="products-grid">
          {items.map(p => {
            const ep = p.is_sale && p.sale_price ? p.sale_price : p.price;
            return (
              <div className="product-card" key={p.id}>
                <div className="product-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div className="badge-wrap">
                    {p.is_new === 1 && <span className="badge badge-new">New</span>}
                    {p.is_sale === 1 && <span className="badge badge-sale">Sale</span>}
                    {p.stock <= 0 && <span className="badge badge-low">Out of Stock</span>}
                  </div>
                  <button className="wish-btn" style={{ color: 'var(--red)' }} onClick={() => handleRemove(p.id)}>♥</button>
                </div>
                <div className="product-info">
                  <div className="product-category">{p.category}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-footer" style={{ marginTop: '0.75rem' }}>
                    <span className="product-price">
                      {p.is_sale && p.sale_price ? <><span style={{ textDecoration: 'line-through', fontSize: '1rem', color: 'var(--ink-soft)', marginRight: '6px' }}>₹{p.price.toFixed(2)}</span>₹{p.sale_price.toFixed(2)}</> : `₹${ep.toFixed(2)}`}
                    </span>
                    <button className="add-btn" disabled={p.stock <= 0} style={{ opacity: p.stock <= 0 ? 0.35 : 1, cursor: p.stock <= 0 ? 'not-allowed' : 'pointer' }} onClick={() => p.stock > 0 && onAddToCart(p.id)}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────────
function Hero({ onShop }) {
  return (
    <div className="hero">
      <div className="hero-text">
        <h1>Premium<br /><em>Everyday</em><br />Products</h1>
        <p>We offer high-quality products for everyday use. Simple, effective, and beautifully designed.</p>
        <button className="btn btn-primary" onClick={onShop}>Shop Now</button>
      </div>
      <div className="hero-image">
        <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600" alt="Interior" />
        <div className="hero-tag">New Arrivals</div>
      </div>
    </div>
  );
}

// ── PRODUCT DETAIL MODAL ────────────────────────────────────────
function ProductDetailModal({ product, onClose, onAddToCart, token, wishIds, onWishToggle, onProductClick }) {
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const api = useApi(token);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    api.get(`/products/${product.id}/reviews`).then(d => setReviews(Array.isArray(d) ? d : []));
    api.get(`/products?category=${product.category}`).then(d => setRelated(Array.isArray(d) ? d.filter(p => p.id !== product.id).slice(0, 3) : []));
  }, [product.id]);
  const submitReview = async () => {
    if (!token) { showToast('Sign in to leave a review'); return; }
    if (!newRating) { showToast('Please select a star rating'); return; }
    const data = await api.post(`/products/${product.id}/reviews`, { rating: newRating, comment: newComment });
    if (data.id) { setReviews([{ ...data, user_name: 'You' }, ...reviews]); setNewRating(0); setNewComment(''); showToast('Review posted!'); }
  };
  const ep = product.is_sale && product.sale_price ? product.sale_price : product.price;
  const wishlisted = wishIds && wishIds.has(product.id);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-modal">
        <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>×</button>
        <div className="detail-img"><img src={product.image} alt={product.name} /></div>
        <div className="detail-info">
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginBottom: '0.4rem' }}>{product.category}</div>
          <h2>{product.name}</h2>
          <Stars rating={product.avg_rating || 0} count={product.review_count || 0} />
          <div className="detail-price">
            {!!(product.is_sale && product.sale_price) && <span className="original">₹{product.price.toFixed(2)}</span>}
            ₹{ep.toFixed(2)}
          </div>
          <p className="detail-desc">{product.description}</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onAddToCart(product.id); showToast(`${product.name} added!`); }}>Add to Cart</button>
            <button className="btn btn-outline" onClick={() => onWishToggle(product.id)} style={{ padding: '14px' }}>{wishlisted ? '♥' : '♡'}</button>
          </div>
          {product.stock <= 5 && product.stock > 0 && <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--red)' }}>Only {product.stock} left in stock!</div>}
          {related.length > 0 && (
            <>
              <div className="related-title">You may also like</div>
              <div className="related-grid">{related.map(p => <div key={p.id} className="related-thumb" title={p.name} onClick={() => onProductClick && onProductClick(p)}><img src={p.image} alt={p.name} /></div>)}</div>
            </>
          )}
          <div className="reviews-section">
            <div style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.75rem' }}>Reviews ({reviews.length})</div>
            {reviews.map(r => (
              <div className="review-item" key={r.id}>
                <div className="review-header"><span className="review-author">{r.user_name}</span><Stars rating={r.rating} /></div>
                <p className="review-text">{r.comment}</p>
              </div>
            ))}
            <div className="review-form">
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>Leave a review:</div>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map(n => <span key={n} className={`star-pick ${n <= (hoveredStar || newRating) ? 'active' : ''}`} onMouseEnter={() => setHoveredStar(n)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setNewRating(n)}>★</span>)}
              </div>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts..." style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', resize: 'vertical', minHeight: '70px', outline: 'none' }} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={submitReview}>Post Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CATEGORY SHOWCASE ──────────────────────────────────────────────
function CategoryShowcase({ onCategorySelect }) {
  const categories = [
    { title: 'Accessories', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600' },
    { title: 'Home', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600' },
    { title: 'Kitchen', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600' },
    { title: 'Apparel', img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
    { title: 'Furniture', img: '/img/cat_furniture_1776352020444.png' },
    { title: 'Workspace', img: '/img/cat_workspace_1776352038213.png' },
    { title: 'Tech', img: '/img/cat_tech_1776352060324.png' },
    { title: 'Wellness', img: '/img/cat_wellness_1776352078553.png' },
  ];
  return (
    <div className="category-showcase">
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Shop by Category</h2>
      <div className="category-grid">
        {categories.map(c => (
          <div key={c.title} className="category-card" onClick={() => onCategorySelect(c.title)}>
            <img src={c.img} alt={c.title} loading="lazy" />
            <div className="category-card-title">{c.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────────
function Products({ token, onAddToCart, onAuthRequired, wishIds, onWishToggle, activeCategory, setActiveCategory }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('default');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState(null);
  const api = useApi(token);
  const cats = ['All', 'Accessories', 'Home', 'Kitchen', 'Apparel', 'Furniture', 'Workspace', 'Tech', 'Wellness'];
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ category: activeCategory, search: debouncedSearch, sort, maxPrice }).toString();
    const data = await api.get(`/products?${params}`);
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [activeCategory, debouncedSearch, sort, maxPrice]);
  useEffect(() => { load(); }, [load]);
  const handleAdd = async (p) => {
    if (!token) { onAuthRequired(); return; }
    await onAddToCart(p.id);
    showToast(`${p.name} added to cart!`);
  };
  return (
    <div className="section" id="shop">
      <div className="section-header">
        <h2>Products</h2>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', }}>{products.length} items</span>
      </div>
      <div className="sticky-filters">
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Featured</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', paddingBottom: '1rem' }}>
          <div className="filters" style={{ marginBottom: 0 }}>
            {cats.map(c => <button key={c} className={`filter-btn ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>)}
          </div>
          <div className="price-range-wrap" style={{ marginBottom: 0, gap: '1rem' }}>
            <span>Max Price:</span>
            <input type="range" min="1000" max="50000" step="1000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            <span>₹{maxPrice}</span>
          </div>
        </div>
      </div>
      <div className="products-grid">
        {loading ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : products.map(p => (
          <div className="product-card" key={p.id} onClick={() => setDetailProduct(p)}>
            <div className="product-img">
              <img src={p.image} alt={p.name} loading="lazy" />
              <div className="badge-wrap">
                {p.is_new === 1 && <span className="badge badge-new">New</span>}
                {p.is_sale === 1 && <span className="badge badge-sale">Sale</span>}
                {p.stock === 0 && <span className="badge badge-low">Out of Stock</span>}
                {p.stock > 0 && p.stock <= 5 && <span className="badge badge-low">Low Stock</span>}
              </div>
              {token && <button className="wish-btn" onClick={e => { e.stopPropagation(); onWishToggle(p.id); }}>{wishIds && wishIds.has(p.id) ? '♥' : '♡'}</button>}
              <div className="product-overlay">
                {p.stock > 0
                  ? <button className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--ink)' }} onClick={e => { e.stopPropagation(); handleAdd(p); }}>Add to Cart</button>
                  : <span className="btn btn-sm" style={{ background: '#888', color: '#fff', cursor: 'not-allowed', opacity: 0.8 }}>Out of Stock</span>
                }
              </div>
            </div>
            <div className="product-info">
              <div className="product-category">{p.category}</div>
              <div className="product-name">{p.name}</div>
              <Stars rating={p.avg_rating || 0} count={p.review_count || 0} />
              <div className="product-footer" style={{ marginTop: '0.75rem' }}>
                <span className="product-price">
                  {p.is_sale && p.sale_price ? <><span style={{ textDecoration: 'line-through', fontSize: '1rem', color: 'var(--ink-soft)', marginRight: '6px' }}>₹{p.price.toFixed(2)}</span>₹{p.sale_price.toFixed(2)}</> : `₹${p.price.toFixed(2)}`}
                </span>
                <button className="add-btn" disabled={p.stock <= 0} style={{ opacity: p.stock <= 0 ? 0.35 : 1, cursor: p.stock <= 0 ? 'not-allowed' : 'pointer' }} onClick={e => { e.stopPropagation(); if (p.stock > 0) handleAdd(p); }}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {detailProduct && <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} onAddToCart={onAddToCart} token={token} wishIds={wishIds || new Set()} onWishToggle={onWishToggle} onProductClick={setDetailProduct} />}
    </div>
  );
}

// ── CART PAGE ──────────────────────────────────────────────────
function CartPage({ token, cart, onCartChange, onCheckout, onShop }) {
  const api = useApi(token);

  const updateQty = async (item, delta) => {
    if (item.quantity + delta < 1) return;
    await api.put(`/cart/${item.id}`, { quantity: item.quantity + delta });
    onCartChange();
  };
  const remove = async (item) => {
    await api.del(`/cart/${item.id}`);
    onCartChange();
    showToast('Item removed');
  };

  const subtotal = cart.reduce((s, i) => {
    const p = i.is_sale && i.sale_price ? i.sale_price : i.price;
    return s + p * i.quantity;
  }, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const savings = cart.reduce((s, i) => {
    if (i.is_sale && i.sale_price) return s + (i.price - i.sale_price) * i.quantity;
    return s;
  }, 0);

  return (
    <div className="cart-page">
      <div className="cart-page-inner">

        {/* ── LEFT: Item list ── */}
        <div className="cart-page-left">

          {/* Header */}
          <div className="cart-pg-header">
            <div>
              <button className="cart-page-continue" onClick={onShop}>← Continue Shopping</button>
              <h1 className="cart-pg-title">
                Your Cart
                {itemCount > 0 && <span className="cart-pg-badge">{itemCount}</span>}
              </h1>
            </div>
            {savings > 0 && (
              <div className="cart-pg-savings">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                You're saving ₹{savings.toFixed(2)}!
              </div>
            )}
          </div>

          {/* Empty state */}
          {cart.length === 0 ? (
            <div className="cart-pg-empty">
              <div className="cart-pg-empty-art">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added anything yet.<br />Start browsing and find something you love.</p>
              <button className="co-pay-btn" style={{ width: 'auto', padding: '0.85rem 2rem', marginTop: '0.5rem' }} onClick={onShop}>
                Browse Products →
              </button>
            </div>
          ) : (
            <>
              {/* Column labels */}
              <div className="cart-col-labels">
                <span>Product</span>
                <span>Qty</span>
                <span>Total</span>
              </div>

              {/* Items */}
              <div className="cart-items-list">
                {cart.map(item => {
                  const ep = item.is_sale && item.sale_price ? item.sale_price : item.price;
                  const onSale = item.is_sale && item.sale_price;
                  return (
                    <div className="cart-item-row" key={item.id}>
                      {/* Thumbnail */}
                      <div className="cart-item-thumb-wrap">
                        <img src={item.image} alt={item.name} className="cart-item-thumb" />
                        {onSale && <span className="cart-item-sale-badge">SALE</span>}
                      </div>

                      {/* Info */}
                      <div className="cart-item-info">
                        <span className="cart-item-cat">{item.category}</span>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price-row">
                          {onSale ? (
                            <>
                              <span className="cart-item-orig">₹{item.price.toFixed(2)}</span>
                              <span className="cart-item-sale">₹{item.sale_price.toFixed(2)}</span>
                              <span className="cart-item-pct-off">
                                {Math.round((1 - item.sale_price / item.price) * 100)}% off
                              </span>
                            </>
                          ) : (
                            <span className="cart-item-price">₹{item.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Qty stepper */}
                      <div className="cart-item-qty">
                        <button className="cart-qty-btn" onClick={() => updateQty(item, -1)} disabled={item.quantity <= 1}>−</button>
                        <span className="cart-qty-num">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQty(item, 1)}>+</button>
                      </div>

                      {/* Line total + remove */}
                      <div className="cart-item-total-col">
                        <div className="cart-item-total">₹{(ep * item.quantity).toFixed(2)}</div>
                        <button className="cart-item-remove" onClick={() => remove(item)} title="Remove item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Order summary ── */}
        {cart.length > 0 && (
          <div className="cart-page-summary">
            <div className="cart-summary-panel">

              {/* Header */}
              <div className="cart-sp-head">
                <span>Order Summary</span>
                <span className="cart-sp-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Line items */}
              <div className="cart-sp-lines">
                {cart.map((item, n) => {
                  const ep = item.is_sale && item.sale_price ? item.sale_price : item.price;
                  return (
                    <div key={n} className="cart-sp-line">
                      <span className="cart-sp-line-name">{item.name} <span className="co-qty">×{item.quantity}</span></span>
                      <span className="cart-sp-line-price">₹{(ep * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="cart-sp-sep" />

              {/* Subtotal / savings / shipping */}
              <div className="cart-sp-rows">
                <div className="cart-sp-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="cart-sp-row cart-sp-saving">
                    <span>Savings</span>
                    <span>−₹{savings.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-sp-row">
                  <span>Shipping</span>
                  <span className="cart-sp-free">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    Free
                  </span>
                </div>
              </div>

              <div className="cart-sp-total-row">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Checkout button */}
              <button className="co-pay-btn" onClick={onCheckout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Proceed to Checkout
              </button>

              {/* Accepted payments */}
              <div className="cart-sp-pay-logos">
                <span>We accept</span>
                <svg viewBox="0 0 38 24" width="32" height="20"><rect width="38" height="24" rx="3" fill="#1A1F71" /><text x="4" y="17" fill="#FFF" fontSize="13" fontFamily="Arial" fontWeight="bold" fontStyle="italic">VISA</text></svg>
                <svg viewBox="0 0 38 24" width="32" height="20"><rect width="38" height="24" rx="3" fill="#252525" /><circle cx="15" cy="12" r="7" fill="#EB001B" /><circle cx="23" cy="12" r="7" fill="#F79E1B" /><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" /></svg>
                <svg viewBox="0 0 38 24" width="32" height="20"><rect width="38" height="24" rx="3" fill="#003087" /><text x="4" y="16" fill="#009CDE" fontSize="9" fontFamily="Arial" fontWeight="bold">Pay</text><text x="17" y="16" fill="#FFF" fontSize="9" fontFamily="Arial" fontWeight="bold">Pal</text></svg>
                <svg viewBox="0 0 38 24" width="32" height="20"><rect width="38" height="24" rx="3" fill="#FFF" stroke="#E8E8E8" strokeWidth="1" /><text x="5" y="16" fill="#097939" fontSize="11" fontFamily="Arial" fontWeight="bold">UPI</text><polygon points="30,4 34,12 30,20 26,12" fill="#F47920" /><polygon points="26,4 30,12 26,20 22,12" fill="#097939" /></svg>
              </div>

              <div className="co-pay-note" style={{ marginTop: '0.75rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                256-bit SSL encrypted &amp; secure
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ── CHECKOUT PAGE ────────────────────────────────────────────────────
// SVG payment logos
const VisaSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Visa">
    <rect width="38" height="24" rx="4" fill="#1A1F71" />
    <text x="4" y="17" fill="#FFFFFF" fontSize="13" fontFamily="Arial,sans-serif" fontWeight="bold" fontStyle="italic">VISA</text>
  </svg>
);
const McSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Mastercard">
    <rect width="38" height="24" rx="4" fill="#252525" />
    <circle cx="15" cy="12" r="7" fill="#EB001B" />
    <circle cx="23" cy="12" r="7" fill="#F79E1B" />
    <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
  </svg>
);
const RuPaySVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="RuPay">
    <rect width="38" height="24" rx="4" fill="#1B3F77" />
    <text x="4" y="16" fill="#FFFFFF" fontSize="9.5" fontFamily="Arial,sans-serif" fontWeight="bold">RuPay</text>
    <rect x="28" y="9" width="7" height="6" rx="1" fill="#F68B1F" />
  </svg>
);
const UpiSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="UPI">
    <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#E8E8E8" strokeWidth="1" />
    <text x="5" y="16" fill="#097939" fontSize="11" fontFamily="Arial,sans-serif" fontWeight="bold">UPI</text>
    <polygon points="30,4 34,12 30,20 26,12" fill="#F47920" />
    <polygon points="26,4 30,12 26,20 22,12" fill="#097939" />
  </svg>
);
const PayPalSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="PayPal">
    <rect width="38" height="24" rx="4" fill="#003087" />
    <text x="4" y="16" fill="#009CDE" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="bold">Pay</text>
    <text x="17" y="16" fill="#FFFFFF" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="bold">Pal</text>
  </svg>
);
const CodSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" fill="none" role="img" aria-label="Cash on Delivery">
    <rect width="38" height="24" rx="4" fill="#F0FDF4" />
    <rect x="6" y="8" width="26" height="8" rx="2" fill="#16A34A" opacity="0.2" />
    <rect x="10" y="10" width="18" height="4" rx="1" fill="#16A34A" />
    <circle cx="7" cy="12" r="2" fill="#16A34A" />
    <circle cx="31" cy="12" r="2" fill="#16A34A" />
  </svg>
);

function CheckoutPage({ cart, submitCheckout, token, onBack }) {
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [payment, setPayment] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '' });
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi(token);

  const subtotal = cart.reduce((s, i) => {
    const p = i.is_sale && i.sale_price ? i.sale_price : i.price;
    return s + p * i.quantity;
  }, 0);
  const discount = coupon ? (subtotal * coupon.discount_pct / 100) : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    setCouponError('');
    const data = await api.get(`/coupons/${couponCode}`);
    if (data.error) { setCouponError(data.error); setCoupon(null); }
    else { setCoupon(data); showToast(`Coupon applied! ${data.discount_pct}% off`); }
  };

  const handleCheckout = async () => {
    if (!address.street || !address.city || !address.state || !address.zip) { showToast('Please complete all shipping fields.'); return; }
    if (payment === 'credit_card' && (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv)) { showToast('Please complete all card details.'); return; }
    if (payment === 'upi' && !paymentDetails.upiId) { showToast('Please enter your UPI ID.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    await submitCheckout({ shipping_address: address, payment_method: payment, payment_details: paymentDetails, coupon_code: coupon?.code, discount_amount: discount });
    setLoading(false);
  };

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const maskedCard = paymentDetails.cardNumber
    ? fmtCard(paymentDetails.cardNumber).replace(/\d(?=.{5})/g, '•')
    : '•••• •••• •••• ••••';

  const payMethods = [
    { id: 'credit_card', label: 'Card', Logo: () => <span style={{ display: 'flex', gap: '4px' }}><VisaSVG /><McSVG /></span> },
    { id: 'upi', label: 'UPI', Logo: UpiSVG },
    { id: 'paypal', label: 'PayPal', Logo: PayPalSVG },
    { id: 'cod', label: 'Cash', Logo: CodSVG },
  ];

  return (
    <div className="checkout-page">
      <div className="checkout-page-inner">

        {/* ── LEFT COLUMN ── */}
        <div className="checkout-page-left">

          {/* Top breadcrumb + title */}
          <div className="co-page-top">
            <button className="cart-page-continue" onClick={onBack}>← Back to Cart</button>
            <div className="co-page-brand">
              <span className="co-page-logo">MIRU<span>.</span></span>
              <span className="co-page-secure">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                SSL Secured
              </span>
            </div>
            <h1 className="co-page-title">Checkout</h1>
          </div>

          {/* STEP 1 — Shipping */}
          <div className="co-step-card">
            <div className="co-step-header">
              <span className="co-step-num">1</span>
              <div>
                <div className="co-step-title">Shipping Address</div>
                <div className="co-step-sub">Where should we send your order?</div>
              </div>
              <svg className="co-step-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div className="co-step-body">
              <div className="form-field"><label>Street Address</label><input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="123 Main Street, Apt 4B" /></div>
              <div className="form-field"><label>City</label><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Mumbai" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-field" style={{ marginBottom: 0 }}><label>State</label><input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} placeholder="Maharashtra" /></div>
                <div className="form-field" style={{ marginBottom: 0 }}><label>PIN Code</label><input value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} placeholder="400001" /></div>
              </div>
            </div>
          </div>

          {/* STEP 2 — Payment */}
          <div className="co-step-card">
            <div className="co-step-header">
              <span className="co-step-num">2</span>
              <div>
                <div className="co-step-title">Payment</div>
                <div className="co-step-sub">All transactions are encrypted and secure</div>
              </div>
              <svg className="co-step-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <div className="co-step-body">

              {/* Payment method tabs */}
              <div className="pay-method-tabs">
                {payMethods.map(m => (
                  <button
                    key={m.id}
                    className={`pay-tab ${payment === m.id ? 'active' : ''}`}
                    onClick={() => setPayment(m.id)}
                  >
                    <m.Logo />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Credit card */}
              {payment === 'credit_card' && (
                <div className="co-card-area">
                  {/* Visual card */}
                  <div className="cc-preview">
                    <div className="cc-preview-top">
                      <span className="cc-chip">
                        <svg width="28" height="22" viewBox="0 0 28 22" fill="none"><rect width="28" height="22" rx="3" fill="#D4A96A" opacity=".9" /><rect x="2" y="7" width="24" height="8" rx="1" fill="none" stroke="#B8933A" strokeWidth="0.7" /><line x1="14" y1="7" x2="14" y2="15" stroke="#B8933A" strokeWidth="0.7" /><line x1="2" y1="11" x2="26" y2="11" stroke="#B8933A" strokeWidth="0.7" /></svg>
                      </span>
                      <span className="cc-brand-logos"><VisaSVG /></span>
                    </div>
                    <div className="cc-number">{maskedCard}</div>
                    <div className="cc-bottom">
                      <div><div className="cc-label">Card Holder</div><div className="cc-value">YOUR NAME</div></div>
                      <div><div className="cc-label">Expires</div><div className="cc-value">{paymentDetails.expiry || 'MM/YY'}</div></div>
                    </div>
                  </div>

                  {/* Card inputs */}
                  <div className="form-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Card Number</label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      value={fmtCard(paymentDetails.cardNumber)}
                      onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value.replace(/\s/g, '') })}
                      maxLength={19}
                      style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>Expiry Date</label>
                      <input placeholder="MM / YY" value={paymentDetails.expiry} onChange={e => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })} maxLength={7} style={{ fontFamily: "'DM Mono', monospace" }} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>CVV <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>3 digits</span></label>
                      <input placeholder="•••" type="password" value={paymentDetails.cvv} onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} maxLength={4} style={{ fontFamily: "'DM Mono', monospace" }} />
                    </div>
                  </div>
                  <div className="co-accepted-cards">
                    <span>Accepted cards:</span>
                    <VisaSVG /><McSVG /><RuPaySVG />
                  </div>
                </div>
              )}

              {/* UPI */}
              {payment === 'upi' && (
                <div className="co-card-area">
                  <div className="co-upi-header">
                    <UpiSVG />
                    <span>Enter your UPI ID to pay instantly</span>
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label>UPI ID</label>
                    <input placeholder="yourname@upi" value={paymentDetails.upiId} onChange={e => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.5rem' }}>e.g. name@okicici · name@ybl · 9XXXXXXXXX@paytm</p>
                </div>
              )}

              {/* PayPal */}
              {payment === 'paypal' && (
                <div className="co-card-area co-alt-pay">
                  <PayPalSVG />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Pay with PayPal</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>You will be redirected to PayPal to complete your purchase securely.</div>
                  </div>
                </div>
              )}

              {/* COD */}
              {payment === 'cod' && (
                <div className="co-card-area co-alt-pay">
                  <CodSVG />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cash on Delivery</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Pay in cash when your order arrives. Available on orders up to ₹10,000.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="co-trust-row">
            <div className="co-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>256-bit SSL</span>
            </div>
            <div className="co-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              <span>PCI DSS Compliant</span>
            </div>
            <div className="co-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>30-day Returns</span>
            </div>
            <div className="co-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span>Free Shipping</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Order Summary ── */}
        <div className="checkout-page-summary">
          <div className="co-summary-panel">

            {/* Header */}
            <div className="co-summary-panel-head">
              <span>Order Summary</span>
              <span className="co-summary-count">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
            </div>

            {/* Items */}
            <div className="co-summary-items">
              {cart.map((item, n) => {
                const ep = item.is_sale && item.sale_price ? item.sale_price : item.price;
                return (
                  <div key={n} className="co-summary-item">
                    <img src={item.image} alt={item.name} className="co-summary-item-img" />
                    <div className="co-summary-item-info">
                      <div className="co-summary-item-name">{item.name}</div>
                      <div className="co-summary-item-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="co-summary-item-price">₹{(ep * item.quantity).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="co-summary-sep" />

            {/* Coupon */}
            <div className="co-coupon-row" style={{ marginBottom: '0.4rem' }}>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" />
              <button onClick={applyCoupon}>Apply</button>
            </div>
            {couponError && <p className="co-error">{couponError}</p>}
            {coupon && <p className="coupon-success">✓ {coupon.discount_pct}% off applied!</p>}

            <div className="co-summary-sep" />

            {/* Totals */}
            <div className="co-totals">
              <div className="co-total-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="co-total-row co-total-discount"><span>Discount ({coupon.code})</span><span>−₹{discount.toFixed(2)}</span></div>}
              <div className="co-total-row"><span>Shipping</span><span className="co-free-tag">FREE</span></div>
            </div>

            <div className="co-grand-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {/* Pay button */}
            <button
              className="co-pay-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Processing…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  Pay ₹{total.toFixed(2)}
                </span>
              )}
            </button>

            <div className="co-pay-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Your payment info is encrypted &amp; never stored
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── AUTH MODAL ─────────────────────────────────────────────────────

function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);
  const api = useApi(null);
  const submit = async () => {
    setError(''); setLoading(true);
    const body = mode === 'register' ? { name, email, password } : { email, password };
    const data = await api.post(`/auth/${mode}`, body);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    onLogin(data.token, data.user);
    showToast(`Welcome, ${data.user.name}!`);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <p className="modal-sub">{mode === 'login' ? 'Welcome back to MIRU.' : 'Join MIRU to start collecting.'}</p>
        {error && <div className="form-error" style={{ marginBottom: '1rem', padding: '8px', background: '#fdf0ef' }}>{error}</div>}
        {mode === 'register' && <div className="form-field"><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>}
        <div className="form-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" /></div>
        <div className="form-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <div className="modal-switch">{mode === 'login' ? <>No account? <button onClick={() => setMode('register')}>Create one</button></> : <>Already a member? <button onClick={() => setMode('login')}>Sign in</button></>}</div>
      </div>
    </div>
  );
}

// ── CONTACT ────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi(null);
  const submit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    const data = await api.post('/contact', form);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSuccess(data.message);
    setForm({ name: '', email: '', subject: '', message: '' });
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="contact-section">
      <div className="contact-inner">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>We're a small team with strong opinions about beautiful things. Questions, custom orders, collaboration — we'd love to hear from you.</p>
          <div className="contact-detail"><span>Email</span><p>hello@miru.co</p></div>
          <div className="contact-detail"><span>Hours</span><p>Mon–Fri, 9am–6pm</p></div>
          <div className="contact-detail"><span>Response time</span><p>Within 24 hours</p></div>
        </div>
        <div>
          {success && <div className="form-success">{success}</div>}
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div className="form-field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" /></div>
          <div className="form-field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" /></div>
          <div className="form-field"><label>Subject</label><input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="What's this about?" /></div>
          <div className="form-field"><label>Message</label><textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us..." /></div>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
        </div>
      </div>
    </div>
  );
}

// ── NEWSLETTER ─────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const api = useApi(null);
  const subscribe = async () => {
    if (!email) return;
    const data = await api.post('/newsletter', { email });
    if (data.success) { setDone(true); showToast('Subscribed! Thank you.'); }
    else showToast(data.error || 'Already subscribed!');
  };
  return (
    <div className="newsletter-strip">
      <div className="newsletter-inner">
        <h3>Newsletter</h3>
        <p>Sign up for new arrivals and exclusive offers — delivered right to your inbox.</p>
        {done ? <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>Thank you for subscribing! ✓</p> : (
          <div className="newsletter-form">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
            <button onClick={subscribe}>Subscribe</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ACCOUNT DASHBOARD ─────────────────────────────────────────────
function AccountDashboard({ token, user, page, setPage, onUpdate }) {
  if (!user) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-soft)' }}>Please sign in to view your account.</div>;
  const isProfile = page === 'profile';
  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <h3>My Account</h3>
        <nav className="account-nav">
          <button className={!isProfile ? 'active' : ''} onClick={() => setPage('orders')}>Order History</button>
          <button className={isProfile ? 'active' : ''} onClick={() => setPage('profile')}>Profile Details</button>
        </nav>
      </aside>
      <main className="account-content">
        {!isProfile ? <Orders token={token} /> : <Profile token={token} user={user} onUpdate={onUpdate} />}
      </main>
    </div>
  );
}

// ── ORDERS ──────────────────────────────────────────────────────────
const ORDER_STEPS = ['confirmed', 'packed', 'shipped', 'delivered'];
function OrderTimeline({ status }) {
  const idx = ORDER_STEPS.indexOf(status);
  const cancelled = status === 'cancelled';
  return (
    <div className="order-timeline">
      {ORDER_STEPS.map((s, i) => (
        <div key={s} className={`timeline-step ${cancelled ? 'cancelled' : i <= idx ? 'done' : ''}`}>
          <div className="timeline-dot">{cancelled && i === 0 ? '✕' : i < idx ? '✓' : i === idx && !cancelled ? '●' : ''}</div>
          <div className="timeline-label">{s}</div>
          {i < ORDER_STEPS.length - 1 && <div className={`timeline-line ${!cancelled && i < idx ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}
function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi(token);
  const load = () => { setLoading(true); api.get('/orders').then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); }); };
  useEffect(() => { load(); }, []);
  const cancelOrder = async (id) => {
    const data = await api.put(`/orders/${id}/cancel`, {});
    if (data.success) { showToast('Order cancelled'); load(); }
    else showToast(data.error || 'Cannot cancel this order');
  };
  return (
    <div className="orders-section">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Order History</h2>
      {loading ? <p style={{ color: 'var(--ink-soft)' }}>Loading...</p> :
        orders.length === 0 ? <p style={{ color: 'var(--ink-soft)' }}>No orders yet. Start shopping!</p> : orders.map(o => {
          let address = {}, details = {};
          try { address = JSON.parse(o.shipping_address || '{}'); } catch (e) { }
          try { details = JSON.parse(o.payment_details || '{}'); } catch (e) { }
          return (
            <div className="premium-order-card" key={o.id}>
              <div className="premium-order-header">
                <div>
                  <div className="premium-order-id">ORDER #{String(o.id).padStart(5, '0')}</div>
                  <div className="premium-order-date">{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <span className={`premium-order-status ${o.status}`}>{o.status}</span>
              </div>
              <OrderTimeline status={o.status} />
              <div className="premium-order-body">
                <div className="premium-order-items">
                  <div className="premium-order-label">Items</div>
                  {o.items.map((i, n) => <div className="premium-order-item" key={n}><span>{i.quantity} × {i.name}</span></div>)}
                </div>
                <div className="premium-order-details">
                  <div className="premium-order-label">Details</div>
                  {o.payment_method && <div style={{ marginBottom: '0.5rem' }}><strong>Payment:</strong> {o.payment_method.replace('_', ' ').toUpperCase()}{o.payment_method === 'credit_card' && details.cardNumber ? ` (ending ${details.cardNumber.slice(-4)})` : ''}{o.payment_method === 'upi' && details.upiId ? ` (${details.upiId})` : ''}</div>}
                  {o.discount_amount > 0 && <div style={{ color: 'var(--green)', marginBottom: '0.5rem' }}><strong>Discount:</strong> -₹{parseFloat(o.discount_amount).toFixed(2)}</div>}
                  {address.street && <div><strong>Ship to:</strong><br />{address.street}, {address.city} {address.zip}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="premium-order-total">Total: ₹{parseFloat(o.total).toFixed(2)}</div>
                {['confirmed', 'packed'].includes(o.status) && (
                  <button onClick={() => cancelOrder(o.id)} style={{ fontSize: '0.72rem', padding: '6px 14px', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', borderRadius: '4px' }}>Cancel Order</button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ── PROFILE ────────────────────────────────────────────────────────
function Profile({ token, user, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const api = useApi(token);
  const save = async () => {
    setLoading(true);
    const data = await api.put('/auth/profile', { name });
    setLoading(false);
    if (data.token) { onUpdate(data.token, data.user); showToast('Profile updated!'); }
    else showToast(data.error || 'Error updating profile');
  };
  const changePw = async () => {
    if (!curPw || !newPw) { showToast('Please fill both password fields'); return; }
    setPwLoading(true);
    const data = await api.put('/auth/password', { currentPassword: curPw, newPassword: newPw });
    setPwLoading(false);
    if (data.success) { showToast('Password changed!'); setCurPw(''); setNewPw(''); }
    else showToast(data.error || 'Error changing password');
  };
  return (
    <div className="profile-section">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Profile Details</h2>
      <div className="settings-card">
        <div className="settings-header">
          <div className="settings-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{user?.name}</div>
            <div style={{ color: 'var(--ink-soft)' }}>Member</div>
          </div>
        </div>
        <div className="form-field"><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="form-field"><label>Email</label><input value={user?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>{loading ? 'Saving...' : 'Save Profile'}</button>
      </div>
      <div className="settings-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Change Password</div>
        <div className="form-field"><label>Current Password</label><input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="••••••••" /></div>
        <div className="form-field"><label>New Password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" /></div>
        <button className="btn btn-outline" onClick={changePw} disabled={pwLoading} style={{ marginTop: '1rem', width: '100%' }}>{pwLoading ? 'Updating...' : 'Update Password'}</button>
      </div>
    </div>
  );
}

// ── ADMIN PANEL ────────────────────────────────────────────────────
function AdminPanel({ token }) {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const api = useApi(token);
  useEffect(() => { api.get('/admin/stats').then(d => { if (!d.error) setStats(d); }); }, []);
  const updateStatus = async (orderId, status) => {
    await api.put(`/admin/orders/${orderId}/status`, { status });
    api.get('/admin/stats').then(d => { if (!d.error) setStats(d); });
    showToast('Order status updated!');
  };
  if (!stats) return <div style={{ padding: '4rem', textAlign: 'center' }}><p>Loading admin panel...</p></div>;
  return (
    <div className="admin-section">
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Admin Dashboard</h2>
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        {['overview', 'products', 'messages', 'newsletter'].map(t => <button key={t} className={tab === t ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>)}
      </div>
      {tab === 'overview' && (
        <>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-val">₹{parseFloat(stats.totalRevenue).toFixed(0)}</div><div className="stat-label">Revenue</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalOrders}</div><div className="stat-label">Orders</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalUsers}</div><div className="stat-label">Users</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalProducts}</div><div className="stat-label">Products</div></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Orders</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {stats.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--gold)' }}>#{String(o.id).padStart(5, '0')}</td>
                    <td>{o.user_name}<br /><span style={{ color: 'var(--ink-soft)', fontSize: '0.7rem' }}>{o.user_email}</span></td>
                    <td>{o.items.slice(0, 2).map(i => i.name).join(', ')}{o.items.length > 2 ? '...' : ''}</td>
                    <td>₹{parseFloat(o.total).toFixed(2)}</td>
                    <td>{o.payment_method}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <select className="status-select" value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                        {['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'products' && <AdminProducts api={api} />}
      {tab === 'messages' && <AdminMessages api={api} />}
      {tab === 'newsletter' && <AdminNewsletter api={api} />}
    </div>
  );
}

function AdminProducts({ api }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const CATS = ['Accessories', 'Home', 'Kitchen', 'Apparel', 'Furniture', 'Workspace', 'Tech', 'Wellness'];
  const blank = { name: '', description: '', price: '', image: '', category: 'Accessories', stock: 100, is_new: false, is_sale: false, sale_price: '' };
  const [form, setForm] = useState(blank);
  const load = () => api.get('/admin/products').then(d => setProducts(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);
  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, is_new: !!p.is_new, is_sale: !!p.is_sale, sale_price: p.sale_price || '' }); setEditing(p.id); };
  const save = async () => {
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), sale_price: form.sale_price ? parseFloat(form.sale_price) : null };
    const r = editing === 'new' ? await api.post('/admin/products', payload) : await api.put(`/admin/products/${editing}`, payload);
    if (r.error) { showToast(r.error); return; }
    showToast(editing === 'new' ? 'Product added!' : 'Product updated!'); setEditing(null); load();
  };
  const del = async (id) => { if (!confirm('Delete this product?')) return; await api.del(`/admin/products/${id}`); showToast('Deleted'); load(); };
  return (
    <div style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem' }}>Products</h3>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Product</button>
      </div>
      {editing && (
        <div className="settings-card" style={{ marginBottom: '2rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{editing === 'new' ? 'New Product' : 'Edit Product'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[['Name', 'name'], ['Price (₹)', 'price', 'number'], ['Stock', 'stock', 'number'], ['Image URL', 'image'], ['Sale Price (optional)', 'sale_price', 'number']].map(([lbl, k, t = 'text']) => (
              <div className="form-field" key={k}><label>{lbl}</label><input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div className="form-field"><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div className="form-field"><label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', background: 'var(--bg)', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} /></div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <label><input type="checkbox" checked={form.is_new} onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} /> New</label>
            <label><input type="checkbox" checked={form.is_sale} onChange={e => setForm(f => ({ ...f, is_sale: e.target.checked }))} /> On Sale</label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--gold)' }}>#{p.id}</td><td>{p.name}</td><td>{p.category}</td>
                <td>₹{p.price}</td>
                <td style={{ color: p.stock === 0 ? 'var(--red)' : p.stock <= 5 ? 'orange' : 'inherit' }}>{p.stock}</td>
                <td>{p.is_new ? '🆕' : ''}{p.is_sale ? '🏷️' : ''}</td>
                <td>
                  <button onClick={() => openEdit(p)} style={{ marginRight: '0.5rem', fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '3px' }}>Edit</button>
                  <button onClick={() => del(p.id)} style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', borderRadius: '3px' }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMessages({ api }) {
  const [msgs, setMsgs] = useState([]);
  useEffect(() => { api.get('/admin/messages').then(d => setMsgs(Array.isArray(d) ? d : [])); }, []);
  return (
    <div style={{ marginTop: '3rem' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Contact Messages ({msgs.length})</h3>
      {msgs.length === 0 ? <p style={{ color: 'var(--ink-soft)' }}>No messages yet.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {msgs.map(m => (
            <div key={m.id} className="settings-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.4rem' }}>
                <div style={{ fontWeight: 600 }}>{m.name} <span style={{ color: 'var(--ink-soft)', fontWeight: 400, fontSize: '0.8rem' }}>({m.email})</span></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
              {m.subject && <div style={{ fontSize: '0.78rem', color: 'var(--gold)', marginBottom: '0.35rem' }}>{m.subject}</div>}
              <div style={{ fontSize: '0.82rem' }}>{m.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminNewsletter({ api }) {
  const [subs, setSubs] = useState([]);
  useEffect(() => { api.get('/admin/newsletter').then(d => setSubs(Array.isArray(d) ? d : [])); }, []);
  return (
    <div style={{ marginTop: '3rem' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Newsletter Subscribers ({subs.length})</h3>
      {subs.length === 0 ? <p style={{ color: 'var(--ink-soft)' }}>No subscribers yet.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead><tr><th>#</th><th>Email</th><th>Subscribed</th></tr></thead>
            <tbody>{subs.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.email}</td><td>{new Date(s.created_at).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CHAT WIDGET ────────────────────────────────────────────────────
const BOT_REPLIES = {
  'hello': "Hi! Welcome to MIRU. How can I help you today?",
  'hi': "Hello! Thanks for reaching out. What can I do for you?",
  'hey': "Hey there! How can I assist you with your shopping?",
  'order': "You can track your orders in the Orders page. Need help with a specific order?",
  'track': "To track your order, sign in and go to the Orders page. We'll show you the latest status!",
  'return': "We accept returns within 30 days of delivery. Email hello@miru.co to start the process.",
  'refund': "Refunds are processed within 5-7 business days after we receive your return. Email us for details.",
  'shipping': "We ship worldwide! Standard shipping takes 5-7 business days. Express shipping is available for faster delivery.",
  'delivery': "Delivery times vary by location. Standard: 5-7 days, Express: 2-3 days. Check your order status for updates.",
  'payment': "We accept Credit Card, UPI, PayPal, and Cash on Delivery. All payments are secure.",
  'coupon': "Try codes MIRU10, SAVE20, or FIRST50 for discounts! Apply them at checkout.",
  'discount': "Check out our coupon codes: MIRU10 (10% off), SAVE20 (20% off), FIRST50 (50% off first order).",
  'contact': "You can reach us at hello@miru.co or through the Contact page. We're here Mon–Fri, 9am–6pm.",
  'help': "I'm here to help! Ask about orders, shipping, payments, returns, or anything else.",
  'product': "Browse our amazing collection of furniture, decor, lighting, and more on the Shop page!",
  'price': "Prices vary by product. Check individual product pages for current pricing and any sales.",
  'sale': "We have great sales! Look for the 'Sale' badge on products. Use coupon SAVE20 for extra savings.",
  'warranty': "All our products come with a 1-year warranty. Contact us if you have any issues.",
  'size': "Product dimensions are listed on each product page. If you need help choosing, email us!",
  'custom': "For custom orders or special requests, please email hello@miru.co with details.",
  'support': "Our support team is here to help! Email hello@miru.co or use this chat.",
  'thank': "You're welcome! Happy shopping at MIRU. 😊",
  'bye': "Goodbye! Come back soon. Have a great day!",
  'default': "Thanks for your message! Our team will get back to you within 24 hours. You can also email hello@miru.co."
};
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(JSON.parse(localStorage.getItem('miru_chat_messages') || '[{"type":"bot","text":"👋 Hi! I\'m MIRU\'s assistant. Ask about orders, shipping, returns, or payments!"}]'));
  const [input, setInput] = useState('');
  const send = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input };
    const key = Object.keys(BOT_REPLIES).find(k => new RegExp('\\b' + k + '\\b', 'i').test(input)) || 'default';
    const botMsg = { type: 'bot', text: BOT_REPLIES[key] };
    const newMessages = [...messages, userMsg, botMsg];
    setMessages(newMessages);
    localStorage.setItem('miru_chat_messages', JSON.stringify(newMessages));
    setInput('');
  };
  const clearChat = () => {
    const initial = [{ type: 'bot', text: '👋 Hi! I\'m MIRU\'s assistant. Ask about orders, shipping, returns, or payments!' }];
    setMessages(initial);
    localStorage.setItem('miru_chat_messages', JSON.stringify(initial));
  };
  return (
    <div className="chat-bubble">
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <h4>MIRU Support</h4>
            <div>
              <button onClick={clearChat} style={{ background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', fontSize: '1rem', marginRight: '0.5rem' }}>🗑️</button>
              <button onClick={() => setOpen(false)}>×</button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => <div key={i} className={`chat-msg ${m.type}`}>{m.text}</div>)}
          </div>
          <div className="chat-input-row">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask something..." onKeyDown={e => e.key === 'Enter' && send()} />
            <button onClick={send}>→</button>
          </div>
        </div>
      )}
      <button className="chat-btn" onClick={() => setOpen(o => !o)}>💬</button>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────
function App() {
  const [token, setToken] = useState(localStorage.getItem('miru_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('miru_user') || 'null'));
  const [theme, setTheme] = useState(localStorage.getItem('miru_theme') || 'light');
  const [cart, setCart] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [page, setPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishIds, setWishIds] = useState(new Set());
  const api = useApi(token);
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    if (authOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [authOpen]);

  const loadCart = useCallback(async () => {
    if (!token) { setCart([]); return; }
    const data = await api.get('/cart');
    setCart(Array.isArray(data) ? data : []);
  }, [token]);
  useEffect(() => { loadCart(); }, [loadCart]);

  const loadWishlist = useCallback(async () => {
    if (!token) { setWishIds(new Set()); return; }
    const data = await api.get('/wishlist');
    setWishIds(new Set(Array.isArray(data) ? data.map(i => i.id) : []));
  }, [token]);
  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const toggleWishlist = async (productId) => {
    if (!token) { setAuthOpen(true); return; }
    if (wishIds.has(productId)) {
      await api.del(`/wishlist/${productId}`);
      setWishIds(s => { const n = new Set(s); n.delete(productId); return n; });
      showToast('Removed from wishlist');
    } else {
      await api.post('/wishlist', { product_id: productId });
      setWishIds(s => new Set([...s, productId]));
      showToast('Added to wishlist ♥');
    }
  };

  const handleLogin = (tok, usr) => {
    setToken(tok); setUser(usr);
    localStorage.setItem('miru_token', tok);
    localStorage.setItem('miru_user', JSON.stringify(usr));
  };
  const handleLogout = () => {
    setToken(null); setUser(null); setCart([]); setWishIds(new Set());
    localStorage.removeItem('miru_token'); localStorage.removeItem('miru_user');
    showToast('Signed out'); setPage('home');
  };
  const addToCart = async (productId) => {
    await api.post('/cart', { product_id: productId });
    await loadCart();
  };
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); localStorage.setItem('miru_theme', next);
  };
  const submitCheckoutFinal = async (checkoutData) => {
    const data = await api.post('/orders', checkoutData);
    if (data.error) { showToast('Error: ' + data.error); return; }
    setCart([]);
    showToast(`Order #${String(data.orderId).padStart(5, '0')} confirmed! ₹${data.total.toFixed(2)}`);
    setPage('orders');
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <Nav user={user} cartCount={cartCount} onCartOpen={() => setPage('cart')} onAuthOpen={() => setAuthOpen(true)} onLogout={handleLogout} page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} isAdmin={isAdmin} />

      {page === 'home' && <>
        <Hero onShop={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
        <CategoryShowcase onCategorySelect={(cat) => { setSelectedCategory(cat); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }} />
        <Products token={token} onAddToCart={addToCart} onAuthRequired={() => setAuthOpen(true)} wishIds={wishIds} onWishToggle={toggleWishlist} activeCategory={selectedCategory} setActiveCategory={setSelectedCategory} />
        <Newsletter />
        <Contact />
      </>}
      {page === 'contact' && <Contact />}
      {page === 'wishlist' && <WishlistPage token={token} onAddToCart={addToCart} onWishToggle={toggleWishlist} wishIds={wishIds} />}
      {(page === 'orders' || page === 'profile') && <AccountDashboard token={token} user={user} page={page} setPage={setPage} onUpdate={handleLogin} />}
      {page === 'admin' && (isAdmin ? <AdminPanel token={token} /> : <div style={{ padding: '4rem', textAlign: 'center' }}><p style={{ color: 'var(--ink-soft)' }}>Access denied.</p></div>)}
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
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', maxWidth: '220px', lineHeight: 1.6, marginTop: '0.5rem' }}>Curated objects for a considered life. Quality over quantity, always.</p>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Shop</div>
              <a onClick={() => setPage('home')}>All Products</a>
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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={handleLogin} />}
      <ChatWidget />
      <ScrollToTopFAB />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);