import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

export default function AdminPanel({ token }) {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const api = useApi(token);

  const loadStats = () => {
    api.get('/admin/stats').then(d => { 
      if (!d.error) setStats(d); 
    });
  };

  useEffect(() => { 
    loadStats(); 
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.put(`/admin/orders/${orderId}/status`, { status });
    loadStats();
    showToast('Order status updated!');
  };

  if (!stats) return <div style={{ padding: '4rem', textAlign: 'center' }}><p>Loading admin panel...</p></div>;

  return (
    <div className="admin-section fade-in">
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Admin Dashboard</h2>
      
      {/* Navigation tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {['overview', 'products', 'coupons', 'messages', 'newsletter'].map(t => (
          <button 
            key={t} 
            className={tab === t ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} 
            onClick={() => setTab(t)} 
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="fade-in">
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-val">₹{parseFloat(stats.totalRevenue).toFixed(0)}</div><div className="stat-label">Revenue</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalOrders}</div><div className="stat-label">Orders</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalUsers}</div><div className="stat-label">Users</div></div>
            <div className="stat-card"><div className="stat-val">{stats.totalProducts}</div><div className="stat-label">Products</div></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Orders</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--gold)' }}>#{String(o.id).padStart(5, '0')}</td>
                    <td>{o.user_name}<br /><span style={{ color: 'var(--ink-soft)', fontSize: '0.7rem' }}>{o.user_email}</span></td>
                    <td>{o.items.slice(0, 2).map(i => i.name).join(', ')}{o.items.length > 2 ? '...' : ''}</td>
                    <td>₹{parseFloat(o.total).toFixed(2)}</td>
                    <td>{o.payment_method.replace('_', ' ').toUpperCase()}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <select 
                        className="status-select" 
                        value={o.status} 
                        onChange={e => updateStatus(o.id, e.target.value)}
                      >
                        {['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {tab === 'products' && <AdminProducts api={api} />}
      {tab === 'coupons' && <AdminCoupons api={api} />}
      {tab === 'messages' && <AdminMessages api={api} />}
      {tab === 'newsletter' && <AdminNewsletter api={api} />}
    </div>
  );
}

function AdminProducts({ api }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const CATS = ['Accessories', 'Home', 'Kitchen', 'Apparel', 'Furniture', 'Workspace', 'Tech', 'Wellness'];
  const blank = { name: '', description: '', price: '', image: '', category: 'Accessories', stock: 100, is_new: false, is_sale: false, sale_price: '' };
  const [form, setForm] = useState(blank);

  const load = () => api.get('/admin/products').then(d => setProducts(Array.isArray(d) ? d : []));
  
  useEffect(() => { 
    load(); 
  }, []);

  const openNew = () => { setForm(blank); setEditing('new'); };
  const openEdit = (p) => { 
    setForm({ 
      ...p, 
      is_new: !!p.is_new, 
      is_sale: !!p.is_sale, 
      sale_price: p.sale_price || '' 
    }); 
    setEditing(p.id); 
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    showToast('Uploading image...');
    
    const res = await api.postMultipart('/admin/upload', formData);
    setUploadingImage(false);

    if (res.url) {
      // Prepend API Server Host
      const fullUrl = `http://localhost:3001${res.url}`;
      setForm(f => ({ ...f, image: fullUrl }));
      showToast('Image uploaded successfully!');
    } else {
      showToast(res.error || 'Failed to upload image');
    }
  };

  const save = async () => {
    if (!form.name || !form.price) {
      showToast('Name and price are required');
      return;
    }
    const payload = { 
      ...form, 
      price: parseFloat(form.price), 
      stock: parseInt(form.stock), 
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null 
    };
    
    const r = editing === 'new' 
      ? await api.post('/admin/products', payload) 
      : await api.put(`/admin/products/${editing}`, payload);
      
    if (r.error) { 
      showToast(r.error); 
      return; 
    }
    showToast(editing === 'new' ? 'Product added!' : 'Product updated!'); 
    setEditing(null); 
    load();
  };

  const del = async (id) => { 
    if (!confirm('Delete this product?')) return; 
    await api.del(`/admin/products/${id}`); 
    showToast('Deleted'); 
    load(); 
  };

  return (
    <div style={{ marginTop: '1rem' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem' }}>Products</h3>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Product</button>
      </div>
      
      {editing && (
        <div className="settings-card fade-in" style={{ marginBottom: '2rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{editing === 'new' ? 'New Product' : 'Edit Product'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            
            <div className="form-field"><label>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-field"><label>Price (₹)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div className="form-field"><label>Stock</label><input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
            
            <div className="form-field">
              <label>Image URL</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  placeholder="Image URL" 
                  value={form.image} 
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))} 
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  disabled={uploadingImage}
                  style={{ padding: '0 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  onClick={() => document.getElementById('admin-file-upload').click()}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload'}
                </button>
                <input 
                  type="file" 
                  id="admin-file-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>
            </div>

            <div className="form-field"><label>Sale Price (optional)</label><input type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} /></div>
            <div className="form-field">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', background: 'var(--bg)', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="checkbox" checked={form.is_new} onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} /> New
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="checkbox" checked={form.is_sale} onChange={e => setForm(f => ({ ...f, is_sale: e.target.checked }))} /> On Sale
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
      
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thumbnail</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--gold)' }}>#{p.id}</td>
                <td>
                  <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                </td>
                <td style={{ fontWeight: '500' }}>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{p.price}</td>
                <td style={{ color: p.stock === 0 ? 'var(--red)' : p.stock <= 5 ? 'orange' : 'inherit', fontWeight: p.stock <= 5 ? 'bold' : 'normal' }}>
                  {p.stock}
                </td>
                <td>{p.is_new ? '🆕' : ''}{p.is_sale ? '🏷️' : ''}</td>
                <td>
                  <button onClick={() => openEdit(p)} style={{ marginRight: '0.5rem', fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '3px' }}>Edit</button>
                  <button onClick={() => del(p.id)} style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', borderRadius: '3px' }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCoupons({ api }) {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/admin/coupons').then(d => setCoupons(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
  }, []);

  const createCoupon = async (e) => {
    e.preventDefault();
    if (!code || !discountPct) {
      showToast('Please fill all fields');
      return;
    }
    setLoading(true);
    const res = await api.post('/admin/coupons', { code, discount_pct: discountPct });
    setLoading(false);
    if (res.error) {
      showToast(res.error);
    } else {
      showToast('Coupon created!');
      setCode('');
      setDiscountPct('');
      load();
    }
  };

  const toggleStatus = async (id) => {
    const res = await api.put(`/admin/coupons/${id}/toggle`, {});
    if (res.success) {
      showToast(`Coupon status toggled!`);
      load();
    } else {
      showToast(res.error || 'Failed to toggle status');
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon code permanently?')) return;
    const res = await api.del(`/admin/coupons/${id}`);
    if (res.success) {
      showToast('Coupon deleted');
      load();
    } else {
      showToast(res.error || 'Failed to delete');
    }
  };

  return (
    <div style={{ marginTop: '1rem' }} className="fade-in">
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Coupon Manager</h3>
      
      {/* Create Coupon Form */}
      <div className="settings-card" style={{ marginBottom: '2rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '1rem' }}>Create New Coupon</div>
        <form onSubmit={createCoupon} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Code (e.g. SUMMER30)</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUMMER30" />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Discount Percentage (1-100)</label>
            <input type="number" min="1" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="30" />
          </div>
          <button className="btn btn-primary" style={{ padding: '12px 24px' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Discount Percentage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id}>
                <td style={{ color: 'var(--gold)' }}>#{c.id}</td>
                <td style={{ fontWeight: '600', letterSpacing: '0.05em' }}>{c.code}</td>
                <td>{c.discount_pct}%</td>
                <td>
                  <span className={`premium-order-status ${c.active === 1 ? 'delivered' : 'cancelled'}`} style={{ textTransform: 'capitalize' }}>
                    {c.active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => toggleStatus(c.id)} 
                    style={{ marginRight: '0.5rem', fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '3px' }}
                  >
                    {c.active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => deleteCoupon(c.id)} 
                    style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer', borderRadius: '3px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>No coupons created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMessages({ api }) {
  const [msgs, setMsgs] = useState([]);
  
  useEffect(() => { 
    api.get('/admin/messages').then(d => setMsgs(Array.isArray(d) ? d : [])); 
  }, []);

  return (
    <div style={{ marginTop: '1rem' }} className="fade-in">
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Contact Messages ({msgs.length})</h3>
      {msgs.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No messages yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {msgs.map(m => (
            <div key={m.id} className="settings-card fade-in" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.4rem' }}>
                <div style={{ fontWeight: 600 }}>{m.name} <span style={{ color: 'var(--ink-soft)', fontWeight: 400, fontSize: '0.8rem' }}>({m.email})</span></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
              {m.subject && <div style={{ fontSize: '0.78rem', color: 'var(--gold)', marginBottom: '0.35rem' }}>{m.subject}</div>}
              <div style={{ fontSize: '0.82rem' }}>{m.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminNewsletter({ api }) {
  const [subs, setSubs] = useState([]);
  
  useEffect(() => { 
    api.get('/admin/newsletter').then(d => setSubs(Array.isArray(d) ? d : [])); 
  }, []);

  return (
    <div style={{ marginTop: '1rem' }} className="fade-in">
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Newsletter Subscribers ({subs.length})</h3>
      {subs.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No subscribers yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Subscribed Date</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: '500' }}>{s.email}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
