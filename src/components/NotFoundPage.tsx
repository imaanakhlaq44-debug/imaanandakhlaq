import { html } from 'hono/html'
import { Head } from './Head'

export const NotFoundPage = () => html`${Head()}
<style>
  .not-found-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    font-family: 'Inter', 'Nunito', sans-serif;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  .not-found-page::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(214, 54, 120, 0.15) 0%, transparent 60%);
    top: -200px;
    left: -200px;
    animation: float-glow 8s ease-in-out infinite alternate;
  }

  .not-found-page::after {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(224, 128, 32, 0.12) 0%, transparent 60%);
    bottom: -200px;
    right: -200px;
    animation: float-glow 8s ease-in-out infinite alternate-reverse;
  }

  @keyframes float-glow {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(30px, -30px) scale(1.1); }
  }

  .nf-container {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 560px;
  }

  .nf-code {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(7rem, 15vw, 12rem);
    line-height: 1;
    background: linear-gradient(135deg, #D63678, #E08020, #F59E0B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 10px;
    animation: pulse-text 3s ease-in-out infinite;
    text-shadow: none;
  }

  @keyframes pulse-text {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.02); }
  }

  .nf-emoji {
    font-size: 4rem;
    margin-bottom: 20px;
    animation: bounce-emoji 2s ease-in-out infinite;
  }

  @keyframes bounce-emoji {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  .nf-title {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: #f8fafc;
    margin: 0 0 16px;
  }

  .nf-desc {
    font-size: 1.1rem;
    color: #94a3b8;
    line-height: 1.7;
    margin: 0 0 36px;
    font-weight: 500;
  }

  .nf-actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .nf-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .nf-btn-primary {
    background: linear-gradient(135deg, #D63678, #E08020);
    color: white;
    box-shadow: 0 8px 25px rgba(214, 54, 120, 0.3);
  }

  .nf-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(214, 54, 120, 0.4);
    color: white;
  }

  .nf-btn-outline {
    background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
    border: 2px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
  }

  .nf-btn-outline:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
  }

  /* Floating particles */
  .nf-particles {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
  }

  .nf-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    opacity: 0.3;
    animation: float-particle 15s linear infinite;
  }

  .nf-particle:nth-child(1) { background: #D63678; left: 10%; animation-duration: 12s; animation-delay: 0s; }
  .nf-particle:nth-child(2) { background: #E08020; left: 25%; animation-duration: 18s; animation-delay: -3s; }
  .nf-particle:nth-child(3) { background: #F59E0B; left: 45%; animation-duration: 14s; animation-delay: -6s; }
  .nf-particle:nth-child(4) { background: #10b981; left: 65%; animation-duration: 16s; animation-delay: -2s; }
  .nf-particle:nth-child(5) { background: #8b5cf6; left: 80%; animation-duration: 20s; animation-delay: -5s; }
  .nf-particle:nth-child(6) { background: #D63678; left: 90%; animation-duration: 13s; animation-delay: -8s; }

  @keyframes float-particle {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.4; }
    90% { opacity: 0.4; }
    100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
  }
</style>

<div class="not-found-page">
  <div class="nf-particles">
    <div class="nf-particle"></div>
    <div class="nf-particle"></div>
    <div class="nf-particle"></div>
    <div class="nf-particle"></div>
    <div class="nf-particle"></div>
    <div class="nf-particle"></div>
  </div>

  <div class="nf-container">
    <div class="nf-emoji">🔍</div>
    <div class="nf-code">404</div>
    <h1 class="nf-title">Oops! Page Not Found</h1>
    <p class="nf-desc">
      The page you're looking for seems to have wandered off on its own adventure. 
      Let's get you back to Imaan & Akhlaq!
    </p>
    <div class="nf-actions">
      <a href="/" class="nf-btn nf-btn-primary">
        <i class="fas fa-home"></i> Go Home
      </a>
      <a href="/auth" class="nf-btn nf-btn-outline">
        <i class="fas fa-sign-in-alt"></i> Login
      </a>
    </div>
  </div>
</div>
</body>
</html>
`
