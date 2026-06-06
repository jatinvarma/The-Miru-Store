import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

const ORDER_STEPS = ['confirmed', 'packed', 'shipped', 'delivered'];

function OrderTimeline({ status }) {
  const idx = ORDER_STEPS.indexOf(status);
  const cancelled = status === 'cancelled';

  if (cancelled) {
    return <div className="order-timeline-cancelled">This order has been cancelled</div>;
  }

  // Calculate percentage progress track width
  const progressPct = idx >= 0 ? (idx / (ORDER_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="order-timeline">
      <div className="order-timeline-progress" style={{ width: `${progressPct}%` }} />
      {ORDER_STEPS.map((s, i) => {
        const isCompleted = i < idx;
        const isActive = i === idx;
        return (
          <div key={s} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
            <div className="timeline-bubble">
              {isCompleted ? '✓' : isActive ? '●' : i + 1}
            </div>
            <div className="timeline-label" style={{ textTransform: 'capitalize' }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
}

function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const api = useApi(token);

  const load = () => { 
    setLoading(true); 
    api.get('/orders').then(d => { 
      setOrders(Array.isArray(d) ? d : []); 
      setLoading(false); 
    }); 
  };

  useEffect(() => { 
    load(); 
  }, []);

  const cancelOrder = async (id) => {
    const data = await api.put(`/orders/${id}/cancel`, {});
    if (data.success) { 
      showToast('Order cancelled'); 
      load(); 
    } else {
      showToast(data.error || 'Cannot cancel this order');
    }
  };

  return (
    <div className="orders-section fade-in">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Order History</h2>
      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No orders yet. Start shopping!</p>
      ) : (
        orders.map(o => {
          let address = {}, details = {};
          try { address = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address || {}; } catch (e) {}
          try { details = typeof o.payment_details === 'string' ? JSON.parse(o.payment_details) : o.payment_details || {}; } catch (e) {}
          
          const itemsCount = o.items ? o.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          const isExpanded = expandedOrderId === o.id;

          return (
            <div 
              className={`premium-order-card fade-in ${!isExpanded ? 'collapsed' : ''}`} 
              key={o.id}
              onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
            >
              {/* Collapsed/Summary Row view */}
              <div className="premium-order-summary-row">
                <div className="order-summary-left">
                  <div>
                    <div className="premium-order-id">ORDER #{String(o.id).padStart(5, '0')}</div>
                    <div className="premium-order-date">
                      {new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', background: 'var(--bg2)', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="order-summary-right">
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--ink)', marginRight: '0.5rem' }}>
                    Total: ₹{parseFloat(o.total).toFixed(2)}
                  </div>
                  <span className={`premium-order-status ${o.status}`}>{o.status}</span>
                  <span className={`expand-chevron ${isExpanded ? 'rotated' : ''}`} style={{ marginLeft: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Expanded contents */}
              {isExpanded && (
                <div className="premium-order-expandable-content" onClick={(e) => e.stopPropagation()}>
                  <OrderTimeline status={o.status} />
                  <div className="premium-order-body">
                    <div className="premium-order-items">
                      <div className="premium-order-label">Items</div>
                      {o.items.map((i, n) => (
                        <div className="premium-order-item" key={n}>
                          <span>{i.quantity} × {i.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="premium-order-details">
                      <div className="premium-order-label">Details</div>
                      {o.payment_method && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Payment:</strong> {o.payment_method.replace('_', ' ').toUpperCase()}
                          {o.payment_method === 'credit_card' && details.cardNumber ? ` (ending ${details.cardNumber.slice(-4)})` : ''}
                          {o.payment_method === 'upi' && details.upiId ? ` (${details.upiId})` : ''}
                        </div>
                      )}
                      {o.discount_amount > 0 && (
                        <div style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
                          <strong>Discount:</strong> -₹{parseFloat(o.discount_amount).toFixed(2)}
                        </div>
                      )}
                      {address.street && (
                        <div>
                          <strong>Ship to:</strong><br />
                          {address.street}, {address.city} {address.zip}
                        </div>
                      )}
                    </div>
                  </div>
                  {['confirmed', 'packed'].includes(o.status) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelOrder(o.id);
                        }} 
                        style={{ 
                          fontSize: '0.72rem', 
                          padding: '8px 16px', 
                          background: 'transparent', 
                          border: '1px solid var(--red)', 
                          color: 'var(--red)', 
                          cursor: 'pointer', 
                          borderRadius: '6px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function Profile({ token, user, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const api = useApi(token);

  const save = async () => {
    setLoading(true);
    const data = await api.put('/auth/profile', { name });
    setLoading(false);
    if (data.token) { 
      onUpdate(data.token, data.user); 
      showToast('Profile updated!'); 
    } else {
      showToast(data.error || 'Error updating profile');
    }
  };

  const changePw = async () => {
    if (!curPw || !newPw) { showToast('Please fill both password fields'); return; }
    setPwLoading(true);
    const data = await api.put('/auth/password', { currentPassword: curPw, newPassword: newPw });
    setPwLoading(false);
    if (data.success) { 
      showToast('Password changed!'); 
      setCurPw(''); 
      setNewPw(''); 
    } else {
      showToast(data.error || 'Error changing password');
    }
  };

  return (
    <div className="profile-section fade-in">
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Profile Details</h2>
      <div className="profile-grid">
        <div className="settings-card">
          <div className="settings-header">
            <div className="settings-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{user?.name}</div>
              <div style={{ color: 'var(--ink-soft)' }}>Member</div>
            </div>
          </div>
          <div className="form-field">
            <label>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={save} 
            disabled={loading} 
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="settings-card">
          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Change Password</div>
          <div className="form-field">
            <label>Current Password</label>
            <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-field">
            <label>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
          </div>
          <button 
            className="btn btn-outline" 
            onClick={changePw} 
            disabled={pwLoading} 
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountDashboard({ token, user, page, setPage, onUpdate }) {
  if (!user) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-soft)' }}>Please sign in to view your account.</div>;
  const isProfile = page === 'profile';
  
  return (
    <div className="account-layout fade-in">
      <aside className="account-sidebar">
        <h3>My Account</h3>
        <div className="account-sidebar-profile-card">
          <div className="account-sidebar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="account-sidebar-name">{user?.name}</div>
          <div className="account-sidebar-email">{user?.email}</div>
        </div>
        <nav className="account-nav">
          <button className={!isProfile ? 'active' : ''} onClick={() => setPage('orders')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Order History
          </button>
          <button className={isProfile ? 'active' : ''} onClick={() => setPage('profile')}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Profile Details
          </button>
        </nav>
      </aside>
      <main className="account-content">
        {!isProfile ? <Orders token={token} /> : <Profile token={token} user={user} onUpdate={onUpdate} />}
      </main>
    </div>
  );
}
