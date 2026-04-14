import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const ProductBooksPage = () => html`
${Head()}
${Header()}

<style>
  .products-page { font-family: 'Inter', sans-serif; color: #334155; background: #F8FAFC; overflow-x: hidden; }
  
  /* Hero */
  .hero-section { position: relative; padding: 180px 20px 150px; background: linear-gradient(135deg, #D63678 0%, #1E2D5A 100%); color: white; text-align: center; overflow: hidden; }
  .hero-section::before { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.2; animation: floatBG 20s linear infinite; }
  @keyframes floatBG { from { background-position: 0 0; } to { background-position: 500px 500px; } }
  .hero-content { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; }
  .hero-content h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.5rem, 5vw, 4.5rem); margin-bottom: 20px; text-shadow: 2px 4px 10px rgba(0,0,0,0.3); }
  .hero-content p { font-size: 1.25rem; opacity: 0.95; line-height: 1.8; font-weight: 500; }
  .hero-wave { position: absolute; bottom: -5px; left: 0; width: 100%; overflow: hidden; line-height: 0; transform: rotate(180deg); }
  .hero-wave svg { display: block; width: calc(100% + 1.3px); height: 80px; transform: rotateY(180deg); }
  .hero-wave path { fill: #F8FAFC; }

  /* Section Containers */
  .books-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  .section-title { font-family: 'Fredoka One', cursive; font-size: 2.5rem; color: #1E2D5A; text-align: center; margin-bottom: 60px; }

  /* Books Listing (Alternating) */
  .books-wrapper { padding: 80px 0; }
  .book-row { display: flex; align-items: center; gap: 60px; margin-bottom: 80px; }
  .book-row:nth-child(even) { flex-direction: row-reverse; }
  @media(max-width: 991px) { .book-row, .book-row:nth-child(even) { flex-direction: column; text-align: center; gap: 30px; } }

  .book-img-col { flex: 0 0 auto; width: 300px; }
  @media(max-width: 991px) { .book-img-col { width: 100%; max-width: 350px; margin: 0 auto; } }
  .book-img { width: 100%; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .book-row:hover .book-img { transform: translateY(-10px) rotate(2deg); }
  .book-row:nth-child(even):hover .book-img { transform: translateY(-10px) rotate(-2deg); }

  .book-content-col { flex: 1; }
  .book-badge { display: inline-block; padding: 8px 16px; background: #E08020; color: white; border-radius: 20px; font-weight: 800; margin-bottom: 15px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
  .book-content-col h3 { font-family: 'Fredoka One', cursive; color: #1E2D5A; font-size: 2.2rem; margin-bottom: 20px; }
  .book-content-col p { color: #475569; font-size: 1.15rem; line-height: 1.8; margin-bottom: 15px; }
</style>

<div class="products-page">
  <div class="hero-section">
    <div class="hero-content" data-aos="fade-up">
      <h1>Curriculum Storybooks</h1>
      <p>A comprehensive journey spanning from beautifully illustrated storybooks outlining the epic struggle between faith and corruption.</p>
    </div>
    <div class="hero-wave">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.65,133.62,216.5,116.14,252.12,108.31,288.54,82.88,321.39,56.44Z"></path></svg>
    </div>
  </div>

  <div class="books-wrapper books-container">
    <div class="title-center" data-aos="fade-up">
      <h2 class="section-title">The Complete Series</h2>
    </div>

    <!-- BOOK 1 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book1.jpg" alt="Book 1" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#10B981;">Book 1</span>
        <h3>The Whispering of Shadows</h3>
        <p>Introduces the core conflict. The protagonist, <strong>Imaan</strong> (representing the pure heart or sound belief), begins confronting the internal whispers of <strong>Faasid</strong> (the corrupter) and his army of <strong>Wasawis</strong> (doubts and negative thoughts).</p>
        <p>This book sets the stage for recognizing unseen struggles within oneself and learning to fortify the heart.</p>
      </div>
    </div>

    <!-- BOOK 2 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book2.jpg" alt="Book 2" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#3B82F6;">Book 2</span>
        <h3>Dughli and Chughli <br/><small style="font-size:1.2rem; color:#64748b;">(Hypocrisy and Backbiting)</small></h3>
        <p>Faasid introduces deeper societal issues. The villains <strong>Dughli</strong> (two-faced behavior) and <strong>Chughli</strong> (gossip/backbiting) try to isolate <strong>Akhlaq</strong> (representing good character or action).</p>
        <p>This story shows how these negative traits destroy trust, break relationships, and weaken the community fabric.</p>
      </div>
    </div>

    <!-- BOOK 3 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book3.jpg" alt="Book 3" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#D63678;">Book 3</span>
        <h3>Chaplus Gang <br/><small style="font-size:1.2rem; color:#64748b;">(The Flatterers)</small></h3>
        <p>This story highlights the dangers of arrogance and waste. <strong>Mutakabbir</strong> (the arrogant one) and <strong>Musrif</strong> (the extravagant/wasteful one) strike, using the "Chaplus gang" (sycophants or flatterers) to feed false pride.</p>
        <p>The heroes face the major challenge of staying humble, grateful, and grounded in reality.</p>
      </div>
    </div>

    <!-- BOOK 4 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book4.jpg" alt="Book 4" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#F59E0B;">Book 4</span>
        <h3>Raiah and Naseer <br/><small style="font-size:1.2rem; color:#64748b;">(The True Companions)</small></h3>
        <p>The narrative shifts slightly towards the rise of the heroes' allies, focusing on leadership, responsibility, and support.</p>
        <p><strong>Raiah</strong> (the responsible shepherd/caretaker) and <strong>Naseer</strong> (the helper/supporter) step forward to aid Imaan and Akhlaq, symbolizing the immense importance of good companionship and collective responsibility.</p>
      </div>
    </div>

    <!-- BOOK 5 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book5.jpg" alt="Book 5" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#8B5CF6;">Book 5</span>
        <h3>The Continued Resistance</h3>
        <p>The conflict deepens. Raiah and Naseer are explicitly introduced as the strategic counterbalance to Faasid's forces.</p>
        <p>This book emphasizes that maintaining faith and character is an ongoing daily struggle, teaching children that Faasid will always look for new ways to divide or conquer a pure heart.</p>
      </div>
    </div>

    <!-- BOOK 6 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book6.jpg" alt="Book 6" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#E08020;">Book 6</span>
        <h3>Final Confrontation</h3>
        <p>The climax of the spiritual and moral battle. <strong>Faasid is revealed in his ultimate form</strong>—representing the ultimate deceiver, Iblees (Satan).</p>
        <p>At the same time, the roles of Raiah and Naseer are expanded to symbolize Parents (the ultimate caretakers and supporters), highlighting the crucial and irreplaceable role of parental guidance in confronting major moral crises.</p>
      </div>
    </div>

    <!-- BOOK 7 -->
    <div class="book-row" data-aos="fade-up">
      <div class="book-img-col">
        <img src="/assets/covers/book7.jpg" alt="Book 7" class="book-img" />
      </div>
      <div class="book-content-col">
        <span class="book-badge" style="background:#1E2D5A;">Book 7</span>
        <h3>Beyond the Mountains <br/><small style="font-size:1.2rem; color:#64748b;">(Kaahilistan)</small></h3>
        <p>A transition to practical, worldly struggles. The story introduces a new setting and challenge: <strong>Kaahilistan</strong> (The Land of Laziness).</p>
        <p>Here, the heroes face <strong>Kaahil</strong> (Laziness), illustrating that even after defeating major moral evils, one must constantly battle apathy and inactivity to be truly productive, successful, and beneficial to the world.</p>
      </div>
    </div>
  </div>

</div>
${Footer()}
`
