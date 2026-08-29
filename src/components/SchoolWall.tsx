import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

/**
 * The school wall.
 *
 * A community school meets one day a week, photographs what the children did,
 * and posts it here. Every tagged child shows as first name + class — never a
 * full name, anywhere. See SCHOOL_GROUP_PLAN.md.
 *
 * Two things about this page are load-bearing and easy to undo by accident:
 *
 * 1. It never writes school_posts. Publishing goes through the publishPost
 *    callable, which checks photo consent per tagged child on the Admin SDK.
 *    firestore.rules has no client write branch at all, so a shortcut here
 *    would not "work but skip the check" — it would simply be denied.
 *
 * 2. It is web only. The SSG build renders every route into dist/, which
 *    Capacitor copies wholesale, so this page ships inside the APK whether or
 *    not anything links to it. The redirect at the top of the script is what
 *    keeps it out of the app.
 */
export const SchoolWall = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  #wall {
    --navy:   #1E2D5A;
    --pink:   #D63678;
    --orange: #E08020;
    --ink:    #0f172a;
    --muted:  #64748b;
    --line:   #e2e8f0;
    --page:   #f7f8fc;
    --card:   #ffffff;

    font-family: 'Inter', system-ui, sans-serif;
    background: var(--page);
    color: var(--ink);
    min-height: 100vh;
    margin: 0;
  }
  #wall * { box-sizing: border-box; }
  #wall h1, #wall h2, #wall h3 { font-family: 'Fredoka', system-ui, sans-serif; margin: 0; }

  .wall-bar {
    background: var(--card); border-bottom: 1px solid var(--line);
    padding: 14px 20px; display: flex; align-items: center; gap: 14px;
    flex-wrap: wrap; position: sticky; top: 0; z-index: 20;
  }
  .wall-bar h1 { font-size: 1.15rem; color: var(--navy); }
  .wall-bar .spacer { flex: 1 1 auto; }

  .wall-inner { max-width: 760px; margin: 0 auto; padding: 20px 16px 80px; }

  .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .chip {
    border: 1px solid var(--line); background: var(--card); color: var(--muted);
    border-radius: 999px; padding: 6px 14px; font-size: 0.85rem; font-weight: 700;
    cursor: pointer; font-family: inherit;
  }
  .chip.on { background: var(--navy); border-color: var(--navy); color: #fff; }

  .btn {
    border: none; border-radius: 10px; padding: 10px 18px; font-weight: 700;
    font-size: 0.9rem; cursor: pointer; font-family: inherit;
  }
  .btn-primary { background: var(--orange); color: #fff; }
  .btn-quiet { background: transparent; color: var(--muted); border: 1px solid var(--line); }
  .btn:disabled { opacity: 0.55; cursor: default; }

  /* A session card is one activity day, not one post. A school that meets
     weekly makes four of these a month; an undifferentiated stream of posts
     would look abandoned by the third week. */
  .session { margin-bottom: 26px; }
  .session-head {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;
  }
  .session-date {
    font-size: 0.8rem; font-weight: 800; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .session-act {
    border: 1px solid var(--line); background: var(--card); color: var(--muted);
    border-radius: 999px; padding: 4px 11px; font-size: 0.76rem; font-weight: 700;
    cursor: pointer; font-family: inherit;
  }
  .session-act:disabled { opacity: 0.55; cursor: default; }

  .post {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 16px; margin-bottom: 12px;
  }
  .post-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .post-author { font-weight: 800; font-size: 0.9rem; }
  .post-meta { font-size: 0.78rem; color: var(--muted); font-weight: 600; }
  .post-text { line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }

  .grid { display: grid; gap: 6px; margin-top: 12px; grid-template-columns: repeat(2, 1fr); }
  .grid.one { grid-template-columns: 1fr; }
  .grid img {
    width: 100%; aspect-ratio: 4 / 3; object-fit: cover;
    border-radius: 10px; background: #eef1f6; display: block;
  }
  .grid.one img { aspect-ratio: 16 / 10; }

  .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .tag {
    background: #f1f5f9; border-radius: 999px; padding: 4px 10px;
    font-size: 0.78rem; font-weight: 700; color: #334155;
  }
  .tag b { color: var(--navy); }

  .status-flag {
    font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px;
  }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-hidden  { background: #fee2e2; color: #991b1b; }

  .empty { text-align: center; padding: 60px 20px; color: var(--muted); font-weight: 600; }
  .notice {
    background: #fdf2e7; border: 1px solid var(--orange); border-radius: 12px;
    padding: 14px 16px; margin-bottom: 18px; font-weight: 600; line-height: 1.5;
  }

  /* Composer */
  .sheet {
    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
    display: none; align-items: flex-start; justify-content: center;
    padding: 24px 16px; overflow-y: auto; z-index: 50;
  }
  .sheet.open { display: flex; }
  .sheet-card {
    background: var(--card); border-radius: 16px; width: 100%; max-width: 620px;
    padding: 22px;
  }
  .field { margin-bottom: 14px; }
  /* Direct child only. The student picker's rows are labels nested inside this
     field, and an unscoped .field label beats .pick-row on specificity — which
     turned every row back into a block and ran the name, the class and the
     consent reason together with no space between them. */
  .field > label { display: block; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px; }
  .field input[type=text], .field input[type=date], .field textarea {
    width: 100%; border: 1px solid var(--line); border-radius: 10px;
    padding: 10px 12px; font-family: inherit; font-size: 0.92rem;
  }
  .field textarea { min-height: 90px; resize: vertical; }

  .picker { border: 1px solid var(--line); border-radius: 10px; max-height: 200px; overflow-y: auto; }
  .pick-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px;
    border-bottom: 1px solid #f1f5f9; font-size: 0.88rem;
  }
  .pick-row:last-child { border-bottom: none; }
  .pick-row.blocked { opacity: 0.55; }
  .pick-why { margin-left: auto; font-size: 0.75rem; font-weight: 700; color: #b91c1c; }

  .thumbs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .thumbs img { width: 74px; height: 74px; object-fit: cover; border-radius: 8px; }

  .progress { font-size: 0.82rem; color: var(--muted); font-weight: 700; margin-top: 8px; }

  /* Reactions */
  .react-row { display: flex; gap: 8px; margin-top: 12px; }
  .react-like, .react-btn {
    border: 1px solid var(--line); background: var(--card); color: var(--muted);
    border-radius: 999px; padding: 6px 14px; font-size: 0.84rem; font-weight: 700;
    cursor: pointer; font-family: inherit;
  }
  .react-like.on { border-color: var(--pink); color: var(--pink); background: #fdeaf3; }

  .comments:empty { display: none; }
  .comments { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 10px; }
  .comment {
    font-size: 0.88rem; line-height: 1.5; padding: 6px 0;
    display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap;
  }
  .comment b { color: var(--navy); }
  /* A hidden comment is dimmed rather than removed: only staff can see it at
     all, and they are the ones who need to find what they took down. */
  .comment.is-hidden { opacity: 0.55; }
  .comment-flag {
    font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    color: #991b1b; background: #fee2e2; border-radius: 5px; padding: 1px 6px;
  }
  .comment-act {
    margin-left: auto; border: none; background: none; color: var(--muted);
    font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: inherit;
    text-decoration: underline;
  }
  .comment-empty { font-size: 0.85rem; color: var(--muted); font-weight: 600; padding: 4px 0; }
  .comment-new { display: flex; gap: 8px; margin-top: 8px; }
  .comment-new input {
    flex: 1 1 auto; min-width: 0; border: 1px solid var(--line);
    border-radius: 10px; padding: 8px 12px; font-family: inherit; font-size: 0.88rem;
  }

  @media (max-width: 520px) {
    .grid { grid-template-columns: 1fr; }
  }

  /* The notice-board poster.
     Hidden on screen and the only thing that survives printing — a school
     that hits Ctrl+P on the wall wants the day on a wall, not a screenshot
     of a web page with a sticky bar across the top. */
  #poster { display: none; }
  #poster h2 { font-size: 26pt; margin-bottom: 2pt; }
  #poster .poster-date { font-size: 12pt; color: #444; margin-bottom: 12pt; }
  #poster .poster-note { font-size: 12pt; line-height: 1.5; margin-bottom: 12pt; }
  #poster .poster-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin-bottom: 12pt;
  }
  #poster .poster-grid img {
    width: 100%; height: 78mm; object-fit: cover; border-radius: 3mm;
  }
  #poster .poster-names { font-size: 11pt; line-height: 1.9; }
  #poster .poster-names span {
    display: inline-block; border: 1pt solid #ccc; border-radius: 999px;
    padding: 1pt 7pt; margin: 0 4pt 4pt 0;
  }
  #poster .poster-foot {
    margin-top: 14pt; padding-top: 6pt; border-top: 1pt solid #ccc;
    font-size: 9pt; color: #666;
  }

  @media print {
    @page { size: A4 portrait; margin: 14mm; }
    .wall-bar, .chips, #feed, #wallNotice, .sheet, #moreBtn { display: none !important; }
    .wall-inner { max-width: none; padding: 0; }
    #wall { background: #fff; }
    #poster { display: block; }
  }
</style>

<div id="wall">
  <div class="wall-bar">
    <h1 id="wallSchoolName">School Wall</h1>
    <div class="spacer"></div>
    <label id="commentPolicyWrap" style="display:none; align-items:center; gap:6px; font-size:0.82rem; color:var(--muted); font-weight:700;">
      Comments
      <select id="commentPolicy" onchange="saveCommentPolicy(this.value)"
              style="font:inherit; padding:6px 8px; border:1px solid var(--line); border-radius:9px; color:var(--navy);">
        <option value="staff">Staff only</option>
        <option value="students">Students too</option>
        <option value="off">Nobody</option>
      </select>
    </label>
    <button class="btn btn-primary" id="newPostBtn" style="display:none;" onclick="openComposer()">New post</button>
    <a href="/student-activities" id="myWorkLink" class="btn btn-quiet" style="display:none; text-decoration:none;">My work</a>
    <a href="/" class="btn btn-quiet" style="text-decoration:none;">Back</a>
  </div>

  <div class="wall-inner">
    <div id="wallNotice" class="notice" style="display:none;"></div>
    <div class="chips" id="classChips"></div>
    <div id="feed"><div class="empty">Loading…</div></div>
    <div style="text-align:center; margin-top:16px;">
      <button class="btn btn-quiet" id="moreBtn" style="display:none;" onclick="loadMore()">Show earlier days</button>
    </div>

    <!-- Filled by printPoster() just before window.print(), and the only
         element the print stylesheet leaves standing. -->
    <div id="poster"></div>
  </div>

  <div class="sheet" id="composer">
    <div class="sheet-card">
      <h2 style="color:var(--navy); margin-bottom:4px;">Share an activity day</h2>
      <p style="color:var(--muted); font-size:0.86rem; margin:0 0 16px;">
        Only children whose parents agreed to photos can be tagged.
      </p>

      <div class="field">
        <label for="cDate">Which day was this?</label>
        <input type="date" id="cDate">
      </div>

      <div class="field">
        <label for="cText">What did they do?</label>
        <textarea id="cText" placeholder="A sentence is plenty — the photos do the work."></textarea>
      </div>

      <div class="field">
        <label>Photos</label>
        <input type="file" id="cFiles" accept="image/*" multiple onchange="stageFiles(this)">
        <div class="thumbs" id="cThumbs"></div>
      </div>

      <div class="field">
        <label>Who is in them?</label>
        <input type="text" id="cSearch" placeholder="Search by name or class" oninput="renderPicker()">
        <div class="picker" id="cPicker" style="margin-top:8px;"></div>
      </div>

      <div class="progress" id="cProgress"></div>

      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
        <button class="btn btn-quiet" onclick="closeComposer()">Cancel</button>
        <button class="btn btn-primary" id="cPublish" onclick="publish()">Publish</button>
      </div>
    </div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, connectAuthEmulator, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import {
    getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
    collection, query, where, orderBy, limit, startAfter, getDocs
  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";
  import {
    getStorage, connectStorageEmulator, ref, uploadBytesResumable, getDownloadURL
  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

  // Web only. The SSG build writes this route into dist/ and Capacitor copies
  // dist/ wholesale, so the page is inside the APK regardless of what links to
  // it. Without this it would be reachable by typing the path.
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function'
      && window.Capacitor.isNativePlatform()) {
    window.location.replace('/');
  }

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);
  const storage = getStorage(app);

  // Local development only. USE_EMULATORS is a build-time constant, so a
  // production build emits this block with the connect calls already dead.
  ${raw(emulatorConnectJS)}
  connectEmulators({ auth, db, functions, storage,
    connectAuthEmulator, connectFirestoreEmulator, connectFunctionsEmulator, connectStorageEmulator });


  const callPublishPost = httpsCallable(functions, 'publishPost');
  const callModeratePost = httpsCallable(functions, 'moderatePost');

  const PAGE = 15;

  let me = null;            // { uid, role, school_id }
  let school = null;
  let roster = [];          // same-school students, for tagging
  let classFilter = 'all';
  let cursor = null;        // last doc of the current page
  let posts = [];
  let staged = [];          // { file, blob, url, w, h }
  let picked = new Set();   // student uids tagged in the composer
  let sessionsByDay = {};   // session_date -> posts, for the recap and poster
  let mediaUrls = {};       // storage path -> resolved URL

  function isStaff() { return me && (me.role === 'teacher' || me.role === 'school_admin'); }
  function isStudent() { return me && me.role === 'student'; }

  /**
   * A child on the wall is a first name, never a full one.
   *
   * The posts already follow this — a tagged child shows as first name plus
   * class — and a comment signed with the full name would undo that on the
   * same screen, under the same photograph.
   */
  function commentAuthorName() {
    const full = String((me && me.name) || '').trim();
    if (!isStudent()) return full || 'Staff';
    return full.split(/\s+/)[0] || 'Student';
  }

  function esc(value) {
    const d = document.createElement('div');
    d.textContent = String(value == null ? '' : value);
    return d.innerHTML;
  }

  /** '2026-08-22' -> 'Saturday, 22 August 2026'. Never parsed with new Date()
   *  on the bare string: that reads as UTC and shows the previous day west of
   *  Greenwich, which for a weekly school means the wrong session entirely. */
  function prettyDate(iso) {
    const parts = String(iso || '').split('-');
    if (parts.length !== 3) return iso || '';
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.replace('/auth'); return; }

    const meSnap = await getDoc(doc(db, 'users', user.uid));
    if (!meSnap.exists()) { window.location.replace('/auth'); return; }
    me = Object.assign({ uid: user.uid }, meSnap.data());

    if (!me.school_id) {
      showNotice('This account is not attached to a school, so there is no wall to show.');
      document.getElementById('feed').innerHTML = '';
      return;
    }

    const schoolSnap = await getDoc(doc(db, 'schools', me.school_id));
    school = schoolSnap.exists() ? schoolSnap.data() : {};
    document.getElementById('wallSchoolName').textContent = school.name || 'School Wall';

    if (isStaff()) {
      if (school.wall_enabled === true) {
        document.getElementById('newPostBtn').style.display = '';
      } else {
        // Two different closed walls, and saying "we are verifying you" to a
        // school that was verified an hour ago is how a dead end gets mistaken
        // for a queue. A school that arrived through an organisation is
        // approved from the moment it registers; its wall is simply off.
        showNotice(school.approval_status === 'approved'
          ? 'Your wall is not switched on yet. Ask Imaan & Akhlaq to turn it on — everything else on your dashboard works meanwhile.'
          : 'Your wall opens once we verify your school — usually within a day. Everything else on your dashboard works meanwhile.');
      }
      await loadRoster();
    }

    renderChips();
    await loadPage(true);

    // After the roster is in, so the handed-over tags can be checked against
    // it. Opening the composer earlier would drop every tag on the floor.
    const draft = takeStashedDraft();
    // The school admin's call, not a teacher's: opening the wall to a
    // classroom of children is a safeguarding decision, and the head is the
    // one who answers for it.
    // A child lands here from their slip, so the way to their own chapters
    // has to be on this page or it does not exist for them.
    if (isStudent()) document.getElementById('myWorkLink').style.display = 'inline-flex';

    if (me && me.role === 'school_admin') {
      const wrap = document.getElementById('commentPolicyWrap');
      document.getElementById('commentPolicy').value =
        (school.wall_settings && school.wall_settings.comments) || 'staff';
      wrap.style.display = 'inline-flex';
    }

    if (draft && isStaff() && school.wall_enabled === true) openComposer(draft);
  });

  function showNotice(text) {
    const el = document.getElementById('wallNotice');
    el.textContent = text;
    el.style.display = '';
  }

  /** The roster feeds the tag picker and the class chips. Staff only: a family
   *  has no business listing every child in the school. */
  async function loadRoster() {
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('school_id', '==', me.school_id),
      where('role', '==', 'student')
    ));
    roster = [];
    snap.forEach((d) => roster.push(Object.assign({ uid: d.id }, d.data())));
    roster.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  /**
   * One page of the feed.
   *
   * Staff query without a status filter so pending and hidden posts are
   * visible to the people who have to act on them; everyone else sees only
   * what is published. Both shapes have an index in firestore.indexes.json —
   * without them this works against the emulator and fails in production.
   */
  function feedQuery() {
    const parts = [collection(db, 'school_posts'), where('school_id', '==', me.school_id)];
    if (classFilter !== 'all') parts.push(where('class_ids', 'array-contains', classFilter));
    if (!isStaff()) parts.push(where('status', '==', 'published'));
    parts.push(orderBy('session_date', 'desc'));
    if (cursor) parts.push(startAfter(cursor));
    parts.push(limit(PAGE));
    return query.apply(null, parts);
  }

  async function loadPage(reset) {
    if (reset) { cursor = null; posts = []; }
    let snap;
    try {
      snap = await getDocs(feedQuery());
    } catch (err) {
      console.error('wall query failed', err);
      document.getElementById('feed').innerHTML =
        '<div class="empty">The wall could not be loaded. Please try again.</div>';
      return;
    }

    snap.forEach((d) => posts.push(Object.assign({ id: d.id }, d.data())));
    cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : cursor;
    document.getElementById('moreBtn').style.display = snap.docs.length === PAGE ? '' : 'none';

    // Before the render, so a heart is drawn filled from the first paint
    // rather than flicking on a moment later.
    await loadMyLikes();
    await renderFeed();
  }

  window.loadMore = () => loadPage(false);

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  function renderChips() {
    const names = new Set();
    roster.forEach((s) => { if (s.class_id) names.add(s.class_id); });
    posts.forEach((p) => (p.class_ids || []).forEach((c) => names.add(c)));

    const chips = ['all'].concat(Array.from(names).sort());
    document.getElementById('classChips').innerHTML = chips.map((c) =>
      '<button class="chip' + (c === classFilter ? ' on' : '') + '" onclick="setClass(' +
      JSON.stringify(c).replace(/"/g, '&quot;') + ')">' +
      (c === 'all' ? 'All classes' : esc(c)) + '</button>'
    ).join('');
  }

  window.setClass = async (name) => {
    classFilter = name;
    renderChips();
    document.getElementById('feed').innerHTML = '<div class="empty">Loading…</div>';
    await loadPage(true);
  };

  /** Storage paths are turned into URLs once and cached: the same photo would
   *  otherwise be re-signed on every re-render, which the class chips do a lot. */
  const urlCache = new Map();
  async function mediaUrl(path) {
    if (urlCache.has(path)) return urlCache.get(path);
    const p = getDownloadURL(ref(storage, path)).catch(() => '');
    urlCache.set(path, p);
    return p;
  }

  async function renderFeed() {
    const feed = document.getElementById('feed');
    if (!posts.length) {
      feed.innerHTML = '<div class="empty">' + (isStaff()
        ? 'Nothing here yet. Share your first activity day.'
        : 'Nothing has been shared yet.') + '</div>';
      renderChips();
      return;
    }

    // Resolve every image URL before writing any HTML, so the page does not
    // reflow photo by photo as each signature comes back.
    const urls = {};
    for (const post of posts) {
      for (const item of (post.media || [])) urls[item.path] = await mediaUrl(item.path);
    }

    const days = [];
    const byDay = {};
    posts.forEach((p) => {
      if (!byDay[p.session_date]) { byDay[p.session_date] = []; days.push(p.session_date); }
      byDay[p.session_date].push(p);
    });

    // Kept for the recap and the poster, which work on a whole day rather
    // than a post — the same grouping the cards are drawn from, so what gets
    // shared is what was on screen.
    sessionsByDay = byDay;
    mediaUrls = urls;

    feed.innerHTML = days.map((day) =>
      '<div class="session">' +
        '<div class="session-head">' +
          '<span class="session-date">' + esc(prettyDate(day)) + '</span>' +
          (isStaff()
            ? '<button class="session-act" onclick="saveRecap(\\'' + day + '\\')">Save card</button>' +
              '<button class="session-act" onclick="printPoster(\\'' + day + '\\')">Print poster</button>'
            : '') +
        '</div>' +
        byDay[day].map((p) => postHtml(p, urls)).join('') +
      '</div>'
    ).join('');

    renderChips();
  }

  function postHtml(post, urls) {
    const media = post.media || [];
    const flag = post.status === 'pending'
      ? '<span class="status-flag status-pending">Awaiting approval</span>'
      : post.status === 'hidden'
        ? '<span class="status-flag status-hidden">Hidden</span>'
        : '';

    // Only the author, or an admin, is offered the controls — the callable
    // enforces the same rule, so this is about not showing a button that
    // would be refused.
    const canModerate = isStaff() &&
      (me.role === 'school_admin' || post.author_uid === me.uid);

    // The id is what paintReactions targets, so one like does not redraw the
    // feed and collapse a comment thread somebody has open.
    return '<div class="post" id="post-' + esc(post.id) + '">' +
      '<div class="post-head">' +
        '<span class="post-author">' + esc(post.author_name || (post.author_role === 'school_admin' ? 'School' : 'Teacher')) + '</span>' +
        flag +
      '</div>' +
      (post.text ? '<div class="post-text">' + esc(post.text) + '</div>' : '') +
      (media.length
        ? '<div class="grid' + (media.length === 1 ? ' one' : '') + '">' +
            media.map((m) => '<img loading="lazy" src="' + esc(urls[m.path] || '') + '" alt="">').join('') +
          '</div>'
        : '') +
      ((post.tagged || []).length
        ? '<div class="tags">' + post.tagged.map((t) =>
            '<span class="tag"><b>' + esc(t.first_name) + '</b>' +
            (t.class_id ? ' · ' + esc(t.class_id) : '') + '</span>').join('') +
          '</div>'
        : '') +
      // Reactions only on a post that is actually up. Liking something the
      // school has hidden, or has not approved yet, is applause for a thing
      // nobody outside the staff room can see.
      (post.status === 'published'
        ? '<div class="react-row">' +
            // The 'on' class has to be set here as well as in paintReactions.
            // Without it a post this account had already liked drew a filled
            // heart in the plain grey style, so the one state the button
            // exists to show was the one it did not show on arrival.
            '<button class="react-like' + (myLikes.has(post.id) ? ' on' : '') +
              '" onclick="toggleLike(\\'' + post.id + '\\')">' +
              (myLikes.has(post.id) ? '♥' : '♡') + ' ' + (post.like_count || 0) +
            '</button>' +
            '<button class="react-btn react-comments-count" onclick="toggleComments(\\'' + post.id + '\\')">' +
              'Comments (' + (post.comment_count || 0) + ')' +
            '</button>' +
          '</div>' +
          '<div class="comments" id="comments-' + post.id + '" data-open="0"></div>'
        : '') +
      (canModerate
        ? '<div style="margin-top:12px; display:flex; gap:8px;">' +
            (post.status === 'published'
              ? '<button class="btn btn-quiet" onclick="moderate(\\'' + post.id + '\\', \\'hide\\')">Hide</button>'
              : '<button class="btn btn-quiet" onclick="moderate(\\'' + post.id + '\\', \\'publish\\')">Publish</button>') +
            '<button class="btn btn-quiet" onclick="moderate(\\'' + post.id + '\\', \\'delete\\')">Delete</button>' +
          '</div>'
        : '') +
    '</div>';
  }

  window.moderate = async (postId, action) => {
    if (action === 'delete' &&
        !confirm('Delete this post? Its photos are deleted too, and that cannot be undone.')) return;
    try {
      await callModeratePost({ post_id: postId, action: action });
      await loadPage(true);
    } catch (err) {
      alert(err.message || 'That did not work.');
    }
  };

  // -------------------------------------------------------------------------
  // Likes and comments
  //
  // Nothing here writes a counter. like_count and comment_count live on the
  // post document, which firestore.rules closes to every client — the
  // countWallReactions trigger is their only writer. The numbers on screen are
  // adjusted optimistically and corrected by the next load.
  // -------------------------------------------------------------------------

  /** Which posts this account has already liked. Loaded once per page. */
  let myLikes = new Set();

  async function loadMyLikes() {
    myLikes = new Set();
    // One read per post rather than a collection-group query: the rules can
    // prove a single like document belongs to this school, and a
    // collectionGroup('likes') query cannot be scoped the same way.
    await Promise.all(posts.map(async (post) => {
      try {
        const snap = await getDoc(doc(db, 'school_posts', post.id, 'likes', me.uid));
        if (snap.exists()) myLikes.add(post.id);
      } catch (e) { /* a like nobody can read is a like this account has not given */ }
    }));
  }

  window.toggleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const ref = doc(db, 'school_posts', postId, 'likes', me.uid);
    const had = myLikes.has(postId);

    // Moved before the write so the button answers the tap. The count is the
    // trigger's, and it lands a moment later; this is the same number the next
    // load will confirm or correct.
    if (had) { myLikes.delete(postId); post.like_count = Math.max(0, (post.like_count || 0) - 1); }
    else { myLikes.add(postId); post.like_count = (post.like_count || 0) + 1; }
    paintReactions(postId);

    try {
      if (had) await deleteDoc(ref);
      else await setDoc(ref, { school_id: me.school_id, created_at: new Date().toISOString() });
    } catch (err) {
      // Put it back rather than leave a number the server never agreed to.
      if (had) { myLikes.add(postId); post.like_count = (post.like_count || 0) + 1; }
      else { myLikes.delete(postId); post.like_count = Math.max(0, (post.like_count || 0) - 1); }
      paintReactions(postId);
      alert(err.message || 'That did not work.');
    }
  };

  /** Repaint one post's like button and comment count, without redrawing the
   *  feed — a full render would collapse any comment thread that is open. */
  function paintReactions(postId) {
    const post = posts.find((p) => p.id === postId);
    const root = document.getElementById('post-' + postId);
    if (!post || !root) return;

    const heart = root.querySelector('.react-like');
    if (heart) {
      heart.classList.toggle('on', myLikes.has(postId));
      heart.innerHTML = (myLikes.has(postId) ? '♥' : '♡') + ' ' + (post.like_count || 0);
    }
    const count = root.querySelector('.react-comments-count');
    if (count) count.textContent = 'Comments (' + (post.comment_count || 0) + ')';
  }

  window.toggleComments = async (postId) => {
    const box = document.getElementById('comments-' + postId);
    if (!box) return;

    if (box.dataset.open === '1') {
      box.dataset.open = '0';
      box.innerHTML = '';
      return;
    }
    box.dataset.open = '1';
    box.innerHTML = '<div class="comment-empty">Loading…</div>';

    let snap;
    try {
      // Staff see hidden comments so they can restore one; everybody else
      // must say so in the query, because that is the only way the list rule
      // can prove a hidden comment will not come back. See firestore.rules.
      const clauses = [collection(db, 'school_posts', postId, 'comments')];
      if (!isStaff()) clauses.push(where('status', '==', 'visible'));
      clauses.push(orderBy('created_at', 'asc'), limit(100));

      snap = await getDocs(query.apply(null, clauses));
    } catch (err) {
      console.error('comments failed', err);
      box.innerHTML = '<div class="comment-empty">The comments could not be loaded.</div>';
      return;
    }

    const rows = [];
    snap.forEach((d) => rows.push(Object.assign({ id: d.id }, d.data())));

    const post = posts.find((p) => p.id === postId);
    const policy = post && post.comments_policy;
    // Staff whenever comments are on at all; a student only where the school
    // has deliberately opened them. See firestore.rules — the same two
    // clauses, because a UI that offers what the rules refuse is a UI that
    // hands people an error.
    const canPost = (isStaff() && commentsAllowed(postId)) ||
                    (isStudent() && policy === 'students');
    const placeholder = isStudent() ? 'Say something kind' : 'Write a note for your colleagues';

    box.innerHTML =
      (rows.length
        ? rows.map((c) =>
            '<div class="comment' + (c.status === 'hidden' ? ' is-hidden' : '') + '">' +
              '<b>' + esc(c.author_name || 'Staff') + '</b> ' + esc(c.text) +
              (c.status === 'hidden' ? '<span class="comment-flag">hidden</span>' : '') +
              (isStaff()
                ? '<button class="comment-act" onclick="setCommentStatus(\\'' + postId + '\\', \\'' + c.id + '\\', \\'' +
                  (c.status === 'hidden' ? 'visible' : 'hidden') + '\\')">' +
                  (c.status === 'hidden' ? 'Restore' : 'Hide') + '</button>'
                : '') +
            '</div>').join('')
        : '<div class="comment-empty">No comments yet.</div>') +
      (canPost
        ? '<div class="comment-new">' +
            '<input type="text" maxlength="500" id="cmt-' + esc(postId) + '" placeholder="' + esc(placeholder) + '">' +
            '<button class="btn btn-quiet" onclick="addComment(\\'' + postId + '\\')">Post</button>' +
          '</div>'
        : '');
  };

  /**
   * Change who may comment.
   *
   * Only posts published from here on carry the new setting: comments_policy
   * is stamped onto a post at publish time so the rules can check it with one
   * get(), and rewriting every past post to match would be a migration, not a
   * toggle. Said plainly on screen rather than left to be discovered.
   */
  window.saveCommentPolicy = async (value) => {
    const select = document.getElementById('commentPolicy');
    select.disabled = true;
    try {
      await updateDoc(doc(db, 'schools', me.school_id), {
        wall_settings: Object.assign({}, school.wall_settings || {}, { comments: value })
      });
      school.wall_settings = Object.assign({}, school.wall_settings || {}, { comments: value });
      showNotice(value === 'students'
        ? 'Students can comment on posts you publish from now on. Earlier posts keep the setting they were published with.'
        : 'Saved. It applies to posts you publish from now on.');
    } catch (err) {
      alert(err.message || 'That setting could not be saved.');
      select.value = (school.wall_settings && school.wall_settings.comments) || 'staff';
    } finally {
      select.disabled = false;
    }
  };

  /** The school's setting, stamped on each post when it was published. */
  function commentsAllowed(postId) {
    const post = posts.find((p) => p.id === postId);
    return !!post && post.comments_policy !== 'off';
  }

  window.addComment = async (postId) => {
    const input = document.getElementById('cmt-' + postId);
    if (!input) return;
    const text = String(input.value || '').trim();
    if (!text) return;

    input.disabled = true;
    try {
      await addDoc(collection(db, 'school_posts', postId, 'comments'), {
        school_id: me.school_id,
        author_uid: me.uid,
        author_name: commentAuthorName(),
        author_role: me.role,
        text: text,
        status: 'visible',
        created_at: new Date().toISOString()
      });
      const post = posts.find((p) => p.id === postId);
      if (post) post.comment_count = (post.comment_count || 0) + 1;
      input.value = '';
      paintReactions(postId);
      // Reopened rather than appended, so the new comment arrives in the same
      // order the server will show it in next time.
      await toggleComments(postId);
      await toggleComments(postId);
    } catch (err) {
      alert(err.message || 'That comment could not be posted.');
    } finally {
      input.disabled = false;
    }
  };

  window.setCommentStatus = async (postId, commentId, status) => {
    try {
      await updateDoc(doc(db, 'school_posts', postId, 'comments', commentId), { status: status });
      await toggleComments(postId);
      await toggleComments(postId);
    } catch (err) {
      alert(err.message || 'That did not work.');
    }
  };

  // -------------------------------------------------------------------------
  // Sharing a day: the recap card and the notice-board poster
  //
  // A wall nobody outside the school sees is a wall the school stops updating.
  // In Pakistan the thing that actually travels is a WhatsApp image, and the
  // thing a parent who never opens a link still sees is a sheet of paper on
  // the school wall. These two outputs are the distribution.
  // -------------------------------------------------------------------------

  /** What one day amounts to: its note, its photos, and who was in them. */
  function daySummary(day) {
    const dayPosts = (sessionsByDay[day] || []).filter((p) => p.status === 'published');
    const notes = [];
    const photos = [];
    const names = [];
    const seenNames = new Set();

    dayPosts.forEach((post) => {
      if (post.text) notes.push(post.text);
      (post.media || []).forEach((m) => {
        const url = mediaUrls[m.path];
        if (url) photos.push(url);
      });
      (post.tagged || []).forEach((t) => {
        const label = t.first_name + (t.class_id ? ' · ' + t.class_id : '');
        if (!seenNames.has(label)) { seenNames.add(label); names.push(label); }
      });
    });

    return { day: day, notes: notes, photos: photos, names: names };
  }

  /**
   * Load an image for the canvas.
   *
   * crossOrigin is required or the canvas is tainted and toBlob throws a
   * SecurityError — the bucket's CORS config (cors.json) is what makes this
   * succeed on the live origins. A photo that will not load is skipped rather
   * than failing the card: a recap with three photos beats no recap.
   */
  function loadForCanvas(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /**
   * Wrap text to a width, returning the lines. Canvas has no such thing.
   *
   * The double backslash in the split is NOT a typo. This whole script lives
   * inside a JavaScript template literal, where an unrecognised escape is
   * swallowed: a single-backslash-s reaches the browser as a bare 's', the
   * regex becomes /s+/, and every letter s in a teacher's note is treated as
   * a word break. That shipped once and read as "The children practi ed wudu
   *  tep by tep" on the recap card.
   */
  function wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').split(/\\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    let dropped = false;

    for (let i = 0; i < words.length; i++) {
      const candidate = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; continue; }

      if (lines.length + 1 === maxLines && line) {
        // No room for another line: whatever is left does not fit.
        dropped = true;
        break;
      }
      if (line) lines.push(line);
      line = words[i];
    }
    if (line) lines.push(line);

    // The ellipsis says "there was more". Adding it to text that fitted — as
    // this did to every school name short enough to sit on one line — says
    // something untrue about the school's own name.
    if (dropped && lines.length) {
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last + '…';
    }
    return lines;
  }

  /**
   * Draw the day as a 1080x1350 card and hand it over.
   *
   * Portrait, because it is going into WhatsApp, where a landscape image is
   * shown as a letterbox the size of a stamp.
   */
  window.saveRecap = async (day) => {
    const button = event && event.target;
    if (button) { button.disabled = true; button.textContent = 'Building…'; }

    try {
      const summary = daySummary(day);
      const W = 1080, H = 1350;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Brand band along the top, so a card forwarded on its own still says
      // which school it came from.
      ctx.fillStyle = '#1E2D5A';
      ctx.fillRect(0, 0, W, 132);
      ctx.fillStyle = '#E08020';
      ctx.fillRect(0, 126, W, 6);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 44px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(wrapLines(ctx, school.name || 'Our school', W - 100, 1)[0] || '', 50, 66);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 52px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(prettyDate(day), 50, 178);

      // Photos: up to four, in a 2x2 grid, cropped to fill rather than
      // squashed. A stretched photograph of a child looks careless.
      const images = [];
      for (const url of summary.photos.slice(0, 4)) {
        const img = await loadForCanvas(url);
        if (img) images.push(img);
      }

      let y = 268;
      if (images.length) {
        // One or two photos go full width and stacked; three or four go two
        // across. Two side by side would be a pair of short wide strips with
        // the children's faces the size of a thumbnail, and most of the card
        // left blank underneath — which is what a shared image gets judged on.
        const gap = 12;
        const cols = images.length <= 2 ? 1 : 2;
        const cellW = (W - 100 - (cols - 1) * gap) / cols;
        const rows = Math.ceil(images.length / cols);
        const cellH = images.length === 1 ? 660 : images.length === 2 ? 340 : 300;

        images.forEach((img, i) => {
          const cx = 50 + (i % cols) * (cellW + gap);
          const cy = y + Math.floor(i / cols) * (cellH + gap);
          const scale = Math.max(cellW / img.width, cellH / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;

          ctx.save();
          ctx.beginPath();
          ctx.rect(cx, cy, cellW, cellH);
          ctx.clip();
          ctx.drawImage(img, cx + (cellW - dw) / 2, cy + (cellH - dh) / 2, dw, dh);
          ctx.restore();
        });

        y += rows * (cellH + gap) + 18;
      }

      if (summary.notes.length) {
        ctx.fillStyle = '#334155';
        ctx.font = '400 34px Inter, system-ui, sans-serif';
        const lines = wrapLines(ctx, summary.notes.join(' · '), W - 100, 4);
        lines.forEach((line, i) => ctx.fillText(line, 50, y + i * 46));
        y += lines.length * 46 + 22;
      }

      if (summary.names.length) {
        ctx.fillStyle = '#1E2D5A';
        ctx.font = '700 36px Inter, system-ui, sans-serif';
        ctx.fillText(summary.names.length + (summary.names.length === 1 ? ' child took part' : ' children took part'), 50, y);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 26px Inter, system-ui, sans-serif';
      ctx.fillText('Imaan & Akhlaq', 50, H - 62);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('The card could not be built.');

      const file = new File([blob], 'wall-' + day + '.jpg', { type: 'image/jpeg' });

      // Share sheet where the phone has one — that is the whole point, since
      // the destination is almost always WhatsApp. Desktop gets a download.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: prettyDate(day) });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err) {
      // A SecurityError here means the bucket's CORS config does not cover
      // this origin, so the photos tainted the canvas. Worth saying plainly
      // rather than "something went wrong".
      console.error('recap failed', err);
      alert(err && err.name === 'SecurityError'
        ? 'The photos could not be read for the card. The storage bucket needs this site in its CORS list.'
        : 'The card could not be built. Please try again.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Save card'; }
    }
  };

  /**
   * The sheet that goes on the notice board.
   *
   * Print rather than an image: a school has a printer and A4 paper, and the
   * parent this is for is the one who never opens a link. First names and
   * classes only — the same rule the wall itself follows, and it matters more
   * here, because this ends up on a wall anyone walking past can read.
   */
  window.printPoster = (day) => {
    const summary = daySummary(day);
    const poster = document.getElementById('poster');

    poster.innerHTML =
      '<h2>' + esc(school.name || 'Our school') + '</h2>' +
      '<div class="poster-date">' + esc(prettyDate(day)) + '</div>' +
      (summary.notes.length
        ? '<div class="poster-note">' + esc(summary.notes.join(' · ')) + '</div>'
        : '') +
      (summary.photos.length
        ? '<div class="poster-grid">' +
            summary.photos.slice(0, 4).map((url) =>
              '<img src="' + esc(url) + '" alt="">').join('') +
          '</div>'
        : '') +
      (summary.names.length
        ? '<div class="poster-names">' +
            summary.names.map((n) => '<span>' + esc(n) + '</span>').join('') +
          '</div>'
        : '') +
      '<div class="poster-foot">Imaan &amp; Akhlaq</div>';

    // A beat for the browser to lay the poster out before the print dialog
    // freezes it — without it the first print of a session comes out blank.
    //
    // setTimeout and not requestAnimationFrame: rAF does not fire at all in a
    // tab the browser is not compositing, so the callback would never run and
    // the print dialog would simply never open, with nothing on screen to say
    // why. A timer fires either way.
    setTimeout(() => window.print(), 60);
  };

  // -------------------------------------------------------------------------
  // Composer
  // -------------------------------------------------------------------------

  /**
   * Open the composer, optionally filled in from somewhere else.
   *
   * The draft is what the teacher dashboard's "Share today to the wall" hands
   * over: the day, what was covered and who took part. The photographs are not
   * in it — an activity sheet holds a grid and a paragraph, never an image —
   * so the one thing left to do is the one thing only the teacher can do.
   */
  window.openComposer = (draft) => {
    staged = [];
    picked = new Set();
    document.getElementById('cSearch').value = '';
    document.getElementById('cFiles').value = '';
    document.getElementById('cThumbs').innerHTML = '';
    document.getElementById('cProgress').textContent = '';

    document.getElementById('cText').value = (draft && draft.text) || '';
    // Defaults to today, which for a school posting the same evening is right,
    // and is a date field so a Tuesday upload of a Saturday session is one tap.
    document.getElementById('cDate').value =
      (draft && draft.session_date) || new Date().toISOString().slice(0, 10);

    if (draft && Array.isArray(draft.tagged)) {
      // Only children who may be photographed are ticked, and only ones the
      // wall's own roster knows. Pre-ticking a blocked child would show a
      // checkbox that is checked and disabled at once, and publishPost would
      // drop the tag anyway — the teacher would learn about it after posting
      // instead of before.
      const allowed = new Set(
        roster.filter((s) => s.media_consent === 'granted').map((s) => s.uid)
      );
      let excluded = 0;
      draft.tagged.forEach((uid) => {
        if (allowed.has(uid)) picked.add(uid); else excluded++;
      });
      if (excluded) {
        document.getElementById('cProgress').textContent =
          excluded + ' student(s) who took part are not tagged — their photo consent is not recorded.';
      }
    }

    renderPicker();
    document.getElementById('composer').classList.add('open');
  };

  /**
   * A draft left by the teacher dashboard, if there is one.
   *
   * Removed as it is read: a draft that survived would reopen the composer
   * every time the teacher came back to the wall, over a session they had
   * already posted.
   */
  function takeStashedDraft() {
    try {
      const raw = sessionStorage.getItem('wall_draft');
      if (!raw) return null;
      sessionStorage.removeItem('wall_draft');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  window.closeComposer = () => {
    staged.forEach((s) => URL.revokeObjectURL(s.url));
    staged = [];
    document.getElementById('composer').classList.remove('open');
  };

  window.renderPicker = () => {
    const term = document.getElementById('cSearch').value.trim().toLowerCase();
    const shown = roster.filter((s) => {
      if (!term) return true;
      return String(s.name || '').toLowerCase().indexOf(term) !== -1 ||
             String(s.class_id || '').toLowerCase().indexOf(term) !== -1;
    }).slice(0, 200);

    if (!shown.length) {
      document.getElementById('cPicker').innerHTML =
        '<div class="pick-row" style="color:var(--muted);">No students match that.</div>';
      return;
    }

    document.getElementById('cPicker').innerHTML = shown.map((s) => {
      // Shown but not selectable, deliberately. A child missing from the list
      // looks like a bug and the teacher retypes the name; a child listed with
      // the reason tells them to go and ask the parent.
      const allowed = s.media_consent === 'granted';
      const why = s.media_consent === 'denied' ? 'No photos' : 'Consent not recorded';
      return '<label class="pick-row' + (allowed ? '' : ' blocked') + '">' +
        '<input type="checkbox" value="' + esc(s.uid) + '"' +
          (allowed ? '' : ' disabled') + (picked.has(s.uid) ? ' checked' : '') +
          ' onchange="togglePick(this)">' +
        '<span>' + esc(s.name || 'Unnamed') + '</span>' +
        '<span style="color:var(--muted);">' + esc(s.class_id || '') + '</span>' +
        (allowed ? '' : '<span class="pick-why">' + why + '</span>') +
      '</label>';
    }).join('');
  };

  window.togglePick = (input) => {
    if (input.checked) picked.add(input.value); else picked.delete(input.value);
  };

  /**
   * Compress before upload: longest edge 1600px, JPEG 0.82.
   *
   * A 4 MB phone photo lands around 250-400 KB. Thirty of those over a
   * school's connection is the difference between a teacher finishing and a
   * teacher giving up, and it is also what keeps the storage bill sane.
   */
  function compress(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('That image could not be read.'));
          resolve({ blob: blob, w: w, h: h });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image.')); };
      img.src = url;
    });
  }

  window.stageFiles = async (input) => {
    const files = Array.from(input.files || []);
    const progress = document.getElementById('cProgress');
    for (const file of files) {
      if (staged.length >= 10) { alert('Ten photos is the limit for one post.'); break; }
      progress.textContent = 'Preparing ' + file.name + '…';
      try {
        const out = await compress(file);
        staged.push({
          blob: out.blob, w: out.w, h: out.h,
          url: URL.createObjectURL(out.blob)
        });
      } catch (err) {
        alert(err.message);
      }
    }
    progress.textContent = '';
    input.value = '';
    document.getElementById('cThumbs').innerHTML =
      staged.map((s) => '<img src="' + s.url + '" alt="">').join('');
  };

  window.publish = async () => {
    const button = document.getElementById('cPublish');
    const progress = document.getElementById('cProgress');
    const sessionDate = document.getElementById('cDate').value;
    const text = document.getElementById('cText').value.trim();

    if (!sessionDate) return alert('Which day was this?');
    if (!text && !staged.length) return alert('Add a photo or a note.');

    button.disabled = true;
    try {
      // Upload to the caller's own staging tray, then hand the paths to
      // publishPost, which verifies each one is inside that tray before moving
      // it. Nothing here writes to the published prefix — storage.rules
      // refuses that outright.
      const media = [];
      for (let i = 0; i < staged.length; i++) {
        const item = staged[i];
        progress.textContent = 'Uploading photo ' + (i + 1) + ' of ' + staged.length + '…';
        const name = Date.now() + '-' + i + '.jpg';
        const path = 'wall_staging/' + me.school_id + '/' + me.uid + '/' + name;
        const task = uploadBytesResumable(ref(storage, path), item.blob, { contentType: 'image/jpeg' });
        await new Promise((resolve, reject) => {
          task.on('state_changed', (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            progress.textContent = 'Uploading photo ' + (i + 1) + ' of ' + staged.length + ' — ' + pct + '%';
          }, reject, resolve);
        });
        media.push({ path: path, type: 'image', w: item.w, h: item.h, bytes: item.blob.size });
      }

      progress.textContent = 'Publishing…';
      const res = await callPublishPost({
        text: text,
        session_date: sessionDate,
        tagged: Array.from(picked),
        media: media
      });

      // Consent is enforced in the callable, not here, so a child can still be
      // dropped after the teacher pressed Publish — a parent may have changed
      // their mind between the roster loading and this moment. Saying so beats
      // a tag that quietly vanished.
      const dropped = (res.data && res.data.dropped_tags) || [];
      closeComposer();
      if (dropped.length) {
        alert('Posted. ' + dropped.length + ' student(s) were left out because their photo consent is not recorded.');
      }
      await loadPage(true);
    } catch (err) {
      alert(err.message || 'The post could not be published.');
    } finally {
      button.disabled = false;
      progress.textContent = '';
    }
  };
</script>
`
