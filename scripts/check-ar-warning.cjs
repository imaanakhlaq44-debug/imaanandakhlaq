// Fails the APK build if the AR safety warning is not in the payload, or is not
// in front of the camera.
//
// Google Play rejected builds 38 and 39 under the Families policy's Special
// restrictions for Augmented Reality: the Qibla camera view must open with a
// warning about parental supervision and being aware of your surroundings. That
// warning is easy to lose — a stray edit to the generator, a template that stops
// being copied — and the loss is silent until a reviewer finds it weeks later.
// So the build checks it instead of trusting it.

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
  console.error('[check-ar-warning] payload not found — run `npx cap copy android` first.');
  process.exit(1);
}

const files = walk(payload, []);
const rel = function (p) { return path.relative(payload, p).split(path.sep).join('/'); };

// 1. Every place that can open a camera has to be a page we have checked.
const cameraFiles = files.filter(function (p) {
  return fs.readFileSync(p, 'utf8').indexOf('getUserMedia') !== -1;
}).map(rel);
const KNOWN = ['apk/qibla.html'];
cameraFiles.forEach(function (f) {
  if (KNOWN.indexOf(f) === -1) {
    problems.push(f + ' opens a camera and has no reviewed safety warning. ' +
      'Add one, then list the file in KNOWN here.');
  }
});
KNOWN.forEach(function (f) {
  if (cameraFiles.indexOf(f) === -1) problems.push(f + ' no longer opens a camera — is this check still pointed at the right page?');
});

// 2. The Qibla page itself: the notice must exist, parse, and stand in front.
const qiblaPath = path.join(payload, 'apk', 'qibla.html');
if (!fs.existsSync(qiblaPath)) {
  problems.push('apk/qibla.html is missing from the payload.');
} else {
  const s = fs.readFileSync(qiblaPath, 'utf8');

  s.split(/<script>/).slice(1).map(function (x) { return x.split(/<\/script>/)[0]; })
    .forEach(function (block, i) {
      try { new Function(block); } catch (e) {
        problems.push('apk/qibla.html script block ' + (i + 1) + ' does not parse: ' + e.message);
      }
    });

  if (s.indexOf('id="qiblaArWarn"') === -1) problems.push('the AR safety notice is gone from apk/qibla.html.');
  if (!/parental supervision/i.test(s)) problems.push('the notice no longer mentions parental supervision.');
  if (!/aware of your surroundings/i.test(s)) problems.push('the notice no longer mentions being aware of your surroundings.');

  // The notice has to sit outside the AR container, or it cannot be shown until
  // the AR view is already on screen.
  const arOpen = s.indexOf('<div id="qiblaAr" ');
  const arClose = s.indexOf('\n</div>', arOpen);
  const warnAt = s.indexOf('id="qiblaArWarn"');
  if (arOpen === -1 || arClose === -1) problems.push('could not find the AR container in apk/qibla.html.');
  else if (warnAt < arClose) problems.push('the safety notice is inside the AR view, so the AR view opens first.');

  // Entering the AR section must not open the camera view before the notice.
  if (/hideBottomBar\(\);\s*\n\s*arEl\.style\.display = 'block';/.test(s)) {
    problems.push('openArSection() opens the AR view before showing the notice.');
  }
  if (s.indexOf('document.body.contains(arWarn)') === -1) {
    problems.push('the AR entry no longer checks that the notice is actually on the page.');
  }
}

if (problems.length) {
  console.error('[check-ar-warning] FAILED — this build would be rejected by Google Play:');
  problems.forEach(function (p) { console.error('  - ' + p); });
  process.exit(1);
}
console.log('[check-ar-warning] AR safety warning present and in front of the camera (' +
  cameraFiles.join(', ') + ').');
