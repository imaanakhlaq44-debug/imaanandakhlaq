import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

/**
 * One child's wall, for a parent holding a link.
 *
 * There is no sign-in on this page and there is not meant to be. A parent who
 * receives a printed slip or a WhatsApp message will not create an account —
 * that is the whole reason the guardian role was dropped rather than deferred.
 * The token in the URL is the credential, resolved by readParentWall on the
 * Admin SDK. See SCHOOL_GROUP_PLAN.md §7.
 *
 * Consequently this page reads NOTHING from Firestore directly. Every rule in
 * firestore.rules requires request.auth, and parent_links is closed to every
 * client, so the two callables are the only doors.
 */
export const ParentWall = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  #pwall {
    --navy:   #1E2D5A;
    --pink:   #D63678;
    --orange: #E08020;
    --ink:    #0f172a;
    --muted:  #64748b;
    --line:   #e2e8f0;

    font-family: 'Inter', system-ui, sans-serif;
    background: #f7f8fc; color: var(--ink); min-height: 100vh; margin: 0;
  }
  #pwall * { box-sizing: border-box; }
  #pwall h1, #pwall h2 { font-family: 'Fredoka', system-ui, sans-serif; margin: 0; }

  .pw-head {
    background: #fff; border-bottom: 1px solid var(--line); padding: 18px 20px;
    text-align: center;
  }
  .pw-head h1 { font-size: 1.3rem; color: var(--navy); }
  .pw-head p { margin: 4px 0 0; color: var(--muted); font-size: 0.88rem; font-weight: 600; }

  .pw-inner { max-width: 620px; margin: 0 auto; padding: 20px 16px 60px; }

  .pw-day {
    font-size: 0.78rem; font-weight: 800; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.06em; margin: 22px 0 10px;
  }
  .pw-post {
    background: #fff; border: 1px solid var(--line); border-radius: 14px;
    padding: 16px; margin-bottom: 12px;
  }
  .pw-text { line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
  .pw-media { display: grid; gap: 6px; margin-top: 12px; }
  .pw-media img {
    width: 100%; border-radius: 10px; display: block; background: #eef1f6;
  }
  .pw-missing {
    background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px;
    padding: 26px; text-align: center; color: var(--muted);
    font-size: 0.85rem; font-weight: 600;
  }

  .pw-foot { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
  .pw-heart {
    border: 1px solid var(--line); background: #fff; border-radius: 999px;
    padding: 7px 15px; font-size: 0.9rem; font-weight: 700; cursor: pointer;
    font-family: inherit; color: var(--muted); display: inline-flex; gap: 7px;
  }
  .pw-heart.on { border-color: var(--pink); color: var(--pink); background: #fdeaf3; }
  .pw-heart:disabled { opacity: 0.6; cursor: default; }
  .pw-child { font-size: 0.8rem; font-weight: 700; color: var(--navy); margin-left: auto; }

  .pw-state { text-align: center; padding: 70px 20px; color: var(--muted); font-weight: 600; line-height: 1.6; }
</style>

<div id="pwall">
  <div class="pw-head">
    <h1 id="pwTitle">Loading…</h1>
    <p id="pwSub"></p>
  </div>
  <div class="pw-inner">
    <div id="pwBody"><div class="pw-state">Opening your child's wall…</div></div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const functions = getFunctions(app);

  // Local development only. USE_EMULATORS is a build-time constant, so a
  // production build emits this block with the connect calls already dead.
  ${raw(emulatorConnectJS)}
  connectEmulators({ functions, connectFunctionsEmulator });


  const callReadParentWall = httpsCallable(functions, 'readParentWall');
  const callAppreciatePost = httpsCallable(functions, 'appreciatePost');

  // /wall/p#<token>. A fragment, not a path segment and not a query string:
  // the browser never sends it to the server, so the token cannot appear in an
  // access log or a Referer header. It is also the only shape a static SSG
  // build can serve, since /wall/p/<token> would need a file per token.
  function currentToken() {
    return decodeURIComponent((window.location.hash || '').replace(/^#/, '').trim());
  }
  let token = currentToken();

  // A family with two children holds two links. Opening the second one while
  // the first is still on screen changes only the fragment, which does not
  // reload the page — without this the parent keeps looking at the other
  // child's wall and has no way to tell.
  window.addEventListener('hashchange', () => {
    token = currentToken();
    document.getElementById('pwBody').innerHTML =
      '<div class="pw-state">Opening…</div>';
    load();
  });

  let posts = [];

  function esc(value) {
    const d = document.createElement('div');
    d.textContent = String(value == null ? '' : value);
    return d.innerHTML;
  }

  /** Same reasoning as the staff wall: never new Date('2026-08-22'), which
   *  reads as UTC and names the previous day west of Greenwich. */
  function prettyDate(iso) {
    const parts = String(iso || '').split('-');
    if (parts.length !== 3) return iso || '';
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function state(message) {
    document.getElementById('pwBody').innerHTML =
      '<div class="pw-state">' + esc(message) + '</div>';
  }

  async function load() {
    if (!token) {
      document.getElementById('pwTitle').textContent = 'Link not found';
      state('This link is missing its code. Please ask the school for a new one.');
      return;
    }

    let data;
    try {
      const res = await callReadParentWall({ token: token });
      data = res.data;
    } catch (err) {
      document.getElementById('pwTitle').textContent = 'Link not valid';
      // The callable returns the same message for a wrong, expired and revoked
      // token on purpose, so this does not try to be more specific than it is.
      state(err.message || 'This link is no longer valid. Please ask the school for a new one.');
      return;
    }

    document.getElementById('pwTitle').textContent = data.student_name || 'Your child';
    document.getElementById('pwSub').textContent = data.school_name || '';
    posts = data.posts || [];
    render();
  }

  function render() {
    const body = document.getElementById('pwBody');
    if (!posts.length) {
      state('Nothing has been shared yet. When the school posts photos of your child, they will appear here.');
      return;
    }

    const days = [];
    const byDay = {};
    posts.forEach((p) => {
      if (!byDay[p.session_date]) { byDay[p.session_date] = []; days.push(p.session_date); }
      byDay[p.session_date].push(p);
    });

    body.innerHTML = days.map((day) =>
      '<div class="pw-day">' + esc(prettyDate(day)) + '</div>' +
      byDay[day].map(postHtml).join('')
    ).join('');
  }

  function postHtml(post) {
    const media = post.media || [];
    return '<div class="pw-post" id="post-' + esc(post.id) + '">' +
      (post.text ? '<div class="pw-text">' + esc(post.text) + '</div>' : '') +
      (media.length
        ? '<div class="pw-media">' + media.map((m) => m.url
            ? '<img loading="lazy" src="' + esc(m.url) + '" alt="">'
            // An entry with no URL is a photo whose link could not be built.
            // Saying so gives the parent something to ask the school about;
            // hiding it would make the photograph look like it never existed.
            : '<div class="pw-missing">This photo could not be loaded. Please refresh, or tell the school.</div>'
          ).join('') + '</div>'
        : '') +
      '<div class="pw-foot">' +
        '<button class="pw-heart' + (post.liked ? ' on' : '') + '" ' +
          'onclick="appreciate(\\'' + esc(post.id) + '\\')">' +
          '<span>' + (post.liked ? '♥' : '♡') + '</span>' +
          '<span>' + (post.like_count || 0) + '</span>' +
        '</button>' +
        (post.child_first_name
          ? '<span class="pw-child">' + esc(post.child_first_name) + '</span>'
          : '') +
      '</div>' +
    '</div>';
  }

  /**
   * No account, no password — the link is the identity. The callable keys the
   * like off a hash of the token, so tapping twice takes it back and tapping
   * ten times still counts once.
   */
  window.appreciate = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const button = document.querySelector('#post-' + CSS.escape(postId) + ' .pw-heart');
    if (button) button.disabled = true;

    try {
      const res = await callAppreciatePost({ token: token, post_id: postId });
      post.liked = !!(res.data && res.data.liked);
      post.like_count = Math.max(0, (post.like_count || 0) + (post.liked ? 1 : -1));
      render();
    } catch (err) {
      alert(err.message || 'That did not work. Please try again.');
      if (button) button.disabled = false;
    }
  };

  load();
</script>
`
