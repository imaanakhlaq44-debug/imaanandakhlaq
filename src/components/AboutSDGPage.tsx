import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutSDGPage = () => html`
${Head()}
${Header()}

<style>
  .about-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .about-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #1E2D5A 0%, #C99A6B 100%); color: white; text-align: center; overflow: hidden; }
  .about-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .about-hero-content { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; }
  .about-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .about-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 20px; }

  /* SDG Grid */
  .sdg-intro { text-align: center; max-width: 800px; margin: 0 auto 50px; font-size: 1.15rem; line-height: 1.8; color: #475569; }
  .sdg-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; margin-bottom: 80px; }
  .sdg-card { 
    background: #ffffff; 
    flex: 1 1 320px; 
    max-width: 380px;
    padding: 40px 30px; 
    border-radius: 24px; 
    border-top: 6px solid #1E2D5A; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02); 
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex; flex-direction: column;
  }
  .sdg-card:hover { 
    transform: translateY(-10px); 
    box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05); 
  }
  .sdg-icon { 
    width: 70px; height: 70px; 
    background: linear-gradient(135deg, #f8fafc, #f1f5f9); 
    border-radius: 16px; 
    display: flex; align-items: center; justify-content: center; 
    font-size: 2rem; margin-bottom: 25px; 
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 10px rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
  }
  .sdg-card:hover .sdg-icon {
    transform: scale(1.1) rotate(5deg);
  }
  .sdg-card h4 { font-size: 1.4rem; font-weight: 800; color: #1E2D5A; margin-bottom: 15px; }
  .sdg-card p.text-muted { font-size: 1.05rem; line-height: 1.6; flex-grow: 1; margin-bottom: 20px; }
  .sdg-card h5 { font-size: 0.9rem; font-weight: 800; color: #64748b; margin-top: 15px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1.5px; }
  .sdg-card ul { padding-left: 20px; color: #475569; line-height: 1.6; font-size: 0.95rem; }
  .sdg-card ul li { margin-bottom: 8px; }
  .sdg-card ul li strong { color: #1E2D5A; }
  
  /* NCE Framework Section */
  .nce-section { background: white; border-radius: 40px; padding: 80px 60px; margin-top: 60px; margin-bottom: 80px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
  .nce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .nce-box { background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; }
  .nce-box h4 { font-size: 1.3rem; font-weight: 800; color: #1E2D5A; margin-bottom: 15px; border-bottom: 2px solid #E08020; padding-bottom: 10px; display: inline-block; }
  .nce-box p, .nce-box ul { color: #475569; line-height: 1.7; font-size: 1.05rem; }
  
  @media(max-width: 768px) { .nce-section { padding: 40px 20px; } .nce-grid { grid-template-columns: 1fr; } }
</style>

<div class="about-page">
  <div class="about-hero">
    <div class="about-hero-content" data-aos="fade-up">
      <h1>Linked with SDGs</h1>
      <p>Global Goals, National Frameworks, Local Impact.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="container" style="margin-top: 60px;">
    
    <!-- UN SDGs -->
    <div class="title-center" data-aos="fade-up">
      <h2 class="section-title">Imaan & Akhlaq and the SDGs</h2>
    </div>
    <p class="sdg-intro" data-aos="fade-up">At Imaan & Akhlaq, we are committed to nurturing ethically grounded, emotionally intelligent, and socially responsible individuals. Our approach aligns with the global framework of the United Nations Sustainable Development Goals (SDGs) by directly contributing to specific targets through value-based education.</p>

    <div class="sdg-grid">
      <!-- SDG 4 -->
      <div class="sdg-card" style="border-color: #C5192D;" data-aos="fade-up" data-aos-delay="100">
        <div class="sdg-icon" style="color: #C5192D;"><i class="fas fa-book-reader"></i></div>
        <h4>SDG 4: Quality Education</h4>
        <p class="text-muted">Holistic & Transformative Learning. We integrate character, faith, and life skills into education, ensuring students develop not only academically but also morally and socially.</p>
        <h5>Relevant Targets (4.1, 4.7)</h5>
        <ul>
          <li><strong>Target 4.7:</strong> Ensure all learners acquire knowledge and skills needed to promote sustainable development, including values, ethics, and global citizenship</li>
          <li><strong>Target 4.1:</strong> Ensure quality primary and secondary education with meaningful learning outcomes</li>
        </ul>
        <h5>Our Contribution</h5>
        <ul>
          <li>Embedding values like honesty, responsibility, and compassion into curriculum</li>
          <li>Story-based and experiential learning methods</li>
          <li>Structured progression of moral and emotional development</li>
        </ul>
      </div>

      <!-- SDG 3 -->
      <div class="sdg-card" style="border-color: #4C9F38;" data-aos="fade-up" data-aos-delay="200">
        <div class="sdg-icon" style="color: #4C9F38;"><i class="fas fa-heartbeat"></i></div>
        <h4>SDG 3: Good Health & Well-being</h4>
        <p class="text-muted">Emotional & Mental Well-being. We support children’s inner development by strengthening emotional intelligence and resilience.</p>
        <h5>Relevant Targets (3.4)</h5>
        <ul>
          <li><strong>Target 3.4:</strong> Promote mental health and well-being</li>
        </ul>
        <h5>Our Contribution</h5>
        <ul>
          <li>Teaching emotional regulation (anger, fear, jealousy)</li>
          <li>Encouraging positive thinking (husn-e-zann)</li>
          <li>Building inner peace through faith-based practices</li>
        </ul>
      </div>

      <!-- SDG 16 -->
      <div class="sdg-card" style="border-color: #00689D;" data-aos="fade-up" data-aos-delay="300">
        <div class="sdg-icon" style="color: #00689D;"><i class="fas fa-balance-scale"></i></div>
        <h4>SDG 16: Peace & Justice</h4>
        <p class="text-muted">Ethical Leadership & Social Responsibility. We cultivate ethical behavior and justice-oriented thinking in students, preparing them to contribute to peaceful societies.</p>
        <h5>Relevant Targets (16.1, 16.7)</h5>
        <ul>
          <li><strong>Target 16.7:</strong> Ensure responsive, inclusive, participatory decision-making</li>
          <li><strong>Target 16.1:</strong> Reduce violence and promote peaceful societies</li>
        </ul>
        <h5>Our Contribution</h5>
        <ul>
          <li>Teaching justice (Adl), truthfulness (Sidq), and accountability (Amanah)</li>
          <li>Developing conflict resolution and fair decision-making skills</li>
          <li>Promoting ethical leadership through student roles (House system, mentorship)</li>
        </ul>
      </div>

      <!-- SDG 5 -->
      <div class="sdg-card" style="border-color: #FF3A21;" data-aos="fade-up" data-aos-delay="400">
        <div class="sdg-icon" style="color: #FF3A21;"><i class="fas fa-venus-mars"></i></div>
        <h4>SDG 5: Gender Equality</h4>
        <p class="text-muted">Respect, Dignity & Inclusion. Our model promotes balanced participation and mutual respect across genders within an ethical framework.</p>
        <h5>Relevant Targets (5.1, 5.5)</h5>
        <ul>
          <li><strong>Target 5.1:</strong> End discrimination against all women and girls</li>
          <li><strong>Target 5.5:</strong> Ensure full and effective participation and equal opportunities for leadership</li>
        </ul>
        <h5>Our Contribution</h5>
        <ul>
          <li>Inclusive participation through Naseer (boys) and Raiah (girls)</li>
          <li>Equal access to leadership roles and engagement</li>
          <li>Promotion of dignity, respect, and ethical interaction</li>
        </ul>
      </div>

      <!-- SDG 17 -->
      <div class="sdg-card" style="border-color: #19486A;" data-aos="fade-up" data-aos-delay="500">
        <div class="sdg-icon" style="color: #19486A;"><i class="fas fa-handshake"></i></div>
        <h4>SDG 17: Partnerships</h4>
        <p class="text-muted">Scalable Educational Impact. Our model is designed for scalability and collaboration, enabling institutions to collectively advance value-based education.</p>
        <h5>Relevant Targets (17.17)</h5>
        <ul>
          <li><strong>Target 17.17:</strong> Encourage effective partnerships across public, private, and civil society sectors</li>
        </ul>
        <h5>Our Contribution</h5>
        <ul>
          <li>School-based implementation framework</li>
          <li>Collaboration with educators and institutions</li>
          <li>Digital platform (imaanakhlaq.org) for scalability and coordination</li>
        </ul>
      </div>
    </div>

    <!-- Our Commitment -->
    <div style="background: white; border-radius: 40px; padding: 60px; margin-top: 20px; margin-bottom: 80px; box-shadow: 0 20px 50px rgba(0,0,0,0.05);" data-aos="fade-up">
      <h2 class="section-title">Our Commitment</h2>
      <p style="font-size: 1.15rem; color: #475569; line-height: 1.8; text-align: center; max-width: 900px; margin: 0 auto;">
        Imaan & Akhlaq contributes to global development not just by educating minds, but by shaping ethical human beings. Through alignment with SDG targets, we aim to raise a generation that embodies faith, character, responsibility, and leadership, ultimately contributing to a more just, compassionate, and sustainable world.
      </p>
    </div>



  </div>
</div>

${Footer()}
`
