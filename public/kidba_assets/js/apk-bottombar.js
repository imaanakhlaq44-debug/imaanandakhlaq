/* APK-only bottom bar injector. Auto-generated. */
(function(){
  // Only show on Capacitor (APK) shell. Standard web visits get nothing.
  function isApk(){
    try {
      if (window.Capacitor && (window.Capacitor.isNativePlatform ? window.Capacitor.isNativePlatform() : true)) return true;
    } catch(e){}
    // capacitor:// or https://localhost (Capacitor android scheme)
    if (location.protocol === 'capacitor:') return true;
    if (location.protocol === 'https:' && location.hostname === 'localhost') return true;
    // Manual override for testing: ?apkbar=1 or localStorage flag
    try {
      if (location.search.indexOf('apkbar=1') !== -1) return true;
      if (localStorage.getItem('apk_bottombar') === '1') return true;
    } catch(e){}
    return false;
  }
  if (!isApk()) return;
  if (document.querySelector('.apk-bottombar')) return;

  var WA = '923335756028';
  // Clean Meezan-style icon set. Two-tone where useful; brand-colored.
  var BUTTONS = [
    { key:'qibla',   label:'Qibla',    href:'apk/qibla.html',
      svg:'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><linearGradient id="gQ" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#E85B98"/><stop offset="100%" stop-color="#B62E66"/></linearGradient></defs>' +
          '<path fill="url(#gQ)" d="M16 2C10 2 6 6.3 6 12c0 6.5 6.6 13.7 9.2 16.4a1.1 1.1 0 0 0 1.6 0C19.4 25.7 26 18.5 26 12 26 6.3 22 2 16 2z"/>' +
          '<circle cx="16" cy="12" r="4" fill="#fff"/>' +
          '<rect x="13" y="10" width="6" height="4" rx="0.5" fill="#1E2D5A"/>' +
          '<rect x="13" y="11" width="6" height="1" fill="#E0B341"/>' +
          '</svg>' },
    { key:'tasbeeh', label:'Tasbeeh',  href:'apk/tasbeeh.html',
      svg:'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><radialGradient id="gT" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#FBC07A"/><stop offset="100%" stop-color="#B85A0F"/></radialGradient></defs>' +
          '<circle cx="16" cy="6"  r="3" fill="url(#gT)"/>' +
          '<circle cx="9"  cy="10" r="2.5" fill="url(#gT)"/>' +
          '<circle cx="23" cy="10" r="2.5" fill="url(#gT)"/>' +
          '<circle cx="5"  cy="16" r="2.3" fill="url(#gT)"/>' +
          '<circle cx="27" cy="16" r="2.3" fill="url(#gT)"/>' +
          '<circle cx="7"  cy="22" r="2.3" fill="url(#gT)"/>' +
          '<circle cx="25" cy="22" r="2.3" fill="url(#gT)"/>' +
          '<circle cx="12" cy="26" r="2.3" fill="url(#gT)"/>' +
          '<circle cx="20" cy="26" r="2.3" fill="url(#gT)"/>' +
          '<path d="M16 6 C9 10 5 16 7 22 C12 26 20 26 25 22 C27 16 23 10 16 6" fill="none" stroke="#1E2D5A" stroke-width="0.6" opacity="0.4"/>' +
          '</svg>' },
    { key:'faqs',    label:'FAQs',     href:'apk/faqs.html',
      svg:'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><linearGradient id="gF" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#5A9CFF"/><stop offset="100%" stop-color="#2256C6"/></linearGradient></defs>' +
          '<path fill="url(#gF)" d="M5 6a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H13l-6 5v-5H8a3 3 0 0 1-3-3V6z"/>' +
          '<text x="16" y="18" font-family="Nunito,Arial" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">?</text>' +
          '</svg>' },
    { key:'about',   label:'About',    href:'apk/about.html',
      svg:'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><linearGradient id="gA" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#8C7BFF"/><stop offset="100%" stop-color="#3B2EA8"/></linearGradient></defs>' +
          '<circle cx="16" cy="16" r="13" fill="url(#gA)"/>' +
          '<circle cx="16" cy="10" r="1.8" fill="#fff"/>' +
          '<rect x="14.4" y="13" width="3.2" height="10" rx="1.2" fill="#fff"/>' +
          '</svg>' },
    { key:'whatsapp',label:'WhatsApp', href:'https://wa.me/' + WA, external:true,
      svg:'<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="16" cy="16" r="15" fill="#25D366"/>' +
          '<path fill="#FFFFFF" d="M22.94 19.31c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.89-1.78-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.6-.81-.61-.21-.01-.45-.01-.69-.01-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.05.76.86.27 1.65.23 2.27.14.69-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42z"/>' +
          '<path fill="#FFFFFF" d="M27 5A14 14 0 0 0 5 22L3 30l8-2A14 14 0 1 0 27 5zM16 27.5a11.5 11.5 0 0 1-5.85-1.6l-.42-.25-4.36 1.14 1.16-4.25-.27-.43A11.5 11.5 0 1 1 16 27.5z"/>' +
          '</svg>' }
  ];

  var bar = document.createElement('div');
  bar.className = 'apk-bottombar';
  bar.innerHTML =
    '<button type="button" class="apk-bottombar__chev" data-dir="-1" aria-label="Scroll left">&#10094;</button>' +
    '<div class="apk-bottombar__scroll"></div>' +
    '<button type="button" class="apk-bottombar__chev" data-dir="1" aria-label="Scroll right">&#10095;</button>';
  var scroller = bar.querySelector('.apk-bottombar__scroll');

  BUTTONS.forEach(function(b){
    var a = document.createElement('a');
    a.className = 'apk-bottombar__btn';
    a.setAttribute('data-k', b.key);
    // FIX: hrefs like 'apk/qibla.html' break when current page already lives
    // under /apk/ (would become /apk/apk/qibla.html). Detect that and rewrite
    // to '../apk/...' (effectively just the same file in the same folder).
    var href = b.href;
    if (!b.external) {
      try {
        var path = location.pathname || '';
        if (path.indexOf('/apk/') !== -1 && href.indexOf('apk/') === 0) {
          href = href.substring(4); // drop leading 'apk/' so it becomes 'qibla.html' (same folder)
        }
      } catch(e){}
    }
    a.href = href;
    if (b.external) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = '<span class="apk-bottombar__icon">' + b.svg + '</span>' +
                  '<span class="apk-bottombar__label">' + b.label + '</span>';
    scroller.appendChild(a);
  });

  bar.querySelectorAll('.apk-bottombar__chev').forEach(function(btn){
    btn.addEventListener('click', function(){
      var dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
      scroller.scrollBy({ left: dir * 160, behavior: 'smooth' });
    });
  });

  function isAuthPage(){
    try {
      var p = (location.pathname || '').toLowerCase();
      // /auth, /auth.html, /auth/index, also nested like /auth?...; treat root '/' as auth in APK shell
      if (p === '/' || p === '') return true;
      if (p.indexOf('/auth') === 0) return true;
      if (p.indexOf('auth.html') !== -1) return true;
      if (p.indexOf('/index.html') !== -1) return true;
      return false;
    } catch(e){ return false; }
  }
  var BAR_FIXED = isAuthPage();

  function mount(){
    // Mount inside <body> (most reliable for position:fixed in WebView).
    // Children of <html> outside head/body can be hoisted/dropped by parsers.
    var host = document.body || document.documentElement;
    if (bar.parentNode !== host || host.lastElementChild !== bar) {
      host.appendChild(bar);
    }
    document.documentElement.classList.add('apk-has-bottombar');
    if (document.body) document.body.classList.add('apk-has-bottombar');
    if (BAR_FIXED) {
      bar.classList.add('apk-bottombar--fixed');
      document.documentElement.classList.add('apk-bar-fixed');
      if (document.body) document.body.classList.add('apk-bar-fixed');
    } else {
      bar.classList.remove('apk-bottombar--fixed');
      document.documentElement.classList.remove('apk-bar-fixed');
      if (document.body) document.body.classList.remove('apk-bar-fixed');
    }
  }
  function ensureMounted(){
    try {
      var host = document.body || document.documentElement;
      if (!host.contains(bar)) { mount(); return; }
      if (host.lastElementChild !== bar) { host.appendChild(bar); }
      // Defensive: enforce critical inline styles ONLY when bar must be pinned (auth).
      if (BAR_FIXED) {
        bar.style.setProperty('position','fixed','important');
        bar.style.setProperty('left','0','important');
        bar.style.setProperty('right','0','important');
        bar.style.setProperty('bottom','0','important');
        bar.style.setProperty('top','auto','important');
        bar.style.setProperty('z-index','2147483647','important');
      } else {
        // Non-auth: clear any pinned inline styles so it scrolls with content.
        bar.style.removeProperty('position');
        bar.style.removeProperty('left');
        bar.style.removeProperty('right');
        bar.style.removeProperty('bottom');
        bar.style.removeProperty('top');
        bar.style.removeProperty('z-index');
      }
      bar.style.setProperty('transform','none','important');
      bar.style.setProperty('display','flex','important');
      bar.style.setProperty('visibility','visible','important');
      bar.style.setProperty('opacity','1','important');
      // If any ancestor has transform/filter/perspective, fixed will be relative
      // to that ancestor instead of viewport. Strip those on html/body which we own
      // (only matters for fixed mode, but harmless otherwise).
      if (BAR_FIXED) {
        try {
          document.documentElement.style.setProperty('transform','none','important');
          document.documentElement.style.setProperty('filter','none','important');
          document.documentElement.style.setProperty('perspective','none','important');
          if (document.body) {
            document.body.style.setProperty('transform','none','important');
            document.body.style.setProperty('filter','none','important');
            document.body.style.setProperty('perspective','none','important');
          }
        } catch(e){}
      }
    } catch(e){}
  }
  if (document.documentElement) mount();
  if (!document.body) document.addEventListener('DOMContentLoaded', mount);
  // Watch for SPA-style DOM changes that could remove or re-order the bar.
  try {
    var mo = new MutationObserver(ensureMounted);
    var startObs = function(){
      mo.observe(document.documentElement, { childList: true });
      if (document.body) mo.observe(document.body, { childList: true });
    };
    if (document.body) startObs(); else document.addEventListener('DOMContentLoaded', startObs);
  } catch(e){}
  // Re-pin on scroll & resize (cheap; just reasserts inline styles).
  window.addEventListener('scroll', ensureMounted, { passive: true });
  window.addEventListener('resize', ensureMounted);
  window.addEventListener('orientationchange', ensureMounted);
  // Final safety net: re-check every 1.5s; cheap, only on APK.
  setInterval(ensureMounted, 1500);

  /* ===== Detect on-screen keyboard and hide bottombar to avoid black gap ===== */
  (function setupKeyboardWatch(){
    var _bar = null;
    function getBar(){ if (!_bar) _bar = document.querySelector('.apk-bottombar'); return _bar; }

    function setKb(open){
      try {
        var cl = document.documentElement.classList;
        var bcl = document.body && document.body.classList;
        var bar = getBar();
        if (open) {
          cl.add('apk-keyboard-open');
          bcl && bcl.add('apk-keyboard-open');
          // Directly hide bar + kill fixed-bar padding so no black gap shows
          if (bar) bar.style.setProperty('display','none','important');
          document.documentElement.style.setProperty('padding-bottom','0','important');
          if (document.body) document.body.style.setProperty('padding-bottom','0','important');
          // Force white background on entire page so WebView native black never bleeds through
          document.documentElement.style.setProperty('background','#ffffff','important');
          if (document.body) document.body.style.setProperty('background','#ffffff','important');
        } else {
          cl.remove('apk-keyboard-open');
          bcl && bcl.remove('apk-keyboard-open');
          // Restore bar display (let CSS decide actual value)
          if (bar) bar.style.removeProperty('display');
          document.documentElement.style.removeProperty('padding-bottom');
          if (document.body) document.body.style.removeProperty('padding-bottom');
        }
      } catch(e){}
    }
    // Method 1: Capacitor Keyboard plugin events (most reliable in Capacitor apps)
    try {
      function getKbPlugin(){
        return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard;
      }
      function tryCapacitorKb(){
        var kb = getKbPlugin();
        if (kb && kb.addListener) {
          kb.addListener('keyboardWillShow', function(){ setKb(true); });
          kb.addListener('keyboardWillHide', function(){ setKb(false); });
          return true;
        }
        return false;
      }
      if (!tryCapacitorKb()) {
        document.addEventListener('DOMContentLoaded', function(){
          if (!tryCapacitorKb()) { setTimeout(tryCapacitorKb, 800); }
        });
      }
    } catch(e){}
    // Method 2: focusin/focusout — fires synchronously BEFORE keyboard appears
    function isTextInput(el){
      if (!el) return false;
      var tag = (el.tagName || '').toUpperCase();
      if (tag === 'TEXTAREA') return true;
      if (tag === 'INPUT') {
        var type = (el.type || 'text').toLowerCase();
        return ['text','email','password','tel','number','search','url','date','time','datetime-local','month','week'].indexOf(type) !== -1;
      }
      if (el.isContentEditable) return true;
      return false;
    }
    document.addEventListener('focusin', function(ev){ if (isTextInput(ev.target)) setKb(true); }, true);
    document.addEventListener('focusout', function(){
      setTimeout(function(){
        var ae = document.activeElement;
        if (!isTextInput(ae)) setKb(false);
      }, 150);
    }, true);
  })();

  /* ===== Hardware BACK button: navigate within app instead of exiting ===== */
  (function setupBackHandler(){
    function getApp(){
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) return window.Capacitor.Plugins.App;
      } catch(e){}
      return null;
    }
    var App = getApp();
    if (!App) {
      // Plugin may be injected slightly after our script runs; retry briefly.
      var tries = 0;
      var t = setInterval(function(){
        App = getApp();
        if (App) { clearInterval(t); attach(App); }
        else if (++tries > 40) { clearInterval(t); }
      }, 250);
      return;
    }
    attach(App);

    function attach(App){
      var lastBackTs = 0;
      var toastEl = null;
      function showToast(msg){
        try {
          if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(0,0,0,0.78);color:#fff;font:600 13px/1.3 Nunito,system-ui,sans-serif;padding:10px 18px;border-radius:22px;z-index:2147483646;pointer-events:none;box-shadow:0 8px 22px rgba(0,0,0,0.35);transition:opacity .25s';
            document.body.appendChild(toastEl);
          }
          toastEl.textContent = msg;
          toastEl.style.opacity = '1';
          clearTimeout(toastEl.__t);
          toastEl.__t = setTimeout(function(){ if (toastEl) toastEl.style.opacity = '0'; }, 1800);
        } catch(e){}
      }
      function isHomeLikePage(){
        var p = (location.pathname || '').toLowerCase();
        if (p === '/' || p === '' || p.indexOf('/auth') === 0 || p.indexOf('auth.html') !== -1 || p.indexOf('/index.html') !== -1) return true;
        // A dashboard is where a signed-in person lives, so back does not walk
        // out of it. This used to fall through to history.back(), which popped
        // to whatever came before — the login page — and looked like being
        // signed out. The page's own handler (Head.tsx) takes it from here:
        // press back twice to leave the app.
        var roots = ['student-activities', 'teacher-dashboard', 'admin-dashboard', 'super-admin-dashboard', 'family'];
        for (var i = 0; i < roots.length; i++) {
          if (p.indexOf(roots[i]) !== -1) return true;
        }
        return false;
      }
      App.addListener('backButton', function(ev){
        // 0) Pages built from the app's own layout own their back button
        //    (see Head.tsx). This has to be the FIRST thing checked, not the
        //    fourth: the checks below used to run before it and one of them
        //    navigated to the student dashboard, so on a chapter page the same
        //    press was answered twice — once here and once by Head.tsx — and
        //    the toast from one appeared over the page the other had left.
        //    Everything past this line is for this bar's own standalone pages:
        //    Qibla, Tasbeeh, Azkar, FAQs, About.
        if (window.__iaBackHandler) return;
        // 1) Whatever the page has open on top of itself. Same contract
        //    Head.tsx uses, so a page states its rule once and it holds
        //    wherever that page is served — auth.html included, which is
        //    where this bar is the only handler.
        try {
          if (typeof window.__iaBackIntercept === 'function' && window.__iaBackIntercept() === true) return;
        } catch(e){}
        // 2) If Qibla AR camera is open, close it first.
        try {
          if (document.body && document.body.classList.contains('qibla-ar-open')) {
            var closeBtn = document.getElementById('qiblaArClose');
            if (closeBtn) { closeBtn.click(); return; }
          }
        } catch(e){}
        // 3) If any visible modal/dialog is open, close it.
        try {
          var modal = document.querySelector('[data-modal-open="true"], .modal.open, .modal.show, .apk-modal.open, dialog[open]');
          if (modal) {
            var x = modal.querySelector('[data-modal-close], .modal-close, .close, [aria-label="Close"]');
            if (x) { x.click(); return; }
            if (typeof modal.close === 'function') { try { modal.close(); return; } catch(e){} }
          }
        } catch(e){}
        // 4) If history has a previous in-app entry, go back.
        try {
          if (window.history && window.history.length > 1 && !isHomeLikePage()) {
            window.history.back();
            return;
          }
        } catch(e){}
        // 4) On home/auth page: double-tap-to-exit.
        var now = Date.now();
        if (now - lastBackTs < 2000) {
          try { App.exitApp(); } catch(e){ try { App.minimizeApp && App.minimizeApp(); } catch(e2){} }
          return;
        }
        lastBackTs = now;
        showToast('Press back again to exit');
      });
    }
  })();
})();
