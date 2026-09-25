import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export const ContactPage = () => html`
${Head()}
${Header()}

<main class="contact-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row mb-5">
      <div class="col-12 text-center" data-aos="fade-up">
        <span class="badge bg-warning text-dark px-3 py-2 rounded-pill mb-3">Get in Touch</span>
        <h1 class="display-4 fw-bold kidba-title text-dark">Contact Us</h1>
        <p class="lead text-muted">We'd love to hear from parents, teachers, and well-wishers!</p>
      </div>
    </div>

    <!-- Registered office.
         A payment gateway's onboarding review looks for a verifiable street
         address and a reachable number on the contact page itself, not only in
         the footer — so this block is deliberately duplicated here, and the two
         copies must be kept in step with Footer.tsx. -->
    <div class="row justify-content-center mb-4" data-aos="fade-up">
      <div class="col-lg-10">
        <div class="card border-0 shadow-sm rounded-4 office-card p-4 p-md-5">
          <div class="row g-4 align-items-center">
            <div class="col-md-7">
              <span class="badge bg-dark px-3 py-2 rounded-pill mb-3">Our Office</span>
              <h3 class="fw-bold mb-3">Imaan &amp; Akhlaq &mdash; Ilm o Amal Initiative</h3>
              <ul class="office-list list-unstyled mb-0">
                <li><i class="fas fa-map-marker-alt text-danger"></i>
                  <span>SEERAHT Initiatives, Ilm o Amal Center,<br/>Jinnah Garden, Islamabad, Pakistan</span>
                </li>
                <li><i class="fas fa-phone text-success"></i>
                  <span>Phone / WhatsApp: <a href="tel:+923390106475">+92 339 0106475</a></span>
                </li>
                <li><i class="fas fa-envelope text-primary"></i>
                  <span><a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a></span>
                </li>
                <li><i class="fas fa-clock text-warning"></i>
                  <span>Monday to Saturday, 9:00 AM &ndash; 6:00 PM (PKT)<br/><small class="text-muted">Closed on Sundays and public holidays</small></span>
                </li>
              </ul>
            </div>
            <div class="col-md-5">
              <div class="office-map rounded-4 overflow-hidden shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1660.2!2d73.1767332!3d33.5784375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfed00214d3841%3A0x3029ccd22ce26b5a!2sSEERAHT%20Initiatives!5e0!3m2!1sen!2spk!4v1711836000000"
                  width="100%" height="260" style="border:0;" allowfullscreen="" loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade" title="Our office on Google Maps"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 align-items-center justify-content-center">
      <!-- Contact Info Cards -->
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
        <div class="card border-0 shadow-sm rounded-4 h-100 text-center contact-card p-4">
          <div class="card-body">
            <div class="icon-circle bg-light-primary text-primary mx-auto mb-4">
              <i class="fas fa-envelope fa-2x"></i>
            </div>
            <h4 class="fw-bold">Email Us</h4>
            <p class="text-muted mb-3">For general inquiries, collaborations, or support.</p>
            <a href="mailto:contact@imaanakhlaq.org" class="btn btn-outline-primary rounded-pill px-4">contact@imaanakhlaq.org</a>
          </div>
        </div>
      </div>

      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
        <div class="card border-0 shadow-sm rounded-4 h-100 text-center contact-card p-4">
          <div class="card-body">
            <div class="icon-circle bg-light-success text-success mx-auto mb-4">
              <i class="fab fa-whatsapp fa-2x"></i>
            </div>
            <h4 class="fw-bold">WhatsApp</h4>
            <p class="text-muted mb-3">Drop us a message for quick responses.</p>
            <a href="https://web.whatsapp.com/send/?phone=923390106475&text=Hello! I am contacting you from the Imaan & Akhlaq website." target="_blank" class="btn btn-outline-success rounded-pill px-4">+92 339 0106475</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Form (UI Only for AdSense requirement) -->
    <div class="row justify-content-center mt-5 pt-3" data-aos="fade-up" data-aos-delay="300">
      <div class="col-lg-8">
        <div class="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
          <h3 class="fw-bold mb-4 text-center">Send Us a Message</h3>
          <!-- There is no server-side mail handler on this static site, so the
               form hands the message to the visitor's own mail client rather
               than claiming "message sent" when nothing was sent. -->
          <form action="#" method="get" id="contactForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Your Name</label>
                <input type="text" id="cfName" name="name" class="form-control form-control-lg rounded-3 bg-light" placeholder="John Doe" required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Email Address</label>
                <input type="email" id="cfEmail" name="email" class="form-control form-control-lg rounded-3 bg-light" placeholder="john@example.com" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold">Subject</label>
                <input type="text" id="cfSubject" name="subject" class="form-control form-control-lg rounded-3 bg-light" placeholder="How can we help?" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold">Message</label>
                <textarea id="cfMessage" name="message" class="form-control form-control-lg rounded-3 bg-light" rows="5" placeholder="Write your message here..." required></textarea>
              </div>
              <div class="col-12 text-center mt-4">
                <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">Send Message <i class="fas fa-paper-plane ms-2"></i></button>
                <p class="text-muted small mt-3 mb-0">This opens your email app with the message ready to send. Prefer to talk? Call or WhatsApp <a href="tel:+923390106475" class="fw-bold text-decoration-none">+92 339 0106475</a>.</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Policies, linked from the page a buyer is most likely to be on when
         they go looking for them. -->
    <div class="row justify-content-center mt-5" data-aos="fade-up">
      <div class="col-lg-8 text-center policy-links">
        <p class="text-muted mb-2">Before you order, please read:</p>
        <a href="/terms" class="mx-2">Terms &amp; Conditions</a>
        <span class="text-muted">&middot;</span>
        <a href="/privacy" class="mx-2">Privacy Policy</a>
        <span class="text-muted">&middot;</span>
        <a href="/refund" class="mx-2">Return &amp; Refund Policy</a>
        <span class="text-muted">&middot;</span>
        <a href="/shipping" class="mx-2">Shipping &amp; Delivery Policy</a>
      </div>
    </div>

  </div>
</main>

<style>
  .contact-page-container {
    background-color: #f8f9fa;
    min-height: 80vh;
  }
  .contact-card {
    transition: transform 0.3s ease;
  }
  .contact-card:hover {
    transform: translateY(-10px);
  }
  .icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bg-light-primary { background-color: rgba(13, 110, 253, 0.1); }
  .bg-light-success { background-color: rgba(25, 135, 84, 0.1); }
  .office-list li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 18px;
    font-size: 1.05rem;
    color: #4a5568;
    line-height: 1.7;
  }
  .office-list li:last-child { margin-bottom: 0; }
  .office-list i { width: 22px; text-align: center; margin-top: 5px; flex: 0 0 auto; }
  .office-list a { color: inherit; text-decoration: none; font-weight: 600; }
  .office-list a:hover { text-decoration: underline; }
  .policy-links a { color: #475569; font-weight: 600; text-decoration: none; }
  .policy-links a:hover { text-decoration: underline; }
  .office-card { background: #fff; }
</style>

<script>
  (function () {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var body =
        'Name: ' + v('cfName') + '\\n' +
        'Email: ' + v('cfEmail') + '\\n\\n' +
        v('cfMessage');
      window.location.href =
        'mailto:info@imaanakhlaq.org?subject=' +
        encodeURIComponent(v('cfSubject') || 'Website enquiry') +
        '&body=' + encodeURIComponent(body);
    });
  })();
</script>

${Footer()}
${BackToTop()}
`
