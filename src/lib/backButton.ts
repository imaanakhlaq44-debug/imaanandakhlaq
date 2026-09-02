/**
 * The app's one hardware back button handler.
 *
 * Lives here rather than inline in Head.tsx because Head.tsx is not the only
 * page that needs it. public/admin-dashboard.html is a hand-maintained static
 * file carrying its own copy of the Capacitor block, and its copy of this
 * handler had drifted: it never set __iaBackHandler, so the bottom bar never
 * stood down and the school admin dashboard was still running the
 * two-handlers-racing bug every other page had been fixed for.
 *
 * Head.tsx interpolates this, and the /admin-dashboard route substitutes it
 * into that page at build time — the same arrangement pullToRefresh.ts uses,
 * for the same reason.
 *
 * A page that needs to answer back itself sets window.__iaBackIntercept to a
 * function returning true when it has handled the press.
 */
export const backButtonJS = `
  // ─────────────────────────────────────────────────────────────────
  // The one back button handler
  // ─────────────────────────────────────────────────────────────────
  //
  // There used to be three of them, and which one answered a press
  // depended on the clock. This handler registered at DOMContentLoaded;
  // the student dashboard registered its own 1.2s later and called
  // removeAllListeners('backButton') first, deleting this one and the
  // bottom bar's; the bottom bar polls for the Capacitor plugin every
  // 250ms for up to 10s and could re-register itself after that
  // deletion. So a press in the first second did one thing, a press at
  // two seconds did another, and once two listeners survived together a
  // single press both navigated away and put up "Press back again to
  // exit" over the page it had already left.
  //
  // One listener now, registered here and nowhere else. A page that
  // needs to answer back itself — close an open book, a panel, a modal
  // — sets window.__iaBackIntercept to a function returning true when it
  // has handled the press. No page calls addListener, and nothing calls
  // removeAllListeners.

  // Set synchronously, not inside DOMContentLoaded: the bottom bar
  // checks this flag to stand down, and it can attach before that event.
  window.__iaBackHandler = true;

  // Which screen a sub-page belongs under.
  //
  // Deliberately an explicit parent rather than history.back(). The
  // WebView's stack still holds whatever came before — including
  // auth.html from signing in — and stepping blindly back into it is
  // exactly how the back button landed on the login page. A screen's
  // parent does not depend on how the user arrived at it.
  var BACK_PARENT = {
    'activity': 'student-activities.html',
    'club': 'student-activities.html',
    'reading-plan': 'family.html',
    'teacher-reader': 'teacher-dashboard.html'
  };

  // Root screens: nothing above them, so back leaves the app.
  var BACK_ROOTS = [
    'index', 'auth', 'student-activities', 'family',
    'teacher-dashboard', 'admin-dashboard', 'super-admin-dashboard'
  ];

  // 'student-activities' and 'activity' are different screens, so the
  // page is matched exactly and never by substring.
  function currentPageKey() {
    var last = (window.location.pathname || '').split('/').pop() || '';
    return last.replace(/\\.html$/, '') || 'index';
  }

  function backToast() {
    var toast = document.createElement('div');
    toast.innerText = 'Press back again to exit';
    toast.style.cssText = 'position:fixed; bottom:90px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:white; padding:12px 24px; border-radius:30px; z-index:999999; font-family:sans-serif; font-size:14px; font-weight:500; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.3); transition:opacity 0.2s ease; opacity:0; pointer-events:none;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '1'; }, 10);
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 2000);
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App)) return;
    var App = window.Capacitor.Plugins.App;
    var lastBackPress = 0;

    App.addListener('backButton', function() {
      // 1. Whatever the page has open on top of itself.
      try {
        if (typeof window.__iaBackIntercept === 'function' && window.__iaBackIntercept() === true) return;
      } catch (e) {}

      var page = currentPageKey();

      // 2. A sub-page goes to the screen it belongs under. replace()
      //    rather than href so holding back does not walk a stack of
      //    every chapter the child opened tonight.
      if (BACK_PARENT[page]) {
        window.location.replace(BACK_PARENT[page]);
        return;
      }

      // 3. Anything unrecognised still has to do something sane. One
      //    real step back beats leaving the app from a page nobody
      //    listed here.
      if (BACK_ROOTS.indexOf(page) === -1 && window.history.length > 1) {
        window.history.back();
        return;
      }

      // 4. A root screen: press twice to leave.
      var now = new Date().getTime();
      if (now - lastBackPress < 2000) {
        if (App.minimizeApp) App.minimizeApp();
        else App.exitApp();
      } else {
        lastBackPress = now;
        backToast();
      }
    });
  });
`
