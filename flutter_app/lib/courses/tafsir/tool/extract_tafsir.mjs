// Regenerates assets/data/courses/tafsir-*.json from the extracted text of
// the Tafsir Through Stories DOCX volumes (email curriculum, Nov 2026).
//
//   node lib/courses/tafsir/tool/extract_tafsir.mjs <extracted/05-Tafsir dir>
//
// Run from flutter_app/. Every text field is copied verbatim from the source
// line it came from; nothing is rewritten. Lines the parser does not
// recognise are reported so a human can check them.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: extract_tafsir.mjs <extracted/05-Tafsir directory>');
  process.exit(1);
}
const out = path.join('assets', 'data', 'courses');

// World titles as listed in the developer manual (section 01 learning scope).
const volumes = [
  ['01', 'Surah_Al_Hujurat', 'Surah Al-Hujurat: Good Character'],
  ['02', 'Surah_Al_Kahf', 'Surah Al-Kahf: Faith, Choices and Wisdom'],
  ['03', 'Surah_Luqman', 'Surah Luqman: Wisdom and Manners'],
  ['04', 'The_World_of_Gratitude', 'The World of Gratitude'],
  ['05', 'The_World_of_Honesty', 'The World of Honesty'],
  ['06', 'The_World_of_Compassion', 'The World of Compassion'],
  ['07', 'The_World_of_Time_and_Responsibility', 'The World of Time and Responsibility'],
];

const arabic = /[؀-ۿ]/;
const isArabicLine = (s) => {
  const letters = s.replace(/[\s\d﴿﴾()]/g, '');
  const ar = (letters.match(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) || []).length;
  return letters.length > 0 && ar / letters.length > 0.8;
};
// Lines that end the mission list (appendices / developer sections).
const terminator = /^((Volume|Surah|Thematic Final|Final) Synthesis|Developer edition|Final Synthesis|Developer Implementation|Closing reflection|Complete Arabic|ARABIC APPENDIX|Appendix|World synthesis|Family circle|Five commitments|End-of-world)/i;

const rules = [
  [/^(?:Today’s learning aim:|Learning aim|Learning objective)\s+(.*)$/, 'aim', 'inline'],
  [/^(?:THE QUR’ANIC VERSES|QUR’ANIC FOCUS|READ AND LISTEN)\b/, 'ayahs', 'mode'],
  [/^UNDERSTAND • CHILD-FRIENDLY MEANING/, 'meaning', 'mode'],
  [/^(?:UNDERSTAND •|NARRATIVE TAFSIR)/, 'tafsir', 'mode'],
  [/^(?:IMAAN & AKHLAQ STORY|IMAAN & AKHLAQ • FICTIONAL|APPLY • CONTEMPORARY|MODERN FICTION)/, 'story', 'mode'],
  [/^(?:CHOOSE WISELY|DECIDE •)/, 'decide', 'mode'],
  [/^(?:TODAY’S ONE|ONE REAL-WORLD ACTION)/, 'action', 'mode'],
  [/^A MOMENT TO REFLECT$/, 'reflection', 'mode'],
  [/^A moment to reflect\s+(.*)$/, 'reflection', 'inline'],
  [/^INTERACTIVE DEVELOPER ACTIVITY$/, 'activity', 'mode'],
  [/^(?:Interactive mini-game|Mini-game)\s+(.*)$/, 'activity', 'inline'],
  [/^WORDS TO REMEMBER$/, 'vocabulary', 'mode'],
  [/^(?:Words to remember|Qur’anic vocabulary|Vocabulary)\s+(.*)$/, 'vocabulary', 'inline'],
  [/^Parent \/ teacher [^:]*?:?\s{2,}(.*)$/, 'careNote', 'inline'],
  [/^SOURCE PATH:\s*(.*)$/, 'sourcePath', 'inline'],
  [/^(?:Optional understanding check|Review question|One-minute review)\s+(.*)$/, 'review', 'inline'],
  [/^(?:Story continuity|Next journey clue)\s+(.*)$/, 'next', 'inline'],
  [/^(?:NEXT MISSION\s+→\s+|NEXT:\s*)(.*)$/, 'next', 'inline'],
  [/^OPTIONAL MEMORIZATION/, 'memo', 'mode'],
];

const report = [];
const worlds = [];

for (const [num, slug, worldTitle] of volumes) {
  const file = `Imaan_Akhlaq_Tafsir_Stories_Volume_${num}_${slug}.txt`;
  const lines = fs
    .readFileSync(path.join(dir, file), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const missions = [];
  let m = null;
  let mode = null;
  let pendingRef = null;
  let headerNext = false;
  let ended = false;
  const add = (field, text) => {
    m[field] = m[field] ? `${m[field]}\n\n${text}` : text;
  };
  for (const line of lines) {
    if (ended) break;
    const head = /^MISSION (\d+)\s*\|\s*(.+)$/.exec(line);
    if (head) {
      m = {
        id: `${num}-${head[1].padStart(2, '0')}`,
        number: Number(head[1]),
        title: head[2].trim(),
        ayahs: [],
        options: [],
      };
      missions.push(m);
      mode = null;
      headerNext = true;
      continue;
    }
    if (!m) continue;
    if (terminator.test(line) && missions.length > 0) {
      ended = true;
      break;
    }
    if (headerNext) {
      m.anchor = line;
      headerNext = false;
      continue;
    }
    let matched = false;
    for (const [re, field, kind] of rules) {
      const r = re.exec(line);
      if (!r) continue;
      matched = true;
      if (kind === 'mode') {
        mode = field;
      } else {
        mode = null;
        add(field, r[1].trim());
      }
      break;
    }
    if (matched) continue;
    switch (mode) {
      case 'ayahs': {
        const ref = /^(?:Surah (\d+) · Ayah (\d+)|Qur’an (\d+:\d+))$/.exec(line);
        const mean = /^(\d+:\d+)\s+(.*)$/.exec(line);
        if (ref) {
          pendingRef = ref[3] ?? `${ref[1]}:${ref[2]}`;
        } else if (isArabicLine(line)) {
          m.ayahs.push({ ref: pendingRef, arabic: line });
          pendingRef = null;
        } else if (mean) {
          const target = [...m.ayahs].reverse().find((a) => !a.meaning);
          if (target) {
            target.ref ??= mean[1];
            target.meaning = mean[2].trim();
            if (target.ref !== mean[1]) report.push(`${m.id}: ref ${target.ref} vs meaning ${mean[1]}`);
          } else report.push(`${m.id}: meaning without ayah: ${line.slice(0, 80)}`);
        } else {
          add('ayahNote', line);
        }
        break;
      }
      case 'decide': {
        const opt = /^([ABC])\.\s+(.*)$/.exec(line);
        const key = /^(?:Correct choice:?|Developer answer key|Answer key and encouraging feedback)\s+(?:Option\s+)?([ABC])\b[.\s—–-]*(.*)$/.exec(line);
        if (opt) m.options.push(opt[2].trim());
        else if (key) {
          m.correct = 'ABC'.indexOf(key[1]);
          m.feedback = key[2].trim();
        } else if (!m.question) m.question = line;
        else report.push(`${m.id}: extra decide line: ${line.slice(0, 80)}`);
        break;
      }
      case 'meaning':
      case 'tafsir':
      case 'story':
      case 'action':
      case 'reflection':
      case 'activity':
      case 'vocabulary':
        if (['action', 'reflection', 'activity', 'vocabulary'].includes(mode) && m[mode]) {
          report.push(`${m.id}: extra ${mode} line: ${line.slice(0, 80)}`);
        }
        add(mode, line);
        break;
      case 'memo':
        add('memorization', line);
        break;
      default:
        report.push(`${m.id}: unplaced line: ${line.slice(0, 100)}`);
    }
  }
  for (const x of missions) {
    for (const f of ['anchor', 'aim', 'tafsir', 'story', 'question', 'feedback', 'action', 'reflection']) {
      if (!x[f]) report.push(`${x.id}: missing ${f}`);
    }
    if (x.options.length !== 3 || x.correct == null || x.correct < 0) report.push(`${x.id}: bad decision`);
    if (x.ayahs.length === 0) report.push(`${x.id}: no ayahs`);
    for (const a of x.ayahs) if (!a.ref) report.push(`${x.id}: ayah without ref`);
    const url = /https?:\/\/\S+/.exec(x.sourcePath ?? '');
    x.sourceUrl = url ? url[0] : null;
    x.sourceDocument = file.replace(/\.txt$/, '.docx');
    delete x.activity; // developer-facing game spec, not learner text
  }
  const data = {
    _source: {
      document: file.replace(/\.txt$/, '.docx'),
      thread: 'imaa and Akhlaq individual section additions (3–10 Nov 2026)',
      extracted: 'imaan-email-content-2026-11-14/extracted/05-Tafsir',
      review: 'Working edition. Arabic, meanings and Tafsir need qualified scholarly review before release.',
    },
    world: Number(num),
    title: worldTitle,
    missions,
  };
  fs.writeFileSync(path.join(out, `tafsir-world-${num}.json`), JSON.stringify(data, null, 2) + '\n');
  worlds.push(`${num}: ${missions.length} missions`);
}
console.log(worlds.join('\n'));
console.log(report.length ? report.join('\n') : 'no parser warnings');
