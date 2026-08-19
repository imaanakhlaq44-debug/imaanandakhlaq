import { html, raw } from 'hono/html';
import { pullToRefreshJS } from '../lib/pullToRefresh';
export const Head = () => html`\n<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Imaan & Akhlaq - Moral Education & Character Building</title>
  <meta name="description" content="Imaan & Akhlaq - Fun Islamic stories, puppet shows, and educational programs teaching faith, manners, and good character to children." />
  <meta property="og:title" content="Imaan & Akhlaq - Moral Education & Character Building" />
  <meta property="og:description" content="Join Imaan and Akhlaq on magical adventures learning about Islam, Prophets, and good manners!" />
  <meta property="og:type" content="website" />
  <link rel="icon" type="image/jpeg" href="/kidba_assets/favicon.jpg" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Sora is used ~146 times across the dashboards (sidebar nav, logout,
       headings) but was never requested here, so every visitor fell back to
       whatever their device chose. On themed Android that renders letters
       with decorative glyphs -- "LOGOUT" came out as "LƱGƱUT". The two
       standalone pages, admin-dashboard.html and teacher-reader.html, already
       ask for it; only this shared head was missing it. Weights match the set
       admin-dashboard.html settled on. -->
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet">

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

  <!-- Shared dashboard design system: tokens + the .ds-* components every
       dashboard is built from. Kept here so the four dashboards cannot drift
       into four palettes again. Scoped to .ds-* names, so the marketing pages
       that also load this head are unaffected. -->
  <link rel="stylesheet" href="/kidba_assets/css/dashboard-ui.css?v=1">

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
        var allowed = ['/auth', '/student-activities', '/family', '/teacher-dashboard', '/teacher-reader', '/admin-dashboard', '/super-admin-dashboard', '/activity', '/club'];
        if (!allowed.some(p => path === p)) {
          window.location.replace('auth.html');
        }

        // Pull to refresh — rules and wiring both live in
        // src/lib/pullToRefresh.ts, where the rules can be tested. They could
        // not be before: this whole block only runs inside a Capacitor
        // WebView, so nothing on a desktop or in CI ever exercised it.
        ${raw(pullToRefreshJS)}

        // Hardware Back Button Handling for Android
        document.addEventListener('DOMContentLoaded', function() {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            var lastBackPress = 0;

            // Push a dummy history entry so system back doesn't pop the WebView
            var isDashboard = ['/student-activities', '/teacher-dashboard', '/admin-dashboard', '/super-admin-dashboard'].some(function(p) {
              return window.location.pathname.includes(p);
            });
            if (isDashboard) {
              history.pushState(null, '', window.location.href);
              window.addEventListener('popstate', function() {
                history.pushState(null, '', window.location.href);
              });
            }

            // Tells the bottom bar's own listener to stand down on these
            // pages: one press, one decision.
            window.__iaBackHandler = true;

            window.Capacitor.Plugins.App.addListener('backButton', function(data) {
              var path = window.location.pathname;

              // Sub-pages: back one step. If there is nothing to step back to
              // — the page was opened directly — land on the dashboard rather
              // than falling out to the login page.
              if (path.includes('activity.html') || path.includes('club.html') || path.includes('blog-article') || path.includes('blog.html') || path.includes('contact.html') || path.includes('about.html')) {
                 if (window.history.length > 1) window.history.back();
                 else window.location.replace('student-activities.html');
                 return;
              }

              // Auth page: exit immediately
              if (path.includes('auth.html')) {
                 window.Capacitor.Plugins.App.exitApp();
                 return;
              }

              // Dashboard pages (student, teacher, parent, admin): warn first, exit/minimize on 2nd press
              var now = new Date().getTime();
              if (now - lastBackPress < 2000) {
                // Second press — minimize app (goes to background, does NOT logout)
                if (window.Capacitor.Plugins.App.minimizeApp) {
                  window.Capacitor.Plugins.App.minimizeApp();
                } else {
                  window.Capacitor.Plugins.App.exitApp();
                }
              } else {
                lastBackPress = now;
                var toast = document.createElement('div');
                toast.innerText = 'Press back again to exit';
                toast.style.cssText = 'position:fixed; bottom:90px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:white; padding:12px 24px; border-radius:30px; z-index:999999; font-family:sans-serif; font-size:14px; font-weight:500; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.3); transition:opacity 0.2s ease; opacity:0; pointer-events:none;';
                document.body.appendChild(toast);
                
                setTimeout(function() { toast.style.opacity = '1'; }, 10);
                
                setTimeout(function() {
                  toast.style.opacity = '0';
                  setTimeout(function() { if(toast.parentNode) toast.remove(); }, 300);
                }, 2000);
              }
            });
          }
        });
      }
    })();
  </script>
</head>
<body>\n`;
