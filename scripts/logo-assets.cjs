// Regenerates every derived logo asset from one master image.
//
// Master: public/kidba_assets/img/logo.png
// Swap that file and re-run `node scripts/logo-assets.cjs` to refresh the
// splash logo, the favicon, the Android launcher icons and the Play Store icon.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const master = path.join(root, 'public', 'kidba_assets', 'img', 'logo.png');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// Launcher densities: [dir, legacy icon px, adaptive foreground px]
const densities = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
];

const written = [];

function record(file) {
  written.push(path.relative(root, file).replace(/\\/g, '/'));
}

// The master sits on a white field. Trim it so the artwork itself can be
// scaled to a known fraction of each icon canvas.
async function trimmed() {
  return sharp(master)
    .flatten({ background: WHITE })
    .trim({ background: '#ffffff', threshold: 12 })
    .png()
    .toBuffer();
}

// A filled circle, used as the white disc behind the art on masked icons.
function disc(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/>` +
      `</svg>`
  );
}

// Scale `art` to `fraction` of a `size` square and centre it on `background`.
async function iconFrom(art, size, fraction, background) {
  const inner = Math.round(size * fraction);
  const scaled = await sharp(art)
    .resize(inner, inner, { fit: 'inside', background: CLEAR })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: scaled, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(master)) throw new Error('master logo missing: ' + master);
  const art = await trimmed();

  // 1. Splash logo — the HTML splash in scripts/apk-splash.cjs reads this.
  const splashLogo = path.join(root, 'public', 'kidba_assets', 'img', 'splash_logo.jpg');
  fs.copyFileSync(master, splashLogo);
  record(splashLogo);

  // 2. Browser favicon.
  const favicon = path.join(root, 'public', 'kidba_assets', 'favicon.jpg');
  await sharp(master)
    .flatten({ background: WHITE })
    .resize(1024, null, { fit: 'inside' })
    .jpeg({ quality: 92 })
    .toFile(favicon);
  record(favicon);

  // 3. Android launcher icons.
  for (const [dir, legacy, foreground] of densities) {
    const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-' + dir);

    // Legacy square icon: art on the white field it was drawn against.
    fs.writeFileSync(
      path.join(resDir, 'ic_launcher.png'),
      await iconFrom(art, legacy, 0.82, WHITE)
    );
    record(path.join(resDir, 'ic_launcher.png'));

    // Round icon: white disc, transparent corners.
    const round = await sharp({
      create: { width: legacy, height: legacy, channels: 4, background: CLEAR },
    })
      .composite([
        { input: disc(legacy), gravity: 'centre' },
        {
          input: await sharp(art)
            .resize(Math.round(legacy * 0.66), Math.round(legacy * 0.66), {
              fit: 'inside',
              background: CLEAR,
            })
            .png()
            .toBuffer(),
          gravity: 'centre',
        },
      ])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(resDir, 'ic_launcher_round.png'), round);
    record(path.join(resDir, 'ic_launcher_round.png'));

    // Adaptive foreground: the launcher masks this, so the art stays inside
    // the 66/108 safe zone and the background colour fills the rest.
    fs.writeFileSync(
      path.join(resDir, 'ic_launcher_foreground.png'),
      await iconFrom(art, foreground, 0.58, CLEAR)
    );
    record(path.join(resDir, 'ic_launcher_foreground.png'));
  }

  // 4. Android 12 splash icon (windowSplashScreenAnimatedIcon).
  //
  // The platform masks this drawable: of the 288dp slot it draws into, only
  // the inner 192dp survives — two thirds. The old icon put the artwork across
  // 78% of its canvas, so the mask cut straight through the logo and the
  // splash showed a zoomed, clipped crop of it.
  //
  // So: a white disc at 66% of the canvas, exactly filling what the mask
  // keeps, with the artwork at 44% inside it — the same 2/3-of-2/3 an adaptive
  // launcher icon uses. Rendered large because the framework scales this to
  // the slot, and a small source is a blurry splash on a dense screen.
  const SPLASH_CANVAS = 512;
  const splashIcon = path.join(
    root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash_icon.png'
  );
  fs.writeFileSync(
    splashIcon,
    await sharp({
      create: { width: SPLASH_CANVAS, height: SPLASH_CANVAS, channels: 4, background: CLEAR },
    })
      .composite([
        { input: disc(Math.round(SPLASH_CANVAS * 0.66)), gravity: 'centre' },
        {
          input: await sharp(art)
            .resize(Math.round(SPLASH_CANVAS * 0.44), Math.round(SPLASH_CANVAS * 0.44), {
              fit: 'inside',
              background: CLEAR,
            })
            .png()
            .toBuffer(),
          gravity: 'centre',
        },
      ])
      .png()
      .toBuffer()
  );
  record(splashIcon);

  // 5. Play Store listing icon.
  const playIcon = path.join(root, 'play_store_assets', 'icon-512.png');
  if (fs.existsSync(path.dirname(playIcon))) {
    fs.writeFileSync(playIcon, await iconFrom(art, 512, 0.82, WHITE));
    record(playIcon);
  }

  // 6. Keep the checked-in APK payload copy in step with public/ so the
  //    payload server and a rebuild both show the same logo.
  const payload = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');
  if (fs.existsSync(payload)) {
    for (const rel of ['kidba_assets/img/logo.png', 'kidba_assets/img/splash_logo.jpg', 'kidba_assets/favicon.jpg']) {
      const dest = path.join(payload, rel);
      if (fs.existsSync(path.dirname(dest))) {
        fs.copyFileSync(path.join(root, 'public', rel), dest);
        record(dest);
      }
    }
  }

  console.log('logo assets regenerated from ' + path.relative(root, master));
  for (const f of written) console.log('  ' + f);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
