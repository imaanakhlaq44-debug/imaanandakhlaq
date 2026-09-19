import { html } from 'hono/html'

/*
  Scroll-driven hero film.

  The source is "Hero Final.mp4": 42.4s at 30fps. Scroll position picks the
  frame, exactly like the first film: nothing plays by itself. Seeking a
  <video> on scroll stutters badly on mobile Safari, so the film is served as
  a WebP frame sequence and painted to a canvas:

    public/hero-film-2/f000..f243.webp   1920x1080  q70  ~28 MB  (desktop)
    public/hero-film-2/sm/               854x480    q62  ~10 MB  (<=991px wide)

  The desktop frames are the source's full resolution, so a big monitor gets
  every bit of detail the video has. 1600x900 would be ~23 MB and looks the
  same on a 1080p screen (that is about the size the film is drawn at there),
  but a touch softer at 1440p; this can be revisited if traffic grows. The
  first film shipped 1024x576 frames with a 1.2x overscan, which on a big
  monitor was a 3x upscale and looked smeared.

  Which frames, and why not evenly spaced: inside each scene the camera moves
  slowly, and 4 frames a second (what the first film used) scrubs well. But
  the scenes are joined by fast right-to-left slides of about a second, and
  at 4 a second a slide was four big jumps, like a page being swiped. So the
  slides are taken at 15 frames a second. The frames are listed below from
  the same numbers the files were cut with (source frame = t * 30).

  Only the frames the visitor actually scrolls past are fetched, and the first
  frame is drawn as soon as it lands so nothing is ever blank.
*/

// Scenes, sampled at 4fps: [from s, to s)
const SCENES: [number, number][] = [[0, 16.8], [18.1, 21.75], [23.1, 26.75], [28.13, 31.75], [33.13, 37.0], [37.9, 42.4]]
// The slide out of each scene into the next, sampled at 15fps: [from s, to s)
const SLIDES: [number, number][] = [[16.8, 18.1], [21.75, 23.1], [26.75, 28.13], [31.75, 33.13], [37.0, 37.9]]

// Source frame number of every file, and whether it is part of a slide.
const FRAMES: [number, boolean][] = (() => {
  const out: [number, boolean][] = []
  SCENES.forEach(([a, b], i) => {
    for (let t = a; t < b - 1e-6; t += 0.25) out.push([Math.round(t * 30), false])
    const s = SLIDES[i]
    if (s) for (let n = Math.round(s[0] * 30); n < Math.round(s[1] * 30); n += 2) out.push([n, true])
  })
  out.push([1271, false]) // the very last frame
  const seen = new Set<number>()
  return out.filter(([n]) => !seen.has(n) && !!seen.add(n)).sort((x, y) => x[0] - y[0])
})()
const FRAME_COUNT = FRAMES.length

// Where each frame sits along the scroll (0..1). A scene frame gets a full
// step, a slide frame 0.8 of one, so a slide takes about as much scroll as
// four seconds of scene: slow enough to read as a movement.
const FRAME_POS = (() => {
  const w = FRAMES.map(([, slide]) => (slide ? 0.8 : 1))
  const total = w.slice(1).reduce((s, x) => s + x, 0)
  let at = 0
  return w.map((x, i) => {
    if (i) at += x
    return +(at / total).toFixed(5)
  })
})()

// Frames finish at HOLD of the scroll; the rest holds the last one.
const HOLD = 0.92
// Scroll progress at which the footage reaches t seconds.
function timeP(t: number): number {
  const i = FRAMES.findIndex(([n]) => n >= t * 30)
  return (i < 0 ? 1 : FRAME_POS[i]) * HOLD
}

// [start, end] in scroll progress (0..1), title, body, link label, href.
// Each beat sits on the still part of its scene, so it is never on screen
// during a slide.
const BEATS = [
  // starts below 0 so the very first screen already has the title on it
  [-0.06, timeP(9), 'Explore Our World', 'A journey through the world of Imaan &amp; Akhlaq — where faith meets character, and learning becomes living.', '', ''],
  [timeP(12.3), timeP(16.8), 'Curriculum Books', 'Stories that battle the whispers of Faasid — and plant seeds of faith at bedtime.', 'Open Library', '/products/books'],
  [timeP(18.1), timeP(21.75), 'Magic Coloring', 'Interactive line art starring our heroes. Every page brings akhlaq to life in colour.', 'Start Painting', '/products/coloring'],
  [timeP(23.1), timeP(26.75), 'Audio Stories', 'Narrated tales in English, Urdu and Arabic. Eyes closed, hearts wide open.', 'Listen Now', '/products/audio'],
  [timeP(28.13), timeP(31.75), 'Live Puppet Shows', 'Invite Imaan &amp; Akhlaq to your school for a live, immersive performance.', 'Invite Us', '/products/puppet'],
  [timeP(33.13), timeP(37.0), 'Gamification of Learning', 'Urdu, ABC and maths games where every right answer is a little win.', 'Play Now', '/products/games'],
  [timeP(37.9), 1.02, 'Animated Series', 'Imaan, Akhlaq and their families on screen: character stories for the whole household.', 'Watch Now', '/media/videos'],
]

export const HeroScrollFilm = () => html`
<style>
  .film { position: relative; height: 1100vh; background: #0b1020; }
  .film-stage {
    position: sticky; top: 0; height: 100vh; overflow: hidden;
    background: #0b1020;
  }
  .film-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

  /* Keeps the text legible over both the bright walls and the dark city. */
  .film-scrim {
    position: absolute; inset: 0; pointer-events: none; z-index: 2;
    background:
      linear-gradient(to top, rgba(8,12,28,0.82) 0%, rgba(8,12,28,0.45) 26%, rgba(8,12,28,0) 52%),
      linear-gradient(to right, rgba(8,12,28,0.55) 0%, rgba(8,12,28,0) 46%);
  }

  .film-beats { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
  .beat {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 0 6vw 11vh; max-width: 780px;
    opacity: 0; will-change: opacity;
  }
  .beat > * { will-change: transform, opacity, filter; }

  .beat-kicker {
    display: inline-block; font-family: 'Nunito', sans-serif; font-size: 0.82rem;
    font-weight: 800; letter-spacing: 3px; text-transform: uppercase;
    color: #FDBA5C; margin-bottom: 14px;
  }
  .beat-title {
    font-family: 'Fredoka One', cursive; color: #fff; margin: 0 0 18px;
    font-size: clamp(2.6rem, 6.4vw, 5.2rem); line-height: 1.02;
    text-shadow: 0 14px 40px rgba(0,0,0,0.55);
  }
  .beat-rule {
    height: 5px; width: 132px; border-radius: 5px; margin-bottom: 20px;
    background: linear-gradient(90deg, #D63678, #E08020);
    transform-origin: left center;
  }
  .beat-body {
    font-family: 'Nunito', sans-serif; color: rgba(255,255,255,0.93);
    font-size: clamp(1.02rem, 1.7vw, 1.3rem); line-height: 1.62;
    max-width: 620px; margin: 0 0 26px; text-shadow: 0 4px 18px rgba(0,0,0,0.5);
  }
  .beat-link {
    pointer-events: auto; display: inline-block; text-decoration: none;
    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 1rem;
    color: #fff; padding: 13px 30px; border-radius: 40px;
    background: linear-gradient(90deg, #D63678, #E08020);
    box-shadow: 0 10px 26px rgba(214,54,120,0.42);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .beat-link:hover { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(214,54,120,0.55); }

  .film-hint {
    position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%);
    z-index: 4; color: rgba(255,255,255,0.72); font-family: 'Nunito', sans-serif;
    font-size: 0.78rem; letter-spacing: 3px; text-transform: uppercase;
    display: flex; flex-direction: column; align-items: center; gap: 9px;
  }
  .film-hint span { display: block; width: 1px; height: 34px; background: linear-gradient(#fff9, #fff0); animation: hintDrop 1.9s ease-in-out infinite; }
  @keyframes hintDrop { 0%, 100% { transform: scaleY(0.35); transform-origin: top; opacity: 0.4; } 50% { transform: scaleY(1); transform-origin: top; opacity: 1; } }

  /* Progress ticks — one per chapter, so the visitor can see how far in they are. */
  .film-dots { position: absolute; right: 3vw; top: 50%; transform: translateY(-50%); z-index: 4; display: flex; flex-direction: column; gap: 12px; }
  .film-dots i { display: block; width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.28); transition: background 0.4s ease, transform 0.4s ease; }
  .film-dots i.on { background: #E08020; transform: scale(1.65); }

  @media (max-width: 991px) {
    .film { height: 1000vh; }
    /* The film is a band across the top on phones, so the text sits below it
       rather than on top of it — and the scrim only needs to cover that half. */
    .beat { padding: 0 7vw 9vh; }
    .beat-title { font-size: clamp(2.3rem, 10vw, 3.2rem); }
    .film-scrim {
      background: linear-gradient(to top, rgba(11,16,32,0.97) 0%, rgba(11,16,32,0.92) 34%, rgba(11,16,32,0) 56%);
    }
    .film-dots { display: none; }
  }

  /* Motion off: no scrub, no sticky. One still frame, every beat readable. */
  @media (prefers-reduced-motion: reduce) {
    .film { height: auto; }
    .film-stage { position: relative; height: auto; }
    .film-canvas { position: relative; height: 56vh; }
    .film-beats { position: relative; inset: auto; }
    .beat { position: relative; opacity: 1 !important; padding: 34px 6vw; max-width: none; }
    .beat > * { transform: none !important; filter: none !important; opacity: 1 !important; }
    .film-hint, .film-scrim { display: none; }
  }
</style>

<section class="film" id="home">
  <div class="film-stage">
    <canvas class="film-canvas" id="filmCanvas"></canvas>
    <div class="film-scrim"></div>

    <div class="film-beats">
      ${BEATS.map(
        ([, , title, body, cta, href], i) => html`
      <div class="beat" data-beat="${i}">
        ${i === 0 ? html`<span class="beat-kicker">Imaan &amp; Akhlaq</span>` : html`<span class="beat-kicker">Chapter ${String(i)}</span>`}
        <h1 class="beat-title">${html([title as string] as any)}</h1>
        <div class="beat-rule"></div>
        <p class="beat-body">${html([body as string] as any)}</p>
        ${cta ? html`<a class="beat-link" href="${href as string}">${cta}</a>` : ''}
      </div>`
      )}
    </div>

    <div class="film-dots">
      ${BEATS.slice(1).map((_, i) => html`<i data-dot="${i + 1}"></i>`)}
    </div>

    <div class="film-hint" id="filmHint">Scroll<span></span></div>
  </div>
</section>

<script>
(function () {
  var COUNT = ${FRAME_COUNT};
  var BEATS = ${JSON.stringify(BEATS.map(b => [+(+b[0]).toFixed(5), +(+b[1]).toFixed(5)]))};
  var HOLD = ${HOLD}; // frames finish here; the rest of the scroll holds the last one
  var POS = ${JSON.stringify(FRAME_POS)}; // each frame's place along the scroll, 0..1

  var section = document.querySelector('.film');
  var canvas = document.getElementById('filmCanvas');
  var hint = document.getElementById('filmHint');
  if (!section || !canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 991px)').matches;
  var dir = small ? '/hero-film-2/sm/' : '/hero-film-2/';

  var ctx = canvas.getContext('2d', { alpha: false });
  var frames = new Array(COUNT);
  var ready = new Array(COUNT); // which frames have decoded
  var lastDrawn = -1;

  function src(i) { return dir + 'f' + String(i).padStart(3, '0') + '.webp'; }

  function load(i, cb) {
    if (frames[i]) return;
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { ready[i] = true; if (cb) cb(); };
    im.src = src(i);
    frames[i] = im;
  }

  // Nearest decoded frame at or before i, so a fast scroll shows the closest
  // thing we have instead of going blank.
  function nearest(i) {
    for (var d = 0; d < COUNT; d++) {
      if (ready[i - d]) return i - d;
      if (ready[i + d]) return i + d;
    }
    return -1;
  }

  // The site header is sticky too, and it used to sit on top of the stage and
  // hide the titles baked into the top of the film. So the stage sticks just
  // below it instead. The header shrinks once the page scrolls (the top bar
  // folds away), which is why this is re-measured on every update.
  var stage = section.querySelector('.film-stage');
  var header = document.getElementById('siteHeader');
  var headH = -1;
  function syncHeader() {
    if (reduced || !stage) return false;
    var hh = header ? header.offsetHeight : 0;
    if (hh === headH) return false;
    headH = hh;
    stage.style.top = hh + 'px';
    stage.style.height = 'calc(100vh - ' + hh + 'px)';
    return true;
  }

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawn = -1;
  }

  // A blur without ctx.filter, which is too slow to run on every scroll frame:
  // shrink the frame to a thumbnail, then stretch that back over the whole
  // canvas and let the smoothing do the blurring.
  var thumb = document.createElement('canvas');
  thumb.width = 48; thumb.height = 27;
  var tctx = thumb.getContext('2d');
  function paintBackdrop(im, cw, ch) {
    tctx.drawImage(im, 0, 0, thumb.width, thumb.height);
    var bs = Math.max(cw / thumb.width, ch / thumb.height);
    var bw = thumb.width * bs, bh = thumb.height * bs;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(thumb, (cw - bw) / 2, (ch - bh) / 2, bw, bh);
    ctx.fillStyle = 'rgba(8,12,28,0.55)';
    ctx.fillRect(0, 0, cw, ch);
  }

  function paint(i) {
    var f = nearest(i);
    if (f < 0 || f === lastDrawn) return;
    var im = frames[f];
    if (!im || !im.naturalWidth) return;
    var cw = canvas.width, ch = canvas.height;
    var w, h, x, y;
    if (small) {
      // A phone is far taller than 16:9. Covering it would crop the framed
      // picture down to its middle and blow it up until it's mush, so the film
      // plays inside a band across the upper half and the text gets the space
      // underneath it.
      // the stage already starts below the header, so the band starts at the top
      var bandY = 0, bandH = ch * 0.48;
      var ms = Math.max(cw / im.naturalWidth, bandH / im.naturalHeight);
      w = im.naturalWidth * ms; h = im.naturalHeight * ms;
      x = (cw - w) / 2; y = bandY + (bandH - h) / 2;
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, cw, ch);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, bandY, cw, bandH);
      ctx.clip();
      ctx.drawImage(im, x, y, w, h);
      ctx.restore();
      lastDrawn = f;
      return;
    } else {
      var iw = im.naturalWidth, ih = im.naturalHeight;
      if (cw / ch > iw / ih) {
        // Wider than 16:9, which is most desktops once the header is taken
        // off the height. Cover would have to cut the top or the bottom of
        // every scene, and both carry something (titles up top, the
        // characters' feet and the book stack below). So the whole frame is
        // shown, and the strips either side get the same frame blurred and
        // dimmed rather than a flat bar.
        var s = ch / ih;
        w = iw * s; h = ch;
        x = (cw - w) / 2; y = 0;
        paintBackdrop(im, cw, ch);
      } else {
        // Narrower than 16:9: cover, trimming the sides equally. The titles
        // sit in the middle of the frame, so nothing that matters is lost.
        var s2 = ch / ih;
        w = iw * s2; h = ch;
        x = (cw - w) / 2; y = 0;
      }
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, x, y, w, h);
    if (x > 0) {
      // soften the seam between the frame and the blurred strips
      var fw = Math.min(x, w * 0.06);
      var gl = ctx.createLinearGradient(x, 0, x + fw, 0);
      gl.addColorStop(0, 'rgba(8,12,28,0.6)'); gl.addColorStop(1, 'rgba(8,12,28,0)');
      ctx.fillStyle = gl; ctx.fillRect(x, 0, fw, ch);
      var gr = ctx.createLinearGradient(x + w, 0, x + w - fw, 0);
      gr.addColorStop(0, 'rgba(8,12,28,0.6)'); gr.addColorStop(1, 'rgba(8,12,28,0)');
      ctx.fillStyle = gr; ctx.fillRect(x + w - fw, 0, fw, ch);
    }
    lastDrawn = f;
  }

  // ---- text beats -------------------------------------------------------
  var beatEls = [].slice.call(document.querySelectorAll('.beat'));
  var dotEls = [].slice.call(document.querySelectorAll('.film-dots i'));

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function applyBeats(p) {
    for (var i = 0; i < beatEls.length; i++) {
      var b = BEATS[i], start = b[0], end = b[1];
      var span = end - start;
      var t = (p - start) / span;               // 0..1 across the beat
      var vis = 0, enter = 0;
      if (t >= -0.35 && t <= 1.35) {
        // Snappy in, snappy out — a slow ramp leaves the copy sitting at half
        // opacity for most of the beat, which reads as unfinished rather than
        // as a fade. The blank stretches between beats are deliberate: that is
        // where the camera is travelling from one wall to the next.
        enter = clamp01(t / 0.20);
        // the closing beat never fades — it is the last thing on screen
        var exit = (i === beatEls.length - 1) ? 1 : clamp01((1 - t) / 0.15);
        vis = Math.min(enter, exit);
      }
      var el = beatEls[i];
      el.style.opacity = vis;
      if (vis <= 0) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = 'visible';

      // staggered reveal: kicker, title, rule, body, link
      var kids = el.children;
      for (var k = 0; k < kids.length; k++) {
        var delay = k * 0.13;
        var a = ease(clamp01((enter - delay) / (1 - delay || 1)));
        var kid = kids[k];
        if (kid.classList.contains('beat-rule')) {
          kid.style.transform = 'scaleX(' + a + ')';
          kid.style.opacity = a;
        } else {
          kid.style.transform = 'translateY(' + ((1 - a) * 30).toFixed(2) + 'px)';
          kid.style.opacity = a;
          kid.style.filter = a > 0.98 ? 'none' : 'blur(' + ((1 - a) * 7).toFixed(2) + 'px)';
        }
      }
      for (var d = 0; d < dotEls.length; d++) dotEls[d].classList.toggle('on', d + 1 === i);
    }
    if (hint) hint.style.opacity = clamp01(1 - p * 9);
  }

  // ---- scroll driver ----------------------------------------------------
  var ticking = false;
  // Nearest frame to where the scroll is. FRAME_POS is sorted, so a binary
  // search finds the pair either side of it.
  function frameFor(p) {
    var q = p / HOLD;
    if (q <= 0) return 0;
    if (q >= 1) return COUNT - 1;
    var lo = 0, hi = COUNT - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (POS[mid] <= q) lo = mid; else hi = mid;
    }
    return q - POS[lo] < POS[hi] - q ? lo : hi;
  }

  // Only fetch what is just ahead of where the visitor actually is. Pulling
  // the whole sequence up front means someone who lands and leaves without
  // scrolling still pays for all of the frames.
  var AHEAD = 24, BEHIND = 4;
  function ensureWindow(i) {
    var from = Math.max(0, i - BEHIND), to = Math.min(COUNT - 1, i + AHEAD);
    for (var k = from; k <= to; k++) load(k);
  }

  function update() {
    ticking = false;
    if (syncHeader()) fit();
    // The stage is stuck from when the section's top reaches the header until
    // its bottom reaches the bottom of the window.
    var off = headH > 0 ? headH : 0;
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - (window.innerHeight - off);
    var p = total > 0 ? clamp01((off - rect.top) / total) : 0;
    var i = frameFor(p);
    ensureWindow(i);
    paint(i);
    applyBeats(p);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  // ---- boot -------------------------------------------------------------
  syncHeader();
  fit();
  // first frame right away so the section is never an empty box
  load(0, function () { lastDrawn = -1; update(); });

  if (reduced) {
    // no scrubbing: one frame from inside the house, text is already visible
    load(60, function () { lastDrawn = -1; paint(60); });
    return;
  }

  // Enough of the opening to cover the first screen and a little scroll; the
  // rest arrives through ensureWindow() as the visitor moves.
  ensureWindow(0);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    small = window.matchMedia('(max-width: 991px)').matches;
    fit(); update();
  });
  update();
})();
</script>
`
