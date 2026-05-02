import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const DeleteAccountPage = () => html`
${Head()}
${Header()}

<main class="legal-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-9">

        <div class="text-center mb-5">
          <span class="badge bg-danger px-3 py-2 rounded-pill mb-3">Account Management</span>
          <h1 class="display-4 fw-bold kidba-title text-primary">Delete Your Account</h1>
          <p class="lead text-muted">Imaan &amp; Akhlaq</p>
        </div>

        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5">
          <div class="card-body legal-content">

            <div class="alert alert-warning rounded-4">
              <strong>Important:</strong> Deleting your account is permanent. After 30&nbsp;days all your personal data, learning progress, quiz results, attendance and uploaded content will be removed and cannot be recovered.
            </div>

            <h3 class="fw-bold mt-4 mb-3">App name &amp; developer</h3>
            <ul>
              <li><strong>App:</strong> Imaan &amp; Akhlaq</li>
              <li><strong>Android package:</strong> <code>com.imaanakhlaq.app</code></li>
              <li><strong>Developer:</strong> Imaan Akhlaq, Islamabad, Pakistan</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">Option 1 &mdash; Delete from inside the app</h3>
            <ol>
              <li>Open the Imaan &amp; Akhlaq app and sign in.</li>
              <li>Tap your profile picture in the top-right of the dashboard.</li>
              <li>Choose <em>Settings &rarr; Delete my account</em>.</li>
              <li>Confirm with your password.</li>
              <li>You will receive a confirmation email; the account is removed within 30&nbsp;days.</li>
            </ol>

            <h3 class="fw-bold mt-5 mb-3">Option 2 &mdash; Request deletion by email (recommended for school admins)</h3>
            <p>Send an email from the address registered on your account to:</p>
            <p class="fs-5"><a href="mailto:contact@imaanakhlaq.org?subject=Delete%20my%20account" class="text-primary fw-bold">contact@imaanakhlaq.org</a></p>
            <p>Use the subject line <strong>&ldquo;Delete my account&rdquo;</strong> and include:</p>
            <ul>
              <li>Your full name as registered</li>
              <li>Role (parent / student / teacher / admin)</li>
              <li>School name (if applicable)</li>
            </ul>
            <p>We will verify your identity and complete deletion within 30&nbsp;days.</p>

            <h3 class="fw-bold mt-5 mb-3">Option 3 &mdash; WhatsApp</h3>
            <p>Send your deletion request from your registered phone number to <a href="https://wa.me/923390106475" class="fw-bold">+92&nbsp;339&nbsp;0106475</a>.</p>

            <h3 class="fw-bold mt-5 mb-3">What is deleted</h3>
            <ul>
              <li>Your profile (name, email, phone, password hash, profile picture)</li>
              <li>Quiz scores, reading progress, attendance, teacher notes about you</li>
              <li>Any content you uploaded (homework, photos)</li>
              <li>App-side local data such as Tasbeeh count and settings</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">What may be retained</h3>
            <p>For legal, accounting or fraud-prevention reasons we may retain anonymised, aggregated statistics (which cannot identify you) and minimal transaction records where required by law. These are kept no longer than 5&nbsp;years and never linked back to you.</p>

            <h3 class="fw-bold mt-5 mb-3">Children&rsquo;s accounts</h3>
            <p>If the account belongs to a child, the deletion request must come from the parent / guardian or the school administrator who created the account. Once deleted, the child&rsquo;s data is purged completely; no &ldquo;retained&rdquo; subset is kept.</p>

            <h3 class="fw-bold mt-5 mb-3">Need help?</h3>
            <p>For any question about this process please email <a href="mailto:contact@imaanakhlaq.org">contact@imaanakhlaq.org</a>. We respond within 14&nbsp;days.</p>

            <div class="alert alert-soft-primary mt-5 mb-0 rounded-4">
              <i class="fas fa-info-circle me-2"></i> Last Updated: April 26, 2026.
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</main>

<style>
  .legal-page-container { background-color: #f8f9fa; min-height: 80vh; }
  .legal-content h3 { color: var(--kidba-blue); }
  .legal-content p, .legal-content li { font-size: 1.05rem; color: #4a5568; line-height: 1.75; }
  .legal-content li { margin-bottom: 0.4rem; }
  .alert-soft-primary { background-color: rgba(13,110,253,0.1); color: var(--kidba-blue); border: none; }
</style>

${Footer()}
`
