import { html } from 'hono/html';
export const Contact = () => html`\n<!-- ===== CONTACT ===== -->\n
  <section class="contact-section section-padding bg-light-green" id="contact">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-7 text-center">
          <div class="section-tag">Contact Us</div>
          <h2 class="section-title">Get in <span class="text-green">Touch</span> With Us</h2>
          <p class="section-subtitle">Whether you want to book a puppet show, collaborate, or 
          simply learn more — we'd love to hear from you!</p>
        </div>
      </div>
      <div class="row g-5 mt-2">
        <div class="col-lg-5">
          <div class="contact-info-panel" data-aos="fade-right">
            <div class="cip-item">
              <div class="cip-icon" style="background: linear-gradient(135deg, #D63678, #E08020)">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="cip-text">
                <h6>Our Location</h6>
                <p>Barakahu Campus, Islamabad, Pakistan</p>
              </div>
            </div>
            <div class="cip-item">
              <div class="cip-icon" style="background: linear-gradient(135deg, #E08020, #B85F0A)">
                <i class="fas fa-envelope"></i>
              </div>
              <div class="cip-text">
                <h6>Email Us</h6>
                <p>info@imaanakhlaq.org</p>
              </div>
            </div>
            <div class="cip-item">
              <div class="cip-icon" style="background: linear-gradient(135deg, #1E2D5A, #2E4480)">
                <i class="fas fa-phone"></i>
              </div>
              <div class="cip-text">
                <h6>Call Us</h6>
                <p>+92 339 0106475</p>
              </div>
            </div>
            <div class="cip-item">
              <div class="cip-icon" style="background: linear-gradient(135deg, #C99A6B, #A07844)">
                <i class="fas fa-clock"></i>
              </div>
              <div class="cip-text">
                <h6>Working Hours</h6>
                <p>Mon – Fri: 9:00 AM – 5:00 PM<br>Sat: 10:00 AM – 2:00 PM</p>
              </div>
            </div>
            <div class="cip-social">
              <h6>Follow Us</h6>
              <div class="cip-social-links">
                <a href="https://www.instagram.com/imaanakhlaq/" target="_blank" 
                   style="background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)">
                  <i class="fab fa-instagram"></i>
                </a>
                <a href="https://www.facebook.com/ImaanAkhlaqTalks/" target="_blank" 
                   style="background:#1877F2">
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.youtube.com/@ImaanAkhlaq" target="_blank" 
                   style="background:#FF0000">
                  <i class="fab fa-youtube"></i>
                </a>
                <a href="https://twitter.com/ImaanAkhlaq" target="_blank" 
                   style="background:#1DA1F2">
                  <i class="fab fa-twitter"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="contact-form-panel" data-aos="fade-left">
            <h4 class="cfp-title">Send Us a Message</h4>
            <form id="contactForm" class="contact-form">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-group-custom">
                    <label>Your Name *</label>
                    <div class="input-wrap">
                      <i class="fas fa-user input-icon"></i>
                      <input type="text" placeholder="e.g. Ahmed Ali" required>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group-custom">
                    <label>Email Address *</label>
                    <div class="input-wrap">
                      <i class="fas fa-envelope input-icon"></i>
                      <input type="email" placeholder="your@email.com" required>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group-custom">
                    <label>Phone Number</label>
                    <div class="input-wrap">
                      <i class="fas fa-phone input-icon"></i>
                      <input type="tel" placeholder="+92 300 0000000">
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group-custom">
                    <label>Subject *</label>
                    <div class="input-wrap">
                      <i class="fas fa-tag input-icon"></i>
                      <select required>
                        <option value="">Select a topic</option>
                        <option>Book a Puppet Show</option>
                        <option>School Program Inquiry</option>
                        <option>Collaboration / Partnership</option>
                        <option>Content Licensing</option>
                        <option>Teacher Training</option>
                        <option>General Inquiry</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="form-group-custom">
                    <label>Your Message *</label>
                    <div class="input-wrap textarea-wrap">
                      <i class="fas fa-comment input-icon"></i>
                      <textarea rows="5" placeholder="Tell us about your school, event, or how we can help..." required></textarea>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <button type="submit" class="btn btn-contact-submit">
                    <i class="fas fa-paper-plane me-2"></i> Send Message
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  \n`;
