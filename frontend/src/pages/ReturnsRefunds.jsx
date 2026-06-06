import React from 'react';

export default function ReturnsRefunds({ onBackToShop }) {
  return (
    <div className="policy-section fade-in">
      <div className="policy-header">
        <span className="policy-subtitle">RETURNS POLICY</span>
        <h1>Returns &amp; Exchanges</h1>
        <p>We want you to love what you bring into your home. If an object isn't the right fit, we welcome returns under the conditions below.</p>
      </div>

      <div className="policy-grid">
        <div className="policy-block">
          <h2>Return Window</h2>
          <p>
            You may request a return or exchange within <strong>14 days</strong> of receiving your order. 
            To initiate a return, please send an email to <strong>hello@miru.co</strong> with your order number and the item(s) you wish to return.
          </p>
        </div>

        <div className="policy-block">
          <h2>Return Conditions</h2>
          <p>
            To be eligible for a return, objects must be returned in their original condition:
          </p>
          <ul>
            <li>Unused, clean, and unaltered.</li>
            <li>In the original packaging (including all tags, designer cards, and dust bags).</li>
            <li>Packaged securely to prevent damage during transit.</li>
          </ul>
          <p>
            Please note that we cannot accept returns for items that have been used, damaged after receipt, or are returned without their original packaging.
          </p>
        </div>

        <div className="policy-block">
          <h2>Refund Process</h2>
          <p>
            Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund. 
            If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5–7 business days.
          </p>
        </div>

        <div className="policy-block">
          <h2>Return Shipping</h2>
          <p>
            Customers are responsible for paying the shipping costs for returning items. Shipping costs are non-refundable. 
            We highly recommend using a trackable shipping service or purchasing shipping insurance, as we cannot guarantee that we will receive your returned item.
          </p>
        </div>

        <div className="policy-block">
          <h2>Exchanges</h2>
          <p>
            We replace items if they are defective or damaged upon arrival. If you need to exchange an item for the same product, send us an email at <strong>hello@miru.co</strong>, and we will assist you with the exchange process.
          </p>
        </div>
      </div>

      <div className="policy-footer">
        <h3>Need to start a return?</h3>
        <p>Email our returns desk at hello@miru.co with your order number, and we will guide you through the process.</p>
        <button className="btn btn-primary" onClick={onBackToShop}>Back to Shop</button>
      </div>
    </div>
  );
}
