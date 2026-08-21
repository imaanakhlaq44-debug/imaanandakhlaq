import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { activeChildHelpersJS } from '../lib/activeChild'

/**
 * The daily reading — one day at a time, for the parent to read and then talk
 * about with their child.
 *
 * The content is the 133-day plan in public/kidba_assets/data/chapters_data.json:
 * a value, a verse, a hadith, a story, a reflection and a tip for the parent.
 * It was written for exactly this and until now only appeared inside the
 * "Family Sync Time" gate on the activity page — which only self-study
 * (`individual`) learners ever trigger, and only when saving work. A
 * school-provisioned family had no way to reach any of it.
 *
 * The first version of this page was built on the book chapters instead, whose
 * per-chapter parent guidance is a template a script filled in. That was the
 * wrong source; this is the right one.
 *
 * Behaviour the plan needs:
 *   - opening it goes straight to the current day, not to a list;
 *   - leaving and coming back shows the SAME day again — the day only moves
 *     when the parent says they are done with it;
 *   - any earlier day can be reopened and read again, without disturbing
 *     where the family is up to.
 *
 * How far a family has read lives in the child's game_state as
 * `parent_content_index` — the 0-based index of the next unread day, which is
 * what the Parent Gate already means by that field, so the two stay in step.
 * The Firestore rules let a family write game_state on its own children.
 */
export const ReadingPlanPage = () => html`
<style>
  .rp-body {
    --rp-pink: #D63678;
    --rp-orange: #E08020;
    --rp-navy: #1E2D5A;
    --rp-tan: #C99A6B;
    --rp-cream: #FDF8F5;
    --rp-ink: #22314F;
    --rp-muted: #6B7A94;
    --rp-line: #EADFD8;
    --rp-head: 'Fredoka One', cursive;
    --rp-text: 'Nunito', system-ui, sans-serif;

    background: var(--rp-cream);
    min-height: 100vh;
    font-family: var(--rp-text);
    color: var(--rp-ink);
    padding-bottom: 96px;
  }

  /* A measure that stays comfortable to read. The story runs to several
     hundred words, which is why this is a reading column and not a card grid. */
  .rp-shell { max-width: 660px; margin: 0 auto; padding: 0 20px 40px; }

  /* Topbar ---------------------------------------------------------------- */
  .rp-topbar {
    position: sticky; top: 0; z-index: 30;
    background: rgba(253, 248, 245, .94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--rp-line);
    padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .rp-back {
    flex: none; width: 38px; height: 38px; border-radius: 999px;
    border: 1px solid var(--rp-line); background: #fff;
    color: var(--rp-navy); font-size: .95rem; cursor: pointer;
    display: grid; place-items: center;
  }
  .rp-back:hover { background: #fff6f1; }
  .rp-topbar-text { min-width: 0; flex: 1 1 auto; }
  .rp-kicker {
    font-size: .66rem; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: var(--rp-pink);
  }
  .rp-topbar-name {
    font-family: var(--rp-head); color: var(--rp-navy); font-size: 1rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rp-archive-btn {
    flex: none; border: 1px solid var(--rp-line); background: #fff;
    color: var(--rp-navy); border-radius: 999px; cursor: pointer;
    font-family: var(--rp-text); font-weight: 800; font-size: .74rem;
    padding: 8px 14px; display: inline-flex; align-items: center; gap: 6px;
  }
  .rp-archive-btn:hover { background: #fff6f1; }

  /* Day header ------------------------------------------------------------ */
  .rp-day-head { padding: 26px 0 4px; }
  .rp-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
  .rp-value-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 999px;
    font-weight: 800; font-size: .72rem; letter-spacing: .06em;
    text-transform: uppercase; color: #fff;
  }
  .rp-value-pill small { opacity: .85; font-weight: 700; letter-spacing: .04em; }
  .rp-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 13px; border-radius: 999px;
    background: #fff; border: 1px solid var(--rp-line);
    font-weight: 800; font-size: .72rem; color: var(--rp-muted);
  }
  .rp-title {
    font-family: var(--rp-head); font-weight: 400;
    font-size: 1.85rem; line-height: 1.22; color: var(--rp-navy);
    margin: 0 0 14px; letter-spacing: .2px;
  }
  .rp-intro {
    font-size: 1.02rem; line-height: 1.75; color: var(--rp-ink);
    margin: 0;
  }

  .rp-progress-line {
    display: flex; align-items: center; gap: 10px; margin-top: 18px;
    font-size: .76rem; font-weight: 800; color: var(--rp-muted);
  }
  .rp-progress-track {
    flex: 1 1 auto; height: 6px; border-radius: 999px;
    background: #F0E4DC; overflow: hidden;
  }
  .rp-progress-fill { height: 100%; border-radius: 999px; background: var(--rp-pink); }

  /* Blocks ---------------------------------------------------------------- */
  .rp-block { margin-top: 26px; }
  .rp-block-label {
    display: flex; align-items: center; gap: 8px;
    font-size: .68rem; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; margin-bottom: 10px;
  }
  .rp-block-label i { font-size: .8rem; }

  .rp-card {
    background: #fff; border: 1px solid var(--rp-line);
    border-radius: 18px; padding: 20px 22px;
    box-shadow: 0 1px 2px rgba(30,45,90,.03), 0 10px 24px rgba(30,45,90,.05);
  }

  /* The verse and the hadith are quoted text, so they read as quotations
     rather than as more of the page's own voice. */
  .rp-scripture {
    border-left: 4px solid var(--rp-orange);
    background: linear-gradient(180deg, #FFF9F2 0%, #FFFDFA 100%);
  }
  .rp-scripture.hadith { border-left-color: var(--rp-tan); background: linear-gradient(180deg, #FBF7F2 0%, #FFFDFB 100%); }
  .rp-arabic {
    font-size: 1.15rem; color: var(--rp-navy); font-weight: 700;
    direction: rtl; text-align: right; margin-bottom: 10px;
  }
  .rp-quote {
    font-size: 1.02rem; line-height: 1.75; color: var(--rp-ink);
  }

  .rp-story p { font-size: 1.02rem; line-height: 1.8; margin: 0 0 14px; }
  .rp-story p:last-child { margin-bottom: 0; }
  .rp-story-title {
    font-family: var(--rp-head); font-weight: 400; font-size: 1.05rem;
    color: var(--rp-navy); margin: 0 0 12px;
  }

  .rp-reflection { background: #FBF3F7; border: 1px solid #F1DDE7; }
  .rp-reflection .rp-quote { color: #6C2547; }

  .rp-tip { background: var(--rp-navy); border-color: var(--rp-navy); color: #fff; }
  .rp-tip .rp-quote { color: rgba(255,255,255,.92); }

  /* Actions --------------------------------------------------------------- */
  .rp-actions { margin-top: 30px; display: grid; gap: 10px; }
  .rp-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    padding: 15px 20px; border-radius: 15px; border: 1px solid transparent;
    font-family: var(--rp-text); font-weight: 800; font-size: .95rem;
    cursor: pointer; text-decoration: none; width: 100%;
  }
  .rp-btn.primary { background: var(--rp-pink); color: #fff; }
  .rp-btn.primary:hover { background: #B02460; color: #fff; }
  .rp-btn.primary:disabled { opacity: .65; cursor: default; }
  .rp-btn.ghost { background: #fff; border-color: var(--rp-line); color: var(--rp-navy); }
  .rp-btn.ghost:hover { background: #fff6f1; }
  .rp-btn-row { display: flex; gap: 10px; }
  .rp-btn-row .rp-btn { flex: 1 1 0; }

  .rp-revisit-note {
    margin-top: 18px; padding: 13px 16px; border-radius: 14px;
    background: #FFF4E8; border: 1px solid #F6E0C4;
    font-size: .84rem; font-weight: 700; color: #8A5A17;
    display: flex; gap: 9px; align-items: flex-start;
  }

  /* Archive --------------------------------------------------------------- */
  .rp-sheet {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(30,45,90,.5); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .rp-sheet.d-none { display: none; }
  .rp-sheet-panel {
    background: var(--rp-cream); width: 100%; max-width: 660px;
    max-height: 82vh; border-radius: 22px 22px 0 0;
    display: flex; flex-direction: column;
  }
  .rp-sheet-head {
    padding: 18px 20px 12px; border-bottom: 1px solid var(--rp-line);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .rp-sheet-head h3 { font-family: var(--rp-head); font-weight: 400; font-size: 1.05rem; color: var(--rp-navy); margin: 0; }
  .rp-sheet-list { overflow-y: auto; padding: 8px 12px 24px; }
  .rp-day-row {
    display: flex; align-items: center; gap: 13px; width: 100%;
    padding: 12px 12px; border: 0; border-radius: 14px;
    background: none; cursor: pointer; text-align: left;
    font-family: inherit; color: inherit;
  }
  .rp-day-row:hover { background: #fff; }
  .rp-day-num {
    flex: none; width: 40px; height: 40px; border-radius: 12px;
    display: grid; place-items: center; font-weight: 800; font-size: .82rem;
    background: #fff; border: 1px solid var(--rp-line); color: var(--rp-muted);
  }
  .rp-day-row.is-read .rp-day-num { background: #EAF6F0; border-color: transparent; color: #17795E; }
  .rp-day-row.is-today .rp-day-num { background: var(--rp-pink); border-color: transparent; color: #fff; }
  .rp-day-main { min-width: 0; flex: 1 1 auto; }
  .rp-day-name {
    display: block; font-weight: 800; font-size: .88rem; color: var(--rp-navy);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rp-day-meta { display: block; font-size: .74rem; font-weight: 700; color: var(--rp-muted); margin-top: 2px; }

  /* States ---------------------------------------------------------------- */
  .rp-loading { text-align: center; padding: 80px 20px; color: var(--rp-muted); font-weight: 800; }
  .rp-overlay {
    position: fixed; inset: 0; background: rgba(30,45,90,.55);
    backdrop-filter: blur(6px); display: grid; place-items: center;
    padding: 20px; z-index: 70;
  }
  .rp-overlay.d-none { display: none; }
  .rp-modal {
    background: #fff; border-radius: 22px; padding: 28px;
    max-width: 380px; width: 100%; text-align: center;
  }
  .rp-modal h3 { font-family: var(--rp-head); font-weight: 400; color: var(--rp-navy); font-size: 1.1rem; margin: 0 0 8px; }
  .rp-modal p { color: var(--rp-muted); font-weight: 700; font-size: .88rem; margin: 0 0 18px; }

  @media (max-width: 480px) {
    .rp-shell { padding-left: 16px; padding-right: 16px; }
    .rp-title { font-size: 1.55rem; }
    .rp-card { padding: 17px 18px; border-radius: 16px; }
  }
</style>

<div class="rp-body">
  <div class="rp-topbar">
    <button class="rp-back" type="button" id="rpBack" aria-label="Go back"><i class="fas fa-arrow-left"></i></button>
    <div class="rp-topbar-text">
      <div class="rp-kicker">Daily reading</div>
      <div class="rp-topbar-name" id="rpChildName">Loading…</div>
    </div>
    <button class="rp-archive-btn" type="button" id="rpArchiveBtn" style="display:none;">
      <i class="far fa-calendar"></i> All days
    </button>
  </div>

  <div class="rp-shell">
    <div id="rpLoading" class="rp-loading"><i class="fas fa-spinner fa-spin"></i> Opening today's reading…</div>
    <div id="rpView" style="display:none;"></div>
  </div>
</div>

<div class="rp-sheet d-none" id="rpSheet">
  <div class="rp-sheet-panel">
    <div class="rp-sheet-head">
      <h3>All days</h3>
      <button class="rp-back" type="button" id="rpSheetClose" aria-label="Close"><i class="fas fa-times"></i></button>
    </div>
    <div class="rp-sheet-list" id="rpSheetList"></div>
  </div>
</div>

<div class="rp-overlay d-none" id="rpBlockOverlay">
  <div class="rp-modal">
    <i class="fas fa-lock" style="font-size:2rem;color:#D63678;margin-bottom:12px;"></i>
    <h3 id="rpBlockTitle">Sign in required</h3>
    <p id="rpBlockMessage">Please sign in with your family account.</p>
    <a class="rp-btn primary" id="rpBlockAction" href="/auth">Go to login</a>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  ${raw(activeChildHelpersJS)}

  // 290KB of written content, fetched rather than inlined — it ships in the
  // APK payload already (scripts/apk-parent-chapter.cjs copies it) and baking
  // it into the page would put it in every build of every dashboard.
  const CONTENT_URL = '/kidba_assets/data/chapters_data.json';

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
  }

  let family = null;
  let child = null;
  let days = [];
  /** 0-based index of the next unread day. */
  let cursor = 0;
  /** Which day is on screen. Equals cursor unless an earlier day was reopened. */
  let viewing = 0;
  let saving = false;

  const params = new URLSearchParams(window.location.search);

  function block(title, message, actionLabel, actionHref) {
    document.getElementById('rpBlockTitle').textContent = title;
    document.getElementById('rpBlockMessage').textContent = message;
    const action = document.getElementById('rpBlockAction');
    action.textContent = actionLabel || 'Go to login';
    action.setAttribute('href', actionHref || '/auth');
    document.getElementById('rpBlockOverlay').classList.remove('d-none');
    document.getElementById('rpLoading').style.display = 'none';
  }

  /** Story is an array of paragraphs in the data, but tolerate a plain string. */
  function paragraphsOf(story) {
    if (Array.isArray(story)) return story;
    return String(story || '').split(/\\n{2,}/);
  }

  function block_(label, colour, icon, inner, cls) {
    return '<div class="rp-block">' +
      '<div class="rp-block-label" style="color:' + colour + '"><i class="' + icon + '"></i>' + label + '</div>' +
      '<div class="rp-card ' + (cls || '') + '">' + inner + '</div>' +
    '</div>';
  }

  function renderDay(index) {
    viewing = index;
    const day = days[index];
    const isRevisit = index < cursor;
    const colour = day.valueColor || '#D63678';

    let out = '';

    // ── Header ──────────────────────────────────────────────────────────
    out +=
      '<div class="rp-day-head">' +
        '<div class="rp-badges">' +
          '<span class="rp-value-pill" style="background:' + esc(colour) + '">' +
            (day.valueEmoji ? esc(day.valueEmoji) + ' ' : '') + esc(day.value || '') +
            (day.valueArabic ? ' <small>· ' + esc(day.valueArabic) + '</small>' : '') +
          '</span>' +
          (day.stageLabel ? '<span class="rp-chip"><i class="fas fa-layer-group"></i> ' + esc(day.stageLabel) + '</span>' : '') +
          '<span class="rp-chip"><i class="far fa-calendar-check"></i> Day ' + (index + 1) + ' of ' + days.length + '</span>' +
        '</div>' +
        '<h1 class="rp-title">' + esc(day.title || '') + '</h1>' +
        (day.intro ? '<p class="rp-intro">' + esc(day.intro) + '</p>' : '') +
        '<div class="rp-progress-line">' +
          '<span>' + cursor + ' read</span>' +
          '<span class="rp-progress-track"><span class="rp-progress-fill" style="width:' +
            Math.round((cursor / days.length) * 100) + '%"></span></span>' +
          '<span>' + days.length + '</span>' +
        '</div>' +
      '</div>';

    if (isRevisit) {
      out += '<div class="rp-revisit-note">' +
        '<i class="fas fa-rotate-left" style="margin-top:2px;"></i>' +
        '<span>You are reading an earlier day again. Where your family is up to has not changed.</span>' +
      '</div>';
    }

    // ── The reading, in the order it is meant to be read ────────────────
    if (day.quranText) {
      out += block_('From the Qur\\'an', '#E08020', 'fas fa-book-open',
        (day.quranSurah ? '<div class="rp-arabic">' + esc(day.quranSurah) + '</div>' : '') +
        '<div class="rp-quote">' + esc(day.quranText) + '</div>',
        'rp-scripture');
    }

    if (day.hadithText) {
      out += block_('Hadith', '#C99A6B', 'fas fa-star-and-crescent',
        '<div class="rp-quote">' + esc(day.hadithText) + '</div>',
        'rp-scripture hadith');
    }

    const story = paragraphsOf(day.story).filter((p) => String(p).trim());
    if (story.length) {
      out += block_('Story', '#1E2D5A', 'fas fa-feather-pointed',
        (day.storyTitle ? '<div class="rp-story-title">' + esc(day.storyTitle) + '</div>' : '') +
        '<div class="rp-story">' + story.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>');
    }

    if (day.reflection) {
      out += block_('Reflection', '#D63678', 'fas fa-lightbulb',
        '<div class="rp-quote">' + esc(day.reflection) + '</div>',
        'rp-reflection');
    }

    if (day.parentTip) {
      out += block_('For the parent', '#1E2D5A', 'fas fa-comments',
        '<div class="rp-quote">' + esc(day.parentTip) + '</div>',
        'rp-tip');
    }

    // ── Actions ─────────────────────────────────────────────────────────
    // The day only moves when the parent says so. That is what makes coming
    // back to this button show the same day again.
    out += '<div class="rp-actions">';
    if (!isRevisit) {
      out += index + 1 < days.length
        ? '<button class="rp-btn primary" type="button" id="rpDone"><i class="fas fa-check"></i> Done — open Day ' + (index + 2) + ' tomorrow</button>'
        : '<button class="rp-btn primary" type="button" id="rpDone"><i class="fas fa-award"></i> Finish the last day</button>';
    } else {
      out += '<button class="rp-btn primary" type="button" id="rpToToday"><i class="fas fa-arrow-right"></i> Back to today — Day ' + (cursor + 1) + '</button>';
    }
    out += '<div class="rp-btn-row">' +
      (index > 0 ? '<button class="rp-btn ghost" type="button" id="rpPrev"><i class="fas fa-chevron-left"></i> Day ' + index + '</button>' : '') +
      (index + 1 < days.length && index < cursor ? '<button class="rp-btn ghost" type="button" id="rpNext">Day ' + (index + 2) + ' <i class="fas fa-chevron-right"></i></button>' : '') +
    '</div></div>';

    const view = document.getElementById('rpView');
    view.innerHTML = out;
    view.style.display = '';
    document.getElementById('rpLoading').style.display = 'none';
    document.getElementById('rpArchiveBtn').style.display = '';
    window.scrollTo({ top: 0 });

    const done = document.getElementById('rpDone');
    if (done) done.addEventListener('click', markDone);
    const toToday = document.getElementById('rpToToday');
    if (toToday) toToday.addEventListener('click', () => renderDay(cursor));
    const prev = document.getElementById('rpPrev');
    if (prev) prev.addEventListener('click', () => renderDay(index - 1));
    const next = document.getElementById('rpNext');
    if (next) next.addEventListener('click', () => renderDay(index + 1));
  }

  async function markDone() {
    if (saving) return;
    saving = true;
    const button = document.getElementById('rpDone');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    const nextCursor = Math.min(cursor + 1, days.length);
    try {
      const state = Object.assign({}, child.game_state || {}, { parent_content_index: nextCursor });
      await updateDoc(doc(db, 'users', child.uid), { game_state: state });
      child.game_state = state;
      cursor = nextCursor;
    } catch (err) {
      button.disabled = false;
      button.innerHTML = original;
      saving = false;
      alert('Could not save your place: ' + (err.message || 'please try again.'));
      return;
    }

    saving = false;
    renderDay(Math.min(cursor, days.length - 1));
  }

  // ── Archive: any day, read again, without moving the family on ─────────
  function openArchive() {
    const list = days.map((day, i) => {
      const cls = i < cursor ? ' is-read' : (i === cursor ? ' is-today' : '');
      const mark = i < cursor ? '<i class="fas fa-check"></i>' : String(i + 1);
      return '<button class="rp-day-row' + cls + '" type="button" data-day="' + i + '">' +
        '<span class="rp-day-num">' + mark + '</span>' +
        '<span class="rp-day-main">' +
          '<span class="rp-day-name">' + esc(day.title || ('Day ' + (i + 1))) + '</span>' +
          '<span class="rp-day-meta">Day ' + (i + 1) + ' · ' + esc(day.value || '') +
            (i === cursor ? ' · today' : '') + '</span>' +
        '</span>' +
      '</button>';
    }).join('');

    const sheetList = document.getElementById('rpSheetList');
    sheetList.innerHTML = list;
    document.getElementById('rpSheet').classList.remove('d-none');

    sheetList.querySelectorAll('[data-day]').forEach((row) => {
      row.addEventListener('click', () => {
        const i = Number(row.getAttribute('data-day'));
        // Days ahead of where the family is up to stay closed — the plan is
        // meant to be walked, not skimmed.
        if (i > cursor) return;
        closeArchive();
        renderDay(i);
      });
    });

    const current = sheetList.querySelector('.is-today') || sheetList.querySelector('.rp-day-row');
    if (current) current.scrollIntoView({ block: 'center' });
  }

  function closeArchive() {
    document.getElementById('rpSheet').classList.add('d-none');
  }

  document.getElementById('rpArchiveBtn').addEventListener('click', openArchive);
  document.getElementById('rpSheetClose').addEventListener('click', closeArchive);
  document.getElementById('rpSheet').addEventListener('click', (e) => {
    if (e.target.id === 'rpSheet') closeArchive();
  });

  // The one back handler in Head.tsx calls this before deciding anything.
  window.__iaBackIntercept = function () {
    if (!document.getElementById('rpSheet').classList.contains('d-none')) {
      closeArchive();
      return true;
    }
    if (viewing !== cursor) {
      renderDay(cursor);
      return true;
    }
    return false;
  };

  document.getElementById('rpBack').addEventListener('click', () => {
    if (viewing !== cursor) return renderDay(cursor);
    window.location.href = '/family';
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      return block('Sign in required', 'Please sign in with your family account to open the daily reading.');
    }

    let me;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      me = snap.exists() ? snap.data() : null;
    } catch (err) {
      return block('Could not load your account', err.message || 'Please try again.');
    }

    if (!me || me.role !== 'family') {
      return block(
        'Family account required',
        'The daily reading is part of the family account your school created. Sign in with the PAR- username.'
      );
    }

    family = Object.assign({ uid: user.uid }, me);

    const childUid = params.get('child') || acRecall(family.uid);
    if (!childUid) {
      return block(
        'Choose a child first',
        'Open a child from your family page and the daily reading will follow them.',
        'Go to my children',
        '/family'
      );
    }

    try {
      const snap = await getDoc(doc(db, 'users', childUid));
      child = snap.exists() ? Object.assign({ uid: childUid }, snap.data()) : null;
    } catch (err) {
      return block('Could not load this child', err.message || 'Please try again.', 'Go to my children', '/family');
    }

    if (!child || child.family_uid !== family.uid) {
      return block('Child not found', 'That child is not on this family account any more.', 'Go to my children', '/family');
    }

    acRemember(family.uid, childUid);
    document.getElementById('rpChildName').textContent = child.name || 'Your child';

    try {
      const res = await fetch(CONTENT_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      days = await res.json();
    } catch (err) {
      return block('Could not load the reading', 'The daily reading content did not load. Please try again.', 'Go to my children', '/family');
    }

    if (!Array.isArray(days) || !days.length) {
      return block('Nothing to read yet', 'The daily reading content is empty.', 'Go to my children', '/family');
    }

    const saved = Number((child.game_state || {}).parent_content_index) || 0;
    cursor = Math.max(0, Math.min(saved, days.length - 1));

    // A link may name a day; otherwise the plan opens where the family is up
    // to — which is the same day it opened at last time, until it is marked.
    const wanted = Number(params.get('day'));
    const start = wanted >= 1 && wanted <= cursor + 1 ? wanted - 1 : cursor;
    renderDay(start);
  });
</script>
`
