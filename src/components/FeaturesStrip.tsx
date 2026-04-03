import { html } from 'hono/html';

export const FeaturesStrip = () => html`
<!-- ===== KIDBA WELCOME / FEATURES SECTION ===== -->
<section class="kidba-features-section" id="welcome">
  <div class="container">
    <div class="row align-items-center g-5">
      
      <!-- Left Content: Grid -->
      <div class="col-lg-7">
        <h2 class="kf-title">Welcome to Our Kidba</h2>
        <p class="kf-subtitle">
          Here is what you can expect from Imaan & Akhlaq's magical world of Islamic learning. We combine storytelling and fun activities!
        </p>
        
        <div class="kf-grid">
          <!-- Item 1 -->
          <div class="kf-item">
            <div class="kf-icon bg-lime"><i class="fas fa-book-reader"></i></div>
            <div class="kf-text">
              <h4>Story-Based Learning</h4>
              <p>Engaging narratives children connect with.</p>
            </div>
          </div>
          <!-- Item 2 -->
          <div class="kf-item">
            <div class="kf-icon bg-cyan"><i class="fas fa-mosque"></i></div>
            <div class="kf-text">
              <h4>Authentic Content</h4>
              <p>Reviewed by qualified Islamic scholars.</p>
            </div>
          </div>
          <!-- Item 3 -->
          <div class="kf-item">
            <div class="kf-icon bg-orange"><i class="fas fa-globe"></i></div>
            <div class="kf-text">
              <h4>Multilingual</h4>
              <p>Available in English, Urdu, and Arabic.</p>
            </div>
          </div>
          <!-- Item 4 -->
          <div class="kf-item">
            <div class="kf-icon bg-pink"><i class="fas fa-theater-masks"></i></div>
            <div class="kf-text">
              <h4>Puppet Shows</h4>
              <p>Interactive live puppet performances.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Image -->
      <div class="col-lg-5 text-center">
        <div class="kf-image-wrap">
          <img src="/static/img/imaan-front.jpg" alt="Child Learning" class="kf-image">
          <div class="kf-play-btn">
            <i class="fas fa-play"></i>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
`;
