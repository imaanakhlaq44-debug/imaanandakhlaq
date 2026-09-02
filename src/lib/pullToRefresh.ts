/**
 * Pull to refresh, for the APK only.
 *
 * The hard part is not the animation, it is telling a pull apart from a
 * scroll. Scrolling up through a long page ends with the content at the top
 * and a finger still travelling downwards; read naively that is exactly what
 * a pull looks like, so the page reloaded itself under people who were only
 * trying to get back to the top.
 *
 * The rules live in iaPullDecision() below, separate from the DOM wiring, so
 * they can be tested without a browser — the wiring can only run inside a
 * Capacitor WebView, which is why the previous version's mistake could not be
 * caught anywhere except on a phone.
 */

/**
 * Screens where reloading means "fetch my work again" and not "throw away what
 * I was reading".
 *
 * The student dashboard is deliberately not here. Children scroll it hard and
 * fast, and even a gesture that is genuinely a pull only costs them the place
 * they were in — there is nothing on that screen worth a reload.
 */
export const PULL_TO_REFRESH_PAGES = [
  'teacher-dashboard',
  'admin-dashboard',
  'super-admin-dashboard',
  'family',
  'club'
];

/** Ignored at the start of a gesture, so a fingertip wobble is never a pull. */
export const PULL_SLOP = 14;

/** How far a deliberate pull has to travel: about a thumb's length. */
export const PULL_THRESHOLD = 150;

export const pullToRefreshJS = `
  var IA_PULL_PAGES = ${JSON.stringify(PULL_TO_REFRESH_PAGES)};
  var IA_PULL_SLOP = ${PULL_SLOP};
  var IA_PULL_THRESHOLD = ${PULL_THRESHOLD};

  /**
   * What a finished gesture was. Returns 'refresh', 'cancel' (a pull that was
   * not carried far enough) or 'scroll' (never a pull in the first place).
   *
   * A pull has to be all four of: begun while already at the top and at rest,
   * never once moving upwards, more vertical than horizontal, and longer than
   * a comfortable scroll flick. Anything else is a scroll, and a scroll never
   * refreshes.
   */
  function iaPullDecision(g) {
    if (!g.startedAtTop) return 'scroll';
    if (g.movedUp) return 'scroll';
    if (g.horizontal) return 'scroll';
    if (g.scrolled) return 'scroll';
    if (g.multiTouch) return 'scroll';
    if (g.overlayOpen) return 'scroll';
    if (g.distance < IA_PULL_THRESHOLD) return 'cancel';
    return 'refresh';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var here = (window.location.pathname || '').toLowerCase();
    var wanted = IA_PULL_PAGES.some(function (name) { return here.indexOf(name) !== -1; });
    if (!wanted) return;

    var g = null;   // the gesture in progress

    var ptrEl = document.createElement('div');
    ptrEl.id = 'ptrSpinner';
    ptrEl.innerHTML = '<i class="fas fa-arrow-down"></i>';
    ptrEl.style.cssText = 'position:fixed; top:-60px; left:50%; transform:translateX(-50%); z-index:99999; background:white; color:#E08020; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.18); transition: top 0.25s, transform 0.25s; font-size:1.1rem; pointer-events:none;';
    document.body.appendChild(ptrEl);

    // Which element scrolls varies by page, so ask the one the finger is
    // actually inside rather than guessing at a class name.
    function scrollerAt(target) {
      var el = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight + 4) {
          var overflow = window.getComputedStyle(el).overflowY;
          if (overflow === 'auto' || overflow === 'scroll') return el;
        }
        el = el.parentElement;
      }
      return document.querySelector('.dashboard-main') || document.querySelector('.main-content') || window;
    }

    function scrollTopOf(scroller) {
      return scroller === window
        ? (window.scrollY || document.documentElement.scrollTop || 0)
        : scroller.scrollTop;
    }

    // A pull with a dialog open would reload the page out from under it.
    function overlayOpen() {
      return !!document.querySelector('.modal-overlay:not(.d-none), .fam-overlay:not(.d-none), .custom-modal-overlay');
    }

    function resetIndicator() {
      ptrEl.style.transition = 'top 0.25s, transform 0.25s';
      ptrEl.style.top = '-60px';
      ptrEl.style.color = '#E08020';
      ptrEl.style.background = 'white';
      ptrEl.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
      ptrEl.innerHTML = '<i class="fas fa-arrow-down"></i>';
    }

    document.addEventListener('touchstart', function (e) {
      var scroller = scrollerAt(e.target);
      g = {
        scroller: scroller,
        startY: e.touches[0].clientY,
        startX: e.touches[0].clientX,
        distance: 0,
        startedAtTop: scrollTopOf(scroller) <= 0,
        movedUp: false,
        horizontal: false,
        scrolled: false,
        multiTouch: e.touches.length !== 1,
        overlayOpen: overlayOpen()
      };
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!g) return;

      var dy = e.touches[0].clientY - g.startY;
      var dx = Math.abs(e.touches[0].clientX - g.startX);

      if (dy < 0) g.movedUp = true;
      if (dx > Math.abs(dy)) g.horizontal = true;
      if (scrollTopOf(g.scroller) > 0) g.scrolled = true;
      if (e.touches.length !== 1) g.multiTouch = true;
      g.distance = dy;

      // Once it is a scroll it stays a scroll for the rest of the gesture.
      if (iaPullDecision(g) === 'scroll') { resetIndicator(); return; }
      if (dy <= IA_PULL_SLOP) return;

      if (e.cancelable) e.preventDefault();
      ptrEl.style.transition = 'none';
      // Follows the thumb, with resistance near the end so it feels held.
      var travel = Math.min((dy - IA_PULL_SLOP) * 0.55, 70);
      ptrEl.style.top = (travel - 60) + 'px';
      ptrEl.style.transform = 'translateX(-50%) rotate(' + (dy * 1.2) + 'deg)';

      if (dy >= IA_PULL_THRESHOLD) {
        ptrEl.style.color = '#16a34a';
        ptrEl.style.background = '#f0fdf4';
        ptrEl.style.boxShadow = '0 4px 14px rgba(22,163,74,0.28)';
        ptrEl.innerHTML = '<i class="fas fa-sync-alt"></i>';
      } else {
        ptrEl.style.color = '#E08020';
        ptrEl.style.background = 'white';
        ptrEl.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
        ptrEl.innerHTML = '<i class="fas fa-arrow-down"></i>';
      }
    }, { passive: false });

    document.addEventListener('touchend', function () {
      if (!g) return;
      var verdict = iaPullDecision(g);
      g = null;

      if (verdict === 'refresh') {
        ptrEl.style.transition = 'top 0.25s';
        ptrEl.style.top = '20px';
        ptrEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        setTimeout(function () { window.location.reload(); }, 350);
      } else {
        resetIndicator();
      }
    });
  });
`
