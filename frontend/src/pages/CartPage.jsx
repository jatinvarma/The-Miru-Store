import React from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

export default function CartPage({ token, cart, onCartChange, onCheckout, onShop }) {
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
    <div className="cart-page fade-in">
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
                  const onSale = !!(item.is_sale && item.sale_price);
                  return (
                    <div className="cart-item-row fade-in" key={item.id}>
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
