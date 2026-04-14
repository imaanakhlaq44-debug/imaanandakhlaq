import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export const PrivacyPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        
        <div class="text-center mb-5" data-aos="fade-up">
          <span class="badge bg-primary px-3 py-2 rounded-pill mb-3">Legal</span>
          <h1 class="display-4 fw-bold kidba-title text-primary">Privacy Policy</h1>
          <p class="lead text-muted">Protecting our future generations online.</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" data-aos="fade-up" data-aos-delay="100">
          <div class="card-body legal-content">
            <h3 class="fw-bold mb-3">1. Introduction</h3>
            <p>Welcome to <strong>Imaan & Akhlaq</strong>. We take your privacy, and especially the privacy of children, extremely seriously. This Privacy Policy details the information we collect, how it is used, and how it is protected.</p>

            <h3 class="fw-bold mt-5 mb-3">2. Children's Privacy (COPPA Compliance)</h3>
            <p>Imaan & Akhlaq is a platform built for children and families. We are fully committed to complying with the Children's Online Privacy Protection Act (COPPA). We do NOT knowingly collect personally identifiable information from children under 13 without verifiable parental consent. If we learn we have collected such data inadvertently, it will be deleted immediately.</p>
            
            <h3 class="fw-bold mt-5 mb-3">3. Data Collection</h3>
            <p>Our platform primarily provides educational content, PDF books, and interactive activities. We collect minimal data necessary for operations:</p>
            <ul>
              <li><strong>Local Storage:</strong> Interactive activities save progress locally on your device's browser. This data never reaches our servers.</li>
              <li><strong>Analytics:</strong> We may use non-personalized web analytics to understand traffic sources and page views.</li>
              <li><strong>Communications:</strong> If parents contact us via WhatsApp or Email, we only use that information to address their queries.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">4. Third-Party Services & Advertising</h3>
            <p>We work with trusted third-party advertising networks (like Google AdSense). Note for Parents: We strictly configure our ad services to serve <strong>non-personalized ads</strong> on sections targeted at children to ensure no behavioral tracking is performed.</p>

            <h3 class="fw-bold mt-5 mb-3">5. Data Security</h3>
            <p>All interactions on our platform are secured using HTTPS encryption. While no internet transmission is 100% secure, we implement commercially acceptable procedures to safeguard our digital environment.</p>

            <h3 class="fw-bold mt-5 mb-3">6. Contact Us</h3>
            <p>If you have any questions concerning this Privacy Policy, please contact our administration:</p>
            <p>Email: <a href="mailto:contact@imaanakhlaq.org" class="text-primary fw-bold">contact@imaanakhlaq.org</a></p>

            <div class="alert alert-soft-primary mt-5 mb-0 rounded-4">
              <i class="fas fa-info-circle me-2"></i> Last Updated: April 2026. Changes will be posted to this page.
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
    color: var(--kidba-blue);
  }
  .legal-content p, .legal-content li {
    font-size: 1.1rem;
    color: #4a5568;
    line-height: 1.8;
  }
  .legal-content li {
    margin-bottom: 0.5rem;
  }
  .alert-soft-primary {
    background-color: rgba(13, 110, 253, 0.1);
    color: var(--kidba-blue);
    border: none;
  }
</style>

${Footer()}
${BackToTop()}
`
