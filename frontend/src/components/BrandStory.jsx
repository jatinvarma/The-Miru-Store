import React from 'react';

const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
    ),
    num: '01',
    title: 'Honest Materials',
    desc: 'Solid brass, raw ceramics, pure linen. Every material is chosen for how it ages, not how it looks on day one.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    num: '02',
    title: 'Slow Production',
    desc: 'We partner with small workshops and independent makers who believe the process matters as much as the product.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    num: '03',
    title: 'Curated Intent',
    desc: 'We only stock things we love and use ourselves. Every product passes through our studio before landing in yours.',
  },
];

export default function BrandStory() {
  return (
    <section className="brand-story-section">
      <div className="brand-story-inner">
        {/* Left: Text */}
        <div className="brand-story-text">
          <span className="brand-story-eyebrow">Our Philosophy</span>
          <h2 className="brand-story-heading">
            Objects deserve to<br />
            <em>outlast</em> the trend.
          </h2>
          <p className="brand-story-body">
            MIRU was founded on a single conviction: everyday objects should be beautiful without trying. No gimmicks, no fast fashion cycles. Just honest craftsmanship, carefully curated and meant to last.
          </p>
          <div className="brand-story-stat-row">
            <div className="brand-story-stat">
              <span className="brand-story-stat-num">200+</span>
              <span className="brand-story-stat-label">Artisan partners</span>
            </div>
            <div className="brand-story-stat">
              <span className="brand-story-stat-num">14</span>
              <span className="brand-story-stat-label">Countries sourced</span>
            </div>
            <div className="brand-story-stat">
              <span className="brand-story-stat-num">3</span>
              <span className="brand-story-stat-label">Simple values</span>
            </div>
          </div>
        </div>

        {/* Right: Value Cards */}
        <div className="brand-story-values">
          {VALUES.map((v) => (
            <div className="brand-value-card" key={v.num}>
              <div className="brand-value-icon">{v.icon}</div>
              <div className="brand-value-body">
                <div className="brand-value-num">{v.num}</div>
                <h3 className="brand-value-title">{v.title}</h3>
                <p className="brand-value-desc">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
