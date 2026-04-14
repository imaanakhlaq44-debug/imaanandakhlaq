import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutNCEPage = () => html`
${Head()}
${Header()}

<style>
  .nce-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .nce-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #1E2D5A 0%, #C99A6B 100%); color: white; text-align: center; overflow: hidden; }
  .nce-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .nce-hero-content { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; }
  .nce-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .nce-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 20px; }
  
  .intro-text { text-align: center; max-width: 900px; margin: 0 auto 50px; font-size: 1.15rem; line-height: 1.8; color: #475569; }

  /* Content Cards */
  .nce-section-card { background: white; border-radius: 20px; padding: 40px; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border-top: 4px solid #E08020; }
  .nce-section-card h3 { font-family: 'Fredoka One', cursive; font-size: 1.8rem; color: #1E2D5A; margin-bottom: 20px; }
  
  .pathway-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 30px; }
  .pathway-card { background: #f8fafc; padding: 30px; border-radius: 15px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
  .pathway-card::before { content: ''; position: absolute; top:0; left:0; width: 5px; height: 100%; background: #1E2D5A; }
  .pathway-card.early::before { background: #4C9F38; }
  .pathway-card.middle::before { background: #00689D; }
  .pathway-card.senior::before { background: #C5192D; }
  
  .pathway-card h4 { font-size: 1.3rem; font-weight: 800; color: #1E2D5A; margin-bottom: 10px; }
  .pathway-card p { color: #475569; margin-bottom: 15px; font-size: 1.05rem; }
  .pathway-card .ref { font-size: 0.85rem; color: #64748b; font-style: italic; background: #f1f5f9; padding: 5px 10px; border-radius: 5px; display: inline-block; }

  /* Comparison Grid */
  .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
  @media(max-width: 768px) { .comparison-grid { grid-template-columns: 1fr; } }
  .comp-box { padding: 30px; border-radius: 15px; }
  .comp-box.light { background: #f1f5f9; }
  .comp-box.colored { background: rgba(30, 45, 90, 0.03); border: 1px solid rgba(30, 45, 90, 0.1); }
  .comp-box h4 { font-size: 1.25rem; font-weight: 800; color: #1E2D5A; margin-bottom: 15px; }
  .comp-box ul { padding-left: 20px; color: #475569; font-size: 1.05rem; line-height: 1.8; }
  .comp-box ul li { margin-bottom: 10px; }
  
  .ref-link { display: inline-block; margin-top: 15px; font-size: 0.9rem; color: #E08020; font-weight: 600; text-decoration: none; }
  .ref-link:hover { text-decoration: underline; }

  .shared-vision-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
  .vision-item { background: #fff; border: 1px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 12px; font-weight: 700; color: #1E2D5A; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: transform 0.2s; }
  .vision-item:hover { transform: translateY(-5px); border-color: #E08020; color: #E08020; }
  .vision-item i { display: block; font-size: 2rem; margin-bottom: 15px; color: #C99A6B; }

</style>

<div class="nce-page">
  <div class="nce-hero">
    <div class="nce-hero-content" data-aos="fade-up">
      <h1>Linked with NCE Framework</h1>
      <p>Alignment with National Character Education Framework</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="container" style="margin-top: 60px; margin-bottom: 80px;">
    
    <div data-aos="fade-up">
      <p class="intro-text">
        <strong>Imaan & Akhlaq</strong> is aligned with the national vision for character development as outlined by the Government of Pakistan through its <strong>National Character Building Framework</strong> (Ministry of Federal Education & Professional Training).
      </p>
    </div>

    <!-- Developmental Pathway -->
    <div class="nce-section-card" data-aos="fade-up">
      <h3>Structured Developmental Pathway</h3>
      <p style="color: #475569; font-size: 1.1rem; line-height: 1.7;">
        The national framework emphasizes a progressive, age-wise development of values, where students move from basic manners and discipline in early grades to ethical reasoning, responsibility, and leadership in higher classes <em>(Ref: Class-wise Learning Outcomes)</em>.
      </p>
      <p style="color: #475569; font-size: 1.1rem; font-weight: 600; margin-top: 15px;">Similarly, Imaan & Akhlaq follows a structured developmental pathway:</p>
      
      <div class="pathway-grid">
        <div class="pathway-card early">
          <h4>Early Years (Foundation Stage)</h4>
          <p>Focus on manners, safety, obedience, and emotional awareness.</p>
          <div class="ref">Ref: Early Grade Outcomes – Manners, Cleanliness, Respect</div>
        </div>
        <div class="pathway-card middle">
          <h4>Middle Years (Development Stage)</h4>
          <p>Focus on responsibility, discipline, cooperation, and social behavior.</p>
          <div class="ref">Ref: Middle Grade Outcomes – Responsibility, Cooperation, Self-discipline</div>
        </div>
        <div class="pathway-card senior">
          <h4>Senior Years (Leadership Stage)</h4>
          <p>Focus on ethical decision-making, accountability, and leadership.</p>
          <div class="ref">Ref: Senior Grade Outcomes – Civic Responsibility, Moral Reasoning</div>
        </div>
      </div>
    </div>

    <!-- Pedagogical Alignment -->
    <div class="nce-section-card" data-aos="fade-up">
      <h3>Pedagogical Alignment</h3>
      <div class="comparison-grid">
        <div class="comp-box light">
          <h4>The national framework highlights:</h4>
          <ul>
            <li>Behavior-based learning outcomes</li>
            <li>Practical application of values</li>
            <li>Teacher-led mentoring and observation</li>
          </ul>
          <div style="font-size: 0.85rem; color: #64748b; margin-top: 20px;">Ref: Pedagogical & Implementation Guidelines – National Framework</div>
        </div>
        <div class="comp-box colored">
          <h4>Imaan & Akhlaq strengthens this through:</h4>
          <ul>
            <li>Story-based experiential learning</li>
            <li>Structured mentor guidance</li>
            <li>Student-led engagement (House System & Club Model)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Complementing National Objectives -->
    <div class="nce-section-card" data-aos="fade-up">
      <h3>Complementing National Objectives</h3>
      <p style="color: #475569; font-size: 1.1rem; margin-bottom: 20px;">While the national framework provides direction, Imaan & Akhlaq offers a <strong>complete execution model</strong>:</p>
      
      <div class="comparison-grid">
        <div class="comp-box colored" style="grid-column: 1 / -1;">
          <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <li><i class="fas fa-book text-warning me-2"></i> Curriculum books with structured progression</li>
            <li><i class="fas fa-chalkboard-teacher text-warning me-2"></i> Mentor guides for classroom delivery</li>
            <li><i class="fas fa-users text-warning me-2"></i> Student leadership systems for engagement</li>
            <li><i class="fas fa-laptop-code text-warning me-2"></i> Digital platform (imaanakhlaq.org) for monitoring and scalability</li>
          </ul>
          <div style="font-size: 0.85rem; color: #64748b; margin-top: 20px;">Ref: Implementation Strategy – National Character Building Framework</div>
        </div>
      </div>
    </div>

    <!-- Shared Vision -->
    <div class="nce-section-card" data-aos="fade-up">
      <h3>Shared Vision</h3>
      <p style="color: #475569; font-size: 1.1rem; text-align: center; margin-bottom: 30px;">Both frameworks aim to develop students who embody:</p>
      
      <div class="shared-vision-grid">
        <div class="vision-item">
          <i class="fas fa-balance-scale"></i>
          Integrity & Truthfulness
        </div>
        <div class="vision-item">
          <i class="fas fa-tasks"></i>
          Responsibility & Discipline
        </div>
        <div class="vision-item">
          <i class="fas fa-heart"></i>
          Compassion & Respect
        </div>
        <div class="vision-item">
          <i class="fas fa-user-shield"></i>
          Justice & Ethical Leadership
        </div>
      </div>
      <div style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 30px;">Ref: Core Values Framework – National Character Building Initiative</div>
    </div>

    <!-- Reference Section -->
    <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);" data-aos="fade-up">
      <p style="margin: 0; color: #64748b; font-size: 0.95rem;">
        <strong>Reference Note:</strong><br/>
        Source: National Character Building Framework, Ministry of Federal Education & Professional Training, Government of Pakistan.<br/>
        <a href="https://nrkna.gov.pk/wp-content/uploads/2024/06/Character-Building.pdf?utm_source=chatgpt.com" target="_blank" class="ref-link"><i class="fas fa-external-link-alt"></i> View the Official Framework Document</a>
      </p>
    </div>

  </div>
</div>

${Footer()}
`
