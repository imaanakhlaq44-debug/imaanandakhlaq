import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutTeamPage = () => html`
${Head()}
${Header()}

<style>
  .about-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .about-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #1E2D5A 0%, #E08020 100%); color: white; text-align: center; overflow: hidden; }
  .about-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .about-hero-content { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; }
  .about-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .about-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  /* GLOBAL LAYOUT */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 15px; position: relative; }
  .section-title::after { content: ''; display: block; width: 60px; height: 5px; background: #D63678; margin: 15px auto 0; border-radius: 3px; }
  .group-title-container { text-align: center; margin: 70px 0 40px; }
  .group-title { font-family: 'Fredoka One', cursive; font-size: 1.8rem; color: #1E2D5A; position: relative; display: inline-block; padding: 12px 35px; background: rgba(255,255,255,0.9); border-radius: 40px; border: 2px solid #e2e8f0; border-bottom: 5px solid; box-shadow: 0 10px 20px rgba(0,0,0,0.03); }

  /* TEAM GRID & CARDS */
  .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; margin-bottom: 40px; }
  .team-card { 
    background: rgba(255, 255, 255, 0.85); 
    backdrop-filter: blur(10px);
    padding: 35px 25px; 
    border-radius: 24px; 
    text-align: center; 
    box-shadow: 0 10px 40px rgba(30, 45, 90, 0.04), inset 0 2px 5px rgba(255,255,255,1); 
    border: 1px solid rgba(255,255,255,0.5); 
    border-bottom: 6px solid #1E2D5A;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
    position: relative;
    overflow: hidden;
  }
  .team-card::before {
    content: ''; position: absolute; top:0; left:0; width:100%; height:100%;
    background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }
  .team-card:hover { 
    transform: translateY(-8px); 
    box-shadow: 0 20px 50px rgba(30, 45, 90, 0.1), inset 0 2px 5px rgba(255,255,255,1); 
  }
  
  .team-avatar { 
    width: 90px; height: 90px; 
    border-radius: 50%; 
    color: white; 
    font-size: 2.2rem; 
    font-weight: bold; 
    display: flex; align-items: center; justify-content: center; 
    margin: 0 auto 20px; 
    font-family: 'Fredoka One', cursive; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
    position: relative;
    z-index: 2;
    border: 4px solid white;
    transition: transform 0.4s;
  }
  .team-card:hover .team-avatar {
    transform: scale(1.1) rotate(5deg);
  }
  .team-card h4 { font-size: 1.35rem; font-weight: 800; color: #1E2D5A; margin-bottom: 5px; position: relative; z-index: 2; }
  .team-role { font-size: 0.80rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; position: relative; z-index: 2; border-radius: 12px; padding: 5px 12px; display: inline-block; }
  .team-desc { font-size: 0.95rem; color: #64748b; line-height: 1.6; position: relative; z-index: 2; margin: 0;}

  /* Colors mappings for border and tags */
  .color-navy { border-bottom-color: #1E2D5A; }
  .color-navy .team-role { background: rgba(30, 45, 90, 0.1); color: #1E2D5A; }
  .color-navy .team-avatar { background: linear-gradient(135deg, #1E2D5A, #3B82F6); box-shadow: 0 10px 25px rgba(30, 45, 90, 0.3); }

  .color-pink { border-bottom-color: #D63678; }
  .color-pink .team-role { background: rgba(214, 54, 120, 0.1); color: #D63678; }
  .color-pink .team-avatar { background: linear-gradient(135deg, #D63678, #F472B6); box-shadow: 0 10px 25px rgba(214, 54, 120, 0.3); }

  .color-teal { border-bottom-color: #10B981; }
  .color-teal .team-role { background: rgba(16, 185, 129, 0.1); color: #10B981; }
  .color-teal .team-avatar { background: linear-gradient(135deg, #10B981, #34D399); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); }

  .color-orange { border-bottom-color: #E08020; }
  .color-orange .team-role { background: rgba(224, 128, 32, 0.1); color: #E08020; }
  .color-orange .team-avatar { background: linear-gradient(135deg, #E08020, #FBBF24); box-shadow: 0 10px 25px rgba(224, 128, 32, 0.3); }

</style>

<div class="about-page">
  <div class="about-hero">
    <div class="about-hero-content" data-aos="fade-up">
      <h1>Team in Vision</h1>
      <p>A Collective Effort Behind the Movement.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="container" style="margin-top: 40px;">
    <div class="title-center" data-aos="fade-up">
      <h2 class="section-title">The Makers</h2>
      <p style="max-width: 700px; margin: 0 auto; color: #64748b; text-align: center; font-size: 1.1rem; line-height: 1.8;">Behind Imaan & Akhlaq is a dedicated team of individuals committed to nurturing faith, character, and meaningful learning experiences for the next generation.</p>
    </div>
    
    <div class="team-grid" data-aos="fade-up" data-aos-delay="100">
      <div class="team-card color-navy">
        <div class="team-avatar">SU</div>
        <h4>Saith Usama J.</h4>
        <div class="team-role">Foundation Builder & Visionary</div>
        <p class="team-desc">The driving force behind the initiative, leading the vision of integrating faith-based character building into modern education.</p>
      </div>
      <div class="team-card color-pink">
        <div class="team-avatar">MS</div>
        <h4>Maham Shams</h4>
        <div class="team-role">Character Shaper & Animator</div>
        <p class="team-desc">Bringing life to the personalities, emotions, and visual identity of the Imaan & Akhlaq universe.</p>
      </div>
      <div class="team-card color-teal">
        <div class="team-avatar">JA</div>
        <h4>Jawad Ahmed Almas</h4>
        <div class="team-role">Digital & IT Lead</div>
        <p class="team-desc">Ensuring global accessibility through cutting-edge technology, platforms, and digital infrastructure.</p>
      </div>
    </div>

    <!-- Concept Review Team -->
    <div class="group-title-container" data-aos="fade-up">
      <h3 class="group-title" style="border-bottom-color: #1E2D5A;">Concept Review Team</h3>
    </div>
    <div class="team-grid" data-aos="fade-up" data-aos-delay="100">
      <div class="team-card color-navy">
        <div class="team-avatar">RN</div>
        <h4>Ruqiya Naz Shahid</h4>
        <div class="team-role">Concept Review Team</div>
        <p class="team-desc">Providing critical insights to strengthen conceptual depth.</p>
      </div>
      <div class="team-card color-navy">
        <div class="team-avatar">TC</div>
        <h4>Tallies Cooven</h4>
        <div class="team-role">Concept Review Team</div>
        <p class="team-desc">Providing critical insights to strengthen conceptual depth.</p>
      </div>
      <div class="team-card color-navy">
        <div class="team-avatar">DS</div>
        <h4>Dilwar Saleh</h4>
        <div class="team-role">Concept Review Team</div>
        <p class="team-desc">Providing critical insights to strengthen conceptual depth.</p>
      </div>
    </div>

    <!-- Language & Grammar -->
    <div class="group-title-container" data-aos="fade-up">
      <h3 class="group-title" style="border-bottom-color: #D63678;">Language & Grammar</h3>
    </div>
    <div class="team-grid" data-aos="fade-up" data-aos-delay="100" style="grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));">
      <div class="team-card color-pink">
        <div class="team-avatar">MK</div>
        <h4>Musarrat Kamran</h4>
        <div class="team-role">Language & Grammar</div>
        <p class="team-desc">Refining language for clarity and effective communication.</p>
      </div>
      <div class="team-card color-pink">
        <div class="team-avatar">NS</div>
        <h4>Nirmeen Sayeed Khan</h4>
        <div class="team-role">Language & Grammar</div>
        <p class="team-desc">Refining language for clarity and effective communication.</p>
      </div>
      <div class="team-card color-pink">
        <div class="team-avatar">MS</div>
        <h4>Muhammad Sibghatullah</h4>
        <div class="team-role">Language & Grammar</div>
        <p class="team-desc">Refining language for clarity and effective communication.</p>
      </div>
      <div class="team-card color-pink">
        <div class="team-avatar">AS</div>
        <h4>Aiman Sohail</h4>
        <div class="team-role">Language & Grammar</div>
        <p class="team-desc">Refining language for clarity and effective communication.</p>
      </div>
      <div class="team-card color-pink">
        <div class="team-avatar">MQ</div>
        <h4>Manhal Qazi</h4>
        <div class="team-role">Language & Grammar</div>
        <p class="team-desc">Refining language for clarity and effective communication.</p>
      </div>
    </div>

    <!-- Books Design Support -->
    <div class="group-title-container" data-aos="fade-up">
      <h3 class="group-title" style="border-bottom-color: #E08020;">Books Design Support</h3>
    </div>
    <div class="team-grid" data-aos="fade-up" data-aos-delay="100" style="justify-content: center; display: flex;">
      <div class="team-card color-orange" style="max-width: 400px; width:100%;">
        <div class="team-avatar">MW</div>
        <h4>Mishkat Welfare Trust</h4>
        <div class="team-role">Books Design Support</div>
        <p class="team-desc">Supported faithfully by the trust, led by <strong>President Ahmed Zafar</strong>.</p>
      </div>
    </div>

  </div>
</div>

${Footer()}
`
