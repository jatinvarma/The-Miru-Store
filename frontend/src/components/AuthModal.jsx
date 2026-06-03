import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { showToast } from '../utils/toast';

export default function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const api = useApi(null);

  const submit = async () => {
    setError(''); 
    setLoading(true);
    const body = mode === 'register' ? { name, email, password } : { email, password };
    const data = await api.post(`/auth/${mode}`, body);
    setLoading(false);
    
    if (data.error) { 
      setError(data.error); 
      return; 
    }
    
    onLogin(data.token, data.user);
    showToast(`Welcome, ${data.user.name}!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <p className="modal-sub">{mode === 'login' ? 'Welcome back to MIRU.' : 'Join MIRU to start collecting.'}</p>
        {error && <div className="form-error" style={{ marginBottom: '1rem', padding: '8px', background: '#fdf0ef' }}>{error}</div>}
        {mode === 'register' && <div className="form-field"><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>}
        <div className="form-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" /></div>
        <div className="form-field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <div className="modal-switch">{mode === 'login' ? <>No account? <button onClick={() => setMode('register')}>Create one</button></> : <>Already a member? <button onClick={() => setMode('login')}>Sign in</button></>}</div>
      </div>
    </div>
  );
}
