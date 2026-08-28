/**
 * Seed the Firestore + Auth emulators with a community school you can log into.
 *
 * Run the emulators first, then this, then the dev server:
 *
 *   npx firebase emulators:start --only firestore,auth,functions,storage
 *   node scripts/seed-wall-demo.cjs
 *   npm run dev
 *
 * Nothing here touches the real project: it refuses to run unless the emulator
 * environment variables are set, because a seed script that silently wrote
 * demo children into a live school would be a very bad afternoon.
 */
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const PROJECT = 'imaan-app-1d2da';
const SCHOOL = 'sch-demo';

// The passwords below are for a throwaway local emulator only. They are
// deliberately obvious so nobody mistakes them for something to reuse.
const ADMIN_EMAIL = 'admin@demo.local';
const ADMIN_PASSWORD = 'demo-admin-1';

initializeApp({ projectId: PROJECT });
const db = getFirestore();
const auth = getAuth();

const STUDENTS = [
  { name: 'Abdullah Ahmed', class_id: 'Class 4', media_consent: 'granted' },
  { name: 'Maryam Khan',    class_id: 'Class 4', media_consent: 'granted' },
  { name: 'Yusuf Ali',      class_id: 'Class 4', media_consent: 'denied'  },
  { name: 'Aisha Bibi',     class_id: 'Class 5', media_consent: 'granted' },
  { name: 'Bilal Hussain',  class_id: 'Class 5', media_consent: 'unset'   },
  { name: 'Fatima Noor',    class_id: 'Class 5', media_consent: 'granted' }
];

async function upsertUser(uid, email, password, displayName) {
  try {
    await auth.createUser({ uid, email, password, displayName });
  } catch (err) {
    if (err.code !== 'auth/uid-already-exists' && err.code !== 'auth/email-already-exists') throw err;
    await auth.updateUser(uid, { email, password, displayName });
  }
}

async function main() {
  // The school is seeded ALREADY APPROVED. Approving it properly needs a super
  // admin, and the point of this script is to get you to the wall, not through
  // the queue — flip approval_status to 'pending' if that is what you want to
  // see instead.
  await db.collection('schools').doc(SCHOOL).set({
    name: 'Saturday Community Academy',
    location: 'Lahore',
    school_code: 'SCH-DEMO',
    admin_uid: 'demo-admin',
    type: 'weekly',
    meeting_day: 'saturday',
    approval_status: 'approved',
    wall_enabled: true,
    wall_settings: { comments: 'staff', require_approval: false },
    classes: ['Class 4', 'Class 5']
  });

  await upsertUser('demo-admin', ADMIN_EMAIL, ADMIN_PASSWORD, 'Demo Admin');
  await db.collection('users').doc('demo-admin').set({
    role: 'school_admin', school_id: SCHOOL,
    name: 'Demo Admin', email: ADMIN_EMAIL, phone: '03001234567'
  });

  // A teacher provisioned the new way: a TCH- username, no email of their own.
  // staff.imaanakhlaq.invalid must match STAFF_LOGIN_DOMAIN in
  // functions/index.js and src/lib/familyLogin.ts — a test pins those two, and
  // this is the third copy, so it is checked here at runtime instead.
  const staffDomain = 'staff.imaanakhlaq.invalid';
  const teacherUsername = 'TCH-DEMO1';
  const teacherPassword = 'demo-teacher-1';
  await upsertUser('demo-teacher', teacherUsername.toLowerCase() + '@' + staffDomain,
    teacherPassword, 'Muallima Fatima');
  await db.collection('users').doc('demo-teacher').set({
    role: 'teacher', school_id: SCHOOL, class_id: 'Class 4, Class 5',
    name: 'Muallima Fatima', username: teacherUsername
  });

  // A super admin, so the approval queue can be tried at all. Without one,
  // every newly registered community school sits at 'pending' forever and the
  // wall never unlocks — which is the correct production behaviour and a dead
  // end locally.
  await upsertUser('demo-hq', 'hq@demo.local', 'demo-hq-1', 'Demo HQ');
  await db.collection('users').doc('demo-hq').set({
    role: 'super_admin', name: 'Demo HQ', email: 'hq@demo.local'
  });

  const batch = db.batch();
  STUDENTS.forEach((student, i) => {
    batch.set(db.collection('users').doc('demo-stu-' + i), {
      role: 'student', school_id: SCHOOL,
      class_id: student.class_id, name: student.name,
      roster_only: true, media_consent: student.media_consent,
      created_at: new Date().toISOString()
    });
  });
  await batch.commit();

  // Attendance for today, which is what the teacher dashboard's "Share today
  // to the wall" button reads. Without it that button stays hidden and the
  // Phase 5 handover cannot be tried at all.
  const today = new Date().toISOString().slice(0, 10);
  const attendance = db.batch();
  STUDENTS.forEach((student, i) => {
    attendance.set(db.collection('activity_attendance').doc('demo-att-' + i), {
      student_uid: 'demo-stu-' + i,
      student_name: student.name,
      school_id: SCHOOL,
      sessionDate: today,
      chapter_id: 'b1_c4',
      chapter_title: 'Honesty',
      activityStartedAt: new Date().toISOString(),
      activityDurationSeconds: 1800
    });
  });
  await attendance.commit();

  console.log('');
  console.log('  Seeded ' + STUDENTS.length + ' students into "Saturday Community Academy".');
  console.log('');
  console.log('  School admin   ' + ADMIN_EMAIL + '  /  ' + ADMIN_PASSWORD);
  console.log('  Teacher        ' + teacherUsername + '  /  ' + teacherPassword);
  console.log('  Super admin    hq@demo.local  /  demo-hq-1');
  console.log('');
  console.log('  Attendance is seeded for ' + today + ', so the teacher dashboard');
  console.log('  shows "Share today to the wall".');
  console.log('');
}

main().catch((err) => { console.error(err); process.exit(1); });
