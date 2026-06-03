import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const api = useApi(null);

  const subscribe = async () => {
    if (!email) return;
    const data = await api.post('/newsletter', { email });
    if (data.success) { 
      setDone(true); 
      showToast('Subscribed! Thank you.'); 
    } else {
      showToast(data.error || 'Already subscribed!');
    }
  };

  return (
    <div className="newsletter-strip">
      <div className="newsletter-inner">
        <h3>Newsletter</h3>
        <p>Sign up for new arrivals and exclusive offers — delivered right to your inbox.</p>
        {done ? (
          <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>Thank you for subscribing! ✓</p>
        ) : (
          <div className="newsletter-form">
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="your@email.com" 
              type="email" 
            />
            <button onClick={subscribe}>Subscribe</button>
          </div>
        )}
      </div>
    </div>
  );
}
