/**
 * One-off backfill for the leaderboard mirror.
 *
 * mirrorPublicScore only fires when a /users doc is written, so accounts that
 * already exist never get a /public_scores entry and stay invisible on the
 * board. Run this once after deploying the function.
 *
 * Usage (from the repo root):
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
 *   node scripts/backfill-public-scores.cjs
 *
 * Add --dry-run to print what it would write without touching Firestore.
 * Safe to re-run: every write is an idempotent set() on public_scores/{uid}.
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Keep in sync with RANKED_ROLES in functions/index.js.
const RANKED_ROLES = ['student', 'individual'];
const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set — point it at a service account key JSON.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

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

async function run() {
  const snap = await db.collection('users').get();
  console.log('Users scanned:', snap.size);

  let written = 0;
  let skipped = 0;
  let batch = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    const user = doc.data();
    if (!RANKED_ROLES.includes(user.role)) {
      skipped++;
      continue;
    }
    const score = buildPublicScore(user);
    written++;
    if (DRY_RUN) {
      console.log('would write', doc.id, JSON.stringify(score));
      continue;
    }
    batch.set(db.collection('public_scores').doc(doc.id), score);
    pending++;
    // Firestore caps a batch at 500 writes.
    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (!DRY_RUN && pending > 0) await batch.commit();

  console.log(DRY_RUN ? 'Dry run complete.' : 'Backfill complete.');
  console.log('  public_scores written:', written);
  console.log('  users skipped (not a ranked role):', skipped);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
