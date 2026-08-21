/**
 * Pull a scroll-scrub frame sequence out of public/demo/hero-source.mp4.
 *
 * Scrubbing an mp4 by setting video.currentTime tops out around 7fps: every
 * seek decodes forward from the previous keyframe, so most requested frames
 * never render and the hero moves in jumps. A pre-extracted frame sequence
 * has no seek at all — the scroll handler just draws the nearest image.
 *
 * There is no ffmpeg on this machine, so the decoding is done by the Chrome
 * that puppeteer already ships: seek, draw to a canvas, encode WebP, write.
 *
 *   node scripts/extract-hero-frames.cjs [--frames 180] [--width 1280] [--quality 0.8]
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer');
const sharp = require('sharp');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i === -1 ? fallback : Number(args[i + 1]);
};

const FRAMES = arg('frames', 120);
const QUALITY = arg('quality', 0.68);
// One decode pass feeds every size, so widths are cheap to add. The page
// picks a set by viewport; phones never pay for the desktop pixels.
const listArg = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i === -1 ? fallback : args[i + 1].split(',').map(Number);
};
const WIDTHS = listArg('widths', [1280, 720]);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUT_ROOT = path.join(PUBLIC_DIR, 'demo', 'hero-frames');
const SOURCE = '/demo/hero-source.mp4';

(async () => {
  if (!fs.existsSync(path.join(PUBLIC_DIR, SOURCE.slice(1)))) {
    throw new Error('missing public' + SOURCE);
  }
  for (const w of WIDTHS) {
    const dir = path.join(OUT_ROOT, String(w));
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  }

  // Serve over http so the canvas stays untainted — a file:// video would
  // poison toDataURL with a SecurityError.
  const app = express();
  // A real 200 page to work from: Chrome refuses media loads initiated by an
  // error page, and public/ has no index.html of its own.
  app.get('/__extract', (_req, res) => {
    res.type('html').send('<!doctype html><meta charset="utf-8"><body></body>');
  });
  app.use(express.static(PUBLIC_DIR));
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const origin = 'http://127.0.0.1:' + server.address().port;

  // puppeteer's own Chrome was never downloaded here, and the bundled
  // Chromium would lack the H.264 decoder anyway. Borrow the installed
  // browser — puppeteer still runs it on a throwaway profile.
  const installed = [
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => p && fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: installed || undefined,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });

  try {
    const page = await browser.newPage();
    // Land on the server's own origin so SOURCE resolves and the canvas
    // stays same-origin with the video.
    await page.goto(origin + '/__extract', { waitUntil: 'domcontentloaded' });
    await page.evaluate((src) => {
      document.body.innerHTML = '<video id="v" muted playsinline preload="auto"></video>';
      document.getElementById('v').src = src;
    }, SOURCE);

    const meta = await page.evaluate(() => new Promise((resolve, reject) => {
      const v = document.getElementById('v');
      v.addEventListener('error', () => reject(new Error(
        'video error ' + (v.error && v.error.code) + ': ' + (v.error && v.error.message)
      )));
      const fail = setTimeout(() => reject(new Error(
        'video never loaded — readyState ' + v.readyState + ', network ' + v.networkState +
        ', canPlay "' + v.canPlayType('video/mp4; codecs="avc1.42E01E"') + '"'
      )), 30000);
      const ok = () => {
        if (!v.videoWidth) return;
        clearTimeout(fail);
        resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      };
      v.addEventListener('loadeddata', ok);
      v.addEventListener('canplaythrough', ok);
      v.load();
    }));

    // Decode once at full size; sharp derives every delivery width from that.
    const grabW = Math.min(meta.width, Math.max.apply(null, WIDTHS.concat([1280])));
    const grabH = Math.round((grabW * meta.height) / meta.width / 2) * 2;
    console.log(
      'source %dx%d %ss -> %d frames, widths %s',
      meta.width, meta.height, meta.duration.toFixed(2), FRAMES, WIDTHS.join('/')
    );

    await page.evaluate((w, h) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.id = 'c';
      document.body.appendChild(c);
    }, grabW, grabH);

    // Stop one frame short of the end: the very last timestamp is often
    // unseekable and would hang waiting for a 'seeked' that never fires.
    const span = meta.duration - 0.05;
    const bytes = {};
    for (const w of WIDTHS) bytes[w] = 0;

    for (let i = 0; i < FRAMES; i++) {
      const t = (i / (FRAMES - 1)) * span;
      const dataUrl = await page.evaluate(async (time) => {
        const v = document.getElementById('v');
        const c = document.getElementById('c');
        await new Promise((resolve) => {
          const done = () => { v.removeEventListener('seeked', done); resolve(); };
          v.addEventListener('seeked', done);
          v.currentTime = time;
          setTimeout(resolve, 4000);
        });
        // Wait for the decoded frame to actually be presented, not just for
        // the seek to be acknowledged.
        if (v.requestVideoFrameCallback) {
          await new Promise((resolve) => {
            v.requestVideoFrameCallback(() => resolve());
            setTimeout(resolve, 400);
          });
        }
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        // Hand off as near-lossless JPEG and let sharp do the real encoding —
        // Chrome's canvas WebP encoder barely responds to the quality knob on
        // grainy footage (0.75 and 0.45 came out within 25% of each other).
        return c.toDataURL('image/jpeg', 0.95);
      }, t);

      if (!dataUrl.startsWith('data:image/jpeg')) {
        throw new Error('canvas encode failed, got ' + dataUrl.slice(0, 30));
      }
      const raw = Buffer.from(dataUrl.split(',')[1], 'base64');
      const name = 'f' + String(i).padStart(3, '0') + '.webp';

      for (const w of WIDTHS) {
        const buf = await sharp(raw)
          .resize({ width: w })
          .webp({ quality: Math.round(QUALITY * 100), effort: 6, smartSubsample: true })
          .toBuffer();
        bytes[w] += buf.length;
        fs.writeFileSync(path.join(OUT_ROOT, String(w), name), buf);
      }
      if (i % 20 === 0 || i === FRAMES - 1) {
        process.stdout.write('  frame ' + (i + 1) + '/' + FRAMES + '\r');
      }
    }

    console.log('');
    for (const w of WIDTHS) {
      console.log(
        '  %dw: %d frames, %s MB total (avg %s KB)',
        w, FRAMES, (bytes[w] / 1048576).toFixed(2), (bytes[w] / FRAMES / 1024).toFixed(1)
      );
    }
    fs.writeFileSync(
      path.join(OUT_ROOT, 'manifest.json'),
      JSON.stringify({ frames: FRAMES, widths: WIDTHS, aspect: +(meta.width / meta.height).toFixed(4) }, null, 2)
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
