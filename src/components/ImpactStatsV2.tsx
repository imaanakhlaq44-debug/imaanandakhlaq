import { html } from 'hono/html'

export const ImpactStatsV2 = () => html`
<!-- ===== KIDBA STATS SECTION ===== -->
<section class="kidba-stats-section" id="stats" style="margin-top: 60px;">
  
  <!-- JAGGED TOP EDGE -->
  <div class="kidba-stats-shape-top">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,6V0h1000v100L0,6z"></path>
    </svg>
  </div>

  <div class="container">
    <div class="kstats-header" data-aos="fade-up">
      <h2 style="font-family: 'Fredoka One', cursive; margin-bottom: 20px;">Impact Snapshot</h2>
      <p>A growing movement for character transformation across the nation.</p>
    </div>

    <div class="kstats-grid">
      
      <!-- Box 1 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="100">
        <div class="kstat-diamond c-green">
          <div class="kstat-icon"><i class="fas fa-rocket"></i></div>
        </div>
        <h3 class="sc-number" data-target="2026" data-no-format="true">0</h3>
        <p>National Launch Year</p>
      </div>

      <!-- Box 2 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="200">
        <div class="kstat-diamond c-orange">
          <div class="kstat-icon"><i class="fas fa-book-reader"></i></div>
        </div>
        <h3 class="sc-number" data-target="2700">0</h3>
        <p>Curriculum Books</p>
      </div>

      <!-- Box 3 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="300">
        <div class="kstat-diamond c-cyan">
          <div class="kstat-icon"><i class="fas fa-theater-masks"></i></div>
        </div>
        <h3 class="sc-number" data-target="4000">0</h3>
        <p>Puppet Shows</p>
      </div>

      <!-- Box 4 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="400">
        <div class="kstat-diamond c-pink">
          <div class="kstat-icon"><i class="fas fa-users"></i></div>
        </div>
        <h3 class="sc-number" data-target="6000">0</h3>
        <p>Club Engagements</p>
      </div>

    </div>
  </div>

  <!-- JAGGED BOTTOM EDGE -->
  <div class="kidba-stats-shape-bottom">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,6V0h1000v100L0,6z"></path>
    </svg>
  </div>

</section>
`
