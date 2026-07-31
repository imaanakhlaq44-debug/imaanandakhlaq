const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
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
