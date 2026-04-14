import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutIntroPage = () => html`
${Head()}
${Header()}

<style>
  .about-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .about-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #1E2D5A 0%, #B02460 50%, #D63678 100%); color: white; text-align: center; overflow: hidden; }
  .about-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .about-hero-content { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; }
  .about-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .about-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  /* Vision Container */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .vision-card { position: relative; z-index: 3; background: white; padding: 50px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); margin-top: -80px; margin-bottom: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
  .vision-col h3 { font-family: 'Fredoka One', cursive; font-size: 2rem; color: #1E2D5A; margin-bottom: 20px; }
  .vision-col p { font-size: 1.1rem; line-height: 1.8; color: #475569; }
  @media(max-width: 768px) { .vision-card { grid-template-columns: 1fr; padding: 30px; margin-top: -50px; gap: 30px;} }

  /* Introduction Chars */
  .intro-chars { display: flex; gap: 15px; margin-top: 20px; padding: 15px; background: rgba(224,128,32,0.1); border-radius: 20px; border: 1px dashed #E08020; align-items: center; }
  .char-circle { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #E08020; box-shadow: 0 5px 15px rgba(224,128,32,0.4); object-fit: cover; }
  
  /* Grid Cards */
  .objectives-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
  @media(min-width: 1200px) { .objectives-grid { display: flex; flex-wrap: nowrap; } .objectives-grid .obj-card { flex: 1; } }
  
  .obj-card { background: white; padding: 35px 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s ease; position: relative; overflow: hidden; }
  .obj-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
  .obj-card::before { content:''; position: absolute; top:0; left:0; width: 5px; height: 100%; }
  .bg-orange::before { background: #E08020; } .bg-pink::before { background: #D63678; } .bg-tan::before { background: #C99A6B; } .bg-navy::before { background: #1E2D5A; }
  .obj-card h4 { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin-bottom: 15px; }

  .content-section { padding: 60px 0; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 50px; }

  /* Progression Specific */
  .progression-flex { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; align-items: stretch; }
  @media (min-width: 1200px) { .progression-flex { flex-wrap: nowrap; } }
  .progression-flex .obj-card { flex: 1; min-width: 200px; padding: 25px 20px; text-align: center; }
  .prog-badge { display: inline-block; padding: 6px 15px; border-radius: 20px; font-family: 'Fredoka One', cursive; font-size: 0.9rem; margin-bottom: 15px; }
  .badge-t { background: rgba(201, 154, 107, 0.1); color: #C99A6B; } .badge-n { background: rgba(30, 45, 90, 0.1); color: #1E2D5A; } .badge-y { background: rgba(224, 128, 32, 0.1); color: #E08020; } .badge-p { background: rgba(214, 54, 120, 0.1); color: #D63678; }
  
  .prog-arrow-highlight { font-size: 1.5rem; color: white; background: #E08020; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; animation: pulseArrow 2s infinite; box-shadow: 0 0 15px rgba(224, 128, 32, 0.4); margin: auto; }
  @keyframes pulseArrow { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 128, 32, 0.7); } 70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(224, 128, 32, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 128, 32, 0); } }
  
  .about-3d-icon { width: 65px; height: 65px; object-fit: contain; margin-bottom: 15px; }
</style>

<div class="about-page">
  <div class="about-hero">
    <div class="about-hero-content" data-aos="fade-up">
      <h1>Introduction & Objective</h1>
      <p>Rooted in timeless Islamic values, Imaan & Akhlaq brings to life the inspiring journey of two siblings Imaan (faith) and Akhlaq (character) who guide young learners to live with courage, kindness, and integrity.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="container">
    <div class="vision-card" data-aos="fade-up" data-aos-delay="100">
      <div class="vision-col">
        <h3>Our Vision</h3>
        <p>To nurture a generation of confident, responsible, and virtuous Muslims by embedding Imaan (faith) and Akhlaq (character) at the heart of education, enabling young learners to live with courage, kindness, and integrity in every aspect of life.</p>
        
        <div class="intro-chars">
          <img src="/kidba_assets/img/profile_imaan_hd.png" alt="Imaan" class="char-circle" />
          <img src="/kidba_assets/img/profile_akhlaq_hd.png" alt="Akhlaq" class="char-circle" />
          <div>
            <h5 style="margin: 0; color: #1E2D5A; font-weight: 800;">Guided by Imaan & Akhlaq</h5>
            <small class="text-muted">Interactive character popups feature heavily in our educational experiences.</small>
          </div>
        </div>
      </div>
      <div class="vision-col">
        <h3>Introduction</h3>
        <p>Designed as more than just a curriculum, the program offers a holistic learning experience that seamlessly blends structured books, engaging coloring activities, and prophetic storytelling with modern tools such as games, animations, and school-based clubs.</p>
        <p>At its core, Imaan & Akhlaq aims to develop children into Moral figures of <strong>Uswah e Hasana</strong>. Following the success of pilot implementations, the program is set for a nationwide launch in 2026!</p>
      </div>
    </div>
  </div>

  <div class="content-section" style="padding-top: 0;">
    <div class="container">
      <div class="title-center" data-aos="fade-up">
        <h2 class="section-title">Core Objectives</h2>
      </div>
      <div class="objectives-grid" data-aos="fade-up" data-aos-delay="100">
        <div class="obj-card bg-orange">
          <div style="margin-bottom: 5px;"><img src="/kidba_assets/img/icon_heart.png" class="about-3d-icon" /></div>
          <h4>Character-Centered</h4>
          <p class="text-muted">To develop strong moral character in children by integrating Islamic values into everyday learning and behavior.</p>
        </div>
        <div class="obj-card bg-pink">
          <div style="margin-bottom: 5px;"><img src="/kidba_assets/img/icon_game.png" class="about-3d-icon" /></div>
          <h4>Holistic Learning</h4>
          <p class="text-muted">To combine curriculum, storytelling, activities, and interactive tools for engaging and meaningful education.</p>
        </div>
        <div class="obj-card bg-tan">
          <div style="margin-bottom: 5px;"><img src="/kidba_assets/img/icon_conviction.png" class="about-3d-icon" /></div>
          <h4>Faith Integration</h4>
          <p class="text-muted">To strengthen children's connection with Islamic teachings through prophetic stories and value-based narratives.</p>
        </div>
        <div class="obj-card bg-navy">
          <div style="margin-bottom: 5px;"><img src="/kidba_assets/img/icon_purpose.png" class="about-3d-icon" /></div>
          <h4>Behavior Transformation</h4>
          <p class="text-muted">To inspire children to practice courage, kindness, responsibility, and integrity in real-life situations.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="content-section" style="background: white;">
    <div class="container">
      <div class="title-center" data-aos="fade-up">
        <h2 class="section-title">Progression Focus</h2>
      </div>
      <div class="progression-flex" data-aos="fade-up" data-aos-delay="100">
        <div class="obj-card" style="text-align: center;">
          <img src="/kidba_assets/img/prog_new_p1.png" style="width: 100%; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(201,154,107,0.2);" />
          <span class="prog-badge badge-t">Ages 5 - 8</span>
          <h4 style="color: #C99A6B;">Foundation Stage</h4>
          <p class="text-muted text-start">Foundational Character Building: Storytelling, Basic Activity Modules, and Introduction to Prophetic Narratives.</p>
        </div>
        <div class="d-none d-xl-flex align-items-center justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="obj-card" style="text-align: center;">
          <img src="/kidba_assets/img/prog_new_p2.png" style="width: 100%; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(30,45,90,0.2);" />
          <span class="prog-badge badge-n">Ages 9 - 10</span>
          <h4 style="color: #1E2D5A;">Interactive Stage</h4>
          <p class="text-muted text-start">Interactive Development: Advanced Club Engagements, Responsibility Focus, and Group Tasks.</p>
        </div>
        <div class="d-none d-xl-flex align-items-center justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="obj-card" style="text-align: center;">
          <img src="/kidba_assets/img/prog_new_p3.png" style="width: 100%; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(224,128,32,0.2);" />
          <span class="prog-badge badge-y">Ages 11 - 13</span>
          <h4 style="color: #E08020;">Ethical Maturation</h4>
          <p class="text-muted text-start">Ethical Maturation: Real-World Scenarios, Peer Mentoring, and Leadership through Prophetic Stories.</p>
        </div>
        <div class="d-none d-xl-flex align-items-center justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="obj-card" style="text-align: center;">
          <img src="/kidba_assets/img/prog_new_p4.png" style="width: 100%; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(214,54,120,0.2);" />
          <span class="prog-badge badge-p">Ages 14+</span>
          <h4 style="color: #D63678;">Uswah e Hasana</h4>
          <p class="text-muted text-start">Uswah e Hasana Practice: Embodying Character, Leading Clubs, and Complex Behavioral Transformation.</p>
        </div>
      </div>
    </div>
  </div>
</div>
${Footer()}
`
