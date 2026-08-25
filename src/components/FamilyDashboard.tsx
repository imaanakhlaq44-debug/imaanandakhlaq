import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { activeChildHelpersJS } from '../lib/activeChild'

/**
 * chapter_id -> chapter title, emitted as a literal.
 *
 * A teacher's note is attached to a submission, and a submission names its
 * chapter by id ("b1_c4"). Shipping the id to the parent would be shipping
 * them our database schema, so the page carries the titles — a few kilobytes,
 * versus importing the whole activities catalogue for one field.
 */
const chapterTitlesJS = (() => {
  const titles: Record<string, string> = {}
  for (const book of Object.values(activitiesData as Record<string, any>)) {
    for (const chapter of Object.values(book?.chapters || {}) as any[]) {
      if (chapter?.id && chapter?.title) titles[chapter.id] = chapter.title
    }
  }
  return JSON.stringify(titles)
})()

/**
 * The family's home screen: one card per child.
 *
 * This is where a school-provisioned parent lands. It is read-only — work
 * still goes from the student straight to the teacher, and nothing here
 * approves anything. What it replaces is not the old parent dashboard's
 * approval step but the situation before it: a parent with three children
 * juggling three separate logins.
 *
 * Children have no login of their own. Opening a card remembers which child
 * this device is working as (see activeChild.ts) and hands off to the student
 * dashboard.
 */
export const FamilyDashboard = () => html`
<style>
  :root {
    --fam-ink: #1E2D5A;
    --fam-pink: #D63678;
    --fam-orange: #E08020;
    --fam-green: #1f7d59;
  }

  body {
    margin: 0;
    font-family: 'Nunito', system-ui, sans-serif;
    background:
      radial-gradient(1200px 600px at 12% -8%, rgba(214, 54, 120, 0.16), transparent 62%),
      radial-gradient(900px 520px at 92% 4%, rgba(224, 128, 32, 0.16), transparent 58%),
      #f6f4ef;
    min-height: 100vh;
    color: var(--fam-ink);
  }

  .fam-shell { max-width: 1080px; margin: 0 auto; padding: 22px 20px 72px; }

  .fam-topbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 30px;
  }
  .fam-brand { display: flex; align-items: center; gap: 12px; }
  .fam-brand img { width: 46px; height: 46px; border-radius: 14px; object-fit: cover; }
  .fam-brand-text { line-height: 1.15; }
  .fam-brand-kicker {
    font-size: .68rem; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: #8a93a8;
  }
  .fam-brand-name { font-family: 'Fredoka One', cursive; font-size: 1.12rem; }

  .fam-logout {
    border: 1px solid rgba(30, 45, 90, .16); background: rgba(255, 255, 255, .7);
    color: var(--fam-ink); font-weight: 800; font-size: .86rem;
    padding: 10px 18px; border-radius: 999px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: background .18s, transform .18s;
  }
  .fam-logout:hover { background: #fff; transform: translateY(-1px); }

  .fam-heading { margin-bottom: 26px; }
  .fam-heading h1 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(1.7rem, 4.6vw, 2.5rem); margin: 0 0 6px;
  }
  .fam-heading p { margin: 0; color: #5d6780; font-size: .96rem; }

  /* Two per row on a desktop, one on a phone. No fixed capacity: the grid is
     however many children there are, plus the tile that adds another. */
  .fam-grid {
    display: grid; gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  }
  @media (max-width: 680px) { .fam-grid { grid-template-columns: 1fr; } }

  .fam-card {
    position: relative; overflow: hidden;
    background: #fff; border-radius: 22px;
    border: 1px solid rgba(30, 45, 90, .08);
    box-shadow: 0 14px 34px rgba(30, 45, 90, .09);
    padding: 20px; display: flex; flex-direction: column; gap: 14px;
    transition: transform .2s, box-shadow .2s;
  }
  .fam-card:hover { transform: translateY(-3px); box-shadow: 0 20px 44px rgba(30, 45, 90, .14); }
  .fam-card::before {
    content: ''; position: absolute; inset: 0 0 auto 0; height: 6px;
    background: linear-gradient(90deg, var(--fam-pink), var(--fam-orange));
  }
  .fam-card.tone-1::before { background: linear-gradient(90deg, #2f9e73, #7cc47f); }
  .fam-card.tone-2::before { background: linear-gradient(90deg, #3b6fd4, #63a7e8); }

  .fam-card-top { display: flex; align-items: center; gap: 14px; margin-top: 4px; }
  .fam-avatar {
    width: 56px; height: 56px; border-radius: 50%; flex: 0 0 56px;
    object-fit: cover; display: flex; align-items: center; justify-content: center;
    font-family: 'Fredoka One', cursive; font-size: 1.35rem; color: #fff;
    background: linear-gradient(140deg, var(--fam-pink), var(--fam-orange));
  }
  .fam-card.tone-1 .fam-avatar { background: linear-gradient(140deg, #2f9e73, #7cc47f); }
  .fam-card.tone-2 .fam-avatar { background: linear-gradient(140deg, #3b6fd4, #63a7e8); }

  .fam-name { font-family: 'Fredoka One', cursive; font-size: 1.16rem; line-height: 1.2; }
  .fam-class {
    display: inline-block; margin-top: 4px; font-size: .74rem; font-weight: 800;
    letter-spacing: .04em; color: #5d6780;
    background: rgba(30, 45, 90, .06); padding: 3px 10px; border-radius: 999px;
  }

  .fam-stats { display: flex; gap: 10px; }
  .fam-stat {
    flex: 1; background: rgba(30, 45, 90, .04); border-radius: 14px;
    padding: 10px 12px; text-align: center;
  }
  .fam-stat b { display: block; font-family: 'Fredoka One', cursive; font-size: 1.2rem; }
  .fam-stat span {
    font-size: .68rem; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; color: #7a839a;
  }

  .fam-badge {
    display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
    font-size: .76rem; font-weight: 800; padding: 5px 12px; border-radius: 999px;
    background: rgba(224, 128, 32, .12); color: #a25c0d;
  }
  .fam-badge.clear { background: rgba(47, 158, 115, .12); color: var(--fam-green); }
  /* Something the parent has to act on — the child has work to redo. */
  .fam-badge.redo { background: rgba(179, 38, 30, .10); color: #b3261e; }

  /* What happened this week, in the child's own record. Without this the card
     said only how many points they had, which never changes visibly and tells
     a parent nothing about the week. */
  .fam-week {
    font-size: .82rem; color: #55607a; line-height: 1.5;
  }
  .fam-week b { color: var(--fam-ink); font-weight: 800; }
  .fam-week.quiet { color: #8b94a8; }

  /* The teacher's own words. This is the one thing a parent could not see
     anywhere before — the note existed on the submission and only the student
     ever read it. */
  .fam-note {
    background: rgba(30, 45, 90, .04);
    border-left: 3px solid var(--fam-pink);
    border-radius: 0 12px 12px 0;
    padding: 10px 12px;
  }
  .fam-note-label {
    font-size: .64rem; font-weight: 800; letter-spacing: .09em;
    text-transform: uppercase; color: #7a839a; display: block; margin-bottom: 3px;
  }
  .fam-note-text {
    font-size: .84rem; color: #2b3550; line-height: 1.45;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .fam-note-meta { font-size: .7rem; color: #8b94a8; margin-top: 5px; }

  /* One line above the grid: the household at a glance, so a parent with four
     children does not have to read four cards to learn nothing happened. */
  .fam-summary {
    display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px 14px;
    background: rgba(255, 255, 255, .72);
    border: 1px solid rgba(30, 45, 90, .10);
    border-radius: 999px; padding: 8px 16px; margin-top: 10px;
    font-size: .84rem; color: #55607a;
  }
  .fam-summary b { color: var(--fam-ink); font-weight: 800; }
  .fam-summary .sep { color: rgba(30, 45, 90, .22); }
  /* .d-none is defined per element on this page; the summary needs its own. */
  .fam-summary.d-none { display: none; }

  .fam-open {
    margin-top: auto; border: none; cursor: pointer; width: 100%;
    background: var(--fam-ink); color: #fff; font-weight: 800; font-size: .94rem;
    padding: 12px; border-radius: 14px;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .18s;
  }
  .fam-open:hover { background: #16224a; }

  /* Two actions on one card, and only one of them is the loud one. The
     reading plan is the parent's own door, so it reads as a companion to
     "Open activities" rather than competing with it. */
  .fam-open + .fam-open { margin-top: 8px; }
  .fam-open.secondary {
    background: rgba(30, 45, 90, .06); color: var(--fam-ink);
    border: 1px solid rgba(30, 45, 90, .12);
  }
  .fam-open.secondary:hover { background: rgba(30, 45, 90, .11); }

  /* Add tile, and the dashed placeholders a brand new family sees so the page
     never looks empty or broken. */
  .fam-tile {
    border: 2px dashed rgba(30, 45, 90, .22); border-radius: 22px;
    background: rgba(255, 255, 255, .45);
    min-height: 232px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px; text-align: center;
    color: #6b7590; padding: 20px;
  }
  .fam-tile.action { cursor: pointer; transition: border-color .18s, background .18s, transform .18s; }
  .fam-tile.action:hover {
    border-color: var(--fam-pink); background: #fff; transform: translateY(-3px); color: var(--fam-pink);
  }
  .fam-tile i { font-size: 1.9rem; }
  .fam-tile strong { font-family: 'Fredoka One', cursive; font-size: 1.02rem; }
  .fam-tile small { font-size: .8rem; max-width: 220px; line-height: 1.5; }
  .fam-tile.ghost { opacity: .55; }

  .fam-overlay {
    position: fixed; inset: 0; z-index: 9999; padding: 20px;
    background: rgba(18, 27, 55, .82); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
  }
  .fam-overlay.d-none { display: none; }
  .fam-modal {
    background: #fff; border-radius: 22px; padding: 26px;
    width: 100%; max-width: 420px; box-shadow: 0 24px 60px rgba(0, 0, 0, .3);
  }
  .fam-modal h3 { font-family: 'Fredoka One', cursive; margin: 0 0 6px; font-size: 1.25rem; }
  .fam-modal p { color: #5d6780; font-size: .9rem; margin: 0 0 18px; }
  .fam-input {
    width: 100%; border: 2px solid rgba(30, 45, 90, .14); border-radius: 14px;
    padding: 13px 15px; font-size: 1.12rem; font-weight: 800;
    letter-spacing: .12em; text-align: center; text-transform: uppercase;
    font-family: 'Sora', monospace; color: var(--fam-ink);
  }
  .fam-input:focus { outline: none; border-color: var(--fam-pink); }
  .fam-modal-actions { display: flex; gap: 10px; margin-top: 18px; }
  .fam-btn {
    flex: 1; border: none; cursor: pointer; font-weight: 800; font-size: .92rem;
    padding: 12px; border-radius: 14px;
  }
  .fam-btn.ghost { background: rgba(30, 45, 90, .07); color: var(--fam-ink); }
  .fam-btn.solid { background: var(--fam-pink); color: #fff; }
  .fam-btn:disabled { opacity: .6; cursor: not-allowed; }
  .fam-error { color: #b91c1c; font-size: .85rem; font-weight: 700; margin: 12px 0 0; min-height: 1.2em; }

  .fam-loading { text-align: center; padding: 60px 20px; color: #6b7590; font-weight: 700; }
</style>

<div class="fam-shell">
  <div class="fam-topbar">
    <div class="fam-brand">
      <img src="/kidba_assets/img/splash_logo.jpg" alt="Imaan &amp; Akhlaq">
      <div class="fam-brand-text">
        <div class="fam-brand-kicker">Imaan &amp; Akhlaq</div>
        <div class="fam-brand-name" id="famAccountName">Family</div>
      </div>
    </div>
    <button class="fam-logout" type="button" onclick="famLogout()"><i class="fas fa-sign-out-alt"></i> Log out</button>
  </div>

  <div class="fam-heading">
    <h1>Who is learning today?</h1>
    <p id="famSubtitle">Choose a child to open their activities.</p>
    <div class="fam-summary d-none" id="famSummary"></div>
  </div>

  <div id="famLoading" class="fam-loading"><i class="fas fa-spinner fa-spin"></i> Loading your children…</div>
  <div class="fam-grid" id="famGrid" style="display:none;"></div>
</div>

<!-- Add a child -->
<div class="fam-overlay d-none" id="famClaimOverlay">
  <div class="fam-modal">
    <h3>Add a child</h3>
    <p>Enter the student code your school gave you. Each code works once.</p>
    <input type="text" id="famClaimCode" class="fam-input" placeholder="STU-XXXXX" autocomplete="off" spellcheck="false" maxlength="12">
    <p class="fam-error" id="famClaimError"></p>
    <div class="fam-modal-actions">
      <button class="fam-btn ghost" type="button" onclick="famCloseClaim()">Cancel</button>
      <button class="fam-btn solid" type="button" id="famClaimBtn" onclick="famClaim()">Add child</button>
    </div>
  </div>
</div>

<!-- Blocked: wrong account, or none -->
<div class="fam-overlay d-none" id="famBlockOverlay">
  <div class="fam-modal" style="text-align:center;">
    <i class="fas fa-lock" style="font-size:2.4rem; color:var(--fam-pink); margin-bottom:14px;"></i>
    <h3 id="famBlockTitle">Sign in required</h3>
    <p id="famBlockMessage">Please sign in with your family account.</p>
    <button class="fam-btn solid" type="button" onclick="window.location.href='/auth'">Go to login</button>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  // acRemember lets this device reopen whoever used it last.
  ${raw(activeChildHelpersJS)}

  const callClaimChild = httpsCallable(functions, 'claimChild');

  let family = null;
  let children = [];
  let pendingByChild = {};
  // Per child: what happened in the last seven days, and the most recent thing
  // the teacher actually wrote.
  let weekByChild = {};
  let noteByChild = {};

  // chapter_id -> title, built from the same catalogue the student reads. A
  // note that says "b1_c4" is not a note a parent can use.
  const CHAPTER_TITLES = ${raw(chapterTitlesJS)};

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  /** Timestamps arrive as ISO strings from the client and as Timestamps from
   *  anything written server-side, so both have to survive this. */
  function toDate(value) {
    if (!value) return null;
    if (typeof value === 'string') { const d = new Date(value); return isNaN(d) ? null : d; }
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    return null;
  }

  function whenText(date) {
    if (!date) return '';
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    return date.toLocaleDateString();
  }

  function summarise(sub) {
    const uid = sub.student_uid;
    if (!uid) return;

    if (sub.reviewStatus === 'pending_teacher') {
      pendingByChild[uid] = (pendingByChild[uid] || 0) + 1;
    }

    const week = weekByChild[uid] || (weekByChild[uid] = { sent: 0, approved: 0, redo: 0 });
    if (sub.reviewStatus === 'needs_redo') week.redo++;

    const sentAt = toDate(sub.submittedAt || sub.updatedAt);
    if (sentAt && Date.now() - sentAt.getTime() < WEEK_MS) week.sent++;

    const approvedAt = toDate(sub.teacherApprovedAt);
    if (approvedAt && Date.now() - approvedAt.getTime() < WEEK_MS) week.approved++;

    // The newest note wins, whether it came with an approval or a send-back.
    const note = String(sub.teacherNotes || '').trim();
    if (!note) return;
    const noteAt = toDate(sub.teacherReviewedAt || sub.teacherApprovedAt || sub.updatedAt);
    const held = noteByChild[uid];
    if (!held || (noteAt && held.at && noteAt > held.at) || (noteAt && !held.at)) {
      noteByChild[uid] = {
        text: note,
        at: noteAt,
        // The submission carries the title it was written against; the map is
        // the fallback for sheets saved before that field existed.
        chapter: sub.chapter_title || CHAPTER_TITLES[sub.chapter_id] || '',
        sentBack: sub.reviewStatus === 'needs_redo'
      };
    }
  }

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
  }

  function block(title, message) {
    document.getElementById('famBlockTitle').textContent = title;
    document.getElementById('famBlockMessage').textContent = message;
    document.getElementById('famBlockOverlay').classList.remove('d-none');
    document.getElementById('famLoading').style.display = 'none';
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      return block('Sign in required', 'Please sign in with your family account to see your children.');
    }

    let me;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      me = snap.exists() ? snap.data() : null;
    } catch (err) {
      return block('Could not load your account', err.message || 'Please try again.');
    }

    if (!me) {
      return block('Profile missing', 'Your login worked but no profile was found. Please contact your school.');
    }
    if (me.role !== 'family') {
      return block('Family account required', 'This page is for the family account your school created. Sign in with the PAR- username.');
    }

    family = Object.assign({ uid: user.uid }, me);
    document.getElementById('famAccountName').textContent = family.name || 'Family';
    await loadChildren();
  });

  async function loadChildren() {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('family_uid', '==', family.uid)));
      children = [];
      snap.forEach((d) => children.push(Object.assign({ uid: d.id }, d.data())));
      children.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } catch (err) {
      return block('Could not load your children', err.message || 'Please try again.');
    }

    // One query for the whole household rather than one per child. It filters
    // on family_uid, which is a single-field equality — no composite index —
    // and it is also what the Firestore rules match on, so the list stays
    // provable.
    pendingByChild = {};
    weekByChild = {};
    noteByChild = {};
    try {
      const subs = await getDocs(query(
        collection(db, 'activity_submissions'),
        where('family_uid', '==', family.uid)
      ));
      subs.forEach((d) => summarise(d.data()));
    } catch (err) {
      // A missing count is worth far less than a blank page, so the cards
      // still render without it.
      console.warn('Could not load review counts', err);
    }

    render();
  }

  function cardFor(child, index) {
    const state = child.game_state || {};
    const points = typeof state.points === 'number' ? state.points : 0;
    const approved = Array.isArray(state.teacher_approved) ? state.teacher_approved.length : 0;
    const pending = pendingByChild[child.uid] || 0;
    const name = child.name || 'Student';
    const initial = esc(name.trim().charAt(0).toUpperCase() || '?');

    const avatar = child.photoURL
      ? '<img class="fam-avatar" src="' + esc(child.photoURL) + '" alt="">'
      : '<div class="fam-avatar">' + initial + '</div>';

    const week = weekByChild[child.uid] || { sent: 0, approved: 0, redo: 0 };
    const note = noteByChild[child.uid];

    // Only one badge, and the one that matters most: work sent back needs
    // someone at home tonight; waiting for the teacher needs nobody.
    let badge;
    if (week.redo) {
      badge = '<span class="fam-badge redo"><i class="fas fa-rotate-left"></i> ' +
        week.redo + (week.redo === 1 ? ' chapter to do again' : ' chapters to do again') + '</span>';
    } else if (pending) {
      badge = '<span class="fam-badge"><i class="fas fa-clock"></i> ' + pending + ' waiting for the teacher</span>';
    } else {
      badge = '<span class="fam-badge clear"><i class="fas fa-check"></i> Nothing pending</span>';
    }

    const weekLine = (week.sent || week.approved)
      ? '<div class="fam-week">This week: <b>' + week.sent + '</b> sent' +
        (week.approved ? ', <b>' + week.approved + '</b> approved' : '') + '</div>'
      : '<div class="fam-week quiet">Nothing sent this week.</div>';

    const noteBlock = note
      ? '<div class="fam-note">' +
          '<span class="fam-note-label">' + (note.sentBack ? 'Teacher sent this back' : 'Teacher\\'s note') + '</span>' +
          '<div class="fam-note-text">' + esc(note.text) + '</div>' +
          '<div class="fam-note-meta">' +
            (note.chapter ? esc(note.chapter) : 'Chapter') +
            (note.at ? ' · ' + esc(whenText(note.at)) : '') +
          '</div>' +
        '</div>'
      : '';

    return '<div class="fam-card tone-' + (index % 3) + '">' +
      '<div class="fam-card-top">' + avatar +
        '<div><div class="fam-name">' + esc(name) + '</div>' +
        '<span class="fam-class">' + esc(child.class_id || 'No class yet') + '</span></div>' +
      '</div>' +
      badge +
      weekLine +
      noteBlock +
      '<div class="fam-stats">' +
        '<div class="fam-stat"><b>' + points + '</b><span>Points</span></div>' +
        '<div class="fam-stat"><b>' + approved + '</b><span>Approved</span></div>' +
      '</div>' +
      '<button class="fam-open" type="button" onclick="famOpenChild(\\'' + child.uid + '\\')">' +
        '<i class="fas fa-play"></i> Open activities</button>' +
      // The second door out of this card. "Open activities" hands the device
      // to the child; this one stays with the parent and answers a different
      // question — what to read tonight, and what to ask afterwards.
      '<button class="fam-open secondary" type="button" onclick="famOpenReading(\\'' + child.uid + '\\')">' +
        '<i class="fas fa-book-open"></i> Daily reading</button>' +
    '</div>';
  }

  function render() {
    const grid = document.getElementById('famGrid');
    let out = children.map(cardFor).join('');

    // A brand new family sees two dashed placeholders beside the add tile, so
    // the grid reads as somewhere to fill in rather than a page that failed.
    if (!children.length) {
      out += '<div class="fam-tile ghost"><i class="far fa-user"></i><small>Your first child will appear here.</small></div>' +
             '<div class="fam-tile ghost"><i class="far fa-user"></i><small>And the next one here.</small></div>';
    }

    out += '<div class="fam-tile action" onclick="famOpenClaim()">' +
      '<i class="fas fa-plus-circle"></i><strong>Add a child</strong>' +
      '<small>Enter the student code your school gave you.</small></div>';

    grid.innerHTML = out;
    grid.style.display = '';
    document.getElementById('famLoading').style.display = 'none';
    document.getElementById('famSubtitle').textContent = children.length
      ? 'Choose a child to open their activities.'
      : 'Add your first child using the code from your school.';

    renderSummary();
  }

  /**
   * The household in one line. A parent of four should be able to learn "one
   * thing needs doing" without reading four cards — and, on a quiet week, that
   * nothing does.
   */
  function renderSummary() {
    const el = document.getElementById('famSummary');
    if (!el) return;
    if (!children.length) { el.classList.add('d-none'); return; }

    let sent = 0, approved = 0, redo = 0, waiting = 0;
    children.forEach((child) => {
      const week = weekByChild[child.uid] || { sent: 0, approved: 0, redo: 0 };
      sent += week.sent;
      approved += week.approved;
      redo += week.redo;
      waiting += pendingByChild[child.uid] || 0;
    });

    const parts = [];
    if (redo) parts.push('<b>' + redo + '</b> to do again');
    if (waiting) parts.push('<b>' + waiting + '</b> with the teacher');
    if (approved) parts.push('<b>' + approved + '</b> approved this week');
    if (sent && !approved) parts.push('<b>' + sent + '</b> sent this week');

    el.innerHTML = parts.length
      ? parts.join('<span class="sep">•</span>')
      : 'Nothing new this week.';
    el.classList.remove('d-none');
  }

  window.famOpenChild = (childUid) => {
    // Remember the choice before leaving: the student dashboard reads it back
    // to decide whose work to load.
    acRemember(family.uid, childUid);
    window.location.href = '/student-activities';
  };

  window.famOpenReading = (childUid) => {
    // The reading plan reads the same remembered child, so the two buttons
    // never disagree about whose plan is on screen.
    acRemember(family.uid, childUid);
    window.location.href = '/reading-plan?child=' + encodeURIComponent(childUid);
  };

  window.famOpenClaim = () => {
    document.getElementById('famClaimCode').value = '';
    document.getElementById('famClaimError').textContent = '';
    document.getElementById('famClaimOverlay').classList.remove('d-none');
    document.getElementById('famClaimCode').focus();
  };

  window.famCloseClaim = () => {
    document.getElementById('famClaimOverlay').classList.add('d-none');
  };

  window.famClaim = async () => {
    const input = document.getElementById('famClaimCode');
    const errorEl = document.getElementById('famClaimError');
    const button = document.getElementById('famClaimBtn');
    const code = input.value.trim().toUpperCase();

    if (!code) {
      errorEl.textContent = 'Enter the code from your school.';
      return;
    }

    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Adding…';
    errorEl.textContent = '';

    try {
      await callClaimChild({ code: code });
    } catch (err) {
      errorEl.textContent = err.message || 'That code could not be used.';
      return;
    } finally {
      button.disabled = false;
      button.textContent = original;
    }

    famCloseClaim();
    document.getElementById('famLoading').style.display = '';
    document.getElementById('famGrid').style.display = 'none';
    await loadChildren();
  };

  document.getElementById('famClaimCode').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') window.famClaim();
  });

  window.famLogout = async () => {
        try { sessionStorage.setItem('ia_just_logged_out', '1'); } catch (e) {}
        try { await signOut(auth); } catch (err) { console.warn(err); }
    try {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
    } catch (err) {}
    window.location.replace('/auth');
  };
</script>
`
