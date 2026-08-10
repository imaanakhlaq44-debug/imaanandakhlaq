const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { randomInt } = require('node:crypto');

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
