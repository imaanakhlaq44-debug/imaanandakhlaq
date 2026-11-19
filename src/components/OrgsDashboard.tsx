import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { emulatorConnectJS } from '../lib/devEmulators'

/**
 * Organisations, for the super admin: /orgs
 *
 * The list comes from listOrgs rather than a query, because orgs is closed to
 * every client (firestore.rules §13) — it holds the join tokens, and a
 * readable collection of them would be a readable collection of secrets. The
 * schools underneath are read straight from Firestore, which is what
 * `allow read: if signedIn()` already permits.
 *
 * Every school's registration date is on screen on purpose: no approval step
 * guards registration (ORG_PORTAL_PLAN.md §3), so a row nobody recognises has
 * to be visible rather than buried.
 */
export const OrgsDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  #orgs {
    --ink:   #16294d;
    --body:  #38455c;
    --muted: #6b7a90;
    --line:  #e5e9f0;
    --pink:  #cf296d;

    font-family: 'Inter', system-ui, sans-serif;
    color: var(--body);
    background: #f4f6fa;
    min-height: 100vh;
    padding: 22px 18px 64px;
  }
  #orgs * { box-sizing: border-box; }

  .og-wrap { max-width: 920px; margin: 0 auto; }

  .og-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 14px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .og-title {
    font-family: 'Fredoka', system-ui, sans-serif;
    font-size: 1.5rem; color: var(--ink); margin: 0;
  }
  .og-sub { font-size: .86rem; color: var(--muted); margin-top: 2px; }

  .og-btn {
    padding: 10px 16px; font: inherit; font-size: .88rem; font-weight: 700;
    color: #fff; background: var(--pink); border: none;
    border-radius: 12px; cursor: pointer;
  }
  .og-btn:hover:not(:disabled) { background: #b52259; }
  .og-btn:disabled { opacity: .6; cursor: default; }
  .og-btn.ghost {
    background: #fff; color: var(--ink); border: 1px solid #cbd5e1;
  }
  .og-btn.ghost:hover { background: #f1f5f9; }

  .og-card {
    background: #fff; border: 1px solid var(--line);
    border-radius: 16px; padding: 18px; margin-bottom: 14px;
  }
  .og-card-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .og-name {
    font-family: 'Fredoka', system-ui, sans-serif;
    font-size: 1.1rem; color: var(--ink); margin: 0;
  }
  .og-meta { font-size: .8rem; color: var(--muted); margin-top: 2px; }

  .og-link-row {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    background: #f8fafc; border: 1px solid var(--line);
    border-radius: 12px; padding: 10px 12px; margin-top: 12px;
  }
  .og-link {
    flex: 1 1 260px; min-width: 0;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: .78rem; color: var(--ink); word-break: break-all;
  }
  .og-link-label {
    font-size: .68rem; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted);
    width: 100%; margin-bottom: 2px;
  }
  .og-mini {
    padding: 6px 11px; font: inherit; font-size: .78rem; font-weight: 700;
    color: var(--ink); background: #fff; border: 1px solid #cbd5e1;
    border-radius: 9px; cursor: pointer;
  }
  .og-mini:hover { background: #f1f5f9; }
  .og-mini.danger { color: #b3261e; border-color: #f0c6c2; }
  .og-mini.danger:hover { background: #fdecea; }

  .og-schools { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
  .og-school {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 10px; padding: 7px 0; font-size: .88rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .og-school:last-child { border-bottom: none; }
  .og-school-name { color: var(--ink); font-weight: 600; }
  .og-school-when { font-size: .78rem; color: var(--muted); white-space: nowrap; }
  .og-empty { font-size: .84rem; color: var(--muted); padding: 6px 0; }

  .og-state { text-align: center; color: var(--muted); padding: 60px 20px; }
  .og-error {
    background: #fdecea; border: 1px solid #f5c6c2; color: #8a1c16;
    border-radius: 12px; padding: 11px 13px; font-size: .87rem; margin-bottom: 14px;
  }

  .og-search { width:min(100%,460px); margin-bottom:14px; padding:10px 13px; border:1px solid #cbd5e1; border-radius:10px; font:inherit; }
  .og-new { display: none; margin-bottom: 16px; }
  .og-new.show { display: block; }
  .og-new input {
    width: 100%; padding: 11px 13px; font: inherit; font-size: .95rem;
    border: 1px solid #cbd5e1; border-radius: 12px; margin-bottom: 10px;
  }
  .og-new input:focus {
    outline: none; border-color: var(--pink);
    box-shadow: 0 0 0 3px rgba(207,41,109,.12);
  }
</style>

<div id="orgs">
  <div class="og-wrap">
    <div class="og-head">
      <div>
        <a href="/super-admin-dashboard" style="font-size:.82rem; font-weight:700; color:#6b7a90; text-decoration:none; display:inline-block; margin-bottom:4px;">&larr; Super admin dashboard</a>
        <h1 class="og-title">Organisations</h1>
        <div class="og-sub">Create organisations and invite the people who will manage their schools.</div>
      </div>
      <button class="og-btn" id="ogNewBtn" type="button" style="display:none">New organisation</button>
    </div>

    <div class="og-card og-new" id="ogNew">
      <div id="ogNewError"></div>
      <input id="ogNewName" placeholder="Organisation name — e.g. Alkhidmat Foundation">
      <input id="ogNewEmail" type="email" placeholder="Contact email (optional)">
      <button class="og-btn" id="ogCreate" type="button">Create and get the invite</button>
      <button class="og-btn ghost" id="ogCancel" type="button">Cancel</button>
    </div>

    <input id="ogSearch" class="og-search" type="search" placeholder="Search organisations" aria-label="Search organisations" hidden>
    <p id="ogNoMatch" class="og-empty" hidden>No organisations match your search.</p>
    <div id="ogBody"><div class="og-state">Loading…</div></div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, connectAuthEmulator, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, connectFirestoreEmulator, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getFunctions, connectFunctionsEmulator, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  ${raw(emulatorConnectJS)}
  connectEmulators({ auth, db, functions, connectAuthEmulator, connectFirestoreEmulator, connectFunctionsEmulator });

  const callList   = httpsCallable(functions, 'listOrgs');
  const callCreate = httpsCallable(functions, 'createOrg');
  const callInvite = httpsCallable(functions, 'inviteOrgAdmin');
  const preparedInvites = new Map();
  const callDelete = httpsCallable(functions, 'deleteOrg');

  const body = document.getElementById('ogBody');

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const day = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /** The schools under one org. Readable directly — schools is not closed. */
  async function schoolsOf(orgId) {
    const snap = await getDocs(query(collection(db, 'schools'), where('org_id', '==', orgId)));
    return snap.docs
      .map((d) => ({ name: d.data().name || '(unnamed)', created_at: d.data().created_at }))
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }

  function cardHTML(org, schools) {
    const rows = schools.length
      ? schools.map((s) =>
          '<div class="og-school">' +
            '<span class="og-school-name">' + esc(s.name) + '</span>' +
            '<span class="og-school-when">' + esc(day(s.created_at)) + '</span>' +
          '</div>').join('')
      : '<div class="og-empty">No schools have registered yet.</div>';

    const path = preparedInvites.get(org.org_id);
    const invite = path ? new URL(path, location.origin).href : '';
    const status = org.admin_status === 'active' ? 'Account active' :
      org.admin_status === 'pending' ? 'Invite pending' : 'Account not invited';
    const inviteActions = org.admin_status === 'active' ? '' :
      (invite ? '<input class="og-link" readonly aria-label="Organisation account invite" value="' +
        esc(invite) + '">' +
        '<button class="og-mini" data-copy="' + esc(invite) + '">Copy invite link</button>' : '') +
      '<button class="og-mini" data-invite="' + esc(org.org_id) + '" data-pending="' +
        (org.admin_status === 'pending' ? 'yes' : 'no') + '">' +
        (org.admin_status === 'pending' ? 'Replace invite link' : 'Create invite link') + '</button>';

    return '<div class="og-card" data-org="' + esc(org.org_id) + '" data-name="' + esc(org.name) + '">' +
      '<div class="og-card-head">' +
        '<div>' +
          '<h2 class="og-name">' + esc(org.name) + '</h2>' +
          '<div class="og-meta">' + esc(org.school_count) + ' school' + (org.school_count === 1 ? '' : 's') +
            ' · added ' + esc(day(org.created_at)) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="og-link-row">' +
        '<div class="og-link-label">Organisation account invite</div>' +
        '<div class="og-meta">' + esc(status) + '</div>' +
        inviteActions +
        '<button class="og-mini danger" data-delete="' + esc(org.org_id) +
          '" data-name="' + esc(org.name) + '">Delete</button>' +
      '</div>' +
      '<div class="og-schools">' + rows + '</div>' +
    '</div>';
  }

  const search = document.getElementById('ogSearch');
  function filterOrganisations() {
    const query = search.value.trim().toLocaleLowerCase();
    const cards = Array.from(body.querySelectorAll('[data-org]'));
    cards.forEach((card) => {
      card.hidden = !card.dataset.name.toLocaleLowerCase().includes(query);
    });
    document.getElementById('ogNoMatch').hidden = cards.some((card) => !card.hidden) || !cards.length;
  }
  search.addEventListener('input', filterOrganisations);

  async function load() {
    try {
      const res = (await callList()).data;
      search.hidden = !res.orgs.length;
      if (!res.orgs.length) {
        document.getElementById('ogNoMatch').hidden = true;
        document.getElementById('ogNewBtn').style.display = '';
        body.innerHTML = '<div class="og-state">No organisations yet. Create the first one above.</div>';
        return;
      }
      const withSchools = await Promise.all(
        res.orgs.map(async (org) => cardHTML(org, await schoolsOf(org.org_id)))
      );
      document.getElementById('ogNewBtn').style.display = '';
      body.innerHTML = withSchools.join('');
      filterOrganisations();
      wire();
    } catch (err) {
      search.hidden = true;
      document.getElementById('ogNoMatch').hidden = true;
      body.innerHTML = '<div class="og-error">' + esc((err && err.message) || 'Could not load organisations.') + '</div>';
    }
  }

  function wire() {
    body.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.getAttribute('data-copy'));
          btn.textContent = 'Copied';
        } catch (_) {
          btn.previousElementSibling?.select();
          btn.textContent = 'Copy selected text';
        }
        setTimeout(() => { btn.textContent = 'Copy invite link'; }, 2000);
      });
    });

    body.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-name') || 'this organisation';
        if (!confirm('Delete ' + name + '?' + String.fromCharCode(10) + String.fromCharCode(10) +
          'Its registration link stops working for good. This cannot be undone.')) return;
        btn.disabled = true;
        btn.textContent = 'Deleting…';
        try {
          await callDelete({ org_id: btn.getAttribute('data-delete') });
          await load();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Delete';
          alert((err && err.message) || 'Could not delete it.');
        }
      });
    });

    body.querySelectorAll('[data-invite]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.pending === 'yes' && !confirm('Replace the organisation account invite? The previous invite will stop working.')) return;
        btn.disabled = true;
        try {
          const orgId = btn.dataset.invite;
          const res = (await callInvite({ org_id: orgId })).data;
          preparedInvites.set(orgId, res.invite_path);
          await load();
        } catch (err) {
          btn.disabled = false;
          alert((err && err.message) || 'Could not issue the account invite.');
        }
      });
    });
  }

  const panel = document.getElementById('ogNew');
  document.getElementById('ogNewBtn').addEventListener('click', () => {
    panel.classList.add('show');
    document.getElementById('ogNewName').focus();
  });
  document.getElementById('ogCancel').addEventListener('click', () => panel.classList.remove('show'));

  document.getElementById('ogCreate').addEventListener('click', async () => {
    const btn = document.getElementById('ogCreate');
    const name = (document.getElementById('ogNewName').value || '').trim();
    const errBox = document.getElementById('ogNewError');
    errBox.innerHTML = '';
    if (!name) { errBox.innerHTML = '<div class="og-error">The organisation needs a name.</div>'; return; }

    btn.disabled = true;
    btn.textContent = 'Creating…';
    try {
      const result = (await callCreate({
        name: name,
        contact_email: (document.getElementById('ogNewEmail').value || '').trim(),
        delegate_admin: true
      })).data;
      preparedInvites.set(result.org_id, result.invite_path);
      document.getElementById('ogNewName').value = '';
      document.getElementById('ogNewEmail').value = '';
      panel.classList.remove('show');
      await load();
    } catch (err) {
      errBox.innerHTML = '<div class="og-error">' + esc((err && err.message) || 'Could not create it.') + '</div>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create and get the invite';
    }
  });

  // listOrgs refuses anyone but a super admin, so the gate here is only about
  // showing a sensible screen rather than an error — the real check is there.
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      search.hidden = true;
      document.getElementById('ogNoMatch').hidden = true;
      document.getElementById('ogNewBtn').style.display = 'none';
      panel.classList.remove('show');
      body.innerHTML =
        '<div class="og-state">This page is for super admins.' +
          '<div style="margin-top:14px"><a class="og-btn" style="text-decoration:none; display:inline-block" href="/auth">Sign in</a></div>' +
        '</div>';
      return;
    }
    load();
  });
</script>
`

export const generateOrgsDashboardHTML = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Organisations — Imaan &amp; Akhlaq</title>
  <link rel="icon" href="/kidba_assets/img/splash_logo.jpg">
</head>
<body style="margin:0">
  ${OrgsDashboard()}
</body>
</html>
`
