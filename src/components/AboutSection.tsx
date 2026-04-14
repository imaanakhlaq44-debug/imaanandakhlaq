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
        <style>
          @keyframes akhlaqFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.02); }
          }
          .akhlaq-anim {
            animation: akhlaqFloat 4s ease-in-out infinite;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .akhlaq-anim:hover {
            transform: scale(1.08) translateY(-10px) !important;
            animation-play-state: paused;
            filter: drop-shadow(0 30px 40px rgba(0,0,0,0.4)) !important;
          }
          
          /* Slide In using global AOS */
          [data-aos="akhlaq-walk"] {
            opacity: 0;
            transform: translateX(-100vw) rotate(-15deg);
            transition-property: transform, opacity;
          }
          [data-aos="akhlaq-walk"].aos-animate {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
        </style>
        <div class="ka-image-wrap" data-aos="akhlaq-walk" data-aos-duration="2000" data-aos-easing="ease-out-cubic">
          <img src="./kidba_assets/img/akhlaq-front-nobg.png" alt="About Kindergarten" class="ka-main-img akhlaq-anim" style="filter: drop-shadow(0 20px 30px rgba(0,0,0,0.3)); max-width: 90%; transform-origin: bottom center;">
        </div>
      </div>

      <!-- Right Content -->
      <div class="col-lg-6">
        <div class="ka-content">
          <h2 style="font-family: 'Fredoka One', cursive; margin-bottom: 20px;">Transforming Learning into Living</h2>
          <p>
            <strong>Imaan & Akhlaq</strong> brings to life the inspiring journey of two siblings who guide young learners to live with courage, kindness, and integrity.
          </p>
          <p>
            Designed as more than just a curriculum, the program offers a holistic learning experience that seamlessly blends structured books, engaging coloring activities, and prophetic storytelling with modern, interactive tools such as games, animations, and school-based clubs.
          </p>

          <ul class="ka-list">
            <li><strong>Prophetic Storytelling:</strong> Adventures inspired by timeless values.</li>
            <li><strong>Integrated Approach:</strong> Books, animations, and puppet shows.</li>
            <li><strong>Nationwide Impact:</strong> Launching nationwide in 2026!</li>
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
