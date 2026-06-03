import React from 'react';

export default function CategoryShowcase({ onCategorySelect }) {
  const categories = [
    { title: 'Accessories', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600' },
    { title: 'Home', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600' },
    { title: 'Kitchen', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600' },
    { title: 'Apparel', img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
    { title: 'Furniture', img: '/img/cat_furniture_1776352020444.png' },
    { title: 'Workspace', img: '/img/cat_workspace_1776352038213.png' },
    { title: 'Tech', img: '/img/cat_tech_1776352060324.png' },
    { title: 'Wellness', img: '/img/cat_wellness_1776352078553.png' },
  ];
  
  return (
    <div className="category-showcase">
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Shop by Category</h2>
      <div className="category-grid">
        {categories.map(c => (
          <div key={c.title} className="category-card" onClick={() => onCategorySelect(c.title)}>
            <img src={c.img} alt={c.title} loading="lazy" />
            <div className="category-card-title">{c.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
