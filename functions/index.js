const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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
