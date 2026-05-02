const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ASSET_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const BASE_URL = 'https://localhost';

const ROUTES = [
  { route: '/student-activities.html', role: 'student' },
  { route: '/parent-dashboard.html', role: 'parent' },
  { route: '/teacher-dashboard.html', role: 'teacher' },
  { route: '/admin-dashboard.html', role: 'school_admin' }
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.php': 'text/plain; charset=utf-8'
};

const FIREBASE_APP_STUB = `
export function initializeApp(config){ return { config: config || {} }; }
`;

function firebaseAuthStub(role) {
  const uid = `mock-${role}`;
  const email = `${role}@mock.local`;
  return `
const __mockUser = { uid: '${uid}', email: '${email}' };
export function getAuth(){ return { currentUser: __mockUser }; }
export function onAuthStateChanged(auth, callback){
  Promise.resolve().then(() => callback(__mockUser));
  return () => {};
}
export function signOut(){ return Promise.resolve(); }
export function signInWithEmailAndPassword(auth, email){
  return Promise.resolve({ user: { uid: '${uid}', email: email || '${email}' } });
}
export function createUserWithEmailAndPassword(auth, email){
  return Promise.resolve({ user: { uid: '${uid}', email: email || '${email}' } });
}
export function sendPasswordResetEmail(){
  return Promise.resolve();
}
export function sendEmailVerification(){
  return Promise.resolve();
}
`;
}

function buildMockSession(role) {
  const map = {
    student: {
      uid: 'mock-student',
      role: 'student',
      school_id: 'school_1',
      class_id: 'Class 3',
      invitation_code: 'STU-TEST1',
      name: 'Student Demo'
    },
    parent: {
      uid: 'mock-parent',
      role: 'parent',
      school_id: 'school_1',
      linked_student_code: 'STU-TEST1',
      invitation_code: 'PAR-TEST1',
      name: 'Parent Demo'
    },
    teacher: {
      uid: 'mock-teacher',
      role: 'teacher',
      school_id: 'school_1',
      assigned_class: 'Class 3',
      invitation_code: 'TCH-TEST1',
      name: 'Teacher Demo'
    },
    school_admin: {
      uid: 'mock-admin',
      role: 'school_admin',
      school_id: 'school_1',
      invitation_code: 'ADM-TEST1',
      name: 'Admin Demo'
    }
  };
  return map[role] || map.student;
}

function firebaseFirestoreStub(role) {
  const current = JSON.stringify(buildMockSession(role));
  return `
const __current = ${current};
const __users = [
  { uid:'mock-student', role:'student', school_id:'school_1', class_id:'Class 3', invitation_code:'STU-TEST1', name:'Student Demo', points:120, base_points:120 },
  { uid:'mock-parent', role:'parent', school_id:'school_1', linked_student_code:'STU-TEST1', invitation_code:'PAR-TEST1', name:'Parent Demo' },
  { uid:'mock-teacher', role:'teacher', school_id:'school_1', assigned_class:'Class 3', invitation_code:'TCH-TEST1', name:'Teacher Demo' },
  { uid:'mock-admin', role:'school_admin', school_id:'school_1', invitation_code:'ADM-TEST1', name:'Admin Demo' }
];
const __submissions = [
  {
    id:'sub-1',
    student_uid:'mock-student',
    studentId:'mock-student',
    studentUid:'mock-student',
    chapId:'b1_c1',
    chapterId:'b1_c1',
    chapter_id:'b1_c1',
    discussionText:'Demo reflection',
    submittedAt:new Date().toISOString(),
    parentApproved:false,
    teacherApproved:false,
    gridState:{ yes:3, no:0, total:3, cells:[1,1,1] },
    parentNotes:['Good','','','','','','']
  }
];
const __invites = [
  { id:'inv-1', code:'TCH-TEST1', role:'teacher', school_id:'school_1', status:'pending', name:'Teacher Demo', class_id:'Class 3' },
  { id:'inv-2', code:'STU-TEST1', role:'student', school_id:'school_1', status:'pending', name:'Student Demo', class_id:'Class 3' },
  { id:'inv-3', code:'PAR-TEST1', role:'parent', school_id:'school_1', status:'pending', linked_student_code:'STU-TEST1' }
];
const __attendance = [
  { id:'att-1', student_uid:'mock-student', studentId:'mock-student', dateKey:'2026-04-22', last_login_at:new Date().toISOString(), duration_seconds:650 }
];

function __snap(data, id){
  return {
    id: id || (data && (data.id || data.uid)) || 'doc',
    exists: () => !!data,
    data: () => data || {}
  };
}

function __rowsForCollection(name){
  const n = String(name || '').toLowerCase();
  if (n.includes('user')) return __users.slice();
  if (n.includes('submission') || n.includes('review')) return __submissions.slice();
  if (n.includes('invite') || n.includes('code')) return __invites.slice();
  if (n.includes('attend') || n.includes('session')) return __attendance.slice();
  return [];
}

function __applyClauses(rows, clauses){
  let out = rows.slice();
  (clauses || []).forEach((clause) => {
    if (!clause || !clause.kind) return;
    if (clause.kind === 'where') {
      if (clause.op === '==') {
        out = out.filter((r) => String(r[clause.field]) === String(clause.value));
      } else if (clause.op === 'in' && Array.isArray(clause.value)) {
        out = out.filter((r) => clause.value.map(String).includes(String(r[clause.field])));
      }
    }
    if (clause.kind === 'limit') {
      out = out.slice(0, Number(clause.value || 0));
    }
  });
  return out;
}

export function getFirestore(){ return {}; }
export function collection(db, name){ return { kind:'collection', name }; }
export function collectionGroup(db, name){ return { kind:'collection', name }; }
export function where(field, op, value){ return { kind:'where', field, op, value }; }
export function orderBy(field, direction){ return { kind:'orderBy', field, direction: direction || 'asc' }; }
export function limit(value){ return { kind:'limit', value }; }
export function query(ref, ...clauses){ return { kind:'query', ref, clauses }; }

export function doc(...args){
  const parts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (typeof arg === 'string') parts.push(arg);
    if (arg && typeof arg === 'object' && arg.name) parts.push(arg.name);
    if (arg && typeof arg === 'object' && arg.path) parts.push(arg.path);
  }
  return { kind:'doc', path: parts.join('/').replace(/\\/+/, '/') };
}

export async function getDoc(ref){
  const p = String((ref && ref.path) || '');
  if (p.includes('users/')) {
    const uid = p.split('/').pop();
    const row = __users.find((u) => u.uid === uid) || __current;
    return __snap(row, uid);
  }
  if (p.includes('invitation_codes/')) {
    const id = p.split('/').pop();
    const row = __invites.find((i) => i.id === id) || null;
    return __snap(row, id);
  }
  return __snap(null, 'missing');
}

export async function getDocs(ref){
  let collName = '';
  let clauses = [];
  if (ref && ref.kind === 'collection') {
    collName = ref.name;
  } else if (ref && ref.kind === 'query') {
    collName = ref.ref && ref.ref.name;
    clauses = ref.clauses || [];
  }
  const rows = __applyClauses(__rowsForCollection(collName), clauses);
  const docs = rows.map((row, idx) => __snap(row, row.id || row.uid || ('doc-' + idx)));
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (cb) => docs.forEach(cb)
  };
}

export async function setDoc(){ return Promise.resolve(); }
export async function updateDoc(){ return Promise.resolve(); }
export async function deleteDoc(){ return Promise.resolve(); }
export async function addDoc(ref, data){ return Promise.resolve({ id: 'new-doc', ref, data }); }
export async function runTransaction(db, executor){
  const tx = {
    get: async () => __snap(__current, __current.uid),
    set: () => {},
    update: () => {},
    delete: () => {}
  };
  return executor(tx);
}

export function writeBatch(){
  return {
    set(){},
    update(){},
    delete(){},
    commit: async () => Promise.resolve()
  };
}

export function serverTimestamp(){ return new Date().toISOString(); }
export function increment(v){ return { __increment: Number(v || 0) }; }
export function arrayUnion(...items){ return { __arrayUnion: items }; }
export function Timestamp(){}
Timestamp.now = () => ({ toDate: () => new Date() });

export function onSnapshot(ref, callback){
  Promise.resolve().then(async () => {
    const snap = await getDocs(ref);
    callback(snap);
  });
  return () => {};
}
`;
}

const FIREBASE_STORAGE_STUB = `
export function getStorage(){ return {}; }
export function ref(storage, path){ return { storage, fullPath: path || '' }; }
export async function uploadBytes(storageRef, file){ return { ref: storageRef, metadata: { size: (file && file.size) || 0 } }; }
export async function getDownloadURL(storageRef){ return Promise.resolve('https://mock.local/' + encodeURIComponent((storageRef && storageRef.fullPath) || 'asset')); }
`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveAssetFile(pathname) {
  const cleanPath = decodeURIComponent(pathname.split('?')[0]);
  let normalized = path.normalize(cleanPath)
    .replace(/^([.][.][/\\])+/, '')
    .replace(/^[/\\]+/, '');
  if (normalized === path.sep || normalized === '/' || normalized === '.') {
    normalized = 'index.html';
  }

  let filePath = path.join(ASSET_DIR, normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;

  if (!path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) return htmlPath;

    const jsonPath = `${filePath}.json`;
    if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isFile()) return jsonPath;
  }

  return null;
}

async function installInterception(page, role) {
  await page.setRequestInterception(true);

  const moduleHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  page.on('request', (req) => {
    const url = req.url();

    if (url.includes('/firebase-app.js')) {
      req.respond({ status: 200, contentType: 'application/javascript', headers: moduleHeaders, body: FIREBASE_APP_STUB });
      return;
    }

    if (url.includes('/firebase-auth.js')) {
      req.respond({ status: 200, contentType: 'application/javascript', headers: moduleHeaders, body: firebaseAuthStub(role) });
      return;
    }

    if (url.includes('/firebase-firestore.js')) {
      req.respond({ status: 200, contentType: 'application/javascript', headers: moduleHeaders, body: firebaseFirestoreStub(role) });
      return;
    }

    if (url.includes('/firebase-storage.js')) {
      req.respond({ status: 200, contentType: 'application/javascript', headers: moduleHeaders, body: FIREBASE_STORAGE_STUB });
      return;
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch (_) {
      req.abort();
      return;
    }

    if (parsed.hostname === 'localhost') {
      const filePath = resolveAssetFile(parsed.pathname);
      if (!filePath) {
        req.respond({ status: 404, contentType: 'text/plain; charset=utf-8', body: 'Not Found' });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      req.respond({
        status: 200,
        contentType: MIME[ext] || 'application/octet-stream',
        body: fs.readFileSync(filePath)
      });
      return;
    }

    if (parsed.hostname.includes('fonts.googleapis.com')) {
      req.respond({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
      return;
    }

    if (parsed.hostname.includes('fonts.gstatic.com')) {
      req.abort();
      return;
    }

    req.abort();
  });
}

async function bootstrapWindow(page, role) {
  const session = buildMockSession(role);
  await page.evaluateOnNewDocument((sessionData) => {
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      value: { isNativePlatform: () => true }
    });

    window.__runtimeErrors = [];
    window.__dialogs = [];

    window.addEventListener('error', (event) => {
      try { window.__runtimeErrors.push(String(event.message || 'window error')); } catch (_) {}
    });

    window.addEventListener('unhandledrejection', (event) => {
      try { window.__runtimeErrors.push(String(event.reason || 'unhandled rejection')); } catch (_) {}
    });

    const pushDialog = (msg) => {
      try { window.__dialogs.push(String(msg || '')); } catch (_) {}
    };

    window.alert = (msg) => { pushDialog(msg); };
    window.confirm = (msg) => { pushDialog(msg); return true; };
    window.prompt = (msg, defVal) => { pushDialog(msg); return defVal || ''; };

    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => Promise.resolve(),
          readText: async () => Promise.resolve('')
        }
      });
    } catch (_) {}

    try {
      localStorage.setItem('auth_user', JSON.stringify(sessionData));
      sessionStorage.setItem('auth_user', JSON.stringify(sessionData));
    } catch (_) {}
  }, session);
}

async function getSections(page) {
  return page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((el) => {
      if (el.dataset.section) set.add(el.dataset.section);
    });
    document.querySelectorAll('.nav-links li[id^="nav-"]').forEach((el) => {
      const sec = el.id.replace(/^nav-/, '');
      if (sec) set.add(sec);
    });
    return Array.from(set);
  });
}

async function activateSection(page, section) {
  const clicked = await page.evaluate((sec) => {
    const sidebar = document.querySelector(`.sidebar-nav li[data-section="${sec}"]`);
    if (sidebar) {
      sidebar.click();
      return true;
    }

    const topNav = document.querySelector(`#nav-${sec}`);
    if (topNav) {
      topNav.click();
      return true;
    }

    return false;
  }, section);

  if (clicked) await delay(260);
}

async function annotateControls(page) {
  return page.evaluate(() => {
    const selector = 'button, [onclick], [role="button"], .sidebar-nav li, .nav-links li, .summary-link, .action-btn, .copyable-code';

    function isVisible(el) {
      if (!el || !(el instanceof Element)) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    const activeSidebar = document.querySelector('.sidebar-nav li.active[data-section]');
    const activeTop = document.querySelector('.nav-links li.active[id^="nav-"]');
    const activeSection = activeSidebar
      ? activeSidebar.dataset.section
      : activeTop
        ? activeTop.id.replace(/^nav-/, '')
        : 'overview';

    document.querySelectorAll('[data-test-control]').forEach((el) => el.removeAttribute('data-test-control'));

    const seen = new Set();
    const out = [];
    let idx = 0;

    Array.from(document.querySelectorAll(selector)).forEach((el) => {
      if (!isVisible(el)) return;
      if ('disabled' in el && el.disabled) return;

      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      const onclick = el.getAttribute('onclick') || '';
      const id = el.id || '';
      const classes = Array.from(el.classList || []).slice(0, 4).join('.');
      const dataSection = el.dataset && el.dataset.section ? el.dataset.section : '';
      const tag = el.tagName.toLowerCase();

      if (!text && !onclick && !id && !dataSection) return;

      const signature = [tag, id, classes, text, onclick, dataSection].join('|');
      if (seen.has(signature)) return;
      seen.add(signature);

      el.setAttribute('data-test-control', String(idx));

      out.push({
        index: idx,
        tag,
        id,
        classes,
        text,
        onclick,
        dataSection,
        activeSection,
        signature
      });

      idx += 1;
    });

    return out;
  });
}

function isNoiseError(message) {
  const msg = String(message || '').toLowerCase();
  if (!msg) return false;
  if (msg.includes('failed to load resource')) return true;
  if (msg.includes('net::err_')) return true;
  if (msg.includes('favicon')) return true;
  if (msg.includes('chrome-error://chromewebdata')) return true;
  return false;
}

async function gatherCases(page, route) {
  const url = `${BASE_URL}${route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await delay(900);

  const sections = await getSections(page);
  const map = new Map();

  async function harvest(sectionName) {
    const controls = await annotateControls(page);
    controls.forEach((c) => {
      if (!map.has(c.signature)) {
        map.set(c.signature, {
          signature: c.signature,
          section: sectionName || c.activeSection || 'overview',
          text: c.text,
          onclick: c.onclick,
          tag: c.tag,
          id: c.id
        });
      }
    });
  }

  await harvest('overview');

  for (const section of sections) {
    await activateSection(page, section);
    await harvest(section);
  }

  return Array.from(map.values());
}

async function runCase(page, route, testCase) {
  const url = `${BASE_URL}${route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await delay(700);

  if (testCase.section) {
    await activateSection(page, testCase.section);
  }

  const controls = await annotateControls(page);
  const target = controls.find((c) => c.signature === testCase.signature);

  if (!target) {
    return { status: 'fail', reason: 'control_not_found_after_reload', details: '' };
  }

  const pageErrors = [];
  const consoleErrors = [];

  const onPageError = (err) => pageErrors.push(err && err.message ? err.message : String(err));
  const onConsole = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  await page.evaluate(() => {
    window.__runtimeErrors = [];
    window.__dialogs = [];
  });

  try {
    await page.click(`[data-test-control="${target.index}"]`, { delay: 14 });
  } catch (err) {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    return {
      status: 'fail',
      reason: 'click_exception',
      details: err && err.message ? err.message : String(err)
    };
  }

  await delay(550);

  const runtimeErrors = await page.evaluate(() => (window.__runtimeErrors || []).slice());
  const dialogs = await page.evaluate(() => (window.__dialogs || []).slice());

  page.off('pageerror', onPageError);
  page.off('console', onConsole);

  const allErrors = [...runtimeErrors, ...pageErrors, ...consoleErrors].filter((m) => !isNoiseError(m));

  if (allErrors.length > 0) {
    return {
      status: 'fail',
      reason: 'runtime_error',
      details: allErrors[0]
    };
  }

  return {
    status: 'pass',
    reason: dialogs.length ? 'dialog_handled' : 'ok',
    details: dialogs[0] || ''
  };
}

(async () => {
  if (!fs.existsSync(ASSET_DIR)) {
    console.error('CHECK_FAILED: asset dir missing:', ASSET_DIR);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors']
  });

  const report = {
    baseUrl: BASE_URL,
    assetDir: ASSET_DIR,
    dashboards: [],
    failingControls: []
  };

  try {
    for (const item of ROUTES) {
      const page = await browser.newPage();
      await installInterception(page, item.role);
      await bootstrapWindow(page, item.role);

      let cases = [];
      try {
        cases = await gatherCases(page, item.route);
      } catch (err) {
        report.dashboards.push({
          route: item.route,
          role: item.role,
          status: 'load_fail',
          totalControls: 0,
          passed: 0,
          failed: 0,
          error: err && err.message ? err.message : String(err),
          failures: []
        });
        await page.close();
        continue;
      }

      let passed = 0;
      let failed = 0;
      const failures = [];

      for (const testCase of cases) {
        const result = await runCase(page, item.route, testCase);
        if (result.status === 'pass') {
          passed += 1;
        } else {
          failed += 1;
          const fail = {
            route: item.route,
            role: item.role,
            section: testCase.section,
            text: testCase.text,
            onclick: testCase.onclick,
            reason: result.reason,
            details: result.details
          };
          failures.push(fail);
          report.failingControls.push(fail);
        }
      }

      report.dashboards.push({
        route: item.route,
        role: item.role,
        status: 'ok',
        totalControls: cases.length,
        passed,
        failed,
        failures
      });

      await page.close();
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('CHECK_FAILED:', err && err.stack ? err.stack : err);
  process.exit(1);
});
