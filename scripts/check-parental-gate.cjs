// Fails the APK build if a page that can send a child out of the app ships
// without the parental gate in front of it.
//
// The Families policy wants links out to the open web gated. The gate is
// injected at build time, which means a new page — or a build step reordered so
// the injection runs before the page is written — could quietly ship ungated.
// This checks the payload that actually goes into the APK.

const fs = require('fs');
const path = require('path');

const payload = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const GATE_JS = path.join(payload, 'kidba_assets', 'js', 'apk-parental-gate.js');
const problems = [];

function htmlFiles(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (/\.html$/i.test(e.name)) out.push(p);
  });
  return out;
}

if (!fs.existsSync(payload)) {
  console.error('[check-parental-gate] payload not found — run `npx cap copy android` first.');
  process.exit(1);
}

if (!fs.existsSync(GATE_JS)) {
  problems.push('kidba_assets/js/apk-parental-gate.js is missing from the payload.');
} else {
  const gate = fs.readFileSync(GATE_JS, 'utf8');
  try { new Function(gate); } catch (e) {
    problems.push('the parental gate script does not parse: ' + e.message);
  }
  if (gate.indexOf('leavesTheApp') === -1) problems.push('the gate no longer decides which links leave the app.');
  if (gate.indexOf('window.open') === -1) problems.push('the gate no longer opens the link it was asked about.');
}

// Any page carrying a link to another origin has to carry the gate with it.
const APP_HOSTS = [];      // the APK is served from localhost; nothing else is "inside"
const ungated = [];
const hosts = {};
htmlFiles(payload, []).forEach(function (file) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(payload, file).split(path.sep).join('/');
  const links = html.match(/<a[^>]+href="https?:\/\/[^"]+"/gi) || [];
  if (!links.length) return;
  links.forEach(function (l) {
    const m = l.match(/href="(https?:\/\/[^"/]+)/i);
    if (m && APP_HOSTS.indexOf(m[1]) === -1) hosts[m[1]] = (hosts[m[1]] || 0) + 1;
  });
  if (html.indexOf('apk-parental-gate.js') === -1) ungated.push(rel + ' (' + links.length + ' link(s) out)');
});

if (ungated.length) {
  problems.push('these pages link out of the app with no parental gate:');
  ungated.forEach(function (u) { problems.push('    ' + u); });
}

if (problems.length) {
  console.error('[check-parental-gate] FAILED — this build risks a Families policy rejection:');
  problems.forEach(function (p) { console.error('  - ' + p); });
  process.exit(1);
}

const names = Object.keys(hosts).sort(function (a, b) { return hosts[b] - hosts[a]; });
console.log('[check-parental-gate] every page that links out carries the gate (' +
  names.length + ' outside host(s): ' + names.slice(0, 5).join(', ') +
  (names.length > 5 ? ', …' : '') + ').');
