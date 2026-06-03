import React from 'react';

export default function Hero({ onShop }) {
  return (
    <div className="hero fade-in">
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
