import React, { useState } from 'react';
import useApi from '../hooks/useApi';

const FAQS = [
  {
    id: 1,
    q: 'Do you offer worldwide shipping?',
    a: 'Yes, we ship to most locations worldwide. Standard international shipping takes 7–14 business days, and premium express delivery takes 3–5 business days.'
  },
  {
    id: 2,
    q: 'What is your return policy?',
    a: 'We accept returns on all unused products in their original packaging within 30 days of receipt. Return shipping costs are covered by the buyer unless the item is defective.'
  },
  {
    id: 3,
    q: 'Can I request custom sizes or bespoke edits?',
    a: 'Absolutely. We love collaborating on custom orders and tailor-made sizes. Select "Custom Design" as your inquiry type or email hello@miru.co with your specifications.'
  },
  {
    id: 4,
    q: 'How can I track my order status?',
    a: 'Once your order is shipped, you will receive a tracking link via email. You can also view real-time tracking progress directly in your customer Account Dashboard.'
  }
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState(null);
  const [inquiryType, setInquiryType] = useState('general');
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
    setInquiryType('general');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@miru.co');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="contact-section fade-in">
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>We're a small team with strong opinions about beautiful things. Questions, custom orders, collaborations — we'd love to hear from you.</p>
      </div>
      <div className="contact-inner">
        <div className="contact-left">
          <div className="contact-info-cards">
            {/* Email Card */}
            <div className="contact-info-card">
              <span className={`contact-tooltip ${copied ? 'visible' : ''}`}>Copied!</span>
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="contact-card-label">Email Support</div>
              <div className="contact-copy-wrapper">
                <span className="contact-card-value">hello@miru.co</span>
                <button className="contact-copy-btn" onClick={copyEmail} title="Copy Email">
                  <svg viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Hours Card */}
            <div className="contact-info-card">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="contact-card-label">Business Hours</div>
              <div className="contact-card-value">Mon–Fri, 9am–6pm</div>
            </div>

            {/* Response Time Card */}
            <div className="contact-info-card">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="contact-card-label">Response Time</div>
              <div className="contact-card-value">Within 24 hours</div>
            </div>

            {/* Showroom/Location Card */}
            <div className="contact-info-card">
              <div className="contact-card-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="contact-card-label">Our Showroom</div>
              <div className="contact-card-value">120 Minimalist Way, Tokyo</div>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="contact-faq-section">
            <h3>Frequently Asked Questions</h3>
            <div className="contact-faq-list">
              {FAQS.map(faq => {
                const isOpen = activeFaqId === faq.id;
                return (
                  <div className="contact-faq-item" key={faq.id}>
                    <button 
                      className={`contact-faq-trigger ${isOpen ? 'active' : ''}`}
                      onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                    >
                      <span>{faq.q}</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    <div className={`contact-faq-content ${isOpen ? 'open' : ''}`}>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-container">
          <h3>Send a Message</h3>
          
          {/* Inquiry type selectors */}
          <div className="contact-inquiry-types">
            {[
              { id: 'general', label: 'General Info' },
              { id: 'order', label: 'Order Inquiry' },
              { id: 'collaboration', label: 'Collaboration' },
              { id: 'custom', label: 'Custom Design' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                className={`contact-inquiry-type-btn ${inquiryType === type.id ? 'active' : ''}`}
                onClick={() => {
                  setInquiryType(type.id);
                  set('subject', `[${type.label}] `);
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          {success && <div className="form-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}
          {error && <div className="form-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          <div className="form-field">
            <label>Name</label>
            <input 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
              placeholder="Your name" 
            />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => set('email', e.target.value)} 
              placeholder="your@email.com" 
            />
          </div>

          <div className="form-field">
            <label>Subject</label>
            <input 
              value={form.subject} 
              onChange={e => set('subject', e.target.value)} 
              placeholder="What's this about?" 
            />
          </div>

          <div className="form-field">
            <label>Message</label>
            <textarea 
              value={form.message} 
              onChange={e => set('message', e.target.value)} 
              placeholder="Tell us..." 
              rows="5"
              style={{ minHeight: '120px', resize: 'vertical' }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={submit} 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <span>Send Message</span>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s' }} className="send-arrow">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
