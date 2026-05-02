// Generates Play Store listing assets:
//   1. icon-512.png         (512x512, required by Play Console)
//   2. feature-graphic.png  (1024x500, required by Play Console)
//
// Source images:
//   - public/kidba_assets/img/splash_logo.jpg  (brand logo with characters)
//   - public/hero_bg.png                       (1024x1024 background)
//
// Output: play_store_assets/

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'play_store_assets');
const SPLASH_LOGO = path.join(ROOT, 'public', 'kidba_assets', 'img', 'splash_logo.jpg');
const HERO_BG = path.join(ROOT, 'public', 'hero_bg.png');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function makeIcon512() {
  // Pad splash_logo (1024x848) into a 1024x1024 white square, then resize to 512.
  // Play Console requires no transparency / 32-bit PNG.
  const padded = await sharp(SPLASH_LOGO)
    .resize({
      width: 1024,
      height: 1024,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const out = path.join(OUT_DIR, 'icon-512.png');
  await sharp(padded).resize(512, 512).png({ compressionLevel: 9 }).toFile(out);
  const m = await sharp(out).metadata();
  console.log('icon-512.png ::', m.width + 'x' + m.height, '::', fs.statSync(out).size + ' bytes');
}

async function makeFeatureGraphic() {
  // 1024x500 banner. Gradient (sky blue -> warm) with the logo composited on the right.
  const W = 1024, H = 500;

  // Build a horizontal gradient SVG.
  const gradientSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFE9B0"/>
          <stop offset="50%" stop-color="#FFC1D6"/>
          <stop offset="100%" stop-color="#A7D8FF"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <text x="60" y="180" font-family="Arial Black, Arial, sans-serif" font-size="72" font-weight="900" fill="#1B2A6B">Imaan &amp;</text>
      <text x="60" y="260" font-family="Arial Black, Arial, sans-serif" font-size="72" font-weight="900" fill="#D8197A">Akhlaq</text>
      <text x="62" y="320" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#1B2A6B">Islamic learning for kids</text>
      <text x="62" y="360" font-family="Arial, sans-serif" font-size="22" font-weight="400" fill="#1B2A6B" opacity="0.85">Stories • Quran • Adab • Qibla • Tasbeeh</text>
    </svg>
  `);

  // Resize the splash logo (1024x848) to fit the right half (~500x500), keep aspect.
  const logoBuf = await sharp(SPLASH_LOGO)
    .resize({ width: 560, height: 460, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .removeAlpha()
    .png()
    .toBuffer();

  // Convert white background to transparent via threshold — sharp doesn't do this directly,
  // so we just place it on the gradient as-is (it already has white bg which blends OK).
  // Better: extract the centre subject only by trimming background.
  const trimmed = await sharp(SPLASH_LOGO)
    .trim({ threshold: 10 })
    .resize({ width: 480, height: 440, fit: 'inside' })
    .png()
    .toBuffer();
  const trimMeta = await sharp(trimmed).metadata();

  const out = path.join(OUT_DIR, 'feature-graphic.png');
  await sharp(gradientSvg)
    .composite([
      {
        input: trimmed,
        left: W - trimMeta.width - 30,
        top: Math.round((H - trimMeta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);

  const m = await sharp(out).metadata();
  console.log('feature-graphic.png ::', m.width + 'x' + m.height, '::', fs.statSync(out).size + ' bytes');
}

(async () => {
  console.log('Source images:');
  console.log('  splash_logo:', SPLASH_LOGO, fs.existsSync(SPLASH_LOGO) ? 'OK' : 'MISSING');
  console.log('  hero_bg    :', HERO_BG, fs.existsSync(HERO_BG) ? 'OK' : 'MISSING');
  console.log('Output dir :', OUT_DIR);
  console.log('---');
  await makeIcon512();
  await makeFeatureGraphic();
  console.log('---');
  console.log('DONE. Files in', OUT_DIR);
})().catch((e) => { console.error(e); process.exit(1); });
