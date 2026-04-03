import { html } from 'hono/html';

export const StatsCounter = () => html`
<!-- ===== KIDBA STATS SECTION ===== -->
<section class="kidba-stats-section" id="stats">
  
  <!-- JAGGED TOP EDGE -->
  <div class="kidba-stats-shape-top">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,6V0h1000v100L0,6z"></path>
    </svg>
  </div>

  <div class="container">
    <div class="kstats-header" data-aos="fade-up">
      <h2>Unique learning Environment</h2>
      <p>Here is what you can expect from our beautifully curated Islamic learning platform. We strive to provide the most engaging modules for young Muslims!</p>
    </div>

    <div class="kstats-grid">
      
      <!-- Box 1 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="100">
        <div class="kstat-diamond c-green">
          <div class="kstat-icon"><i class="fas fa-book-open"></i></div>
        </div>
        <h3 class="sc-number" data-target="3500">0</h3>
        <p>Students Enrolled</p>
      </div>

      <!-- Box 2 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="200">
        <div class="kstat-diamond c-orange">
          <div class="kstat-icon"><i class="fas fa-trophy"></i></div>
        </div>
        <h3 class="sc-number" data-target="912">0</h3>
        <p>Best Awards Won</p>
      </div>

      <!-- Box 3 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="300">
        <div class="kstat-diamond c-cyan">
          <div class="kstat-icon"><i class="fas fa-pencil-ruler"></i></div>
        </div>
        <h3 class="sc-number" data-target="370">0</h3>
        <p>Classes Completed</p>
      </div>

      <!-- Box 4 -->
      <div class="kstat-item" data-aos="fade-up" data-aos-delay="400">
        <div class="kstat-diamond c-pink">
          <div class="kstat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        </div>
        <h3 class="sc-number" data-target="648">0</h3>
        <p>Our Total Courses</p>
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
`;
