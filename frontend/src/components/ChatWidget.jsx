import React, { useState } from 'react';

const BOT_REPLIES = {
  'hello': "Hi! Welcome to MIRU. How can I help you today?",
  'hi': "Hello! Thanks for reaching out. What can I do for you?",
  'hey': "Hey there! How can I assist you with your shopping?",
  'order': "You can track your orders in the Orders page. Need help with a specific order?",
  'track': "To track your order, sign in and go to the Orders page. We'll show you the latest status!",
  'return': "We accept returns within 30 days of delivery. Email hello@miru.co to start the process.",
  'refund': "Refunds are processed within 5-7 business days after we receive your return. Email us for details.",
  'shipping': "We ship worldwide! Standard shipping takes 5-7 business days. Express shipping is available for faster delivery.",
  'delivery': "Delivery times vary by location. Standard: 5-7 days, Express: 2-3 days. Check your order status for updates.",
  'payment': "We accept Credit Card, UPI, PayPal, and Cash on Delivery. All payments are secure.",
  'coupon': "Try codes MIRU10, SAVE20, or FIRST50 for discounts! Apply them at checkout.",
  'discount': "Check out our coupon codes: MIRU10 (10% off), SAVE20 (20% off), FIRST50 (50% off first order).",
  'contact': "You can reach us at hello@miru.co or through the Contact page. We're here Mon–Fri, 9am–6pm.",
  'help': "I'm here to help! Ask about orders, shipping, payments, returns, or anything else.",
  'product': "Browse our amazing collection of furniture, decor, lighting, and more on the Shop page!",
  'price': "Prices vary by product. Check individual product pages for current pricing and any sales.",
  'sale': "We have great sales! Look for the 'Sale' badge on products. Use coupon SAVE20 for extra savings.",
  'warranty': "All our products come with a 1-year warranty. Contact us if you have any issues.",
  'size': "Product dimensions are listed on each product page. If you need help choosing, email us!",
  'custom': "For custom orders or special requests, please email hello@miru.co with details.",
  'support': "Our support team is here to help! Email hello@miru.co or use this chat.",
  'thank': "You're welcome! Happy shopping at MIRU. 😊",
  'bye': "Goodbye! Come back soon. Have a great day!",
  'default': "Thanks for your message! Our team will get back to you within 24 hours. You can also email hello@miru.co."
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    return JSON.parse(
      localStorage.getItem('miru_chat_messages') || 
      '[{"type":"bot","text":"👋 Hi! I\'m MIRU\'s assistant. Ask about orders, shipping, returns, or payments!"}]'
    );
  });
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input };
    const key = Object.keys(BOT_REPLIES).find(k => new RegExp('\\b' + k + '\\b', 'i').test(input)) || 'default';
    const botMsg = { type: 'bot', text: BOT_REPLIES[key] };
    const newMessages = [...messages, userMsg, botMsg];
    
    setMessages(newMessages);
    localStorage.setItem('miru_chat_messages', JSON.stringify(newMessages));
    setInput('');
  };

  const clearChat = () => {
    const initial = [{ type: 'bot', text: '👋 Hi! I\'m MIRU\'s assistant. Ask about orders, shipping, returns, or payments!' }];
    setMessages(initial);
    localStorage.setItem('miru_chat_messages', JSON.stringify(initial));
  };

  return (
    <div className="chat-bubble">
      {open && (
        <div className="chat-panel fade-in">
          <div className="chat-head">
            <h4>MIRU Support</h4>
            <div>
              <button onClick={clearChat} style={{ background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', fontSize: '1rem', marginRight: '0.5rem' }} title="Clear Chat">🗑️</button>
              <button onClick={() => setOpen(false)}>×</button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => <div key={i} className={`chat-msg ${m.type}`}>{m.text}</div>)}
          </div>
          <div className="chat-input-row">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask something..." onKeyDown={e => e.key === 'Enter' && send()} />
            <button onClick={send}>→</button>
          </div>
        </div>
      )}
      <button className="chat-btn" onClick={() => setOpen(o => !o)}>💬</button>
    </div>
  );
}
