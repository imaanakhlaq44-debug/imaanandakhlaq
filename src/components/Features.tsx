import { html } from 'hono/html';

export const WelcomeSection = () => html`
<!-- ===== KIDBA WELCOME SECTION ===== -->
<section class="kidba-welcome-section" id="welcome">
  <div class="container">
    <div class="row align-items-center g-5">
      
      <!-- Left Content: 2x2 Grid -->
      <div class="col-lg-7" data-aos="fade-right">
        <div class="kw-header">
          <h2>Welcome to Imaan Akhlaq</h2>
          <p>Here is what you can expect from a beautifully curated Islamic learning platform. Join us to make learning a joyful and engaging journey for your children!</p>
        </div>

        <div class="kw-features-grid">
          
          <!-- Box 1 -->
          <div class="kw-feature-item kw-item-green">
            <div class="kw-icon-box c-green">
              <i class="fas fa-book-reader"></i>
            </div>
            <div class="kw-text">
              <h4>Story-Based Learning</h4>
              <p>Engaging narratives children connect with.</p>
            </div>
          </div>

          <!-- Box 2 -->
          <div class="kw-feature-item kw-item-blue">
            <div class="kw-icon-box c-blue">
              <i class="fas fa-mosque"></i>
            </div>
            <div class="kw-text">
              <h4>Authentic Content</h4>
              <p>Reviewed by qualified Islamic scholars.</p>
            </div>
          </div>

          <!-- Box 3 -->
          <div class="kw-feature-item kw-item-orange">
            <div class="kw-icon-box c-orange">
              <i class="fas fa-globe"></i>
            </div>
            <div class="kw-text">
              <h4>Multilingual Content</h4>
              <p>Available in English, Urdu, and Arabic.</p>
            </div>
          </div>

          <!-- Box 4 -->
          <div class="kw-feature-item kw-item-pink">
            <div class="kw-icon-box c-pink">
              <i class="fas fa-theater-masks"></i>
            </div>
            <div class="kw-text">
              <h4>Live Puppet Shows</h4>
              <p>Interactive live puppet performances.</p>
            </div>
          </div>

        </div>
      </div>

      <!-- Right Content: Image & Play Button -->
      <div class="col-lg-5" data-aos="fade-left">
        <div class="kw-image-wrapper">
          <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=600" alt="Kidba Student">
          <div class="kw-play-btn">
            <i class="fas fa-play"></i>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
`;
