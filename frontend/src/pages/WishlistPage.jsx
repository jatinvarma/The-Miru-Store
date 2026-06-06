import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import SkeletonCard from '../components/SkeletonCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { showToast } from '../utils/toast';

export default function WishlistPage({ token, cart, onAddToCart, onUpdateCartQty, onWishToggle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState(null);
  const api = useApi(token);

  const load = () => {
    setLoading(true);
    api.get('/wishlist').then(d => {
      setItems(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (productId) => {
    await api.del(`/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.id !== productId));
    onWishToggle(productId); // sync with app state
    showToast('Removed from wishlist');
  };

  const handleAdd = async (p) => {
    await onAddToCart(p.id);
    showToast(`${p.name} added to cart!`);
  };

  const handleQtyChange = async (e, p, newQty) => {
    e.stopPropagation();
    await onUpdateCartQty(p.id, newQty);
  };

  return (
    <div className="section fade-in">
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
            const cartItem = cart?.find(item => item.product_id === p.id);
            const cartQty = cartItem ? cartItem.quantity : 0;
            return (
              <div className="product-card fade-in" key={p.id} onClick={() => setDetailProduct(p)}>
                <div className="product-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div className="badge-wrap">
                    {p.is_new === 1 && <span className="badge badge-new">New</span>}
                    {p.is_sale === 1 && <span className="badge badge-sale">Sale</span>}
                    {p.stock <= 0 && <span className="badge badge-low">Out of Stock</span>}
                  </div>
                  <button className="wish-btn" style={{ color: 'var(--red)' }} onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}>♥</button>
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
                        `₹${ep.toFixed(2)}`
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
                        onClick={(e) => { e.stopPropagation(); if (p.stock > 0) handleAdd(p); }}
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
      )}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onAddToCart={onAddToCart}
          onUpdateCartQty={onUpdateCartQty}
          cart={cart}
          token={token}
          wishIds={new Set(items.map(i => i.id))}
          onWishToggle={(id) => {
            onWishToggle(id);
            setItems(prev => prev.filter(item => item.id !== id));
            setDetailProduct(null);
          }}
          onProductClick={(prod) => setDetailProduct(prod)}
        />
      )}
    </div>
  );
}
