import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

/**
 * A child signs in with a roll number and a PIN:
 * /s?org=alkhidmat&school=gulshan-campus#TOKEN
 *
 * Two boxes and no list of names. A name picker would be kinder to a
 * six-year-old, but this page is reachable by anyone holding the link, and a
 * picker would turn that link into a printed roster of every child in the
 * school — their names and their classes, on a page with no login in front of
 * it. See ORG_PORTAL_PLAN.md §4.
 *
 * What comes back from studentSignIn is a Firebase custom token, so the child
 * ends up in a real session and the student dashboard needs no special case.
 */
export const StudentPinPage = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  #spin {
    --navy: #1E2D5A;
    --pink: #cf296d;
    --ink:  #0f172a;
    --muted:#64748b;
    --line: #e2e8f0;

    font-family: 'Inter', system-ui, sans-serif;
    color: var(--ink);
    background: linear-gradient(160deg, #16294d 0%, #24406f 55%, #1b3157 100%);
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 18px 56px;
  }

  #spin * { box-sizing: border-box; }

  .sp-card {
    width: 100%; max-width: 400px;
    background: #fff; border-radius: 22px;
    padding: 28px 24px 24px;
    box-shadow: 0 24px 60px rgba(8,17,38,.34);
    text-align: center;
  }

  .sp-mark {
    width: 66px; height: 66px; border-radius: 20px;
    object-fit: cover; margin: 0 auto 12px; display: block;
  }
  .sp-school {
    font-family: 'Fredoka', system-ui, sans-serif;
    font-size: 1.4rem; line-height: 1.2; margin: 0 0 4px;
  }
  .sp-org {
    font-size: .78rem; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 20px;
  }

  .sp-field { text-align: left; margin-bottom: 14px; }
  .sp-field label {
    display: block; font-size: .82rem; font-weight: 700;
    margin-bottom: 5px; color: #334155;
  }
  .sp-field input {
    width: 100%; padding: 13px; font: inherit;
    border: 1px solid #cbd5e1; border-radius: 13px; background: #fff;
    color: var(--ink);
    /* Big, spaced digits: this is typed by a child, often on a shared phone. */
    font-size: 1.3rem; font-weight: 700; letter-spacing: .18em;
    text-align: center;
  }
  .sp-field input:focus {
    outline: none; border-color: var(--pink);
    box-shadow: 0 0 0 3px rgba(207,41,109,.14);
  }

  .sp-go {
    width: 100%; margin-top: 6px; padding: 14px;
    font: inherit; font-weight: 800; font-size: 1rem;
    color: #fff; background: var(--pink);
    border: none; border-radius: 15px; cursor: pointer;
  }
  .sp-go:hover:not(:disabled) { background: #b52259; }
  .sp-go:disabled { opacity: .6; cursor: default; }

  .sp-error {
    background: #fdecea; border: 1px solid #f5c6c2; color: #8a1c16;
    border-radius: 12px; padding: 11px 13px; font-size: .87rem;
    margin-bottom: 14px; text-align: left;
  }
  .sp-foot {
    font-size: .78rem; color: var(--muted); margin-top: 16px; line-height: 1.5;
  }
  .sp-state { color: #dbe6f7; text-align: center; font-size: .95rem; }
</style>

<div id="spin">
  <div id="spBody" style="width:100%">
    <div class="sp-state">Opening…</div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, connectAuthEmulator, signInWithCustomToken, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const functions = getFunctions(app);

  ${raw(emulatorConnectJS)}
  connectEmulators({ auth, functions, connectAuthEmulator, connectFunctionsEmulator });

  const callSignIn = httpsCallable(functions, 'studentSignIn');
  const body = document.getElementById('spBody');

  const params = new URLSearchParams(location.search);
  // Shown, never trusted. studentSignIn resolves the school from the token
  // alone; these two only tell the child they opened the right link.
  const orgSlug    = params.get('org') || '';
  const schoolSlug = params.get('school') || '';
  let token = decodeURIComponent((location.hash || '').replace(/^#/, '').trim());

  // A school that rotated its link sends the new one round, and a child may
  // open it in the tab where the old one is still sitting. Changing only the
  // fragment does not reload the page, so without this the child would keep
  // signing in against the retired token and be told their PIN is wrong.
  // ParentWall listens for the same reason.
  window.addEventListener('hashchange', () => {
    token = decodeURIComponent((location.hash || '').replace(/^#/, '').trim());
  });

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /** 'gulshan-campus' reads back as 'Gulshan Campus'. */
  const titleise = (slug) => String(slug || '')
    .split('-').filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  function render() {
    body.innerHTML =
      '<div class="sp-card">' +
        '<img class="sp-mark" src="/kidba_assets/img/3d_school.png" alt="">' +
        '<h1 class="sp-school">' + esc(titleise(schoolSlug) || 'Your school') + '</h1>' +
        '<div class="sp-org">' + esc(titleise(orgSlug)) + '</div>' +
        '<div id="spError"></div>' +
        '<div class="sp-field"><label for="spRoll">Roll number</label>' +
          '<input id="spRoll" inputmode="numeric" autocomplete="off" placeholder="31"></div>' +
        '<div class="sp-field"><label for="spPin">PIN</label>' +
          '<input id="spPin" inputmode="numeric" type="password" autocomplete="off" maxlength="4" placeholder="••••"></div>' +
        '<button class="sp-go" id="spGo" type="button">Open my dashboard</button>' +
        '<div class="sp-foot">Your teacher gave you these on a slip. Lost it? Ask your teacher for a new PIN.</div>' +
      '</div>';

    document.getElementById('spGo').addEventListener('click', go);
    body.querySelectorAll('input').forEach((el) => {
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    });
    document.getElementById('spRoll').focus();
  }

  function showError(message) {
    const box = document.getElementById('spError');
    if (box) box.innerHTML = '<div class="sp-error">' + esc(message) + '</div>';
  }

  async function go() {
    const btn  = document.getElementById('spGo');
    const roll = (document.getElementById('spRoll').value || '').trim();
    const pin  = (document.getElementById('spPin').value || '').trim();

    if (!roll || !pin) return showError('Type your roll number and your PIN.');

    btn.disabled = true;
    btn.textContent = 'Checking…';
    document.getElementById('spError').innerHTML = '';

    try {
      const res = (await callSignIn({ school_token: token, roll_no: roll, pin: pin })).data;

      // The session outlives the tab, because a child on a shared phone
      // should not have to find the slip again after a stray back button.
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
      await signInWithCustomToken(auth, res.token);

      btn.textContent = 'Welcome ' + (res.name || '') + '!';
      // The wall, not the books dashboard. A child who signs in with a slip
      // from a community school comes for what their class did last week —
      // their own work is one link away, on the wall's bar.
      location.href = '/school-wall';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Open my dashboard';
      document.getElementById('spPin').value = '';
      showError((err && err.message) || 'That did not work. Try again.');
    }
  }

  if (!token) {
    body.innerHTML = '<div class="sp-state">This link is incomplete. Ask your teacher for the full one.</div>';
  } else {
    render();
  }
</script>
`

export const generateStudentPinHTML = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Sign in — Imaan &amp; Akhlaq</title>
  <link rel="icon" href="/kidba_assets/img/splash_logo.jpg">
</head>
<body style="margin:0">
  ${StudentPinPage()}
</body>
</html>
`
