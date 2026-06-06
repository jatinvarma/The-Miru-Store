import React from 'react';

export default function About({ onExplore }) {
  return (
    <div className="about-section fade-in">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero-content">
          <span className="about-subtitle">OUR PHILOSOPHY</span>
          <h1>A thoughtful approach to modern living.</h1>
          <p>We believe in curating objects of simple design, honest materials, and lasting utility.</p>
        </div>
      </div>

      {/* Story Section */}
      <div className="about-story-grid">
        <div className="about-story-text">
          <h2>Our Story</h2>
          <p>
            MIRU was born out of a desire to escape the noise of mass-produced, disposable products. We found ourselves searching for everyday tools that weren't just functional, but also possessed a quiet beauty.
          </p>
          <p>
            What began as a personal quest has evolved into a curated store. We partner with independent artisans, multigenerational workshops, and designer-makers who share our obsession with detail and quality.
          </p>
          <p>
            Each object in our collection has a story to tell—about the hands that shaped it, the materials it's made from, and the longevity it promises.
          </p>
        </div>
        <div className="about-story-image">
          <img src="/img/sculptural_vase_1776351756955.png" alt="Sculptural Vase on display" />
          <div className="about-image-overlay">
            <span>MIRU STUDIO</span>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="about-values">
        <div className="about-values-header">
          <h2>Guided by Intent</h2>
          <p>We are driven by three simple principles that govern everything we curate and sell.</p>
        </div>
        <div className="about-values-grid">
          <div className="value-card">
            <div className="value-num">01</div>
            <h3>Simple Design</h3>
            <p>Forms that serve a purpose. We believe that stripping away the unnecessary reveals the true essence of an object.</p>
          </div>
          <div className="value-card">
            <div className="value-num">02</div>
            <h3>Honest Materials</h3>
            <p>Solid brass, raw ceramics, pure washed linen, and sustainably sourced walnut. Materials that age gracefully over time.</p>
          </div>
          <div className="value-card">
            <div className="value-num">03</div>
            <h3>Conscious Craft</h3>
            <p>Supporting independent studios and small-batch manufacturers who prioritize fair wages and slow production.</p>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="about-process-section">
        <div className="about-process-inner">
          <div className="about-process-image">
            <img src="/img/glass_carafe_1776351788243.png" alt="Glass Carafe details" />
          </div>
          <div className="about-process-content">
            <h2>The Curation Process</h2>
            <div className="process-step">
              <span className="step-num">Discover</span>
              <p>We seek out makers worldwide—visiting small workshops, ceramic studios, and weaving mills to find genuine quality.</p>
            </div>
            <div className="process-step">
              <span className="step-num">Refine</span>
              <p>Before any product is added to MIRU, we test it in our own homes to evaluate its texture, weight, and durability.</p>
            </div>
            <div className="process-step">
              <span className="step-num">Curate</span>
              <p>We arrange our collection to be cohesive, ensuring that each object complements the other visually and functionally.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Founders & Studio Section */}
      <div className="about-founders-section">
        <div className="about-founders-inner">
          <div className="founders-header">
            <h2>The Minds Behind MIRU</h2>
            <p>We are a small team of curators, designers, and thinkers who believe that the spaces we inhabit shape how we feel.</p>
          </div>
          <div className="founders-grid">
            <div className="founder-card">
              <div className="founder-info">
                <h3>Jatin Kumar Varma</h3>
                <span className="founder-role">Co-Founder & Creative Director</span>
                <p>Jatin oversees our curations. With a background in architecture, he is drawn to architectural forms, raw textures, and silent aesthetics.</p>
              </div>
            </div>
            <div className="founder-card">
              <div className="founder-info">
                <h3>S Baba Fakruddin</h3>
                <span className="founder-role">Co-Founder & Head of Curation</span>
                <p>Baba works closely with our global artisan network. He travels to traditional woodshops and ceramic kilns to source authentic pieces.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Studio Section */}
      <div className="about-studio-section">
        <div className="about-studio-inner">
          <div className="about-studio-content">
            <h2>Our Kyoto Studio</h2>
            <p>
              Located in a quiet lane in Higashiyama, Kyoto, our studio is housed in a restored 1920s wooden machiya. It serves as our creative workspace, gallery showroom, and distribution hub.
            </p>
            <p>
              Every package is hand-wrapped and dispatched directly from our studio, wrapped in recycled craft paper and cotton string.
            </p>
            <div className="studio-details">
              <div className="studio-detail-item">
                <strong>Address</strong>
                <p>3-12 Yasaka Kami-machi, Higashiyama-ku, Kyoto 605-0827, Japan</p>
              </div>
              <div className="studio-detail-item">
                <strong>Showroom Hours</strong>
                <p>Fridays & Saturdays, 11:00 AM – 5:00 PM (By Appointment Only)</p>
              </div>
            </div>
          </div>
          <div className="about-studio-image">
            <img src="https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=600&fit=crop&q=80" alt="Inside MIRU Studio Kyoto" />
          </div>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="about-quote">
        <div className="quote-content">
          <blockquote>
            "Simplicity is not the lack of clutter, but the presence of clarity."
          </blockquote>
          <cite>— Miru Journal</cite>
        </div>
      </div>

      {/* Call to Action */}
      <div className="about-cta">
        <h2>Bring clarity to your space.</h2>
        <p>Explore our latest collection of curated objects for your home.</p>
        <button className="btn btn-primary" onClick={onExplore}>Explore Collection</button>
      </div>
    </div>
  );
}
