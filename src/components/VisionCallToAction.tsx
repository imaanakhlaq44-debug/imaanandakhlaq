import { html } from 'hono/html'

export const VisionCallToAction = () => html`
<style>
  .vision-cta-section {
    padding: 120px 20px;
    background: linear-gradient(135deg, #1E2D5A, #0F172A);
    color: white;
    font-family: 'Inter', sans-serif;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .vision-cta-section::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(214, 54, 120, 0.15) 0%, transparent 60%);
    top: -200px; left: -200px;
  }

  .vision-cta-section::after {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(224, 128, 32, 0.15) 0%, transparent 60%);
    bottom: -200px; right: -200px;
  }

  .vision-container {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .vision-quote-icon {
    font-size: 3rem;
    color: rgba(255,255,255,0.2);
    margin-bottom: 20px;
  }

  .vision-quote {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.3;
    color: #F8FAFC;
    margin-bottom: 30px;
  }

  .vision-author {
    font-size: 1.2rem;
    color: #C99A6B;
    font-weight: 700;
    margin-bottom: 30px;
  }

  .vision-desc {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #94a3b8;
    max-width: 700px;
    margin: 0 auto 40px;
  }
  
  .btn-outline-gold {
    background: transparent;
    color: #F59E0B;
    border: 2px solid #F59E0B;
    padding: 12px 30px;
    border-radius: 30px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s;
    display: inline-block;
  }

  .btn-outline-gold:hover {
    background: rgba(245, 158, 11, 0.1);
    transform: translateY(-2px);
  }

  hr.divider-fancy {
    border: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    margin: 80px 0;
  }

  .cta-heading {
    font-size: clamp(2.2rem, 4vw, 2.8rem);
    font-family: 'Fredoka One', cursive;
    margin-bottom: 40px;
  }

  .cta-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-cta {
    padding: 16px 40px;
    border-radius: 30px;
    font-size: 1.2rem;
    font-weight: 800;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-institute {
    background: white;
    color: #1E2D5A;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
  .btn-institute:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }

  .btn-individual {
    background: linear-gradient(135deg, #E08020, #D63678);
    color: white;
    box-shadow: 0 10px 20px rgba(214, 54, 120, 0.3);
  }
  .btn-individual:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(214, 54, 120, 0.4); color: white; }
</style>

<section class="vision-cta-section">
  <div class="vision-container">
    <div class="vision-quote-icon"><i class="fas fa-quote-left"></i></div>
    <div class="vision-quote">"We are not raising students for exams, we are raising a generation for life."</div>
    <div class="vision-author">— Saith Usama J. Chitrali (Shiekh Uncle)</div>
    
    <p class="vision-desc">
      A vision that started with a concern close to home has now grown into a nationwide movement. See how the journey began and meet the team shaping the future.
    </p>
    
    <a href="/about" class="btn-outline-gold"><i class="fas fa-book-open me-2"></i>Read Detailed Message & Vision</a>

    <hr class="divider-fancy" />

    <h2 class="cta-heading">Join the Movement of Character Transformation</h2>
    <div class="cta-buttons">
      <a href="/auth?role=school" class="btn-cta btn-institute"><i class="fas fa-school me-2"></i>As an Institute</a>
      <a href="/auth?role=individual" class="btn-cta btn-individual"><i class="fas fa-user-astronaut me-2"></i>As an Individual</a>
    </div>

  </div>
</section>
`
