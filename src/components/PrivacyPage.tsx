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
            <p class="text-muted"><strong>Effective Date:</strong> April 26, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> April 26, 2026</p>

            <h3 class="fw-bold mb-3">1. Introduction</h3>
            <p>Welcome to <strong>Imaan &amp; Akhlaq</strong> ("we", "our", "us"), a character-building platform for children, parents, teachers and schools, operated by <strong>Imaan Akhlaq</strong>, Islamabad, Pakistan. This Privacy Policy explains what information our website (<a href="https://imaanakhlaq.org">imaanakhlaq.org</a>) and our Android application (package <code>com.imaanakhlaq.app</code>) collect, how we use it, and the choices you have. By using our services you agree to this Policy.</p>

            <h3 class="fw-bold mt-5 mb-3">2. Children&rsquo;s Privacy</h3>
            <p>Imaan &amp; Akhlaq is designed for use by children with the involvement of a parent, teacher or school administrator. We comply with the Children&rsquo;s Online Privacy Protection Act (COPPA), the EU General Data Protection Regulation (GDPR-K) and Google Play&rsquo;s <em>Designed for Families</em> policy.</p>
            <ul>
              <li>Student accounts are created and managed by a verified school administrator or teacher, who provides the required consent on behalf of the parent / guardian.</li>
              <li>We never collect more information from a child than is reasonably necessary to provide the educational activity.</li>
              <li>We do not sell, rent or share children&rsquo;s personal information with third parties for advertising.</li>
              <li>Parents and guardians may, at any time, request to review, correct or delete their child&rsquo;s data by emailing us (see Section&nbsp;9).</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">3. Information We Collect</h3>
            <p><strong>(a) Account information</strong> &mdash; when you register as a parent, student, teacher, school admin or super-admin we collect: full name, email address, phone number (optional), password (stored as a one-way hash by Firebase Authentication), assigned school, role, class / section, and profile picture (optional).</p>
            <p><strong>(b) Educational activity data</strong> &mdash; quiz scores, book reading progress, attendance, teacher notes, fee status, and parent feedback. This data is stored in Google Firebase (Firestore + Storage).</p>
            <p><strong>(c) Device information</strong> &mdash; device model, OS version, app version, language and crash logs, used solely for diagnostics and to improve stability.</p>
            <p><strong>(d) Camera (Android only, optional)</strong> &mdash; the Qibla Finder feature can use your rear camera to overlay the Qibla direction on a live camera view, similar to Google&rsquo;s Qibla Finder. <strong>The camera feed is processed entirely on your device, is never recorded, never uploaded and never stored.</strong> You may deny or revoke this permission in Android Settings; the rest of the app continues to work.</p>
            <p><strong>(e) Location (Android only, optional)</strong> &mdash; the Qibla feature uses your approximate or precise location <em>only on-device</em> to calculate the direction of the Kaaba and the distance to Makkah. <strong>Your location is never sent to our servers, never sold and never shared.</strong> You may deny or revoke this permission at any time.</p>
            <p><strong>(f) Local storage</strong> &mdash; the Tasbeeh counter, theme preference and last-opened page are stored only in your device&rsquo;s local storage and are never transmitted.</p>

            <h3 class="fw-bold mt-5 mb-3">4. How We Use Your Information</h3>
            <ul>
              <li>To create and authenticate your account and protect it from unauthorized access.</li>
              <li>To deliver lessons, quizzes, books and activities, and to track learning progress.</li>
              <li>To allow teachers and parents to monitor a student&rsquo;s progress.</li>
              <li>To send essential service messages (e.g.&nbsp;password reset, important school announcements).</li>
              <li>To diagnose crashes and improve performance.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p>We do <strong>not</strong> use your data for behavioural advertising, profiling, or AI-model training.</p>

            <h3 class="fw-bold mt-5 mb-3">5. Third-Party Services</h3>
            <p>We rely on the following processors who are bound by their own strict privacy commitments:</p>
            <ul>
              <li><strong>Google Firebase</strong> (Authentication, Firestore, Storage, Hosting) &mdash; <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">firebase.google.com/support/privacy</a></li>
              <li><strong>Hostinger</strong> &mdash; for the public website hosting.</li>
              <li><strong>WhatsApp</strong> &mdash; only when you tap the WhatsApp button to contact us; no data is shared automatically.</li>
            </ul>
            <p>We do not integrate any third-party advertising SDK, analytics SDK that profiles users, or social-media tracking pixel inside the Android app.</p>

            <h3 class="fw-bold mt-5 mb-3">6. Data Sharing</h3>
            <p>We do not sell or rent personal data. We share data only:</p>
            <ul>
              <li>With the school / teacher you are enrolled with, so they can teach and assess you.</li>
              <li>With service providers listed in Section&nbsp;5, strictly to operate the service.</li>
              <li>When required by law, court order, or to protect the safety of users.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">7. Data Retention</h3>
            <p>Account and educational data are retained for as long as your account is active. If your account is deleted (by you or your school), all personal data is permanently removed within <strong>30 days</strong>, except where we are legally required to keep it longer (e.g.&nbsp;tax records). Anonymous, aggregated statistics may be retained indefinitely.</p>

            <h3 class="fw-bold mt-5 mb-3">8. Data Security</h3>
            <p>All traffic is encrypted in transit using TLS / HTTPS. Passwords are stored using Firebase Authentication&rsquo;s industry-standard hashing. Access to production data is limited to authorized administrators and is protected by two-factor authentication. Despite these measures, no system can be 100% secure; please use a strong, unique password.</p>

            <h3 class="fw-bold mt-5 mb-3">9. Your Rights &amp; Account Deletion</h3>
            <p>You (or, for a child, the parent / guardian or school administrator) have the right to:</p>
            <ul>
              <li>Access a copy of your personal data.</li>
              <li>Correct inaccurate data.</li>
              <li>Withdraw consent or restrict processing.</li>
              <li><strong>Delete your account and all associated data.</strong></li>
            </ul>
            <p><strong>How to delete your account:</strong></p>
            <ol>
              <li><em>In-app</em> &mdash; open the app, go to your dashboard &rarr; profile menu &rarr; <em>Delete Account</em>, and confirm. Your account and personal data will be removed within 30 days.</li>
              <li><em>By email</em> &mdash; send a request from your registered email to <a href="mailto:contact@imaanakhlaq.org">contact@imaanakhlaq.org</a> with the subject line &ldquo;Delete my account&rdquo;. We will verify and process within 30 days.</li>
              <li><em>Web form</em> &mdash; visit <a href="https://imaanakhlaq.org/delete-account">imaanakhlaq.org/delete-account</a>.</li>
            </ol>
            <p>You may also contact us with any privacy question; we respond within 14 days.</p>

            <h3 class="fw-bold mt-5 mb-3">10. International Transfers</h3>
            <p>Our servers are operated by Google Firebase and may store data in regions outside Pakistan, including the United States and Europe. Google maintains appropriate safeguards (Standard Contractual Clauses) for international transfers.</p>

            <h3 class="fw-bold mt-5 mb-3">11. Permissions Summary (Android App)</h3>
            <ul>
              <li><strong>INTERNET</strong> &mdash; required to load lessons and sync progress.</li>
              <li><strong>CAMERA</strong> &mdash; optional, used <em>only</em> for the Qibla AR camera mode; feed never leaves the device.</li>
              <li><strong>ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION</strong> &mdash; optional, used <em>only on-device</em> to compute Qibla bearing and distance to Makkah.</li>
            </ul>

            <h3 class="fw-bold mt-5 mb-3">12. Changes to this Policy</h3>
            <p>We may update this Privacy Policy from time to time. We will post the new version on this page and update the &ldquo;Last Updated&rdquo; date above. Material changes will be announced inside the app.</p>

            <h3 class="fw-bold mt-5 mb-3">13. Contact Us</h3>
            <p>For any privacy concern, data request, or to exercise your rights, please contact us:</p>
            <p>
              <strong>Imaan &amp; Akhlaq</strong><br>
              Email: <a href="mailto:contact@imaanakhlaq.org" class="text-primary fw-bold">contact@imaanakhlaq.org</a><br>
              WhatsApp: <a href="https://wa.me/923390106475">+92&nbsp;339&nbsp;0106475</a><br>
              Address: Karachi, Sindh, Pakistan
            </p>

            <div class="alert alert-soft-primary mt-5 mb-0 rounded-4">
              <i class="fas fa-info-circle me-2"></i> This Privacy Policy is the legally binding agreement between you and Imaan &amp; Akhlaq. By continuing to use our services, you confirm you have read and understood it.
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
