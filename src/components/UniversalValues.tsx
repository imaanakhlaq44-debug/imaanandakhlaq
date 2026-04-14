import { html } from 'hono/html'

export const UniversalValues = () => html`
<style>
  .values-section {
    padding: 100px 20px;
    background: #FDF8F5;
    font-family: 'Inter', sans-serif;
  }
  
  .values-container {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .values-section h2 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #1E2D5A;
    margin-bottom: 20px;
  }

  .values-sub {
    font-size: 1.1rem;
    color: #64748b;
    margin-bottom: 60px;
    font-weight: 500;
  }

  .values-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 25px;
    margin-bottom: 60px;
    max-width: 1000px;
    margin-inline: auto;
  }

  .value-card {
    background: linear-gradient(145deg, #ffffff, #f1f5f9);
    padding: 25px 30px;
    border-radius: 24px;
    text-align: center;
    min-width: 160px;
    box-shadow: 
      8px 8px 16px rgba(0,0,0,0.04),
      -8px -8px 16px rgba(255,255,255,1);
    border: 1px solid rgba(255,255,255,0.8);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .value-card:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 
      12px 12px 20px rgba(214, 54, 120, 0.15),
      -8px -8px 20px rgba(255,255,255,1);
    border-color: #fce7f3;
  }

  .value-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #D63678, #E08020);
    color: white;
    font-size: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 2px 2px 5px rgba(255,255,255,0.4), inset -2px -2px 5px rgba(0,0,0,0.1), 0 5px 15px rgba(214, 54, 120, 0.3);
  }

  .value-card h4 {
    font-size: 1.1rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
  }

  .values-closing {
    font-size: 1.5rem;
    font-weight: 800;
    color: #E08020;
    margin: 40px auto;
    max-width: 800px;
    line-height: 1.5;
  }
  
  .values-closing span { color: #1E2D5A; display: block; font-size: 1.2rem; font-weight: 600; margin-top: 15px; }

  /* Progression Area */
  .progression-area {
    margin-top: 80px;
    padding-top: 80px;
    border-top: 2px dashed #cbd5e1;
  }

  .progression-grid {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
    align-items: stretch;
  }
  @media (min-width: 1200px) {
    .progression-grid { flex-wrap: nowrap; }
  }

  .prog-card {
    flex: 1; min-width: 200px; max-width: 280px;
    border-radius: 24px;
    color: white;
    font-weight: 800;
    font-size: 1.25rem;
    position: relative;
    overflow: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 2px solid transparent;
  }
  
  .prog-desc {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.5;
    margin-top: 15px;
    opacity: 0.95;
    text-shadow: none;
  }

  .prog-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    border-color: rgba(255,255,255,0.4);
  }

  .prog-card::before {
    content: '';
    position: absolute; top:0; right:0; width:120px; height:120px;
    background: rgba(255,255,255,0.15); border-radius: 50%;
    transform: translate(30%, -30%);
    transition: transform 0.4s ease;
    z-index: 1; pointer-events: none;
  }

  .prog-card:hover::before {
    transform: translate(10%, -10%) scale(1.2);
  }

  .prog-green { background: linear-gradient(135deg, #10B981, #059669); }
  .prog-blue { background: linear-gradient(135deg, #3B82F6, #2563EB); }
  .prog-yellow { background: linear-gradient(135deg, #F59E0B, #D97706); }
  .prog-red { background: linear-gradient(135deg, #EF4444, #DC2626); }

  .prog-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; margin-bottom: 8px; display: block; font-weight: 700; text-shadow: none; }

  .img-wrapper { overflow: hidden; height: 200px; width: 100%; position: relative; z-index: 2; }
  .prog-img { width: 100%; height: 100%; object-fit: cover; border-bottom: 4px solid rgba(255,255,255,0.2); transition: transform 0.5s ease; }
  .prog-card:hover .prog-img { transform: scale(1.1); }
  
  .prog-content { padding: 25px 20px; position: relative; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.2); text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; }
  
  .prog-arrow-highlight {
    font-size: 1.5rem;
    color: #FDF8F5;
    background: #E08020;
    width: 45px; height: 45px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: pulseArrow 2s infinite;
    box-shadow: 0 0 15px rgba(224, 128, 32, 0.4);
    margin: 0 10px;
  }
  @keyframes pulseArrow {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 128, 32, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(224, 128, 32, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(224, 128, 32, 0); }
  }
</style>

<section class="values-section" id="gallery">
  <div class="values-container">
    <h2>Values Integration Focus</h2>
    <p class="values-sub">The Moral Backbone of the Program. In every element, we focus on developing these ethics.</p>

    <div class="values-grid">
      <div class="value-card" data-aos="zoom-in" data-aos-delay="50">
        <div class="value-icon"><i class="fas fa-balance-scale"></i></div>
        <h4>Honesty</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="100">
        <div class="value-icon" style="background: linear-gradient(135deg, #10B981, #059669);"><i class="fas fa-heart"></i></div>
        <h4>Compassion</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="150">
        <div class="value-icon" style="background: linear-gradient(135deg, #3B82F6, #2563EB);"><i class="fas fa-hands-helping"></i></div>
        <h4>Responsibility</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="200">
        <div class="value-icon" style="background: linear-gradient(135deg, #F59E0B, #D97706);"><i class="fas fa-handshake"></i></div>
        <h4>Respect</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="250">
        <div class="value-icon" style="background: linear-gradient(135deg, #8B5CF6, #6D28D9);"><i class="fas fa-shield-alt"></i></div>
        <h4>Integrity</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="300">
        <div class="value-icon" style="background: linear-gradient(135deg, #EC4899, #BE185D);"><i class="fas fa-brain"></i></div>
        <h4>Self-Discipline</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="350">
        <div class="value-icon" style="background: linear-gradient(135deg, #14B8A6, #0F766E);"><i class="fas fa-seedling"></i></div>
        <h4>Humility</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="400">
        <div class="value-icon" style="background: linear-gradient(135deg, #EF4444, #B91C1C);"><i class="fas fa-mountain"></i></div>
        <h4>Perseverance</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="450">
        <div class="value-icon" style="background: linear-gradient(135deg, #6366F1, #4338CA);"><i class="fas fa-praying-hands"></i></div>
        <h4>Gratitude</h4>
      </div>
      <div class="value-card" data-aos="zoom-in" data-aos-delay="500">
        <div class="value-icon" style="background: linear-gradient(135deg, #0EA5E9, #0369A1);"><i class="fas fa-equals"></i></div>
        <h4>Fairness</h4>
      </div>
    </div>

    <div class="values-closing">
      From stories <i class="fas fa-arrow-right text-muted mx-2"></i> to emotions <i class="fas fa-arrow-right text-muted mx-2"></i> to lifelong behavior.
      <span>Good character is the condition of Complete faith, let's help our children with it.</span>
    </div>

    <!-- Progression -->
    <div class="progression-area">
      <h3 style="font-family:'Fredoka One', cursive; color:#1e293b; margin-bottom:40px; font-size:2rem;">Progression Focus</h3>
      
      <div class="progression-grid">
        <div class="prog-card prog-green" data-aos="fade-up" data-aos-delay="100">
          <div class="img-wrapper"><img src="./kidba_assets/img/prog_new_p1.png" alt="Phase 1" class="prog-img" /></div>
          <div class="prog-content">
            <span class="prog-label">Phase 1</span>
            Ages 5 - 8
            <div class="prog-desc">Foundational Character Building: Storytelling, Basic Activity Modules, and Introduction to Prophetic Narratives.</div>
          </div>
        </div>
        
        <div class="d-none d-xl-flex align-items-center flex-column justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>

        <div class="prog-card prog-blue" data-aos="fade-up" data-aos-delay="200">
          <div class="img-wrapper"><img src="./kidba_assets/img/prog_new_p2.png" alt="Phase 2" class="prog-img" /></div>
          <div class="prog-content">
            <span class="prog-label">Phase 2</span>
            Ages 9 - 10
            <div class="prog-desc">Interactive Development: Advanced Club Engagements, Responsibility Focus, and Group Tasks.</div>
          </div>
        </div>

        <div class="d-none d-xl-flex align-items-center flex-column justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>

        <div class="prog-card prog-yellow" data-aos="fade-up" data-aos-delay="300">
          <div class="img-wrapper"><img src="./kidba_assets/img/prog_new_p3.png" alt="Phase 3" class="prog-img" /></div>
          <div class="prog-content">
            <span class="prog-label">Phase 3</span>
            Ages 11 - 13
            <div class="prog-desc">Ethical Maturation: Real-World Scenarios, Peer Mentoring, and Leadership through Prophetic Stories.</div>
          </div>
        </div>

        <div class="d-none d-xl-flex align-items-center flex-column justify-content-center">
           <div class="prog-arrow-highlight"><i class="fas fa-arrow-right"></i></div>
        </div>

        <div class="prog-card prog-red" data-aos="fade-up" data-aos-delay="400">
          <div class="img-wrapper"><img src="./kidba_assets/img/prog_new_p4.png" alt="Phase 4" class="prog-img" /></div>
          <div class="prog-content">
            <span class="prog-label">Phase 4</span>
            Age 14+
            <div class="prog-desc">Uswah e Hasana Practice: Embodying Character, Leading Clubs, and Complex Behavioral Transformation.</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
`
