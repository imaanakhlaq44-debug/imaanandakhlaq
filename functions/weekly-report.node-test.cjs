const test = require('node:test');
const assert = require('node:assert/strict');
const {
  dayKeyIn, lastSevenDays, summariseChild, childLine, buildMessage, makeWeeklyReport,
} = require('./weekly-report');

// Sunday 25 Nov... use a fixed instant: 2026-11-29 13:00 UTC = 18:00 in Pakistan.
const NOW = new Date(Date.UTC(2026, 10, 29, 13, 0));

test('days are counted in Pakistan time', () => {
  assert.equal(dayKeyIn(new Date(Date.UTC(2026, 10, 28, 20, 0))), '2026-11-29');
  assert.deepEqual(lastSevenDays(NOW), [
    '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26',
    '2026-11-27', '2026-11-28', '2026-11-29',
  ]);
});

test('a child\'s week is summed per checklist, outside days ignored', () => {
  const week = lastSevenDays(NOW);
  const s = summariseChild({
    '2026-11-22': { salah: ['fajr'] },
    '2026-11-23': { salah: ['fajr', 'zuhr'], quran: ['recite'], confirmed: { salah: ['fajr'] } },
    '2026-11-29': { salah: ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'], deeds: ['help'], challenge: ['salam'] },
  }, week);
  assert.equal(s.totals.salah, 7);
  assert.equal(s.totals.quran, 1);
  assert.equal(s.totals.deeds, 1);
  assert.equal(s.totals.challenge, 1);
  assert.equal(s.totals.duas, 0);
  assert.equal(s.confirmedDays, 1);
});

test('the message reads well in English and Urdu', () => {
  const summary = { totals: { salah: 28, quran: 12, duas: 0, hadith: 0, deeds: 4, challenge: 5 }, confirmedDays: 3 };
  assert.equal(childLine('Ayaan', summary, 'en'), 'Ayaan: Salah 28/35 · Quran 12 · Good deeds 4 · Weekly goal 5/5');
  assert.equal(childLine('Ayaan', summary, 'ur'), 'Ayaan: نماز 28/35 · قرآن 12 · اچھے کام 4 · ہفتے کا ہدف 5/5');
  const empty = { totals: { salah: 0, quran: 0, duas: 0, hadith: 0, deeds: 0, challenge: 0 } };
  assert.match(childLine('Hira', empty, 'en'), /nothing ticked/);
  const m = buildMessage([{ name: 'Ayaan', summary }, { name: 'Hira', summary: empty }], 'ur');
  assert.equal(m.title, 'ہفتہ وار رپورٹ');
  assert.equal(m.body.split('\n').length, 2);
});

// --- Against the Firestore emulator (npm run test:functions sets the host) ---
const HAS_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;

test('families get their own children\'s report; dead devices are removed', { skip: !HAS_EMULATOR }, async () => {
  const { initializeApp, getApps } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const app = getApps().find((a) => a.name === 'weekly-test') ||
    initializeApp({ projectId: 'imaan-weekly-test' }, 'weekly-test');
  const db = getFirestore(app);
  const put = (path, data) => db.doc(path).set(data);
  await put('users/fam-1', { role: 'family', name: 'Ahmad Family' });
  await put('users/fam-2', { role: 'family', name: 'Khan Family' });
  await put('users/teacher-1', { role: 'teacher', name: 'T' });
  await put('users/kid-1', { role: 'student', name: 'Ayaan', family_uid: 'fam-1' });
  await put('users/kid-2', { role: 'student', name: 'Zainab', family_uid: 'fam-2' });
  await put('daily_checklists/kid-1/days/2026-11-29', { salah: ['fajr', 'zuhr'] });
  await put('daily_checklists/kid-2/days/2026-11-29', { salah: ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'] });
  await put('push_tokens/tok-en', { owner_uid: 'fam-1', lang: 'en' });
  await put('push_tokens/tok-ur', { owner_uid: 'fam-1', lang: 'ur' });
  await put('push_tokens/tok-dead', { owner_uid: 'fam-2', lang: 'en' });
  await put('push_tokens/tok-teacher', { owner_uid: 'teacher-1', lang: 'en' });

  const sent = [];
  const messaging = {
    async sendEachForMulticast(m) {
      sent.push(m);
      return {
        successCount: m.tokens.filter((t) => t !== 'tok-dead').length,
        responses: m.tokens.map((t) => (t === 'tok-dead'
          ? { success: false, error: { code: 'messaging/registration-token-not-registered' } }
          : { success: true })),
      };
    },
  };
  const report = makeWeeklyReport({ db, messaging });
  const totals = await report.runAll(NOW);

  assert.equal(totals.families, 2, 'the teacher is not a family');
  assert.equal(totals.sent, 2);
  assert.equal(totals.removed, 1);
  const forFam1 = sent.filter((m) => m.tokens.includes('tok-en') || m.tokens.includes('tok-ur'));
  assert.equal(forFam1.length, 2, 'one message per language');
  assert.equal(forFam1.find((m) => m.tokens.includes('tok-en')).notification.body, 'Ayaan: Salah 2/35');
  assert.match(forFam1.find((m) => m.tokens.includes('tok-ur')).notification.body, /نماز 2\/35/);
  const forFam2 = sent.find((m) => m.tokens.includes('tok-dead'));
  assert.equal(forFam2.notification.body, 'Zainab: Salah 5/35', 'never another family\'s child');
  assert.equal((await db.doc('push_tokens/tok-dead').get()).exists, false);
  assert.equal((await db.doc('push_tokens/tok-en').get()).exists, true);

  const one = await report.runOne('fam-1', NOW);
  assert.equal(one.sent, 2);
  assert.equal((await report.runOne('fam-2', NOW)).skipped, true, 'no devices left');
});
