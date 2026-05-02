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
  'parent-dashboard.html',
  'student-activities.html',
  'super-admin-dashboard.html',
  'teacher-dashboard.html',
];

const FIREBASE_CDN_RE = /import\s*\{([^}]+)\}\s*from\s*["']https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-[^"']+["'];?\n?/g;

// ── Step 1: Build Firebase ESM bundle ──────────────────────────────────────
async function buildBundle() {
  const entryContent = `
export * from 'firebase/app';
export * from 'firebase/auth';
export * from 'firebase/firestore';
export * from 'firebase/storage';
`;
  const tmpEntry = path.join(__dirname, '_fb_bundle_entry_tmp.js');
  fs.writeFileSync(tmpEntry, entryContent, 'utf8');

  try {
    await esbuild.build({
      entryPoints: [tmpEntry],
      bundle: true,
      format: 'esm',
      outfile: bundleOut,
      minify: true,
      platform: 'browser',
      target: ['chrome85'], // API 34 WebView = Chrome 85+
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

  // Collect all named imports from firebase CDN lines
  const allImports = new Set();
  let match;
  const re = new RegExp(FIREBASE_CDN_RE.source, 'g');
  while ((match = re.exec(html)) !== null) {
    match[1].split(',').forEach(imp => {
      const trimmed = imp.trim().replace(/\s+as\s+\w+/, ''); // strip aliases for detection
      if (trimmed) allImports.add(match[1].trim()); // keep full import group
    });
  }

  // Collect raw named import tokens (preserving aliases like "getDoc as _getDoc")
  const allTokens = [];
  const re2 = new RegExp(FIREBASE_CDN_RE.source, 'g');
  while ((match = re2.exec(html)) !== null) {
    match[1].split(',').forEach(tok => {
      const t = tok.trim();
      if (t) allTokens.push(t);
    });
  }

  if (allTokens.length === 0) return false; // no firebase CDN in this file

  // Deduplicate tokens (by alias name if present, else by symbol name)
  const seen = new Set();
  const dedupedTokens = [];
  allTokens.forEach(tok => {
    const key = tok.replace(/\s+as\s+\S+/, '').trim();
    if (!seen.has(key)) {
      seen.add(key);
      dedupedTokens.push(tok);
    }
  });

  const singleImport = `import { ${dedupedTokens.join(', ')} } from "${localBundlePath}";`;

  // Remove all firebase CDN import lines, insert single local import in their place
  let firstReplaced = false;
  const re3 = new RegExp(FIREBASE_CDN_RE.source, 'g');
  html = html.replace(re3, (full) => {
    if (!firstReplaced) {
      firstReplaced = true;
      return singleImport + '\n';
    }
    return ''; // remove subsequent firebase CDN lines
  });

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
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
