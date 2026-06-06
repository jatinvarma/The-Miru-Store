import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import Stars from './Stars';
import { showToast } from '../utils/toast';

export default function ProductDetailModal({ product, onClose, onAddToCart, onUpdateCartQty, cart, token, wishIds, onWishToggle, onProductClick }) {
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const api = useApi(token);

  // Gallery State
  const [activeImage, setActiveImage] = useState(product.image);

  const cartItem = cart?.find(item => item.product_id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  // Parse multiple images
  const gallery = (() => {
    try {
      if (product.images) {
        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error parsing product gallery", e);
    }
    return [product.image];
  })();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    setActiveImage(product.image); // Reset active image if product changes
    api.get(`/products/${product.id}/reviews`).then(d => setReviews(Array.isArray(d) ? d : []));
    api.get(`/products?category=${product.category}`).then(d => setRelated(Array.isArray(d) ? d.filter(p => p.id !== product.id).slice(0, 3) : []));
  }, [product.id]);

  const submitReview = async () => {
    if (!token) { showToast('Sign in to leave a review'); return; }
    if (!newRating) { showToast('Please select a star rating'); return; }
    const data = await api.post(`/products/${product.id}/reviews`, { rating: newRating, comment: newComment });
    if (data.id) {
      setReviews([{ ...data, user_name: 'You' }, ...reviews]);
      setNewRating(0);
      setNewComment('');
      showToast('Review posted!');
    } else {
      showToast(data.error || 'Could not post review');
    }
  };

  const ep = product.is_sale && product.sale_price ? product.sale_price : product.price;
  const wishlisted = wishIds && wishIds.has(product.id);

  // Compute review statistics for breakdown
  const totalReviewsCount = reviews.length;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-modal fade-in">
        <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>×</button>

        {/* Left Side: Product Gallery */}
        <div className="detail-img-container">
          <div className="detail-main-img">
            <img src={activeImage} alt={product.name} />
          </div>
          {gallery.length > 1 && (
            <div className="detail-gallery-thumbs">
              {gallery.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`gallery-thumb-item ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${product.name} thumb ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="detail-info">
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginBottom: '0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{product.category}</div>
          <h2>{product.name}</h2>
          <Stars rating={product.avg_rating || 0} count={product.review_count || 0} />

          <div className="detail-price">
            {!!(product.is_sale && product.sale_price) && <span className="original">₹{product.price.toFixed(2)}</span>}
            ₹{ep.toFixed(2)}
          </div>

          <p className="detail-desc">{product.description}</p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {product.stock > 0 ? (
              cartQty > 0 ? (
                <div className="golden-qty-stepper" style={{ flex: 1 }}>
                  <button onClick={() => onUpdateCartQty(product.id, cartQty - 1)} title="Decrease quantity">
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
                  <button onClick={() => onUpdateCartQty(product.id, cartQty + 1)} title="Increase quantity">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onAddToCart(product.id); showToast(`${product.name} added!`); }}>Add to Cart</button>
              )
            ) : (
              <span className="btn btn-sm" style={{ flex: 1, background: '#888', color: '#fff', cursor: 'not-allowed', opacity: 0.8, textAlign: 'center', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                Out of Stock
              </span>
            )}
            <button className="btn btn-outline" onClick={() => onWishToggle(product.id)} style={{ padding: '14px' }}>{wishlisted ? '♥' : '♡'}</button>
          </div>

          {product.stock <= 5 && product.stock > 0 && <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--red)' }}>Only {product.stock} left in stock!</div>}

          {related.length > 0 && (
            <>
              <div className="related-title">You may also like</div>
              <div className="related-grid">
                {related.map(p => (
                  <div key={p.id} className="related-thumb" title={p.name} onClick={() => onProductClick && onProductClick(p)}>
                    <img src={p.image} alt={p.name} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Reviews & Breakdown Section */}
          <div className="reviews-section">
            <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>Customer Reviews</div>

            {/* Rating Breakdown Bar Chart */}
            {totalReviewsCount > 0 && (
              <div className="reviews-breakdown">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingCounts[stars];
                  const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                  return (
                    <div key={stars} className="breakdown-row">
                      <span className="breakdown-label">{stars} ★</span>
                      <div className="breakdown-bar-bg">
                        <div className="breakdown-bar-fill" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="breakdown-percentage">{percentage}% ({count})</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', fontWeight: '500', marginTop: '1rem', marginBottom: '0.5rem' }}>Reviews ({reviews.length})</div>
            {reviews.map(r => (
              <div className="review-item" key={r.id}>
                <div className="review-header">
                  <span className="review-author">{r.user_name}</span>
                  <Stars rating={r.rating} />
                </div>
                <p className="review-text">{r.comment}</p>
              </div>
            ))}

            <div className="review-form">
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>Leave a review:</div>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    className={`star-pick ${n <= (hoveredStar || newRating) ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setNewRating(n)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  fontFamily: "'DM Mono',monospace",
                  fontSize: '0.75rem',
                  resize: 'vertical',
                  minHeight: '70px',
                  outline: 'none'
                }}
              />
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={submitReview}>Post Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
