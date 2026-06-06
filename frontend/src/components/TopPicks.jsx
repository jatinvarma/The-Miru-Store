import React, { useState, useEffect, useRef } from 'react';
import useApi from '../hooks/useApi';
import Stars from './Stars';
import ProductDetailModal from './ProductDetailModal';
import { showToast } from '../utils/toast';

export default function TopPicks({ token, cart, onAddToCart, onUpdateCartQty, onAuthRequired, wishIds, onWishToggle }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState(null);
  const scrollRef = useRef(null);
  const api = useApi(token);

  useEffect(() => {
    const load = async () => {
      const data = await api.get('/products?sort=rating&maxPrice=50000&category=All');
      setProducts(Array.isArray(data) ? data.slice(0, 8) : []);
      setLoading(false);
    };
    load();
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

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

  return (
    <section className="top-picks-section">
      <div className="top-picks-header">
        <div>
          <span className="top-picks-eyebrow">Highest Rated</span>
          <h2 className="top-picks-heading">Top Picks</h2>
        </div>
        <div className="top-picks-controls">
          <button className="top-picks-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button className="top-picks-arrow" onClick={() => scroll(1)} aria-label="Scroll right">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="top-picks-scroll" ref={scrollRef}>
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div className="top-pick-card top-pick-skeleton" key={i} />
          ))
        ) : products.map(p => {
          const cartItem = cart?.find(item => item.product_id === p.id);
          const cartQty = cartItem ? cartItem.quantity : 0;
          return (
            <div className="top-pick-card fade-in" key={p.id} onClick={() => setDetailProduct(p)}>
              <div className="top-pick-img">
                <img src={p.image} alt={p.name} loading="lazy" />
                {p.is_sale === 1 && <span className="top-pick-badge">Sale</span>}
                {p.is_new === 1 && <span className="top-pick-badge top-pick-badge-new">New</span>}
              </div>
              <div className="top-pick-info">
                <div className="top-pick-category">{p.category}</div>
                <div className="top-pick-name">{p.name}</div>
                <Stars rating={p.avg_rating || 0} count={p.review_count || 0} />
                <div className="top-pick-footer">
                  <span className="top-pick-price">
                    {p.is_sale && p.sale_price ? (
                      <>
                        <span className="top-pick-original">₹{p.price.toFixed(2)}</span>
                        ₹{p.sale_price.toFixed(2)}
                      </>
                    ) : `₹${p.price.toFixed(2)}`}
                  </span>
                  {p.stock > 0 ? (
                    cartQty > 0 ? (
                      <div className="top-pick-stepper" onClick={e => e.stopPropagation()}>
                        <button onClick={e => handleQtyChange(e, p, cartQty - 1)}>−</button>
                        <span>{cartQty}</span>
                        <button onClick={e => handleQtyChange(e, p, cartQty + 1)}>+</button>
                      </div>
                    ) : (
                      <button
                        className="top-pick-add-btn"
                        onClick={e => { e.stopPropagation(); handleAdd(p); }}
                      >
                        +
                      </button>
                    )
                  ) : (
                    <span className="top-pick-oos">Out of Stock</span>
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
          onProductClick={setDetailProduct}
        />
      )}
    </section>
  );
}
