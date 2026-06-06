import React, { useState, useEffect } from 'react';
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
const AmexSVG = () => (
  <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="American Express">
    <rect width="38" height="24" rx="4" fill="#0070CD" />
    <text x="3" y="16" fill="#FFFFFF" fontSize="9" fontFamily="Arial,sans-serif" fontWeight="bold">AMEX</text>
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

// Helpers for validation
const getCardBrand = (number) => {
  const clean = number.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^(60|65|81|82)/.test(clean)) return 'rupay';
  if (/^3[47]/.test(clean)) return 'amex';
  return 'unknown';
};

const validateLuhn = (number) => {
  const clean = number.replace(/\D/g, '');
  if (!clean || clean.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const validateExpiry = (expiry) => {
  const match = expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = parseInt('20' + match[2], 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};

const fmtCard = (v, brand) => {
  if (!v) return '';
  const clean = v.replace(/\D/g, '');
  if (brand === 'amex') {
    const parts = [];
    if (clean.length > 0) parts.push(clean.slice(0, 4));
    if (clean.length > 4) parts.push(clean.slice(4, 10));
    if (clean.length > 10) parts.push(clean.slice(10, 15));
    return parts.join(' ');
  } else {
    return clean.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
};

export default function CheckoutPage({ cart, submitCheckout, token, onBack }) {
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [payment, setPayment] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '', cardHolder: '' });
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Global Checkout Session Timer state (5 minutes)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(300);

  // Card UI state
  const [cardFlipped, setCardFlipped] = useState(false);

  // UPI VPA UI states
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [simulatedApp, setSimulatedApp] = useState(null);
  const [simulatingAppPayment, setSimulatingAppPayment] = useState(false);

  // UPI QR UI states
  const [qrSecondsLeft, setQrSecondsLeft] = useState(300);

  // PayPal UI states
  const [paypalModalOpen, setPaypalModalOpen] = useState(false);
  const [paypalStep, setPaypalStep] = useState('login'); // 'login' or 'authorize'
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [paypalLoading, setPaypalLoading] = useState(false);

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

  // Global session timer effect
  useEffect(() => {
    if (sessionSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSessionSecondsLeft(s => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionSecondsLeft]);

  // UPI QR Code timer effect
  useEffect(() => {
    let timer = null;
    if (payment === 'upi_qr' && qrSecondsLeft > 0) {
      timer = setInterval(() => {
        setQrSecondsLeft(s => s - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [payment, qrSecondsLeft]);

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

  const handleExpiryChange = (val) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.slice(0, 2)} / ${clean.slice(2, 4)}`;
    }
    setPaymentDetails(prev => ({ ...prev, expiry: formatted }));
  };

  const handleCheckoutClick = async () => {
    if (sessionSecondsLeft === 0) {
      setPaymentError('Checkout session has expired. Please return to cart.');
      return;
    }

    if (!address.street || !address.city || !address.state || !address.zip) {
      setPaymentError('Please complete all shipping fields before proceeding.');
      return;
    }

    if (payment === 'credit_card') {
      const cardBrand = getCardBrand(paymentDetails.cardNumber);
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 12) {
        setPaymentError('Please enter a valid card number.');
        return;
      }
      if (!validateLuhn(paymentDetails.cardNumber)) {
        setPaymentError('Invalid card number. Please check the digits and try again.');
        return;
      }
      if (!paymentDetails.expiry || !validateExpiry(paymentDetails.expiry)) {
        setPaymentError('Please enter a valid expiry date (MM / YY) in the future.');
        return;
      }
      const cvvMin = cardBrand === 'amex' ? 4 : 3;
      if (!paymentDetails.cvv || paymentDetails.cvv.length < cvvMin) {
        setPaymentError(`Please enter a valid ${cvvMin}-digit CVV.`);
        return;
      }
      if (!paymentDetails.cardHolder || !paymentDetails.cardHolder.trim()) {
        setPaymentError("Please enter the cardholder's name.");
        return;
      }
    }

    if (payment === 'upi') {
      if (!paymentDetails.upiId) {
        setPaymentError('Please enter your UPI ID.');
        return;
      }
      if (!upiVerified) {
        setPaymentError('Please verify your UPI ID first.');
        return;
      }
    }

    if (payment === 'upi_qr') {
      if (qrSecondsLeft === 0) {
        setPaymentError('QR Code has expired. Please regenerate to pay.');
        return;
      }
      setPaymentError('Please scan the QR code to complete payment.');
      return;
    }

    if (payment === 'paypal') {
      handlePayPalButtonClick();
      return;
    }

    // Trigger mock payment gateway flow (for Credit Card or UPI VPA)
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
        setPaymentError('Payment rejected by issuer. Please check your card details or try another card.');
        setShowGateway(false);
        setLoading(false);
      }
    }, 2000);
  };

  const cancelPayment = () => {
    setShowGateway(false);
    setLoading(false);
    showToast('Payment cancelled');
  };

  // UPI Helper methods
  const handleUpiVerify = () => {
    if (!paymentDetails.upiId || !paymentDetails.upiId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    setUpiVerifying(true);
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiVerified(true);
      showToast('UPI ID verified successfully!');
    }, 1200);
  };

  const appendUpiHandle = (handle) => {
    let current = paymentDetails.upiId ? paymentDetails.upiId.trim() : '';
    const atIndex = current.indexOf('@');
    if (atIndex !== -1) {
      current = current.substring(0, atIndex);
    }
    setPaymentDetails({ ...paymentDetails, upiId: current + handle });
    setUpiVerified(false);
  };

  const simulateAppRequest = (appName) => {
    if (!paymentDetails.upiId || !upiVerified) {
      showToast('Please enter and verify your UPI ID first.');
      return;
    }
    setSimulatedApp(appName);
    setSimulatingAppPayment(true);
  };

  const handleSimulatedAppApprove = async () => {
    setSimulatingAppPayment(false);
    setLoading(true);
    showToast(`Payment approved via ${simulatedApp}!`);
    try {
      await submitCheckout({
        shipping_address: address,
        payment_method: 'upi',
        payment_details: { ...paymentDetails, method: `UPI App: ${simulatedApp}` },
        coupon_code: coupon?.code,
        discount_amount: discount
      });
    } catch (err) {
      setPaymentError('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const handleQrSimulatePayment = async () => {
    setLoading(true);
    showToast('Payment received via QR Code!');
    try {
      await submitCheckout({
        shipping_address: address,
        payment_method: 'upi',
        payment_details: { method: 'UPI QR Code Scan (Jatin Varma)' },
        coupon_code: coupon?.code,
        discount_amount: discount
      });
    } catch (err) {
      setPaymentError('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  // PayPal Helper methods
  const handlePayPalButtonClick = () => {
    setPaypalEmail('');
    setPaypalPassword('');
    setPaypalStep('login');
    setPaypalModalOpen(true);
  };

  const handlePayPalLogin = () => {
    if (!paypalEmail || !paypalPassword) {
      showToast('Please enter your PayPal email and password.');
      return;
    }
    setPaypalLoading(true);
    setTimeout(() => {
      setPaypalLoading(false);
      setPaypalStep('authorize');
    }, 1500);
  };

  const handlePayPalPayment = async () => {
    setPaypalLoading(true);
    setTimeout(async () => {
      try {
        await submitCheckout({
          shipping_address: address,
          payment_method: 'paypal',
          payment_details: { email: paypalEmail, method: 'PayPal Checkout' },
          coupon_code: coupon?.code,
          discount_amount: discount
        });
        setPaypalModalOpen(false);
        setPaypalLoading(false);
      } catch (err) {
        setPaymentError('PayPal Checkout failed. Please try again.');
        setPaypalLoading(false);
      }
    }, 2000);
  };

  const cardBrand = getCardBrand(paymentDetails.cardNumber);

  const payMethods = [
    { id: 'credit_card', label: 'Card', Logo: () => <span style={{ display: 'flex', gap: '4px' }}><VisaSVG /><McSVG /><AmexSVG /></span> },
    { id: 'upi', label: 'UPI ID', Logo: UpiSVG },
    {
      id: 'upi_qr', label: 'UPI QR', Logo: () => (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" style={{ display: 'block' }}>
          <rect x="2" y="2" width="7" height="7" rx="1" />
          <rect x="15" y="2" width="7" height="7" rx="1" />
          <rect x="2" y="15" width="7" height="7" rx="1" />
          <path d="M15 15h3v3h-3zm3 3h4v4h-4zm-3 3h3v1h-3zm6-3v3h1v-3z" fill="currentColor" stroke="none" />
        </svg>
      )
    },
    { id: 'paypal', label: 'PayPal', Logo: PayPalSVG },
    { id: 'cod', label: 'Cash', Logo: CodSVG },
  ];

  return (
    <div className="checkout-page fade-in">
      {/* ── SESSION EXPIRED OVERLAY ── */}
      {sessionSecondsLeft === 0 && (
        <div className="co-expired-overlay">
          <div className="co-expired-card">
            <div className="co-expired-icon">⏱️</div>
            <div className="co-expired-title">Session Expired</div>
            <div className="co-expired-text">
              To protect checkout security and hold product inventory, your session is limited to 5 minutes. Please return to your cart to restart the checkout.
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onBack}>Return to Cart</button>
          </div>
        </div>
      )}

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

          {/* Global session timer banner */}
          <div className={`co-session-timer-banner ${sessionSecondsLeft <= 60 ? 'urgent' : 'normal'}`}>
            <span>⏱️ Secure session expires in:</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 'bold' }}>
              {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, '0')}
            </span>
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
                    onClick={() => {
                      setPayment(m.id);
                      setCardFlipped(false);
                    }}
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
                  <div className="card-container-3d">
                    <div className={`cc-card-flipper ${cardFlipped ? 'flipped' : ''}`}>

                      {/* Front Face */}
                      <div className={`cc-card-front brand-${cardBrand}`}>
                        <div className="cc-preview-top">
                          <span className="cc-chip">
                            <svg width="28" height="22" viewBox="0 0 28 22" fill="none"><rect width="28" height="22" rx="3" fill="#D4A96A" opacity=".9" /><rect x="2" y="7" width="24" height="8" rx="1" fill="none" stroke="#B8933A" strokeWidth="0.7" /><line x1="14" y1="7" x2="14" y2="15" stroke="#B8933A" strokeWidth="0.7" /><line x1="2" y1="11" x2="26" y2="11" stroke="#B8933A" strokeWidth="0.7" /></svg>
                          </span>
                          <span className="cc-brand-logos">
                            {cardBrand === 'visa' && <VisaSVG />}
                            {cardBrand === 'mastercard' && <McSVG />}
                            {cardBrand === 'rupay' && <RuPaySVG />}
                            {cardBrand === 'amex' && <AmexSVG />}
                          </span>
                        </div>
                        <div className="cc-number">
                          {paymentDetails.cardNumber
                            ? fmtCard(paymentDetails.cardNumber, cardBrand)
                            : cardBrand === 'amex'
                              ? '•••• •••••• •••••'
                              : '•••• •••• •••• ••••'}
                        </div>
                        <div className="cc-bottom">
                          <div style={{ flex: 1 }}>
                            <div className="cc-label">Card Holder</div>
                            <div className="cc-value" style={{ textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                              {paymentDetails.cardHolder || 'YOUR NAME'}
                            </div>
                          </div>
                          <div>
                            <div className="cc-label">Expires</div>
                            <div className="cc-value">{paymentDetails.expiry || 'MM / YY'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Back Face */}
                      <div className="cc-card-back">
                        <div className="cc-card-back-mag"></div>
                        <div className="cc-card-back-sig-area">
                          <div className="cc-card-back-sig"></div>
                          <div className="cc-card-back-cvv-box">
                            {paymentDetails.cvv ? '•'.repeat(paymentDetails.cvv.length) : 'CVV'}
                          </div>
                        </div>
                        <div className="cc-card-back-note">
                          This card is property of issuer bank. Authorized signature required. If found, please return to issuer. Securing transaction through MIRU.
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Card Number</label>
                    <input
                      placeholder={cardBrand === 'amex' ? '1234 567890 12345' : '1234 5678 9012 3456'}
                      value={fmtCard(paymentDetails.cardNumber, cardBrand)}
                      onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value.replace(/\s/g, '') })}
                      onFocus={() => setCardFlipped(false)}
                      maxLength={cardBrand === 'amex' ? 17 : 19}
                      style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Cardholder Name</label>
                    <input
                      placeholder="Jane Doe"
                      value={paymentDetails.cardHolder || ''}
                      onChange={e => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })}
                      onFocus={() => setCardFlipped(false)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>Expiry Date</label>
                      <input
                        placeholder="MM / YY"
                        value={paymentDetails.expiry || ''}
                        onChange={e => handleExpiryChange(e.target.value)}
                        onFocus={() => setCardFlipped(false)}
                        maxLength={7}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>CVV <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{cardBrand === 'amex' ? '4 digits' : '3 digits'}</span></label>
                      <input
                        placeholder={cardBrand === 'amex' ? '••••' : '•••'}
                        type="password"
                        value={paymentDetails.cvv || ''}
                        onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value.replace(/\D/g, '') })}
                        onFocus={() => setCardFlipped(true)}
                        maxLength={cardBrand === 'amex' ? 4 : 3}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                    </div>
                  </div>
                  <div className="co-accepted-cards">
                    <span>Accepted cards:</span>
                    <VisaSVG /><McSVG /><RuPaySVG /><AmexSVG />
                  </div>
                </div>
              )}

              {/* UPI ID (VPA) */}
              {payment === 'upi' && (
                <div className="co-card-area">
                  <div className="upi-id-input-wrapper">
                    <input
                      placeholder="yourname@upi"
                      value={paymentDetails.upiId || ''}
                      onChange={e => {
                        setPaymentDetails({ ...paymentDetails, upiId: e.target.value });
                        setUpiVerified(false);
                      }}
                    />
                    <button
                      type="button"
                      className="btn-verify-upi"
                      onClick={handleUpiVerify}
                      disabled={upiVerifying || !paymentDetails.upiId}
                    >
                      {upiVerifying ? 'Verifying...' : upiVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                  <div className="upi-handles-grid">
                    {['@okhdfcbank', '@okicici', '@ybl', '@paytm', '@upi'].map(handle => (
                      <span
                        key={handle}
                        className="upi-handle-tag"
                        onClick={() => appendUpiHandle(handle)}
                      >
                        {handle}
                      </span>
                    ))}
                  </div>

                  <div className="upi-apps-grid">
                    {[
                      { name: 'Google Pay', color: '#4285F4', initial: 'G' },
                      { name: 'PhonePe', color: '#5f259f', initial: 'P' },
                      { name: 'Paytm', color: '#00baf2', initial: 'Py' },
                      { name: 'BHIM', color: '#e27d2c', initial: 'B' }
                    ].map(app => (
                      <button
                        key={app.name}
                        type="button"
                        className="upi-app-btn"
                        onClick={() => simulateAppRequest(app.name)}
                      >
                        <span className="upi-app-logo" style={{ backgroundColor: app.color }}>{app.initial}</span>
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* UPI QR (GPay Template) */}
              {payment === 'upi_qr' && (
                <div className="co-card-area">
                  <div className="gpay-qr-wrapper">
                    <div className="gpay-qr-header">
                      <div className="gpay-profile-icon">
                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'sans-serif' }}>JV</span>
                      </div>
                      <div className="gpay-profile-name">Jatin Varma</div>
                    </div>

                    {qrSecondsLeft === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>QR Code expired.</div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => setQrSecondsLeft(300)}
                        >
                          Regenerate QR
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="gpay-qr-card">
                          <div className="gpay-qr-box">
                            <svg width="150" height="150" viewBox="0 0 150 150">
                              <rect width="150" height="150" fill="#ffffff" />
                              <rect x="10" y="10" width="30" height="30" fill="#111" />
                              <rect x="15" y="15" width="20" height="20" fill="#fff" />
                              <rect x="20" y="20" width="10" height="10" fill="#111" />

                              <rect x="110" y="10" width="30" height="30" fill="#111" />
                              <rect x="115" y="15" width="20" height="20" fill="#fff" />
                              <rect x="120" y="20" width="10" height="10" fill="#111" />

                              <rect x="10" y="110" width="30" height="30" fill="#111" />
                              <rect x="15" y="115" width="20" height="20" fill="#fff" />
                              <rect x="20" y="120" width="10" height="10" fill="#111" />

                              <rect x="50" y="20" width="10" height="20" fill="#111" />
                              <rect x="70" y="10" width="20" height="10" fill="#111" />
                              <rect x="80" y="30" width="10" height="10" fill="#111" />
                              <rect x="20" y="50" width="20" height="10" fill="#111" />
                              <rect x="50" y="50" width="10" height="10" fill="#111" />
                              <rect x="10" y="70" width="20" height="10" fill="#111" />
                              <rect x="40" y="70" width="10" height="30" fill="#111" />

                              <rect x="60" y="60" width="20" height="20" fill="#111" />
                              <rect x="90" y="50" width="10" height="20" fill="#111" />
                              <rect x="110" y="50" width="20" height="10" fill="#111" />

                              <rect x="60" y="90" width="10" height="30" fill="#111" />
                              <rect x="80" y="90" width="30" height="10" fill="#111" />
                              <rect x="80" y="110" width="20" height="20" fill="#111" />
                              <rect x="110" y="90" width="20" height="10" fill="#111" />
                              <rect x="120" y="110" width="10" height="10" fill="#111" />
                            </svg>
                            <div className="gpay-qr-logo-center">
                              <svg viewBox="0 0 40 40" width="24" height="24" style={{ display: 'block' }}>
                                <path d="M14 13h4a3 3 0 0 1 3 3v8h-3v-8a1 1 0 0 0-1-1h-3v-2z" fill="#4285F4" />
                                <path d="M26 13h-4a3 3 0 0 0-3 3v8h3v-8a1 1 0 0 1 1-1h3v-2z" fill="#34A853" />
                                <path d="M26 27h-4a3 3 0 0 1-3-3v-4h3v4a1 1 0 0 0 1 1h3v2z" fill="#FBBC05" />
                                <path d="M14 27h4a3 3 0 0 0 3-3v-4h-3v4a1 1 0 0 1-1 1h-3v2z" fill="#EA4335" />
                              </svg>
                            </div>
                          </div>
                          <div className="gpay-qr-upi-id">UPI ID: vjatin395@okicici</div>
                        </div>

                        <div className="gpay-qr-footer-text">Scan to pay with any UPI app</div>

                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ⏱️ QR expires in: {Math.floor(qrSecondsLeft / 60)}:{(qrSecondsLeft % 60).toString().padStart(2, '0')}
                          </span>

                          <button
                            type="button"
                            className="upi-qr-sim-btn"
                            onClick={handleQrSimulatePayment}
                          >
                            Simulate Scan &amp; Pay Completion
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* PayPal */}
              {payment === 'paypal' && (
                <div className="co-card-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <PayPalSVG />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pay with PayPal</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Safe. Fast. Secure.</div>
                    </div>
                  </div>

                  <div className="paypal-btn-group">
                    <button
                      type="button"
                      className="paypal-branded-btn pp-yellow"
                      onClick={handlePayPalButtonClick}
                    >
                      <PayPalSVG />
                    </button>
                    <button
                      type="button"
                      className="paypal-branded-btn pp-black"
                      onClick={handlePayPalButtonClick}
                    >
                      Debit or Credit Card
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '0.25rem' }}>
                    Click either button to open the PayPal secure payment checkout.
                  </p>
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

            <button className="co-pay-btn" onClick={handleCheckoutClick} disabled={loading || sessionSecondsLeft === 0}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Processing…
                </span>
              ) : payment === 'paypal' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  Continue with PayPal
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

      {/* ── SIMULATED UPI APP MODAL OVERLAY ── */}
      {simulatingAppPayment && (
        <div className="paypal-modal-overlay">
          <div className="paypal-modal" style={{ width: '360px', padding: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="spin-big" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', display: 'inline-block' }}></div>
              <h3 style={{ marginTop: '1.5rem', fontWeight: '600', fontSize: '1.1rem' }}>Request Sent to {simulatedApp}</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                Please check the notification on your phone or open the {simulatedApp} app to authorize the transaction of <strong>₹{total.toFixed(2)}</strong>.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem' }}
                  onClick={handleSimulatedAppApprove}
                >
                  Simulate App Approval
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem' }}
                  onClick={() => setSimulatingAppPayment(false)}
                >
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMULATED PAYPAL GATEWAY MODAL OVERLAY ── */}
      {paypalModalOpen && (
        <div className="paypal-modal-overlay">
          <div className="paypal-modal">
            <div className="paypal-modal-header">
              <svg viewBox="0 0 100 28" height="22" className="paypal-modal-logo" style={{ display: 'block' }}>
                <path d="M12.3,2.4C10.9,2.4,9.6,3,8.7,4C7.8,3,6.5,2.4,5.1,2.4H0.5v22.8h4.6V16.7h0.5c3.8,0,7.1-2.1,8.3-5.5 c0.8-2.3,0.5-4.8-0.9-6.8C12.8,2.7,12.6,2.5,12.3,2.4z M9.1,11.2c-0.6,1.7-2.2,2.8-4,2.8H4.6V7.1h0.5c1.8,0,3.4,1.1,4,2.8 c0.3,0.8,0.2,1.7-0.1,2.5C9,12.5,9,12.5,9.1,11.2z" fill="#003087" />
                <path d="M30.4,2.4C29,2.4,27.7,3,26.8,4c-0.9-1-2.2-1.6-3.6-1.6h-4.6v22.8h4.6V16.7h0.5c3.8,0,7.1-2.1,8.3-5.5 c0.8-2.3,0.5-4.8-0.9-6.8C30.9,2.7,30.7,2.5,30.4,2.4z M27.2,11.2c-0.6,1.7-2.2,2.8-4,2.8h-0.5V7.1h0.5c1.8,0,3.4,1.1,4,2.8 c0.3,0.8,0.2,1.7-0.1,2.5C27.1,12.5,27.1,12.5,27.2,11.2z" fill="#0079C1" />
                <path d="M47.7,2.4h-4.6L38,25.2h4.6l1.2-5.4h4.4c4.6,0,8.3-3.6,8.7-8.1c0.2-2.3-0.5-4.5-2.1-6.1S50.9,2.4,47.7,2.4z M47.3,14.4 h-3.3l1-4.8h3.3c1.7,0,3.1,1.4,3.1,3.1C51.4,13.8,50,14.4,47.3,14.4z" fill="#00457C" />
                <path d="M66.4,2.4h-4.6l-5.1,22.8h4.6l1.2-5.4h4.4c4.6,0,8.3-3.6,8.7-8.1c0.2-2.3-0.5-4.5-2.1-6.1S69.6,2.4,66.4,2.4z M66,14.4 h-3.3l1-4.8H66c1.7,0,3.1,1.4,3.1,3.1C70.1,13.8,68.7,14.4,66,14.4z" fill="#0079C1" />
                <path d="M83,2.4L73.9,25.2h4.6l1.8-4.6h5.7l0.8,4.6h4.6L87.8,2.4H83z M86.4,15.6h-4.1l2.1-5.3L86.4,15.6z" fill="#00457C" />
                <path d="M96,2.4v22.8h4V2.4H96z" fill="#0079C1" />
              </svg>
            </div>

            {paypalLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div className="spin-big" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #0070ba', borderRadius: '50%', width: '40px', height: '40px', display: 'inline-block' }}></div>
                <p style={{ marginTop: '1.5rem', color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Processing secure transaction...</p>
              </div>
            ) : (
              <>
                {paypalStep === 'login' ? (
                  <div className="paypal-modal-body fade-in">
                    <h3 className="paypal-modal-title">Pay with PayPal</h3>
                    <p className="paypal-modal-sub">Enter your credentials to access your PayPal wallet.</p>

                    <div className="paypal-input-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        placeholder="name@example.com"
                      />
                    </div>
                    <div className="paypal-input-group">
                      <label>Password</label>
                      <input
                        type="password"
                        value={paypalPassword}
                        onChange={e => setPaypalPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <button className="paypal-btn-primary" onClick={handlePayPalLogin}>Log In</button>
                    <button className="paypal-btn-secondary" onClick={() => setPaypalModalOpen(false)}>Cancel</button>
                  </div>
                ) : (
                  <div className="paypal-modal-body fade-in">
                    <h3 className="paypal-modal-title" style={{ textAlign: 'left', marginBottom: '1rem', fontSize: '1rem' }}>Review your payment</h3>

                    <div className="paypal-details-panel">
                      <div className="paypal-details-row">
                        <span>Merchant</span>
                        <span style={{ fontWeight: 600 }}>Miru Store</span>
                      </div>
                      <div className="paypal-details-row">
                        <span>Shipping to</span>
                        <span style={{ fontWeight: 600 }}>{address.street}, {address.city}</span>
                      </div>
                      <div className="paypal-details-row">
                        <span>Total amount</span>
                        <span style={{ fontWeight: 700 }}>₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="paypal-input-group" style={{ marginBottom: '1.25rem' }}>
                      <label>Funding Source</label>
                      <div className="paypal-funding-source">
                        <input type="radio" defaultChecked id="pp-bal" name="funding" />
                        <label htmlFor="pp-bal" className="paypal-funding-info" style={{ cursor: 'pointer', marginLeft: '6px' }}>
                          <span className="paypal-funding-title">PayPal Balance</span>
                          <span className="paypal-funding-sub">Available: ₹25,480.00</span>
                        </label>
                      </div>
                    </div>

                    <button className="paypal-btn-primary" onClick={handlePayPalPayment}>Pay Now</button>
                    <button className="paypal-btn-secondary" onClick={() => setPaypalStep('login')}>Back</button>
                  </div>
                )}
              </>
            )}

            <div className="paypal-modal-footer">
              🔒 Secure SSL Encrypted Connection by PayPal Inc.
            </div>
          </div>
        </div>
      )}

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

      {/* Payment details error popup modal */}
      {paymentError && (
        <div className="paypal-modal-overlay" style={{ zIndex: 300 }}>
          <div className="paypal-modal" style={{ width: '360px', padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '3.5rem', color: 'var(--red)', marginBottom: '0.75rem' }}>✕</div>
            <h3 style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--ink)' }}>Payment Details Error</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {paymentError}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', borderRadius: '8px' }} 
              onClick={() => setPaymentError(null)}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
