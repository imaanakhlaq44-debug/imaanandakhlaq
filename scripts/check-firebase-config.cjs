// Fails the APK build if the Firebase config baked into the payload is not real.
//
// The config comes from VITE_* variables in .env, and .env is not in git. A
// checkout without one — a fresh clone, or a git worktree, which does not
// inherit ignored files — still builds, still signs, still installs. It just
// carries `apiKey: "undefined"` and every screen dies on
// `auth/api-key-not-valid` the moment somebody tries to sign in. Build 41 was
// assembled and signed that way before anyone noticed.
//
// Nothing about that is visible in the build log, so the payload is checked
// instead.

const fs = require('fs');
const path = require('path');

const payload = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const problems = [];

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js)$/i.test(e.name)) out.push(p);
  });
  return out;
}

if (!fs.existsSync(payload)) {
  console.error('[check-firebase-config] payload not found — run `npx cap copy android` first.');
  process.exit(1);
}

const rel = function (p) { return path.relative(payload, p).split(path.sep).join('/'); };
const FIELDS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
let seen = 0;

// Matches   apiKey: "…"   as written by src/lib/firebaseConfig.ts.
const FIELD_RE = new RegExp('(' + FIELDS.join('|') + ')\\s*:\\s*"([^"]*)"', 'g');

walk(payload, []).forEach(function (p) {
  const s = fs.readFileSync(p, 'utf8');
  FIELD_RE.lastIndex = 0;
  let m;
  while ((m = FIELD_RE.exec(s)) !== null) {
    seen++;
    const field = m[1], value = m[2];
    if (value === '' || value === 'undefined' || value === 'null') {
      problems.push(rel(p) + ' has ' + field + ': "' + value + '" — .env was missing or incomplete when this was built.');
    }
  }
});

if (!seen) {
  problems.push('no Firebase config found anywhere in the payload — the pages cannot reach Firebase at all.');
}

if (problems.length) {
  const uniq = problems.filter(function (p, i) { return problems.indexOf(p) === i; });
  console.error('[check-firebase-config] FAILED — this build cannot sign anybody in:');
  uniq.slice(0, 12).forEach(function (p) { console.error('  - ' + p); });
  if (uniq.length > 12) console.error('  … and ' + (uniq.length - 12) + ' more.');
  console.error('  Fix: copy .env into this checkout (it is gitignored, so worktrees do not get one) and rebuild.');
  process.exit(1);
}
console.log('[check-firebase-config] Firebase config is populated in the payload (' + seen + ' fields checked).');
