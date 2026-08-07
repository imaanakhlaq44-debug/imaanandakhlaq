// Post-build: overwrite dist/index.html with APK splash + auth redirect
const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Imaan &amp; Akhlaq</title>
  <link rel="stylesheet" href="/kidba_assets/css/style.css">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --c-pink:#D63678;--c-orange:#E08020;--c-navy:#1E2D5A;--c-tan:#C99A6B;
      --f-head:'Fredoka One',cursive;--f-body:'Nunito',sans-serif;
    }
    body { margin:0; padding:0; background:#FDF8F5; }
  </style>
</head>
<body>
  <div id="preloader">
    <div class="splash-shapes">
      <div class="splash-shape shape-1"></div><div class="splash-shape shape-2"></div>
      <div class="splash-shape shape-3"></div><div class="splash-shape shape-4"></div>
      <div class="splash-shape shape-5"></div><div class="splash-shape shape-6"></div>
      <div class="splash-shape shape-7"></div><div class="splash-shape shape-8"></div>
    </div>
    <div class="splash-center">
      <div class="splash-logo-wrap">
        <img src="/kidba_assets/img/splash_logo.jpg" alt="Imaan &amp; Akhlaq" class="splash-logo" />
      </div>
      <div class="splash-wordmark">
        <span class="sw-let" style="color:#D63678;animation-delay:.05s">I</span><span class="sw-let" style="color:#E08020;animation-delay:.1s">m</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.15s">a</span><span class="sw-let" style="color:#C99A6B;animation-delay:.2s">a</span><span class="sw-let" style="color:#D63678;animation-delay:.25s">n</span><span class="sw-amp">&amp;</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.35s">A</span><span class="sw-let" style="color:#D63678;animation-delay:.4s">k</span><span class="sw-let" style="color:#E08020;animation-delay:.45s">h</span><span class="sw-let" style="color:#C99A6B;animation-delay:.5s">l</span><span class="sw-let" style="color:#1E2D5A;animation-delay:.55s">a</span><span class="sw-let" style="color:#D63678;animation-delay:.6s">q</span>
      </div>
      <div class="splash-icon">
        <svg viewBox="0 0 64 64" width="42" height="42">
          <g transform="rotate(-30 32 32)">
            <rect x="14" y="12" width="36" height="40" rx="3" fill="#D63678" opacity="0.9"/>
            <rect x="18" y="16" width="28" height="32" rx="2" fill="#fff" opacity="0.95"/>
            <line x1="22" y1="24" x2="42" y2="24" stroke="#E08020" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            <line x1="22" y1="30" x2="38" y2="30" stroke="#D63678" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
            <line x1="22" y1="36" x2="40" y2="36" stroke="#1E2D5A" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
            <path d="M 30 8 A 6 6 0 0 1 30 20 A 4 4 0 0 0 30 8" fill="#E08020" opacity="0.85"/>
            <line x1="44" y1="8" x2="38" y2="42" stroke="#1E2D5A" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="38,42 36,48 40,48" fill="#D63678"/>
            <circle cx="48" cy="6" r="1.5" fill="#E08020" class="splash-sparkle sp-1"/>
            <circle cx="52" cy="12" r="1" fill="#D63678" class="splash-sparkle sp-2"/>
            <circle cx="46" cy="14" r="1.2" fill="#C99A6B" class="splash-sparkle sp-3"/>
          </g>
        </svg>
      </div>
      <div class="splash-progress-track">
        <div class="splash-progress-bar" id="splashProgressBar"></div>
      </div>
      <p class="splash-loading-text">Loading joyful learning<span class="splash-dots">...</span></p>
    </div>
    <p class="splash-tagline">Islamic Stories &amp; Education for Kids</p>
  </div>
  <script>
    setTimeout(function() {
      var dest = 'auth.html';
      try {
        var u = JSON.parse(localStorage.getItem('auth_user') || 'null');
        if (u) {
          if (u.role === 'school_admin') dest = 'admin-dashboard.html';
          else if (u.role === 'teacher') dest = 'teacher-dashboard.html';
          else if (u.role === 'student' || u.role === 'individual') dest = 'student-activities.html';
          else if (u.role === 'parent') dest = 'parent-dashboard.html';
        }
      } catch(e) {}
      window.location.replace(dest);
    }, 1800);
  </script>
</body>
</html>`;

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const dest = path.join(distDir, 'index.html');

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    const candidatePath = path.join(projectRoot, candidate);
    if (fs.existsSync(candidatePath)) return candidatePath;
  }
  return null;
}

function installCompressedApkPdfs() {
  const apkPdfMap = {
    'book1.pdf': ['book1.pdf', 'Book1.pdf'],
    'book2.pdf': ['book2.pdf', 'Book2.pdf'],
    'book3.pdf': ['book3.pdf', 'Book3.pdf']
  };

  for (const [distName, candidates] of Object.entries(apkPdfMap)) {
    const sourcePath = resolveExistingPath(candidates);
    if (!sourcePath) {
      console.warn('APK PDF source not found for', distName);
      continue;
    }

    const targetPath = path.join(distDir, distName);
    fs.copyFileSync(sourcePath, targetPath);
    console.log('APK PDF installed:', distName, 'from', path.basename(sourcePath));
  }
}

function patchApkAuthPage() {
  const authPath = path.join(distDir, 'auth.html');
  if (!fs.existsSync(authPath)) {
    console.warn('APK auth page not found at dist/auth.html');
    return;
  }

  let authHtml = fs.readFileSync(authPath, 'utf8');

  // The legacy XHR auth block injected further down needs the Firebase key and
  // project id. Rather than hardcoding them a second time (they used to be
  // pasted here, so rotating the key meant remembering this file too), lift
  // them straight out of the page Vite just built — that page gets its config
  // from src/lib/firebaseConfig.ts, i.e. from .env / GitHub Secrets.
  function readBuiltConfig(field) {
    const match = authHtml.match(new RegExp(field + '\\s*:\\s*"([^"]+)"'));
    if (!match) {
      throw new Error(
        'apk-splash: could not read ' + field + ' from ' + authPath + '. ' +
        'The built auth page should contain a firebaseConfig object — check ' +
        'that VITE_FIREBASE_* were set when `npm run build` ran.'
      );
    }
    return match[1];
  }
  const legacyApiKey = readBuiltConfig('apiKey');
  const legacyProjectId = readBuiltConfig('projectId');

  const apkAuthDesignCss = `

  /* APK_AUTH_DESIGN_PATCH */
  .auth-wrapper {
    background:
      radial-gradient(circle at top right, rgba(214, 54, 120, 0.16), transparent 28rem),
      radial-gradient(circle at top left, rgba(224, 128, 32, 0.13), transparent 22rem),
      linear-gradient(180deg, #f7fbff 0%, #edf2ff 100%);
  }

  .auth-nav {
    position: relative;
    justify-content: center;
    padding: 18px 12px 12px;
  }

  .back-link {
    display: none !important;
  }

  .brand-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 26px;
    background: linear-gradient(135deg, #d63678 0%, #e08020 45%, #f4c542 70%, #1e2d5a 100%);
    box-shadow: 0 12px 28px rgba(30, 45, 90, 0.20), 0 3px 8px rgba(214, 54, 120, 0.20);
    text-decoration: none;
  }

  .brand-logo-img {
    display: block;
    width: clamp(120px, 32vw, 180px);
    height: clamp(120px, 32vw, 180px);
    border-radius: 22px;
    background: #fff;
    object-fit: contain;
  }

  .auth-top-switch-wrap { padding: 18px 14px 8px !important; margin: 0 !important; }

  .auth-top-switch-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 18px 14px 8px;
  }

  .auth-view-switch {
    width: min(340px, 100%) !important;
    height: 38px !important;
    min-height: 0 !important;
    max-height: 38px !important;
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;
    gap: 0 !important;
    padding: 4px !important;
    border-radius: 999px !important;
    border: 1px solid #d7deef !important;
    background: linear-gradient(180deg, #eef2ff 0%, #e7eefc 100%) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(30,45,90,0.08) !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .auth-view-btn {
    flex: 1 1 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: none !important;
    border-radius: 999px !important;
    height: 100% !important;
    min-height: 0 !important;
    padding: 0 8px !important;
    margin: 0 !important;
    font-size: 0.66rem !important;
    line-height: 1 !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    color: #61708d !important;
    background: transparent !important;
    cursor: pointer !important;
    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease !important;
    box-sizing: border-box !important;
  }

  .auth-view-btn:hover:not(.active) {
    background: rgba(255,255,255,0.65) !important;
    color: var(--brand-navy) !important;
  }

  .auth-view-btn.active {
    color: var(--brand-navy) !important;
    background: linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%) !important;
    box-shadow: 0 4px 10px rgba(30,45,90,0.14), inset 0 0 0 1px rgba(255,255,255,0.9) !important;
  }

  .auth-container {
    max-width: 1140px;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
    gap: 12px;
    padding: 4px 14px 12px;
    margin-top: 0 !important;
    flex: 0 0 auto !important;
  }

  /* Pull the entire auth shell to the top so it does not balloon vertically */
  .auth-wrapper { justify-content: flex-start !important; min-height: auto !important; }
  .auth-wrapper > * { flex: 0 0 auto !important; }
  .auth-login-panel, .auth-register-panel { margin-top: 0 !important; }

  .auth-box {
    border-radius: 18px;
    border-color: #dbe4f0;
    padding: 18px 18px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.03);
  }

  .auth-box-title { font-size: 1.15rem !important; margin-bottom: 4px !important; }
  .auth-box-desc  { font-size: 0.82rem !important; margin-bottom: 14px !important; }

  .auth-login-panel .auth-box {
    position: sticky !important;
    top: 24px !important;
  }

  .role-list {
    gap: 14px;
  }

  .role-item {
    border-radius: 16px;
    border-color: #dbe4f0;
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.03);
  }

  .role-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }

  .role-item.active {
    background: #fff1f6;
    box-shadow: 0 0 0 1px var(--brand-pink), 0 14px 30px rgba(214,54,120,0.14);
  }

  .btn {
    border-radius: 12px;
  }

  .auth-wrapper.mode-login .auth-container {
    max-width: 650px;
    grid-template-columns: 1fr;
  }

  .auth-wrapper.mode-login .auth-register-panel {
    display: none;
  }

  .auth-wrapper.mode-login .auth-login-panel {
    display: block;
  }

  .auth-wrapper.mode-login .auth-login-panel .auth-box {
    position: static !important;
  }

  .auth-wrapper.mode-register .auth-container {
    max-width: 900px;
    grid-template-columns: 1fr;
  }

  .auth-wrapper.mode-register .auth-register-panel {
    display: block;
  }

  .auth-wrapper.mode-register .auth-login-panel {
    display: none;
  }

  @media (max-width: 900px) {
    .auth-nav {
      justify-content: center;
      padding: 14px 12px 10px;
      gap: 6px;
      flex-wrap: wrap;
    }

    .brand-logo {
      order: 1;
      padding: 4px;
    }

    .brand-logo-img {
      width: clamp(110px, 36vw, 160px);
      height: clamp(110px, 36vw, 160px);
    }

    .auth-top-switch-wrap { padding: 14px 14px 8px !important; }

    .auth-container {
      grid-template-columns: 1fr;
      padding: 4px 12px 10px !important;
      gap: 8px !important;
      margin-top: 0 !important;
    }

    .auth-box { padding: 14px; margin-top: 0 !important; }
    .role-list { gap: 8px !important; margin-bottom: 12px !important; }
    .role-item { padding: 10px 12px !important; }

    .auth-login-panel .auth-box {
      position: static !important;
    }
  }

  /* Tablet portrait */
  @media (min-width: 600px) and (max-width: 1024px) {
    .brand-logo-img {
      width: clamp(140px, 24vw, 180px);
      height: clamp(140px, 24vw, 180px);
    }
    .auth-nav { padding: 22px 14px 14px; }
    .auth-top-switch-wrap { padding: 18px 14px 12px !important; }
  }

  /* Small phones */
  @media (max-width: 380px) {
    .brand-logo-img {
      width: 110px;
      height: 110px;
    }
    .auth-nav { padding: 12px 10px 8px; }
    .auth-top-switch-wrap { padding: 12px 10px 6px !important; }
  }

  /* ===== APK overflow safety net (login + register cards going off-screen) ===== */
  html, body {
    overflow-x: hidden !important;
    max-width: 100% !important;
  }
  .auth-wrapper {
    overflow-x: hidden !important;
    max-width: 100% !important;
    width: 100% !important;
  }
  .auth-container,
  .auth-box,
  .auth-login-panel,
  .auth-register-panel,
  .auth-login-panel > *,
  .auth-register-panel > *,
  .role-list,
  .role-item,
  .form-grid,
  .form-group,
  .form-control,
  .pw-wrapper,
  .btn {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  .form-control { width: 100% !important; min-width: 0 !important; }

  /* Force single-column form grid on phones (was 600px in base CSS, too tight) */
  @media (max-width: 760px) {
    .form-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
    .auth-container {
      max-width: 100% !important;
      padding: 4px 10px 14px !important;
      gap: 10px !important;
    }
    .auth-box {
      padding: 16px 14px !important;
      border-radius: 14px !important;
    }
    .auth-box-title { font-size: 1.05rem !important; }
    .auth-box-desc  { font-size: 0.78rem !important; margin-bottom: 12px !important; }
    .role-item { padding: 10px 12px !important; }
    .role-item-title { font-size: 0.92rem !important; }
    .role-item-desc  { font-size: 0.76rem !important; }
    .form-label { font-size: 0.82rem !important; }
    .form-control {
      padding: 11px 13px !important;
      font-size: 0.92rem !important;
    }
    .btn {
      padding: 13px 16px !important;
      font-size: 0.95rem !important;
    }
    .auth-login-panel .auth-box,
    .auth-register-panel .auth-box {
      position: static !important;
      top: auto !important;
    }
  }

  /* Very small phones (<= 380px) — tighten further */
  @media (max-width: 380px) {
    .auth-container { padding: 2px 8px 12px !important; }
    .auth-box { padding: 14px 12px !important; }
    .form-control { padding: 10px 12px !important; font-size: 0.9rem !important; }
    .role-item { padding: 9px 10px !important; }
    .auth-view-switch { width: min(300px, 100%) !important; }
  }
  `;

  if (!authHtml.includes('APK_AUTH_DESIGN_PATCH')) {
    authHtml = authHtml.replace('</style>', `${apkAuthDesignCss}\n</style>`);
  }

  if (!authHtml.includes('id="authModeLogin"')) {
    authHtml = authHtml.replace(
      '<main class="auth-container">',
      `<div class="auth-top-switch-wrap">\n    <div class="auth-view-switch">\n      <button id="authModeLogin" type="button" class="auth-view-btn active" onclick="setAuthPanel('login')">Already Registered</button>\n      <button id="authModeRegister" type="button" class="auth-view-btn" onclick="setAuthPanel('register')">New Registration</button>\n    </div>\n  </div>\n\n  <main class="auth-container">`
    );
  }

  authHtml = authHtml.replace(
    /\s*<a href="\/" class="back-link">[\s\S]*?<\/a>\s*/,
    '\n'
  );

  authHtml = authHtml.replace(
    /<a href="\/" class="brand-logo">[\s\S]*?<\/a>/,
    '<div class="brand-logo" aria-label="Imaan and Akhlaq logo"><img src="./kidba_assets/img/splash_logo.jpg" alt="Imaan and Akhlaq" class="brand-logo-img" /></div>'
  );

  authHtml = authHtml.replace(
    /<img([^>]*?)class="brand-logo-img"([^>]*?)src="\.\/kidba_assets\/img\/[^"]+"([^>]*?)>/,
    '<img$1class="brand-logo-img"$2src="./kidba_assets/img/splash_logo.jpg"$3>'
  );

  authHtml = authHtml.replace(
    /<img([^>]*?)src="\.\/kidba_assets\/img\/[^"]+"([^>]*?)class="brand-logo-img"([^>]*?)>/,
    '<img$1src="./kidba_assets/img/splash_logo.jpg"$2class="brand-logo-img"$3>'
  );

  authHtml = authHtml.replace(
    '<!-- LEFT: Registration Focus -->\n    <section>',
    '<!-- LEFT: Registration Focus -->\n    <section class="auth-register-panel">'
  );

  authHtml = authHtml.replace(
    '<!-- RIGHT: Login Focus -->\n    <aside>',
    '<!-- RIGHT: Login Focus -->\n    <aside class="auth-login-panel">'
  );

  authHtml = authHtml.replace(
    "if (!allowed.some(p => path === p)) {\n          window.location.replace('https://localhost/auth');\n        }",
    "var isAllowed = false;\n        for (var i = 0; i < allowed.length; i++) {\n          if (path === allowed[i]) {\n            isAllowed = true;\n            break;\n          }\n        }\n        if (!isAllowed) {\n          window.location.replace('https://localhost/auth');\n        }"
  );

  authHtml = authHtml.replace(
    /\s*<!-- Capacitor Mobile App: always redirect to Auth on public pages -->\s*<script>[\s\S]*?<\/script>\s*/,
    '\n'
  );

  if (!authHtml.includes('window.setAuthPanel = function (mode) {')) {
    authHtml = authHtml.replace(
      '<script type="module">',
      `<script>\n  window.setAuthPanel = function (mode) {\n    var wrapper = document.querySelector('.auth-wrapper');\n    var loginBtn = document.getElementById('authModeLogin');\n    var registerBtn = document.getElementById('authModeRegister');\n    if (!wrapper || !loginBtn || !registerBtn) return;\n\n    var isRegister = mode === 'register';\n    if (isRegister) {\n      wrapper.classList.add('mode-register');\n      wrapper.classList.remove('mode-login');\n      registerBtn.classList.add('active');\n      loginBtn.classList.remove('active');\n    } else {\n      wrapper.classList.add('mode-login');\n      wrapper.classList.remove('mode-register');\n      loginBtn.classList.add('active');\n      registerBtn.classList.remove('active');\n    }\n  };\n\n  document.addEventListener('DOMContentLoaded', function () {\n    window.setAuthPanel('login');\n  });\n</script>\n\n<script>\n  (function () {\n    if (window.__apkLegacyAuthInit) return;\n    window.__apkLegacyAuthInit = true;\n\n    var FIREBASE_API_KEY = '${legacyApiKey}';\n    var FIREBASE_PROJECT_ID = '${legacyProjectId}';\n\n    function showLegacyToast(message, type) {\n      var toast = document.getElementById('authToast');\n      if (!toast) {\n        alert(message);\n        return;\n      }\n      toast.textContent = message;\n      toast.className = 'toast show ' + (type || 'error');\n      setTimeout(function () {\n        toast.className = 'toast';\n      }, 2500);\n    }\n\n    function showToastCompat(message, type) {\n      if (typeof window.showToast === 'function') {\n        try {\n          window.showToast(message, type);\n          return;\n        } catch (e) {}\n      }\n      showLegacyToast(message, type);\n    }\n\n    function normalizePhone(value) {\n      return String(value || '').replace(/[\\s\\-()]/g, '');\n    }\n\n    function decodeFsValue(value) {\n      if (!value) return null;\n      if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;\n      if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);\n      if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);\n      if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return !!value.booleanValue;\n      if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;\n      if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;\n      return null;\n    }\n\n    function decodeFsFields(fields) {\n      var out = {};\n      if (!fields) return out;\n      for (var key in fields) {\n        if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;\n        out[key] = decodeFsValue(fields[key]);\n      }\n      return out;\n    }\n\n    function mapAuthError(message) {\n      if (!message) return 'Login failed. Please retry.';\n      if (message === 'INVALID_LOGIN_CREDENTIALS') return 'Invalid email or password.';\n      if (message === 'INVALID_PASSWORD') return 'Invalid password.';\n      if (message === 'EMAIL_NOT_FOUND') return 'Email not found.';\n      if (message === 'USER_DISABLED') return 'This account is disabled.';\n      if (message === 'TOO_MANY_ATTEMPTS_TRY_LATER') return 'Too many attempts. Try later.';\n      return message;\n    }\n\n    function xhrJson(method, url, body, headers, cb) {\n      var req = new XMLHttpRequest();\n      req.open(method, url, true);\n      req.setRequestHeader('Content-Type', 'application/json');\n      if (headers) {\n        for (var key in headers) {\n          if (Object.prototype.hasOwnProperty.call(headers, key)) {\n            req.setRequestHeader(key, headers[key]);\n          }\n        }\n      }\n\n      req.onreadystatechange = function () {\n        if (req.readyState !== 4) return;\n\n        var parsed = null;\n        try {\n          parsed = req.responseText ? JSON.parse(req.responseText) : {};\n        } catch (e) {\n          parsed = {};\n        }\n\n        if (req.status >= 200 && req.status < 300) cb(null, parsed);\n        else cb(parsed || { error: { message: 'HTTP_' + req.status } }, null);\n      };\n\n      req.onerror = function () {\n        cb({ error: { message: 'NETWORK_ERROR' } }, null);\n      };\n\n      req.send(body ? JSON.stringify(body) : null);\n    }\n\n    function lookupEmailByPhone(phone, done) {\n      var candidates = [phone];\n      if (phone.charAt(0) === '+') candidates.push(phone.slice(1));\n      else candidates.push('+' + phone);\n\n      var index = 0;\n      function next() {\n        if (index >= candidates.length) {\n          done('');\n          return;\n        }\n\n        var candidate = candidates[index++];\n        var queryUrl = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID + '/databases/(default)/documents:runQuery?key=' + FIREBASE_API_KEY;\n        var queryBody = {\n          structuredQuery: {\n            from: [{ collectionId: 'users' }],\n            where: {\n              fieldFilter: {\n                field: { fieldPath: 'phone' },\n                op: 'EQUAL',\n                value: { stringValue: candidate }\n              }\n            },\n            limit: 1\n          }\n        };\n\n        xhrJson('POST', queryUrl, queryBody, null, function (err, data) {\n          if (err || !data || !data.length || !data[0].document || !data[0].document.fields) {\n            next();\n            return;\n          }\n\n          var userFields = decodeFsFields(data[0].document.fields);\n          done(userFields.email || '');\n        });\n      }\n\n      next();\n    }\n\n    function fetchUserDoc(uid, idToken, cb) {\n      var docUrl = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID + '/databases/(default)/documents/users/' + encodeURIComponent(uid) + '?key=' + FIREBASE_API_KEY;\n      xhrJson('GET', docUrl, null, { Authorization: 'Bearer ' + idToken }, function (err, data) {\n        if (err || !data || !data.fields) {\n          cb(new Error('User record not found in system.'), null);\n          return;\n        }\n        cb(null, decodeFsFields(data.fields));\n      });\n    }\n\n    function saveAuthAndRedirect(uid, userData) {\n      var payload = { uid: uid };\n      for (var key in userData) {\n        if (Object.prototype.hasOwnProperty.call(userData, key)) payload[key] = userData[key];\n      }\n\n      var authData = JSON.stringify(payload);\n      localStorage.setItem('auth_user', authData);\n      sessionStorage.setItem('auth_user', authData);\n\n      showToastCompat('Success! Redirecting...', 'success');\n      setTimeout(function () {\n        if (userData.role === 'school_admin') window.location.href = './admin-dashboard.html';\n        else if (userData.role === 'teacher') window.location.href = './teacher-dashboard.html';\n        else if (userData.role === 'student' || userData.role === 'individual') window.location.href = './student-activities.html';\n        else if (userData.role === 'parent') window.location.href = './parent-dashboard.html';\n        else showToastCompat('User role not configured.', 'error');\n      }, 700);\n    }\n\n    function signInWithEmail(email, password, onDone, onError) {\n      var authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY;\n      var authBody = { email: email, password: password, returnSecureToken: true };\n\n      xhrJson('POST', authUrl, authBody, null, function (err, data) {\n        if (err || !data || !data.localId || !data.idToken) {\n          var code = err && err.error && err.error.message ? err.error.message : 'LOGIN_FAILED';\n          onError(mapAuthError(code));\n          return;\n        }\n        onDone(data.localId, data.idToken);\n      });\n    }\n\n    window.togglePw = function (id) {\n      var inp = document.getElementById(id);\n      if (!inp) return;\n\n      var btn = inp.nextElementSibling;\n      var icon = null;\n      if (btn && btn.querySelector) icon = btn.querySelector('i');\n      if (!icon && inp.parentElement && inp.parentElement.querySelector) icon = inp.parentElement.querySelector('.pw-toggle i');\n\n      if (inp.type === 'password') {\n        inp.type = 'text';\n        if (icon) icon.className = 'fas fa-eye-slash';\n      } else {\n        inp.type = 'password';\n        if (icon) icon.className = 'fas fa-eye';\n      }\n    };\n\n    window.selectRole = function (role) {\n      if (typeof window.setAuthPanel === 'function') window.setAuthPanel('register');\n\n      var cards = document.querySelectorAll('.role-item');\n      for (var i = 0; i < cards.length; i++) cards[i].classList.remove('active');\n\n      var forms = document.querySelectorAll('.reg-form-wrapper');\n      for (var j = 0; j < forms.length; j++) forms[j].classList.remove('open');\n\n      var targetCard = document.querySelector('.role-item-' + role);\n      if (targetCard) targetCard.classList.add('active');\n\n      var targetForm = document.getElementById('form-' + role);\n      if (targetForm) {\n        targetForm.classList.add('open');\n        if (targetForm.scrollIntoView) targetForm.scrollIntoView();\n      }\n    };\n\n    window.closeSuccess = function () {\n      var overlay = document.getElementById('successOverlay');\n      if (overlay) overlay.classList.remove('show');\n    };\n\n    window.loginUser = function () {\n      var loginIdEl = document.getElementById('loginId');\n      var loginPwEl = document.getElementById('loginPw');\n      if (!loginIdEl || !loginPwEl) return;\n\n      var rawId = String(loginIdEl.value || '').trim();\n      var pw = loginPwEl.value;\n      if (!rawId || !pw) {\n        showToastCompat('Enter email and password', 'error');\n        return;\n      }\n\n      showToastCompat('Logging in...', 'success');\n\n      function completeLogin(uid, idToken) {\n        fetchUserDoc(uid, idToken, function (err, userData) {\n          if (err) {\n            showToastCompat(err.message || 'User record not found in system.', 'error');\n            return;\n          }\n          saveAuthAndRedirect(uid, userData || {});\n        });\n      }\n\n      if (rawId.indexOf('@') !== -1) {\n        signInWithEmail(rawId, pw, completeLogin, function (msg) {\n          showToastCompat(msg, 'error');\n        });\n        return;\n      }\n\n      var normalizedPhone = normalizePhone(rawId);\n      lookupEmailByPhone(normalizedPhone, function (email) {\n        if (!email) {\n          showToastCompat('No account found for this phone number. Try email login.', 'error');\n          return;\n        }\n        signInWithEmail(email, pw, completeLogin, function (msg) {\n          showToastCompat(msg, 'error');\n        });\n      });\n    };\n  })();\n</script>\n\n<script type="module">`
    );
  }

  authHtml = authHtml.replace(
    'import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";',
    'import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";'
  );

  authHtml = authHtml.replace(
    /window\.togglePw = \(id\) => \{[\s\S]*?\n  \};/,
    `window.togglePw = (id) => {
    const inp = document.getElementById(id);
    if (!inp) return;

    const btn = inp.nextElementSibling;
    const icon = (btn && btn.querySelector('i')) || inp.parentElement.querySelector('.pw-toggle i');

    if (inp.type === 'password') {
      inp.type = 'text';
      if (icon) icon.className = 'fas fa-eye-slash';
    } else {
      inp.type = 'password';
      if (icon) icon.className = 'fas fa-eye';
    }
  };`
  );

  authHtml = authHtml.replace(
    /window\.loginUser = async \(\) => \{[\s\S]*?\n  \};/,
    `window.loginUser = async () => {
    const rawId = document.getElementById('loginId').value.trim();
    const id = rawId.replace(/[\\s\\-()]/g, '');
    const pw = document.getElementById('loginPw').value;
    if (!id || !pw) return showToast('Enter email and password', 'error');

    try {
      showToast('Logging in...', 'success');

      let emailToUse = id;
      if (!id.includes('@')) {
        const phoneCandidates = [id, id.startsWith('+') ? id.slice(1) : '+' + id];
        let matchedEmail = '';

        for (const phone of phoneCandidates) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('phone', '==', phone));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            if (data && data.email) {
              matchedEmail = data.email;
              break;
            }
          }
        }

        if (!matchedEmail) {
          return showToast('No account found for this phone number', 'error');
        }
        emailToUse = matchedEmail;
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pw);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const authData = JSON.stringify({ uid: user.uid, ...userData });
        localStorage.setItem('auth_user', authData);
        sessionStorage.setItem('auth_user', authData);

        showToast('Success! Redirecting...', 'success');
        setTimeout(() => {
          if (userData.role === 'school_admin') window.location.href = './admin-dashboard.html';
          else if (userData.role === 'teacher') window.location.href = './teacher-dashboard.html';
          else if (userData.role === 'student' || userData.role === 'individual') window.location.href = './student-activities.html';
          else if (userData.role === 'parent') window.location.href = './parent-dashboard.html';
        }, 1000);
      } else {
        showToast('User record not found in system.', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };`
  );

  authHtml = authHtml.replace(
    /id="loginPw"([^>]*?)placeholder="[^"]*"/,
    'id="loginPw"$1placeholder="Enter your password"'
  );

  authHtml = authHtml.replace(
    'window.selectRole = (role) => {\n    document.querySelectorAll',
    `window.selectRole = (role) => {\n    if (typeof window.setAuthPanel === 'function') window.setAuthPanel('register');\n    document.querySelectorAll`
  );

  authHtml = authHtml.replace(/<button class="pw-toggle"/g, '<button type="button" class="pw-toggle"');

  fs.writeFileSync(authPath, authHtml, 'utf8');
  console.log('APK auth.html patched for design + login + password visibility.');
}

// APK-only: compact, professional layout for the student dashboard
// (`dist/student-activities.html`). Hides decorative 3D icons, long
// descriptions, and oversized cards; converts the institute sidebar into a
// horizontal pill nav and makes the 3 stat cards a single compact row so the
// essentials fit above the fold on a phone screen. Website build is untouched.
function buildCompactDashboardCss(pageSelector, marker) {
  return `

  /* ${marker} */
  /* APK_DASHBOARD_OVERFLOW_GUARD - prevent any dashboard from horizontal-scrolling */
  html, body { max-width: 100% !important; overflow-x: hidden !important; }
  /* Hard body-level guard (in case page-specific selector isn't applied) */
  body .dashboard-shell,
  body .dashboard-main,
  body .workspace-bar,
  body .summary-strip,
  body .surface-card { max-width: 100% !important; min-width: 0 !important; box-sizing: border-box !important; }
  body .workspace-bar,
  body .summary-strip { overflow: hidden !important; }
  body .workspace-bar > *,
  body .summary-strip > *,
  body .surface-card > * { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
  ${pageSelector} { max-width: 100% !important; overflow-x: hidden !important; }
  /* HARD CAP: force every dashboard descendant to stay inside viewport */
  ${pageSelector} *,
  ${pageSelector} *::before,
  ${pageSelector} *::after {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  ${pageSelector} .dashboard-shell,
  ${pageSelector} .dashboard-main,
  ${pageSelector} .surface-card,
  ${pageSelector} .workspace-bar,
  ${pageSelector} .summary-strip,
  ${pageSelector} .student-grid,
  ${pageSelector} .teacher-grid,
  ${pageSelector} .parent-grid,
  ${pageSelector} .admin-grid {
    min-width: 0 !important;
  }
  /* Defang any inline width / min-width that explicitly exceed viewport */
  ${pageSelector} [style*="min-width"] { min-width: 0 !important; }
  /* Stop flex/grid children from forcing parent to expand */
  ${pageSelector} .dashboard-main > *,
  ${pageSelector} .dashboard-shell > *,
  ${pageSelector} .surface-card > *,
  ${pageSelector} .workspace-bar > *,
  ${pageSelector} .workspace-actions > *,
  ${pageSelector} .summary-strip > *,
  ${pageSelector} .student-grid > *,
  ${pageSelector} .teacher-grid > *,
  ${pageSelector} .parent-grid > *,
  ${pageSelector} .admin-grid > * {
    min-width: 0 !important;
    max-width: 100% !important;
  }
  ${pageSelector} .dashboard-shell {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow-x: hidden !important;
  }
  ${pageSelector} .dashboard-main {
    min-width: 0 !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  ${pageSelector} img,
  ${pageSelector} video,
  ${pageSelector} iframe,
  ${pageSelector} table { max-width: 100% !important; height: auto; }
  /* Tracks with hard min-widths can push grids past viewport \u2014 normalize on mobile */
  @media (max-width: 1024px) {
    ${pageSelector} .student-grid,
    ${pageSelector} .teacher-grid,
    ${pageSelector} .parent-grid,
    ${pageSelector} .admin-grid,
    ${pageSelector} .summary-strip { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 1024px) {
    ${pageSelector} { padding: 0.5rem !important; }
    ${pageSelector} .dashboard-shell { gap: 0.5rem !important; padding: 0 !important; }

    /* Sidebar -> compact top strip */
    ${pageSelector} .sidebar-panel {
      padding: 0.55rem 0.65rem !important;
      border-radius: 14px !important;
      gap: 0.4rem !important;
      flex-direction: column !important;
      align-items: stretch !important;
    }
    ${pageSelector} .sidebar-brand {
      flex-direction: row !important;
      align-items: center !important;
      gap: 0.5rem !important;
      text-align: left !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      flex: 0 0 auto !important;
    }
    ${pageSelector} .sidebar-brand-art {
      width: 34px !important;
      height: 34px !important;
      flex: 0 0 34px !important;
      margin: 0 !important;
    }
    ${pageSelector} .sidebar-brand-art .sidebar-cam-badge { display: none !important; }
    ${pageSelector} .sidebar-title { font-size: 0.9rem !important; line-height: 1.1 !important; }
    ${pageSelector} .sidebar-subtitle,
    ${pageSelector} .sidebar-kicker { font-size: 0.65rem !important; line-height: 1.15 !important; margin: 0 !important; }

    ${pageSelector} .sidebar-nav {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.3rem !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${pageSelector} .sidebar-nav li {
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 0.2rem !important;
      padding: 0.4rem 0.3rem !important;
      font-size: 0.62rem !important;
      text-align: center !important;
      min-height: 0 !important;
      border-radius: 10px !important;
    }
    ${pageSelector} .sidebar-nav li span:not(.nav-badge) { font-size: 0.62rem !important; line-height: 1 !important; }
    ${pageSelector} .sidebar-nav .nav-badge {
      width: 22px !important;
      height: 22px !important;
      flex: 0 0 22px !important;
      font-size: 0.65rem !important;
      border-radius: 7px !important;
    }
    ${pageSelector} .sidebar-note { display: none !important; }

    /* Highlighted logout button */
    ${pageSelector} .sidebar-logout-btn {
      background: linear-gradient(180deg, #e85a4f 0%, #d63678 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255,255,255,0.28) !important;
      box-shadow: 0 8px 18px rgba(214,54,120,0.38) !important;
      font-weight: 800 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      padding: 0.45rem 0.6rem !important;
      font-size: 0.72rem !important;
      margin: 0 !important;
      min-height: 0 !important;
      border-radius: 10px !important;
    }
    ${pageSelector} .sidebar-logout-btn i { color: #ffffff !important; }

    /* Workspace bar (school) */
    ${pageSelector} .workspace-bar {
      padding: 0.55rem 0.7rem !important;
      gap: 0.5rem !important;
      border-radius: 14px !important;
      flex-wrap: wrap !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
    }
    ${pageSelector} .workspace-bar > * { min-width: 0 !important; max-width: 100% !important; }
    ${pageSelector} .workspace-heading { gap: 0.5rem !important; min-width: 0 !important; flex: 1 1 100% !important; }
    ${pageSelector} .workspace-profile-card,
    ${pageSelector} .workspace-actions { min-width: 0 !important; max-width: 100% !important; flex-wrap: wrap !important; }
    ${pageSelector} .workspace-art {
      width: 40px !important;
      height: 40px !important;
      flex: 0 0 40px !important;
    }
    ${pageSelector} .workspace-art .school-cam-badge { display: none !important; }
    ${pageSelector} .workspace-title {
      font-size: 1rem !important;
      line-height: 1.1 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
    ${pageSelector} .workspace-subtitle {
      font-size: 0.7rem !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
    ${pageSelector} .workspace-actions .dashboard-home-btn,
    ${pageSelector} .workspace-actions .dashboard-ghost-btn,
    ${pageSelector} .workspace-actions .profile-manage-btn {
      padding: 0.45rem 0.7rem !important;
      font-size: 0.72rem !important;
      white-space: nowrap !important;
    }

    /* Summary strip -> compact 3-column row */
    ${pageSelector} .summary-strip {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.4rem !important;
      margin: 0 !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    ${pageSelector} .summary-card {
      padding: 0.55rem 0.35rem !important;
      min-height: 0 !important;
      min-width: 0 !important;
      border-radius: 12px !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 0.15rem !important;
      text-align: center !important;
      overflow: hidden !important;
    }
    ${pageSelector} .summary-card img { display: none !important; }
    ${pageSelector} .summary-copy { gap: 0.1rem !important; align-items: center !important; text-align: center !important; min-width: 0 !important; }
    ${pageSelector} .summary-label {
      font-size: 0.55rem !important;
      letter-spacing: 0.02em !important;
      white-space: normal !important;
      line-height: 1.1 !important;
      overflow-wrap: anywhere !important;
    }
    ${pageSelector} .summary-value { font-size: 1.35rem !important; line-height: 1 !important; }
    ${pageSelector} .summary-meta { display: none !important; }

    /* Surface cards */
    ${pageSelector} .surface-card { padding: 0.7rem !important; border-radius: 14px !important; min-width: 0 !important; max-width: 100% !important; overflow: hidden !important; }
    ${pageSelector} .student-grid,
    ${pageSelector} .teacher-tab-panels { gap: 0.5rem !important; min-width: 0 !important; }

    /* Section headers */
    ${pageSelector} .section-asset { display: none !important; }
    ${pageSelector} .section-heading { min-width: 0 !important; flex: 1 1 auto !important; }
    ${pageSelector} .section-heading p { display: none !important; }
    ${pageSelector} .section-heading h3 { font-size: 0.95rem !important; margin: 0 !important; overflow-wrap: anywhere !important; }
    ${pageSelector} .section-header {
      padding-bottom: 0.4rem !important;
      margin-bottom: 0.5rem !important;
      gap: 0.3rem !important;
      flex-wrap: wrap !important;
      min-width: 0 !important;
    }
    ${pageSelector} .section-chip { font-size: 0.6rem !important; padding: 0.25rem 0.5rem !important; white-space: nowrap !important; max-width: 100% !important; overflow: hidden !important; text-overflow: ellipsis !important; }

    /* Toolbar */
    ${pageSelector} .toolbar-block {
      padding: 0.55rem 0.65rem !important;
      gap: 0.3rem !important;
      margin-bottom: 0.5rem !important;
    }
    ${pageSelector} .toolbar-info h3 { font-size: 0.95rem !important; margin: 0 !important; }
    ${pageSelector} .toolbar-info p { font-size: 0.7rem !important; margin: 0 !important; }
    ${pageSelector} .dashboard-ghost-btn {
      padding: 0.4rem 0.7rem !important;
      font-size: 0.72rem !important;
    }

    /* Generic snapshot/list items used across teacher + parent */
    ${pageSelector} .snapshot-list { gap: 0.4rem !important; }
    ${pageSelector} .snapshot-item { padding: 0.5rem 0.6rem !important; gap: 0.5rem !important; }

    /* Teacher: students roster */
    ${pageSelector} .student-roster-group { padding: 0.5rem !important; gap: 0.4rem !important; }
    ${pageSelector} .student-roster-group-title { font-size: 0.72rem !important; }
    ${pageSelector} .student-roster-item { padding: 0.55rem !important; gap: 0.5rem !important; flex-wrap: wrap !important; }
    ${pageSelector} .student-roster-photo { width: 38px !important; height: 38px !important; flex: 0 0 38px !important; }
    ${pageSelector} .student-roster-meta { gap: 0.3rem !important; flex-wrap: wrap !important; }
    ${pageSelector} .attendance-pill { font-size: 0.6rem !important; padding: 0.2rem 0.45rem !important; }
    ${pageSelector} .quick-link-action,
    ${pageSelector} .btn-approve,
    ${pageSelector} .student-roster-actions button {
      padding: 0.35rem 0.6rem !important;
      font-size: 0.68rem !important;
      border-radius: 8px !important;
    }

    /* Teacher/Parent: review items */
    ${pageSelector} .review-item { padding: 0.6rem !important; gap: 0.45rem !important; }
    ${pageSelector} .student-discussion-text { font-size: 0.72rem !important; line-height: 1.3 !important; }

    /* Teacher: leaderboard */
    ${pageSelector} .leaderboard-card { padding: 0.6rem !important; }
    ${pageSelector} .student-rank-item { padding: 0.5rem 0.6rem !important; gap: 0.5rem !important; }
    ${pageSelector} .rank-badge { width: 28px !important; height: 28px !important; flex: 0 0 28px !important; font-size: 0.75rem !important; }
    ${pageSelector} .student-avatar { width: 36px !important; height: 36px !important; flex: 0 0 36px !important; }
    ${pageSelector} .student-score { font-size: 0.85rem !important; }

    /* Teacher: books grid */
    ${pageSelector} .books-grid { gap: 0.55rem !important; }
    ${pageSelector} .book-card { padding: 0.55rem !important; border-radius: 12px !important; }
    ${pageSelector} .book-card-cover { aspect-ratio: 4 / 3 !important; border-radius: 8px !important; }
    ${pageSelector} .book-card-info h4 { font-size: 0.78rem !important; }
    ${pageSelector} .book-card-info p { font-size: 0.66rem !important; }
    ${pageSelector} .book-card-btn { padding: 0.4rem 0.6rem !important; font-size: 0.7rem !important; }

    /* Parent: link/family cards generic */
    ${pageSelector} .link-student-card,
    ${pageSelector} .action-queue-card { padding: 0.7rem !important; }
  }
  `;
}

function patchApkDashboardCompact(fileName, marker, pageSelector, extraBodyScript) {
  const filePath = path.join(distDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn('APK dashboard not found:', fileName);
    return false;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(marker)) {
    console.log('APK dashboard already patched, skipping:', fileName);
    return false;
  }
  const css = buildCompactDashboardCss(pageSelector, marker);
  html = html.replace('</style>', `${css}\n</style>`);
  if (extraBodyScript) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${extraBodyScript}\n</body>`);
    } else {
      html = html + extraBodyScript;
    }
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('APK compact layout patched:', fileName);
  return true;
}

// APK-only fix: teacher-dashboard.html and parent-dashboard.html JS reference
// several DOM ids that don't exist in the rendered HTML (e.g. `schoolNameTag`,
// `classInfo`, `welcomeName`, `teacherInfo`). The first
// `document.getElementById(...).innerHTML = ...` throws
// `Cannot set properties of null` and aborts initDashboard() before the
// students/child query runs - which is why the dashboards show 0 data and
// "Loading..." snapshots even when the school/student is correctly linked.
// We inject hidden placeholder spans so the existing JS finds non-null
// elements and can finish loading. Website build is untouched.
function buildMissingIdShim(marker, ids) {
  return `
<!-- ${marker} -->
<script>
(function(){
  var key = '__apkShim_' + ${JSON.stringify(marker)};
  if (window[key]) return;
  window[key] = true;
  var ids = ${JSON.stringify(ids)};
  function ensure(id){
    if (document.getElementById(id)) return;
    var s = document.createElement('span');
    s.id = id;
    s.style.display = 'none';
    s.setAttribute('data-apk-shim', '1');
    document.body.appendChild(s);
  }
  function run(){ ids.forEach(ensure); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
</script>
`;
}

const TEACHER_MISSING_ID_SHIM = buildMissingIdShim(
  'APK_TEACHER_MISSING_ID_SHIM',
  ['schoolNameTag','classInfo']
);

const PARENT_MISSING_ID_SHIM = buildMissingIdShim(
  'APK_PARENT_MISSING_ID_SHIM',
  ['welcomeName','schoolNameTag','teacherInfo','classInfo']
);

const ADMIN_MISSING_ID_SHIM = buildMissingIdShim(
  'APK_ADMIN_MISSING_ID_SHIM',
  ['schoolLogoImg','workspaceSchoolName']
);

// APK-only: compact, professional layout for the school admin dashboard
// (`dist/admin-dashboard.html`). Admin uses a different DOM (`.top-nav`,
// `.nav-links`, `.tab-panel`, `.section-asset`, `.widget-asset`,
// `.summary-card-illustration`) than student/teacher/parent, so it gets a
// dedicated CSS pass instead of the shared `buildCompactDashboardCss`. We:
//  - hide repeating decorative 3D icons (section-asset, widget-asset,
//    summary-card-illustration) - same image was used in 6+ places
//  - stack top-nav vertically and convert nav-links into a 5-column pill row
//  - hide redundant nav-profile chip (brand already shows admin name)
//  - hide the workspace search/notification/admin chip duplicate strip
//  - compact section headers (drop subtitles) and summary cards
//  - highlight the logout button (red-pink) like other dashboards
function patchApkAdminDashboard() {
  const fileName = 'admin-dashboard.html';
  const marker = 'APK_ADMIN_DASHBOARD_COMPACT';
  const filePath = path.join(distDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn('APK admin dashboard not found:', fileName);
    return false;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(marker)) {
    console.log('APK admin dashboard already patched, skipping.');
    return false;
  }

  const css = `

  /* ${marker} */
  /* APK_DASHBOARD_OVERFLOW_GUARD */
  html, body { max-width: 100% !important; overflow-x: hidden !important; }
  .admin-page { max-width: 100% !important; overflow-x: hidden !important; }
  .admin-page .app-container,
  .admin-page .top-nav,
  .admin-page .workspace-topbar { min-width: 0 !important; max-width: 100% !important; }
  .admin-page img,
  .admin-page video,
  .admin-page iframe,
  .admin-page table { max-width: 100% !important; height: auto; }

  @media (max-width: 1024px) {
    .admin-page { padding: 0.5rem !important; }
    .admin-page .app-container { gap: 0.5rem !important; padding: 0 !important; }

    /* Top nav -> stacked compact strip */
    .admin-page .top-nav {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 0.4rem !important;
      padding: 0.55rem 0.65rem !important;
      border-radius: 14px !important;
    }
    .admin-page .nav-brand {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 0.5rem !important;
      width: 100% !important;
    }
    .admin-page .brand-mark {
      width: 36px !important;
      height: 36px !important;
      flex: 0 0 36px !important;
    }
    .admin-page .brand-mark .sidebar-cam-badge { display: none !important; }
    .admin-page .brand-title { font-size: 0.9rem !important; line-height: 1.1 !important; }
    .admin-page .brand-copy span:not(.brand-title) { font-size: 0.65rem !important; }

    /* Nav links -> 5-column pill row */
    .admin-page .nav-center { width: 100% !important; }
    .admin-page .nav-links {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      gap: 0.25rem !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }
    .admin-page .nav-links li {
      padding: 0.4rem 0.2rem !important;
      font-size: 0.6rem !important;
      text-align: center !important;
      border-radius: 9px !important;
      line-height: 1.1 !important;
      min-height: 0 !important;
      cursor: pointer !important;
    }

    /* Remove redundant duplicate admin chip in nav-actions and workspace bar */
    .admin-page .nav-actions .nav-profile { display: none !important; }
    .admin-page .workspace-topbar { padding: 0 !important; margin: 0 !important; }
    .admin-page .workspace-tools { gap: 0.4rem !important; }
    .admin-page .workspace-admin-chip { display: none !important; }
    .admin-page .workspace-tool {
      padding: 0.4rem 0.55rem !important;
      font-size: 0.75rem !important;
    }

    /* Nav action buttons */
    .admin-page .nav-actions {
      display: flex !important;
      flex-direction: row !important;
      gap: 0.35rem !important;
      width: 100% !important;
    }
    .admin-page .nav-actions .btn-home-nav,
    .admin-page .nav-actions .btn-logout {
      flex: 1 1 0 !important;
      padding: 0.45rem 0.5rem !important;
      font-size: 0.7rem !important;
      border-radius: 10px !important;
      min-height: 0 !important;
      justify-content: center !important;
    }

    /* Highlighted logout (red-pink) */
    .admin-page .nav-actions .btn-logout {
      background: linear-gradient(180deg, #e85a4f 0%, #d63678 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255,255,255,0.28) !important;
      box-shadow: 0 8px 18px rgba(214,54,120,0.38) !important;
      font-weight: 800 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
    }
    .admin-page .nav-actions .btn-logout i { color: #ffffff !important; }

    /* Hide repeating 3D decorative images everywhere on admin */
    .admin-page .section-asset { display: none !important; }
    .admin-page .widget-asset { display: none !important; }
    .admin-page .summary-card-illustration { display: none !important; }
    .admin-page .section-shell { gap: 0.4rem !important; }

    /* Compact section headers */
    .admin-page .section-header {
      padding: 0.6rem 0.7rem !important;
      gap: 0.4rem !important;
      flex-wrap: wrap !important;
      margin-bottom: 0.5rem !important;
    }
    .admin-page .section-eyebrow { font-size: 0.6rem !important; padding: 0.2rem 0.45rem !important; }
    .admin-page .section-title { font-size: 1rem !important; line-height: 1.15 !important; margin: 0 !important; }
    .admin-page .section-subtitle { display: none !important; }
    .admin-page .section-actions { gap: 0.3rem !important; flex-wrap: wrap !important; }
    .admin-page .class-filter-wrap { gap: 0.25rem !important; }
    .admin-page .class-filter-label { font-size: 0.6rem !important; }
    .admin-page .class-filter-select { padding: 0.35rem 0.5rem !important; font-size: 0.72rem !important; }
    .admin-page .filter-summary { font-size: 0.62rem !important; }

    /* Tab panels */
    .admin-page .tab-panel { padding: 0 !important; }
    .admin-page .surface-card,
    .admin-page .erp-card,
    .admin-page .panel-card {
      padding: 0.7rem !important;
      border-radius: 14px !important;
      margin-bottom: 0.5rem !important;
    }

    /* Summary cards -> 2-column compact grid */
    .admin-page .summary-card {
      padding: 0.55rem !important;
      min-height: 0 !important;
      border-radius: 12px !important;
      gap: 0.25rem !important;
    }
    .admin-page .summary-card .summary-card-meta { font-size: 0.6rem !important; }
    .admin-page .summary-card .summary-card-value,
    .admin-page .summary-card .summary-value { font-size: 1.3rem !important; line-height: 1 !important; }
    .admin-page .summary-card .summary-card-label,
    .admin-page .summary-card .summary-label { font-size: 0.6rem !important; letter-spacing: 0.04em !important; }

    /* Class chips */
    .admin-page .class-chip {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.65rem !important;
      border-radius: 8px !important;
    }

    /* Forms inside modals */
    .admin-page .form-group { margin-bottom: 0.5rem !important; gap: 0.25rem !important; }
    .admin-page .form-input,
    .admin-page .form-select {
      padding: 0.45rem 0.6rem !important;
      font-size: 0.8rem !important;
      border-radius: 10px !important;
    }
    .admin-page .modal-content {
      padding: 0.9rem !important;
      border-radius: 16px !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
    }

    /* Tables compact */
    .admin-page table { font-size: 0.72rem !important; }
    .admin-page th, .admin-page td { padding: 0.4rem 0.5rem !important; }

    /* === Overview tab cleanup === */
    /* Hide the redundant hero-main-card: profile pic is already shown in
       top-nav, "All Classes" is already in the filter dropdown above, and
       teacher/student counts appear in the metric cards just below. */
    .admin-page .hero-main-card { display: none !important; }

    /* Compact 3 oversized metric cards (Teachers / Students / Pending Invites)
       into a single tight 3-column row, no decorative illustrations. */
    .admin-page .hero-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.4rem !important;
      margin: 0 0 0.5rem 0 !important;
    }
    .admin-page .hero-card.tall-card,
    .admin-page .hero-card.metric-card {
      padding: 0.6rem 0.45rem !important;
      min-height: 0 !important;
      border-radius: 12px !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
      gap: 0.2rem !important;
    }
    .admin-page .metric-card-copy {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 0.2rem !important;
      width: 100% !important;
    }
    .admin-page .metric-illustration { display: none !important; }
    .admin-page .metric-icon {
      width: 28px !important;
      height: 28px !important;
      font-size: 0.85rem !important;
      margin: 0 !important;
    }
    .admin-page .metric-label {
      font-size: 0.62rem !important;
      letter-spacing: 0.04em !important;
      text-transform: uppercase !important;
      margin: 0 !important;
    }
    .admin-page .tall-stat {
      font-size: 1.5rem !important;
      line-height: 1 !important;
      margin: 0 !important;
    }
    .admin-page .metric-meta { display: none !important; }

    /* Lower grid: stack widgets on mobile, drop excessive padding */
    .admin-page .overview-lower-grid {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    .admin-page .panel-stack {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    .admin-page .widget-panel {
      padding: 0.7rem !important;
      border-radius: 14px !important;
    }
    .admin-page .subsection-toolbar,
    .admin-page .widget-heading {
      gap: 0.4rem !important;
      flex-wrap: wrap !important;
    }
    .admin-page .widget-heading strong { font-size: 0.85rem !important; }

    /* Attendance ring (already a graph) - keep but compact */
    .admin-page .attendance-widget { gap: 0.6rem !important; flex-wrap: wrap !important; justify-content: center !important; }
    .admin-page .attendance-ring { width: 110px !important; height: 110px !important; }
    .admin-page .chart-legend { font-size: 0.7rem !important; gap: 0.3rem !important; }

    /* Hide the non-functional layout grid toggle button on mobile */
    .admin-page .layout-toggle { display: none !important; }
    .admin-page .status-pill {
      font-size: 0.6rem !important;
      padding: 0.25rem 0.5rem !important;
      border-radius: 8px !important;
    }
  }
  `;

  html = html.replace('</style>', `${css}\n</style>`);
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${ADMIN_MISSING_ID_SHIM}\n</body>`);
  } else {
    html = html + ADMIN_MISSING_ID_SHIM;
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('APK compact layout patched: admin-dashboard.html');
  return true;
}

// APK-only fix: dist/auth.html's role-based redirect after login only handles
// school_admin / teacher / student / individual / parent. There's no branch
// for `super_admin`, so super admin users get the "User role not configured"
// toast and the super-admin-dashboard never opens. We inject a super_admin
// branch into BOTH redirect blocks (legacy XHR REST flow + Firebase modular
// flow). Website build untouched.
function patchApkAuthSuperAdminRedirect() {
  const filePath = path.join(distDir, 'auth.html');
  if (!fs.existsSync(filePath)) {
    console.warn('APK auth page not found for super_admin redirect.');
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('APK_AUTH_SUPER_ADMIN_REDIRECT')) {
    console.log('APK auth super_admin redirect already patched, skipping.');
    return;
  }
  let count = 0;
  // Insert super_admin branch right before the school_admin one in both
  // redirect blocks. The pattern appears twice (var-style and const-style).
  html = html.replace(
    /if\s*\(\s*userData\.role\s*===\s*['"]school_admin['"]\s*\)\s*window\.location\.href\s*=\s*['"]\.\/admin-dashboard\.html['"]\s*;/g,
    function(match) {
      count++;
      return "if (userData.role === 'super_admin') window.location.href = './super-admin-dashboard.html';\n        else " + match;
    }
  );
  if (count === 0) {
    console.warn('APK auth super_admin redirect: pattern not matched, skipping.');
    return;
  }
  html = html.replace('</body>', '<!-- APK_AUTH_SUPER_ADMIN_REDIRECT --></body>');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('APK auth.html patched for super_admin redirect (' + count + ' insertions).');
}

// APK-only fix: every dist HTML file has a Capacitor route guard with a
// hard-coded `var allowed = [...]` whitelist that does NOT include
// `/super-admin-dashboard`. So when a super_admin lands on
// super-admin-dashboard.html inside the APK, the guard immediately
// `window.location.replace`s back to /auth.html. We append the missing
// route to that array in every dist HTML file. Website build untouched.
function patchApkAllowedRoutes() {
  if (!fs.existsSync(distDir)) return;
  const target = "var allowed = ['/auth', '/student-activities', '/parent-dashboard', '/teacher-dashboard', '/admin-dashboard', '/activity'];";
  const replacement = "var allowed = ['/auth', '/student-activities', '/parent-dashboard', '/teacher-dashboard', '/admin-dashboard', '/super-admin-dashboard', '/activity'];";
  const htmlFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.html'));
  let patched = 0;
  for (const file of htmlFiles) {
    const filePath = path.join(distDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes(target)) continue;
    if (html.includes('/super-admin-dashboard')) continue;
    html = html.replace(target, replacement);
    fs.writeFileSync(filePath, html, 'utf8');
    patched++;
  }
  console.log('APK allowed-routes patch (super-admin): ' + patched + ' files updated.');
}

function patchApkStudentDashboard() {
  const fileName = 'student-activities.html';
  const marker = 'APK_STUDENT_DASHBOARD_COMPACT';
  const studentPath = path.join(distDir, fileName);
  if (!fs.existsSync(studentPath)) {
    console.warn('APK student dashboard not found at dist/' + fileName);
    return;
  }
  let html = fs.readFileSync(studentPath, 'utf8');
  if (html.includes(marker)) {
    console.log('APK student dashboard already patched, skipping.');
    return;
  }

  const compactCss = buildCompactDashboardCss('.student-page', marker);

  const studentExtraCss = `

  /* APK_STUDENT_DASHBOARD_EXTRA */
  @media (max-width: 1024px) {
    /* Book/chapter cards - 2 per row (default; accordion overrides for books view) */
    .student-page .catalog-grid { gap: 0.55rem !important; justify-content: center !important; }
    .student-page .library-item {
      flex: 0 0 calc(50% - 0.4rem) !important;
      min-width: 0 !important;
      max-width: calc(50% - 0.4rem) !important;
      padding: 0.55rem !important;
      border-radius: 12px !important;
    }
    .student-page .library-cover { aspect-ratio: auto !important; border-radius: 12px !important; height: auto !important; overflow: hidden !important; }
    .student-page .library-cover img { width: 100% !important; height: auto !important; object-fit: contain !important; display: block !important; }
    .student-page .library-title { font-size: 0.78rem !important; line-height: 1.2 !important; }
    .student-page .library-subtitle {
      font-size: 0.66rem !important;
      line-height: 1.25 !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }
    .student-page .chapter-order-chip { display: none !important; }
    .student-page .chapter-hero { gap: 0.3rem !important; margin-bottom: 0.3rem !important; }

    /* Redesigned chapter card (mobile) */
    .student-page .chapter-card-row {
      display: flex !important;
      align-items: center !important;
      gap: 0.7rem !important;
      padding: 0.7rem 0.75rem 0.7rem 0.95rem !important;
      width: 100% !important;
      min-width: 0 !important;
    }
    .student-page .chapter-accent {
      width: 4px !important;
      top: 14% !important;
      bottom: 14% !important;
      border-radius: 0 4px 4px 0 !important;
    }
    .student-page .chapter-icon {
      width: 44px !important;
      height: 44px !important;
      flex: 0 0 44px !important;
      font-size: 1.05rem !important;
      border-radius: 12px !important;
    }
    .student-page .chapter-text {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0.15rem !important;
    }
    .student-page .chapter-text .ch-kicker {
      font-size: 0.58rem !important;
      letter-spacing: 0.13em !important;
    }
    .student-page .chapter-text .ch-title {
      font-size: 0.82rem !important;
      line-height: 1.25 !important;
    }
    .student-page .chapter-action {
      flex: 0 0 auto !important;
      max-width: 45% !important;
    }
    .student-page .status-pill {
      font-size: 0.6rem !important;
      padding: 0.25rem 0.5rem !important;
      white-space: nowrap !important;
      max-width: 100% !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .student-page .unlock-btn {
      padding: 0.4rem 0.6rem !important;
      font-size: 0.66rem !important;
      white-space: nowrap !important;
    }
    /* Card itself: full row (override 50% rule above for chapter list view) */
    .student-page .apk-book-row.open .apk-book-panel .library-item,
    .student-page .catalog-grid > .library-item {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      min-height: 0 !important;
    }

    /* Journey list */
    .student-page .journey-stack { gap: 0.35rem !important; }
    .student-page .journey-item { padding: 0.5rem 0.6rem !important; gap: 0.5rem !important; }
    .student-page .journey-icon {
      width: 30px !important;
      height: 30px !important;
      flex: 0 0 30px !important;
      font-size: 0.75rem !important;
    }
    .student-page .journey-copy strong { font-size: 0.75rem !important; }
    .student-page .journey-copy span { font-size: 0.65rem !important; }
    .student-page .journey-value { font-size: 0.85rem !important; }

    /* Book accordion buttons (APK-only) */
    .student-page .apk-book-accordion {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.4rem !important;
    }
    .student-page .apk-book-row { display: block; }
    .student-page .apk-book-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem 0.8rem;
      border-radius: 12px;
      border: 1px solid rgba(30,45,90,0.12);
      background: linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%);
      color: #1E2D5A;
      font-weight: 800;
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(15,23,42,0.05);
      transition: all 0.18s ease;
    }
    .apk-book-btn:active { transform: translateY(1px); }
    .apk-book-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: linear-gradient(180deg, #d63678, #cf296d);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      flex: 0 0 26px;
    }
    .apk-book-label { flex: 1 1 auto; }
    .apk-book-caret {
      color: #94a3b8;
      transition: transform 0.2s ease;
      font-size: 0.8rem;
    }
    .apk-book-row.open .apk-book-caret {
      transform: rotate(180deg);
      color: #ffffff;
    }
    .apk-book-row.open .apk-book-btn {
      background: linear-gradient(180deg, #1E2D5A 0%, #2a3d75 100%);
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 8px 18px rgba(30,45,90,0.25);
    }
    .apk-book-row.open .apk-book-num {
      background: rgba(255,255,255,0.18);
    }
    .apk-book-panel {
      display: none;
      padding: 0.5rem 0.25rem 0.1rem;
    }
    .apk-book-row.open .apk-book-panel { display: block; }
    .apk-book-row.open .apk-book-panel .library-item {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    /* Open accordion: show full natural book cover, no aspect cropping */
    .apk-book-row.open .apk-book-panel .library-cover {
      aspect-ratio: auto !important;
      height: auto !important;
      max-height: none !important;
      border-radius: 14px !important;
      overflow: hidden !important;
    }
    .apk-book-row.open .apk-book-panel .library-cover img {
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      object-fit: contain !important;
      display: block !important;
    }
  }
  `;

  const enhancerScript = `
<script>
(function(){
  if (window.__apkBookAccordionInit) return;
  window.__apkBookAccordionInit = true;

  function isBooksView(root){
    var items = root.querySelectorAll(':scope > .library-item');
    if (!items.length) return false;
    for (var i = 0; i < items.length; i++){
      var img = items[i].querySelector('.library-cover img');
      if (img && /\\/covers\\//.test(img.getAttribute('src') || '')) return true;
    }
    return false;
  }

  function shortLabel(text, idx){
    var t = (text || '').trim();
    var m = t.match(/Book\\s*\\d+/i);
    return m ? m[0] : 'Book ' + (idx + 1);
  }

  function transformBooks(root){
    var items = Array.prototype.slice.call(root.querySelectorAll(':scope > .library-item'));
    if (!items.length) return;
    root.dataset.apkAccordion = '1';
    root.classList.add('apk-book-accordion');

    var frag = document.createDocumentFragment();
    items.forEach(function(card, idx){
      var titleEl = card.querySelector('.library-title');
      var label = shortLabel(titleEl ? titleEl.textContent : '', idx);

      var wrap = document.createElement('div');
      wrap.className = 'apk-book-row';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apk-book-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="apk-book-num">' + (idx + 1) + '</span>'
        + '<span class="apk-book-label">' + label + '</span>'
        + '<i class="fas fa-chevron-down apk-book-caret"></i>';

      var panel = document.createElement('div');
      panel.className = 'apk-book-panel';
      panel.appendChild(card);

      btn.addEventListener('click', function(){
        var open = wrap.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      wrap.appendChild(btn);
      wrap.appendChild(panel);
      frag.appendChild(wrap);
    });

    // Clear leftover children (none expected since all items moved) and append
    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(frag);
  }

  function check(){
    var root = document.getElementById('activitiesRoot');
    if (!root) return;
    var hasAccordion = root.querySelector(':scope > .apk-book-row') !== null;
    if (hasAccordion) return;
    root.dataset.apkAccordion = '';
    root.classList.remove('apk-book-accordion');
    if (isBooksView(root)) transformBooks(root);
  }

  function init(){
    check();
    var root = document.getElementById('activitiesRoot');
    if (!root) return;
    var pending = false;
    var obs = new MutationObserver(function(){
      if (pending) return;
      pending = true;
      setTimeout(function(){ pending = false; check(); }, 0);
    });
    obs.observe(root, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
`;

  html = html.replace('</style>', `${compactCss}\n${studentExtraCss}\n</style>`);
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${enhancerScript}\n</body>`);
  } else {
    html = html + enhancerScript;
  }
  fs.writeFileSync(studentPath, html, 'utf8');
  console.log('APK student-activities.html patched for compact mobile layout + book accordion.');
}

// APK-only: rewrite extension-less internal route links to their .html files,
// because Capacitor's local web server (https://localhost/) does NOT do the
// .htaccess "MultiViews / extensionless" rewrite that the Hostinger website does.
// Without this patch, navigations like `/activity?book=...` 404 inside the APK
// and fall back to the splash, which then redirects students back to their
// dashboard. This patch only runs from `npm run build:apk`, so the website
// build (`npm run build`) is unaffected.
function patchApkInternalLinks() {
  const routes = [
    'auth',
    'student-activities',
    'parent-dashboard',
    'teacher-dashboard',
    'admin-dashboard',
    'super-admin-dashboard',
    'activity'
  ];

  if (!fs.existsSync(distDir)) return;

  const htmlFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.html'));
  let totalPatched = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(distDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    const original = html;

    for (const route of routes) {
      const r = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 1) HTML attributes: href="/route" or href='/route'
      html = html.replace(
        new RegExp(`href=(["'])\\/${r}\\1`, 'g'),
        `href=$1/${route}.html$1`
      );

      // 2) Quoted URL with query string or hash: '/route?...' or "/route#..."
      html = html.replace(
        new RegExp(`(["'\`])\\/${r}\\?`, 'g'),
        `$1/${route}.html?`
      );
      html = html.replace(
        new RegExp(`(["'\`])\\/${r}#`, 'g'),
        `$1/${route}.html#`
      );

      // 3) HTML-encoded quotes (e.g. inside an inline onclick string):
      //    &quot;/route&quot;  ->  &quot;/route.html&quot;
      html = html.replace(
        new RegExp(`&quot;\\/${r}&quot;`, 'g'),
        `&quot;/${route}.html&quot;`
      );

      // 4) Programmatic navigation: location.href / .replace / .assign = '/route'
      html = html.replace(
        new RegExp(
          `(\\.(?:href|replace|assign)\\s*[=(]\\s*)(["'])\\/${r}\\2`,
          'g'
        ),
        `$1$2/${route}.html$2`
      );

      // 5) `window.location = '/route'`
      html = html.replace(
        new RegExp(`(window\\.location\\s*=\\s*)(["'])\\/${r}\\2`, 'g'),
        `$1$2/${route}.html$2`
      );

      // 6) Absolute Capacitor URL: 'https://localhost/route' -> .../route.html
      html = html.replace(
        new RegExp(`(["'])https:\\/\\/localhost\\/${r}\\1`, 'g'),
        `$1https://localhost/${route}.html$1`
      );
    }

    if (html !== original) {
      fs.writeFileSync(filePath, html, 'utf8');
      totalPatched++;
      console.log('APK link patch applied to', file);
    }
  }

  console.log('APK internal link patch complete. Files patched:', totalPatched);
}

// ──────────────────────────────────────────────────────────────────────────────
// Super-Admin Dashboard: brand colors + per-school separate teacher/student
// breakdown cards (replaces single combined chart that broke when one school
// had 2 teachers and another had 200 students on the same scale).
// ──────────────────────────────────────────────────────────────────────────────
function patchApkSuperAdminDashboard() {
  const filePath = path.join(distDir, 'super-admin-dashboard.html');
  if (!fs.existsSync(filePath)) {
    console.log('APK super-admin dashboard patch skipped (file missing).');
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const marker = 'APK_SUPER_ADMIN_DASHBOARD_BRAND';
  if (html.includes(marker)) {
    console.log('APK super-admin dashboard patch already applied.');
    return;
  }

  const css = [
    '<style data-marker="' + marker + '">',
    '  /* APK_DASHBOARD_OVERFLOW_GUARD */',
    '  html, body { max-width: 100% !important; overflow-x: hidden !important; }',
    '  .app-container, .top-header, .main-content, .sidebar { min-width: 0 !important; max-width: 100% !important; }',
    '  img, video, iframe, table { max-width: 100% !important; height: auto; }',
    '  /* Brand palette overrides */',
    '  .stat-card.blue   { background: linear-gradient(135deg, #29416d 0%, #4f6db0 100%) !important; }',
    '  .stat-card.green  { background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important; }',
    '  .stat-card.red    { background: linear-gradient(135deg, #cf296d 0%, #ff6ba3 100%) !important; }',
    '  .stat-card.purple { background: linear-gradient(135deg, #ea8300 0%, #ffb547 100%) !important; }',
    '  .stat-card { border-radius: 18px !important; box-shadow: 0 8px 22px rgba(41,65,109,0.10) !important; }',
    '  .stat-info h3 { font-size: 1.7rem !important; font-weight: 700 !important; }',
    '  .stat-info p { font-size: 0.85rem !important; }',
    '  .stat-icon { font-size: 2.4rem !important; opacity: 0.35 !important; }',
    '  .nav-item:hover, .nav-item.active { border-left-color: #ea8300 !important; background: rgba(207,41,109,0.10) !important; }',
    '  .filter-tab.active { background: #29416d !important; }',
    '  .filter-tab:hover:not(.active) { color: #29416d !important; background: rgba(41,65,109,0.06) !important; }',
    '  .badge { background: #ea8300 !important; }',
    '  .school-logo { background: linear-gradient(135deg, #29416d, #cf296d) !important; color: #fff !important; }',
    '  .btn-icon:hover { background: #cf296d !important; box-shadow: 0 2px 8px rgba(207,41,109,0.35) !important; }',
    '  .metrics-pill i { color: #cf296d !important; }',
    '  .badge-active { background: rgba(52,211,153,0.15) !important; color: #047857 !important; }',
    '  .badge-pending { background: rgba(234,131,0,0.15) !important; color: #b45309 !important; }',
    '  .top-header { background: linear-gradient(90deg, #29416d 0%, #1d3156 100%) !important; }',
    '  .sidebar { background: linear-gradient(180deg, #1d3156 0%, #14223d 100%) !important; }',
    '  .card { border-radius: 18px !important; }',
    '  .card-title i { color: #cf296d !important; }',
    '  .stats-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) !important; gap: 16px !important; }',
    '  /* Hide the original combined bar chart (broken when 2 teachers vs 200 students) */',
    '  #dash-reports .card:has(#schoolsChartCanvas) { display: none !important; }',
    '  /* Per-school breakdown grid */',
    '  #per-school-breakdown { margin-top: 0; }',
    '  #per-school-breakdown .ps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 8px; }',
    '  .ps-card { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 4px 14px rgba(41,65,109,0.06); border: 1px solid rgba(41,65,109,0.06); }',
    '  .ps-card h4 { font-size: 0.95rem; color: #29416d; margin-bottom: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; }',
    '  .ps-logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #29416d, #cf296d); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }',
    '  .ps-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; font-size: 0.82rem; }',
    '  .ps-row:last-child { margin-bottom: 0; }',
    '  .ps-label { width: 88px; color: #64748b; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }',
    '  .ps-label i { font-size: 0.85rem; }',
    '  .ps-bar-track { flex: 1; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }',
    '  .ps-bar-fill { height: 100%; border-radius: 5px; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }',
    '  .ps-row.teachers .ps-bar-fill { background: linear-gradient(90deg, #29416d, #4f6db0); }',
    '  .ps-row.students .ps-bar-fill { background: linear-gradient(90deg, #cf296d, #ff6ba3); }',
    '  .ps-count { width: 44px; text-align: right; font-weight: 700; color: #29416d; font-size: 0.9rem; }',
    '  .ps-empty { text-align: center; padding: 30px; color: #94a3b8; grid-column: 1 / -1; }',
    '  /* Mobile compact */',
    '  @media (max-width: 600px) {',
    '    .content-area { padding: 16px !important; }',
    '    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }',
    '    .stat-card { padding: 14px !important; border-radius: 14px !important; }',
    '    .stat-info h3 { font-size: 1.3rem !important; }',
    '    .stat-info p { font-size: 0.72rem !important; }',
    '    .stat-icon { font-size: 1.6rem !important; }',
    '    .top-header { padding: 0 14px !important; height: 60px !important; }',
    '    .header-title { font-size: 1rem !important; }',
    '    .header-search { display: none !important; }',
    '    .card { padding: 14px !important; border-radius: 14px !important; }',
    '    #per-school-breakdown .ps-grid { grid-template-columns: 1fr !important; }',
    '  }',
    '</style>'
  ].join('\n');

  const script = [
    '<script data-marker="' + marker + '_JS">',
    '(function(){',
    '  function build() {',
    '    var tbody = document.getElementById("schools-table-body");',
    '    if (!tbody) return false;',
    '    var rows = tbody.querySelectorAll("tr");',
    '    if (!rows.length) return false;',
    '    if (rows[0].querySelector("td[colspan]")) return false;',
    '    var data = [];',
    '    rows.forEach(function(r){',
    '      var tds = r.querySelectorAll("td");',
    '      if (tds.length < 5) return;',
    '      var nameEl = tds[0].querySelector(".school-details strong");',
    '      var logoEl = tds[0].querySelector(".school-logo");',
    '      var tchPill = tds[2].querySelector(".metrics-pill");',
    '      var stuPill = tds[3].querySelector(".metrics-pill");',
    '      var name = nameEl ? nameEl.textContent.trim() : "—";',
    '      var logo = logoEl ? logoEl.textContent.trim() : "SC";',
    '      var tch = tchPill ? (parseInt(tchPill.textContent.trim(), 10) || 0) : 0;',
    '      var stu = stuPill ? (parseInt(stuPill.textContent.trim(), 10) || 0) : 0;',
    '      data.push({ name: name, logo: logo, tch: tch, stu: stu });',
    '    });',
    '    var host = document.getElementById("per-school-breakdown");',
    '    if (!host) {',
    '      host = document.createElement("div");',
    '      host.id = "per-school-breakdown";',
    '      host.className = "card";',
    '      host.innerHTML = \'<div class="card-header"><div class="card-title"><i class="fas fa-school"></i> Per-School Teacher &amp; Student Breakdown</div></div><div class="ps-grid"></div>\';',
    '      var reports = document.getElementById("dash-reports");',
    '      if (reports) reports.appendChild(host);',
    '    }',
    '    var grid = host.querySelector(".ps-grid");',
    '    if (!grid) return true;',
    '    if (!data.length) { grid.innerHTML = \'<div class="ps-empty">No schools registered yet.</div>\'; return true; }',
    '    var maxT = 1, maxS = 1;',
    '    data.forEach(function(d){ if (d.tch > maxT) maxT = d.tch; if (d.stu > maxS) maxS = d.stu; });',
    '    function esc(s){ var v=document.createElement("div"); v.textContent=String(s||""); return v.innerHTML; }',
    '    grid.innerHTML = data.map(function(d){',
    '      var tp = Math.max(4, Math.round((d.tch / maxT) * 100));',
    '      var sp = Math.max(4, Math.round((d.stu / maxS) * 100));',
    '      if (d.tch === 0) tp = 0;',
    '      if (d.stu === 0) sp = 0;',
    '      return \'<div class="ps-card"><h4><span class="ps-logo">\' + esc(d.logo) + \'</span> \' + esc(d.name) + \'</h4>\' +',
    '        \'<div class="ps-row teachers"><div class="ps-label"><i class="fas fa-chalkboard-teacher"></i>Teachers</div><div class="ps-bar-track"><div class="ps-bar-fill" style="width:\' + tp + \'%"></div></div><div class="ps-count">\' + d.tch + \'</div></div>\' +',
    '        \'<div class="ps-row students"><div class="ps-label"><i class="fas fa-user-graduate"></i>Students</div><div class="ps-bar-track"><div class="ps-bar-fill" style="width:\' + sp + \'%"></div></div><div class="ps-count">\' + d.stu + \'</div></div>\' +',
    '        \'</div>\';',
    '    }).join("");',
    '    return true;',
    '  }',
    '  var iv = setInterval(function(){ try { if (build()) clearInterval(iv); } catch(e) { console.warn("ps-build", e); } }, 600);',
    '  setTimeout(function(){ clearInterval(iv); }, 30000);',
    '})();',
    '</script>'
  ].join('\n');

  if (html.includes('</head>')) {
    html = html.replace('</head>', css + '\n</head>');
  } else {
    html = css + '\n' + html;
  }
  if (html.includes('</body>')) {
    html = html.replace('</body>', script + '\n</body>');
  } else {
    html = html + '\n' + script;
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('APK super-admin dashboard brand + per-school patch applied.');
}

fs.writeFileSync(dest, html, 'utf8');
console.log('APK splash index.html written to dist/index.html');
installCompressedApkPdfs();
patchApkAuthPage();
patchApkAuthSuperAdminRedirect();
patchApkStudentDashboard();
patchApkDashboardCompact('teacher-dashboard.html', 'APK_TEACHER_DASHBOARD_COMPACT', '.teacher-page', TEACHER_MISSING_ID_SHIM);
patchApkDashboardCompact('parent-dashboard.html', 'APK_PARENT_DASHBOARD_COMPACT', '.parent-page', PARENT_MISSING_ID_SHIM);
patchApkAdminDashboard();
patchApkSuperAdminDashboard();
patchApkAllowedRoutes();
patchApkInternalLinks();
