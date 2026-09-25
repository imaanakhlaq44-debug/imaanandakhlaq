import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

// Terms & Conditions.
//
// This was "Terms of Use" and covered only content and copyright — fine while
// nothing on the site was for sale. Once payments are collected the same page
// has to also be the contract of sale: who the seller is, prices and currency,
// when an order is accepted, what the buyer is charged, and which law governs
// a dispute. A gateway's onboarding review looks for exactly those clauses.
//
// Sections 6 to 10 are the commercial half. They must stay consistent with
// RefundPage and ShippingPage, which hold the detail and are linked from here.

export const TermsPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">

        <div class="text-center mb-5" data-aos="fade-up">
          <span class="badge bg-success px-3 py-2 rounded-pill mb-3">Legal</span>
          <h1 class="display-4 fw-bold kidba-title" style="color: var(--kidba-green);">Terms &amp; Conditions</h1>
          <p class="lead text-muted">The agreement between you and Imaan &amp; Akhlaq, including our terms of sale.</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" data-aos="fade-up" data-aos-delay="100">
          <div class="card-body legal-content">
            <p class="text-muted"><strong>Effective Date:</strong> 25 September 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> 25 September 2026</p>

            <h3 class="fw-bold mb-3">1. Who We Are</h3>
            <p>This website (<a href="https://imaanakhlaq.org">imaanakhlaq.org</a>) and the Android application <code>com.imaanakhlaq.app</code> are operated by <strong>Imaan &amp; Akhlaq</strong>, a project of the <strong>Ilm o Amal Initiative / SEERAHT Initiatives</strong>.</p>
            <p>
              <strong>Registered office:</strong> Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan<br/>
              <strong>Phone / WhatsApp:</strong> <a href="tel:+923390106475">+92 339 0106475</a><br/>
              <strong>Email:</strong> <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a><br/>
              <strong>Business hours:</strong> Monday to Saturday, 9:00 AM – 6:00 PM (PKT)
            </p>
            <p>In these terms, "we", "our" and "us" mean Imaan &amp; Akhlaq; "you" means the person or institution using the site or placing an order.</p>

            <h3 class="fw-bold mt-5 mb-3">2. Acceptance of Terms</h3>
            <p>By accessing this website, creating an account, or placing an order, you acknowledge that you have read, understood and agree to be bound by these Terms &amp; Conditions, together with our <a href="/privacy">Privacy Policy</a>, <a href="/refund">Return &amp; Refund Policy</a> and <a href="/shipping">Shipping &amp; Delivery Policy</a>. If you do not accept them, please do not use the site.</p>

            <h3 class="fw-bold mt-5 mb-3">3. Eligibility &amp; Accounts</h3>
            <ul>
              <li>Purchases may only be made by a person aged 18 or over, or by an institution acting through an authorised representative.</li>
              <li>Student accounts are created by a parent, teacher or verified school administrator, never by the child alone.</li>
              <li>You are responsible for keeping your password confidential and for activity carried out under your account. Tell us immediately if you believe it has been used without your permission.</li>
              <li>We may suspend an account that is used to abuse the platform, harm other users, or breach these terms.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">4. Educational Use of Content</h3>
            <p>All content on this platform — storybooks, PDFs, audio, animations and activity modules — is licensed to you for <strong>educational and personal or in-school use only</strong>. Reselling, re-uploading, sub-licensing or commercially reproducing our material without written permission is prohibited.</p>

            <h3 class="fw-bold mt-5 mb-3">5. Copyright &amp; Intellectual Property</h3>
            <p>The artwork, storylines, characters (Imaan, Akhlaq, Faasid and the rest of the story world), text, audio and software on this site are the intellectual property of the creators of the <strong>Ilm o Amal Initiative</strong>. All rights reserved.</p>

            <h3 class="fw-bold mt-5 mb-3">6. Products, Services &amp; Prices</h3>
            <ul>
              <li>Our products and services, with prices, are listed on the <a href="/products">Products &amp; Services</a> page.</li>
              <li>All prices are quoted in <strong>PKR (Pakistani Rupees)</strong> and include applicable taxes unless your invoice states otherwise.</li>
              <li>We may change prices at any time, but never after your order has been confirmed — you pay the price shown when you ordered.</li>
              <li>Product images are illustrative. Printing runs and paper stock can vary slightly from the photographs.</li>
              <li>If an item is mispriced or out of stock after you have paid, we will tell you and either honour the order, offer an alternative, or refund you in full.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">7. Orders &amp; Payment</h3>
            <ul>
              <li>Placing an order is an offer to buy. A contract exists only once we send you an order confirmation, or once the service is activated.</li>
              <li>We accept <strong>debit and credit cards, Raast, bank account transfers and mobile wallets</strong>, processed by our licensed payment service provider. Card and account details are entered on the provider's secure page — we never see, handle or store your full card number.</li>
              <li>You confirm that the payment instrument you use is yours, or that you are authorised to use it.</li>
              <li>An order may be declined if payment fails verification, if the delivery address cannot be served, or where we reasonably suspect fraud.</li>
              <li>Subscriptions are charged for the term stated at checkout. They do not auto-renew silently; we contact you before a new term begins.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">8. Delivery</h3>
            <p>Printed items are couriered across Pakistan and digital services are activated online, with the timeframes and charges set out in our <a href="/shipping">Shipping &amp; Delivery Policy</a>. Delivery estimates are given in good faith; courier delays outside our control do not constitute a breach of these terms, though they may entitle you to a refund under the policy below.</p>

            <h3 class="fw-bold mt-5 mb-3">9. Cancellations, Returns &amp; Refunds</h3>
            <p>Your rights to cancel an order, return a printed item and receive a refund — including the applicable windows and how the money is returned to your original payment method — are set out in full in our <a href="/refund">Return &amp; Refund Policy</a>, which forms part of these terms.</p>

            <h3 class="fw-bold mt-5 mb-3">10. Parental Supervision</h3>
            <p>Our content is designed to be child-friendly, but we recommend that a parent, guardian or teacher reviews the material and takes part in the learning alongside the child.</p>

            <h3 class="fw-bold mt-5 mb-3">11. Acceptable Use</h3>
            <p>You agree not to attempt to gain unauthorised access to our systems or other users' accounts, upload malicious code, scrape the platform at scale, or use it to distribute unlawful, hateful or harmful material.</p>

            <h3 class="fw-bold mt-5 mb-3">12. Disclaimer of Liability</h3>
            <p>This website and its content are provided on an "as-is" basis. We make no warranty of uninterrupted or error-free availability. To the extent permitted by law, our total liability arising from any order is limited to the amount you paid for that order. Nothing in these terms excludes liability that cannot lawfully be excluded.</p>

            <h3 class="fw-bold mt-5 mb-3">13. Governing Law &amp; Disputes</h3>
            <p>These terms are governed by the laws of the <strong>Islamic Republic of Pakistan</strong>, and the courts at <strong>Islamabad</strong> have exclusive jurisdiction. Before going to court, please raise the matter with us — most issues are resolved within a few days of a phone call.</p>

            <h3 class="fw-bold mt-5 mb-3">14. Changes to These Terms</h3>
            <p>We may update these terms from time to time. The "Last Updated" date above always reflects the current version, and the terms in force when you placed an order are the ones that govern it.</p>

            <h3 class="fw-bold mt-5 mb-3">15. Contact</h3>
            <p>Questions about these terms, an order, or a refund: call or WhatsApp <a href="tel:+923390106475">+92 339 0106475</a>, email <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a>, or visit us at Ilm o Amal Center, Jinnah Garden, Islamabad during business hours.</p>

            <div class="alert alert-soft-success mt-5 mb-0 rounded-4">
              <i class="fas fa-check-circle me-2"></i> By continuing to use the site or placing an order, you agree to these Terms &amp; Conditions.
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
    color: var(--kidba-green);
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
