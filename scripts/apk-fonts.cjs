// APK post-build: serve the web fonts from inside the app.
//
// Every page asked fonts.googleapis.com for its font CSS as a render-blocking
// <link> (and the dashboards again through an @import). Inside the APK that
// meant a network round trip before the first paint of every single page,
// a blank screen on a weak signal, and a font swap under the text when the
// answer finally came. The files now ship in the package: apk_assets/fonts/
// (refresh them with scripts/apk-fonts-fetch.cjs), copied here into dist/.
//
// IMPORTANT: this script ONLY mutates files inside dist/. The website build
// (`npm run build`) does not call it and keeps using Google Fonts.

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'apk_assets', 'fonts');
const distDir = path.join(projectRoot, 'dist');
const outDir = path.join(distDir, 'kidba_assets', 'fonts');
const LOCAL_CSS = '/kidba_assets/fonts/fonts.css';

function rewrite(html) {
  const before = html;
  // <link ... href="https://fonts.googleapis.com/css2?..." ...>  -> local sheet
  html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2?\?[^"']*["'][^>]*>/gi,
    `<link rel="stylesheet" href="${LOCAL_CSS}">`);
  // preconnect hints have nothing left to connect to
  html = html.replace(/[ \t]*<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(googleapis|gstatic)\.com["'][^>]*>\s*\n?/gi, '');
  // @import url('https://fonts.googleapis.com/css2?...');  -> local sheet
  html = html.replace(/@import\s+url\(\s*['"]?https:\/\/fonts\.googleapis\.com\/css2?\?[^)'"]*['"]?\s*\)\s*;/gi,
    `@import url('${LOCAL_CSS}');`);
  return html === before ? null : html;
}

function run() {
  if (!fs.existsSync(distDir)) {
    console.error('[apk-fonts] dist/ not found. Run vite build first.');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(srcDir, 'fonts.css'))) {
    console.error('[apk-fonts] apk_assets/fonts/fonts.css missing. Run: node scripts/apk-fonts-fetch.cjs');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  let copied = 0;
  for (const f of fs.readdirSync(srcDir)) {
    fs.copyFileSync(path.join(srcDir, f), path.join(outDir, f));
    copied++;
  }

  const pages = [];
  for (const f of fs.readdirSync(distDir)) if (f.endsWith('.html')) pages.push(path.join(distDir, f));
  const apkDir = path.join(distDir, 'apk');
  if (fs.existsSync(apkDir)) for (const f of fs.readdirSync(apkDir)) if (f.endsWith('.html')) pages.push(path.join(apkDir, f));

  let patched = 0;
  const leftovers = [];
  for (const p of pages) {
    const html = fs.readFileSync(p, 'utf8');
    const next = rewrite(html);
    if (next !== null) { fs.writeFileSync(p, next, 'utf8'); patched++; }
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(next || html)) leftovers.push(path.relative(distDir, p));
  }
  if (leftovers.length) {
    // A page that still reaches for Google Fonts blocks its first paint on
    // the network again. Fail the build rather than ship that quietly.
    console.error('[apk-fonts] Google Fonts references survived in: ' + leftovers.join(', '));
    process.exit(1);
  }
  console.log('[apk-fonts] ' + copied + ' font files copied, ' + patched + ' pages rewritten to ' + LOCAL_CSS);
}

run();
