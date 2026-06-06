import React from 'react';

export default function ShippingPolicy({ onBackToShop }) {
  return (
    <div className="policy-section fade-in">
      <div className="policy-header">
        <span className="policy-subtitle">CUSTOMER CARE</span>
        <h1>Shipping &amp; Delivery</h1>
        <p>A thoughtful journey from our Kyoto studio to your living space. We handle each object with absolute care.</p>
      </div>

      <div className="policy-grid">
        <div className="policy-block">
          <h2>Packaging Philosophy</h2>
          <p>
            We believe the experience of receiving an object should be as considered as the object itself. 
            Every item is hand-inspected, wrapped in acid-free tissue paper, and cushioned using biodegradable paper fills. 
            We use 100% recyclable cardboard boxes and water-activated paper tape, avoiding single-use plastics wherever possible.
          </p>
        </div>

        <div className="policy-block">
          <h2>Shipping Rates &amp; Delivery Times</h2>
          <p>
            We process and dispatch orders from our studio on Tuesdays and Fridays. 
            Once dispatched, you will receive a tracking link via email.
          </p>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Standard Delivery</th>
                <th>Express Delivery</th>
                <th>Free Shipping Threshold</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Domestic (India)</td>
                <td>3–5 business days (₹250)</td>
                <td>1–2 business days (₹600)</td>
                <td>Orders over ₹10,000</td>
              </tr>
              <tr>
                <td>Asia Pacific</td>
                <td>5–8 business days (₹2,500)</td>
                <td>3–4 business days (₹5,000)</td>
                <td>Orders over ₹35,000</td>
              </tr>
              <tr>
                <td>Rest of the World</td>
                <td>7–12 business days (₹4,500)</td>
                <td>4–6 business days (₹8,500)</td>
                <td>Orders over ₹50,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-block">
          <h2>Duties &amp; Taxes</h2>
          <p>
            For domestic orders, all prices listed are inclusive of taxes. For international shipments, duties, custom fees, and local taxes may be applied by the destination country's custom authorities. These fees are the responsibility of the recipient and must be paid upon delivery.
          </p>
        </div>

        <div className="policy-block">
          <h2>Lost or Damaged Shipments</h2>
          <p>
            Each shipment is fully insured. If your package arrives damaged or is lost in transit, please take photographs of the external packaging and the damaged object immediately and email us at <strong>hello@miru.co</strong> within 48 hours of receipt. We will organize a replacement or full refund promptly.
          </p>
        </div>
      </div>

      <div className="policy-footer">
        <h3>Have more questions?</h3>
        <p>Our client services team is here to assist you with any questions regarding delivery or orders.</p>
        <button className="btn btn-primary" onClick={onBackToShop}>Back to Shop</button>
      </div>
    </div>
  );
}
