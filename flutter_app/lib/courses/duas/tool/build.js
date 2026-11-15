// Builds flutter_app/assets/data/courses/duas-volume-NN.json from the ten
// Zad al-Qulub Junior DOCX files. All religious text is copied verbatim
// from the DOCX paragraphs; this script only splits it into fields.
// Usage: node build.js <dir-with-document-xml> <out-dir>
const fs = require('fs');
const path = require('path');
const { paragraphs } = require('./paras.js');

const [, , inDir, outDir] = process.argv;
const norm = (s) => s.replace(/[ \t ]+/g, ' ').trim();
const AR = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;
const URDU_ONLY = /[ھہےںٹڈڑگکی۔]/;
const HARAKAT = /[ً-ْ]/g;
const isArabicScript = (s) => AR.test(s) && !LATIN.test(s.replace(/https?:\S+/g, ''));
const isUrdu = (s) => URDU_ONLY.test(s) && (s.match(HARAKAT) || []).length < 4;
const FIELD = /^([^:\n]{2,90}?):\s{2,}([\s\S]*)$/;
const MAIN = {
  'STORY TIME • IMAAN & AKHLAQ': 'story',
  'UNDERSTAND THE WORDS': 'understand',
  'MEMORIZE WITH ME': 'memorize',
  'TODAY’S ONE ACTION': 'action',
  'INTERACTIVE APP MISSION': 'mission',
  'A MOMENT TO REFLECT': 'reflect',
};
const isHeading = (s) => {
  const n = norm(s);
  return n.length >= 6 && !/[a-z]/.test(n) && LATIN.test(n) && !AR.test(n) && !/^STEP \d+$/.test(n) && !/^VOLUME \d+/.test(n);
};

function classify(raw, prev) {
  const text = raw.trim();
  if (/^https?:\/\/\S+$/.test(text)) return { type: 'link', text };
  const f = text.match(FIELD);
  if (f && !AR.test(f[1])) return { type: 'field', label: norm(f[1]), text: f[2].trim() };
  if (isArabicScript(text)) return { type: isUrdu(text) ? 'urdu' : 'arabic', text };
  if (prev && prev.type === 'arabic' && /[āīūḥṣḍṭẓʿĀĪŪḤṢ]/.test(text) && text.length < 600) return { type: 'translit', text };
  return { type: 'text', text };
}

function blocks(lines) {
  const out = [];
  for (const l of lines) out.push(classify(l, out[out.length - 1]));
  return out;
}

function chunksFrom(memLines, arabic) {
  const chunks = [];
  for (let i = 0; i < memLines.length; i++) {
    const l = memLines[i].trim();
    if (/^STEP \d+$/.test(norm(l)) && memLines[i + 1]) {
      chunks.push(memLines[++i].trim());
    } else if (isArabicScript(l) && l.includes('|')) {
      chunks.push(...l.split('|').map((c) => c.trim()).filter(Boolean));
    }
  }
  if (!chunks.length) {
    const m = memLines.join('\n').match(/chunks?:\s*([\s\S]*?)\.\s+(?:Repeat|Then|Listen)/);
    if (m && AR.test(m[1])) chunks.push(...m[1].split(/\s+\/\s+/).map((c) => c.trim()).filter(Boolean));
  }
  return chunks;
}

const squash = (s) => s.replace(/[\s۝؛،.,;:!?()\[\]«»"“”'’\-]/g, '').replace(/[٠-٩]/g, '');

function parseLesson(lines, warnings) {
  const head = norm(lines[0]).match(/^Lesson (\d+) \| (.+)$/);
  const number = +head[1];
  const lesson = { id: `dua-${String(number).padStart(3, '0')}`, number, title: head[2].trim() };
  let i = 1;
  if (/^VOLUME \d+/.test(norm(lines[1]))) { lesson.tagline = norm(lines[1]); i = 2; }
  const sections = [];
  let cur = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (isHeading(l)) { cur = { heading: norm(l), lines: [] }; sections.push(cur); }
    else if (cur) cur.lines.push(l);
    else warnings.push(`${lesson.id}: stray line ${l.slice(0, 60)}`);
  }
  const r = sections.findIndex((s) => MAIN[s.heading] === 'reflect');
  if (r >= 0) sections.length = r + 1; // later headings are volume notes
  const words = sections.find((s) => s.heading.startsWith('WORDS TO REMEMBER'));
  if (!words) throw new Error(`${lesson.id}: no WORDS section`);
  lesson.wordsHeading = words.heading;
  lesson.words = blocks(words.lines);
  const arabic = lesson.words.find((b) => b.type === 'arabic');
  if (!arabic) throw new Error(`${lesson.id}: no Arabic`);
  lesson.arabic = arabic.text;
  const tr = lesson.words.find((b) => b.type === 'translit');
  if (tr) lesson.transliteration = tr.text;
  const en = lesson.words.find((b) => b.type === 'field' && b.label === 'English meaning');
  if (!en) throw new Error(`${lesson.id}: no English meaning`);
  lesson.english = en.text;
  const ur = lesson.words.find((b) => b.type === 'urdu');
  if (ur) lesson.urdu = ur.text; else warnings.push(`${lesson.id}: no Urdu meaning`);
  const when = lesson.words.find((b) => b.type === 'field' && /^When to/.test(b.label));
  if (when) lesson.occasion = when.text; else warnings.push(`${lesson.id}: no occasion`);
  const srcIdx = lesson.words.findIndex((b) => b.type === 'field' && /source|evidence/i.test(b.label));
  if (srcIdx < 0) throw new Error(`${lesson.id}: no source`);
  lesson.source = lesson.words[srcIdx].text;
  const link = lesson.words.slice(srcIdx).find((b) => b.type === 'link');
  if (link) lesson.sourceUrl = link.text; else warnings.push(`${lesson.id}: no source URL`);

  lesson.extras = sections
    .filter((s) => s !== words && !MAIN[s.heading])
    .map((s) => ({ heading: s.heading, blocks: blocks(s.lines) }));
  const get = (k) => sections.find((s) => MAIN[s.heading] === k);
  for (const k of Object.values(MAIN)) if (!get(k)) throw new Error(`${lesson.id}: no ${k}`);
  lesson.story = get('story').lines.map((l) => l.trim());
  lesson.understand = get('understand').lines.map((l) => l.trim());
  const mem = get('memorize').lines;
  const step = mem.map((l) => l.trim().match(FIELD)).find((m) => m && /step/i.test(m[1]));
  lesson.memorizeSteps = step ? step[2].trim() : mem[0].trim();
  lesson.chunks = chunksFrom(mem, lesson.arabic);
  lesson.chunksRebuildArabic = lesson.chunks.length > 1 && squash(lesson.chunks.join('')) === squash(lesson.arabic);
  if (!lesson.chunks.length) warnings.push(`${lesson.id}: no chunks`);
  else if (!lesson.chunksRebuildArabic) warnings.push(`${lesson.id}: chunks (${lesson.chunks.length}) do not rebuild the Arabic`);
  lesson.action = get('action').lines.map((l) => l.trim()).join('\n');
  const mission = { text: [] };
  for (const l of get('mission').lines) {
    const m = l.trim().match(FIELD);
    if (m && m[1] === 'Gentle feedback') mission.feedback = m[2].trim();
    else if (m && !mission.title) { mission.title = norm(m[1]); mission.text.push(m[2].trim()); }
    else mission.text.push(l.trim());
  }
  mission.text = mission.text.join('\n');
  lesson.mission = mission;
  const refl = get('reflect').lines;
  lesson.reflect = refl[0].trim();
  for (const l of refl.slice(1)) {
    const m = l.trim().match(FIELD);
    if (m && /^Parent/.test(m[1])) lesson.guidance = { label: norm(m[1]), text: m[2].trim() };
    else if (/^Editorial/.test(l.trim())) lesson.editorialNote = l.trim().replace(/^Editorial\/source note:\s*/, '');
    else break; // end of lesson; anything after belongs to the volume notes
  }
  return lesson;
}

const files = fs.readdirSync(inDir).filter((f) => f.endsWith('.xml')).sort();
const report = [];
for (const file of files) {
  const ps = paragraphs(fs.readFileSync(path.join(inDir, file), 'utf8'));
  const warnings = [];
  const vol = +file.match(/Volume_(\d+)/)[1];
  const titleLine = ps.find((p) => /^Volume \d+ —/.test(norm(p)));
  const intro = ps[ps.indexOf(titleLine) + 1];
  const starts = ps.map((p, i) => (/^Lesson \d+ +\|/.test(norm(p)) ? i : -1)).filter((i) => i >= 0);
  const lessons = starts.map((s, k) => {
    let end = starts[k + 1] ?? ps.length;
    return parseLesson(ps.slice(s, end), warnings);
  });
  const last = lessons[lessons.length - 1];
  const doc = {
    volume: vol,
    title: norm(titleLine).replace(/^Volume \d+ — /, ''),
    intro: intro.trim(),
    sourceDocument: file.replace(/\.xml$/, '.docx'),
    reviewStatus: 'Working curriculum text copied verbatim from the supplied DOCX. Qualified scholarly, Arabic, Urdu and pronunciation review is required before release.',
    lessons,
  };
  fs.writeFileSync(path.join(outDir, `duas-volume-${String(vol).padStart(2, '0')}.json`), JSON.stringify(doc, null, 1) + '\n');
  report.push(`Volume ${vol}: ${lessons.length} lessons (${lessons[0].number}–${last.number}) ${doc.title}`);
  report.push(...warnings.map((w) => '  ' + w));
}
console.log(report.join('\n'));
