import React from 'react';
import Hero from '../components/Hero';
import CategoryShowcase from '../components/CategoryShowcase';
import Products from '../components/Products';
import Newsletter from '../components/Newsletter';
import Contact from './Contact';

export default function Home({ token, onAddToCart, onAuthRequired, wishIds, onWishToggle, activeCategory, setActiveCategory }) {
  const scrollShopIntoView = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    scrollShopIntoView();
  };

  return (
    <div className="home-page">
      <Hero onShop={scrollShopIntoView} />
      <CategoryShowcase onCategorySelect={handleCategorySelect} />
      <Products 
        token={token} 
        onAddToCart={onAddToCart} 
        onAuthRequired={onAuthRequired} 
        wishIds={wishIds} 
        onWishToggle={onWishToggle} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />
      <Newsletter />
      <Contact />
    </div>
  );
}
