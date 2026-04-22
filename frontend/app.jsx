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
      return (
        <nav>
          <a className="nav-logo" onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>MIRU<span>.</span></a>
          <div className="nav-links">
            <label className="theme-switch" aria-label="Toggle dark mode">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <div className="slider">
                <span className="icon sun">☀️</span>
                <span className="icon moon">🌙</span>
                <div className="thumb" />
              </div>
            </label>
            <a onClick={() => setPage('home')}>Shop</a>
            <a onClick={() => setPage('contact')}>Contact</a>
            {user && <>
              <a onClick={() => setPage('orders')}>Orders</a>
              <a onClick={() => setPage('profile')}>Profile</a>
              {isAdmin && <a onClick={() => setPage('admin')} style={{ color: 'var(--gold)' }}>Admin</a>}
              <a onClick={onLogout}>Sign out</a>
            </>}
            {!user && <a onClick={onAuthOpen}>Sign in</a>}
            <button className="cart-btn" onClick={onCartOpen}>Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button>
          </div>
        </nav>
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
                    {p.stock <= 5 && p.stock > 0 && <span className="badge badge-low">Low Stock</span>}
                  </div>
                  {token && <button className="wish-btn" onClick={e => { e.stopPropagation(); onWishToggle(p.id); }}>{wishIds && wishIds.has(p.id) ? '♥' : '♡'}</button>}
                  <div className="product-overlay">
                    <button className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--ink)' }} onClick={e => { e.stopPropagation(); handleAdd(p); }}>Add to Cart</button>
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
                    <button className="add-btn" onClick={e => { e.stopPropagation(); handleAdd(p); }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {detailProduct && <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} onAddToCart={onAddToCart} token={token} wishIds={wishIds || new Set()} onWishToggle={onWishToggle} onProductClick={setDetailProduct} />}
        </div>
      );
    }

    // ── CART DRAWER ────────────────────────────────────────────────────
    function CartDrawer({ open, onClose, token, cart, onCartChange, onCheckout }) {
      const api = useApi(token);

      useEffect(() => {
        if (open) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
      }, [open]);

      const updateQty = async (item, delta) => { await api.put(`/cart/${item.id}`, { quantity: item.quantity + delta }); onCartChange(); };
      const remove = async (item) => { await api.del(`/cart/${item.id}`); onCartChange(); showToast('Item removed'); };
      const total = cart.reduce((s, i) => {
        const p = i.is_sale && i.sale_price ? i.sale_price : i.price;
        return s + p * i.quantity;
      }, 0);
      return (
        <>
          <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
          <div className={`cart-drawer ${open ? 'open' : ''}`}>
            <div className="drawer-header">
              <h3>Your Cart</h3>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="drawer-items">
              {cart.length === 0 ? (
                <div className="empty-cart"><p style={{ fontSize: '2rem', marginBottom: '1rem' }}>∅</p><p>Your cart is empty.<br />Add some items.</p></div>
              ) : cart.map(item => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">₹{(item.is_sale && item.sale_price ? item.sale_price : item.price).toFixed(2)}</div>
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => updateQty(item, -1)}>−</button>
                      <span className="qty-num">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQty(item, 1)}>+</button>
                      <button className="remove-btn" onClick={() => remove(item)}>remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="cart-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCheckout}>Proceed to Checkout</button>
              </div>
            )}
          </div>
        </>
      );
    }

    // ── CHECKOUT MODAL ─────────────────────────────────────────────────
    function CheckoutModal({ open, onClose, cart, submitCheckout, token }) {
      const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
      const [payment, setPayment] = useState('credit_card');
      const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '' });
      const [couponCode, setCouponCode] = useState('');
      const [coupon, setCoupon] = useState(null);
      const [couponError, setCouponError] = useState('');
      const [loading, setLoading] = useState(false);
      const api = useApi(token);

      useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
      }, [open]);

      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const discount = coupon ? (subtotal * coupon.discount_pct / 100) : 0;
      const total = subtotal - discount;
      if (!open) return null;
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
        await new Promise(r => setTimeout(r, 1200));
        await submitCheckout({ shipping_address: address, payment_method: payment, payment_details: paymentDetails, coupon_code: coupon?.code, discount_amount: discount });
        setLoading(false);
      };
      return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
          <div className="checkout-modal">
            <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>×</button>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Checkout</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>Secure checkout</p>
            <div className="order-summary-box">
              {cart.map((i, n) => <div key={n} className="order-summary-row"><span>{i.name} × {i.quantity}</span><span>₹{(i.price * i.quantity).toFixed(2)}</span></div>)}
              {discount > 0 && <div className="discount-row"><span>Coupon ({coupon.code})</span><span>-₹{discount.toFixed(2)}</span></div>}
              <div className="order-summary-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div className="coupon-row">
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON CODE" />
              <button onClick={applyCoupon}>Apply</button>
            </div>
            {couponError && <p style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '0.4rem' }}>{couponError}</p>}
            {coupon && <p className="coupon-success">✓ {coupon.discount_pct}% off applied!</p>}
            <div className="checkout-split">
              <div className="checkout-section">
                <h4>Shipping Address</h4>
                <div className="form-field"><label>Street</label><input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="123 Main St" /></div>
                <div className="form-field"><label>City</label><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Mumbai" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-field"><label>State</label><input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} placeholder="MH" /></div>
                  <div className="form-field"><label>PIN</label><input value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} placeholder="400001" /></div>
                </div>
              </div>
              <div className="checkout-section">
                <h4>Payment Method</h4>
                <div className="radio-group">
                  <label className={`radio-label ${payment === 'credit_card' ? 'selected' : ''}`}><input type="radio" className="radio-input" name="payment" checked={payment === 'credit_card'} onChange={() => setPayment('credit_card')} />Credit Card</label>
                  {payment === 'credit_card' && (
                    <div style={{ padding: '1rem', background: 'var(--bg2)', marginTop: '-0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input style={{ padding: '0.65rem', border: '1px solid var(--border)', background: 'transparent', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', outline: 'none' }} placeholder="Card Number" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input style={{ padding: '0.65rem', border: '1px solid var(--border)', background: 'transparent', width: '50%', boxSizing: 'border-box', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', outline: 'none' }} placeholder="MM/YY" value={paymentDetails.expiry} onChange={e => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })} />
                        <input style={{ padding: '0.65rem', border: '1px solid var(--border)', background: 'transparent', width: '50%', boxSizing: 'border-box', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', outline: 'none' }} placeholder="CVV" value={paymentDetails.cvv} onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} />
                      </div>
                    </div>
                  )}
                  <label className={`radio-label ${payment === 'upi' ? 'selected' : ''}`}><input type="radio" className="radio-input" name="payment" checked={payment === 'upi'} onChange={() => setPayment('upi')} />UPI (India)</label>
                  {payment === 'upi' && (
                    <div style={{ padding: '1rem', background: 'var(--bg2)', marginTop: '-0.5rem' }}>
                      <input style={{ padding: '0.65rem', border: '1px solid var(--border)', background: 'transparent', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', outline: 'none' }} placeholder="UPI ID (e.g. name@bank)" value={paymentDetails.upiId} onChange={e => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} />
                    </div>
                  )}
                  <label className={`radio-label ${payment === 'paypal' ? 'selected' : ''}`}><input type="radio" className="radio-input" name="payment" checked={payment === 'paypal'} onChange={() => setPayment('paypal')} />PayPal</label>
                  <label className={`radio-label ${payment === 'cod' ? 'selected' : ''}`}><input type="radio" className="radio-input" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} />Cash on Delivery</label>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1rem' }} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
            </button>
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
    function Orders({ token }) {
      const [orders, setOrders] = useState([]);
      const api = useApi(token);
      useEffect(() => { api.get('/orders').then(d => setOrders(Array.isArray(d) ? d : [])); }, []);
      return (
        <div className="orders-section">
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', fontFamily: "'Inter', sans-serif" }}>Order History</h2>
          {orders.length === 0 ? <p style={{ color: 'var(--ink-soft)' }}>No orders yet. Start shopping!</p> : orders.map(o => {
            let address = {}, details = {};
            try { address = JSON.parse(o.shipping_address || '{}') } catch (e) { }
            try { details = JSON.parse(o.payment_details || '{}') } catch (e) { }
            return (
              <div className="premium-order-card" key={o.id}>
                <div className="premium-order-header">
                  <div>
                    <div className="premium-order-id">ORDER #{String(o.id).padStart(5, '0')}</div>
                    <div className="premium-order-date">{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <span className={`premium-order-status ${o.status}`}>{o.status}</span>
                </div>
                <div className="premium-order-body">
                  <div className="premium-order-items">
                    <div className="premium-order-label">Items</div>
                    {o.items.map((i, n) => <div className="premium-order-item" key={n}><span>{i.quantity} × {i.name}</span></div>)}
                  </div>
                  <div className="premium-order-details">
                    <div className="premium-order-label">Details</div>
                    {o.payment_method && <div style={{ marginBottom: '0.5rem' }}><strong>Payment:</strong> {o.payment_method.replace('_', ' ').toUpperCase()}
                      {o.payment_method === 'credit_card' && details.cardNumber ? ` (ending ${details.cardNumber.slice(-4)})` : ''}{o.payment_method === 'upi' && details.upiId ? ` (${details.upiId})` : ''}</div>}
                    {o.discount_amount > 0 && <div style={{ color: 'var(--green)', marginBottom: '0.5rem' }}><strong>Discount:</strong> -₹{parseFloat(o.discount_amount).toFixed(2)}</div>}
                    {address.street && <div><strong>Ship to:</strong><br />{address.street}, {address.city} {address.zip}</div>}
                  </div>
                </div>
                <div className="premium-order-total">Total: ₹{parseFloat(o.total).toFixed(2)}</div>
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
      const api = useApi(token);
      const save = async () => {
        setLoading(true);
        const data = await api.put('/auth/profile', { name });
        setLoading(false);
        if (data.token) { onUpdate(data.token, data.user); showToast('Profile updated!'); }
        else showToast(data.error || 'Error updating profile');
      };
      return (
        <div className="profile-section">
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', fontFamily: "'Inter', sans-serif" }}>Profile Details</h2>
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
        </div>
      );
    }

    // ── ADMIN PANEL ────────────────────────────────────────────────────
    function AdminPanel({ token }) {
      const [stats, setStats] = useState(null);
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
      const [cartOpen, setCartOpen] = useState(false);
      const [authOpen, setAuthOpen] = useState(false);
      const [page, setPage] = useState('home');
      const [checkoutMode, setCheckoutMode] = useState(false);
      const [selectedCategory, setSelectedCategory] = useState('All');
      const [wishIds, setWishIds] = useState(new Set());
      const api = useApi(token);
      const isAdmin = user?.email === ADMIN_EMAIL;

      useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
      useEffect(() => {
        if (cartOpen || checkoutMode || authOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
      }, [cartOpen, checkoutMode, authOpen]);

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
        setCartOpen(true);
      };
      const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next); localStorage.setItem('miru_theme', next);
      };
      const submitCheckoutFinal = async (checkoutData) => {
        const data = await api.post('/orders', checkoutData);
        if (data.error) { showToast('Error: ' + data.error); return; }
        setCart([]); setCheckoutMode(false);
        showToast(`Order #${String(data.orderId).padStart(5, '0')} confirmed! ₹${data.total.toFixed(2)}`);
        setPage('orders');
      };

      const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

      return (
        <>
          <Nav user={user} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} onAuthOpen={() => setAuthOpen(true)} onLogout={handleLogout} page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} isAdmin={isAdmin} />

          {page === 'home' && <>
            <Hero onShop={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
            <CategoryShowcase onCategorySelect={(cat) => { setSelectedCategory(cat); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }} />
            <Products token={token} onAddToCart={addToCart} onAuthRequired={() => setAuthOpen(true)} wishIds={wishIds} onWishToggle={toggleWishlist} activeCategory={selectedCategory} setActiveCategory={setSelectedCategory} />
            <Newsletter />
            <Contact />
          </>}
          {page === 'contact' && <Contact />}
          {(page === 'orders' || page === 'profile') && <AccountDashboard token={token} user={user} page={page} setPage={setPage} onUpdate={handleLogin} />}
          {page === 'admin' && (isAdmin ? <AdminPanel token={token} /> : <div style={{ padding: '4rem', textAlign: 'center' }}><p style={{ color: 'var(--ink-soft)' }}>Access denied.</p></div>)}

          <footer>
            <div className="footer-inner">
              <div className="footer-logo">MIRU<span>.</span></div>
              <div className="footer-copy">© 2026 MIRU</div>
            </div>
          </footer>

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} token={token} cart={cart} onCartChange={loadCart} onCheckout={() => { setCheckoutMode(true); setCartOpen(false); }} />
          <CheckoutModal open={checkoutMode} onClose={() => setCheckoutMode(false)} cart={cart} submitCheckout={submitCheckoutFinal} token={token} />
          {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={handleLogin} />}
          <ChatWidget />
          <ScrollToTopFAB />
        </>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);