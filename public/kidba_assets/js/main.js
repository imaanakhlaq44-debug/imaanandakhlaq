/* ================================================================
   IMAAN & AKHLAQ — MAIN JAVASCRIPT  v3 (pixel-perfect overhaul)
   ================================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   SCROLL PROGRESS BAR
────────────────────────────────────────────────────────────── */
const scrollProgressEl = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  if (!scrollProgressEl) return;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
  scrollProgressEl.style.width = `${progress}%`;
}, { passive: true });

/* ──────────────────────────────────────────────────────────────
   PRELOADER (Ultra-Reliable: Multiple fallbacks)
────────────────────────────────────────────────────────────── */

// Aggressive preloader hiding function
function forceHidePreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  
  // Method 1: Add hidden class
  preloader.classList.add('hidden');
  
  // Method 2: Direct style manipulation
  preloader.style.opacity = '0';
  preloader.style.visibility = 'hidden';
  preloader.style.pointerEvents = 'none';
  preloader.style.display = 'none';
  
  // Method 3: Remove from DOM after transition
  setTimeout(() => {
    if (preloader.parentNode) {
      preloader.remove();
    }
  }, 800);
  
  console.log('✅ Preloader hidden successfully');
}

// Hide after 1 second (super fast!)
setTimeout(forceHidePreloader, 1000);

// Backup: Hide after 5 seconds no matter what
setTimeout(() => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none !important';
  }
}, 5000);

/* ──────────────────────────────────────────────────────────────
   NAVBAR SCROLL EFFECT
────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('mainNavbar');

window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ──────────────────────────────────────────────────────────────
   ACTIVE NAV LINK ON SCROLL
────────────────────────────────────────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.navbar-nav .nav-link');

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;
  let current = '';
  sections.forEach(sec => {
    if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
      current = sec.id;
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ──────────────────────────────────────────────────────────────
   SMOOTH SCROLL (respects sticky header height)
────────────────────────────────────────────────────────────── */
function getStickyOffset() {
  const header = document.querySelector('.site-header');
  return header ? header.offsetHeight + 16 : 90;
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href   = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - getStickyOffset();
    window.scrollTo({ top, behavior: 'smooth' });

    // Close mobile menu
    const collapse = document.getElementById('navbarNav');
    if (collapse?.classList.contains('show')) {
      document.querySelector('.navbar-toggler')?.click();
    }
  });
});

/* ──────────────────────────────────────────────────────────────
   BACK TO TOP
────────────────────────────────────────────────────────────── */
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTopBtn?.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

/* ──────────────────────────────────────────────────────────────
   HERO SWIPER
────────────────────────────────────────────────────────────── */
const heroSwiper = new Swiper('.hero-swiper', {
  loop: true,
  speed: 900,
  effect: 'fade',
  fadeEffect: { crossFade: true },
  autoplay: { delay: 5500, disableOnInteraction: false },
  pagination: { el: '.hero-pagination', clickable: true },
  navigation:  { nextEl: '.hero-next', prevEl: '.hero-prev' },
});

/* ──────────────────────────────────────────────────────────────
   STORIES SWIPER
────────────────────────────────────────────────────────────── */
new Swiper('.stories-swiper', {
  slidesPerView: 1,
  spaceBetween: 20,
  loop: true,
  autoplay: { delay: 4000, disableOnInteraction: false },
  pagination: { el: '.stories-pagination', clickable: true },
  breakpoints: {
    576:  { slidesPerView: 2, spaceBetween: 16 },
    768:  { slidesPerView: 3, spaceBetween: 18 },
    1200: { slidesPerView: 4, spaceBetween: 20 },
  },
});

/* ──────────────────────────────────────────────────────────────
   TESTIMONIALS SWIPER
────────────────────────────────────────────────────────────── */
new Swiper('.testi-swiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: true,
  autoplay: { delay: 4500, disableOnInteraction: false },
  pagination: { el: '.testi-pagination', clickable: true },
  breakpoints: {
    768:  { slidesPerView: 2, spaceBetween: 20 },
    1200: { slidesPerView: 3, spaceBetween: 24 },
  },
});

/* ──────────────────────────────────────────────────────────────
   AOS ANIMATIONS
────────────────────────────────────────────────────────────── */
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
}

/* ──────────────────────────────────────────────────────────────
   STATS COUNTER
────────────────────────────────────────────────────────────── */
function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-target'), 10);
  const noFormat = el.hasAttribute('data-no-format');
  const duration = 2000;
  const step     = target / (duration / 16);
  let current    = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = noFormat ? Math.floor(current).toString() : formatNumber(Math.floor(current));
  }, 16);
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return n.toString();
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.sc-number[data-target]').forEach(el => counterObserver.observe(el));

/* ──────────────────────────────────────────────────────────────
   GALLERY FILTER
────────────────────────────────────────────────────────────── */
const filterBtns   = document.querySelectorAll('.gf-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', function () {
    filterBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.getAttribute('data-filter');

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.getAttribute('data-category') === filter;
      if (match) {
        item.style.opacity   = '0';
        item.style.transform = 'scale(0.9)';
        item.style.display   = '';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          item.style.transition = 'opacity .4s ease, transform .4s ease';
          item.style.opacity    = '1';
          item.style.transform  = 'scale(1)';
        }));
      } else {
        item.style.transition = 'opacity .3s ease, transform .3s ease';
        item.style.opacity    = '0';
        item.style.transform  = 'scale(0.85)';
        setTimeout(() => { item.style.display = 'none'; }, 300);
      }
    });
  });
});

/* ──────────────────────────────────────────────────────────────
   GALLERY LIGHTBOX (simple)
────────────────────────────────────────────────────────────── */
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', function () {
    const label = this.querySelector('.gi-label')?.textContent || '';
    const icon  = this.querySelector('.gi-icon')?.textContent  || '🖼️';
    const sub   = this.querySelector('.gi-sub')?.textContent   || '';
    showLightbox(icon, label, sub);
  });
});

function showLightbox(icon, label, sub) {
  // Remove any existing
  document.querySelector('.ia-lightbox-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'ia-lightbox-overlay';
  overlay.innerHTML = `
    <div class="ia-lightbox-box">
      <button class="ia-lb-close" aria-label="Close">&times;</button>
      <div class="ia-lb-icon">${icon}</div>
      <h4 class="ia-lb-title">${label}</h4>
      ${sub ? `<p class="ia-lb-sub">${sub}</p>` : ''}
    </div>
  `;

  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,.85)',
    zIndex: '99999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    animation: 'iaFadeIn .3s ease',
  });

  const box = overlay.querySelector('.ia-lightbox-box');
  Object.assign(box.style, {
    background: '#fff', borderRadius: '24px',
    padding: '48px 40px', textAlign: 'center',
    maxWidth: '380px', width: '90%',
    position: 'relative', animation: 'iaSlideUp .3s ease',
  });

  const close = overlay.querySelector('.ia-lb-close');
  Object.assign(close.style, {
    position: 'absolute', top: '14px', right: '18px',
    background: 'none', border: 'none', fontSize: '1.8rem',
    cursor: 'pointer', color: '#666', lineHeight: '1',
  });
  close.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const lbIcon = overlay.querySelector('.ia-lb-icon');
  if (lbIcon) lbIcon.style.fontSize = '5rem';
  const lbTitle = overlay.querySelector('.ia-lb-title');
  if (lbTitle) Object.assign(lbTitle.style, { fontFamily: 'Poppins,sans-serif', fontWeight: '700', marginTop: '14px', color: '#1a1a2e' });
  const lbSub = overlay.querySelector('.ia-lb-sub');
  if (lbSub) Object.assign(lbSub.style, { fontSize: '.86rem', color: '#6b7280', marginTop: '6px' });

  document.body.appendChild(overlay);

  const escHandler = e => {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

// Inject lightbox keyframes once
const lbStyle = document.createElement('style');
lbStyle.textContent = `
  @keyframes iaFadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes iaSlideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
  @keyframes sparkleUp { 0% { opacity:1; transform:translate(-50%,-50%) scale(1) } 100% { opacity:0; transform:translate(-50%,-120%) scale(.5) } }
`;
document.head.appendChild(lbStyle);

/* ──────────────────────────────────────────────────────────────
   CONTACT FORM
────────────────────────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn          = this.querySelector('.btn-contact-submit');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
    btn.disabled  = true;
    btn.style.opacity = '.8';

    setTimeout(() => {
      btn.innerHTML        = '<i class="fas fa-check me-2"></i> Message Sent! JazakAllah Khair';
      btn.style.background = 'linear-gradient(135deg, #D63678, #E08020)';
      showToast('✅ Your message was sent successfully! We\'ll get back to you soon, InshaaAllah.', 'success');

      setTimeout(() => {
        btn.innerHTML        = originalHTML;
        btn.disabled         = false;
        btn.style.opacity    = '1';
        btn.style.background = '';
        contactForm.reset();
      }, 3500);
    }, 2000);
  });
}

/* ──────────────────────────────────────────────────────────────
   NEWSLETTER FORM
────────────────────────────────────────────────────────────── */
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = this.querySelector('input[type="email"]');
    const email = input?.value.trim();
    if (email && email.includes('@')) {
      showToast('🎉 Subscribed! You\'ll receive our latest stories & events!', 'success');
      if (input) input.value = '';
    } else {
      showToast('⚠️ Please enter a valid email address.', 'error');
    }
  });
}

/* ──────────────────────────────────────────────────────────────
   TOAST NOTIFICATION
────────────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  document.querySelectorAll('.ia-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'ia-toast';
  toast.textContent = message;

  const bg = { success: 'linear-gradient(135deg,#D63678,#E08020)', error: 'linear-gradient(135deg,#F44336,#E53935)', info: 'linear-gradient(135deg,#1E2D5A,#2E4480)' };

  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(80px)',
    background: bg[type] || bg.success,
    color: '#fff', padding: '14px 28px',
    borderRadius: '50px', fontFamily: 'Poppins,sans-serif',
    fontWeight: '600', fontSize: '.9rem',
    zIndex: '99998', boxShadow: '0 8px 30px rgba(0,0,0,.2)',
    transition: 'all .4s cubic-bezier(.4,0,.2,1)',
    maxWidth: '90vw', textAlign: 'center', lineHeight: '1.5',
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }));

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity   = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ──────────────────────────────────────────────────────────────
   FLOATING ELEMENTS PARALLAX (mouse)
────────────────────────────────────────────────────────────── */
window.addEventListener('mousemove', e => {
  const floatEls = document.querySelectorAll('.float-el');
  const mx = (e.clientX / window.innerWidth  - .5) * 20;
  const my = (e.clientY / window.innerHeight - .5) * 20;
  floatEls.forEach((el, i) => {
    const f = (i + 1) * .5;
    el.style.transform = `translate(${mx * f}px,${my * f}px)`;
  });
}, { passive: true });

/* ──────────────────────────────────────────────────────────────
   CURSOR SPARKLES (fun for kids!)
────────────────────────────────────────────────────────────── */
let sparkleThrottle = false;
document.addEventListener('mousemove', e => {
  if (sparkleThrottle) return;
  sparkleThrottle = true;
  setTimeout(() => { sparkleThrottle = false; }, 80);
  if (Math.random() > .72) createSparkle(e.clientX, e.clientY);
});

function createSparkle(x, y) {
  const el   = document.createElement('span');
  const icons = ['⭐', '✨', '🌟', '💫', '🌙'];
  el.textContent = icons[Math.floor(Math.random() * icons.length)];
  Object.assign(el.style, {
    position: 'fixed', left: `${x}px`, top: `${y}px`,
    pointerEvents: 'none', userSelect: 'none',
    fontSize: `${Math.random() * 10 + 10}px`, zIndex: '99997',
    animation: 'sparkleUp .9s ease forwards',
    transform: 'translate(-50%,-50%)',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

/* ──────────────────────────────────────────────────────────────
   MOBILE NAVBAR HAMBURGER → X ANIMATION
────────────────────────────────────────────────────────────── */
const toggler     = document.querySelector('.navbar-toggler');
const togglerIcon = document.querySelector('.toggler-icon');
if (toggler && togglerIcon) {
  toggler.addEventListener('click', function () {
    const isOpen = this.getAttribute('aria-expanded') === 'true';
    const spans  = togglerIcon.querySelectorAll('span');
    if (!isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* ──────────────────────────────────────────────────────────────
   INIT LOG
────────────────────────────────────────────────────────────── */
console.log('%c🌙 Imaan & Akhlaq', 'color:#D63678;font-size:1.5rem;font-weight:bold;');
console.log('%cIslamic Education for Kids — Ilm O Amal Initiative', 'color:#666;font-size:.9rem;');
console.log('%c📚 www.imaanakhlaq.org', 'color:#FF9800;font-size:.85rem;');
