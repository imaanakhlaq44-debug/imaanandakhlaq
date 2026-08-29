// Fails the APK build if the payload asks for a camera or a location, or if the
// manifest declares a permission for either.
//
// This replaces check-ar-warning.cjs. That script guarded the AR safety notice
// on the Qibla screen; builds 38 and 39 were rejected under the Families
// policy's Special restrictions for Augmented Reality anyway, and the Qibla was
// removed rather than argued a third time. What is worth guarding now is the
// absence: INTERNET is the only permission the app declares, the listing and the
// privacy policy both say so, and the Data safety form is filled in on that
// basis. A single getUserMedia call reintroduced by a later edit would make all
// three untrue, silently, until a reviewer found it.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const payload = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');
const manifest = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
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
  console.error('[check-permissions] payload not found — run `npx cap copy android` first.');
  process.exit(1);
}

const rel = function (p) { return path.relative(payload, p).split(path.sep).join('/'); };
const files = walk(payload, []);

// 1. Nothing in the shipped web payload may reach for a camera or a location.
const BANNED = [
  { needle: 'getUserMedia', what: 'opens a camera or microphone' },
  { needle: 'navigator.geolocation', what: 'reads the device location' },
  { needle: 'watchPosition', what: 'reads the device location' }
];
files.forEach(function (p) {
  const s = fs.readFileSync(p, 'utf8');
  BANNED.forEach(function (b) {
    if (s.indexOf(b.needle) !== -1) {
      problems.push(rel(p) + ' ' + b.what + ' (' + b.needle + '). The app is shipped as ' +
        'permission-free; if this is deliberate, the manifest, the privacy policy and the ' +
        'Data safety form all have to change with it.');
    }
  });
});

// 2. The manifest must declare INTERNET and nothing else.
const mf = fs.readFileSync(manifest, 'utf8');
const declared = (mf.match(/<uses-permission[^>]*android:name="([^"]+)"/g) || []).map(function (m) {
  return m.replace(/.*android:name="/, '').replace(/"$/, '');
});
declared.forEach(function (d) {
  if (d !== 'android.permission.INTERNET') {
    problems.push('AndroidManifest.xml declares ' + d + '. INTERNET is meant to be the only one.');
  }
});
if (declared.indexOf('android.permission.INTERNET') === -1) {
  problems.push('AndroidManifest.xml no longer declares INTERNET — the app cannot load anything.');
}

if (problems.length) {
  console.error('[check-permissions] FAILED — this build contradicts what Play was told:');
  problems.forEach(function (p) { console.error('  - ' + p); });
  process.exit(1);
}
console.log('[check-permissions] no camera, no location, no microphone; INTERNET is the only permission (' +
  files.length + ' payload files checked).');
