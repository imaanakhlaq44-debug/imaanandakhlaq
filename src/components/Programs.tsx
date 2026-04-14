import { html } from 'hono/html';

export const Programs = () => html`
<!-- ===== KIDBA PROGRAMS SECTION ===== -->
<section class="kidba-programs-section" id="programs">
  <div class="container">
    
    <div class="kp-header" data-aos="fade-up">
      <h2>Our Popular Packages</h2>
      <p>Here is what you can expect from our educational modules. Choose the best learning path for your kids!</p>
    </div>

    <!-- Filters (Visual only as per design) -->
    <div class="kp-filters" data-aos="fade-up" data-aos-delay="100">
      <button class="kp-filter-btn active">SEE ALL</button>
      <button class="kp-filter-btn">TRENDING</button>
      <button class="kp-filter-btn">POPULARITY</button>
      <button class="kp-filter-btn">FEATURED</button>
    </div>

    <div class="row g-4">
      
      <!-- Card 1 -->
      <div class="col-md-6 col-lg-4">
        <div class="kidba-program-card" data-aos="fade-up" data-aos-delay="100">
          <div class="kpc-image-area">
            <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600" alt="Digital Story" style="width:100%; height:100%; object-fit:cover;">
            <div class="kpc-price-tag" style="background: #1BCBE3">Ages 5-8</div>
          </div>
          <div class="kpc-body">
            <span class="kpc-badge" style="background:#32B74A">Stories</span>
            <h5 class="kpc-title">Digital Story Series</h5>
            <div class="kpc-time">Read Time : 20 - 30 min</div>
            <p class="kpc-desc">
              Follow Imaan and Akhlaq as they discover Islamic morals through exciting adventures inspired by Prophets.
            </p>
            <div class="kpc-footer">
              <span>Lessons : <strong>15+</strong></span>
              <span>Level : <strong>Beginner</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="col-md-6 col-lg-4">
        <div class="kidba-program-card" data-aos="fade-up" data-aos-delay="200">
          <div class="kpc-image-area">
            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600" alt="Puppet Show" style="width:100%; height:100%; object-fit:cover;">
            <div class="kpc-price-tag" style="background: #FF4A5A">All Ages</div>
          </div>
          <div class="kpc-body">
            <span class="kpc-badge" style="background:#FF9B26">Live Show</span>
            <h5 class="kpc-title">Puppet Performance</h5>
            <div class="kpc-time">Show Time : 60 - 90 min</div>
            <p class="kpc-desc">
              Our beloved puppets visit your school or madrasa for an unforgettable interactive performance that children adore.
            </p>
            <div class="kpc-footer">
              <span>Kids : <strong>20 - 100</strong></span>
              <span>Level : <strong>All</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="col-md-6 col-lg-4">
        <div class="kidba-program-card" data-aos="fade-up" data-aos-delay="300">
          <div class="kpc-image-area">
            <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=600" alt="Character Building" style="width:100%; height:100%; object-fit:cover;">
            <div class="kpc-price-tag" style="background: #32B74A">Ages 8-12</div>
          </div>
          <div class="kpc-body">
            <span class="kpc-badge" style="background:#E0287D">School</span>
            <h5 class="kpc-title">Character Building</h5>
            <div class="kpc-time">Duration : 10 Weeks</div>
            <p class="kpc-desc">
              A structured curriculum integrating stories into schools with teacher guides and assessment tools.
            </p>
            <div class="kpc-footer">
              <span>Weeks : <strong>10</strong></span>
              <span>Level : <strong>Intermediate</strong></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
`;
