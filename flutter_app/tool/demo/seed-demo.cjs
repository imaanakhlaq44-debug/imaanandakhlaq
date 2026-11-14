/**
 * Demo school for the LOCAL Firebase emulators only.
 *
 * Creates a school admin directly, then uses the real callables
 * (createTeacherAccount, createFamilyAccount, createChild) as that admin, so
 * the demo accounts are shaped exactly like the ones schools make. Finally the
 * family submits one activity sheet through saveLearnerActivity so the teacher
 * has something to review.
 *
 * Logins are written to tool/demo/demo-logins.json (git-ignored, never live).
 *
 * Run from the repo root (E:\Almas\almas_app\imaan) while the emulators run:
 *   node flutter_app/tool/demo/seed-demo.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT = 'imaan-app-1d2da';
const HOST = '127.0.0.1';
// Point every SDK at the emulators BEFORE anything is initialised, so nothing
// in this script can reach the live project.
process.env.FIRESTORE_EMULATOR_HOST = HOST + ':8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = HOST + ':9099';
process.env.GCLOUD_PROJECT = PROJECT;

const root = path.resolve(__dirname, '..', '..', '..');
const admin = require(path.join(root, 'functions', 'node_modules', 'firebase-admin'));
const { initializeApp } = require(path.join(root, 'node_modules', 'firebase', 'app'));
const {
  getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut,
} = require(path.join(root, 'node_modules', 'firebase', 'auth'));
const {
  getFunctions, connectFunctionsEmulator, httpsCallable,
} = require(path.join(root, 'node_modules', 'firebase', 'functions'));

const OUT = path.join(__dirname, 'demo-logins.json');
const SCHOOL_ID = 'demo-school';
const ADMIN_EMAIL = 'admin@demo-school.test';

function password() {
  return 'Demo-' + crypto.randomBytes(6).toString('base64url');
}

async function main() {
  // Refuse to run against anything but a local emulator.
  for (const v of [process.env.FIRESTORE_EMULATOR_HOST, process.env.FIREBASE_AUTH_EMULATOR_HOST]) {
    if (!v.startsWith('127.0.0.1:')) throw new Error('Emulator host must be local.');
  }
  if (fs.existsSync(OUT)) {
    console.log('Demo already seeded (' + path.relative(root, OUT) + '). Delete it to reseed.');
    return;
  }

  admin.initializeApp({ projectId: PROJECT });
  const adb = admin.firestore();
  const now = new Date().toISOString();

  // 1. School + its admin.
  const adminPassword = password();
  const adminUser = await admin.auth().createUser({
    email: ADMIN_EMAIL, password: adminPassword, displayName: 'Demo Admin',
  });
  await adb.collection('schools').doc(SCHOOL_ID).set({
    name: 'Demo School', school_name: 'Demo School', school_code: 'DEMO01',
    owner_uid: adminUser.uid, approval_status: 'approved', created_at: now,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
  });
  await adb.collection('users').doc(adminUser.uid).set({
    role: 'school_admin', name: 'Demo Admin', email: ADMIN_EMAIL,
    school_id: SCHOOL_ID, school_name: 'Demo School', created_at: now,
  });

  // 2. Everything else through the real callables, signed in as that admin.
  const app = initializeApp({ apiKey: 'demo-key', projectId: PROJECT }, 'seed');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://' + HOST + ':9099', { disableWarnings: true });
  const fns = getFunctions(app);
  connectFunctionsEmulator(fns, HOST, 5001);
  const call = async (name, data) => (await httpsCallable(fns, name)(data)).data;

  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, adminPassword);
  const teacher = await call('createTeacherAccount', {
    name: 'Ms Sara (Demo)', class_id: '3', school_name: 'Demo School',
  });
  const family = await call('createFamilyAccount', { name: 'Ahmad Family (Demo)' });
  const familyUid = family.family_uid || family.uid;
  const child1 = await call('createChild', { name: 'Ayaan Ahmad', class_id: '3', family_uid: familyUid });
  const child2 = await call('createChild', { name: 'Hira Ahmad', class_id: '4', family_uid: familyUid });
  await signOut(auth);

  // 3. The family submits one sheet for Ayaan, through the real save path.
  const childUid = child1.child_uid || child1.uid;
  let sheet = 'not submitted';
  try {
    await signInWithEmailAndPassword(auth, family.username.toLowerCase() + '@family.imaanakhlaq.invalid', family.password);
    const cells = Array.from({ length: 63 }, (_, i) => [1, 1, 2, 0][i % 4]);
    await call('saveLearnerActivity', {
      learner_uid: childUid, book_id: 'book1', chapter_id: 'b1_c1',
      discussion_text: 'Staying near my mother at the market made me feel safe.',
      cells, submit: true,
    });
    sheet = 'submitted via saveLearnerActivity';
    await signOut(auth);
  } catch (err) {
    // Fall back to the same document the web activity page writes.
    await adb.collection('activity_submissions').doc(childUid + '_b1_c1').set({
      student_uid: childUid, family_uid: familyUid, student_name: 'Ayaan Ahmad',
      school_id: SCHOOL_ID, chapter_id: 'b1_c1', book_id: 'book1',
      chapter_title: 'The Farm and the Brave Sister',
      discussionText: 'Staying near my mother at the market made me feel safe.',
      gridState: { cells: Array.from({ length: 63 }, (_, i) => [1, 1, 2, 0][i % 4]) },
      submittedAt: now, updatedAt: now, reviewStatus: 'pending_teacher',
    });
    sheet = 'written directly (saveLearnerActivity said: ' + (err.message || err) + ')';
  }

  const logins = {
    _note: 'LOCAL EMULATOR ONLY. These accounts do not exist on the live site.',
    created: now,
    school: { id: SCHOOL_ID, name: 'Demo School' },
    school_admin: { login: ADMIN_EMAIL, password: adminPassword },
    teacher: { login: teacher.username, password: teacher.password, name: 'Ms Sara (Demo)' },
    family: { login: family.username, password: family.password, name: 'Ahmad Family (Demo)' },
    students: [
      { name: 'Ayaan Ahmad', class: '3', uid: childUid, claim_code: child1.code },
      { name: 'Hira Ahmad', class: '4', uid: child2.child_uid || child2.uid, claim_code: child2.code },
    ],
    sample_sheet: sheet,
  };
  fs.writeFileSync(OUT, JSON.stringify(logins, null, 2));
  console.log('Seeded demo school. Logins saved to ' + path.relative(root, OUT));
  console.log('Sample sheet: ' + sheet);
}

main().then(() => process.exit(0), (err) => {
  console.error('Seeding failed:', err && (err.stack || err.message || err));
  process.exit(1);
});
