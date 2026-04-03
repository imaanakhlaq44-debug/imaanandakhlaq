import { html } from 'hono/html';

export const AboutSection = () => html`
<!-- ===== KIDBA ABOUT SECTION ===== -->
<section class="kidba-about-section" id="about">
  
  <!-- JAGGED TOP EDGE -->
  <div class="kidba-shape-top">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path class="shape-fill" d="M0,6V0h1000v100L0,6z"></path>
    </svg>
  </div>

  <div class="container">
    <div class="row align-items-center g-5">
      
      <!-- Left Image -->
      <div class="col-lg-6">
        <div class="ka-image-wrap">
          <img src="/static/img/akhlaq-front.jpg" alt="About Kindergarten" class="ka-main-img">
        </div>
      </div>

      <!-- Right Content -->
      <div class="col-lg-6">
        <div class="ka-content">
          <h2>About Kindergarten School</h2>
          <p>
            <strong>Imaan & Akhlaq</strong> is an educational initiative by <em>Ilm O Amal</em> that
            brings Islamic values to life through beautifully crafted stories, puppet shows, and interactive
            learning experiences for Grade 1–5 children.
          </p>
          <p>
            Our characters journey through stories inspired by the Prophets, teaching children about honesty, 
            kindness, respect, and the love of Allah.
          </p>

          <ul class="ka-list">
            <li>Prophet Stories: Adventures inspired by Quranic prophets.</li>
            <li>Tarbiyah-Based: Islamic manners and daily life lessons.</li>
            <li>Educator Approved: Reviewed by Islamic scholars & teachers.</li>
          </ul>

          <a href="#programs" class="btn-kidba-orange mt-3">
            ADMISSION NOW <i class="fas fa-arrow-right ms-2"></i>
          </a>
        </div>
      </div>

    </div>
  </div>

  <!-- JAGGED BOTTOM EDGE -->
  <div class="kidba-shape-bottom">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path class="shape-fill" d="M0,6V0h1000v100L0,6z"></path>
    </svg>
  </div>

</section>
`;
