import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

// Shipping & Service Delivery Policy.
//
// Half of what we sell is printed and travels by courier; the other half is a
// subscription or a school account that is switched on. A gateway review reads
// this page to confirm the buyer is told WHEN they get what they paid for, so
// both halves are stated separately with real timeframes — see RefundPage for
// what happens when a delivery goes wrong.

export const ShippingPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">

        <div class="text-center mb-5" data-aos="fade-up">
          <span class="badge bg-info text-dark px-3 py-2 rounded-pill mb-3">Legal</span>
          <h1 class="display-4 fw-bold kidba-title" style="color: #0EA5E9;">Shipping &amp; Delivery Policy</h1>
          <p class="lead text-muted">How printed orders are shipped and how digital services are delivered.</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" data-aos="fade-up" data-aos-delay="100">
          <div class="card-body legal-content">
            <p class="text-muted"><strong>Effective Date:</strong> 25 September 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> 25 September 2026</p>

            <p>Orders are dispatched from our office at <strong>SEERAHT Initiatives, Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan</strong>. All charges are in Pakistani Rupees (PKR).</p>

            <h3 class="fw-bold mt-5 mb-3">1. Order Processing</h3>
            <ul>
              <li>Orders are processed on working days — Monday to Saturday, 9:00 AM to 6:00 PM (PKT). Orders placed on a Sunday or a public holiday are processed the next working day.</li>
              <li>A successful payment triggers an order confirmation email. Your order moves to dispatch within <strong>1 to 2 working days</strong>.</li>
              <li>Please make sure your delivery address and mobile number are correct — couriers in Pakistan call before delivery, and an unreachable number is the most common cause of a delayed parcel.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">2. Delivery Times &mdash; Printed Books &amp; Kits</h3>
            <p>We ship nationwide across Pakistan by reputable courier (TCS, Leopards or M&amp;P, depending on your city).</p>
            <ul>
              <li><strong>Islamabad &amp; Rawalpindi:</strong> 1 to 3 working days.</li>
              <li><strong>Other major cities</strong> (Lahore, Karachi, Peshawar, Faisalabad, Multan, Quetta and similar): 3 to 5 working days.</li>
              <li><strong>Smaller towns and remote areas:</strong> 5 to 7 working days.</li>
              <li><strong>Bulk school orders:</strong> 5 to 10 working days, confirmed on your quotation.</li>
            </ul>
            <p>These are courier estimates from the date of dispatch, not from the date of order. Weather, strikes and courier backlogs can extend them; if a parcel is running late we tell you rather than waiting to be asked.</p>

            <h3 class="fw-bold mt-5 mb-3">3. Delivery Charges</h3>
            <ul>
              <li><strong>Rs. 250</strong> flat courier charge per order within Pakistan.</li>
              <li><strong>Free delivery</strong> on orders of Rs. 3,000 or more.</li>
              <li>School and bulk orders are quoted separately, based on weight and destination, before any payment is taken.</li>
              <li>We do not currently ship outside Pakistan. For international enquiries please email us and we will arrange a quotation case by case.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">4. Tracking Your Order</h3>
            <p>Once your parcel is handed to the courier we send you the tracking number by email and WhatsApp, along with the courier's name so you can track it on their own website. If you have not received a tracking number within 3 working days of paying, please contact us.</p>

            <h3 class="fw-bold mt-5 mb-3">5. Delivery of Digital Services</h3>
            <p>Nothing digital is shipped — it is activated. Timeframes are:</p>
            <ul>
              <li><strong>Audio Story Portal and Games Portal:</strong> access is granted to the paying account <strong>immediately</strong> after a successful payment. Sign in on the website or in the Android app with the same email.</li>
              <li><strong>Club membership:</strong> the student login and parent wall are activated within <strong>24 hours</strong>, and the login details are emailed to the address on the order.</li>
              <li><strong>School program licence:</strong> onboarding — roster import, teacher accounts and dashboards — is completed within <strong>3 working days</strong> of receiving your student list.</li>
              <li><strong>Teacher training and puppet shows:</strong> delivered on the date confirmed in writing with you at the time of booking.</li>
            </ul>
            <p>If a digital activation has not reached you within the window above, contact us and we will either complete it or refund you under the <a href="/refund">Return &amp; Refund Policy</a>.</p>

            <h3 class="fw-bold mt-5 mb-3">6. Wrong, Damaged or Missing Deliveries</h3>
            <ul>
              <li>Please check your parcel on arrival. Report anything damaged, incorrect or missing within <strong>48 hours of delivery</strong>, with a photograph where possible.</li>
              <li>We arrange a replacement or a full refund at our cost — you do not pay return courier charges on our mistake.</li>
              <li>If a parcel is returned to us undelivered because the address was incomplete or nobody was reachable, we contact you to re-ship. A second courier charge applies in that case.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">7. Contact for Delivery Queries</h3>
            <p>
              <strong>Imaan &amp; Akhlaq</strong> — SEERAHT Initiatives, Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan<br/>
              Phone / WhatsApp: <a href="tel:+923390106475">+92 339 0106475</a><br/>
              Email: <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a><br/>
              Hours: Monday to Saturday, 9:00 AM – 6:00 PM (PKT)
            </p>

            <div class="alert alert-soft-success mt-5 mb-0 rounded-4">
              <i class="fas fa-info-circle me-2"></i> See also our <a href="/refund" class="fw-bold">Return &amp; Refund Policy</a> and <a href="/terms" class="fw-bold">Terms &amp; Conditions</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .legal-page-container {
    background-color: #f8f9fa;
    min-height: 80vh;
  }
  .legal-content h3 {
    color: #0EA5E9;
  }
  .legal-content p, .legal-content li {
    font-size: 1.08rem;
    color: #4a5568;
    line-height: 1.8;
  }
  .legal-content ul { margin-bottom: 1.2rem; }
  .alert-soft-success {
    background-color: rgba(25, 135, 84, 0.1);
    color: var(--kidba-green);
    border: none;
  }
</style>

${Footer()}
${BackToTop()}
`
