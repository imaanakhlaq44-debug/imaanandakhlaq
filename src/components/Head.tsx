import { html } from 'hono/html';
export const Head = () => html`\n<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Imaan & Akhlaq - Islamic Stories & Education for Kids</title>
  <meta name="description" content="Imaan & Akhlaq - Fun Islamic stories, puppet shows, and educational programs teaching faith, manners, and good character to children." />
  <meta property="og:title" content="Imaan & Akhlaq - Islamic Education for Kids" />
  <meta property="og:description" content="Join Imaan and Akhlaq on magical adventures learning about Islam, Prophets, and good manners!" />
  <meta property="og:type" content="website" />
  <link rel="icon" type="image/jpeg" href="/kidba_assets/favicon.jpg" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Bootstrap 5 -->
  <link rel="stylesheet" href="/kidba_assets/vendor/css/bootstrap.min.css" />

  <!-- Font Awesome -->
  <link rel="stylesheet" href="/kidba_assets/vendor/css/all.min.css" />

  <!-- Animate.css -->
  <link rel="stylesheet" href="/kidba_assets/vendor/css/animate.min.css" />

  <!-- Swiper CSS -->
  <link rel="stylesheet" href="/kidba_assets/vendor/css/swiper-bundle.min.css" />

  <!-- AOS CSS -->
  <link rel="stylesheet" href="/kidba_assets/vendor/css/aos.css" />

  <!-- Custom CSS -->
  <link rel="stylesheet" href="/kidba_assets/css/style.css">

  <!-- Capacitor Mobile App: always redirect to Auth on public pages -->
  <script>
    (function() {
      // Capacitor injects its bridge automatically
      var isCap = false;
      try {
        isCap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      } catch(e) {}
      if (isCap) {
        var host = window.location.hostname;
        var protocol = window.location.protocol;
        if ((host === '127.0.0.1' || host === '0.0.0.0') || (host === 'localhost' && protocol !== 'https:')) {
          var normalizedUrl = 'https://localhost' + window.location.pathname + window.location.search + window.location.hash;
          if (window.location.href !== normalizedUrl) {
            window.location.replace(normalizedUrl);
            return;
          }
        }
        var path = window.location.pathname.replace(/\\/index\\.html$/, '/').replace(/\\.html$/, '').replace(/\\/$/, '') || '/';
        // Only allow these pages in app
        var allowed = ['/auth', '/student-activities', '/parent-dashboard', '/teacher-dashboard', '/admin-dashboard', '/super-admin-dashboard', '/activity'];
        if (!allowed.some(p => path === p)) {
          window.location.replace('auth.html');
        }

        // Add custom Pull-to-Refresh for Capacitor
        document.addEventListener('DOMContentLoaded', function() {
          var startY = 0;
          var pY = 0;
          var isPulling = false;
          
          var ptrEl = document.createElement('div');
          ptrEl.id = 'ptrSpinner';
          ptrEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          ptrEl.style.cssText = 'position:fixed; top:-50px; left:50%; transform:translateX(-50%); z-index:99999; background:white; color:#E08020; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.15); transition: top 0.2s, transform 0.2s; font-size:1.2rem; pointer-events:none;';
          document.body.appendChild(ptrEl);

          function getScrollTop() {
            var el = document.querySelector('.dashboard-main') || document.querySelector('.main-content') || window;
            return el === window ? window.scrollY : el.scrollTop;
          }

          document.addEventListener('touchstart', function(e) {
            if (getScrollTop() <= 0) {
              startY = e.touches[0].clientY;
              isPulling = true;
              ptrEl.style.transition = 'none';
            }
          }, {passive: true});

          document.addEventListener('touchmove', function(e) {
            if (!isPulling) return;
            var y = e.touches[0].clientY;
            pY = y - startY;
            if (pY > 0 && getScrollTop() <= 0) {
              if (e.cancelable) e.preventDefault();
              ptrEl.style.top = Math.min(pY - 50, 60) + 'px';
              ptrEl.style.transform = 'translateX(-50%) rotate(' + (pY * 2) + 'deg)';
            }
          }, {passive: false});

          document.addEventListener('touchend', function(e) {
            if (!isPulling) return;
            isPulling = false;
            ptrEl.style.transition = 'top 0.3s';
            if (pY > 120 && getScrollTop() <= 0) {
              ptrEl.style.top = '60px';
              setTimeout(function() { window.location.reload(); }, 300);
            } else {
              ptrEl.style.top = '-50px';
            }
            pY = 0;
          });
        });
      }
    })();
  </script>
</head>
<body>\n`;
