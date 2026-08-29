// Renders the Play Store phone screenshots from the exact payload that ships
// inside the APK, so what the listing shows is what the reviewer installs.
//
// Run after `npm run build:apk`, which is what leaves the payload in place:
//   node scripts/play-store-screenshots.cjs
//
// The viewport is a real phone's CSS size (360x780) rendered at 3x, so the page
// lays itself out the way it does on a handset — the bottom bar pins to the
// bottom, the media queries fire — and still comes out at 1080x2340, which is
// what the existing shots are and sits inside Play's 320-3840 px limits.

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const root = path.join(__dirname, '..');
const payload = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');
const outDir = path.join(root, 'play_store_assets', 'screenshots');
const CSS_WIDTH = 360, CSS_HEIGHT = 780, SCALE = 3;   // -> 1080 x 2340

// ?apkbar=1 makes the bottom bar show outside the Capacitor shell, so the shots
// carry the same navigation a phone user sees.
const SHOTS = [
  // The welcome poster is the app's own first screen and makes the best opener;
  // only its close button has no business in a store listing.
  { file: '01_welcome.png', url: '/index.html?apkbar=1',      wait: 2500, hide: ['#authBannerClose'] },
  { file: '02_auth.png',    url: '/auth.html?apkbar=1',       wait: 2500, dismiss: true },
  { file: '03_azkar.png',   url: '/apk/azkar.html?apkbar=1',  wait: 1500 },
  { file: '04_tasbeeh.png', url: '/apk/tasbeeh.html?apkbar=1', wait: 1500 },
  { file: '05_faqs.png',    url: '/apk/faqs.html?apkbar=1',   wait: 1500 },
  { file: '06_about.png',   url: '/apk/about.html?apkbar=1',  wait: 1500 }
];

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf'
};

if (!fs.existsSync(payload)) {
  console.error('[screenshots] payload not found — run `npm run build:apk` first.');
  process.exit(1);
}

const server = http.createServer(function (req, res) {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(payload, rel);
  // Never serve outside the payload, whatever the request asks for.
  if (!file.startsWith(payload) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async function () {
  await new Promise(function (r) { server.listen(0, '127.0.0.1', r); });
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--force-device-scale-factor=1'] });
  const page = await browser.newPage();
  await page.setViewport({ width: CSS_WIDTH, height: CSS_HEIGHT, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });

  fs.mkdirSync(outDir, { recursive: true });
  for (const shot of SHOTS) {
    await page.goto(base + shot.url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(function (e) {
      console.error('  ! ' + shot.url + ' — ' + e.message);
    });
    await new Promise(function (r) { setTimeout(r, shot.wait); });
    if (shot.hide) {
      await page.evaluate(function (sels) {
        sels.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) { el.style.display = 'none'; });
        });
      }, shot.hide);
    }
    // The welcome poster covers the page it is shown over, so a shot of that
    // page has to close it first.
    if (shot.dismiss) {
      await page.evaluate(function () {
        var btns = document.querySelectorAll('#authBannerClose, [aria-label="Close"], .modal-close, [data-modal-close], .close');
        for (var i = 0; i < btns.length; i++) {
          var r = btns[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) { btns[i].click(); return; }
        }
      });
      await new Promise(function (r) { setTimeout(r, 1200); });
    }
    const out = path.join(outDir, shot.file);
    await page.screenshot({ path: out, type: 'png' });
    console.log('  ✓ ' + shot.file + '  ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB  ← ' + shot.url);
  }

  await browser.close();
  server.close();
  console.log('[screenshots] ' + SHOTS.length + ' written to play_store_assets/screenshots/ at ' +
    (CSS_WIDTH * SCALE) + 'x' + (CSS_HEIGHT * SCALE) + '.');
})();
