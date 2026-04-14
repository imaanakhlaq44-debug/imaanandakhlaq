import { html } from 'hono/html'

export const StoryWorldV2 = () => html`
<style>
  .story-world {
    padding: 100px 20px;
    background: linear-gradient(135deg, #1E2D5A, #B02460);
    color: white;
    text-align: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .story-world::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="2" fill="rgba(255,255,255,0.05)"/></svg>');
    z-index: 1;
  }

  .story-container {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .story-world h2 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    margin-bottom: 24px;
    color: #FDF8F5;
    text-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }

  .story-text {
    font-size: 1.2rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.9);
    margin-bottom: 40px;
  }

  .character-stage {
    display: flex;
    justify-content: center;
    gap: 60px;
    margin-bottom: 50px;
    flex-wrap: wrap;
    position: relative;
  }

  .char-wrapper {
    position: relative;
    cursor: pointer;
  }

  .char-avatar {
    width: 160px;
    height: 160px;
    background-color: #fff;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 4px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    transition: transform 0.3s ease, border-color 0.3s ease;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }

  .char-wrapper:hover .char-avatar {
    transform: scale(1.1);
    border-color: #F59E0B;
  }

  .char-label {
    margin-top: 15px;
    font-weight: 800;
    font-size: 1.2rem;
    letter-spacing: 1px;
    color: #F59E0B;
  }

  /* Popups styling */
  .char-popup {
    position: absolute;
    top: 30%;
    width: 250px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255,255,255,0.3);
    padding: 20px;
    border-radius: 15px;
    text-align: left;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    z-index: 10;
  }
  
  .char-popup h4 {
    font-family: 'Fredoka One', cursive;
    margin-bottom: 8px;
    color: #F59E0B;
    font-size: 1.2rem;
  }
  
  .char-popup p {
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }

  /* Animates to the left of the image */
  .popup-left {
    right: 170px;
    transform: translate(40px, -50%) scale(0.8);
  }
  .char-wrapper:hover .popup-left {
    opacity: 1;
    visibility: visible;
    transform: translate(0, -50%) scale(1);
  }

  /* Animates to the right of the image */
  .popup-right {
    left: 170px;
    transform: translate(-40px, -50%) scale(0.8);
  }
  .char-wrapper:hover .popup-right {
    opacity: 1;
    visibility: visible;
    transform: translate(0, -50%) scale(1);
  }

  @media (max-width: 768px) {
    .char-popup {
       top: 100%;
       left: 50% !important;
       right: auto !important;
       transform: translate(-50%, -10px) scale(0.8) !important;
       margin-top: 5px;
    }
    .char-wrapper:hover .char-popup {
       transform: translate(-50%, 15px) scale(1) !important;
    }
  }

  .emotional-line {
    font-family: 'Fredoka One', cursive;
    font-size: 1.5rem;
    color: #C99A6B;
    background: rgba(0,0,0,0.2);
    padding: 20px 40px;
    border-radius: 50px;
    display: inline-block;
    border: 1px solid rgba(255,255,255,0.1);
  }
</style>

<section class="story-world" id="stories">
  <div class="story-container">
    <h2>Enter the World of Imaan & Akhlaq</h2>
    <p class="story-text">
      Follow two young heroes as they navigate challenges, defeat negative traits, and grow into symbols of faith and character.<br/><strong>From Imaan & Akhlaq… to Raiah & Naseer.</strong>
    </p>

    <div class="character-stage">
      <div class="char-wrapper">
        <div class="char-avatar avatar-imaan" style="background-image: url('./kidba_assets/img/imaan-front.jpg');"></div>
        <div class="char-label">IMAAN</div>
        <div class="char-popup popup-left">
          <h4>Imaan</h4>
          <p>A pure heart striving for goodness. Through every trial, she demonstrates faith and unwavering resolve.</p>
        </div>
      </div>
      <div class="char-wrapper">
        <div class="char-avatar avatar-akhlaq" style="background-image: url('./kidba_assets/img/akhlaq-front.jpg');"></div>
        <div class="char-label">AKHLAQ</div>
        <div class="char-popup popup-right">
          <h4>Akhlaq</h4>
          <p>The embodiment of good manners and resilience. He shows what true ethical character looks like in action.</p>
        </div>
      </div>
    </div>

    <div class="emotional-line">
      The values aren't just meant to be learned—they are meant to be lived.
    </div>
  </div>
</section>
`
