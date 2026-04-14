import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const AboutFounderPage = () => html`
${Head()}
${Header()}

<style>
  .about-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .about-hero { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-align: center; overflow: hidden; }
  .about-hero::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .about-hero-content { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; }
  .about-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .about-hero p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #1E2D5A; } /* Transition to dark background below */

  /* AUTHOR MESSAGE */
  .message-wrapper {
    background: #1E2D5A;
    padding: 0px 20px 100px;
    position: relative;
  }
  .message-card {
    max-width: 900px; margin: 0 auto;
    background: #FDF8F5; padding: 60px; border-radius: 30px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.3);
    position: relative; z-index: 2; margin-top: -60px;
  }
  .arabic { font-family: 'Amiri', serif; font-size: 2.2rem; text-align: center; margin-bottom: 10px; color: #1E2D5A; direction: rtl; line-height: 1.5; }
  .message-card p { font-size: 1.15rem; line-height: 1.9; color: #334155; margin-bottom: 25px; }
  .author-sign { margin-top: 30px; font-family: 'Fredoka One', cursive; font-size: 1.8rem; color: #E08020; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.2rem; color: #1E2D5A; text-align: center; margin-bottom: 40px; }
  @media(max-width: 768px) { .message-card { padding: 30px 20px; } .arabic { font-size: 1.8rem; } }
</style>

<div class="about-page">
  <div class="about-hero">
    <div class="about-hero-content" data-aos="fade-up">
      <h1>Message from Founder</h1>
      <p>A heartfelt letter on the responsibility of shaping the next generation.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="message-wrapper">
    <div class="container">
      <div class="message-card" data-aos="zoom-in">
        <div class="arabic">قال رسول الله ﷺ: «أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا»</div>
        <p class="text-center text-muted" style="font-size: 0.9rem; margin-top:-5px; margin-bottom:30px;">(Sunan al-Tirmidhi, 1162; Abu Dawood, 4682)</p>

        <h2 class="section-title">An Open Letter to Parents & Educators</h2>
        <p>Dear Brothers and Sisters,</p>
        <p>In today's world, the responsibility of shaping a child does not belong to the educational system alone; it belongs to all of us. Parents, educators, social institutions, and society collectively play a role in nurturing the next generation. For that, we all have to act as mentors.</p>
        <p>A teacher may deliver knowledge, but a mentor nurtures individuals to live with purpose, to act with integrity, and to contribute meaningfully to the world around them.</p>
        <p>Moral education is not confined to lessons, words, or memorization. Its true essence lies in transforming how a child thinks, chooses, and behaves. It is reflected not in what they know, but in who they become.</p>
        <p>Whether you are a parent guiding your child at home, an educator shaping minds in a classroom, or an institution responsible for future generations, your role carries immense weight. Every effort you make in nurturing values becomes a form of ongoing goodness (Sadaqah e jariyah), benefiting lives far beyond what we can see.</p>
        <p>Through Imaan & Akhlaq, we aim to support this shared responsibility. This is not just a curriculum, but an ecosystem designed to help children connect faith with action, values with behavior, and learning with real life.</p>
        <p>It is also a journey for you. A journey that rekindles purpose, strengthens intention, and transforms the way we approach character-building not as a subject to teach, but as a life to live.</p>
        <p>We are living in a time filled with challenges, and at the root of many of them lies a decline in moral grounding. Addressing this is not optional, it is essential. Let us rise together, not just as individuals fulfilling roles, but as change-makers who inspire, uplift, and transform.</p>
        <p>I pray that this effort becomes a means of strength, sincerity, and lasting impact for all of us.</p>
        
        <div class="text-end">
          <p style="margin-top: 40px; margin-bottom: 0px; font-weight: 700; color: #475569;">Your very own,</p>
          <div class="author-sign">Shiekh Uncle</div>
        </div>
      </div>
    </div>
  </div>
</div>

${Footer()}
`
