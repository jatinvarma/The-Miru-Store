import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

// SVG payment logos
const VisaSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Visa">
    <rect width="38" height="24" rx="4" fill="#1A1F71" />
    <text x="4" y="17" fill="#FFFFFF" fontSize="13" fontFamily="Arial,sans-serif" fontWeight="bold" fontStyle="italic">VISA</text>
  </svg>
);
const McSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Mastercard">
    <rect width="38" height="24" rx="4" fill="#252525" />
    <circle cx="15" cy="12" r="7" fill="#EB001B" />
    <circle cx="23" cy="12" r="7" fill="#F79E1B" />
    <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
  </svg>
);
const RuPaySVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="RuPay">
    <rect width="38" height="24" rx="4" fill="#1B3F77" />
    <text x="4" y="16" fill="#FFFFFF" fontSize="9.5" fontFamily="Arial,sans-serif" fontWeight="bold">RuPay</text>
    <rect x="28" y="9" width="7" height="6" rx="1" fill="#F68B1F" />
  </svg>
);
const UpiSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="UPI">
    <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#E8E8E8" strokeWidth="1" />
    <text x="5" y="16" fill="#097939" fontSize="11" fontFamily="Arial,sans-serif" fontWeight="bold">UPI</text>
    <polygon points="30,4 34,12 30,20 26,12" fill="#F47920" />
    <polygon points="26,4 30,12 26,20 22,12" fill="#097939" />
  </svg>
);
const PayPalSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="PayPal">
    <rect width="38" height="24" rx="4" fill="#003087" />
    <text x="4" y="16" fill="#009CDE" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="bold">Pay</text>
    <text x="17" y="16" fill="#FFFFFF" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="bold">Pal</text>
  </svg>
);
const CodSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" fill="none" role="img" aria-label="Cash on Delivery">
    <rect width="38" height="24" rx="4" fill="#F0FDF4" />
    <rect x="6" y="8" width="26" height="8" rx="2" fill="#16A34A" opacity="0.2" />
    <rect x="10" y="10" width="18" height="4" rx="1" fill="#16A34A" />
    <circle cx="7" cy="12" r="2" fill="#16A34A" />
    <circle cx="31" cy="12" r="2" fill="#16A34A" />
  </svg>
);

export default function CheckoutPage({ cart, submitCheckout, token, onBack }) {
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [payment, setPayment] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '' });
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Simulated Gateway State
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState('verify'); // verify -> otp -> processing
  const [otpValue, setOtpValue] = useState('');
  const [gatewayError, setGatewayError] = useState('');

  const api = useApi(token);

  const subtotal = cart.reduce((s, i) => {
    const p = i.is_sale && i.sale_price ? i.sale_price : i.price;
    return s + p * i.quantity;
  }, 0);
  const discount = coupon ? (subtotal * coupon.discount_pct / 100) : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const data = await api.get(`/coupons/${couponCode}`);
    if (data.error) { 
      setCouponError(data.error); 
      setCoupon(null); 
    } else { 
      setCoupon(data); 
      showToast(`Coupon applied! ${data.discount_pct}% off`); 
    }
  };

  const handleCheckoutClick = async () => {
    if (!address.street || !address.city || !address.state || !address.zip) { 
      showToast('Please complete all shipping fields.'); 
      return; 
    }
    if (payment === 'credit_card' && (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv)) { 
      showToast('Please complete all card details.'); 
      return; 
    }
    if (payment === 'upi' && !paymentDetails.upiId) { 
      showToast('Please enter your UPI ID.'); 
      return; 
    }

    // Trigger mock payment gateway flow
    setGatewayStep('verify');
    setGatewayError('');
    setOtpValue('');
    setShowGateway(true);
    setLoading(true);

    // Step 1: Verification loading state
    setTimeout(() => {
      setGatewayStep('otp');
    }, 1800);
  };

  const submitOtp = () => {
    if (!otpValue || otpValue.length < 4) {
      setGatewayError('Please enter a valid OTP code.');
      return;
    }
    setGatewayError('');
    setGatewayStep('processing');

    // Step 2: Processing payment loading state
    setTimeout(async () => {
      try {
        await submitCheckout({ 
          shipping_address: address, 
          payment_method: payment, 
          payment_details: paymentDetails, 
          coupon_code: coupon?.code, 
          discount_amount: discount 
        });
        setShowGateway(false);
        setLoading(false);
      } catch (err) {
        setGatewayError('Payment rejected by issuer. Please try again.');
        setGatewayStep('otp');
        setLoading(false);
      }
    }, 2000);
  };

  const cancelPayment = () => {
    setShowGateway(false);
    setLoading(false);
    showToast('Payment cancelled');
  };

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const maskedCard = paymentDetails.cardNumber
    ? fmtCard(paymentDetails.cardNumber).replace(/\d(?=.{5})/g, '•')
    : '•••• •••• •••• ••••';

  const payMethods = [
    { id: 'credit_card', label: 'Card', Logo: () => <span style={{ display: 'flex', gap: '4px' }}><VisaSVG /><McSVG /></span> },
    { id: 'upi', label: 'UPI', Logo: UpiSVG },
    { id: 'paypal', label: 'PayPal', Logo: PayPalSVG },
    { id: 'cod', label: 'Cash', Logo: CodSVG },
  ];

  return (
    <div className="checkout-page fade-in">
      <div className="checkout-page-inner">

        {/* ── LEFT COLUMN ── */}
        <div className="checkout-page-left">

          {/* Top breadcrumb + title */}
          <div className="co-page-top">
            <button className="cart-page-continue" onClick={onBack}>← Back to Cart</button>
            <div className="co-page-brand">
              <span className="co-page-logo">MIRU<span>.</span></span>
              <span className="co-page-secure">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                SSL Secured
              </span>
            </div>
            <h1 className="co-page-title">Checkout</h1>
          </div>

          {/* STEP 1 — Shipping */}
          <div className="co-step-card">
            <div className="co-step-header">
              <span className="co-step-num">1</span>
              <div>
                <div className="co-step-title">Shipping Address</div>
                <div className="co-step-sub">Where should we send your order?</div>
              </div>
              <svg className="co-step-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div className="co-step-body">
              <div className="form-field"><label>Street Address</label><input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="123 Main Street, Apt 4B" /></div>
              <div className="form-field"><label>City</label><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Mumbai" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-field" style={{ marginBottom: 0 }}><label>State</label><input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} placeholder="Maharashtra" /></div>
                <div className="form-field" style={{ marginBottom: 0 }}><label>PIN Code</label><input value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} placeholder="400001" /></div>
              </div>
            </div>
          </div>

          {/* STEP 2 — Payment */}
          <div className="co-step-card">
            <div className="co-step-header">
              <span className="co-step-num">2</span>
              <div>
                <div className="co-step-title">Payment</div>
                <div className="co-step-sub">All transactions are encrypted and secure</div>
              </div>
              <svg className="co-step-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <div className="co-step-body">

              {/* Payment method tabs */}
              <div className="pay-method-tabs">
                {payMethods.map(m => (
                  <button
                    key={m.id}
                    className={`pay-tab ${payment === m.id ? 'active' : ''}`}
                    onClick={() => setPayment(m.id)}
                  >
                    <m.Logo />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Credit card inputs */}
              {payment === 'credit_card' && (
                <div className="co-card-area">
                  {/* Visual card */}
                  <div className="cc-preview">
                    <div className="cc-preview-top">
                      <span className="cc-chip">
                        <svg width="28" height="22" viewBox="0 0 28 22" fill="none"><rect width="28" height="22" rx="3" fill="#D4A96A" opacity=".9" /><rect x="2" y="7" width="24" height="8" rx="1" fill="none" stroke="#B8933A" strokeWidth="0.7" /><line x1="14" y1="7" x2="14" y2="15" stroke="#B8933A" strokeWidth="0.7" /><line x1="2" y1="11" x2="26" y2="11" stroke="#B8933A" strokeWidth="0.7" /></svg>
                      </span>
                      <span className="cc-brand-logos"><VisaSVG /></span>
                    </div>
                    <div className="cc-number">{maskedCard}</div>
                    <div className="cc-bottom">
                      <div><div className="cc-label">Card Holder</div><div className="cc-value">YOUR NAME</div></div>
                      <div><div className="cc-label">Expires</div><div className="cc-value">{paymentDetails.expiry || 'MM/YY'}</div></div>
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Card Number</label>
                    <input
                      placeholder="1234 5678 9012 3456"
                      value={fmtCard(paymentDetails.cardNumber)}
                      onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value.replace(/\s/g, '') })}
                      maxLength={19}
                      style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>Expiry Date</label>
                      <input placeholder="MM / YY" value={paymentDetails.expiry} onChange={e => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })} maxLength={7} style={{ fontFamily: "'DM Mono', monospace" }} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>CVV <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>3 digits</span></label>
                      <input placeholder="•••" type="password" value={paymentDetails.cvv} onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} maxLength={4} style={{ fontFamily: "'DM Mono', monospace" }} />
                    </div>
                  </div>
                  <div className="co-accepted-cards">
                    <span>Accepted cards:</span>
                    <VisaSVG /><McSVG /><RuPaySVG />
                  </div>
                </div>
              )}

              {/* UPI */}
              {payment === 'upi' && (
                <div className="co-card-area">
                  <div className="co-upi-header">
                    <UpiSVG />
                    <span>Enter your UPI ID to pay instantly</span>
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label>UPI ID</label>
                    <input placeholder="yourname@upi" value={paymentDetails.upiId} onChange={e => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.5rem' }}>e.g. name@okicici · name@ybl · 9XXXXXXXXX@paytm</p>
                </div>
              )}

              {/* PayPal */}
              {payment === 'paypal' && (
                <div className="co-card-area co-alt-pay">
                  <PayPalSVG />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Pay with PayPal</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>You will be redirected to PayPal to complete your purchase securely.</div>
                  </div>
                </div>
              )}

              {/* COD */}
              {payment === 'cod' && (
                <div className="co-card-area co-alt-pay">
                  <CodSVG />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cash on Delivery</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Pay in cash when your order arrives. Available on orders up to ₹10,000.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="co-trust-row">
            <div className="co-trust-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg><span>256-bit SSL</span></div>
            <div className="co-trust-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg><span>PCI DSS Compliant</span></div>
            <div className="co-trust-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg><span>30-day Returns</span></div>
            <div className="co-trust-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg><span>Free Shipping</span></div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Order Summary ── */}
        <div className="checkout-page-summary">
          <div className="co-summary-panel">
            <div className="co-summary-panel-head">
              <span>Order Summary</span>
              <span className="co-summary-count">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
            </div>

            <div className="co-summary-items">
              {cart.map((item, n) => {
                const ep = item.is_sale && item.sale_price ? item.sale_price : item.price;
                return (
                  <div key={n} className="co-summary-item">
                    <img src={item.image} alt={item.name} className="co-summary-item-img" />
                    <div className="co-summary-item-info">
                      <div className="co-summary-item-name">{item.name}</div>
                      <div className="co-summary-item-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="co-summary-item-price">₹{(ep * item.quantity).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="co-summary-sep" />

            <div className="co-coupon-row" style={{ marginBottom: '0.4rem' }}>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" />
              <button onClick={applyCoupon}>Apply</button>
            </div>
            {couponError && <p className="co-error">{couponError}</p>}
            {coupon && <p className="coupon-success">✓ {coupon.discount_pct}% off applied!</p>}

            <div className="co-summary-sep" />

            <div className="co-totals">
              <div className="co-total-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="co-total-row co-total-discount"><span>Discount ({coupon.code})</span><span>−₹{discount.toFixed(2)}</span></div>}
              <div className="co-total-row"><span>Shipping</span><span className="co-free-tag">FREE</span></div>
            </div>

            <div className="co-grand-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button className="co-pay-btn" onClick={handleCheckoutClick} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Processing…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  Pay ₹{total.toFixed(2)}
                </span>
              )}
            </button>

            <div className="co-pay-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Your payment info is encrypted &amp; never stored
            </div>
          </div>
        </div>

      </div>

      {/* ── SIMULATED PAYMENT GATEWAY DIALOG ── */}
      {showGateway && (
        <div className="modal-overlay secure-gateway-overlay">
          <div className="secure-gateway-card">
            
            {/* Header: bank brand bar */}
            <div className="gateway-brand-bar">
              <span className="gateway-shield">🛡️</span>
              <span className="gateway-brand-name">SECURE SHIELD 3D-SECURE</span>
            </div>

            {/* Content body */}
            <div className="gateway-body">
              {gatewayStep === 'verify' && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div className="spin-big"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>
                  <h3 style={{ marginTop: '1.5rem', fontWeight: '500' }}>Contacting payment issuer...</h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Verifying security credentials for card transaction.</p>
                </div>
              )}

              {gatewayStep === 'otp' && (
                <div className="fade-in">
                  <div className="gateway-details-grid">
                    <div><span className="gt-label">Merchant</span><span className="gt-val">MIRU STORE</span></div>
                    <div><span className="gt-label">Amount</span><span className="gt-val">₹{total.toFixed(2)}</span></div>
                    <div><span className="gt-label">Card</span><span className="gt-val">{payment === 'credit_card' ? `•••• •••• •••• ${paymentDetails.cardNumber.slice(-4)}` : payment.toUpperCase()}</span></div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '1.5rem 0 0.5rem' }}>One-Time Password Verification</h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    A code has been sent to the mobile number associated with your account. Enter the 6-digit code below to authorize the transaction.
                  </p>
                  
                  <div style={{ margin: '1.5rem 0' }}>
                    <div className="form-field" style={{ marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enter 6-digit OTP (use code 123456)</label>
                      <input 
                        type="text" 
                        value={otpValue} 
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••" 
                        className="gateway-otp-input"
                      />
                    </div>
                    {gatewayError && <div style={{ color: 'var(--red)', fontSize: '0.72rem', marginTop: '0.4rem' }}>✕ {gatewayError}</div>}
                  </div>

                  <div className="gateway-action-row">
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitOtp}>Submit OTP</button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={cancelPayment}>Cancel</button>
                  </div>
                  
                  <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                    Didn't receive the code? <a href="#" style={{ color: 'var(--gold)', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); showToast('OTP code re-sent!'); }}>Resend OTP</a>
                  </div>
                </div>
              )}

              {gatewayStep === 'processing' && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div className="spin-big"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>
                  <h3 style={{ marginTop: '1.5rem', fontWeight: '500' }}>Processing payment...</h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Do not refresh the page or click back.</p>
                </div>
              )}
            </div>

            {/* Footer secure info */}
            <div className="gateway-footer">
              <span>🔒 Verified by Visa / Mastercard Identity Check Secure</span>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
