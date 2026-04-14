import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export const TermsPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        
        <div class="text-center mb-5" data-aos="fade-up">
          <span class="badge bg-success px-3 py-2 rounded-pill mb-3">Legal</span>
          <h1 class="display-4 fw-bold kidba-title" style="color: var(--kidba-green);">Terms of Use</h1>
          <p class="lead text-muted">Rules and agreements for using our educational platform.</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5" data-aos="fade-up" data-aos-delay="100">
          <div class="card-body legal-content">
            <h3 class="fw-bold mb-3">1. Acceptance of Terms</h3>
            <p>By accessing and using Imaan & Akhlaq (imaanakhlaq.org), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not accept these terms, please do not use our website.</p>

            <h3 class="fw-bold mt-5 mb-3">2. Educational & Non-Commercial Use</h3>
            <p>All content provided on this platform, including PDFs, animations, and activity modules, is strictly for educational, personal, and non-commercial use. Modifying, reproducing, or selling our digital assets without prior permission is strictly prohibited.</p>
            
            <h3 class="fw-bold mt-5 mb-3">3. Copyright & Intellectual Property</h3>
            <p>The materials hosted on this website, including artwork, storylines, characters (Imaan, Akhlaq, etc.), and code segments, are the intellectual property of the creators of the <strong>Ilm O Amal Initiative</strong>. All rights reserved.</p>

            <h3 class="fw-bold mt-5 mb-3">4. Parental Supervision</h3>
            <p>While our content is designed to be child-friendly and educational, we recommend that parents or guardians review the materials and participate in the learning process alongside their children.</p>

            <h3 class="fw-bold mt-5 mb-3">5. Disclaimer of Liability</h3>
            <p>This website and its content are provided on an "as-is" basis. We make no warranties, expressed or implied, regarding the continuous availability or error-free functioning of the platform. We shall not be held liable for any damages arising out of your use of the website.</p>

            <div class="alert alert-soft-success mt-5 mb-0 rounded-4">
              <i class="fas fa-check-circle me-2"></i> By continuing to use the site, you agree to these terms.
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
    font-size: 1.1rem;
    color: #4a5568;
    line-height: 1.8;
  }
  .alert-soft-success {
    background-color: rgba(25, 135, 84, 0.1);
    color: var(--kidba-green);
    border: none;
  }
</style>

${Footer()}
${BackToTop()}
`
