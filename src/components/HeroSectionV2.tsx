import { html } from 'hono/html'

export const HeroSectionV2 = () => html`
<style>
  .hero-flashcards {
    position: relative;
    padding: 160px 20px 80px;
    background: url('/kidba_assets/img/hero_bg_magical.png') center/cover no-repeat;
    overflow: hidden;
    color: #fff;
    font-family: 'Inter', sans-serif;
  }
  
  /* Space Particles Background Effect */
  .hero-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.85;
    background-color: #0f172a; /* Dark tint over the bright image */
    background-image: 
      radial-gradient(#D63678 1px, transparent 1px),
      radial-gradient(#E08020 1px, transparent 1px);
    background-size: 50px 50px;
    background-position: 0 0, 25px 25px;
    z-index: 1;
    animation: drift 40s linear infinite;
  }
  @keyframes drift { 0% { background-position: 0 0, 25px 25px; } 100% { background-position: 500px 500px, 525px 525px; } }
  
  .hero-glow-1 { position: absolute; width: 500px; height: 500px; background: rgba(214, 54, 120, 0.4); filter: blur(120px); top: -100px; left: -100px; border-radius: 50%; z-index: 1; }
  .hero-glow-2 { position: absolute; width: 600px; height: 600px; background: rgba(224, 128, 32, 0.25); filter: blur(150px); bottom: -150px; right: -100px; border-radius: 50%; z-index: 1; }

  .hero-content { position: relative; z-index: 2; text-align: center; max-width: 1000px; margin: 0 auto 40px; }
  
  .hero-badge {
    display: inline-block; padding: 10px 24px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 30px; font-size: 0.9rem; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 2px;
    margin-bottom: 24px; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }

  .hero-flashcards h1 {
    font-family: 'Fredoka One', cursive; font-size: clamp(2.8rem, 5vw, 4.5rem); line-height: 1.1;
    margin-bottom: 20px; text-shadow: 0 10px 30px rgba(0,0,0,0.5); color: #ffffff !important;
  }
  
  .hero-flashcards p.subtitle {
    font-size: 1.25rem; opacity: 0.85; max-width: 700px; margin: 0 auto; line-height: 1.6; font-weight: 500;
  }

  /* --- EXPANDING FLASHCARDS UI --- */
  .flashcards-container {
    position: relative; z-index: 2; display: flex; gap: 20px; max-width: 1200px; margin: 0 auto; height: 420px;
    padding: 0 10px;
  }

  .flashcard {
    flex: 1; border-radius: 30px; overflow: hidden; position: relative; cursor: pointer; text-decoration: none;
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: flex-end;
  }
  
  .flashcard:hover {
    flex: 2.5; box-shadow: 0 30px 60px rgba(0,0,0,0.4); border: 1px solid rgba(255, 255, 255, 0.3); transform: translateY(-10px);
  }

  /* Specific Card Theme Backgrounds */
  .fc-bg { 
    position: absolute; inset: -10px; /* Oversize to hide blur edges */
    background-size: cover !important; background-position: center !important; 
    transition: all 0.6s; z-index: 1; border-radius: 30px;
    filter: blur(3px) brightness(0.5); 
  }
  .flashcard:hover .fc-bg { filter: blur(0px) brightness(0.85); transform: scale(1.05); }

  .bg-books { background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(16, 185, 129, 0.95) 100%), url('/kidba_assets/img/fc_books_real.jpg'); }
  .bg-colors { background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(239, 68, 68, 0.95) 100%), url('/kidba_assets/img/fc_coloring.png'); }
  .bg-audio { background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(139, 92, 246, 0.95) 100%), url('/kidba_assets/img/fc_audio.png'); }
  .bg-puppet { background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(245, 158, 11, 0.95) 100%), url('/kidba_assets/img/fc_puppet.png'); }

  /* Content inside the card */
  .fc-content { position: relative; z-index: 2; padding: 30px; display: flex; flex-direction: column; height: 100%; justify-content: flex-end; color: white; }
  
  .fc-icon { font-size: 2.5rem; margin-bottom: 15px; display: inline-flex; width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 2px solid rgba(255,255,255,0.2); transition: all 0.5s; position: absolute; top: 30px; left: 30px; z-index: 5; }
  .flashcard:hover .fc-icon { background: rgba(255,255,255,0.3); transform: scale(1.1); box-shadow: 0 0 20px rgba(255,255,255,0.4); }

  .fc-title { font-family: 'Fredoka One', cursive; font-size: 1.8rem; margin: 0 0 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.4); white-space: nowrap; transition: all 0.5s; color: #ffffff !important; }
  
  .fc-desc { font-size: 1.05rem; opacity: 0; max-height: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); line-height: 1.6; text-shadow: 0 1px 3px rgba(0,0,0,0.5); font-weight: 500; }
  .flashcard:hover .fc-desc { opacity: 1; max-height: 150px; margin-bottom: 20px; }

  .fc-btn { background: white; color: #0f172a; padding: 12px 24px; border-radius: 20px; font-weight: bold; transform: translateY(50px); opacity: 0; transition: all 0.4s ease; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; display: inline-block; text-align: center; }
  .flashcard:hover .fc-btn { transform: translateY(0); opacity: 1; }

  @media (max-width: 991px) {
    .flashcards-container { flex-direction: column; height: auto; max-width: 500px; }
    .flashcard { flex: none; height: 160px; }
    .fc-icon { top: 20px; left: 20px; font-size: 1.5rem; width: 45px; height: 45px; }
    .fc-content { justify-content: center; padding-left: 80px; }
    .fc-title { font-size: 1.4rem;  white-space: normal; }
    .fc-title br { display: none; }
    .flashcard:hover { height: 280px; flex: none; }
    .flashcard:hover .fc-content { justify-content: flex-end; padding-left: 30px; }
    .flashcard:hover .fc-icon { top: 20px; left: 20px; }
  }
</style>

<section class="hero-flashcards" id="home">
  <div class="hero-glow-1"></div>
  <div class="hero-glow-2"></div>
  <div class="hero-overlay"></div>
  
  <div class="hero-content" data-aos="fade-up">
    <span class="hero-badge">Welcome to The Ecosystem</span>
    <h1>Explore Our World!</h1>
    <p class="subtitle">Join Imaan and Akhlaq on an epic journey to protect the heart. Discover magical books, coloring activities, and immersive stories.</p>
  </div>

  <div class="flashcards-container">
    
    <!-- Card 1: Books -->
    <a href="/products/books.html" class="flashcard" data-aos="fade-up" data-aos-delay="100">
      <div class="fc-bg bg-books"></div>
      <div class="fc-content">
        <div class="fc-icon">📚</div>
        <h3 class="fc-title">Curriculum Books</h3>
        <p class="fc-desc">Embark on an adventure battling the whispers of Faasid. Perfect for daily bedtime reading and planting seeds of faith!</p>
        <span class="fc-btn">Open Library</span>
      </div>
    </a>

    <!-- Card 2: Coloring -->
    <a href="/products/coloring.html" class="flashcard" data-aos="fade-up" data-aos-delay="200">
      <div class="fc-bg bg-colors"></div>
      <div class="fc-content">
        <div class="fc-icon">🖍️</div>
        <h3 class="fc-title">Magic Coloring</h3>
        <p class="fc-desc">Bring faith to life! Paint beautiful interactive digital line art featuring our heroes directly on your screen.</p>
        <span class="fc-btn">Start Painting</span>
      </div>
    </a>

    <!-- Card 3: Audio -->
    <a href="/products/audio.html" class="flashcard" data-aos="fade-up" data-aos-delay="300">
      <div class="fc-bg bg-audio"></div>
      <div class="fc-content">
        <div class="fc-icon">🎧</div>
        <h3 class="fc-title">Audio Stories</h3>
        <p class="fc-desc">Close your eyes and immerse yourself in high-quality narrated tales. Available in English, Urdu, and Arabic!</p>
        <span class="fc-btn">Listen Now</span>
      </div>
    </a>

    <!-- Card 4: Puppet Shows -->
    <a href="/products/puppet.html" class="flashcard" data-aos="fade-up" data-aos-delay="400">
      <div class="fc-bg bg-puppet"></div>
      <div class="fc-content">
        <div class="fc-icon">🎭</div>
        <h3 class="fc-title">Live Puppets</h3>
        <p class="fc-desc">Want Imaan and Akhlaq to visit your kids? Invite us and book an immersive Live Puppet Show at your school!</p>
        <span class="fc-btn">Invite Us</span>
      </div>
    </a>

  </div>
</section>
`
