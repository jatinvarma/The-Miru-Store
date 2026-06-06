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
          return (
            <div className="premium-order-card fade-in" key={o.id}>
              <div className="premium-order-header">
                <div>
                  <div className="premium-order-id">ORDER #{String(o.id).padStart(5, '0')}</div>
                  <div className="premium-order-date">{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <span className={`premium-order-status ${o.status}`}>{o.status}</span>
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="premium-order-total">Total: ₹{parseFloat(o.total).toFixed(2)}</div>
                {['confirmed', 'packed'].includes(o.status) && (
                  <button 
                    onClick={() => cancelOrder(o.id)} 
                    style={{ 
                      fontSize: '0.72rem', 
                      padding: '6px 14px', 
                      background: 'transparent', 
                      border: '1px solid var(--red)', 
                      color: 'var(--red)', 
                      cursor: 'pointer', 
                      borderRadius: '4px' 
                    }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
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
      <div className="settings-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Change Password</div>
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
  );
}

export default function AccountDashboard({ token, user, page, setPage, onUpdate }) {
  if (!user) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-soft)' }}>Please sign in to view your account.</div>;
  const isProfile = page === 'profile';
  
  return (
    <div className="account-layout fade-in">
      <aside className="account-sidebar">
        <h3>My Account</h3>
        <nav className="account-nav">
          <button className={!isProfile ? 'active' : ''} onClick={() => setPage('orders')}>Order History</button>
          <button className={isProfile ? 'active' : ''} onClick={() => setPage('profile')}>Profile Details</button>
        </nav>
      </aside>
      <main className="account-content">
        {!isProfile ? <Orders token={token} /> : <Profile token={token} user={user} onUpdate={onUpdate} />}
      </main>
    </div>
  );
}
