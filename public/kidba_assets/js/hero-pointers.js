/* ============================================================
   Imaan & Akhlaq — pointing at their own hero product card.
   Plain scroll listener (no GSAP): reveals all 4 once the user
   scrolls a short distance, so they don't just pop in at load.
   The permanent `scaleX(-1)` mirror lives entirely in CSS (see
   HeroSectionV2.tsx's .hero-pointer rule) and is never touched by
   JS, so there's no fight over the `transform` property.
   ============================================================ */
(function () {
  'use strict';

  var pointers = document.querySelectorAll('.hero-pointer');
  if (!pointers.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS already shows them

  var shown = false;
  function reveal() {
    if (shown || window.scrollY < 60) return;
    shown = true;
    pointers.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('hp-visible'); }, i * 150);
    });
    window.removeEventListener('scroll', reveal);
  }
  window.addEventListener('scroll', reveal, { passive: true });
})();
