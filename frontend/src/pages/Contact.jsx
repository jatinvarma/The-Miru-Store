import React, { useState } from 'react';
import useApi from '../hooks/useApi';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi(null);

  const submit = async () => {
    setError(''); 
    setSuccess(''); 
    setLoading(true);
    const data = await api.post('/contact', form);
    setLoading(false);
    
    if (data.error) { 
      setError(data.error); 
      return; 
    }
    setSuccess(data.message);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="contact-section fade-in">
      <div className="contact-inner">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>We're a small team with strong opinions about beautiful things. Questions, custom orders, collaboration — we'd love to hear from you.</p>
          <div className="contact-detail"><span>Email</span><p>hello@miru.co</p></div>
          <div className="contact-detail"><span>Hours</span><p>Mon–Fri, 9am–6pm</p></div>
          <div className="contact-detail"><span>Response time</span><p>Within 24 hours</p></div>
        </div>
        <div>
          {success && <div className="form-success">{success}</div>}
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div className="form-field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" /></div>
          <div className="form-field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" /></div>
          <div className="form-field"><label>Subject</label><input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="What's this about?" /></div>
          <div className="form-field"><label>Message</label><textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us..." /></div>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
        </div>
      </div>
    </div>
  );
}
