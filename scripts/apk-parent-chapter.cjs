// APK post-build: mirror the parent dashboard daily-chapter popup AND
// the dashboard-buttons polish (logout highlight + uniform book cards +
// mobile compact layout) from imaan_hostinger/ into dist/ so the same
// experience ships in the Play Store APK.
//
// IMPORTANT: only mutates dist/. Source (src/, imaan_hostinger/) untouched.

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcRoot     = path.join(projectRoot, 'imaan_hostinger');
const distRoot    = path.join(projectRoot, 'dist');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function copyAsset(relPath) {
  const src = path.join(srcRoot, relPath);
  const dst = path.join(distRoot, relPath);
  if (!fs.existsSync(src)) {
    console.warn('  Source missing:', src);
    return false;
  }
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  console.log('  Copied:', relPath);
  return true;
}

function patchHtml(distFile, fn) {
  const filePath = path.join(distRoot, distFile);
  if (!fs.existsSync(filePath)) {
    console.warn('  Dist file missing:', distFile);
    return false;
  }
  const before = fs.readFileSync(filePath, 'utf8');
  const after = fn(before);
  if (after === before) { console.log('  No change:', distFile); return false; }
  fs.writeFileSync(filePath, after, 'utf8');
  console.log('  Patched:', distFile);
  return true;
}

console.log('=== APK: parent-chapter + dashboard-buttons ===');

// 1. Copy assets
console.log('Copying assets...');
copyAsset('kidba_assets/css/dashboard-buttons.css');
copyAsset('kidba_assets/css/daily-chapter.css');
copyAsset('kidba_assets/js/daily-chapter.js');
copyAsset('kidba_assets/data/chapters_data.json');

// 2. Inject dashboard-buttons.css into 5 dashboards
console.log('Injecting dashboard-buttons.css into dashboards...');
const DASHBOARDS = [
  'teacher-dashboard.html',
  'admin-dashboard.html',
  'super-admin-dashboard.html',
  'student-activities.html'
];
const DB_LINK = '<link rel="stylesheet" href="/kidba_assets/css/dashboard-buttons.css?v=4">';
DASHBOARDS.forEach(file => {
  patchHtml(file, html => {
    if (html.includes('dashboard-buttons.css')) return html;
    // Try to anchor after style.css
    const styleAnchor = '<link rel="stylesheet" href="/kidba_assets/css/style.css">';
    if (html.includes(styleAnchor)) {
      return html.replace(styleAnchor, styleAnchor + '\n  ' + DB_LINK);
    }
    // Fallback: before </head>
    return html.replace('</head>', '  ' + DB_LINK + '\n</head>');
  });
});

// 3. The daily-chapter popup used to be injected into parent-dashboard.html
//    and nowhere else. That page is gone with the separate parent account, so
//    this step has no target. It is left disabled rather than silently pointed
//    at student-activities.html, because moving a parent-facing popup in front
//    of every student is a product call, not a build-script one.
//    To bring it back, set DAILY_CHAPTER_TARGET to the page it belongs on.
const DAILY_CHAPTER_TARGET = null;

if (DAILY_CHAPTER_TARGET) {
  console.log('Wiring daily-chapter popup into ' + DAILY_CHAPTER_TARGET + '...');
  const AMIRI_LINK = '<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">';
  const DC_LINK   = '<link rel="stylesheet" href="/kidba_assets/css/daily-chapter.css">';
  const DC_SCRIPT = '<script src="/kidba_assets/js/daily-chapter.js" defer></script>';

  patchHtml(DAILY_CHAPTER_TARGET, html => {
    if (html.includes('daily-chapter.css') && html.includes('daily-chapter.js')) return html;
    let out = html;

    // Add Amiri font once
    if (!out.includes('family=Amiri')) {
      const fredokaTag = out.match(/<link[^>]*Fredoka\+One[^>]*>/);
      if (fredokaTag) {
        out = out.replace(fredokaTag[0], fredokaTag[0] + '\n  ' + AMIRI_LINK);
      } else {
        out = out.replace('</head>', '  ' + AMIRI_LINK + '\n</head>');
      }
    }

    // Add daily-chapter CSS + JS
    if (!out.includes('daily-chapter.css')) {
      const styleAnchor = '<link rel="stylesheet" href="/kidba_assets/css/style.css">';
      if (out.includes(styleAnchor)) {
        out = out.replace(styleAnchor, styleAnchor + '\n  ' + DC_LINK + '\n  ' + DC_SCRIPT);
      } else {
        out = out.replace('</head>', '  ' + DC_LINK + '\n  ' + DC_SCRIPT + '\n</head>');
      }
    }
    return out;
  });
} else {
  console.log('Skipping daily-chapter popup: its host page (parent-dashboard.html) was retired.');
}

console.log('=== APK parent-chapter polish complete ===');
