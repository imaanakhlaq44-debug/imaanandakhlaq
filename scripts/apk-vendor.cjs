// APK post-build: the school dashboard's roster-import libraries, from disk.
//
// public/admin-dashboard.html loads its spreadsheet / Word / PDF parsers on
// demand (see iaEnsureImportLibs there) from a CDN. Inside the APK those
// URLs point at copies shipped in the package instead, so a roster import
// on a weak signal does not stall on ~1.8 MB of downloads.
//
// Sources are the pinned npm packages in devDependencies — the same builds
// the CDN URLs name.
//
// IMPORTANT: this script ONLY mutates files inside dist/. The website build
// (`npm run build`) does not call it.

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const outDir = path.join(distDir, 'kidba_assets', 'vendor', 'js');

// CDN URL as written in public/admin-dashboard.html -> file in node_modules.
const LIBS = [
  ['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'xlsx/dist/xlsx.full.min.js', 'xlsx.full.min.js'],
  ['https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth/mammoth.browser.min.js', 'mammoth.browser.min.js'],
  ['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'pdfjs-dist/build/pdf.min.js', 'pdf.min.js'],
  ['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', 'pdfjs-dist/build/pdf.worker.min.js', 'pdf.worker.min.js'],
];

function run() {
  const page = path.join(distDir, 'admin-dashboard.html');
  if (!fs.existsSync(page)) {
    console.error('[apk-vendor] dist/admin-dashboard.html not found. Run vite build first.');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  let html = fs.readFileSync(page, 'utf8');
  for (const [url, modFile, outName] of LIBS) {
    const src = path.join(projectRoot, 'node_modules', modFile);
    if (!fs.existsSync(src)) {
      console.error('[apk-vendor] missing ' + modFile + ' — run npm install');
      process.exit(1);
    }
    if (html.indexOf(url) === -1) {
      // The page no longer names this URL: either the loader changed shape
      // or the version was bumped. Either way this list must follow.
      console.error('[apk-vendor] admin-dashboard.html does not reference ' + url);
      process.exit(1);
    }
    fs.copyFileSync(src, path.join(outDir, outName));
    html = html.split(url).join('/kidba_assets/vendor/js/' + outName);
  }
  fs.writeFileSync(page, html, 'utf8');
  console.log('[apk-vendor] ' + LIBS.length + ' libraries copied, admin-dashboard.html points at them');
}

run();
