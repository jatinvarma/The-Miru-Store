import React from 'react';

export default function PrivacyPolicy({ onBackToShop }) {
  return (
    <div className="policy-section fade-in">
      <div className="policy-header">
        <span className="policy-subtitle">PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p>We respect your privacy and are committed to protecting the personal data you share with us.</p>
      </div>

      <div className="policy-grid">
        <div className="policy-block">
          <h2>Information We Collect</h2>
          <p>
            When you visit the MIRU store, register an account, or complete a checkout, we collect specific details to process your transaction and provide a seamless experience:
          </p>
          <ul>
            <li><strong>Personal details:</strong> Name, email address, phone number, and billing/shipping addresses.</li>
            <li><strong>Authentication details:</strong> Secure passwords and session tokens (JWT) to manage your active login sessions.</li>
            <li><strong>Transaction information:</strong> Details of products purchased, order values, and time of transaction. We do not store credit card details on our servers.</li>
          </ul>
        </div>

        <div className="policy-block">
          <h2>How We Use Your Data</h2>
          <p>
            The information we collect is utilized strictly for:
          </p>
          <ul>
            <li>Fulfilling orders, delivering products, and updating you on your shipping status.</li>
            <li>Managing your user account, wishlist, and shopping cart items.</li>
            <li>Providing client support and responding to contact inquiries.</li>
            <li>Sending newsletter updates, brand news, or promotions, provided you have opted in. You can unsubscribe at any time.</li>
          </ul>
        </div>

        <div className="policy-block">
          <h2>Data Security</h2>
          <p>
            We implement high-industry-standard security measures to safeguard your personal data. 
            All client data is encrypted in transit using Secure Socket Layer (SSL) technology, and account passwords are encrypted in our database using secure hashing algorithms (bcrypt).
          </p>
        </div>

        <div className="policy-block">
          <h2>Cookies &amp; Local Storage</h2>
          <p>
            MIRU uses local browser storage and cookies to maintain your shopping cart items, save wishlist records, keep you signed in across page transitions, and remember your interface preferences (such as light or dark theme). No tracking or profiling cookies are shared with third-party advertising platforms.
          </p>
        </div>

        <div className="policy-block">
          <h2>Third-Party Services</h2>
          <p>
            We do not sell, rent, or trade your personal information. We only share essential data with trusted partners to operate our store, such as logistics partners for shipping and payment processors for transaction handling.
          </p>
        </div>

        <div className="policy-block">
          <h2>Your Rights</h2>
          <p>
            You have the right to request access to the personal data we store about you, update incorrect details, or request that your personal information be deleted completely from our system. If you wish to make any requests, please contact us at <strong>privacy@miru.co</strong>.
          </p>
        </div>
      </div>

      <div className="policy-footer">
        <h3>Questions about your data?</h3>
        <p>If you have any questions regarding this policy or how your details are handled, please contact privacy@miru.co.</p>
        <button className="btn btn-primary" onClick={onBackToShop}>Back to Shop</button>
      </div>
    </div>
  );
}
