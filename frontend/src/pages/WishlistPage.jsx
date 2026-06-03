import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import SkeletonCard from '../components/SkeletonCard';
import { showToast } from '../utils/toast';

export default function WishlistPage({ token, onAddToCart, onWishToggle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
            return (
              <div className="product-card fade-in" key={p.id}>
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
                    <button 
                      className="add-btn" 
                      disabled={p.stock <= 0} 
                      style={{ opacity: p.stock <= 0 ? 0.35 : 1, cursor: p.stock <= 0 ? 'not-allowed' : 'pointer' }} 
                      onClick={() => p.stock > 0 && handleAdd(p)}
                    >
                      +
                    </button>
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
