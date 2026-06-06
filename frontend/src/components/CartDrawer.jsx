import React, { useEffect } from 'react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateCartQty, onCheckout }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const subtotal = cart.reduce((s, i) => {
    const p = i.is_sale && i.sale_price ? i.sale_price : i.price;
    return s + p * i.quantity;
  }, 0);

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckoutClick = () => {
    onClose();
    onCheckout();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`cart-drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />

      {/* Cart Cabinet Cabinet */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h3>Shopping Cart ({itemCount})</h3>
          <button className="cart-drawer-close" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-drawer-content">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-soft)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <p style={{ fontWeight: '500' }}>Your cart is empty</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Add items to get started.</p>
            </div>
          ) : (
            cart.map(item => {
              const ep = item.is_sale && item.sale_price ? item.sale_price : item.price;
              return (
                <div className="cart-drawer-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-drawer-item-info">
                    <div className="cart-drawer-item-name">{item.name}</div>
                    <div className="cart-drawer-item-price">₹{ep.toFixed(2)}</div>
                    
                    {/* Stepper inside Drawer */}
                    <div className="golden-qty-stepper" style={{ transform: 'scale(0.85)', transformOrigin: 'left center', marginTop: '0.25rem', height: '36px', minWidth: '100px', padding: '0 8px' }}>
                      <button 
                        onClick={() => onUpdateCartQty(item.product_id, item.quantity - 1)}
                        title="Decrease quantity"
                      >
                        {item.quantity === 1 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </button>
                      <span className="qty-val" style={{ fontSize: '0.85rem' }}>{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateCartQty(item.product_id, item.quantity + 1)}
                        title="Increase quantity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', alignSelf: 'center' }}>
                    ₹{(ep * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-summary-row">
              <span className="total-lbl">Subtotal</span>
              <span className="total-val">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <button className="co-pay-btn" style={{ width: '100%', padding: '0.85rem' }} onClick={handleCheckoutClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: '6px' }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Checkout Now
            </button>

            <div className="cart-sp-pay-logos" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
              <svg viewBox="0 0 38 24" width="28" height="18"><rect width="38" height="24" rx="3" fill="#1A1F71" /><text x="4" y="17" fill="#FFF" fontSize="13" fontFamily="Arial" fontWeight="bold" fontStyle="italic">VISA</text></svg>
              <svg viewBox="0 0 38 24" width="28" height="18"><rect width="38" height="24" rx="3" fill="#252525" /><circle cx="15" cy="12" r="7" fill="#EB001B" /><circle cx="23" cy="12" r="7" fill="#F79E1B" /><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" /></svg>
              <svg viewBox="0 0 38 24" width="28" height="18"><rect width="38" height="24" rx="3" fill="#003087" /><text x="4" y="16" fill="#009CDE" fontSize="9" fontFamily="Arial" fontWeight="bold">Pay</text><text x="17" y="16" fill="#FFF" fontSize="9" fontFamily="Arial" fontWeight="bold">Pal</text></svg>
              <svg viewBox="0 0 38 24" width="28" height="18"><rect width="38" height="24" rx="3" fill="#FFF" stroke="#E8E8E8" strokeWidth="1" /><text x="5" y="16" fill="#097939" fontSize="11" fontFamily="Arial" fontWeight="bold">UPI</text><polygon points="30,4 34,12 30,20 26,12" fill="#F47920" /><polygon points="26,4 30,12 26,20 22,12" fill="#097939" /></svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
