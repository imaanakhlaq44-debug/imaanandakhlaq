// APK post-copy: drop payload that the app never reads off disk.
//
// The books are served from Firebase Storage — every book in
// src/data/activities.json carries a firebasestorage.googleapis.com pdfUrl, and
// ActivityPage only falls back to a local /bookN.pdf when that URL is missing.
// Shipping the files as well added ~74 MB of dead weight to the bundle.
//
// IMPORTANT: this runs AFTER `npx cap copy android`, and only ever touches
// android/app/src/main/assets/public. dist/ — which the website and the
// Hostinger zip are built from — is left exactly as it is.

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const assetsRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'public');

// Files and directories removed from the APK payload, with the reason each one
// is safe to drop.
const PRUNE = [
  { rel: 'book1.pdf', why: 'served from Firebase Storage' },
  { rel: 'book2.pdf', why: 'served from Firebase Storage' },
  { rel: 'book3.pdf', why: 'served from Firebase Storage' },
  { rel: 'book4.pdf', why: 'served from Firebase Storage' },
  { rel: 'demo', why: 'website hero footage, no page in the app loads it' },
  { rel: 'assets/journey', why: 'homepage illustrations, the app never opens the homepage' },
  // The homepage hero slider. The app cannot open the homepage — it is not in
  // the APK route allowlist — so these five never appear on screen, and they
  // were the single largest thing in the package after the code.
  //
  // They used to be left in with a note saying style.css names them, so
  // removing them would trade weight for 404s. True, but the rules that name
  // them are stripped from the packaged stylesheet just below, so there are
  // no 404s to trade for.
  { rel: 'kidba_assets/img/hero-slide-2-CT2NPYgP (1).png', why: 'homepage hero slider, unreachable in the app' },
  { rel: 'kidba_assets/img/hero-slide-3-CEnLNR65 (1).png', why: 'homepage hero slider, unreachable in the app' },
  { rel: 'kidba_assets/img/hero-slide-4-Dvq5Fvo_ (1).png', why: 'homepage hero slider, unreachable in the app' },
  { rel: 'kidba_assets/img/hero-slide-5-DjDsLXyf.png', why: 'homepage hero slider, unreachable in the app' },
  { rel: 'kidba_assets/img/hero-slide-6-D0eMAfvp.png', why: 'homepage hero slider, unreachable in the app' },
  // Referenced by nothing at all — not by the app, not by the website.
  { rel: 'assets/brand', why: 'no page anywhere links to these' }
];

/**
 * Drop the packaged stylesheet's references to images that are no longer in
 * the package, so pruning them costs nothing rather than costing a 404.
 * Only the APK copy is touched; the website keeps its slider.
 */
function stripHeroSlideCss() {
  const cssPath = path.join(assetsRoot, 'kidba_assets', 'css', 'style.css');
  if (!fs.existsSync(cssPath)) return;

  const before = fs.readFileSync(cssPath, 'utf8');
  const after = before.replace(
    /^[ \t]*background-image:\s*url\(['"][^'"]*hero-slide-[^'"]*['"]\);[ \t]*\r?\n/gm,
    ''
  );
  if (after === before) return;

  fs.writeFileSync(cssPath, after, 'utf8');
  const dropped = (before.match(/hero-slide-/g) || []).length - (after.match(/hero-slide-/g) || []).length;
  console.log('  ✓ ' + dropped + ' hero-slide background rules dropped from the packaged style.css');
}

function sizeOf(target) {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(target).reduce(
    (total, entry) => total + sizeOf(path.join(target, entry)),
    0
  );
}

function mb(bytes) {
  return (bytes / 1048576).toFixed(1) + ' MB';
}

if (!fs.existsSync(assetsRoot)) {
  console.warn('[apk-prune] Android assets not found — run `npx cap copy android` first.');
  process.exit(0);
}

let freed = 0;
for (const { rel, why } of PRUNE) {
  const target = path.join(assetsRoot, rel);
  if (!fs.existsSync(target)) {
    console.log('  – ' + rel + ' (not present)');
    continue;
  }
  const bytes = sizeOf(target);
  fs.rmSync(target, { recursive: true, force: true });
  freed += bytes;
  console.log('  ✓ ' + rel + ' removed (' + mb(bytes) + ') — ' + why);
}

stripHeroSlideCss();

console.log('[apk-prune] Payload now ' + mb(sizeOf(assetsRoot)) + ', freed ' + mb(freed) + '.');
