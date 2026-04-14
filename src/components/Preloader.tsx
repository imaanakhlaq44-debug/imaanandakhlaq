import { html } from 'hono/html';
export const Preloader = () => html`\n<!-- ===== KIDBA-STYLE SPLASH SCREEN ===== -->\n
  <div id="preloader">
    <!-- Floating decorative shapes -->
    <div class="splash-shapes">
      <div class="splash-shape shape-1"></div>
      <div class="splash-shape shape-2"></div>
      <div class="splash-shape shape-3"></div>
      <div class="splash-shape shape-4"></div>
      <div class="splash-shape shape-5"></div>
      <div class="splash-shape shape-6"></div>
      <div class="splash-shape shape-7"></div>
      <div class="splash-shape shape-8"></div>
    </div>

    <!-- Center content -->
    <div class="splash-center">
      <!-- Logo with glow -->
      <div class="splash-logo-wrap">
        <img src="/kidba_assets/img/splash_logo.jpg" alt="Imaan & Akhlaq" class="splash-logo" />
      </div>

      <!-- Animated brand wordmark Ã¢â‚¬â€ Kidba style colorful text -->
      <div class="splash-wordmark">
        <span class="sw-let" style="color:#D63678;animation-delay:.05s">I</span><span class="sw-let" style="color:#E08020;animation-delay:.1s">m</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.15s">a</span><span class="sw-let" style="color:#C99A6B;animation-delay:.2s">a</span><span class="sw-let" style="color:#D63678;animation-delay:.25s">n</span><span class="sw-amp">&amp;</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.35s">A</span><span class="sw-let" style="color:#D63678;animation-delay:.4s">k</span><span class="sw-let" style="color:#E08020;animation-delay:.45s">h</span><span class="sw-let" style="color:#C99A6B;animation-delay:.5s">l</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.55s">a</span><span class="sw-let" style="color:#D63678;animation-delay:.6s">q</span>
      </div>

      <!-- Pen/book deco icon -->
      <div class="splash-icon">
        <svg viewBox="0 0 64 64" width="42" height="42" class="splash-pen-svg">
          <g transform="rotate(-30 32 32)">
            <rect x="14" y="12" width="36" height="40" rx="3" fill="#D63678" opacity="0.9"/>
            <rect x="18" y="16" width="28" height="32" rx="2" fill="#fff" opacity="0.95"/>
            <line x1="22" y1="24" x2="42" y2="24" stroke="#E08020" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            <line x1="22" y1="30" x2="38" y2="30" stroke="#D63678" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
            <line x1="22" y1="36" x2="40" y2="36" stroke="#1E2D5A" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
            <path d="M 30 8 A 6 6 0 0 1 30 20 A 4 4 0 0 0 30 8" fill="#E08020" opacity="0.85"/>
            <circle cx="33" cy="11" r="1" fill="#E08020"/>
            <line x1="44" y1="8" x2="38" y2="42" stroke="#1E2D5A" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="38,42 36,48 40,48" fill="#D63678"/>
            <circle cx="48" cy="6" r="1.5" fill="#E08020" class="splash-sparkle sp-1"/>
            <circle cx="52" cy="12" r="1" fill="#D63678" class="splash-sparkle sp-2"/>
            <circle cx="46" cy="14" r="1.2" fill="#C99A6B" class="splash-sparkle sp-3"/>
          </g>
        </svg>
      </div>

      <!-- Progress bar -->
      <div class="splash-progress-track">
        <div class="splash-progress-bar" id="splashProgressBar"></div>
      </div>

      <!-- Loading text -->
      <p class="splash-loading-text">Loading joyful learning<span class="splash-dots">...</span></p>
    </div>

    <!-- Bottom tagline -->
    <p class="splash-tagline">Islamic Stories &amp; Education for Kids</p>
  </div>

  \n`;
