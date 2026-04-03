import { html } from 'hono/html';

export const HeroSlider = () => html`
<!-- ===== KIDBA-STYLE HERO SECTION ===== -->
<section class="kidba-hero" id="home">

  <!-- ── FULL-SCREEN BACKGROUND IMAGE ── -->
  <div class="kh-bg-image"></div>

  <!-- ── ORANGE-LEFT GRADIENT OVERLAY (exact Kidba style) ── -->
  <div class="kh-overlay"></div>

  <!-- ── ANIMATED CHALK DOODLES ── -->
  <div class="kh-doodles" aria-hidden="true">
    <svg class="kh-doodle kh-doodle-star1" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 5 L35 20 L50 20 L39 29 L43 44 L30 35 L17 44 L21 29 L10 20 L25 20 Z"
            stroke="white" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-circle1" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="25" stroke="white" stroke-width="2.5" stroke-dasharray="8 6" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-triangle1" viewBox="0 0 60 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 5 L55 50 L5 50 Z" stroke="white" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-star2" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 5 L29 18 L43 18 L32 26 L36 39 L25 31 L14 39 L18 26 L7 18 L21 18 Z"
            stroke="white" stroke-width="2" stroke-linejoin="round" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-circle2" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="20" stroke="white" stroke-width="2" fill="none"/>
      <circle cx="25" cy="25" r="10" stroke="white" stroke-width="2" stroke-dasharray="5 5" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-squiggle" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 20 C15 5, 25 35, 35 20 S55 5, 65 20 S85 35, 95 20" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <svg class="kh-doodle kh-doodle-heart" viewBox="0 0 60 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 48 C10 35, 5 18, 15 10 C21 5, 28 7, 30 12 C32 7, 39 5, 45 10 C55 18, 50 35, 30 48 Z"
            stroke="white" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
    </svg>
    <!-- Floating Bubbles -->
    <div class="kh-bubble kh-bubble-1"></div>
    <div class="kh-bubble kh-bubble-2"></div>
    <div class="kh-bubble kh-bubble-3"></div>
    <div class="kh-bubble kh-bubble-4"></div>
    <div class="kh-bubble kh-bubble-5"></div>
  </div>

  <!-- ── LEFT: SCROLL INDICATOR ── -->
  <div class="kh-scroll-hint" aria-label="Scroll down">
    <div class="kh-scroll-mouse">
      <div class="kh-scroll-wheel"></div>
    </div>
    <span class="kh-scroll-text">Scroll</span>
  </div>

  <!-- ── MAIN CONTENT ── -->
  <div class="container-fluid h-100 px-0">
    <div class="row h-100 kh-row g-0">

      <!-- HERO LEFT CONTENT — Aligned to absolute left as per drawing -->
      <div class="col-lg-7 col-xl-6 kh-content-col pt-5">
        <div class="kh-content ps-4 ps-md-5" id="hero-content">

          <!-- Tag line: Subtle float in -->
          <div class="kh-tag animate__animated animate__fadeInDown animate__fast">
            <i class="fas fa-star"></i>
            Teaching Children Faith &amp; Manners
          </div>

          <!-- Headline: Strong slide in from left -->
          <h1 class="kh-title animate__animated animate__fadeInLeft">
            Joyful<br>
            <span class="kh-title-highlight">Islamic</span><br>
            Stories
          </h1>

          <!-- Description: Slower slide in from left with delay -->
          <p class="kh-desc animate__animated animate__fadeInLeft animate__delay-1s">
            We bring Islamic values to life through beautifully crafted stories,<br>
            puppet shows, and interactive adventures for Grade 1–5 children.
          </p>

          <!-- CTA Buttons: Pop up with delay -->
          <div class="kh-actions animate__animated animate__fadeInUp animate__delay-2s">
            <a href="#programs" class="kh-btn-primary" id="hero-enroll-btn">
              <i class="fas fa-graduation-cap"></i>
              Enroll Now
            </a>
            <a href="#stories" class="kh-btn-secondary" id="hero-stories-btn">
              <i class="fas fa-play"></i>
              Our Stories
            </a>
          </div>

          <!-- Stats row: Gentle rise with longer delay -->
          <div class="kh-mini-stats animate__animated animate__fadeInUp animate__delay-3s">
            <div class="kh-stat">
              <strong>500+</strong>
              <span>Happy Kids</span>
            </div>
            <div class="kh-stat-divider"></div>
            <div class="kh-stat">
              <strong>50+</strong>
              <span>Stories</span>
            </div>
            <div class="kh-stat-divider"></div>
            <div class="kh-stat">
              <strong>3</strong>
              <span>Languages</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- ── TORN PAPER BOTTOM DIVIDER ── -->
  <div class="kh-torn-bottom" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
      <path fill="#ffffff"
        d="M0,100 L1440,100 L1440,40
           L1400,15 L1360,45 L1320,20 L1280,50 L1240,18
           L1200,48 L1160,22 L1120,52 L1080,16 L1040,46
           L1000,20 L960,50 L920,25 L880,55 L840,18
           L800,48 L760,22 L720,52 L680,16 L640,46
           L600,22 L560,52 L520,18 L480,48 L440,24
           L400,54 L360,20 L320,50 L280,16 L240,46
           L200,22 L160,52 L120,18 L80,48 L40,14 L0,44
        Z"/>
    </svg>
  </div>

</section>
`;
