import { html } from 'hono/html'

export const EcosystemSection = () => html`
<style>
  .eco-section {
    padding: 150px 20px 100px 20px;
    background: #111827;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .eco-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .eco-section h2 {
    text-align: center;
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #F8FAFC;
    margin-bottom: 90px;
  }

  .eco-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px; 
  }

  .eco-card {
    background: rgba(255, 255, 255, 0.05); 
    padding: 50px 20px 30px 20px; 
    border-radius: 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    flex: 1;
    min-width: 280px; 
    max-width: 320px; 
    margin-top: 50px;
    backdrop-filter: blur(10px);
    text-decoration: none;
    cursor: pointer;
  }

  .eco-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
    border-color: var(--card-color, #cbd5e1);
  }

  .eco-image-container {
    width: 100px;
    height: 100px;
    margin: 0 auto;
    background: #1E293B;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    transition: transform 0.4s ease;
    border: 4px solid var(--card-color, #fff);
  }

  .eco-card:hover .eco-image-container {
    transform: translateX(-50%) translateY(-10px) scale(1.1);
    box-shadow: 0 20px 40px var(--card-shadow, rgba(0,0,0,0.4));
  }
  
  .eco-image-container i {
    font-size: 2.5rem;
    color: var(--card-color);
  }

  .eco-card h4 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.5;
    margin: 0;
  }
</style>

<section class="eco-section" id="programs">
  <div class="eco-container">
    <h2>A Complete Learning Ecosystem</h2>
    
    <div class="eco-grid">
      <a href="/products/books" class="eco-card" style="--card-color: #E08020; --card-shadow: rgba(224, 128, 32, 0.3);" data-aos="zoom-in" data-aos-delay="100">
        <div class="eco-image-container"><i class="fas fa-book"></i></div>
        <h4>Curriculum Books</h4>
      </a>
      
      <a href="/products/coloring" class="eco-card" style="--card-color: #D63678; --card-shadow: rgba(214, 54, 120, 0.3);" data-aos="zoom-in" data-aos-delay="200">
        <div class="eco-image-container"><i class="fas fa-paint-brush"></i></div>
        <h4>Coloring Books</h4>
      </a>

      <a href="/club" class="eco-card" style="--card-color: #1A936F; --card-shadow: rgba(26, 147, 111, 0.3);" data-aos="zoom-in" data-aos-delay="300">
        <div class="eco-image-container"><i class="fas fa-users"></i></div>
        <h4>Imaan & Akhlaq Clubs</h4>
      </a>

      <a href="/products/puppet" class="eco-card" style="--card-color: #6382EB; --card-shadow: rgba(99, 130, 235, 0.3);" data-aos="zoom-in" data-aos-delay="400">
        <div class="eco-image-container"><i class="fas fa-theater-masks"></i></div>
        <h4>Puppet Shows</h4>
      </a>

      <a href="/products/audio" class="eco-card" style="--card-color: #F59E0B; --card-shadow: rgba(245, 158, 11, 0.3);" data-aos="zoom-in" data-aos-delay="500">
        <div class="eco-image-container"><i class="fas fa-headphones"></i></div>
        <h4>Audio Stories Portal</h4>
      </a>

      <a href="/products/games" class="eco-card" style="--card-color: #A855F7; --card-shadow: rgba(168, 85, 247, 0.3);" data-aos="zoom-in" data-aos-delay="600">
        <div class="eco-image-container"><i class="fas fa-gamepad"></i></div>
        <h4>Games Portal</h4>
      </a>
    </div>
  </div>
</section>
`
