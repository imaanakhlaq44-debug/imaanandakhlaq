import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

/**
 * A school registers itself under an organisation: /join?org=alkhidmat#TOKEN
 *
 * There is no sign-in on this page and there is not meant to be — the head
 * teacher opening it has no account yet, which is the entire point. The token
 * in the fragment is the credential, and registerSchoolInOrg on the Admin SDK
 * is the only door. See ORG_PORTAL_PLAN.md §3.
 *
 * The page reads NOTHING from Firestore: orgs is closed to every client, so
 * even the organisation's name arrives through describeOrgInvite.
 */
export const OrgJoinPage = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  #join {
    --navy:   #1E2D5A;
    --pink:   #cf296d;
    --ink:    #0f172a;
    --muted:  #64748b;
    --line:   #e2e8f0;

    font-family: 'Inter', system-ui, sans-serif;
    color: var(--ink);
    background: linear-gradient(160deg, #eef3fb 0%, #f7f9fc 60%);
    min-height: 100vh;
    padding: 28px 18px 64px;
  }

  #join * { box-sizing: border-box; }

  .jn-card {
    max-width: 520px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 26px 24px;
    box-shadow: 0 18px 40px rgba(30,45,90,.08);
  }

  .jn-kicker {
    font-size: .7rem; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
  }
  .jn-org {
    font-family: 'Fredoka', system-ui, sans-serif;
    font-size: 1.55rem; line-height: 1.2; margin: 0 0 6px;
  }
  .jn-lede { color: var(--muted); font-size: .93rem; margin: 0 0 22px; }

  .jn-field { margin-bottom: 14px; }
  .jn-field label {
    display: block; font-size: .8rem; font-weight: 700;
    margin-bottom: 5px; color: #334155;
  }
  .jn-field input {
    width: 100%; padding: 11px 13px; font: inherit; font-size: .95rem;
    border: 1px solid #cbd5e1; border-radius: 12px; background: #fff;
    color: var(--ink);
  }
  .jn-field input:focus {
    outline: none; border-color: var(--pink);
    box-shadow: 0 0 0 3px rgba(207,41,109,.12);
  }
  .jn-hint { font-size: .76rem; color: var(--muted); margin-top: 4px; }

  .jn-submit {
    width: 100%; margin-top: 8px; padding: 13px;
    font: inherit; font-weight: 700; font-size: .98rem;
    color: #fff; background: var(--pink);
    border: none; border-radius: 14px; cursor: pointer;
  }
  .jn-submit:hover:not(:disabled) { background: #b52259; }
  .jn-submit:disabled { opacity: .6; cursor: default; }

  .jn-state {
    max-width: 520px; margin: 0 auto; text-align: center;
    color: var(--muted); padding: 60px 20px; font-size: .95rem;
  }
  .jn-error {
    background: #fdecea; border: 1px solid #f5c6c2; color: #8a1c16;
    border-radius: 12px; padding: 11px 13px; font-size: .87rem;
    margin-bottom: 16px;
  }

  .jn-done-mark {
    width: 54px; height: 54px; border-radius: 50%;
    background: #e8f5f0; color: #17795e;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; margin: 0 auto 14px;
  }
  .jn-link-box {
    background: #f8fafc; border: 1px solid var(--line); border-radius: 14px;
    padding: 14px; margin: 16px 0 8px; text-align: left;
  }
  .jn-link-label {
    font-size: .72rem; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
  }
  .jn-link {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: .82rem; word-break: break-all; color: var(--navy);
    line-height: 1.5;
  }
  .jn-copy {
    margin-top: 10px; padding: 8px 14px; font: inherit; font-size: .84rem;
    font-weight: 700; color: var(--navy); background: #fff;
    border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer;
  }
  .jn-warn {
    font-size: .82rem; color: #9a6510; background: #fdf3e3;
    border: 1px solid #f0dcb8; border-radius: 12px;
    padding: 11px 13px; margin-top: 14px; text-align: left;
  }
</style>

<div id="join">
  <div id="jnBody">
    <div class="jn-state">Opening…</div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const functions = getFunctions(app);

  ${raw(emulatorConnectJS)}
  connectEmulators({ functions, connectFunctionsEmulator });

  const callDescribe = httpsCallable(functions, 'describeOrgInvite');
  const callRegister = httpsCallable(functions, 'registerSchoolInOrg');

  const body = document.getElementById('jnBody');

  // The name rides in the query and the secret in the fragment. The query is
  // what makes this one static file answer for every organisation; the
  // fragment is what keeps the token out of access logs and Referer headers.
  const slug  = new URLSearchParams(location.search).get('org') || '';
  const token = decodeURIComponent((location.hash || '').replace(/^#/, '').trim());

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function fail(message) {
    body.innerHTML = '<div class="jn-state">' + esc(message) + '</div>';
  }

  function form(org) {
    body.innerHTML =
      '<div class="jn-card">' +
        '<div class="jn-kicker">Registering with</div>' +
        '<h1 class="jn-org">' + esc(org.name) + '</h1>' +
        '<p class="jn-lede">Register your school once. You will get your own dashboard, and your own link for your students.</p>' +
        '<div id="jnError"></div>' +
        '<div class="jn-field"><label for="jnSchool">School name</label>' +
          '<input id="jnSchool" autocomplete="organization" placeholder="Gulshan Campus"></div>' +
        '<div class="jn-field"><label for="jnLocation">City or area</label>' +
          '<input id="jnLocation" autocomplete="address-level2" placeholder="Karachi"></div>' +
        '<div class="jn-field"><label for="jnAdmin">Your name</label>' +
          '<input id="jnAdmin" autocomplete="name" placeholder="Head teacher"></div>' +
        '<div class="jn-field"><label for="jnEmail">Your email</label>' +
          '<input id="jnEmail" type="email" autocomplete="email" placeholder="you@school.example"></div>' +
        '<div class="jn-field"><label for="jnPassword">Choose a password</label>' +
          '<input id="jnPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters">' +
          '<div class="jn-hint">This is how you will sign in to your school dashboard.</div></div>' +
        '<button class="jn-submit" id="jnSubmit" type="button">Register this school</button>' +
      '</div>';

    document.getElementById('jnSubmit').addEventListener('click', submit);
    // Enter anywhere in the form submits, because a head teacher filling this
    // in on a phone will not reach for a button after the last field.
    body.querySelectorAll('input').forEach((el) => {
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    });
  }

  function showError(message) {
    const box = document.getElementById('jnError');
    if (box) box.innerHTML = '<div class="jn-error">' + esc(message) + '</div>';
  }

  async function submit() {
    const btn = document.getElementById('jnSubmit');
    const value = (id) => (document.getElementById(id).value || '').trim();

    const payload = {
      slug: slug,
      token: token,
      school_name: value('jnSchool'),
      location: value('jnLocation'),
      admin_name: value('jnAdmin'),
      email: value('jnEmail'),
      password: document.getElementById('jnPassword').value || ''
    };

    if (!payload.school_name) return showError('What is the school called?');
    if (!payload.admin_name)  return showError('Please give your name.');
    if (!payload.email)       return showError('An email address is needed to sign in.');
    if (payload.password.length < 6) return showError('The password needs at least 6 characters.');

    btn.disabled = true;
    btn.textContent = 'Registering…';
    document.getElementById('jnError').innerHTML = '';

    try {
      const res = (await callRegister(payload)).data;
      done(res);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Register this school';
      showError((err && err.message) || 'Could not register the school. Please try again.');
    }
  }

  function done(res) {
    const url = location.origin + res.student_path;
    body.innerHTML =
      '<div class="jn-card" style="text-align:center">' +
        '<div class="jn-done-mark">✓</div>' +
        '<h1 class="jn-org">Your school is registered</h1>' +
        '<p class="jn-lede">Sign in with the email and password you just chose.</p>' +
        '<div class="jn-link-box">' +
          '<div class="jn-link-label">Your students\\' link</div>' +
          '<div class="jn-link" id="jnStudentLink">' + esc(url) + '</div>' +
          '<button class="jn-copy" id="jnCopy" type="button">Copy link</button>' +
        '</div>' +
        '<div class="jn-warn">Keep this link. Your students open it and sign in with the roll number and PIN you give them from your dashboard. You can always find it again there.</div>' +
        '<button class="jn-submit" style="margin-top:18px" type="button" onclick="location.href=\\'/auth\\'">Go to sign in</button>' +
      '</div>';

    document.getElementById('jnCopy').addEventListener('click', async () => {
      const btn = document.getElementById('jnCopy');
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = 'Copied';
      } catch (_) {
        // Clipboard is refused on an insecure origin and in some in-app
        // browsers. Selecting the text is a worse experience than copying,
        // and a better one than a button that silently does nothing.
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('jnStudentLink'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        btn.textContent = 'Copy it from above';
      }
      setTimeout(() => { btn.textContent = 'Copy link'; }, 2500);
    });
  }

  async function start() {
    if (!slug || !token) {
      return fail('This link is incomplete. Ask the organisation for the full one — it ends in a # and a code.');
    }
    try {
      form((await callDescribe({ slug: slug, token: token })).data);
    } catch (err) {
      fail((err && err.message) || 'This link is not valid any more.');
    }
  }

  start();
</script>
`

export const generateOrgJoinHTML = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Nothing here is for a search engine: the page is blank without a token. -->
  <meta name="robots" content="noindex, nofollow">
  <title>Register your school — Imaan &amp; Akhlaq</title>
  <link rel="icon" href="/kidba_assets/img/splash_logo.jpg">
</head>
<body style="margin:0">
  ${OrgJoinPage()}
</body>
</html>
`
