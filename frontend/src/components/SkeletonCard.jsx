import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="skeleton-card skeleton-pulse">
      <div className="skeleton skeleton-img" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line med" />
      <div className="skeleton skeleton-line" />
      <div style={{ height: '2rem' }} />
    </div>
  );
}
