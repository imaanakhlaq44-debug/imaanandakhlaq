const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { randomInt, createHash, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

initializeApp();
const db = getFirestore();

/**
 * Phone-number login: resolve a phone number to the account email.
 *
 * This replaces the old world-readable /users collection — clients could
 * previously query any user's data directly. Now the collection is locked
 * down by Firestore rules and this function exposes ONLY the email of an
 * exact phone match, nothing else.
 *
 * Callable protocol (works with httpsCallable or a plain POST):
 *   POST { data: { phone: "+92300..." } }  ->  { result: { email: "..." | null } }
 */
exports.lookupEmailByPhone = onCall({ cors: true }, async (request) => {
  const raw = String((request.data && request.data.phone) || '').trim();

  // Accept digits, +, spaces, dashes, parentheses — same shapes the app collects.
  if (raw.length < 7 || raw.length > 20 || !/^\+?[\d\s\-()]+$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'Invalid phone number.');
  }

  // Registration stored phones verbatim, sometimes with and sometimes
  // without a leading +, so try both forms.
  const candidates = [raw];
  candidates.push(raw.startsWith('+') ? raw.slice(1) : '+' + raw);

  for (const phone of candidates) {
    const snap = await db
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();
    if (!snap.empty) {
      const email = snap.docs[0].get('email');
      if (email) return { email };
    }
  }

  return { email: null };
});

/**
 * Individual (free-trial) signups: the trial deadline is stamped by the
 * server, not the client. Firestore rules reject any client-supplied
 * trial_end at signup and never allow it in updates, so this trigger is
 * the only writer — users can't grant themselves a longer trial.
 */
const TRIAL_DAYS = 3;

exports.setTrialOnSignup = onDocumentCreated('users/{uid}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const user = snap.data();
  if (user.role !== 'individual' || user.trial_end) return;

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await snap.ref.update({ trial_end: trialEnd });
});

/**
 * Leaderboard mirror.
 *
 * The Champions board and Rankings list used to query /users directly, which
 * no signed-in student is allowed to do (and rightly so — a user doc carries
 * phone, email and invitation_code). This trigger copies just the four fields
 * a leaderboard needs into /public_scores/{uid}, which every signed-in user
 * may read and nobody may write. Keep RANKED_ROLES in sync with the roles the
 * dashboard shows; anyone else is removed from the board.
 */
const RANKED_ROLES = ['student', 'individual'];

exports.mirrorPublicScore = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const ref = db.collection('public_scores').doc(uid);
  const after = event.data && event.data.after && event.data.after.exists
    ? event.data.after.data()
    : null;

  if (!after || !RANKED_ROLES.includes(after.role)) {
    await ref.delete().catch(() => {});
    return;
  }

  const score = buildPublicScore(after);
  const before = event.data.before && event.data.before.exists
    ? event.data.before.data()
    : null;

  // Every game_state autosave rewrites the user doc; only pay for a mirror
  // write when something the board actually renders has changed.
  if (before && RANKED_ROLES.includes(before.role)) {
    const prev = buildPublicScore(before);
    if (JSON.stringify(prev) === JSON.stringify(score)) return;
  }

  await ref.set(score);
});

// ===========================================================================
// Family accounts
// ===========================================================================
//
// A family signs in once and its children have no login of their own. The
// school provisions everything: the admin creates the parent account, the
// system generates the credentials, and each student is created already
// linked to that parent and to their class.
//
// All five callables below run on the Admin SDK, which bypasses Firestore
// rules. That is deliberate — /users create stays locked to self in the rules,
// so a child profile can only ever come from here, after an authorization
// check this file makes explicitly.

/**
 * Login identity for a school-provisioned family.
 *
 * Firebase Auth needs an email-shaped credential; it does not need a
 * deliverable one. Parents get a username instead, because many have no
 * working email and the address-plus-inbox-OTP signup was the single biggest
 * reason a family never finished registering.
 *
 * .invalid is reserved by RFC 2606 precisely so that it can never resolve,
 * which is exactly what we want: no inbox sits behind these addresses and
 * there is no email password-reset path to be phished. Recovery runs through
 * the school admin instead. Kept as one constant so a real domain can replace
 * it later without touching anything else.
 */
const FAMILY_LOGIN_DOMAIN = 'family.imaanakhlaq.invalid';

// Teachers are provisioned by their school exactly like families are, and sign
// in with a TCH- username. A separate domain from the family one so a guessed
// username cannot cross populations by changing three letters.
// Must stay identical to STAFF_LOGIN_DOMAIN in src/lib/familyLogin.ts — a test
// reads both and pins them together.
const STAFF_LOGIN_DOMAIN = 'staff.imaanakhlaq.invalid';

/** Read aloud over a phone and copied off a paper slip: no O/0, no I/1/l. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_CHILDREN_PER_FAMILY = 8;
const ID_RETRIES = 10;

// 32^5 ≈ 34 million, one-time use, redeemable only by the family the school
// already linked — guessing one is not a threat model, transcribing one is.
const CHILD_CODE_LENGTH = 5;
const FAMILY_USERNAME_LENGTH = 5;

// Built from the same two constants the codes are generated from. Writing the
// pattern out by hand is how the generator and the validator drift apart, and
// the failure is silent: every freshly printed slip stops being redeemable.
const CHILD_CODE_RE = new RegExp('^STU-[' + CODE_ALPHABET + ']{' + CHILD_CODE_LENGTH + '}$');

function randomCode(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** Two hyphenated groups — far easier to transcribe than eight run-on chars. */
function generatePassword() {
  return randomCode(4) + '-' + randomCode(4);
}

function familyEmail(username) {
  return username.toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN;
}

function staffEmail(username) {
  return username.toLowerCase() + '@' + STAFF_LOGIN_DOMAIN;
}

function nowIso() {
  return new Date().toISOString();
}

async function requireStaff(request, roles) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const snap = await db.collection('users').doc(request.auth.uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'This account has no profile.');
  const me = snap.data();
  if (!roles.includes(me.role)) {
    throw new HttpsError('permission-denied', 'Only a school admin can do this.');
  }
  return { uid: request.auth.uid, role: me.role, school_id: me.school_id || '' };
}

/**
 * Which school this action applies to. A school_admin is pinned to their own;
 * a super_admin has none of their own and must name one.
 */
function resolveSchoolId(caller, requested) {
  if (caller.role === 'super_admin') {
    const id = String(requested || '').trim();
    if (!id) throw new HttpsError('invalid-argument', 'Name the school_id to act on.');
    return id;
  }
  if (!caller.school_id) throw new HttpsError('failed-precondition', 'Your account is not attached to a school.');
  return caller.school_id;
}

async function childCount(familyUid) {
  const snap = await db.collection('users').where('family_uid', '==', familyUid).count().get();
  return snap.data().count;
}

async function loadFamily(caller, familyUid) {
  if (!familyUid) throw new HttpsError('invalid-argument', 'Which family?');
  const snap = await db.collection('users').doc(familyUid).get();
  if (!snap.exists || snap.data().role !== 'family') {
    throw new HttpsError('not-found', 'That family account does not exist.');
  }
  const family = snap.data();
  if (caller.role !== 'super_admin' && family.school_id !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That family belongs to another school.');
  }
  return family;
}

/**
 * Create a parent login. Returns the credentials ONCE — nothing stores the
 * password. Firebase Auth keeps only a hash, and a second plaintext copy in
 * Firestore would put every family's password in that school one compromised
 * admin account away from leaking. Lost passwords go through
 * resetFamilyPassword instead.
 */
async function provisionFamilyAccount(options) {
  const name = String(options.name || '').trim();
  const phone = String(options.phone || '').trim();
  if (name.length < 2 || name.length > 80) {
    throw new HttpsError('invalid-argument', 'Enter the family name.');
  }
  if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    throw new HttpsError('invalid-argument', 'That phone number does not look right.');
  }

  const password = generatePassword();

  for (let attempt = 0; attempt < ID_RETRIES; attempt++) {
    const username = 'PAR-' + randomCode(FAMILY_USERNAME_LENGTH);
    let user;
    try {
      user = await getAuth().createUser({
        email: familyEmail(username),
        password: password,
        displayName: name
      });
    } catch (err) {
      // The username is taken. Nothing else about the request is wrong, so
      // draw another one rather than failing the admin's form.
      if (err.code === 'auth/email-already-exists') continue;
      throw new HttpsError('internal', 'Could not create the login: ' + err.message);
    }

    const profile = {
      role: 'family',
      username: username,
      name: name,
      school_id: options.schoolId,
      created_at: nowIso(),
      created_by: options.createdBy
    };
    // Phone is what makes an account findable at the login screen, via
    // lookupEmailByPhone. Only the family carries one — see createChild.
    if (phone) profile.phone = phone;
    if (options.extra) Object.assign(profile, options.extra);

    try {
      await db.collection('users').doc(user.uid).set(profile);
    } catch (err) {
      // Every rule and dashboard reads the /users doc. An auth user without
      // one is a login nobody can reach and no admin can see well enough to
      // clean up, so take it back out rather than leave that behind.
      await getAuth().deleteUser(user.uid).catch(() => {});
      throw new HttpsError('internal', 'Could not save the family profile: ' + err.message);
    }

    return { family_uid: user.uid, username: username, password: password };
  }

  throw new HttpsError('resource-exhausted', 'Could not allocate a username. Please try again.');
}

/**
 * Create a teacher login. The school hands out the credentials.
 *
 * Replaces the TCH- invite flow, where the admin generated a code and the
 * teacher went to /auth to build their own account. That put a registration
 * card on the front page for a population that never registers from there —
 * every teacher is somebody a school already employs — and it left a school
 * unable to answer "did she sign up yet?" without reading the invite list.
 *
 * Same shape as provisionFamilyAccount, deliberately: one function to reason
 * about when the question is "how does a school-provisioned login work".
 * Different prefix, different domain, and role 'teacher' rather than 'family'.
 */
exports.createTeacherAccount = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};
  const schoolId = resolveSchoolId(caller, data.school_id);

  const name = String(data.name || '').trim();
  const classId = String(data.class_id || '').trim();
  const phone = String(data.phone || '').trim();
  if (name.length < 2 || name.length > 80) {
    throw new HttpsError('invalid-argument', 'Enter the teacher name.');
  }
  if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    throw new HttpsError('invalid-argument', 'That phone number does not look right.');
  }

  const password = generatePassword();

  for (let attempt = 0; attempt < ID_RETRIES; attempt++) {
    const username = 'TCH-' + randomCode(FAMILY_USERNAME_LENGTH);
    let user;
    try {
      user = await getAuth().createUser({
        email: staffEmail(username),
        password: password,
        displayName: name
      });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') continue;
      throw new HttpsError('internal', 'Could not create the login: ' + err.message);
    }

    const profile = {
      role: 'teacher',
      username: username,
      name: name,
      school_id: schoolId,
      class_id: classId,
      created_at: nowIso(),
      created_by: caller.uid
    };
    if (phone) profile.phone = phone;
    if (data.photoURL) profile.photoURL = data.photoURL;

    try {
      await db.collection('users').doc(user.uid).set(profile);
    } catch (err) {
      // Same reasoning as provisionFamilyAccount: an auth user with no /users
      // doc is a login nobody can reach and no admin can see to clean up.
      await getAuth().deleteUser(user.uid).catch(() => {});
      throw new HttpsError('internal', 'Could not save the teacher profile: ' + err.message);
    }

    // Returned ONCE. Nothing stores the password — Firebase keeps only a hash,
    // and a second plaintext copy in Firestore would put every teacher's
    // password in that school one compromised admin account away from leaking.
    return { teacher_uid: user.uid, username: username, password: password };
  }

  throw new HttpsError('resource-exhausted', 'Could not allocate a username. Please try again.');
});

/**
 * Reissue a teacher's password.
 *
 * A TCH- login has no deliverable email behind it, so Firebase's own password
 * reset cannot reach the teacher. Without this, a forgotten password means a
 * teacher permanently locked out of a school that employs them — the same
 * reason resetFamilyPassword exists.
 */
exports.resetTeacherPassword = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const teacherUid = String((request.data && request.data.teacher_uid) || '').trim();
  if (!teacherUid) throw new HttpsError('invalid-argument', 'Which teacher?');

  const snap = await db.collection('users').doc(teacherUid).get();
  if (!snap.exists || snap.data().role !== 'teacher') {
    throw new HttpsError('not-found', 'That teacher account does not exist.');
  }
  const teacher = snap.data();
  // A school admin resets their own school's teachers and nobody else's.
  if (caller.role !== 'super_admin' && teacher.school_id !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That teacher belongs to another school.');
  }
  // A teacher who registered with the old TCH- invite signed up with a real
  // email of their own. Resetting that from here would hand a school admin
  // control of an address they do not own, so it stays with Firebase.
  if (!teacher.username) {
    throw new HttpsError('failed-precondition',
      'This teacher signs in with their own email. Use "Forgot password" on the login screen.');
  }

  const password = generatePassword();
  await getAuth().updateUser(teacherUid, { password: password });

  await db.collection('users').doc(teacherUid).update({
    password_reset_at: nowIso(),
    password_reset_by: caller.uid
  });

  return { username: teacher.username, password: password };
});

exports.createFamilyAccount = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};
  return provisionFamilyAccount({
    name: data.name,
    phone: data.phone,
    schoolId: resolveSchoolId(caller, data.school_id),
    createdBy: caller.uid
  });
});

/**
 * Create a student and the one-time code their parent redeems to see them.
 *
 * family_uid is optional: schools always have students whose parents never
 * enrol, and forcing a parent first would block the roster. Such a student is
 * created unattached and can be claimed or attached later.
 */
exports.createChild = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};

  const name = String(data.name || '').trim();
  const classId = String(data.class_id || '').trim();
  const familyUid = String(data.family_uid || '').trim();
  if (name.length < 2 || name.length > 80) {
    throw new HttpsError('invalid-argument', 'Enter the student name.');
  }

  let schoolId;
  if (familyUid) {
    const family = await loadFamily(caller, familyUid);
    schoolId = family.school_id;
    if ((await childCount(familyUid)) >= MAX_CHILDREN_PER_FAMILY) {
      throw new HttpsError('failed-precondition',
        'This family already has ' + MAX_CHILDREN_PER_FAMILY + ' children.');
    }
  } else {
    schoolId = resolveSchoolId(caller, data.school_id);
  }

  // Allocate the id up front so the code can name the student it unlocks.
  const childRef = db.collection('users').doc();

  let code = '';
  for (let attempt = 0; attempt < ID_RETRIES; attempt++) {
    const candidate = 'STU-' + randomCode(CHILD_CODE_LENGTH);
    try {
      // create() fails if the document already exists, so the code is claimed
      // atomically: two admins printing slips at the same moment can never be
      // handed the same one.
      await db.collection('invites').doc(candidate).create({
        role: 'student',
        status: 'pending',
        child_uid: childRef.id,
        family_uid: familyUid || null,
        school_id: schoolId,
        class_id: classId,
        created_at: nowIso(),
        created_by: caller.uid
      });
      code = candidate;
      break;
    } catch (err) {
      if (err.code === 6 || /ALREADY_EXISTS/i.test(String(err.message))) continue;
      throw new HttpsError('internal', 'Could not create the claim code: ' + err.message);
    }
  }
  if (!code) throw new HttpsError('resource-exhausted', 'Could not allocate a code. Please try again.');

  const child = {
    role: 'student',
    name: name,
    school_id: schoolId,
    class_id: classId,
    created_at: nowIso(),
    created_by: caller.uid
  };
  if (familyUid) child.family_uid = familyUid;
  // Deliberately no phone and no email on a child. lookupEmailByPhone matches
  // on phone across /users and returns the first hit; a child carrying the
  // family's number could win that race and hand the login screen an address
  // with no account behind it.

  try {
    await childRef.set(child);
  } catch (err) {
    await db.collection('invites').doc(code).delete().catch(() => {});
    throw new HttpsError('internal', 'Could not save the student: ' + err.message);
  }

  return { child_uid: childRef.id, code: code, class_id: classId };
});

/**
 * A parent redeems a code and the child appears on their dashboard.
 *
 * The school links the child at creation, so a code naming a different family
 * cannot be redeemed here: a slip handed to the wrong parent, or a guessed
 * code, attaches nothing.
 */
exports.claimChild = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const callerUid = request.auth.uid;

  const meSnap = await db.collection('users').doc(callerUid).get();
  if (!meSnap.exists || meSnap.data().role !== 'family') {
    throw new HttpsError('permission-denied', 'Only a family account can add a child.');
  }

  const code = String((request.data && request.data.code) || '').trim().toUpperCase();
  if (!CHILD_CODE_RE.test(code)) {
    throw new HttpsError('invalid-argument', 'That code does not look right.');
  }

  // Counted before the transaction: an aggregate query is not part of a
  // transaction's snapshot, so reading it inside would only look atomic.
  const alreadyHave = await childCount(callerUid);

  const inviteRef = db.collection('invites').doc(code);

  const childUid = await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new HttpsError('not-found', 'We could not find that code.');

    const invite = inviteSnap.data();
    if (invite.role !== 'student') throw new HttpsError('failed-precondition', 'That code is not for a student.');
    if (invite.status !== 'pending') throw new HttpsError('failed-precondition', 'That code has already been used.');
    if (invite.family_uid && invite.family_uid !== callerUid) {
      throw new HttpsError('permission-denied', 'That code belongs to another family.');
    }
    if (!invite.child_uid) throw new HttpsError('failed-precondition', 'That code is not linked to a student.');

    const childRef = db.collection('users').doc(invite.child_uid);
    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) throw new HttpsError('not-found', 'That student record is missing.');

    // No family on the code means the school created the student before the
    // parent account existed. The first valid claim attaches them.
    if (!invite.family_uid) {
      if (alreadyHave >= MAX_CHILDREN_PER_FAMILY) {
        throw new HttpsError('failed-precondition',
          'You already have ' + MAX_CHILDREN_PER_FAMILY + ' children on this account.');
      }
      const existing = childSnap.data().family_uid;
      if (existing && existing !== callerUid) {
        throw new HttpsError('permission-denied', 'That student is already with another family.');
      }
      tx.update(childRef, { family_uid: callerUid });
    }

    tx.update(inviteRef, { status: 'used', used_by_uid: callerUid, used_at: nowIso() });
    return invite.child_uid;
  });

  return { child_uid: childUid };
});

/**
 * Issue a new password for a family and show it once.
 *
 * This is the only recovery path — the login address is unreachable by design,
 * so there is no reset email. It is also how a school signs in as a parent if
 * it ever must, at the cost of having to hand over the new password. To simply
 * read a child's work, staff should use the read-only view instead: the rules
 * already let them see their own school's students and submissions.
 */
exports.resetFamilyPassword = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const familyUid = String((request.data && request.data.family_uid) || '').trim();
  const family = await loadFamily(caller, familyUid);

  const password = generatePassword();
  await getAuth().updateUser(familyUid, { password: password });

  // An audit trail of the reset, never of the password.
  await db.collection('users').doc(familyUid).update({
    password_reset_at: nowIso(),
    password_reset_by: caller.uid
  });

  return { username: family.username || '', password: password };
});

/**
 * Attach an existing unlinked student to a family. Used when the student was
 * on the roster before the parent enrolled.
 */
exports.attachChildToFamily = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};
  const childUid = String(data.child_uid || '').trim();
  const familyUid = String(data.family_uid || '').trim();
  if (!childUid) throw new HttpsError('invalid-argument', 'Which student?');

  const family = await loadFamily(caller, familyUid);

  const childSnap = await db.collection('users').doc(childUid).get();
  if (!childSnap.exists || childSnap.data().role !== 'student') {
    throw new HttpsError('not-found', 'That student does not exist.');
  }
  const child = childSnap.data();

  if (caller.role !== 'super_admin' && child.school_id !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That student belongs to another school.');
  }
  if (child.school_id !== family.school_id) {
    throw new HttpsError('failed-precondition', 'The student and the family are in different schools.');
  }
  if (child.family_uid === familyUid) {
    return { child_uid: childUid, already: true };
  }
  if (child.family_uid) {
    throw new HttpsError('failed-precondition', 'That student is already with another family.');
  }
  if ((await childCount(familyUid)) >= MAX_CHILDREN_PER_FAMILY) {
    throw new HttpsError('failed-precondition',
      'This family already has ' + MAX_CHILDREN_PER_FAMILY + ' children.');
  }

  await db.collection('users').doc(childUid).update({ family_uid: familyUid });

  // NOTE: the student's existing submissions, drafts and attendance keep no
  // family_uid, so the family cannot read them through the isMyFamily branch
  // until they are backfilled. That backfill is Phase 4, and only matters for
  // students who already have history.
  return { child_uid: childUid };
});

// ===========================================================================
// Migrating a school that is already using the old system
// ===========================================================================
//
// Nothing is thrown away and nothing is renamed. Every document a student owns
// is keyed on their uid —
//
//   activity_submissions/{uid}_{chapterId}
//   activity_drafts/draft_{uid}_{chapterId}_d{n}
//   activity_attendance/{uid}_{chapterId}_{seed}
//   public_scores/{uid}
//
// — so keeping the uid keeps the history. The student record becomes the child
// record by gaining one field. Points, approved chapters, teacher notes and
// the leaderboard entry all follow on their own.
//
// The one thing that is NOT automated is deciding who is a sibling. Two
// unrelated children sharing a school office number would be merged into one
// household, and then a parent could read another family's child. That is a
// privacy breach rather than a bug, so planFamilyMigration only proposes and
// an admin confirms.

const OWNED_COLLECTIONS = ['activity_submissions', 'activity_drafts', 'activity_attendance'];

/**
 * Group key for a contact number. The local and international forms of one
 * number have to land on the same household: 03001234567, +923001234567 and
 * 3001234567 are the same phone.
 */
function phoneKey(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 7 ? digits.slice(-10) : '';
}

/**
 * Dry run. Reads a school and proposes households; writes nothing.
 */
exports.planFamilyMigration = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const schoolId = resolveSchoolId(caller, request.data && request.data.school_id);

  // Single-field equality on both, filtered in memory afterwards — the same
  // shape the admin dashboard already uses, so there is no composite index to
  // deploy before a school can be migrated.
  const [usersSnap, invitesSnap] = await Promise.all([
    db.collection('users').where('school_id', '==', schoolId).get(),
    db.collection('invites').where('school_id', '==', schoolId).get()
  ]);

  const invites = {};
  invitesSnap.forEach((d) => { invites[d.id] = d.data(); });

  const groups = {};
  const unmatched = [];
  let alreadyMigrated = 0;
  let total = 0;

  usersSnap.forEach((d) => {
    const user = d.data();
    if (user.role !== 'student') return;
    total++;
    if (user.family_uid) { alreadyMigrated++; return; }

    const invite = user.invitation_code ? invites[user.invitation_code] : null;

    // The roster import is the better source: parent_name and parent_phone
    // come from the school's own Father/Guardian columns. What the student
    // typed at their own signup is the fallback.
    const guardian = (invite && invite.parent_name) || '';
    const phone = (invite && invite.parent_phone) || user.phone || '';
    const email = (invite && invite.parent_email) || user.email || '';

    const child = {
      uid: d.id,
      name: user.name || 'Student',
      class_id: user.class_id || '',
      guardian_name: guardian,
      phone: phone,
      email: email
    };

    const key = phoneKey(phone) || String(email).trim().toLowerCase();
    if (!key) { unmatched.push(child); return; }

    if (!groups[key]) groups[key] = { key: key, suggested_name: '', phone: phone, email: email, children: [] };
    if (guardian && !groups[key].suggested_name) groups[key].suggested_name = guardian;
    groups[key].children.push(child);
  });

  const families = Object.keys(groups).map((key) => {
    const group = groups[key];
    return {
      key: key,
      suggested_name: group.suggested_name || (group.children[0].name + ' Family'),
      phone: group.phone,
      email: group.email,
      children: group.children
    };
  }).sort((a, b) => b.children.length - a.children.length);

  return {
    school_id: schoolId,
    total_students: total,
    already_migrated: alreadyMigrated,
    families: families,
    unmatched: unmatched
  };
});

/**
 * Copy family_uid onto everything a child owns.
 *
 * The rules keep BOTH the old student_uid branch and the new family_uid one,
 * so a document is reachable before, during and after this — nothing is
 * orphaned part-way through a run.
 */
async function backfillOwnership(childUid, familyUid) {
  const counts = {};

  for (const name of OWNED_COLLECTIONS) {
    const snap = await db.collection(name).where('student_uid', '==', childUid).get();
    let written = 0;
    let batch = db.batch();
    let pending = 0;

    for (const docSnap of snap.docs) {
      if (docSnap.get('family_uid') === familyUid) continue;
      batch.update(docSnap.ref, { family_uid: familyUid });
      pending++;
      written++;
      // Firestore caps a batch at 500 writes.
      if (pending === 450) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
    if (pending) await batch.commit();
    counts[name] = written;
  }

  return counts;
}

/**
 * Turn one confirmed group of existing students into a family.
 */
exports.migrateFamilyGroup = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};
  const childUids = Array.isArray(data.child_uids) ? data.child_uids.filter(Boolean) : [];
  const familyName = String(data.family_name || '').trim();

  if (!childUids.length) throw new HttpsError('invalid-argument', 'Select at least one student.');
  if (childUids.length > MAX_CHILDREN_PER_FAMILY) {
    throw new HttpsError('failed-precondition',
      'A family can hold at most ' + MAX_CHILDREN_PER_FAMILY + ' children.');
  }

  // Vet every child BEFORE creating anything. A half-made family, with a login
  // nobody was handed, is worse than a button that refused.
  const snaps = await db.getAll.apply(db, childUids.map((uid) => db.collection('users').doc(uid)));

  let schoolId = '';
  const children = [];

  snaps.forEach((snap, i) => {
    if (!snap.exists) throw new HttpsError('not-found', 'Student ' + childUids[i] + ' no longer exists.');
    const child = snap.data();
    const label = child.name || childUids[i];

    if (child.role !== 'student') throw new HttpsError('failed-precondition', label + ' is not a student.');
    // Rerunning a group must never mint a second family for children who
    // already have one.
    if (child.family_uid) {
      throw new HttpsError('failed-precondition', label + ' is already in a family. Re-run the plan and try again.');
    }
    if (caller.role !== 'super_admin' && child.school_id !== caller.school_id) {
      throw new HttpsError('permission-denied', label + ' belongs to another school.');
    }
    if (!schoolId) schoolId = child.school_id || '';
    if ((child.school_id || '') !== schoolId) {
      throw new HttpsError('failed-precondition', 'Those students are not all in the same school.');
    }

    children.push({ uid: snap.id, data: child });
  });

  const family = await provisionFamilyAccount({
    name: familyName,
    phone: data.family_phone,
    schoolId: schoolId,
    createdBy: caller.uid,
    extra: { migrated_at: nowIso(), migrated_by: caller.uid }
  });

  const migratedAt = nowIso();
  const migrated = [];
  const failed = [];

  for (const child of children) {
    try {
      const update = {
        family_uid: family.family_uid,
        migrated_at: migratedAt,
        migrated_by: caller.uid
      };
      // Nothing is discarded — the contact details move aside. They have to
      // leave `phone`, or lookupEmailByPhone could answer a parent's phone
      // login with a child profile whose own login was just disabled. Keeping
      // the originals also makes the whole migration reversible.
      if (child.data.phone) { update.legacy_phone = child.data.phone; update.phone = FieldValue.delete(); }
      if (child.data.email) { update.legacy_login_email = child.data.email; update.email = FieldValue.delete(); }

      // Ownership first, then the history, then the old login last. At no
      // point is the child unreachable.
      await db.collection('users').doc(child.uid).update(update);
      const backfilled = await backfillOwnership(child.uid, family.family_uid);

      let loginDisabled = false;
      try {
        await getAuth().updateUser(child.uid, { disabled: true });
        loginDisabled = true;
      } catch (err) {
        // Children created by createChild never had a login of their own.
        if (err.code !== 'auth/user-not-found') throw err;
      }

      migrated.push({
        child_uid: child.uid,
        name: child.data.name || 'Student',
        backfilled: backfilled,
        login_disabled: loginDisabled
      });
    } catch (err) {
      // Report and carry on. The family login already exists, and the admin
      // can attach a straggler afterwards with attachChildToFamily.
      failed.push({ child_uid: child.uid, name: child.data.name || 'Student', error: err.message });
    }
  }

  // Credentials come back even on a partial run: a login that was created but
  // never handed over is the one outcome with no way back.
  return {
    family_uid: family.family_uid,
    username: family.username,
    password: family.password,
    migrated: migrated,
    failed: failed
  };
});

function buildPublicScore(user) {
  const points = user.game_state && typeof user.game_state.points === 'number'
    ? user.game_state.points
    : 0;
  return {
    name: user.name || 'Learner',
    photoURL: user.photoURL || '',
    role: user.role,
    school_name: user.school_name || '',
    points
  };
}

// ===========================================================================
// Club — mentor verification of daily micro-habits
// ===========================================================================
//
// A student ticks a habit and it lands in /habit_logs as 'pending'. Nothing is
// earned yet. A mentor rules on it here, and only here, are Value Credits
// written. The Firestore rules let a client create and un-tick a pending log
// and nothing else — no client branch can write 'approved', points_awarded or
// verified_by. This callable runs on the Admin SDK, which bypasses those rules
// and is therefore the single door credits come through.
//
// That split is the whole reason the club is worth anything. Self-awarded
// credits are just a number a child typed, and a house leaderboard built on
// them ranks whoever clicked most.

/**
 * Value Credits per habit.
 *
 * SOURCE OF TRUTH IS src/lib/clubData.ts — this map exists only because
 * functions/ is a separate package with no build step and cannot import a .ts
 * file from the web app. Adding a habit there and forgetting it here would
 * make the new habit un-approvable, so a test asserts the two agree
 * (src/__tests__/clubHabits.test.ts). If that test fails, fix this map.
 */
const CLUB_HABIT_VC = {
  sidq_daily_truth: 10,
  sidq_own_it: 10,
  sidq_honest_mirror: 10,
  amanah_unprompted_duty: 10,
  amanah_return_with_care: 10,
  amanah_on_time: 10,
  rahmah_lonely_outreach: 10,
  rahmah_proactive_help: 10,
  rahmah_one_kind_word: 10,
  adl_speak_up: 10,
  adl_fair_distribution: 10,
  adl_defend_the_weak: 10
};

/** A mentor works through a day's ticks in one pass, so this is a bulk call. */
const MAX_REVIEW_BATCH = 200;

/**
 * Shortest reflection that can earn credits.
 *
 * SOURCE OF TRUTH IS src/lib/clubData.ts (REFLECTION_MIN), mirrored into
 * firestore.rules; a test pins all three. Enforced again here because the
 * rules only govern what a client may write — a log created before this floor
 * existed would otherwise still pay out.
 */
const REFLECTION_MIN = 60;

/** Mirrors reflectionKey() in src/lib/clubData.ts. */
function reflectionKey(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
}

/** Firestore caps an 'in' filter, and a bulk review can carry more than that. */
const IN_QUERY_LIMIT = 10;

function chunked(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Where a house's running total lives.
 *
 * A school's houses are its own — Sidq at one school does not compete with
 * Sidq at another. Accounts with no school (self-study individuals) fall into
 * the Global Virtual House, which is what the concept calls the track for
 * students whose school has not joined.
 */
function houseScoreId(schoolId, house) {
  return (schoolId || 'global') + '__' + house;
}

exports.reviewHabitLogs = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');

  const data = request.data || {};
  const decision = String(data.decision || '').trim();
  if (decision !== 'approve' && decision !== 'reject') {
    throw new HttpsError('invalid-argument', 'Decision must be approve or reject.');
  }

  const ids = Array.isArray(data.log_ids) ? data.log_ids.map((id) => String(id || '').trim()) : [];
  const logIds = ids.filter(Boolean);
  if (!logIds.length) throw new HttpsError('invalid-argument', 'No habit logs were named.');
  if (logIds.length > MAX_REVIEW_BATCH) {
    throw new HttpsError('invalid-argument', 'Review at most ' + MAX_REVIEW_BATCH + ' logs at a time.');
  }

  const note = String(data.note || '').trim().slice(0, 500);
  if (decision === 'reject' && !note) {
    // The student has to know what to fix, exactly as the chapter review
    // already demands of a teacher sending work back.
    throw new HttpsError('invalid-argument', 'Write a short note when sending a habit back.');
  }

  const meSnap = await db.collection('users').doc(request.auth.uid).get();
  if (!meSnap.exists) throw new HttpsError('permission-denied', 'This account has no profile.');
  const me = meSnap.data();
  const caller = { uid: request.auth.uid, role: me.role, school_id: me.school_id || '' };

  // Who may rule on a log:
  //  - teacher / school_admin: their own school's students
  //  - super_admin: anyone
  //  - individual: their own logs, and only their own. Self-study accounts have
  //    no mentor to wait for, the same allowance activity_submissions already
  //    makes for them. A school student can never reach this branch.
  const isStaffCaller = ['teacher', 'school_admin', 'super_admin'].includes(caller.role);
  if (!isStaffCaller && caller.role !== 'individual') {
    throw new HttpsError('permission-denied', 'Only a mentor can review habits.');
  }

  const refs = logIds.map((id) => db.collection('habit_logs').doc(id));
  const snaps = await db.getAll(...refs);

  const skipped = [];

  // ---------------------------------------------------------------------
  // Pass 1 — who may be ruled on at all
  // ---------------------------------------------------------------------
  const candidates = [];

  for (const snap of snaps) {
    if (!snap.exists) {
      skipped.push({ id: snap.id, reason: 'not-found' });
      continue;
    }
    const log = snap.data();

    if (log.status !== 'pending') {
      // Already ruled on — by another mentor, or by a double-tap on the same
      // button. Skipping rather than failing keeps a bulk approve idempotent.
      skipped.push({ id: snap.id, reason: 'already-reviewed' });
      continue;
    }

    if (isStaffCaller) {
      if (caller.role !== 'super_admin' && (!caller.school_id || log.school_id !== caller.school_id)) {
        skipped.push({ id: snap.id, reason: 'other-school' });
        continue;
      }
    } else if (log.student_uid !== caller.uid) {
      skipped.push({ id: snap.id, reason: 'not-yours' });
      continue;
    }

    const vc = CLUB_HABIT_VC[log.habit_id];
    if (decision === 'approve' && typeof vc !== 'number') {
      // A habit id nothing recognises. Refusing to price it is the point:
      // otherwise a forged log with an invented habit would still pay out.
      skipped.push({ id: snap.id, reason: 'unknown-habit' });
      continue;
    }

    const text = String(log.reflection_text || '').trim();
    if (decision === 'approve' && text.length < REFLECTION_MIN) {
      // Either a log written before reflections were required, or a client
      // that skipped the box. Neither earns credits; a mentor can still send
      // it back, which is what tells the student to write one.
      skipped.push({ id: snap.id, reason: 'no-reflection' });
      continue;
    }

    // Recomputed from the text, never read from the stored field: the key is
    // what duplicate detection compares, so it cannot be a value the client
    // chose. Approving also rewrites it (below), so every approved log in the
    // history this searches carries a server-computed key.
    candidates.push({ snap: snap, log: log, vc: vc, key: reflectionKey(text) });
  }

  // ---------------------------------------------------------------------
  // Pass 2 — the same reflection, used twice
  // ---------------------------------------------------------------------
  //
  // The concept asks the system to flag a reflection pasted over and over.
  // Two ways it shows up, and both are checked before any credit is written:
  //
  //   - the same text on several habits in this very batch, which is what
  //     filling in a whole day from one sentence looks like;
  //   - the same text as something this student already had approved.
  //
  // The mentor still reads the words — this only stops the paste from being
  // paid for, and names the reason so the mentor can send it back knowingly.
  const approvedNow = [];

  if (decision === 'approve') {
    const seenInBatch = new Map();   // studentUid -> Set of keys
    const survivors = [];

    for (const item of candidates) {
      const uid = item.log.student_uid;
      const seen = seenInBatch.get(uid) || new Set();
      if (seen.has(item.key)) {
        skipped.push({ id: item.snap.id, reason: 'duplicate-reflection' });
        continue;
      }
      seen.add(item.key);
      seenInBatch.set(uid, seen);
      survivors.push(item);
    }

    // One lookup per student rather than per log: their own approved history,
    // asked only about the handful of keys this batch actually carries.
    const keysByStudent = new Map();
    for (const item of survivors) {
      const set = keysByStudent.get(item.log.student_uid) || new Set();
      set.add(item.key);
      keysByStudent.set(item.log.student_uid, set);
    }

    const alreadyUsed = new Map();   // studentUid -> Set of keys seen before
    for (const [uid, keys] of keysByStudent) {
      const used = new Set();
      for (const group of chunked([...keys], IN_QUERY_LIMIT)) {
        // Two equality filters — no composite index needed. Status is
        // filtered in memory for the same reason.
        const prior = await db.collection('habit_logs')
          .where('student_uid', '==', uid)
          .where('reflection_key', 'in', group)
          .get();
        prior.forEach((d) => {
          if (d.data().status === 'approved') used.add(d.data().reflection_key);
        });
      }
      alreadyUsed.set(uid, used);
    }

    for (const item of survivors) {
      const used = alreadyUsed.get(item.log.student_uid);
      if (used && used.has(item.key)) {
        skipped.push({ id: item.snap.id, reason: 'duplicate-reflection' });
        continue;
      }
      approvedNow.push(item);
    }
  }

  // ---------------------------------------------------------------------
  // Pass 3 — write
  // ---------------------------------------------------------------------
  const batch = db.batch();
  const reviewed = [];
  // Credits are summed per student and per house first, so a student with six
  // approved habits costs one increment rather than six.
  const studentCredits = new Map();
  const houseCredits = new Map();
  const verifiedAt = nowIso();

  const ruling = decision === 'approve' ? approvedNow : candidates;

  for (const item of ruling) {
    const log = item.log;
    const update = {
      status: decision === 'approve' ? 'approved' : 'rejected',
      verified_by: caller.uid,
      verified_at: verifiedAt,
      updated_at: verifiedAt,
      // A self-study member has no mentor and rules on their own work. That is
      // the weakest form of verification the platform allows, so it is
      // recorded rather than hidden: a credit nobody else read should not be
      // indistinguishable from one a teacher signed off. Stamped on every
      // ruling, true or false, so an old log without the field is never
      // mistaken for one that was checked.
      self_verified: !isStaffCaller
    };
    if (note) update.mentor_note = note;

    if (decision === 'approve') {
      update.points_awarded = item.vc;
      // Stamp the server's own fingerprint, so tomorrow's duplicate check
      // reads a key this function wrote rather than one a client sent.
      update.reflection_key = item.key;
      studentCredits.set(log.student_uid, (studentCredits.get(log.student_uid) || 0) + item.vc);
      if (log.house) {
        const key = houseScoreId(log.school_id, log.house);
        const entry = houseCredits.get(key) || { points: 0, school_id: log.school_id || '', house: log.house };
        entry.points += item.vc;
        houseCredits.set(key, entry);
      }
    } else {
      update.points_awarded = 0;
    }

    batch.update(item.snap.ref, update);
    reviewed.push(item.snap.id);
  }

  for (const [studentUid, points] of studentCredits) {
    batch.set(
      db.collection('users').doc(studentUid),
      { club_points: FieldValue.increment(points) },
      { merge: true }
    );
  }

  for (const [key, entry] of houseCredits) {
    batch.set(
      db.collection('house_scores').doc(key),
      {
        school_id: entry.school_id,
        house: entry.house,
        points: FieldValue.increment(entry.points),
        updated_at: verifiedAt
      },
      { merge: true }
    );
  }

  if (reviewed.length) await batch.commit();

  return {
    reviewed: reviewed.length,
    credits_awarded: [...studentCredits.values()].reduce((a, b) => a + b, 0),
    skipped: skipped
  };
});

// ===========================================================================
// Module 3 — the Value Economy
// ===========================================================================
//
// Module 2 above pays a flat ten credits for a daily habit a student ticks
// themselves. This is the other half the concept asks for: larger, one-off
// acts worth 20 to 100, entered with a written account and awarded by the
// Values Council rather than claimed.
//
// The same split holds and for the same reason — a client may file an entry
// and withdraw it while it is pending, and may never write status,
// points_awarded or verified_by. Those exist only below.
//
// One thing here works differently from habits on purpose. A habit's price is
// a constant in three files that a test pins together. A value category's
// price is NOT: the concept is explicit that points must be changeable from
// the admin panel and never hard-coded, so the live price lives in
// /credit_categories and is read from there on every award. The table in
// src/lib/valueEconomy.ts is only what a school starts with.

/** Mirrors ENTRY_DESCRIPTION_MIN in src/lib/valueEconomy.ts and the rules. */
const ENTRY_DESCRIPTION_MIN = 60;

/** Mirrors the COMPLAINT_* constants in src/lib/valueEconomy.ts. */
const COMPLAINT_MIN_POINTS = 10;
const COMPLAINT_MAX_POINTS = 100;
const COMPLAINT_REASON_MIN = 60;
const COMPLAINT_REASON_MAX = 500;

/** A Council works through a term's entries in one pass, as mentors do. */
const MAX_ENTRY_BATCH = 200;

const CLUB_HOUSE_IDS = ['sidq', 'amanah', 'rahmah', 'adl'];

/**
 * What each category is worth before anybody has edited anything.
 *
 * SOURCE OF TRUTH IS src/lib/valueEconomy.ts — this map exists only because
 * functions/ is a separate package with no build step and cannot import a .ts
 * file from the web app. A test asserts the two agree
 * (src/__tests__/valueEconomy.test.ts). If that test fails, fix this map.
 *
 * Only the prices are duplicated, not the names and examples. The number is
 * the one thing that must not disagree between the panel a school edits and
 * the function that pays out.
 */
const VALUE_CATEGORY_SEED = {
  initiative_leadership: 50,
  academic_empathy: 40,
  integrity_justice: 60,
  compassion: 50,
  consistency: 100,
  reflection_contribution: 20,
  clean_classroom: 20,
  help_struggling_peer: 40,
  avoid_injustice: 60,
  clean_speech: 20,
  greet_with_salaam: 20,
  respect_teacher: 40
};

/**
 * The live price list, read fresh on every award.
 *
 * Returns a Map of category id to points. The seed above is the DEFAULT and a
 * /credit_categories document is an OVERRIDE, not a prerequisite. That way the
 * economy pays out correctly on a school's first day, before anyone has opened
 * the admin panel, and an edited price wins the moment it is saved. Requiring
 * a seeding step instead would mean a school whose seeding never ran had an
 * economy that silently refused every award.
 *
 * A category the school has switched off is dropped, and an entry naming it is
 * skipped rather than priced — the same refusal reviewHabitLogs makes for a
 * habit id nothing recognises. A retired category should not still pay out.
 */
async function livePriceList() {
  const prices = new Map(Object.entries(VALUE_CATEGORY_SEED));

  const snap = await db.collection('credit_categories').get();
  snap.forEach((d) => {
    const data = d.data() || {};
    if (data.is_active === false) {
      prices.delete(d.id);
      return;
    }
    if (typeof data.points !== 'number' || !Number.isFinite(data.points)) return;
    // A negative or absurd price is a typo in the admin panel, not an
    // instruction. Refusing it here keeps one bad edit from minting credits;
    // the category falls back to its seed price rather than vanishing.
    if (data.points < 0 || data.points > COMPLAINT_MAX_POINTS) return;
    prices.set(d.id, Math.round(data.points));
  });

  return prices;
}

exports.reviewCreditEntries = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');

  const data = request.data || {};
  const decision = String(data.decision || '').trim();
  if (decision !== 'approve' && decision !== 'reject') {
    throw new HttpsError('invalid-argument', 'Decision must be approve or reject.');
  }

  const ids = Array.isArray(data.entry_ids) ? data.entry_ids.map((id) => String(id || '').trim()) : [];
  const entryIds = ids.filter(Boolean);
  if (!entryIds.length) throw new HttpsError('invalid-argument', 'No entries were named.');
  if (entryIds.length > MAX_ENTRY_BATCH) {
    throw new HttpsError('invalid-argument', 'Review at most ' + MAX_ENTRY_BATCH + ' entries at a time.');
  }

  const note = String(data.note || '').trim().slice(0, COMPLAINT_REASON_MAX);
  if (decision === 'reject' && !note) {
    throw new HttpsError('invalid-argument', 'Write a short note when sending an entry back.');
  }

  const meSnap = await db.collection('users').doc(request.auth.uid).get();
  if (!meSnap.exists) throw new HttpsError('permission-denied', 'This account has no profile.');
  const me = meSnap.data();
  const caller = { uid: request.auth.uid, role: me.role, school_id: me.school_id || '' };

  // Who sits on the Values Council: the school's staff, and HQ. An individual
  // self-study member rules on their own entries — the allowance habit review
  // and activity_submissions already make for accounts with no mentor.
  const isStaffCaller = ['teacher', 'school_admin', 'super_admin'].includes(caller.role);
  if (!isStaffCaller && caller.role !== 'individual') {
    throw new HttpsError('permission-denied', 'Only the Values Council can award credits.');
  }

  const prices = decision === 'approve' ? await livePriceList() : new Map();

  const refs = entryIds.map((id) => db.collection('credit_entries').doc(id));
  const snaps = await db.getAll(...refs);

  const skipped = [];
  const ruling = [];

  for (const snap of snaps) {
    if (!snap.exists) {
      skipped.push({ id: snap.id, reason: 'not-found' });
      continue;
    }
    const entry = snap.data();

    if (entry.status !== 'pending') {
      // Already ruled on, by another Council member or by a double-tap.
      // Skipping rather than failing keeps a bulk approve idempotent.
      skipped.push({ id: snap.id, reason: 'already-reviewed' });
      continue;
    }

    if (isStaffCaller) {
      if (caller.role !== 'super_admin' && (!caller.school_id || entry.school_id !== caller.school_id)) {
        skipped.push({ id: snap.id, reason: 'other-school' });
        continue;
      }
    } else if (entry.student_uid !== caller.uid) {
      skipped.push({ id: snap.id, reason: 'not-yours' });
      continue;
    }

    let points = 0;
    if (decision === 'approve') {
      if (!prices.has(entry.category_id)) {
        skipped.push({ id: snap.id, reason: 'unknown-category' });
        continue;
      }
      points = prices.get(entry.category_id);

      if (String(entry.description || '').trim().length < ENTRY_DESCRIPTION_MIN) {
        // Filed before the floor existed, or by a client that skipped the box.
        // The Council can still send it back, which is what tells the student
        // to write one.
        skipped.push({ id: snap.id, reason: 'no-description' });
        continue;
      }
    }

    ruling.push({ snap: snap, entry: entry, points: points });
  }

  const batch = db.batch();
  const reviewed = [];
  // Summed per student and per house first, so a student with four approved
  // entries costs one increment rather than four.
  const studentCredits = new Map();
  const houseCredits = new Map();
  const verifiedAt = nowIso();

  for (const item of ruling) {
    const entry = item.entry;
    const update = {
      status: decision === 'approve' ? 'approved' : 'rejected',
      points_awarded: decision === 'approve' ? item.points : 0,
      verified_by: caller.uid,
      verified_at: verifiedAt,
      updated_at: verifiedAt,
      // Same reasoning as the habit review above: an award nobody but the
      // member themselves read is marked as such.
      self_verified: !isStaffCaller
    };
    if (note) update.council_note = note;

    if (decision === 'approve' && item.points > 0) {
      studentCredits.set(entry.student_uid, (studentCredits.get(entry.student_uid) || 0) + item.points);
      if (entry.house) {
        const key = houseScoreId(entry.school_id, entry.house);
        const acc = houseCredits.get(key) || { points: 0, school_id: entry.school_id || '', house: entry.house };
        acc.points += item.points;
        houseCredits.set(key, acc);
      }
    }

    batch.update(item.snap.ref, update);
    reviewed.push(item.snap.id);
  }

  for (const [studentUid, points] of studentCredits) {
    batch.set(
      db.collection('users').doc(studentUid),
      { club_points: FieldValue.increment(points) },
      { merge: true }
    );
  }

  for (const [key, acc] of houseCredits) {
    batch.set(
      db.collection('house_scores').doc(key),
      {
        school_id: acc.school_id,
        house: acc.house,
        points: FieldValue.increment(acc.points),
        updated_at: verifiedAt
      },
      { merge: true }
    );
  }

  if (reviewed.length) await batch.commit();

  return {
    reviewed: reviewed.length,
    credits_awarded: [...studentCredits.values()].reduce((a, b) => a + b, 0),
    skipped: skipped
  };
});

/**
 * A Values Council complaint against a house.
 *
 * The school's rule, and the reason this is a house-level call and not a
 * student-level one: if one member of a house breaks the code, the house
 * answers for it. That is the point — a house that knows it carries its
 * members' conduct has a reason to hold its own members to it.
 *
 * What it deliberately does NOT do is touch any student's club_points. The
 * penalty lands on the house total and nowhere else, so a child who did
 * nothing does not carry a mark on their own record for what somebody else
 * did. Collective responsibility is a lesson; a permanent personal penalty for
 * another child's act is not one, and this is a children's platform.
 *
 * The Council names the size, between COMPLAINT_MIN_POINTS and
 * COMPLAINT_MAX_POINTS, because a missed greeting and a covered-up injustice
 * are not the same failure and a fixed price would make them so.
 */
exports.fileCouncilComplaint = onCall({ cors: true }, async (request) => {
  // The Values Council is the school admin's to convene (see the roles table
  // in the concept), so a teacher cannot fine a whole house on their own.
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);

  const data = request.data || {};
  const house = String(data.house || '').trim();
  if (!CLUB_HOUSE_IDS.includes(house)) {
    throw new HttpsError('invalid-argument', 'Name one of the four houses.');
  }

  const reason = String(data.reason || '').trim().slice(0, COMPLAINT_REASON_MAX);
  if (reason.length < COMPLAINT_REASON_MIN) {
    // Every other member of the house will ask what this was for. A complaint
    // that cannot answer that should not cost them anything.
    throw new HttpsError(
      'invalid-argument',
      'Write at least ' + COMPLAINT_REASON_MIN + ' characters explaining what happened.'
    );
  }

  const requested = Number(data.points);
  if (!Number.isFinite(requested) || Math.round(requested) !== requested) {
    throw new HttpsError('invalid-argument', 'Points must be a whole number.');
  }
  if (requested < COMPLAINT_MIN_POINTS || requested > COMPLAINT_MAX_POINTS) {
    throw new HttpsError(
      'invalid-argument',
      'A penalty must be between ' + COMPLAINT_MIN_POINTS + ' and ' + COMPLAINT_MAX_POINTS + ' points.'
    );
  }

  // A super_admin has no school of their own and names the one they are acting
  // on; a school_admin is pinned to theirs. Passing '' is how HQ fines the
  // Global Virtual House that self-study members share.
  const schoolId = caller.role === 'super_admin'
    ? String(data.school_id || '').trim()
    : caller.school_id;
  if (caller.role !== 'super_admin' && !schoolId) {
    throw new HttpsError('failed-precondition', 'Your account is not attached to a school.');
  }

  const scoreRef = db.collection('house_scores').doc(houseScoreId(schoolId, house));
  const complaintRef = db.collection('council_complaints').doc();
  const filedAt = nowIso();

  // A transaction, not an increment: the deduction is floored at the house's
  // current total so a standings table on a children's platform never shows a
  // house in the negative. Read and write have to be one operation, or two
  // complaints filed at once would each floor against a stale total and take
  // the house below zero between them.
  const applied = await db.runTransaction(async (tx) => {
    const snap = await tx.get(scoreRef);
    const current = snap.exists && typeof snap.data().points === 'number' ? snap.data().points : 0;
    const deducted = Math.max(0, Math.min(requested, current));

    tx.set(scoreRef, {
      school_id: schoolId,
      house: house,
      points: Math.max(0, current - deducted),
      updated_at: filedAt
    }, { merge: true });

    tx.set(complaintRef, {
      school_id: schoolId,
      house: house,
      reason: reason,
      // What was asked for and what the house could actually pay are both
      // kept: a house fined 50 with only 20 to its name has still been fined
      // 50, and the record should say so.
      points_requested: requested,
      points_deducted: deducted,
      raised_by: caller.uid,
      raised_by_role: caller.role,
      created_at: filedAt
    });

    return deducted;
  });

  return {
    complaint_id: complaintRef.id,
    house: house,
    points_requested: requested,
    points_deducted: applied
  };
});

// ===========================================================================
// The house quiz — how a self-study member joins a house
// ===========================================================================
//
// A school allocates its students to houses from the admin panel. An
// individual who signed up alone had no school to do that, and so landed on a
// club they could not enter.
//
// The scoring lives here and not in the browser for the same reason the whole
// club does: 'house' is kept out of every client's hands by the Firestore
// rules, so that nobody sorts themselves into the house whose habits look
// easiest. A quiz scored in the page is a quiz whose result a child can simply
// post. This callable takes the ANSWERS, does the arithmetic itself, and is
// the only thing that writes the field.

/**
 * question id -> option id -> house.
 *
 * SOURCE OF TRUTH IS src/lib/houseQuiz.ts — duplicated because functions/ is a
 * separate package with no build step. A test asserts the two agree
 * (src/__tests__/houseQuiz.test.ts). If that test fails, fix this map: an
 * option that disagrees here would sort a child into a house whose answer they
 * did not give.
 */
const QUIZ_ANSWER_KEY = {
  q1: { a: 'sidq', b: 'rahmah', c: 'amanah', d: 'adl' },
  q2: { a: 'amanah', b: 'adl', c: 'sidq', d: 'rahmah' },
  q3: { a: 'rahmah', b: 'adl', c: 'sidq', d: 'amanah' },
  q4: { a: 'adl', b: 'amanah', c: 'rahmah', d: 'sidq' },
  q5: { a: 'sidq', b: 'amanah', c: 'adl', d: 'rahmah' },
  q6: { a: 'rahmah', b: 'sidq', c: 'amanah', d: 'adl' }
};

const QUIZ_QUESTION_IDS = Object.keys(QUIZ_ANSWER_KEY);

/**
 * Break a tie without favouring a house.
 *
 * Six questions across four houses tie often, and "first in the list wins"
 * would quietly make Sidq the largest house on the platform. Deriving the
 * choice from the uid spreads ties evenly and, being deterministic, gives the
 * same child the same house if the call is retried after a dropped response.
 */
function breakTie(candidates, uid) {
  let sum = 0;
  for (let i = 0; i < uid.length; i++) sum = (sum + uid.charCodeAt(i)) % 100000;
  return candidates[sum % candidates.length];
}

exports.assignHouseFromQuiz = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');

  const answers = (request.data && request.data.answers) || {};
  if (typeof answers !== 'object' || Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'Send the answers as an object.');
  }

  const meRef = db.collection('users').doc(request.auth.uid);
  const meSnap = await meRef.get();
  if (!meSnap.exists) throw new HttpsError('permission-denied', 'This account has no profile.');
  const me = meSnap.data();

  // A school student's house is the school's decision, and a family child's is
  // their school's too. This route exists only for members who have nobody to
  // allocate them.
  if (me.role !== 'individual') {
    throw new HttpsError(
      'failed-precondition',
      'Your school decides which house you belong to. Ask your teacher to add you.'
    );
  }

  // Already housed. Refusing rather than re-sorting is the point: a quiz you
  // can retake until you like the answer is a house you chose, and a house you
  // chose is one you can leave the moment its habits look like work.
  if (CLUB_HOUSE_IDS.includes(me.house)) {
    throw new HttpsError('failed-precondition', 'You are already in a house.');
  }

  const tally = { sidq: 0, amanah: 0, rahmah: 0, adl: 0 };

  for (const qid of QUIZ_QUESTION_IDS) {
    const picked = String(answers[qid] || '').trim();
    if (!picked) {
      // Every question, or nobody is sorted. A half-answered quiz tells us
      // about the questions that were skipped, not about the child.
      throw new HttpsError('invalid-argument', 'Please answer every question.');
    }
    const house = QUIZ_ANSWER_KEY[qid][picked];
    if (!house) {
      throw new HttpsError('invalid-argument', 'That is not one of the answers.');
    }
    tally[house]++;
  }

  const top = Math.max(...Object.values(tally));
  const leading = CLUB_HOUSE_IDS.filter((h) => tally[h] === top);
  const house = leading.length === 1 ? leading[0] : breakTie(leading, request.auth.uid);

  const assignedAt = nowIso();
  await meRef.set({
    house: house,
    house_assigned_at: assignedAt,
    // How this child came to be in this house. A school-allocated student has
    // no such field, so a later reader can always tell the two apart.
    house_source: 'quiz',
    house_quiz_tally: tally
  }, { merge: true });

  return {
    house: house,
    tally: tally,
    // True when the quiz did not settle it on its own. Worth returning so the
    // page can say "you lean toward two houses" rather than implying the six
    // answers pointed one way.
    was_tie: leading.length > 1
  };
});

// ---------------------------------------------------------------------------
// Community schools — roster provisioning and wall approval
//
// A community school (schools/{id}.type === 'weekly') meets one day a week. Its
// students never log in: there is no phone to log in from and no second day to
// do it on. So the roster has to produce STUDENTS, not the invite codes the
// full-time flow hands out — a claim slip nobody redeems is a student who does
// not exist, and a wall with nobody to tag.
//
// See SCHOOL_GROUP_PLAN.md §3 and §12.
// ---------------------------------------------------------------------------

/** One batch of roster rows per call. Firestore's own batch ceiling is 500. */
const MAX_ROSTER_PER_CALL = 100;

/** Normalized identity of a roster row, for the duplicate guard. */
function rosterKey(classId, name) {
  return String(classId || '').trim().toLowerCase() + '\u0000' +
         String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Bulk-create roster students with no login of their own.
 *
 * Deliberately NOT createChild in a loop:
 *  - createChild allocates an invites/{STU-XXXXX} code per student, which is
 *    exactly what this flow must not do. Two hundred unredeemable slips is
 *    two hundred documents of litter and a pending-invites counter that never
 *    reaches zero.
 *  - Two hundred callable round-trips over a school's connection is minutes
 *    of a spinner. One batch is one write.
 *
 * A student created here converts to a login later with no migration: mint a
 * STU- code carrying child_uid and claimChild attaches it, exactly as it does
 * for a child created by the family flow.
 */
exports.createRosterStudents = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const data = request.data || {};
  const schoolId = resolveSchoolId(caller, data.school_id);

  const rows = Array.isArray(data.students) ? data.students : null;
  if (!rows || rows.length === 0) {
    throw new HttpsError('invalid-argument', 'Send at least one student.');
  }
  if (rows.length > MAX_ROSTER_PER_CALL) {
    throw new HttpsError('invalid-argument',
      'Send at most ' + MAX_ROSTER_PER_CALL + ' students per call.');
  }

  // Everyone already on this school's roster, read once. The alternative — a
  // query per row — is 100 reads to import 100 students.
  const existing = new Set();
  const rosterSnap = await db.collection('users')
    .where('school_id', '==', schoolId)
    .where('role', '==', 'student')
    .get();
  rosterSnap.forEach((d) => {
    existing.add(rosterKey(d.get('class_id'), d.get('name')));
  });

  const batch = db.batch();
  const created = [];
  const skipped = [];

  for (const row of rows) {
    const name = String((row && row.name) || '').trim().replace(/\s+/g, ' ');
    const classId = String((row && row.class_id) || '').trim();

    if (name.length < 2 || name.length > 80) {
      skipped.push({ name: name, class_id: classId, reason: 'invalid_name' });
      continue;
    }

    const key = rosterKey(classId, name);
    // Re-importing last term's list is the normal case, not an error: the
    // admin exports from the school's own register and half the rows are
    // already here. Skipping and reporting beats failing the whole import.
    if (existing.has(key)) {
      skipped.push({ name: name, class_id: classId, reason: 'duplicate' });
      continue;
    }
    existing.add(key);

    const ref = db.collection('users').doc();
    batch.set(ref, {
      role: 'student',
      name: name,
      school_id: schoolId,
      class_id: classId,
      // Never had a login and is not waiting for one. This is what tells the
      // dashboard not to show a pending claim code against the name.
      roster_only: true,
      // Photographs of a child are opt-in, and the opt-in is the parent's to
      // give. 'unset' behaves exactly like 'denied' at publish time —
      // publishPost drops the tag. See SCHOOL_GROUP_PLAN.md §8.
      media_consent: 'unset',
      created_at: nowIso(),
      created_by: caller.uid
      // No phone and no email, for the reason spelled out in createChild:
      // lookupEmailByPhone matches on phone across /users and a child holding
      // the family's number could win that race.
    });
    created.push({ student_uid: ref.id, name: name, class_id: classId });
  }

  if (created.length > 0) {
    try {
      await batch.commit();
    } catch (err) {
      throw new HttpsError('internal', 'Could not save the roster: ' + err.message);
    }
  }

  return { created: created, skipped: skipped };
});

/**
 * Unlock a new community school's wall.
 *
 * Registration is open — anyone with an email address can create a school, and
 * that was fine while a fake one could only generate invite codes nobody would
 * redeem. It stops being fine when the same account can upload photographs of
 * children and hand out parent links. So the school is created instantly and
 * can do everything EXCEPT publish: wall_enabled starts false and only this
 * function, super-admin only, turns it on.
 *
 * Firestore rules deliberately keep approval_status and wall_enabled out of
 * every school_admin update whitelist, so this is the only path.
 */
exports.approveSchool = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['super_admin']);
  const data = request.data || {};

  const schoolId = String(data.school_id || '').trim();
  if (!schoolId) throw new HttpsError('invalid-argument', 'Name the school_id to approve.');

  const approved = data.approved !== false;

  const ref = db.collection('schools').doc(schoolId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'That school does not exist.');

  await ref.set({
    approval_status: approved ? 'approved' : 'pending',
    // Approval is what unlocks the wall; the two are not separate switches to
    // get out of step. A school put back to 'pending' loses publishing again.
    wall_enabled: approved,
    approved_at: approved ? nowIso() : null,
    approved_by: approved ? caller.uid : null
  }, { merge: true });

  return { school_id: schoolId, approval_status: approved ? 'approved' : 'pending' };
});

// ---------------------------------------------------------------------------
// The school wall
//
// A community school photographs its activity day and posts it; every tagged
// child shows as first name + class. See SCHOOL_GROUP_PLAN.md §2 and §5.
//
// firestore.rules has NO client write branch for school_posts. These two
// callables are the only writers, because publishing has to check per tagged
// child that photo consent was granted, and rules cannot do that without one
// document read per tag on every write attempt.
// ---------------------------------------------------------------------------

const WALL_MAX_MEDIA = 10;
const WALL_MAX_TEXT = 2000;
const WALL_MAX_TAGS = 40;
const SESSION_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The bucket wall media lives in.
 *
 * getStorage().bucket() reads storageBucket out of FIREBASE_CONFIG, which a
 * deployed Cloud Function always has and a bare initializeApp() does not — it
 * throws "Bucket name not specified or invalid", from inside a publish, after
 * the teacher has already waited for the upload. Wrapped so that failure
 * arrives as something a reader can act on.
 */
function wallBucket() {
  try {
    return getStorage().bucket();
  } catch (err) {
    throw new HttpsError('failed-precondition',
      'Storage is not configured for this project: ' + err.message);
  }
}

/**
 * The wall shows a first name, never a full one. Split here rather than in the
 * page, so no caller can decide to send the whole thing.
 */
function firstNameOf(full) {
  return String(full || '').trim().split(/\s+/)[0] || '';
}

/** Load a school and prove its wall is open. */
async function loadWallSchool(schoolId) {
  const snap = await db.collection('schools').doc(schoolId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'That school does not exist.');
  const school = snap.data();

  // wall_enabled is set only by approveSchool. A school that registered five
  // minutes ago can build its whole roster, but cannot publish a photograph
  // of a child until a human has looked at the school.
  if (school.wall_enabled !== true) {
    throw new HttpsError('failed-precondition',
      'This school wall is not open yet. It unlocks once the school is verified.');
  }
  return school;
}

/**
 * Post an activity day to the wall.
 *
 * Returns dropped_tags so the teacher is told which children were left out and
 * why. Dropping them silently would look like the app had lost the tag, and
 * the teacher would try again rather than go and ask the parent.
 */
exports.publishPost = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const data = request.data || {};
  const schoolId = resolveSchoolId(caller, data.school_id);
  const school = await loadWallSchool(schoolId);

  const text = String(data.text || '').trim();
  if (text.length > WALL_MAX_TEXT) {
    throw new HttpsError('invalid-argument', 'That note is too long.');
  }

  const sessionDate = String(data.session_date || '').trim();
  if (!SESSION_DATE_RE.test(sessionDate)) {
    throw new HttpsError('invalid-argument', 'Which day was this? Use YYYY-MM-DD.');
  }

  const tagIds = Array.isArray(data.tagged)
    ? data.tagged.map((t) => String(t || '').trim()).filter(Boolean)
    : [];
  if (tagIds.length > WALL_MAX_TAGS) {
    throw new HttpsError('invalid-argument', 'Tag at most ' + WALL_MAX_TAGS + ' students on one post.');
  }

  const media = Array.isArray(data.media) ? data.media : [];
  if (media.length > WALL_MAX_MEDIA) {
    throw new HttpsError('invalid-argument', 'Attach at most ' + WALL_MAX_MEDIA + ' photos to one post.');
  }
  if (!text && media.length === 0) {
    throw new HttpsError('invalid-argument', 'A post needs a photo or a note.');
  }

  // --- Consent, the whole reason this is a callable ------------------------
  const tagged = [];
  const droppedTags = [];
  if (tagIds.length) {
    const refs = tagIds.map((id) => db.collection('users').doc(id));
    const snaps = await db.getAll.apply(db, refs);
    snaps.forEach((snap, i) => {
      const id = tagIds[i];
      if (!snap.exists) return droppedTags.push({ student_uid: id, reason: 'not_found' });
      const student = snap.data();
      if (student.school_id !== schoolId) {
        return droppedTags.push({ student_uid: id, reason: 'other_school' });
      }
      // 'unset' is not a soft yes. A child nobody asked about is treated
      // exactly like a child whose parent said no.
      if (student.media_consent !== 'granted') {
        return droppedTags.push({
          student_uid: id, name: student.name || '', reason: 'no_consent'
        });
      }
      tagged.push({
        student_uid: id,
        // Snapshotted, not resolved on read: the wall is read constantly and
        // the roster changes rarely. Renaming a student does not rewrite
        // history, which is the right behaviour for a photo caption anyway.
        first_name: firstNameOf(student.name),
        class_id: student.class_id || ''
      });
    });
  }

  // The class filter has to stay honest: a post showing a Class 4 child must
  // be findable under Class 4, whatever the caller passed.
  const classIds = new Set(
    (Array.isArray(data.class_ids) ? data.class_ids : [])
      .map((c) => String(c || '').trim()).filter(Boolean)
  );
  tagged.forEach((t) => { if (t.class_id) classIds.add(t.class_id); });

  const postRef = db.collection('school_posts').doc();

  // --- Media ---------------------------------------------------------------
  // Paths come from the client, so each is checked against the caller's own
  // staging prefix before anything moves. Without that check a caller could
  // name any file in the bucket and have it published under their post.
  const stagingPrefix = 'wall_staging/' + schoolId + '/' + caller.uid + '/';
  const finalMedia = [];
  if (media.length) {
    const bucket = wallBucket();
    for (const item of media) {
      const path = String((item && item.path) || '');
      if (path.indexOf(stagingPrefix) !== 0 || path.indexOf('..') !== -1) {
        throw new HttpsError('permission-denied', 'That file is not one of yours.');
      }
      const source = bucket.file(path);
      const [exists] = await source.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'One of the photos had not finished uploading. Try again.');
      }

      const name = path.slice(stagingPrefix.length);
      const destination = 'wall/' + schoolId + '/' + postRef.id + '/' + name;
      await source.move(destination);

      finalMedia.push({
        path: destination,
        type: 'image',
        w: Number(item.w) || 0,
        h: Number(item.h) || 0,
        bytes: Number(item.bytes) || 0
      });
    }
  }

  // A teacher post waits for the admin only when the school asked for that.
  // An admin post never waits for itself.
  const needsApproval = !!(school.wall_settings &&
    school.wall_settings.require_approval === true &&
    caller.role === 'teacher');

  const now = nowIso();
  const post = {
    school_id: schoolId,
    class_ids: Array.from(classIds),
    author_uid: caller.uid,
    author_role: caller.role,
    text: text,
    media: finalMedia,
    tagged: tagged,
    session_date: sessionDate,
    source: data.source === 'activity_submission' ? 'activity_submission' : 'manual',
    status: needsApproval ? 'pending' : 'published',
    // Denormalized so a comment rule can prove the policy without reading the
    // school doc. Phase 4 needs it; stamping it now costs nothing and means
    // posts written before then are not a special case later.
    comments_policy: (school.wall_settings && school.wall_settings.comments) || 'staff',
    like_count: 0,
    comment_count: 0,
    created_at: now
  };
  if (data.source_id) post.source_id = String(data.source_id);
  if (post.status === 'published') post.published_at = now;

  try {
    await postRef.set(post);
  } catch (err) {
    throw new HttpsError('internal', 'Could not save the post: ' + err.message);
  }

  return { post_id: postRef.id, status: post.status, dropped_tags: droppedTags };
});

/**
 * Hide, restore, or delete a post.
 *
 * Deleting removes the photographs too. A post taken down because a parent
 * asked has not really been taken down while its images are still fetchable
 * by anyone holding the URL.
 */
exports.moderatePost = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const data = request.data || {};

  const postId = String(data.post_id || '').trim();
  if (!postId) throw new HttpsError('invalid-argument', 'Which post?');

  const action = String(data.action || '').trim();
  if (['hide', 'publish', 'delete'].indexOf(action) === -1) {
    throw new HttpsError('invalid-argument', 'Unknown action.');
  }

  const ref = db.collection('school_posts').doc(postId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'That post no longer exists.');
  const post = snap.data();

  if (caller.role !== 'super_admin' && post.school_id !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That post belongs to another school.');
  }
  // A teacher moderates what they wrote. Taking down a colleague post is the
  // admin call — otherwise the wall becomes a place where staff quietly
  // delete each other classes.
  if (caller.role === 'teacher' && post.author_uid !== caller.uid) {
    throw new HttpsError('permission-denied',
      'Only a school admin can moderate another teacher post.');
  }

  if (action === 'delete') {
    const bucket = wallBucket();
    for (const item of (post.media || [])) {
      await bucket.file(item.path).delete().catch(() => {});
    }

    // Deleting a document does not delete its subcollections — Firestore
    // leaves them addressable under a path whose parent is gone. A post taken
    // down because a parent asked would otherwise keep every like and every
    // comment written about their child, out of reach of the dashboard that
    // was supposed to have removed it.
    for (const sub of ['likes', 'comments']) {
      const snap = await ref.collection(sub).get();
      for (const group of chunked(snap.docs, 400)) {
        const batch = db.batch();
        group.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    await ref.delete();
    return { post_id: postId, deleted: true };
  }

  const status = action === 'hide' ? 'hidden' : 'published';
  await ref.update({
    status: status,
    moderated_at: nowIso(),
    moderated_by: caller.uid
  });
  return { post_id: postId, status: status };
});

// ---------------------------------------------------------------------------
// Parent access
//
// Parents are the reason a school keeps posting, and they will not create
// accounts. So a school hands out a link — a bearer token on a printed slip or
// sent over WhatsApp — and the parent sees their own child's posts with no
// sign-in at all.
//
// The token is resolved here, on the Admin SDK. It is deliberately NOT a
// Firestore rule: a rule cannot verify a bearer token without making
// parent_links readable, and a readable collection of bearer tokens is not a
// secret. See SCHOOL_GROUP_PLAN.md §7.
// ---------------------------------------------------------------------------

const PARENT_TOKEN_LENGTH = 32;
const PARENT_LINK_DAYS = 180;
const PARENT_WALL_PAGE = 30;

/** Signed media URLs live an hour: long enough to read a page, short enough
 *  that a forwarded URL stops working long before the link itself does. */
const SIGNED_URL_MS = 60 * 60 * 1000;

/**
 * Resolve a parent token to the child it names.
 *
 * Every failure returns the same 'not-found' so that a wrong token, an expired
 * one and a revoked one are indistinguishable to whoever is holding it.
 */
async function resolveParentToken(rawToken) {
  const token = String(rawToken || '').trim();
  if (!token || token.length > 64) {
    throw new HttpsError('not-found', 'That link is not valid.');
  }

  const snap = await db.collection('parent_links').doc(token).get();
  if (!snap.exists) throw new HttpsError('not-found', 'That link is not valid.');

  const link = snap.data();
  if (link.revoked_at) throw new HttpsError('not-found', 'That link is not valid.');
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    throw new HttpsError('not-found', 'That link has expired. Ask the school for a new one.');
  }
  return { token: token, link: link };
}

/**
 * Mint a link for one child.
 *
 * One live link per child: issuing again revokes the previous one. Otherwise a
 * slip handed to the wrong parent stays valid forever, and the school has no
 * way to take it back other than deleting a token nobody wrote down.
 */
exports.issueParentLink = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const data = request.data || {};

  const studentUid = String(data.student_uid || '').trim();
  if (!studentUid) throw new HttpsError('invalid-argument', 'Which student?');

  const studentSnap = await db.collection('users').doc(studentUid).get();
  if (!studentSnap.exists || studentSnap.data().role !== 'student') {
    throw new HttpsError('not-found', 'That student does not exist.');
  }
  const student = studentSnap.data();
  if (caller.role !== 'super_admin' && student.school_id !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That student belongs to another school.');
  }

  const existing = await db.collection('parent_links')
    .where('student_uid', '==', studentUid)
    .get();
  const revokeBatch = db.batch();
  existing.forEach((d) => {
    if (!d.get('revoked_at')) revokeBatch.update(d.ref, { revoked_at: nowIso(), revoked_by: caller.uid });
  });
  await revokeBatch.commit();

  const token = randomCode(PARENT_TOKEN_LENGTH);
  const expiresAt = new Date(Date.now() + PARENT_LINK_DAYS * 86400000).toISOString();

  await db.collection('parent_links').doc(token).set({
    student_uid: studentUid,
    school_id: student.school_id,
    student_name: student.name || '',
    created_at: nowIso(),
    created_by: caller.uid,
    expires_at: expiresAt
  });

  // A marker on the student, because parent_links is closed to every client
  // (see firestore.rules §12). Without it the roster could not show which
  // children already have a link, and an admin would reissue by accident —
  // silently revoking the slip a parent is already using.
  //
  // Deliberately a date, never the token: the roster is a list a whole staff
  // room reads, and a token on it would be every parent's link on one screen.
  await db.collection('users').doc(studentUid).update({
    parent_link_issued_at: nowIso()
  });

  return {
    token: token,
    // A fragment, never a path segment: the browser does not send it to the
    // server, so the token stays out of access logs and Referer headers — and
    // a static SSG build has no file to serve /wall/p/<token> from anyway.
    path: '/wall/p#' + token,
    student_uid: studentUid,
    expires_at: expiresAt
  };
});

/** Take a link back — a slip handed to the wrong person, or a child who left. */
exports.revokeParentLink = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const token = String((request.data && request.data.token) || '').trim();
  if (!token) throw new HttpsError('invalid-argument', 'Which link?');

  const ref = db.collection('parent_links').doc(token);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'That link does not exist.');
  if (caller.role !== 'super_admin' && snap.get('school_id') !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That link belongs to another school.');
  }

  await ref.update({ revoked_at: nowIso(), revoked_by: caller.uid });
  await db.collection('users').doc(snap.get('student_uid'))
    .update({ parent_link_issued_at: FieldValue.delete() })
    .catch(() => {});
  return { token: token, revoked: true };
});

/**
 * One child's wall, for whoever holds the link.
 *
 * Unauthenticated on purpose — the token IS the credential. Only posts that
 * tag this child are returned, and only published ones: a parent has no
 * business seeing a post the school is still deciding about, or one it took
 * down.
 */
exports.readParentWall = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const resolved = await resolveParentToken(data.token);
  const link = resolved.link;

  const snap = await db.collection('school_posts')
    .where('school_id', '==', link.school_id)
    .where('status', '==', 'published')
    .orderBy('session_date', 'desc')
    .limit(PARENT_WALL_PAGE)
    .get();

  const bucket = wallBucket();
  const likeId = guardianLikeId(resolved.token);
  const posts = [];

  for (const d of snap.docs) {
    const post = d.data();
    const tagged = post.tagged || [];
    // Only this child. A parent holding one link must not become a reader of
    // the whole school's photographs.
    if (!tagged.some((t) => t.student_uid === link.student_uid)) continue;

    const media = [];
    for (const item of (post.media || [])) {
      let url = '';
      try {
        const signed = await bucket.file(item.path).getSignedUrl({
          action: 'read', expires: Date.now() + SIGNED_URL_MS
        });
        url = signed[0];
      } catch (err) {
        // Signing needs the service account's signBlob permission, which a
        // deployed function has and the local emulator does not. One photo
        // that cannot be signed must not take the whole page down with it.
        console.warn('could not sign', item.path, err.message);
      }
      // Pushed even when the URL is empty. Dropping it would show the parent a
      // post that looks like it never had a photograph, and nobody would ever
      // report the photograph that quietly went missing — the page draws a
      // placeholder instead, which is a thing a parent can complain about.
      media.push({ url: url, w: item.w || 0, h: item.h || 0 });
    }

    const liked = (await d.ref.collection('likes').doc(likeId).get()).exists;

    posts.push({
      id: d.id,
      text: post.text || '',
      session_date: post.session_date,
      author_name: post.author_name || '',
      media: media,
      // Only this child's tag is returned. The other children in the photo are
      // in the picture, but their names are not this parent's to collect.
      child_first_name: (tagged.find((t) => t.student_uid === link.student_uid) || {}).first_name || '',
      like_count: post.like_count || 0,
      liked: liked
    });
  }

  return {
    student_name: link.student_name || '',
    school_name: await schoolNameFor(link.school_id),
    posts: posts
  };
});

async function schoolNameFor(schoolId) {
  const snap = await db.collection('schools').doc(schoolId).get();
  return snap.exists ? (snap.get('name') || '') : '';
}

/**
 * A stable, opaque id for the holder of one link.
 *
 * The token itself is never stored on the like: a like document is read by the
 * page, and a token that appears in readable data is a token that leaks. The
 * hash is one-way and one-per-link, so appreciating twice is idempotent and no
 * two links collide.
 */
function guardianLikeId(token) {
  return 'guardian_' + createHash('sha256').update(token).digest('hex').slice(0, 16);
}

/**
 * A parent's heart, with no account.
 *
 * Written on the Admin SDK because the caller has no Firebase identity at all
 * — there is nothing for a Firestore rule to check. Toggling: appreciating an
 * already-appreciated post takes it back.
 */
exports.appreciatePost = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const resolved = await resolveParentToken(data.token);
  const link = resolved.link;

  const postId = String(data.post_id || '').trim();
  if (!postId) throw new HttpsError('invalid-argument', 'Which post?');

  const postRef = db.collection('school_posts').doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) throw new HttpsError('not-found', 'That post no longer exists.');

  const post = postSnap.data();
  // The same two checks readParentWall makes. Without them a link holder could
  // appreciate — and so learn the existence of — any post id they guessed.
  if (post.school_id !== link.school_id || post.status !== 'published') {
    throw new HttpsError('not-found', 'That post no longer exists.');
  }
  if (!(post.tagged || []).some((t) => t.student_uid === link.student_uid)) {
    throw new HttpsError('not-found', 'That post no longer exists.');
  }

  const likeRef = postRef.collection('likes').doc(guardianLikeId(resolved.token));

  // The count is NOT touched here. countWallReactions owns like_count and
  // fires on this write like any other — incrementing here as well would
  // count a parent's single heart twice, and the drift would be permanent
  // because nothing ever recomputes the total from the documents.
  const liked = await db.runTransaction(async (tx) => {
    const existing = await tx.get(likeRef);
    if (existing.exists) {
      tx.delete(likeRef);
      return false;
    }
    tx.set(likeRef, { source: 'parent_link', school_id: link.school_id, created_at: nowIso() });
    return true;
  });

  return { post_id: postId, liked: liked };
});

/**
 * Keep like_count and comment_count honest.
 *
 * The counters are the one part of a post a client can see but must never
 * write: firestore.rules has no write branch for school_posts at all, so a
 * browser that could increment its own applause would be minting it. This
 * trigger is the only writer, and it is the ONLY writer — appreciatePost
 * deliberately stopped incrementing when this landed, or a parent's single
 * heart would have counted twice with nothing to correct the drift.
 *
 * One trigger for both subcollections. Two would be the same eight lines
 * twice, and they would drift.
 */
exports.countWallReactions = onDocumentWritten('school_posts/{postId}/{sub}/{docId}', async (event) => {
  const field = event.params.sub === 'likes' ? 'like_count'
              : event.params.sub === 'comments' ? 'comment_count'
              : null;
  // Any other subcollection someone adds later is not a counter's business.
  if (!field) return;

  const existedBefore = !!(event.data && event.data.before && event.data.before.exists);
  const existsAfter = !!(event.data && event.data.after && event.data.after.exists);

  let delta = 0;
  if (!existedBefore && existsAfter) delta = 1;
  else if (existedBefore && !existsAfter) delta = -1;
  // An edit is neither: hiding a comment leaves the document in place, and a
  // hidden comment still occupies a row in the thread staff can see.
  else return;

  const update = {};
  update[field] = FieldValue.increment(delta);

  try {
    await db.collection('school_posts').doc(event.params.postId).update(update);
  } catch (err) {
    // The post is gone — moderatePost deletes the subcollections before the
    // document, so this fires for every one of them on the way out. Nothing to
    // count and nothing wrong.
    if (err.code !== 5) console.warn('countWallReactions:', err.message);
  }
});

/* ===========================================================================
   Organisation portals — see ORG_PORTAL_PLAN.md

   An organisation (Alkhidmat, a telecom's CSR arm) gets one link. Schools
   arrive through it and register themselves; each one leaves with its own
   link for children, who sign in with a roll number and a PIN and never have
   an email address anywhere in the system.
   =========================================================================== */

// 32^8 is about 1.1 x 10^12. Unlike a child code these are not transcribed by
// hand off a slip — they are forwarded as a link — so length costs nothing,
// and guessing has to stay out of reach for a token that lives for years.
const ORG_TOKEN_LENGTH = 8;
const SCHOOL_TOKEN_LENGTH = 8;

const PIN_LENGTH = 4;
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MINUTES = 15;

// 64 bytes out of scrypt. A 4-digit PIN has so little entropy of its own that
// everything protecting it has to come from the work factor and the lockout.
const PIN_KEY_BYTES = 64;

/**
 * A name a URL can carry: 'Gulshan Campus (Girls)' -> 'gulshan-campus-girls'.
 *
 * Deliberately lossy for anything outside a-z0-9, Urdu names included. A
 * school named only in Urdu slugs to '' and the caller falls back to a
 * generic stem, which is plain but readable; the alternative is
 * percent-encoded mojibake in a link somebody has to read out loud.
 */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** The first free slug in this org: 'campus', then 'campus-2', 'campus-3'. */
async function uniqueSchoolSlug(orgId, base) {
  const stem = base || 'school';
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? stem : stem + '-' + n;
    const clash = await db.collection('schools')
      .where('org_id', '==', orgId)
      .where('slug', '==', candidate)
      .limit(1)
      .get();
    if (clash.empty) return candidate;
  }
  throw new HttpsError('resource-exhausted', 'Too many schools with that name.');
}

function hashPin(pin, salt) {
  return scryptSync(String(pin), salt, PIN_KEY_BYTES).toString('hex');
}

/**
 * Constant time, and tolerant of a stored hash that is missing or the wrong
 * length. timingSafeEqual throws on a length mismatch, and a throw here would
 * be its own oracle: 'that student has no PIN' would answer faster and louder
 * than 'that PIN is wrong'.
 */
function pinMatches(pin, salt, expectedHex) {
  if (!salt || !expectedHex) return false;
  const actual = Buffer.from(hashPin(pin, salt), 'hex');
  const expected = Buffer.from(String(expectedHex), 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function randomPin() {
  // randomInt, not Math.random: this is a credential, however short.
  let out = '';
  for (let i = 0; i < PIN_LENGTH; i++) out += String(randomInt(10));
  return out;
}

/** Create an organisation and hand back the one link its schools arrive through. */
exports.createOrg = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['super_admin']);
  const data = request.data || {};

  const name = String(data.name || '').trim();
  if (!name) throw new HttpsError('invalid-argument', 'The organisation needs a name.');

  const slug = slugify(data.slug || name);
  if (!slug) throw new HttpsError('invalid-argument', 'That name has no letters or digits a link can carry. Give the organisation a short English slug as well.');

  const clash = await db.collection('orgs').where('slug', '==', slug).limit(1).get();
  if (!clash.empty) throw new HttpsError('already-exists', 'An organisation already uses the link /o/' + slug + '.');

  const joinToken = randomCode(ORG_TOKEN_LENGTH);
  const ref = db.collection('orgs').doc();
  await ref.set({
    name: name,
    slug: slug,
    join_token: joinToken,
    contact_email: String(data.contact_email || '').trim(),
    contact_phone: String(data.contact_phone || '').trim(),
    status: 'active',
    school_count: 0,
    created_at: nowIso(),
    created_by: caller.uid
  });

  return {
    org_id: ref.id,
    name: name,
    slug: slug,
    // A fragment, for the same reason as a parent link: the browser never
    // sends it to the server, so the token stays out of access logs and
    // Referer headers.
    join_path: '/o/' + slug + '#' + joinToken
  };
});

/** Retire every copy of an organisation's link at once. */
exports.rotateOrgToken = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['super_admin']);
  const orgId = String((request.data && request.data.org_id) || '').trim();
  if (!orgId) throw new HttpsError('invalid-argument', 'Which organisation?');

  const ref = db.collection('orgs').doc(orgId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'No such organisation.');

  const joinToken = randomCode(ORG_TOKEN_LENGTH);
  await ref.update({ join_token: joinToken, token_rotated_at: nowIso(), token_rotated_by: caller.uid });

  // The schools already registered are untouched: the join token is spent at
  // registration and never read again.
  return { org_id: orgId, join_path: '/o/' + snap.get('slug') + '#' + joinToken };
});

/**
 * What is this organisation called?
 *
 * The one function here that anybody on the internet can call, so it answers
 * exactly one question. No school list, no contact details, no id. A head
 * teacher opening the link needs to see they are in the right place, and
 * nothing beyond that is theirs to see before they have registered.
 */
exports.describeOrgInvite = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const slug = slugify(data.slug);
  const token = String(data.token || '').trim();
  if (!slug || !token) throw new HttpsError('invalid-argument', 'That link is incomplete.');

  const snap = await db.collection('orgs').where('slug', '==', slug).limit(1).get();
  const org = snap.empty ? null : snap.docs[0];

  // One error for a wrong slug, a wrong token and a closed organisation. A
  // caller with a bad link learns that it is bad, and nothing else.
  if (!org || org.get('join_token') !== token || org.get('status') !== 'active') {
    throw new HttpsError('not-found', 'This link is not valid any more. Ask the organisation for a current one.');
  }

  return { name: org.get('name'), slug: org.get('slug') };
});

/**
 * A school registers itself under an organisation and is live immediately.
 *
 * No approval step — a settled decision, ORG_PORTAL_PLAN.md section 3. What
 * makes it safe to skip is not trust in the link but what a new school can
 * reach: nothing. It starts with no students and no wall, and sameSchool() in
 * firestore.rules keeps it out of every other school's data. The join token
 * is rotatable the moment a link goes astray.
 *
 * approval_status is 'approved' because the organisation vouched for the
 * school; wall_enabled stays false, because publishing photographs of
 * children is a separate decision from being able to log in.
 */
exports.registerSchoolInOrg = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const slug = slugify(data.slug);
  const token = String(data.token || '').trim();
  const schoolName = String(data.school_name || '').trim();
  const adminName = String(data.admin_name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!slug || !token) throw new HttpsError('invalid-argument', 'That link is incomplete.');
  if (!schoolName) throw new HttpsError('invalid-argument', 'The school needs a name.');
  if (!adminName) throw new HttpsError('invalid-argument', 'Who runs the school?');
  if (!email) throw new HttpsError('invalid-argument', 'An email address is needed to sign in.');
  if (password.length < 6) throw new HttpsError('invalid-argument', 'The password needs at least 6 characters.');

  const orgSnap = await db.collection('orgs').where('slug', '==', slug).limit(1).get();
  const org = orgSnap.empty ? null : orgSnap.docs[0];
  if (!org || org.get('join_token') !== token || org.get('status') !== 'active') {
    throw new HttpsError('not-found', 'This link is not valid any more. Ask the organisation for a current one.');
  }

  const schoolSlug = await uniqueSchoolSlug(org.id, slugify(schoolName));
  const studentToken = randomCode(SCHOOL_TOKEN_LENGTH);

  let user;
  try {
    user = await getAuth().createUser({ email: email, password: password, displayName: adminName });
  } catch (err) {
    if (err && err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'That email address already has an account. Sign in instead, or use another address.');
    }
    throw new HttpsError('internal', 'Could not create the account.');
  }

  const schoolId = db.collection('schools').doc().id;

  try {
    // The profile first, then the school: the same order the auth page uses,
    // because the schools create rule reads the caller's profile.
    await db.collection('users').doc(user.uid).set({
      role: 'school_admin',
      email: email,
      name: adminName,
      school_id: schoolId
    });

    await db.collection('schools').doc(schoolId).set({
      name: schoolName,
      location: String(data.location || '').trim(),
      school_code: randomCode(CHILD_CODE_LENGTH),
      admin_uid: user.uid,
      org_id: org.id,
      slug: schoolSlug,
      type: 'weekly',
      meeting_day: String(data.meeting_day || '').trim(),
      approval_status: 'approved',
      wall_enabled: false,
      wall_settings: { comments: 'staff', require_approval: false },
      created_at: nowIso()
    });

    // The link lives in its own closed collection, keyed BY the token, so
    // signing a child in is one document read rather than a query — and so
    // that nothing readable anywhere holds the secret.
    await db.collection('school_links').doc(studentToken).set({
      school_id: schoolId,
      org_slug: org.get('slug'),
      school_slug: schoolSlug,
      created_at: nowIso()
    });

    await db.collection('orgs').doc(org.id).update({ school_count: FieldValue.increment(1) });
  } catch (err) {
    // A half-made school is worse than none: the head would hold an account
    // that signs in to nothing, and could not register again with that email.
    await getAuth().deleteUser(user.uid).catch(() => {});
    await db.collection('users').doc(user.uid).delete().catch(() => {});
    throw new HttpsError('internal', 'Could not finish registering the school.');
  }

  return {
    school_id: schoolId,
    school_slug: schoolSlug,
    org_slug: org.get('slug'),
    student_path: '/s/' + org.get('slug') + '/' + schoolSlug + '#' + studentToken
  };
});

/**
 * Roll numbers and PINs for a class, shown once.
 *
 * The same shape as createTeacherAccount: the credential is returned here and
 * nowhere else, because only the hash is stored. Reissuing is resetStudentPin,
 * not a lookup — there is nothing to look up.
 */
exports.issueStudentPins = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const data = request.data || {};
  const schoolId = resolveSchoolId(caller, data.school_id);

  const uids = Array.isArray(data.student_uids) ? data.student_uids.map(String) : [];
  if (!uids.length) throw new HttpsError('invalid-argument', 'Name at least one student.');
  if (uids.length > 300) throw new HttpsError('invalid-argument', 'Three hundred students at a time is the limit.');

  // The highest roll number already in use, so a second import continues the
  // series instead of colliding with it.
  const existing = await db.collection('users')
    .where('school_id', '==', schoolId)
    .where('role', '==', 'student')
    .get();
  let next = 0;
  existing.forEach((d) => {
    const n = parseInt(d.get('roll_no'), 10);
    if (Number.isFinite(n) && n > next) next = n;
  });

  const issued = [];
  const batch = db.batch();

  for (const uid of uids) {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists || snap.get('role') !== 'student') continue;
    if (snap.get('school_id') !== schoolId) {
      throw new HttpsError('permission-denied', 'One of those students belongs to another school.');
    }

    const rollNo = snap.get('roll_no') ? String(snap.get('roll_no')) : String(++next);
    const pin = randomPin();
    const salt = randomBytes(16).toString('hex');

    batch.update(snap.ref, {
      roll_no: rollNo,
      pin_hash: hashPin(pin, salt),
      pin_salt: salt,
      pin_set_at: nowIso()
    });

    issued.push({
      student_uid: uid,
      name: snap.get('name') || '',
      class_id: snap.get('class_id') || '',
      roll_no: rollNo,
      pin: pin
    });
  }

  if (!issued.length) throw new HttpsError('not-found', 'None of those students are on this roster.');
  await batch.commit();

  return { issued: issued };
});

/** One child, one new PIN — a slip that went home in the wrong bag. */
exports.resetStudentPin = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const uid = String((request.data && request.data.student_uid) || '').trim();
  if (!uid) throw new HttpsError('invalid-argument', 'Which student?');

  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists || snap.get('role') !== 'student') throw new HttpsError('not-found', 'That student does not exist.');
  if (caller.role !== 'super_admin' && snap.get('school_id') !== caller.school_id) {
    throw new HttpsError('permission-denied', 'That student belongs to another school.');
  }
  if (!snap.get('roll_no')) throw new HttpsError('failed-precondition', 'That student has no roll number yet.');

  const pin = randomPin();
  const salt = randomBytes(16).toString('hex');
  await snap.ref.update({ pin_hash: hashPin(pin, salt), pin_salt: salt, pin_set_at: nowIso() });

  // A fresh PIN should not inherit a lockout the old one earned.
  await db.collection('pin_attempts').doc(snap.get('school_id') + '_' + snap.get('roll_no')).delete().catch(() => {});

  return { student_uid: uid, roll_no: String(snap.get('roll_no')), pin: pin };
});

/**
 * A child signs in with a roll number and a PIN.
 *
 * Returns a Firebase custom token for the child's own uid, so from here they
 * are request.auth.uid like anybody else and every student rule already in
 * firestore.rules applies unchanged. ORG_PORTAL_PLAN.md section 1.2 has why
 * this is a real session rather than a side channel.
 *
 * Four digits are only safe because of the lockout below: five tries every
 * fifteen minutes is eighty years to walk ten thousand PINs. The counter is
 * per child, never per school — one child fumbling must not lock a classroom
 * out on activity day.
 */
exports.studentSignIn = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const token = String(data.school_token || '').trim();
  const rollNo = String(data.roll_no || '').trim();
  const pin = String(data.pin || '').trim();

  // One message for every way this fails. A caller guessing a school token
  // must not be able to tell it apart from a caller guessing a PIN.
  const wrong = new HttpsError('permission-denied', 'That roll number and PIN do not match. Check the slip from your teacher.');

  if (!token || !rollNo || !pin) throw wrong;

  const linkSnap = await db.collection('school_links').doc(token).get();
  if (!linkSnap.exists) throw wrong;
  const schoolId = linkSnap.get('school_id');

  const attemptsRef = db.collection('pin_attempts').doc(schoolId + '_' + rollNo);
  const attempts = await attemptsRef.get();
  const lockedUntil = attempts.exists ? attempts.get('locked_until') : null;
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    throw new HttpsError('resource-exhausted', 'Too many wrong tries. Try again in a few minutes, or ask your teacher.');
  }

  const studentSnap = await db.collection('users')
    .where('school_id', '==', schoolId)
    .where('role', '==', 'student')
    .where('roll_no', '==', rollNo)
    .limit(1)
    .get();

  const student = studentSnap.empty ? null : studentSnap.docs[0];
  const ok = student && pinMatches(pin, student.get('pin_salt'), student.get('pin_hash'));

  if (!ok) {
    // Keyed on the roll number rather than the student, so guessing a roll
    // number that does not exist is rate limited too.
    const fails = (attempts.exists ? (attempts.get('fails') || 0) : 0) + 1;
    const update = { fails: fails, last_attempt_at: nowIso() };
    if (fails >= PIN_MAX_FAILS) {
      update.locked_until = new Date(Date.now() + PIN_LOCK_MINUTES * 60000).toISOString();
      update.fails = 0;
    }
    await attemptsRef.set(update, { merge: true });
    throw wrong;
  }

  await attemptsRef.delete().catch(() => {});

  return {
    token: await getAuth().createCustomToken(student.id),
    student_uid: student.id,
    name: student.get('name') || '',
    school_id: schoolId
  };
});

/**
 * The school's own link for children.
 *
 * A callable rather than a field on the school doc, because schools are
 * readable by every signed-in account (firestore.rules section 4) and this is
 * a bearer token. Only the school's own staff get it back.
 */
exports.getSchoolLink = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['teacher', 'school_admin', 'super_admin']);
  const schoolId = resolveSchoolId(caller, request.data && request.data.school_id);

  const links = await db.collection('school_links').where('school_id', '==', schoolId).limit(1).get();
  if (links.empty) throw new HttpsError('not-found', 'This school has no student link yet.');

  const link = links.docs[0];
  return { path: '/s/' + link.get('org_slug') + '/' + link.get('school_slug') + '#' + link.id };
});

/**
 * Retire a school's link and issue another.
 *
 * Every child's slip stops working, so this is the school admin's decision
 * alone, never a teacher's. The PINs are untouched — a new link, the same
 * roll numbers — because a leaked link is not a leaked PIN.
 */
exports.rotateSchoolLink = onCall({ cors: true }, async (request) => {
  const caller = await requireStaff(request, ['school_admin', 'super_admin']);
  const schoolId = resolveSchoolId(caller, request.data && request.data.school_id);

  const links = await db.collection('school_links').where('school_id', '==', schoolId).get();
  if (links.empty) throw new HttpsError('not-found', 'This school has no student link yet.');

  const old = links.docs[0];
  const token = randomCode(SCHOOL_TOKEN_LENGTH);

  await db.collection('school_links').doc(token).set({
    school_id: schoolId,
    org_slug: old.get('org_slug'),
    school_slug: old.get('school_slug'),
    created_at: nowIso(),
    rotated_by: caller.uid
  });

  const batch = db.batch();
  links.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  return { path: '/s/' + old.get('org_slug') + '/' + old.get('school_slug') + '#' + token };
});
