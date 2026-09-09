// Replace the welcome poster shown on the login page.
//
// The poster is one image, public/kidba_assets/img/welcome-banner.webp, used
// by both the website and the app. This takes whatever the designer exported
// — a PNG, a JPEG, a webp, any size — and writes it out the way the page
// expects it: 900px wide, webp, quality high enough that the Arabic on it
// stays crisp, small enough that a phone on a weak signal still shows it
// before the login form is needed.
//
// Run:  node scripts/set-welcome-banner.cjs <path-to-the-new-image>
//
// Then rebuild. Nothing else references the file by any other name, so the
// swap is the whole change.
//
// If the artwork itself changed rather than just being re-exported, bump
// BANNER_VERSION in src/components/AuthPage.tsx as well: the poster is shown
// once a calendar day, so somebody who already saw today's would otherwise
// not meet the new one until tomorrow.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.join(__dirname, '..');
const OUT = path.join(projectRoot, 'public', 'kidba_assets', 'img', 'welcome-banner.webp');

// The width the page displays it at on the largest screen that shows it.
// Anything wider is bytes nobody sees; anything narrower is soft text.
const WIDTH = 900;
const QUALITY = 82;

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Usage: node scripts/set-welcome-banner.cjs <path-to-the-new-image>');
    process.exit(1);
  }
  if (!fs.existsSync(source)) {
    console.error('No such file: ' + source);
    process.exit(1);
  }

  const input = sharp(source);
  const meta = await input.metadata();
  if (!meta.width || !meta.height) {
    console.error(source + ' is not an image sharp can read.');
    process.exit(1);
  }
  // A poster is portrait. A landscape file here is almost always the wrong
  // export, and it would be letterboxed into the overlay rather than filling
  // it, so say so rather than quietly shipping it.
  if (meta.width > meta.height) {
    console.error(
      'That image is landscape (' + meta.width + 'x' + meta.height + '). The ' +
      'welcome poster is portrait — check this is the right export.'
    );
    process.exit(1);
  }

  const before = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
  await input
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(OUT + '.tmp');
  fs.renameSync(OUT + '.tmp', OUT);

  const after = fs.statSync(OUT).size;
  const out = await sharp(OUT).metadata();
  console.log(
    'welcome-banner.webp: ' + out.width + 'x' + out.height + ', ' +
    (after / 1024).toFixed(0) + ' KB' +
    (before ? ' (was ' + (before / 1024).toFixed(0) + ' KB)' : '')
  );
  console.log('Source was ' + meta.width + 'x' + meta.height + ' ' + meta.format + '.');
  console.log('Now run: npm run build   (website)  or  npm run build:apk   (app)');
}

main().catch((e) => { console.error(e); process.exit(1); });
