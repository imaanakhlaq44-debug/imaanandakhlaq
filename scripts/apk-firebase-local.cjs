// scripts/apk-firebase-local.cjs
// Bundles Firebase SDK locally for APK so it works without internet on first load.
// Replaces gstatic.com CDN imports with a local /kidba_assets/js/firebase-bundle.esm.js

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const bundleOut = path.join(assetsDir, 'kidba_assets', 'js', 'firebase-bundle.esm.js');
const localBundlePath = '/kidba_assets/js/firebase-bundle.esm.js';

const HTML_FILES = [
  'activity.html',
  'admin-dashboard.html',
  'auth.html',
  'student-activities.html',
  'super-admin-dashboard.html',
  'teacher-dashboard.html',
];

const FIREBASE_CDN_RE = /import\s*\{([^}]+)\}\s*from\s*["']https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-[^"']+["'];?\n?/g;

// ── Step 1: Build Firebase IIFE bundle ──────────────────────────────────────
async function buildBundle() {
  const entryContent = `
import * as app from 'firebase/app';
import * as auth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as storage from 'firebase/storage';
window.firebase = { ...app, ...auth, ...firestore, ...storage };
`;
  const tmpEntry = path.join(__dirname, '_fb_bundle_entry_tmp.js');
  fs.writeFileSync(tmpEntry, entryContent, 'utf8');

  try {
    await esbuild.build({
      entryPoints: [tmpEntry],
      bundle: true,
      format: 'iife',
      outfile: bundleOut,
      minify: true,
      platform: 'browser',
      target: ['es2015'], 
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    console.log(`[firebase-local] Bundle built → ${path.relative(process.cwd(), bundleOut)} (${(fs.statSync(bundleOut).size / 1024).toFixed(0)} KB)`);
  } finally {
    fs.unlinkSync(tmpEntry);
  }
}

// ── Step 2: Patch each HTML file ───────────────────────────────────────────
function patchHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // ── Always inject the bundle <script> into <head> if not already there ──
  if (!html.includes(localBundlePath)) {
    html = html.replace('</head>', `<script src="${localBundlePath}"></script>\n</head>`);
    changed = true;
  }

  // ── Replace Firebase CDN import lines with window.firebase destructure ──
  const allTokens = [];
  let match;
  const re2 = new RegExp(FIREBASE_CDN_RE.source, 'g');
  while ((match = re2.exec(html)) !== null) {
    match[1].split(',').forEach(tok => {
      const t = tok.trim();
      if (t) allTokens.push(t.replace(/\s+as\s+/, ': '));
    });
  }

  if (allTokens.length > 0) {
    // Deduplicate tokens
    const seen = new Set();
    const dedupedTokens = [];
    allTokens.forEach(tok => {
      const key = tok.split(':')[0].trim();
      if (!seen.has(key)) {
        seen.add(key);
        dedupedTokens.push(tok);
      }
    });

    const singleImport = `const { ${dedupedTokens.join(', ')} } = window.firebase;`;

    let firstReplaced = false;
    const re3 = new RegExp(FIREBASE_CDN_RE.source, 'g');
    html = html.replace(re3, (full) => {
      if (!firstReplaced) {
        firstReplaced = true;
        return singleImport + '\n';
      }
      return '';
    });
    changed = true;
  }

  // also remove type="module" from scripts (ES module imports no longer needed)
  if (html.includes('<script type="module">')) {
    html = html.replace(/<script type="module">/g, '<script>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
  return changed;
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n[firebase-local] Building local Firebase bundle for APK...');
  await buildBundle();

  console.log('[firebase-local] Patching HTML files...');
  let patched = 0;
  for (const name of HTML_FILES) {
    const filePath = path.join(assetsDir, name);
    if (!fs.existsSync(filePath)) continue;
    if (patchHtmlFile(filePath)) {
      console.log(`  ✓ ${name}`);
      patched++;
    } else {
      console.log(`  – ${name} (no firebase CDN found, skipped)`);
    }
  }

  console.log(`[firebase-local] Done — ${patched} files patched, Firebase is now local.\n`);
})();
