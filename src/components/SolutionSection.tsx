import { html } from 'hono/html'

export const SolutionSection = () => html`
<style>
  .solution-section {
    padding: 120px 20px;
    background: white;
    text-align: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .solution-bg-shape {
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 300px;
    background: #FDF8F5;
    border-radius: 50%;
    z-index: 1;
  }

  .solution-container {
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .solution-icon-main {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #1E2D5A, #D63678);
    border-radius: 24px;
    color: white;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-size: 2.5rem;
    margin-bottom: 30px;
    box-shadow: 0 15px 30px rgba(30, 45, 90, 0.2);
    transform: rotate(-5deg);
  }

  .solution-section h2 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    color: #1E2D5A;
    margin-bottom: 20px;
  }

  .solution-subtitle {
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    color: #C99A6B;
    font-weight: 700;
    margin-bottom: 30px;
  }

  .features-row {
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    margin-top: 60px; /* Room for floating bubbles */
  }

  .solution-card {
    background: white;
    padding: 40px 30px;
    border-radius: 30px;
    flex: 1;
    min-width: 250px;
    max-width: 320px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    border: 1px solid rgba(226, 232, 240, 0.6);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    margin-top: 40px; 
  }

  .solution-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.08);
    border-color: var(--card-color, #cbd5e1);
  }

  .sol-image-container {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    background: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    transition: transform 0.4s ease;
    border: 4px solid var(--card-color, #fff);
  }

  .solution-card:hover .sol-image-container {
    transform: translateX(-50%) translateY(-10px) scale(1.1);
    box-shadow: 0 20px 40px var(--card-shadow, rgba(0,0,0,0.15));
  }

  .sol-image-container img {
    width: 85%;
    height: 85%;
    object-fit: contain;
    border-radius: 50%;
  }

  .solution-card h4 {
    font-size: 1.4rem;
    font-weight: 800;
    color: #1e293b;
    margin-top: 40px;
    line-height: 1.4;
  }
</style>

<section class="solution-section">
  <div class="solution-bg-shape"></div>
  <div class="solution-container">
    <div class="solution-icon-main"><i class="fas fa-magic"></i></div>
    <h2>Introducing Imaan & Akhlaq</h2>
    <p class="solution-subtitle">Where faith meets character, and learning becomes living.</p>
    
    <p style="font-size: 1.2rem; color: #64748b; margin-bottom: 40px; max-width: 600px; margin-inline: auto;">
      A holistic program designed to raise children with strong foundations.
    </p>

    <div class="features-row">
      <div class="solution-card" style="--card-color: #E08020; --card-shadow: rgba(224, 128, 32, 0.3);" data-aos="zoom-in" data-aos-delay="100">
        <div class="sol-image-container"><img src="./kidba_assets/img/icon_conviction.png" alt="Believe with Conviction" /></div>
        <h4>Believe with Conviction</h4>
      </div>
      
      <div class="solution-card" style="--card-color: #D63678; --card-shadow: rgba(214, 54, 120, 0.3);" data-aos="zoom-in" data-aos-delay="200">
        <div class="sol-image-container"><img src="./kidba_assets/img/icon_integrity.png" alt="Act with Integrity" /></div>
        <h4>Act with Integrity</h4>
      </div>
      
      <div class="solution-card" style="--card-color: #6382EB; --card-shadow: rgba(99, 130, 235, 0.3);" data-aos="zoom-in" data-aos-delay="300">
        <div class="sol-image-container"><img src="./kidba_assets/img/icon_purpose.png" alt="Live with Purpose" /></div>
        <h4>Live with Purpose</h4>
      </div>
    </div>
  </div>
</section>
`
