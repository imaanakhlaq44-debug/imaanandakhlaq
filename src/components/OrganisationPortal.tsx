import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

type Page = 'invite' | 'dashboard'

export const organisationPortalPage = (page: Page) => html`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Organisation portal · Imaan &amp; Akhlaq</title>
  <style>
    :root { color-scheme:light; --ink:#192744; --soft:#4e607c; --line:#d8e0ee; --pink:#bd2361; }
    * { box-sizing:border-box; }
    [hidden] { display:none !important; }
    body { margin:0; background:#f5f7fc; color:var(--ink); font:16px/1.45 system-ui,sans-serif; }
    a { color:var(--pink); }
    header { background:var(--ink); padding:18px max(20px,calc((100vw - 1080px)/2)); }
    header a { color:white; text-decoration:none; font-size:1.2rem; font-weight:750; }
    main { max-width:1100px; margin:0 auto; padding:24px 16px 48px; }
    h1 { margin:0 0 8px; font-size:clamp(1.6rem,5vw,2.2rem); }
    h2 { margin:0 0 10px; font-size:1.16rem; }
    p { margin:6px 0 14px; color:var(--soft); }
    .card { background:#fff; border:1px solid var(--line); padding:22px; border-radius:14px; margin-bottom:14px; }
    .auth { max-width:490px; margin:24px auto; }
    label { display:block; font-weight:650; margin:12px 0 5px; }
    input, button { font:inherit; border-radius:9px; }
    input { display:block; width:100%; padding:10px 11px; border:1px solid #a5b3c9; background:#fff; color:var(--ink); }
    :focus-visible { outline:3px solid #315d9b; outline-offset:3px; }
    button { cursor:pointer; padding:9px 14px; border:1px solid var(--pink); color:white; background:var(--pink); font-weight:700; }
    button.secondary { background:white; border-color:#a5b3c9; color:var(--ink); }
    button:disabled { opacity:.55; cursor:wait; }
    .auth form button { margin:16px 0 4px; width:100%; }
    .help { margin-top:12px; }
    .row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .heading { justify-content:space-between; margin-bottom:16px; }
    .dashboard { display:grid; grid-template-columns:200px minmax(0,1fr); gap:15px; }
    .dashboard nav { background:var(--ink); border-radius:14px; padding:12px; align-self:start; }
    .dashboard nav a { display:block; color:#fff; text-decoration:none; padding:9px 10px; border-radius:7px; }
    .dashboard nav a:hover, .dashboard nav a:focus-visible { background:#34486c; }
    @media (max-width:640px) {
      .dashboard { grid-template-columns:minmax(0,1fr); }
      .dashboard nav { display:flex; flex-wrap:wrap; gap:4px; }
    }
    .row input { flex:1 1 240px; min-width:0; }
    .status.error { color:#9c163b; }
    .table { overflow:auto; margin-top:16px; }
    table { width:100%; border-collapse:collapse; white-space:nowrap; text-align:left; }
    td, th { padding:10px 12px; border-bottom:1px solid var(--line); }
    thead { background:#edf1f8; }
    td:first-child { font-weight:700; white-space:normal; min-width:120px; }
    #search-school { max-width:350px; }
    dialog { width:min(460px,calc(100% - 32px)); border:1px solid var(--line); border-radius:14px; padding:20px; color:var(--ink); }
    dialog::backdrop { background:#16233a80; }
    dialog .row { margin-top:18px; }
  </style>
</head>
<body>
<header><a href="/">Imaan &amp; Akhlaq</a></header>
<main data-org-page="${page}">
  ${page === 'dashboard' ? html`
    <div class="row heading"><h1 id="org-name">Organisation dashboard</h1><button class="secondary" id="sign-out" type="button">Sign out</button></div>
    <p class="status" id="status" aria-live="polite">Loading your organisation…</p>
    <div id="portal" class="dashboard" hidden>
      <nav aria-label="Organisation dashboard">
        <a href="#org-name">Overview</a>
        <a href="#schools">Linked schools</a>
        <a href="#registration">Registration links</a>
      </nav>
      <div>
      <section class="card" id="registration">
        <h2>School registration link</h2>
        <p>Share this link with school heads so they can register under your organisation.</p>
        <div class="row">
          <input id="school-link" aria-label="School registration link" readonly hidden>
          <button id="copy-link" class="secondary" type="button" hidden>Copy link</button>
          <button id="make-link" type="button">Create school registration link</button>
        </div>
      </section>
      <section class="card" id="schools">
        <h2 id="school-count">Linked schools</h2>
        <input type="search" id="search-school" placeholder="Search by school or city" aria-label="Search linked schools">
        <p id="school-empty" hidden></p>
        <div class="table" id="school-table" hidden><table>
          <thead><tr><th scope="col">School</th><th scope="col">City or area</th><th scope="col">Status</th><th scope="col">Registered</th><th scope="col">Action</th></tr></thead>
          <tbody id="school-list"></tbody>
        </table></div>
      </section>
      </div>
    </div>
    <dialog id="school-dialog" aria-labelledby="school-edit-title">
      <form id="school-edit">
        <h2 id="school-edit-title">Edit school details</h2>
        <label for="edit-name">School name</label><input id="edit-name" maxlength="160" required>
        <label for="edit-location">City or area</label><input id="edit-location" maxlength="160">
        <p class="status" id="edit-status" aria-live="polite"></p>
        <div class="row"><button type="submit">Save details</button><button type="button" class="secondary" id="cancel-edit">Cancel</button></div>
      </form>
    </dialog>` : html`
    <section class="auth card">
      <h1>Create organisation account</h1>
      <p id="org-name"></p>
      <p class="status" id="status" aria-live="polite">Checking your invite…</p>
      <form id="account-form" hidden>
        <label for="email">Gmail address</label><input id="email" type="email" autocomplete="username" required>
        <label for="password">Imaan &amp; Akhlaq password</label>
        <input id="password" type="password" autocomplete="new-password" minlength="6" required>
        <button type="submit">Create account</button>
      </form>
      <p class="help"><a href="/auth">Go to sign in</a></p>
    </section>`}
</main>
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
  import { getAuth, connectAuthEmulator, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js';

  const app = initializeApp(${raw(firebaseConfigJS)});
  const auth = getAuth(app);
  const functions = getFunctions(app);
  ${raw(emulatorConnectJS)}
  connectEmulators({ auth, functions, connectAuthEmulator, connectFunctionsEmulator });

  const el = (id) => document.getElementById(id);
  const page = document.querySelector('[data-org-page]').dataset.orgPage;
  const call = async (name, data) => (await httpsCallable(functions, name)(data)).data;
  const setStatus = (node, message, failed = false) => {
    node.textContent = message;
    node.classList.toggle('error', failed);
  };
  function errorText(err) {
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(err.code)) {
      return 'That email or password did not work.';
    }
    if (err.code === 'auth/weak-password') return 'Choose a stronger password.';
    if (err.code === 'auth/too-many-requests') return 'Too many attempts. Wait a moment and try again.';
    if (err.code?.startsWith('auth/')) return 'Could not sign in. Check your connection and try again.';
    return err.message || 'Something went wrong. Please try again.';
  }
  const status = el('status');

  if (page === 'dashboard') {
    let details;
    let selectedSchool;
    const list = el('school-list');
    const dialog = el('school-dialog');

    function renderSchools() {
      const query = el('search-school').value.trim().toLowerCase();
      const schools = details.schools.filter((school) =>
        [school.name, school.location].some((value) => value.toLowerCase().includes(query)));
      el('school-count').textContent = 'Linked schools (' + details.schools.length + ')';
      el('school-empty').hidden = schools.length > 0;
      el('school-empty').textContent = query ? 'No schools match your search.' : 'No schools have registered yet.';
      el('school-table').hidden = !schools.length;
      list.replaceChildren();
      for (const school of schools) {
        const row = list.insertRow();
        const date = new Date(school.created_at);
        const dateText = isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
        const schoolStatus = ['approved', 'registered'].includes(school.status) ? 'Registered' : school.status;
        [school.name, school.location || '—', schoolStatus, dateText].forEach((text) => {
          row.insertCell().textContent = text;
        });
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'secondary';
        edit.textContent = 'Edit';
        edit.setAttribute('aria-label', 'Edit ' + school.name);
        edit.addEventListener('click', () => {
          selectedSchool = school;
          el('edit-name').value = school.name;
          el('edit-location').value = school.location;
          setStatus(el('edit-status'), '');
          dialog.showModal();
        });
        row.insertCell().append(edit);
      }
    }

    function showLink() {
      const link = details.join_path;
      el('school-link').hidden = !link;
      el('school-link').value = link ? new URL(link, location.origin).href : '';
      el('copy-link').hidden = !link;
      el('make-link').textContent = link ? 'Replace link' : 'Create school registration link';
    }

    onAuthStateChanged(auth, async (user) => {
      el('portal').hidden = true;
      if (!user) { location.replace('/auth'); return; }
      try {
        const response = await call('getOrganisationDashboard');
        if (auth.currentUser?.uid !== user.uid) return;
        details = response;
        el('org-name').textContent = details.name;
        renderSchools();
        showLink();
        el('portal').hidden = false;
        setStatus(status, '');
      } catch (err) { setStatus(status, errorText(err), true); }
    });

    el('sign-out').addEventListener('click', async () => {
      try {
        await signOut(auth);
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_user');
      }
      catch (err) { setStatus(status, errorText(err), true); }
    });
    el('search-school').addEventListener('input', renderSchools);
    el('make-link').addEventListener('click', async (event) => {
      if (details.join_path && !confirm('Replace the registration link? The previous link will stop working. Registered schools will stay linked.')) return;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const changed = await call('rotateOrgToken');
        details.join_path = changed.join_path;
        showLink();
        setStatus(status, 'School registration link is ready.');
      } catch (err) { setStatus(status, errorText(err), true); }
      finally { button.disabled = false; }
    });
    el('copy-link').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el('school-link').value);
        setStatus(status, 'School registration link copied.');
      } catch (_) {
        el('school-link').select();
        setStatus(status, 'Copy the selected link.');
      }
    });
    el('cancel-edit').addEventListener('click', () => dialog.close());
    el('school-edit').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.submitter;
      button.disabled = true;
      try {
        const changes = await call('updateOrganisationSchool', {
          school_id: selectedSchool.school_id,
          name: el('edit-name').value,
          location: el('edit-location').value
        });
        Object.assign(selectedSchool, changes);
        renderSchools();
        dialog.close();
        setStatus(status, 'School details saved.');
      } catch (err) { setStatus(el('edit-status'), errorText(err), true); }
      finally { button.disabled = false; }
    });
  } else {
    const form = el('account-form');
    const invite = {
      org_id: new URLSearchParams(location.search).get('org'),
      token: location.hash.slice(1)
    };

    call('describeOrgAdminInvite', invite).then((result) => {
      el('org-name').textContent = result.name;
      setStatus(status, '');
      form.hidden = false;
    }).catch((err) => setStatus(status, errorText(err), true));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.submitter;
      const email = el('email').value.trim();
      const password = el('password').value;
      button.disabled = true;
      setStatus(status, '');
      try {
        await call('describeOrgAdminInvite', invite);
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
          if (err.code !== 'auth/email-already-in-use') throw err;
          await signInWithEmailAndPassword(auth, email, password);
        }
        await call('redeemOrgAdminInvite', invite);
        location.replace('/organisation-dashboard');
      } catch (err) { setStatus(status, errorText(err), true); }
      finally { button.disabled = false; }
    });
  }
</script>
</body>
</html>
`
