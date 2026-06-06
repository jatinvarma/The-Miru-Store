import React, { useState, useEffect, useCallback } from 'react';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import Stars from './Stars';
import SkeletonCard from './SkeletonCard';
import ProductDetailModal from './ProductDetailModal';
import { showToast } from '../utils/toast';

export default function Products({ token, cart, onAddToCart, onUpdateCartQty, onAuthRequired, wishIds, onWishToggle, activeCategory, setActiveCategory }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('default');
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState(null);
  const api = useApi(token);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await api.get(`/products?search=${encodeURIComponent(search)}`);
      setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const cats = ['All', 'Accessories', 'Home', 'Kitchen', 'Apparel', 'Furniture', 'Workspace', 'Tech', 'Wellness'];

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      category: activeCategory,
      search: debouncedSearch,
      sort,
      maxPrice
    }).toString();
    const data = await api.get(`/products?${params}`);
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [activeCategory, debouncedSearch, sort, maxPrice]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (p) => {
    if (!token) { onAuthRequired(); return; }
    await onAddToCart(p.id);
    showToast(`${p.name} added to cart!`);
  };

  const handleQtyChange = async (e, p, newQty) => {
    e.stopPropagation();
    if (!token) { onAuthRequired(); return; }
    await onUpdateCartQty(p.id, newQty);
  };

  // Keep detail modal updated if product stock/status changes
  const handleProductModalClick = (p) => {
    setDetailProduct(p);
  };

  return (
    <div className="section" id="shop">
      <div className="section-header">
        <h2>Products</h2>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{products.length} items</span>
      </div>
      <div className="sticky-filters">
        {/* Row 1: Search + Sort */}
        <div className="filter-top-row">
          <div
            className="search-bar-wrapper"
            onMouseLeave={() => setShowSuggestions(false)}
          >
            <span className="search-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="search-input-field"
              placeholder="Search products…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {search && (
              <button className="search-clear-btn" onClick={() => { setSearch(''); setSuggestions([]); }}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    className="suggestion-item"
                    onClick={() => {
                      setDetailProduct(s);
                      setShowSuggestions(false);
                      setSearch('');
                    }}
                  >
                    <img src={s.image} alt={s.name} className="suggestion-thumb" />
                    <div className="suggestion-info">
                      <div className="suggestion-name">{s.name}</div>
                      <div className="suggestion-cat-price">{s.category} · ₹{s.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="filter-sort-group">
            <label className="filter-sort-label">Sort</label>
            <select className="filter-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="default">Featured</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
          <button
            className="filter-categories-btn"
            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
            title="Browse Categories"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Categories
          </button>
        </div>

        {/* Row 2: Category pills + Price range */}
        <div className="filter-bottom-row">
          <div className="filters">
            {cats.map(c => (
              <button
                key={c}
                className={`filter-btn ${activeCategory === c ? 'active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="price-range-wrap">
            <span className="price-range-label">Max</span>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
            />
            <span className="price-range-value">₹{Number(maxPrice).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : products.map(p => {
          const cartItem = cart?.find(item => item.product_id === p.id);
          const cartQty = cartItem ? cartItem.quantity : 0;
          return (
            <div className="product-card fade-in" key={p.id} onClick={() => setDetailProduct(p)}>
              <div className="product-img">
                <img src={p.image} alt={p.name} loading="lazy" />
                <div className="badge-wrap">
                  {p.is_new === 1 && <span className="badge badge-new">New</span>}
                  {p.is_sale === 1 && <span className="badge badge-sale">Sale</span>}
                  {p.stock === 0 && <span className="badge badge-low">Out of Stock</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="badge badge-low">Low Stock</span>}
                </div>
                {token && (
                  <button
                    className="wish-btn"
                    onClick={e => { e.stopPropagation(); onWishToggle(p.id); }}
                  >
                    {wishIds && wishIds.has(p.id) ? '♥' : '♡'}
                  </button>
                )}
                <div className="product-overlay">
                  {p.stock > 0 ? (
                    cartQty > 0 ? (
                      <div className="golden-qty-stepper" onClick={e => e.stopPropagation()}>
                        <button onClick={e => handleQtyChange(e, p, cartQty - 1)} title="Decrease quantity">
                          {cartQty === 1 ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </button>
                        <span className="qty-val">{cartQty}</span>
                        <button onClick={e => handleQtyChange(e, p, cartQty + 1)} title="Increase quantity">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--cream)', color: 'var(--ink)' }}
                        onClick={e => { e.stopPropagation(); handleAdd(p); }}
                      >
                        Add to Cart
                      </button>
                    )
                  ) : (
                    <span className="btn btn-sm" style={{ background: '#888', color: '#fff', cursor: 'not-allowed', opacity: 0.8 }}>
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              <div className="product-info">
                <div className="product-category">{p.category}</div>
                <div className="product-name">{p.name}</div>
                <Stars rating={p.avg_rating || 0} count={p.review_count || 0} />
                <div className="product-footer" style={{ marginTop: '0.75rem' }}>
                  <span className="product-price">
                    {p.is_sale && p.sale_price ? (
                      <>
                        <span style={{ textDecoration: 'line-through', fontSize: '1rem', color: 'var(--ink-soft)', marginRight: '6px' }}>
                          ₹{p.price.toFixed(2)}
                        </span>
                        ₹{p.sale_price.toFixed(2)}
                      </>
                    ) : (
                      `₹${p.price.toFixed(2)}`
                    )}
                  </span>
                  {cartQty > 0 ? (
                    <span
                      className="add-btn"
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        padding: '2px',
                        cursor: 'default'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {cartQty}
                    </span>
                  ) : (
                    <button
                      className="add-btn"
                      disabled={p.stock <= 0}
                      style={{ opacity: p.stock <= 0 ? 0.35 : 1, cursor: p.stock <= 0 ? 'not-allowed' : 'pointer' }}
                      onClick={e => { e.stopPropagation(); if (p.stock > 0) handleAdd(p); }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onAddToCart={onAddToCart}
          onUpdateCartQty={onUpdateCartQty}
          cart={cart}
          token={token}
          wishIds={wishIds || new Set()}
          onWishToggle={onWishToggle}
          onProductClick={handleProductModalClick}
        />
      )}
    </div>
  );
}
