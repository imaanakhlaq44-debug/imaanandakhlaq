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
  'family.html',
  'reading-plan.html',
  'student-activities.html',
  'super-admin-dashboard.html',
  'teacher-dashboard.html',
];

const FIREBASE_CDN_RE = /import\s*\{([^}]+)\}\s*from\s*["']https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-[^"']+["'];?\n?/g;

// Static imports are not the only way a page reaches the CDN. The student
// dashboard loads three modules on demand:
//
//   const { collection, query } = await import('https://…/firebase-firestore.js');
//
// which the regex above does not match, so those three survived every APK
// build and went to the network at runtime. The bundle puts everything on
// window.firebase, so the whole await-import expression becomes that object
// and the destructure around it is left alone.
const FIREBASE_DYNAMIC_RE =
  /await\s+import\(\s*["']https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-[^"']+["']\s*\)/g;

/** Nothing may still point at the CDN once a page has been patched. */
const FIREBASE_CDN_ANY = /gstatic\.com\/firebasejs/;

// Every firebase-*.js module the pages import from the CDN has to be in here.
// A missing one does not fail loudly: the destructure from window.firebase just
// yields undefined, and the page dies on the first call to it. verifyBundle-
// Exports() below turns that into a build failure instead.
const ENTRY_CONTENT = `
import * as app from 'firebase/app';
import * as auth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as functions from 'firebase/functions';
import * as storage from 'firebase/storage';
window.firebase = { ...app, ...auth, ...firestore, ...functions, ...storage };
`;

function writeTmpEntry(suffix) {
  const tmpEntry = path.join(__dirname, `_fb_entry_${suffix}_tmp.js`);
  fs.writeFileSync(tmpEntry, ENTRY_CONTENT, 'utf8');
  return tmpEntry;
}

// ── Step 1: Build Firebase IIFE bundle ──────────────────────────────────────
async function buildBundle() {
  const tmpEntry = writeTmpEntry('iife');

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

  // Modules fetched on demand rather than at parse time. Same destination.
  if (FIREBASE_DYNAMIC_RE.test(html)) {
    html = html.replace(new RegExp(FIREBASE_DYNAMIC_RE.source, 'g'), 'window.firebase');
    changed = true;
  }

  // also remove type="module" from scripts (ES module imports no longer needed)
  if (html.includes('<script type="module">')) {
    html = html.replace(/<script type="module">/g, '<script>');
    changed = true;
  }

  // A page that still contains an `import` after being de-moduled is dead:
  // the browser throws "Cannot use import statement outside a module" at parse
  // time and the entire script — auth guard included — never runs. That is
  // exactly what happened to super-admin-dashboard.html, which imported
  // Chart.js from esm.sh alongside its Firebase imports; the packaged page sat
  // on "Loading Live Data from Database..." forever while the website was
  // fine. Fail the build instead of shipping it again.
  const stray = html.match(/^[ \t]*import[\s{][^\n]*/m);
  if (stray) {
    throw new Error(
      'apk-firebase-local: ' + path.basename(filePath) + ' still has an ES import ' +
      'after type="module" was removed:\n    ' + stray[0].trim() +
      '\n  Load that dependency as a plain <script> (see the local Chart.js ' +
      'in SuperAdminDashboard.tsx) — an import here is a page that never boots.'
    );
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
  return changed;
}

// ── Step 3: Prove the bundle covers what the pages destructure ─────────────
// The patched pages read their Firebase helpers off window.firebase. If the
// bundle entry is missing a module, the page still loads and then throws
// "X is not a function" on first use — a blank dashboard with one console line.
// Building the same imports as CJS lets us compare the two lists here instead.
async function verifyBundleExports(pageFiles) {
  const wanted = new Set();
  for (const filePath of pageFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const match = html.match(/const \{ ([^}]+) \} = window\.firebase;/);
    if (!match) continue;
    match[1].split(',').forEach((tok) => {
      const name = tok.split(':')[0].trim();
      if (name) wanted.add(name);
    });
  }
  if (wanted.size === 0) return;

  const probeOut = path.join(__dirname, '_fb_probe_tmp.cjs');
  const tmpEntry = writeTmpEntry('cjs');
  try {
    await esbuild.build({
      entryPoints: [tmpEntry],
      bundle: true,
      format: 'cjs',
      outfile: probeOut,
      platform: 'node',
      define: { 'process.env.NODE_ENV': '"production"' },
      banner: { js: 'var window = {};' },
      footer: { js: 'module.exports = window.firebase;' }
    });
  } finally {
    fs.rmSync(tmpEntry, { force: true });
  }

  try {
    const exported = new Set(Object.keys(require(probeOut)));
    const missing = [...wanted].filter((name) => !exported.has(name));
    if (missing.length > 0) {
      console.error(
        '[firebase-local] The pages destructure names the bundle does not export: ' +
          missing.join(', ')
      );
      console.error('[firebase-local] Add the module that provides them to buildBundle().');
      process.exitCode = 1;
      return;
    }
    console.log(`[firebase-local] Verified ${wanted.size} destructured names against the bundle.`);
  } finally {
    fs.rmSync(probeOut, { force: true });
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n[firebase-local] Building local Firebase bundle for APK...');
  await buildBundle();

  console.log('[firebase-local] Patching HTML files...');
  let patched = 0;
  const present = [];
  for (const name of HTML_FILES) {
    const filePath = path.join(assetsDir, name);
    if (!fs.existsSync(filePath)) continue;
    present.push(filePath);
    if (patchHtmlFile(filePath)) {
      console.log(`  ✓ ${name}`);
      patched++;
    } else {
      console.log(`  – ${name} (no firebase CDN found, skipped)`);
    }
  }

  await verifyBundleExports(present);
  verifyNothingReachesTheCdn();

  console.log(`[firebase-local] Done — ${patched} files patched, Firebase is now local.\n`);
})();

/**
 * The point of this script is that the packaged app never asks the network for
 * Firebase. Nothing checked that it had actually achieved it.
 *
 * Two ways it silently did not: a page using `await import(...)` instead of a
 * static import, which the rewrite did not match — three of those sat in the
 * student dashboard through every build — and a new page that nobody added to
 * HTML_FILES, which is not patched at all. Both ship an APK that works on the
 * desk and fails on a phone with no signal.
 *
 * So the whole payload is swept, not just the list. HTML_FILES stays as the
 * thing that gets patched; this is the thing that proves the list was right.
 */
function verifyNothingReachesTheCdn() {
  const offenders = [];
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith('.html')) continue;
    const filePath = path.join(assetsDir, name);
    const html = fs.readFileSync(filePath, 'utf8');
    if (!FIREBASE_CDN_ANY.test(html)) continue;

    const lines = html.split('\n')
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => FIREBASE_CDN_ANY.test(String(line)))
      .map(([n, line]) => `      line ${n}: ${String(line).trim().slice(0, 110)}`);
    offenders.push(`  ${name}\n${lines.join('\n')}`);
  }

  if (offenders.length) {
    throw new Error(
      'These packaged pages still load Firebase from the CDN, so they need a\n' +
      'network connection to work at all:\n\n' + offenders.join('\n\n') + '\n\n' +
      'If the page is missing from HTML_FILES in this script, add it. If it uses\n' +
      'a form of import the rewrite does not match, extend the rewrite.'
    );
  }
  console.log('[firebase-local] Verified no page reaches the CDN.');
}
