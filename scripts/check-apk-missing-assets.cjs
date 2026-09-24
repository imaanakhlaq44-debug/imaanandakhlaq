/**
 * Har same-origin path jo build output mein maujood nahi, use report karta hai.
 *
 * Website par aisa path chup-chap chal jata hai: file Hostinger ke root par
 * pehle se padi ho sakti hai, ya server redirect kar deta hai. APK mein koi
 * server nahi — origin local bundle hai, to wahi path 404 ban jata hai aur
 * feature phone par toot jata hai jabke web par theek dikhta rehta hai.
 *
 * Teacher book reader isi wajah se toota tha: '/book1.pdf' Hostinger par tha,
 * APK mein nahi. Yeh check isi class ko dobara ship hone se rokta hai.
 *
 *   node scripts/check-apk-missing-assets.cjs
 *
 * Findings milne par exit code 1.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const SEP = String.fromCharCode(92);
const norm = p => p.split(SEP).join('/');

/**
 * Jaan-boojh kar chhode gaye paths. Har entry ke saath wajah likhi hai —
 * bina wajah ke kuch yahan add na karein, warna check bekaar ho jayega.
 */
const ALLOW = [
  // Sirf ek comment ke andar misaal ke taur par likha hai, load nahi hota.
  '/books/book1.pdf',
  // Teacher reader apna PDF Firebase/Drive se leta hai; yeh sirf web ka
  // sasta same-origin fallback hai, aur uske naakaam hone par koi raasta
  // bacha hua hai.
  '/book1.pdf',
  '/book2.pdf',
  '/book3.pdf',
  '/book4.pdf',
  // Activity reader pehle local copy try karta hai, na mile to jsDelivr se
  // le aata hai (ActivityPage.tsx), to yeh 404 feature nahi torta - sirf
  // internet par mehtaj kar deta hai.
  '/kidba_assets/js/page-flip.browser.min.js',
];

if (!fs.existsSync(DIST)) {
  console.error('dist/ nahi mila - pehle `npm run build` chalayein.');
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    entry.isDirectory() ? walk(p) : files.push(p);
  }
})(DIST);

const shipped = new Set(files.map(f => '/' + norm(path.relative(DIST, f))));

const PATTERNS = [
  /(?:href|src)\s*=\s*["'](\/[^"'#?>\s]+)/g,
  /fetch\(\s*["'](\/[^"'?#]+)/g,
  /url:\s*["'](\/[^"'?#]+)/g,
  /["'](\/[a-zA-Z0-9_./-]+\.(?:pdf|json|mp3|mp4|m4a|webp|png|jpg|jpeg|svg|js|css|html))["']/g,
];

const missing = new Map();

for (const file of files.filter(f => /\.(html|js|json)$/.test(f))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      const url = match[1];
      // '//cdn...' protocol-relative hai, same-origin nahi.
      if (url.startsWith('//')) continue;
      if (ALLOW.includes(url)) continue;
      // SSG extension ke baghair route likhta hai.
      if (shipped.has(url) || shipped.has(url + '.html') || shipped.has(url + '/index.html')) continue;
      if (!missing.has(url)) missing.set(url, new Set());
      missing.get(url).add(norm(path.relative(DIST, file)));
    }
  }
}

const rows = [...missing.entries()].sort();

if (!rows.length) {
  console.log('OK - har same-origin path build output mein maujood hai.');
  process.exit(0);
}

console.error('Yeh same-origin paths build output mein nahi hain, to APK mein 404 denge:\n');
for (const [url, sources] of rows) {
  console.error('  ' + url);
  console.error('      <- ' + [...sources].join(', '));
}
console.error('\nHar ek ke liye: file ship karein, ya path ko absolute remote URL banayein,');
console.error('ya wajah likh kar ALLOW list mein daalein.');
process.exit(1);
