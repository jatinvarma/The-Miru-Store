import React from 'react';

export default function Stars({ rating, count }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span className="stars">
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>
            ★
          </span>
        ))}
      </span>
      {count !== undefined && <span className="review-count">({count})</span>}
    </span>
  );
}
