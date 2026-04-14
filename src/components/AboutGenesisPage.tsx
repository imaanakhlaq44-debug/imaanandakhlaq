import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutGenesisPage = () => html`
${Head()}
${Header()}

<style>
  .about-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .about-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #F59E0B 0%, #E08020 100%); color: white; text-align: center; overflow: hidden; }
  .about-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .about-hero-content { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; }
  .about-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .about-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  /* Genesis Section */
  .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
  .genesis-section { background: white; border-radius: 40px; padding: 80px 60px; margin: -80px auto 80px; position:relative; z-index:3; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 30px; }
  .genesis-content { display: flex; flex-direction: column; gap: 20px; font-size: 1.15rem; color: #475569; line-height: 1.8; }
  .genesis-quote { font-size: 1.4rem; font-weight: bold; color: #1E2D5A; border-left: 5px solid #F59E0B; padding-left: 20px; margin: 20px 0; }
  @media(max-width: 768px) { .genesis-section { padding: 40px 20px; } }
</style>

<div class="about-page">
  <div class="about-hero">
    <div class="about-hero-content" data-aos="fade-up">
      <h1>Genesis</h1>
      <p>A Vision Born from Concern. How the journey of Imaan & Akhlaq began.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="container">
    <div class="genesis-section" data-aos="zoom-in">
      <h2 class="section-title">The Spark of Imaan & Akhlaq</h2>
      <div class="genesis-content">
        <p>It began with a concern close to home. Saith Usama J. Chitrali, also known as Shiekh Uncle, observed children consuming content that was shaping their behavior, emotions, and worldview, often disconnected from their faith and values.</p>
        <div class="genesis-quote">"What is truly shaping the character of our children?"</div>
        <p>The initial idea behind Imaan & Akhlaq was to create meaningful, value-driven animation. However, due to practical constraints and the high cost of production, the vision could not take shape at that time.</p>
        <p>In 2024, a pivotal conversation with educator Ahmed Masood Khan led to a deeper realization that, while moral education existed, true character-building was missing. This sparked a journey.</p>
        <p>Shiekh Uncle began with story-based curriculum books, designed to connect values with real-life actions. Gradually, the vision expanded into a complete ecosystem: activity books, audio stories, interactive learning, and impactful puppet shows created with the Uncle Sargam Team (Kaliyan).</p>
        <p style="font-weight: bold; color: #D63678; font-size: 1.3rem;">Today, Imaan & Akhlaq is more than a program. It is a growing movement to transform learning into living.</p>
      </div>
    </div>
  </div>
</div>

${Footer()}
`
