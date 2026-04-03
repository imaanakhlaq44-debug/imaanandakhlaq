import { html } from 'hono/html';

export const Footer = () => html`
<!-- ===== KIDBA FOOTER & NEWSLETTER ===== -->
  <footer class="kidba-footer-wrapper" id="footer">
    
    <!-- Newsletter Box (Absolute Positioned over Jagged Edge) -->
    <div class="kidba-newsletter" data-aos="fade-up">
      <div class="kn-content">
        <h3>Join Our Newsletter</h3>
        <p>Subscribe to get our latest news & updates!</p>
      </div>
      <div class="kn-form">
        <input type="email" placeholder="Your email address">
        <button type="submit">Subscribe</button>
      </div>
    </div>

    <!-- JAGGED TOP EDGE -->
    <div class="kf-shape-top">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path class="shape-fill" d="M0,6V0h1000v100L0,6z"></path>
      </svg>
    </div>

    <div class="kidba-footer-main">
      <div class="container">
        <div class="row g-5">
          
          <!-- Column 1: Brand & About -->
          <div class="col-lg-4">
            <div class="kfm-about">
              <!-- Using text instead of image for simple placeholder -->
              <h2 style="font-family: 'Fredoka One', cursive; color: #fff; margin-bottom: 20px;">Imaan & Akhlaq</h2>
              <p>Bringing Islamic values to life through joyful storytelling, puppet shows, and educational adventures for children aged 5–12.</p>
              <div class="kfm-social">
                <a href="https://www.facebook.com/ImaanAkhlaqTalks/" target="_blank"><i class="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/ImaanAkhlaq" target="_blank"><i class="fab fa-twitter"></i></a>
                <a href="https://www.youtube.com/@ImaanAkhlaq" target="_blank"><i class="fab fa-youtube"></i></a>
                <a href="https://www.instagram.com/imaanakhlaq/" target="_blank"><i class="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="col-sm-6 col-lg-3">
            <h4 class="kfm-title">Quick Links</h4>
            <ul class="kfm-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#programs">Programs</a></li>
              <li><a href="#stories">Stories</a></li>
              <li><a href="#team">Teachers</a></li>
            </ul>
          </div>

          <!-- Column 3: Contact Info -->
          <div class="col-sm-6 col-lg-4">
            <h4 class="kfm-title">Contact Us</h4>
            <ul class="kfm-address">
              <li>
                <i class="fas fa-map-marker-alt"></i>
                <span style="color: rgba(255,255,255,0.7)">SEERAHT Initiatives, Ilm o Amal Center, Jinnah Garden, Islamabad, Pakistan</span>
              </li>
              <li>
                <i class="fas fa-envelope"></i>
                <span style="color: rgba(255,255,255,0.7)">info@imaanakhlaq.org</span>
              </li>
              <li>
                <i class="fas fa-phone"></i>
                <span style="color: rgba(255,255,255,0.7)">+92 300 1234567</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>

    <!-- Google Map -->
    <div class="kidba-map-section">
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1660.2!2d73.1767332!3d33.5784375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfed00214d3841%3A0x3029ccd22ce26b5a!2sSEERAHT%20Initiatives!5e0!3m2!1sen!2spk!4v1711836000000"
        width="100%" 
        height="350" 
        style="border:0;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>
    </div>

    <div class="kidba-footer-bottom">
      &copy; 2026 Imaan & Akhlaq – An Ilm O Amal Initiative. All rights reserved.
    </div>

  </footer>

  <!-- Bootstrap 5 JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Swiper JS -->
  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

  <!-- AOS Animation -->
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>

  <!-- Custom JS -->
  <script src="/static/js/main.js"></script>
</body>
</html>
`;
