// Native learner saves. The Admin SDK transaction is the authorization boundary;
// it handles absent documents without depending on client get permissions.
function makeSaveActivity({ db, HttpsError, catalog, now = () => new Date() }) {
  return async function saveLearnerActivity(request) {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
    const input = request.data || {};
    const uid = request.auth.uid;
    const learnerUid = typeof input.learner_uid === 'string' ? input.learner_uid : '';
    if (!learnerUid || learnerUid.includes('/') || learnerUid.length > 128) throw new HttpsError('invalid-argument', 'Invalid learner.');
    const book = catalog[input.book_id];
    const chapter = book && book.chapters && Object.values(book.chapters).find(c => c.id === input.chapter_id);
    if (!chapter) throw new HttpsError('invalid-argument', 'Unknown chapter.');
    const count = chapter.sections.reduce((sum, s) => sum + s.questions.length, 0) * 7;
    const cells = input.cells;
    const text = input.discussion_text;
    if (!Array.isArray(cells) || cells.length !== count || cells.some(c => !Number.isInteger(c) || c < 0 || c > 2) || typeof text !== 'string' || text.length > 4000 || typeof input.submit !== 'boolean') throw new HttpsError('invalid-argument', 'Invalid activity.');
    if (input.submit && !text.trim()) throw new HttpsError('invalid-argument', 'Write your reflection first.');
    const accountRef = db.collection('users').doc(uid);
    const learnerRef = db.collection('users').doc(learnerUid);
    const subRef = db.collection('activity_submissions').doc(learnerUid + '_' + chapter.id);
    const draftRef = db.collection('activity_drafts').doc('flutter_' + learnerUid + '_' + chapter.id);
    return db.runTransaction(async tx => {
      const [accountSnap, learnerSnap, subSnap, draftSnap] = await Promise.all([tx.get(accountRef), tx.get(learnerRef), tx.get(subRef), tx.get(draftRef)]);
      const account = accountSnap.data();
      const learner = learnerSnap.data();
      const owned = account && learner && (
        (account.role === 'family' && learner.role === 'student' && learner.family_uid === uid) ||
        (['student', 'individual'].includes(account.role) && learnerUid === uid)
      );
      if (!owned) throw new HttpsError('permission-denied', 'This learner does not belong to your account.');
      const sub = subSnap.data();
      if (sub && (sub.reviewStatus === 'teacher_approved' || sub.teacherApprovedAt)) throw new HttpsError('failed-precondition', 'This activity is already approved.');
      const draft = draftSnap.data();
      const prior = draft && (!sub || String(draft.updatedAt || '') > String(sub.updatedAt || '')) ? draft : sub;
      const oldCells = prior && prior.gridState && Array.isArray(prior.gridState.cells) ? prior.gridState.cells : [];
      const instant = now();
      // Existing school curriculum uses Pakistan weekdays. Never trust a
      // client clock to unlock yesterday/tomorrow or shift a school timezone.
      const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'short' }).format(instant);
      const today = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday);
      if (learner.role !== 'individual' && cells.some((c, i) => i % 7 !== today && c !== (oldCells[i] || 0))) throw new HttpsError('permission-denied', 'Only today’s actions can be changed.');
      const timestamp = instant.toISOString();
      const payload = {
        student_uid: learnerUid,
        ...(account.role === 'family' ? { family_uid: uid } : {}),
        student_name: learner.name || 'Student', school_id: learner.school_id || '',
        chapter_id: chapter.id, chapter_title: chapter.title, book_id: input.book_id,
        discussionText: text.trim(), updatedAt: timestamp,
        gridState: { cells, yes: cells.filter(c => c === 1).length, no: cells.filter(c => c === 2).length, total: count },
      };
      if (input.submit) {
        payload.submittedAt = timestamp;
        payload.activityCompletedAt = timestamp;
        payload.reviewStatus = learner.role === 'individual' ? 'self_completed' : 'pending_teacher';
        tx.set(subRef, payload, { merge: true });
        tx.delete(draftRef);
      } else {
        tx.set(draftRef, payload);
      }
      return { saved: true, submitted: input.submit, status: input.submit ? payload.reviewStatus : 'draft' };
    });
  };
}
module.exports = { makeSaveActivity };
