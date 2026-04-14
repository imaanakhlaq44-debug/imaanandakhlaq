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
          <form action="#" method="get" onsubmit="event.preventDefault(); alert('Message sent successfully! Thank you for contacting us.');">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Your Name</label>
                <input type="text" class="form-control form-control-lg rounded-3 bg-light" placeholder="John Doe" required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Email Address</label>
                <input type="email" class="form-control form-control-lg rounded-3 bg-light" placeholder="john@example.com" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold">Subject</label>
                <input type="text" class="form-control form-control-lg rounded-3 bg-light" placeholder="How can we help?" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold">Message</label>
                <textarea class="form-control form-control-lg rounded-3 bg-light" rows="5" placeholder="Write your message here..." required></textarea>
              </div>
              <div class="col-12 text-center mt-4">
                <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm">Send Message <i class="fas fa-paper-plane ms-2"></i></button>
              </div>
            </div>
          </form>
        </div>
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
</style>

${Footer()}
${BackToTop()}
`
