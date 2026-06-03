import React, { useState, useEffect } from 'react';

export default function ScrollToTopFAB() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <button className={`fab-top ${visible ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top">
      ↑
    </button>
  );
}
