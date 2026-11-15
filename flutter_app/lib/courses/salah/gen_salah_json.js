// Builds flutter_app/assets/data/courses/salah-journey.json from the extracted
// Salah manual text. Every religious/source field is copied verbatim from the
// text; only the answer-option split and short question stems are authored.
// usage: node gen_salah.js <source.txt> <out.json>
const fs = require('fs');
const assert = require('assert');
const [srcPath, outPath] = process.argv.slice(2);
const lines = fs.readFileSync(srcPath, 'utf8').replace(/\r/g, '').split('\n');
const DOC = 'Imaan_Akhlaq_My_Salah_Journey_COMPLETE_Curriculum_and_Developer_Manual.docx';

function idx(text, start = 0) {
  for (let i = start; i < lines.length; i++) if (lines[i] === text) return i;
  throw new Error('missing line: ' + text);
}
function after(prefix, start, stop) {
  for (let i = start; i < (stop ?? lines.length); i++)
    if (lines[i].startsWith(prefix)) return lines[i].slice(prefix.length).trim();
  throw new Error('missing prefix: ' + prefix + ' @' + start);
}
const quoted = (s) => s.match(/“(.+)”/)[1];
const quotedLazy = (s) => s.match(/“(.+?)”/)[1];
function flatTable(startLine, ncols, nrows, from = 0) {
  const s = idx(startLine, from);
  const rows = [];
  for (let r = 0; r < nrows; r++) rows.push(lines.slice(s + r * ncols, s + (r + 1) * ncols));
  return rows;
}

// ---------- source register (sections 22 and H) ----------
const urls = {};
for (const l of lines) {
  const m = l.match(/^(.+?) — (https?:\/\/\S+)$/);
  if (m) urls[m[1].trim()] = m[2];
}
const h = idx('H. Evidence and disclaimer register (editor-ready)');
for (let i = h; i < lines.length - 2; i++) {
  if (lines[i + 2].startsWith('https://') && !lines[i].startsWith('http')) {
    const k = lines[i].trim();
    if (!(k in urls)) urls[k] = lines[i + 2].trim();
  }
}

// ---------- worlds ----------
const worldHeads = {
  ready: '6. Foundational guidance: readiness for Salah',
  fard: '7. World One — Five Daily Fard Prayers',
  sunnah: '8. World Two — Sunnah and Rawātib Prayers',
  witr: '9. World Three — Witr Salah',
  tahajjud: '10. World Four — Tahajjud / Qiyam al-Layl',
  janazah: '11. World Five — Salat al-Janazah',
  istisqa: '12. World Six — Salat al-Istisqa (Prayer for Rain)',
  tasbih: '13. World Seven — Salat al-Tasbih (Advanced Optional)',
};
const part2 = {
  ready: '00 • Getting Ready',
  fard: '01 • Five Daily Fard Prayers',
  sunnah: '02 • Sunnah and Rawātib',
  witr: '03 • Witr',
  tahajjud: '04 • Tahajjud',
  janazah: '05 • Janazah',
  istisqa: '06 • Istisqa',
  tasbih: '07 • Salat al-Tasbih — Optional',
};
const order = Object.keys(worldHeads);
const worlds = order.map((wid, n) => {
  const s = idx(worldHeads[wid]);
  const e = n + 1 < order.length ? idx(worldHeads[order[n + 1]]) : idx('14. A calm, non-sectarian Raf‘ al-Yadayn explanation');
  const [code, title] = part2[wid].split(' • ');
  const w = { id: wid, code, title };
  if (wid === 'ready') {
    w.guidance = lines.slice(s + 1, e);
  } else {
    w.discover = after('What children discover:  ', s, e);
    w.evidence = after('Fazīlah / evidence:  ', s, e);
    w.outcome = after('Learning outcome:  ', s, e);
    const f = idx('Step-by-step teaching flow', s);
    const im = idx('Interactive missions', s);
    w.teachingFlow = lines.slice(f + 1, im);
    w.recitationsNote = after('Recitations to connect:  ', s, e);
    w.adultNote = after('SCHOLARLY / DEVELOPER NOTE  ', s, e);
  }
  const p2 = idx(part2[wid], idx('A. Thirty complete child-facing lessons'));
  w.opening = quoted(after('World opening narrator: ', p2, p2 + 2));
  w.optional = wid === 'tasbih';
  return w;
});

// ---------- missions ----------
const aStart = idx('A. Thirty complete child-facing lessons');
const aEnd = idx('B. Full practical Salah walkthroughs');
const heads = [];
for (let i = aStart; i < aEnd; i++) if (/^[PFSWTJIB]\d — /.test(lines[i])) heads.push(i);
const worldOf = { P: 'ready', F: 'fard', S: 'sunnah', W: 'witr', T: 'tahajjud', J: 'janazah', I: 'istisqa', B: 'tasbih' };

// Authored: question stem + options split from the source question. Option
// wording is the source's own, except the distractors listed below.
const checks = {
  P1: ['Choose the better plan:', ['Ignore every prayer until bedtime', 'Pause at prayer time with family guidance and return to the activity afterward'], 1],
  P2: ['Which Salah comes just after sunset?', ['Fajr', 'Maghrib', 'Isha'], 1],
  P3: ['Which is the best answer?', ['Rush with splashes', 'Follow the teacher’s Wudu steps calmly', 'Use as much water as possible'], 1],
  P4: ['Which preparation is appropriate?', ['Clear a clean place', 'Mock someone who sits', 'Turn away from the Qiblah on purpose'], 0],
  P5: ['Which card matches the bowing position?', ['Ruku', 'Sujud', 'Taslim'], 0],
  F1: ['Put the first two steps in order:', ['Taslim then Takbir', 'Intention in heart then opening Takbir'], 1],
  F2: ['When learning Al-Fatihah, what should we do?', ['Make up a word if forgotten', 'Pause and learn the exact word with a teacher'], 1],
  F3: ['Arrange: bow → stand up calmly → first prostration. What follows Ruku directly?', ['Stand up calmly', 'First prostration'], 0],
  F4: ['Fill the gap: Sujud 1 → ___ → Sujud 2.', ['Sit between them', 'Ruku'], 0],
  F5: ['Which comes before closing Taslim in the two-rak’ah guided path?', ['Tashahhud', 'A new Ruku'], 0],
  F6: ['At the end of the first rak’ah of a two-rak’ah Salah, what do we do?', ['Finish with Taslim', 'Stand for rak’ah two'], 1],
  F7: ['Which Fard Salah has three rak’ahs?', ['Maghrib', 'Fajr', 'Dhuhr'], 0],
  F8: ['If someone is praying nearby, what is kind?', ['Make a loud joke', 'Lower your voice and give them space'], 1],
  S1: ['What should come first when time is limited?', ['Making sure an obligatory prayer is attended to', 'Treating optional prayer as a replacement'], 0],
  S2: ['Which Fajr prayer comes first in the usual home schedule?', ['Two Sunnah rak’ahs', 'The two Fard rak’ahs'], 0],
  S3: ['In the cited twelve-rak’ah plan, how many are placed after Maghrib?', ['Two', 'Six'], 0],
  S4: ['Which habit is wiser?', ['One carefully learned Sunnah with family support', 'Many rushed exercises just to earn points'], 0],
  W1: ['Is Witr associated with…', ['The end of night worship', 'The middle of Dhuhr Fard'], 0],
  W2: ['Which is safe for the app?', ['Mix random steps from both diagrams', 'Choose one complete approved method'], 1],
  W3: ['What is the opening meaning of Allahumma ihdini?', ['“O Allah, guide me”', '“I am already perfect”'], 0],
  T1: ['Which is better?', ['Force a tired child awake every night', 'Let families choose gentle, suitable practice'], 1],
  T2: ['A simple night-prayer practice can begin with how many rak’ahs?', ['Two', 'Eleven compulsory'], 0],
  T3: ['The long night Du’a teaches praise and trust. What should we do?', ['Preserve every Arabic word', 'Simplify the Arabic itself'], 0],
  J1: ['If a classmate is grieving, what do we do?', ['Joke about it', 'Offer kind, quiet support'], 1],
  J2: ['Which movement does not belong to the Janazah prayer?', ['Ruku', 'Standing'], 0],
  J3: ['The opening words ask Allah for…', ['Forgiveness and mercy', 'Worldly prizes'], 0],
  I1: ['During a drought, what can we do?', ['Pray and conserve water', 'Waste water because rain will come'], 0],
  I2: ['Which statement is correct?', ['“The app makes rain happen”', '“We ask Allah for rain and care for water responsibly.”'], 1],
  B1: ['Which is true?', ['“Every scholar agrees on Salat al-Tasbih”', '“Scholars differ about its report and recommendation.”'], 1],
  B2: ['Calculate the total in one rak’ah: 15 + 10 + 10 + 10 + 10 + 10 + 10.', ['65', '75', '300'], 1],
};
const authoredDistractors = { F4: ['Ruku'], B2: ['65', '300'] };
const recitsFor = {
  P5: ['R01', 'R12'], F1: ['R01', 'R02'], F2: ['FATIHA'],
  F3: ['R03', 'R04', 'R05'], F4: ['R06', 'R07'], F5: ['R08', 'R09', 'R12'],
  F6: ['R10', 'R11'], F7: ['R13'], W3: ['R14'], T3: ['R15'],
  J3: ['R16'], I2: ['R17'], B1: ['R18'],
};

const b2 = idx('B2. Complete two-rak’ah guided model — Fajr Fard or a two-rak’ah Sunnah');
const b5 = idx('B5. Sunnah/Rawātib teaching paths');
const b6 = idx('B6. Witr: two complete alternatives that must never be blended');
const b8 = idx('B8. Janazah: a sober, supervised learning sequence');
const b10 = idx('B10. Salat al-Tasbih: optional report-based advanced guide');
const tables = {
  F6: { title: 'Two-rak’ah guided model', rows: flatTable('State', 3, 9, b2), note: lines[b2 + 28], source: 'Part II B2' },
  F7: { title: 'Fard rak’ahs', rows: flatTable('Fard prayer', 3, 6), source: 'Part I §7' },
  S3: { title: 'Sunnah/Rawātib teaching paths', rows: flatTable('Type', 3, 6, b5), note: lines[b5 + 19], source: 'Part II B5' },
  W2: { title: 'Witr: two complete alternatives', rows: flatTable('Feature', 3, 7, b6), note: lines[b6 + 22], source: 'Part II B6' },
  J2: { title: 'Janazah learning sequence', rows: flatTable('After Takbir', 3, 5, b8), note: lines[b8 + 16], source: 'Part II B8' },
  B2: { title: 'Reported counts (Abu Dawud 1297)', rows: flatTable('Position', 3, 9, b10), note: lines[b10 + 1], source: 'Part II B10' },
};
assert(tables.F6.note.startsWith('Child-facing narration:'), tables.F6.note);
assert(tables.S3.note.startsWith('Narrator: “The Fard prayers'), tables.S3.note);
assert(tables.W2.note.startsWith('Default wording notice:'), tables.W2.note);
assert(tables.J2.note.startsWith('No Ruku or Sujud'), tables.J2.note);
assert(tables.B2.note.startsWith('Prominent notice:'), tables.B2.note);
assert.deepStrictEqual(tables.F7.rows.at(-1), ['Isha', '4', 'Same four-rak’ah structure']);
assert.deepStrictEqual(tables.B2.rows.at(-1), ['Four rak’ahs total', '75 × 4', '300']);
assert.strictEqual(tables.F6.rows.at(-1)[0], 'Finish');
assert.strictEqual(tables.S3.rows.at(-1)[0], 'Additional Nafl');
assert.strictEqual(tables.W2.rows.at(-1)[0], 'Legal status');
assert.strictEqual(tables.J2.rows.at(-1)[0], 'Fourth');

const missions = heads.map((i, n) => {
  const end = n + 1 < heads.length ? heads[n + 1] : aEnd;
  const [id, title] = lines[i].split(' — ');
  const [question, options, correct] = checks[id];
  const m = {
    id, world: worldOf[id[0]], title,
    scene: after('Scene & dialogue:  ', i, end),
    learn: after('What the child learns:  ', i, end),
    check: {
      sourceQuestion: after('Interactive knowledge check:  ', i, end),
      question, options, correct,
      sourceCorrect: after('Correct response:  ', i, end),
      feedback: after('Feedback spoken by Imaan or Akhlaq:  ', i, end),
      authoredDistractors: authoredDistractors[id] ?? [],
    },
    action: after('One daily action:  ', i, end),
    evidence: after('Evidence anchor:  ', i, end),
    guardrail: after('Editorial and Fiqh guardrail:  ', i, end),
    recitations: recitsFor[id] ?? [],
  };
  if (tables[id]) m.table = tables[id];
  return m;
});
assert.strictEqual(missions.length, 30);

const tryAgain = quotedLazy(after('Try-again message:  ', heads[0]));

// ---------- recitations ----------
const recitations = [];
for (let k = 1; k <= 18; k++) {
  const rid = 'R' + String(k).padStart(2, '0');
  const s = lines.findIndex((l) => l.startsWith(rid + ' • '));
  const c = lines.findIndex((l, i) => i > s && l.startsWith(rid + ' — '));
  recitations.push({
    id: rid,
    title: lines[s].split(' • ')[1],
    usedWhere: after('Where used:  ', s, s + 3),
    arabic: lines[s + 2],
    meaning: after('Meaning (child-friendly):  ', s, s + 6),
    meaningChild: after('Child-friendly English meaning:  ', c, c + 3),
    meaningUrdu: lines[c + 2],
    memorization: after('Memorization plan:  ', c, c + 5),
    source: after('Source:  ', s, s + 6),
    editorialNote: after('Editorial note:  ', s, s + 7),
    quran: false,
  });
}
const f = idx('C1. Surah al-Fatihah — core linked Qur’an asset');
recitations.push({
  id: 'FATIHA',
  title: 'Surah al-Fatihah',
  usedWhere: null,
  arabic: lines[f + 1],
  meaning: lines[f + 3].replace('Child-friendly meaning: ', ''),
  meaningChild: null,
  meaningUrdu: lines[f + 4],
  memorization: lines[f + 2],
  source: 'Qur’an 1:1–7',
  editorialNote: lines[f + 5],
  quran: true,
});
for (const r of recitations) {
  assert(/[\u0600-\u06FF]/.test(r.arabic), r.id + ' arabic');
  assert(/[\u0600-\u06FF]/.test(r.meaningUrdu), r.id + ' urdu');
}

// Source links only where the manual's own register lists one.
const aliases = { 'Sunan Abi Dawud 1297': 'Abu Dawud 1297' };
function linksFor(text) {
  const out = [];
  for (const [label, url] of Object.entries(urls)) {
    const pat = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
    if (new RegExp('(?<![\\w:])' + pat + '(?![\\w\\d–])').test(text)) out.push({ label, url });
  }
  return out;
}
for (const r of recitations) {
  r.links = linksFor(r.source);
  for (const [a, k] of Object.entries(aliases)) if (r.source.includes(a)) r.links.push({ label: a, url: urls[k] });
}
for (const m of missions) m.links = linksFor(m.evidence);

// ---------- Fiqh differences ----------
const d = idx('D. Comprehensive Fiqh differences: respectful handling');
const fiqh = {
  disclaimer: quoted(lines[d + 1]),
  topics: flatTable('Raf‘ al-Yadayn', 3, 9, d).map(([topic, difference, rule]) => ({ topic, difference, rule })),
  parentNote: after('Teacher-facing parent note: ', d),
  noProfile: lines[idx('D1. Full profile rule specification') + 2],
  rafChild: quoted(after('Child-facing disclaimer (use verbatim):  ', 0)),
  rafAdult: after('Adult source note:  ', 0),
};
assert.strictEqual(fiqh.topics.at(-1).topic, 'Tasbih');

const out = {
  version: 1,
  source: {
    document: DOC,
    section: '04-Salah',
    thread: 'imaa and Akhlaq individual section additions (3–10 Nov 2026)',
    extracted: '2026-11-14',
  },
  reviewStatus: 'PENDING',
  reviewNote: 'Draft from the content owner’s manual. Arabic, Fiqh and Urdu text still need scholarly review before release.',
  tryAgain,
  tasbihNotice: quoted(lines[b10 + 1]),
  tasbihPreNotice: quotedLazy(lines[idx(worldHeads.tasbih) + 5]),
  witrNotice: quoted(tables.W2.note),
  worlds, missions, recitations, fiqh,
  register: Object.entries(urls).map(([label, url]) => ({ label, url })),
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('missions', missions.length, 'recitations', recitations.length, 'register', Object.keys(urls).length);
