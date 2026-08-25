import { html, raw } from 'hono/html';
import { pullToRefreshJS } from '../lib/pullToRefresh';
import { apkAllowedRoutesJS } from '../lib/appRoutes';
import { appUpdateJS } from '../lib/appUpdate';
import { backButtonJS } from '../lib/backButton';
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
        // src/lib/appRoutes.ts — the same list the APK link rewriter reads.
        var allowed = [${raw(apkAllowedRoutesJS)}];
        if (!allowed.some(p => path === p)) {
          window.location.replace('auth.html');
        }

        // A new version on Play, asked for on launch rather than left for
        // Android to notice in its own time. See src/lib/appUpdate.ts.
        ${raw(appUpdateJS)}

        // Pull to refresh — rules and wiring both live in
        // src/lib/pullToRefresh.ts, where the rules can be tested. They could
        // not be before: this whole block only runs inside a Capacitor
        // WebView, so nothing on a desktop or in CI ever exercised it.
        ${raw(pullToRefreshJS)}

        ${raw(backButtonJS)}
      }
    })();
  </script>
</head>
<body>\n`;
