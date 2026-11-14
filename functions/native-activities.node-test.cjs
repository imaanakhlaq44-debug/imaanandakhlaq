const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeSaveActivity } = require('./native-activities.js');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const chapter = { id: 'b1_c1', title: 'Story', sections: [{ questions: ['Action'] }] };
function setup() {
  const records = new Map([
    ['users/family', { role: 'family' }],
    ['users/child', { role: 'student', family_uid: 'family', school_id: 'school', name: 'Ayaan' }],
    ['users/outsider', { role: 'student', family_uid: 'other', school_id: 'other' }],
    ['users/self', { role: 'individual', name: 'Self' }],
  ]);
  const db = { collection: c => ({ doc: id => c + '/' + id }), runTransaction: async fn => {
    const writes = [];
    const result = await fn({get: async ref => ({ data: () => records.get(ref) }), set: (ref, data, options) => writes.push(() => records.set(ref, options?.merge ? { ...records.get(ref), ...data } : data)), delete: ref => writes.push(() => records.delete(ref))});
    writes.forEach(write => write()); return result;
  } };
  const save = makeSaveActivity({db, HttpsError, catalog: { book1: { chapters: { chapter1: chapter } } }, now: () => new Date('2026-11-16T12:00:00Z')});
  const request = { auth: { uid: 'family' }, data: { learner_uid: 'child', book_id: 'book1', chapter_id: 'b1_c1', discussion_text: 'I learned something.', cells: [1,0,0,0,0,0,0], submit: false } };
  return { records, save, request };
}
test('unauthenticated callers cannot save', async () => { const {save, request} = setup(); delete request.auth; await assert.rejects(save(request), {code: 'unauthenticated'}); });
test('family cannot submit work for another child', async () => { const {save, request, records} = setup(); request.data.learner_uid = 'outsider'; await assert.rejects(save(request), {code: 'permission-denied'}); assert.equal(records.has('activity_submissions/outsider_b1_c1'), false); });
test('draft save creates no teacher-facing submission', async () => { const {save, request, records} = setup(); await save(request); assert.equal(records.has('activity_submissions/child_b1_c1'), false); assert.equal(records.get('activity_drafts/flutter_child_b1_c1').student_uid, 'child'); });
test('submit writes authoritative ownership and clears draft atomically', async () => { const {save, request, records} = setup(); await save(request); request.data.submit = true; request.data.school_id = 'forged'; request.data.teacherApprovedAt = 'forged'; await save(request); const sub = records.get('activity_submissions/child_b1_c1'); assert.equal(sub.school_id, 'school'); assert.equal(sub.family_uid, 'family'); assert.equal(sub.reviewStatus, 'pending_teacher'); assert.equal(sub.teacherApprovedAt, undefined); assert.equal(sub.points, undefined); assert.equal(records.has('activity_drafts/flutter_child_b1_c1'), false); });
test('server refuses future-day edits despite client clock', async () => { const {save, request} = setup(); request.data.cells[1] = 1; await assert.rejects(save(request), {code: 'permission-denied'}); });
test('prior-day recorded values survive a new save', async () => { const {save, request, records} = setup(); records.set('activity_submissions/child_b1_c1', { gridState: {cells: [0,0,0,0,0,0,1]}, updatedAt: '2026-11-15T10:00:00Z' }); request.data.cells[6] = 1; await save(request); assert.equal(records.get('activity_drafts/flutter_child_b1_c1').gridState.cells[6], 1); });
test('teacher-approved work cannot be overwritten or drafted', async () => { const {save, request, records} = setup(); records.set('activity_submissions/child_b1_c1', {reviewStatus: 'teacher_approved'}); await assert.rejects(save(request), {code: 'failed-precondition'}); assert.equal(records.has('activity_drafts/flutter_child_b1_c1'), false); });
test('individuals may practise every day without minting teacher approval', async () => { const {save, request, records} = setup(); request.auth.uid = 'self'; request.data.learner_uid = 'self'; request.data.cells.fill(1); request.data.submit = true; await save(request); const sub = records.get('activity_submissions/self_b1_c1'); assert.equal(sub.reviewStatus, 'self_completed'); assert.equal(sub.teacherApprovedAt, undefined); assert.equal(sub.family_uid, undefined); });
test('invalid grids and oversized reflections cannot be persisted', async () => { const {save, request} = setup(); request.data.cells = [9]; await assert.rejects(save(request), {code: 'invalid-argument'}); request.data.cells = [0,0,0,0,0,0,0]; request.data.discussion_text = 'x'.repeat(4001); await assert.rejects(save(request), {code: 'invalid-argument'}); });

test('native backend catalogue stays identical to the existing web curriculum', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/activities.json'), 'utf8'));
  const bundled = JSON.parse(fs.readFileSync(path.join(__dirname, 'native-catalog.json'), 'utf8'));
  assert.deepEqual(bundled, source);
});
