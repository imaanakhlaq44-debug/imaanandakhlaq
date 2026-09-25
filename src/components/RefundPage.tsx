import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

// Return & Refund Policy.
//
// Required before a Pakistani payment gateway (PSO/PSP) will enable card and
// Raast collection on this domain, and it has to say three things concretely:
// what can be returned, in what window, and how the money comes back. Vague
// wording ("refunds at our discretion") is what gets an application rejected.
//
// Keep this page, TermsPage and ShippingPage consistent — they cross-link, and
// a contradiction between them is worse than any one of them being brief.

export const RefundPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">

        <div class="text-center mb-5" data-aos="fade-up">
          <span class="badge bg-danger px-3 py-2 rounded-pill mb-3">Legal</span>
          <h1 class="display-4 fw-bold kidba-title" style="color: #D63678;">Return &amp; Refund Policy</h1>
          <p class="lead text-muted">How returns, cancellations and refunds work on imaanakhlaq.org.</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" data-aos="fade-up" data-aos-delay="100">
          <div class="card-body legal-content">
            <p class="text-muted"><strong>Effective Date:</strong> 25 September 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> 25 September 2026</p>

            <p>This policy applies to every order placed with <strong>Imaan &amp; Akhlaq</strong> (an Ilm o Amal / SEERAHT Initiatives project), Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan. All amounts are in Pakistani Rupees (PKR).</p>

            <h3 class="fw-bold mt-5 mb-3">1. Printed Books &amp; Physical Kits</h3>
            <p>You may return printed books, coloring books and activity kits within <strong>7 days of delivery</strong>, provided the item is unused, unmarked, uncolored and in its original packaging.</p>
            <ul>
              <li>Email <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a> or WhatsApp <a href="tel:+923390106475">+92 339 0106475</a> with your order number and the reason for return.</li>
              <li>We reply with a return authorisation and the return address within 2 working days.</li>
              <li>If the item arrived <strong>damaged, defective or incorrect</strong>, we pay the return courier charges and send a replacement or a full refund, including the original delivery charge. Please send a photograph within 48 hours of delivery.</li>
              <li>If you are returning simply because you changed your mind, the return courier charge is yours and the original delivery charge is not refunded.</li>
            </ul>
            <p>Once the returned item reaches us and passes inspection, the refund is approved within <strong>3 working days</strong>.</p>

            <h3 class="fw-bold mt-5 mb-3">2. Digital Subscriptions (Audio Portal, Games Portal)</h3>
            <p>Digital access is delivered immediately, so these are handled differently:</p>
            <ul>
              <li><strong>Full refund within 7 days</strong> of purchase if the content has not been substantially used — that is, if fewer than three audio episodes or games have been opened on the account.</li>
              <li><strong>Full refund at any time</strong> if a technical fault on our side prevents you from using the service and we cannot fix it within 7 working days of your report.</li>
              <li>After 7 days, and where the content has been used, a subscription already paid for is not refundable. You may cancel renewal at any time and keep access until the paid period ends.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">3. Club Membership &amp; School Licences</h3>
            <ul>
              <li>Cancel within <strong>14 days</strong> of activation for a full refund, as long as the student or school account has not begun submitting work.</li>
              <li>After 14 days, refunds are calculated <strong>pro rata</strong> for the unused months of the term, less any printed materials already dispatched.</li>
              <li>School licences cancelled before onboarding begins are refunded in full.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">4. Puppet Shows &amp; Teacher Training</h3>
            <ul>
              <li>Cancelled <strong>more than 14 days</strong> before the booked date — full refund.</li>
              <li>Cancelled <strong>7 to 14 days</strong> before — 50% refund, since performers and travel are already committed.</li>
              <li>Cancelled <strong>less than 7 days</strong> before — no refund, but the booking may be rescheduled once at no extra charge, subject to availability.</li>
              <li>If <em>we</em> cancel or fail to appear for any reason, you receive a full refund.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">5. Duplicate &amp; Failed Payments</h3>
            <p>If you are charged twice for the same order, or money leaves your account for an order that did not complete, write to us with the transaction reference. Confirmed duplicate or failed-transaction charges are refunded in full, with no deduction.</p>

            <h3 class="fw-bold mt-5 mb-3">6. How Refunds Are Paid</h3>
            <ul>
              <li>Refunds are always returned to the <strong>original payment method</strong> — the same card, bank account, Raast ID or mobile wallet used to pay. We do not refund to a different account.</li>
              <li>Once approved, we release the refund within <strong>7 working days</strong>. Your bank or wallet provider may then take a further 3 to 10 working days to show it, which is outside our control.</li>
              <li>You receive an email confirmation when the refund is released.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">7. Non-Refundable Items</h3>
            <ul>
              <li>Books that have been written in, colored in or damaged after delivery.</li>
              <li>Customised or personalised printed material (for example, school-branded certificates already printed).</li>
              <li>Donations and voluntary contributions to the initiative.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">8. How to Reach Us</h3>
            <p>
              <strong>Imaan &amp; Akhlaq</strong> — SEERAHT Initiatives, Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan<br/>
              Phone / WhatsApp: <a href="tel:+923390106475">+92 339 0106475</a><br/>
              Email: <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a><br/>
              Hours: Monday to Saturday, 9:00 AM – 6:00 PM (PKT)
            </p>
            <p>We acknowledge every refund request within <strong>2 working days</strong>.</p>

            <div class="alert alert-soft-success mt-5 mb-0 rounded-4">
              <i class="fas fa-info-circle me-2"></i> See also our <a href="/shipping" class="fw-bold">Shipping &amp; Delivery Policy</a> and <a href="/terms" class="fw-bold">Terms &amp; Conditions</a>.
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
    color: #D63678;
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
