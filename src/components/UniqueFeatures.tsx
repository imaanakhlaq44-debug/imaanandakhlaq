import { html } from 'hono/html'

export const UniqueFeatures = () => html`
<style>
  .unique-section {
    padding: 120px 20px;
    background: #F8FAFC;
    font-family: 'Inter', sans-serif;
  }

  .unique-container {
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
  }

  .unique-section h2 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #1E2D5A;
    margin-bottom: 60px;
  }

  .unique-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
  }

  .unique-pill {
    background: white;
    border: 1px solid #E2E8F0;
    padding: 20px 30px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1E293B;
    box-shadow: 0 4px 6px rgba(0,0,0,0.03);
    transition: all 0.3s ease;
  }

  .unique-pill:hover {
    background: #fff;
    border-color: #F59E0B;
    transform: translateY(-3px);
    box-shadow: 0 10px 15px rgba(245, 158, 11, 0.1);
  }

  .unique-pill i {
    color: #F59E0B;
    font-size: 1.3rem;
  }
</style>

<section class="unique-section" id="team">
  <div class="unique-container">
    <h2>What Makes It Unique?</h2>
    
    <div class="unique-grid">
      <div class="unique-pill" data-aos="fade-up" data-aos-delay="100"><i class="fas fa-book-open"></i> Interactive Storytelling</div>
      <div class="unique-pill" data-aos="fade-up" data-aos-delay="200"><i class="fas fa-gamepad"></i> Gamified Learning (No Exams)</div>
      <div class="unique-pill" data-aos="fade-up" data-aos-delay="300"><i class="fas fa-heart"></i> Behavioral Transformation</div>
      <div class="unique-pill" data-aos="fade-up" data-aos-delay="400"><i class="fas fa-theater-masks"></i> Puppet Shows & Animations</div>
      <div class="unique-pill" data-aos="fade-up" data-aos-delay="500"><i class="fas fa-hands-helping"></i> Parent + Teacher Integration</div>
    </div>
  </div>
</section>
`
