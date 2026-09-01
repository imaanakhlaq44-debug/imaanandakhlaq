import { html } from 'hono/html'

/*
  DEMO — scroll-driven hero film.

  The source is a 30s 1920x1080 mp4 (46.8 MB). Shipping that file as-is would
  undo the whole page-weight fix, and seeking a <video> on scroll stutters
  badly on mobile Safari, so the film is served as a WebP frame sequence and
  painted to a canvas:

    public/hero-film/f000..f119.webp   1024x576   3.38 MB   (desktop)
    public/hero-film/sm/                780x439   2.55 MB   (<=991px wide)

  Those sizes are below the pixels they get drawn at, on purpose. Side by side
  at the real render size, 1024/q46 is indistinguishable from 1280/q58 — the
  footage is soft, painterly and sits under a scrim — and it is a third
  lighter. Dropping frames was tried first and rejected: near-duplicate
  detection only recovered ~10% because the sparkle and lantern flicker keep
  every frame genuinely different, and thinning the city descent is what makes
  the scroll worth having in the first place.

  Only the frames the visitor actually scrolls past are fetched, and the first
  frame is drawn as soon as it lands so nothing is ever blank.

  Frame map (30.35s of footage over 120 frames):
    f000-f035  city at dawn, camera descends into the courtyard
    f040-f058  wall 1 - Curriculum Books
    f063-f078  wall 2 - Magic Coloring
    f084-f104  wall 3 - Audio Stories
    f110-f119  wall 4 - Live Puppet Show

  The footage runs out just as the puppet frame centres, so scroll maps to
  frames over the first 89% and the last 11% holds f119 — that gives the
  fourth beat the same room to breathe as the other three.
*/

const FRAME_COUNT = 120

// [start, end] in scroll progress (0..1), title, body, link label, href
const BEATS = [
  // starts below 0 so the very first screen already has the title on it
  [-0.06, 0.24, 'Explore Our World', 'A journey through the world of Imaan &amp; Akhlaq — where faith meets character, and learning becomes living.', '', ''],
  [0.29, 0.45, 'Curriculum Books', 'Stories that battle the whispers of Faasid — and plant seeds of faith at bedtime.', 'Open Library', '/products/books'],
  [0.47, 0.615, 'Magic Coloring', 'Interactive line art starring our heroes. Every page brings akhlaq to life in colour.', 'Start Painting', '/products/coloring'],
  [0.62, 0.79, 'Audio Stories', 'Narrated tales in English, Urdu and Arabic. Eyes closed, hearts wide open.', 'Listen Now', '/products/audio'],
  [0.83, 1.02, 'Live Puppet Shows', 'Invite Imaan &amp; Akhlaq to your school for a live, immersive performance.', 'Invite Us', '/products/puppet'],
]

export const HeroScrollFilm = () => html`
<style>
  .film { position: relative; height: 620vh; background: #0b1020; }
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

  /* Progress ticks — one per wall, so the visitor can see how far in they are. */
  .film-dots { position: absolute; right: 3vw; top: 50%; transform: translateY(-50%); z-index: 4; display: flex; flex-direction: column; gap: 12px; }
  .film-dots i { display: block; width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.28); transition: background 0.4s ease, transform 0.4s ease; }
  .film-dots i.on { background: #E08020; transform: scale(1.65); }

  @media (max-width: 991px) {
    .film { height: 560vh; }
    /* The film is a band across the top on phones, so the text sits below it
       rather than on top of it — and the scrim only needs to cover that half. */
    .beat { padding: 0 7vw 9vh; }
    .beat-title { font-size: clamp(2.3rem, 10vw, 3.2rem); }
    .film-scrim {
      background: linear-gradient(to top, rgba(11,16,32,0.97) 0%, rgba(11,16,32,0.92) 34%, rgba(11,16,32,0) 56%);
    }
    .film-dots { display: none; }
  }

  /* Motion off: no scrub, no sticky. One still frame, all four beats readable. */
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
  var BEATS = ${JSON.stringify(BEATS.map(b => [b[0], b[1]]))};
  var HOLD = 0.89; // frames finish here; the rest of the scroll holds the last one

  var section = document.querySelector('.film');
  var canvas = document.getElementById('filmCanvas');
  var hint = document.getElementById('filmHint');
  if (!section || !canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 991px)').matches;
  var dir = small ? '/hero-film/sm/' : '/hero-film/';

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

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 2 : 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawn = -1;
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
      var bandY = ch * 0.10, bandH = ch * 0.44;
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
      // Cover fit, then overscan and push the picture right, so the left third
      // stays plain wall for the text to sit on instead of covering the framed
      // artwork — which is the thing we want people to look at.
      var s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight) * 1.2;
      w = im.naturalWidth * s; h = im.naturalHeight * s;
      x = (cw - w) / 2 + cw * 0.11; y = (ch - h) / 2;
    }
    ctx.drawImage(im, x, y, w, h);
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
  function frameFor(p) {
    var i = Math.round((p / HOLD) * (COUNT - 1));
    return i < 0 ? 0 : i > COUNT - 1 ? COUNT - 1 : i;
  }

  // Only fetch what is just ahead of where the visitor actually is. Pulling
  // the whole sequence up front means someone who lands and leaves without
  // scrolling still pays for all 120 frames.
  var AHEAD = 20, BEHIND = 4;
  function ensureWindow(i) {
    var from = Math.max(0, i - BEHIND), to = Math.min(COUNT - 1, i + AHEAD);
    for (var k = from; k <= to; k++) load(k);
  }

  function update() {
    ticking = false;
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - window.innerHeight;
    var p = total > 0 ? clamp01(-rect.top / total) : 0;
    var i = frameFor(p);
    ensureWindow(i);
    paint(i);
    applyBeats(p);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  // ---- boot -------------------------------------------------------------
  fit();
  // first frame right away so the section is never an empty box
  load(0, function () { lastDrawn = -1; update(); });

  if (reduced) {
    // no scrubbing: one frame from inside the house, text is already visible
    load(46, function () { lastDrawn = -1; paint(46); });
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
