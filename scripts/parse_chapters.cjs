// Parse _chapters_content.txt into structured chapters JSON
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '_chapters_content.txt');
const OUT = path.join(__dirname, '..', 'imaan_hostinger', 'kidba_assets', 'data', 'chapters_data.json');

const raw = fs.readFileSync(SRC, 'utf8').replace(/\r/g, '');
const lines = raw.split('\n');

// Identify value sections by markers
const VALUE_PATTERNS = [
  { name: 'HONESTY',         arabic: 'SIDQ',     match: /^HONESTY\s*\(SIDQ\)/i,                     color: '#D63678', emoji: '🌟' },
  { name: 'COMPASSION',      arabic: 'RAHMAH',   match: /^\d+\.\s*COMPASSION\s*\(RAHMAH\)/i,        color: '#E08020', emoji: '💗' },
  { name: 'FAIRNESS',        arabic: 'ADL',      match: /^🌟\s*\d+\.\s*FAIRNESS\s*\(ADL\)/i,        color: '#16a34a', emoji: '⚖️' },
  { name: 'RESPONSIBILITY',  arabic: 'AMANAH',   match: /^🌟\s*\d+\.\s*RESPONSIBILITY\s*\(AMANAH\)/i,color: '#1E2D5A', emoji: '🛡️' },
  { name: 'RESPECT',         arabic: 'IHTIRAM',  match: /^🌟\s*\d+\.\s*RESPECT\s*\(IHTIRAM\)/i,     color: '#7c3aed', emoji: '🙏' },
  { name: 'HUMILITY',        arabic: 'TAWADHU',  match: /^🌟\s*HUMILITY\s*\(TAWADHU\)/i,            color: '#0ea5e9', emoji: '🌱' },
  { name: 'GRATITUDE',       arabic: 'SHUKR',    match: /^🌟\s*GRATITUDE\s*\(SHUKR\)/i,             color: '#F4C542', emoji: '🤲' },
];

const STAGE_PATTERNS = [
  { stage: 1, label: 'Personal Goodness',   match: /STAGE\s*1|^🟢\s*Stage\s*1/i },
  { stage: 2, label: 'Recognizing Wrong',   match: /STAGE\s*2|^🟡\s*Stage\s*2/i },
  { stage: 3, label: 'Resisting Pressure',  match: /STAGE\s*3|^🟠\s*Stage\s*3/i },
  { stage: 4, label: 'Leadership & System', match: /STAGE\s*4|^🔵\s*Stage\s*4/i },
];

// First pass: split into "blocks" where each block is one chapter
// Strategy: a chapter starts at a line that is ALL CAPS topic title (after numbering or as standalone)
// and ends at the next ALL CAPS topic title or stage/value boundary.
function isStructuralLine(t) {
  return /^(STAGE|🟢|🟡|🟠|🔵|🌟|Reflection|Story|Parenting Tip|الحديث|سورة|💡|\(|🌸|🌈)/i.test(t)
      || /^[\(\u0600-\u06FF]/.test(t); // Arabic-only or parenthetical
}

function looksLikeAllCapsTitle(t) {
  const numbered = t.match(/^\d+[\.\s]+\s*(.+)$/);
  const candidate = numbered ? numbered[1] : t;
  const letters = candidate.replace(/[^A-Za-z]/g, '');
  if (letters.length < 5) return false;
  const upper = candidate.replace(/[^A-Z]/g, '').length;
  const lower = candidate.replace(/[^a-z]/g, '').length;
  return upper > 3 && lower === 0;
}

// A title-case chapter title typically appears on its own line, is followed by an intro
// paragraph that often starts with the same words and the word "means".
function looksLikeTitleCaseTitle(t, nextLine) {
  if (!t || t.length > 80) return false;
  if (isStructuralLine(t)) return false;
  if (!/^[A-Z]/.test(t)) return false;
  // Skip lines with sentence-ending punctuation (intros)
  if (/[.!?]$/.test(t)) return false;
  // Must have 2-12 words
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 12) return false;
  // Next line should be a longer paragraph (intro) that often contains "means"
  if (!nextLine) return false;
  const next = nextLine.trim();
  if (next.length < 60) return false;
  if (isStructuralLine(next)) return false;
  // Strong signal: intro starts with same first word as title and contains "means"
  const firstTitleWord = words[0].toLowerCase();
  const firstNextWord = next.split(/\s+/)[0].toLowerCase();
  return firstNextWord === firstTitleWord && /\bmeans\b/i.test(next.slice(0, 200));
}

function getTitle(t, nextLine) {
  if (looksLikeAllCapsTitle(t)) return { ok: true, normalized: (t.match(/^\d+[\.\s]+\s*(.+)$/) || [,t])[1].trim() };
  if (looksLikeTitleCaseTitle(t, nextLine)) return { ok: true, normalized: t.trim().toUpperCase() };
  return { ok: false };
}

const chapters = [];
let currentValue = null;
let currentStage = null;
let curBlock = null;

function pushBlock() {
  if (curBlock && curBlock.title) {
    chapters.push(curBlock);
  }
  curBlock = null;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Detect value boundary
  for (const v of VALUE_PATTERNS) {
    if (v.match.test(trimmed)) {
      pushBlock();
      currentValue = v;
      currentStage = { stage: 1, label: 'Personal Goodness' };
      break;
    }
  }
  // Detect stage boundary
  for (const s of STAGE_PATTERNS) {
    if (s.match.test(trimmed)) {
      pushBlock();
      currentStage = s;
      break;
    }
  }

  // Detect topic title
  const titleCheck = getTitle(trimmed, lines[i + 1]);
  if (titleCheck.ok) {
    pushBlock();
    curBlock = {
      value: currentValue ? currentValue.name : 'HONESTY',
      valueArabic: currentValue ? currentValue.arabic : 'SIDQ',
      valueColor: currentValue ? currentValue.color : '#D63678',
      valueEmoji: currentValue ? currentValue.emoji : '🌟',
      stage: currentStage ? currentStage.stage : 1,
      stageLabel: currentStage ? currentStage.label : '',
      title: titleCheck.normalized,
      intro: '',
      quranSurah: '',
      quranText: '',
      hadithText: '',
      storyTitle: '',
      story: [],
      reflection: '',
      parentTip: '',
      _section: 'intro',
      _buffer: []
    };
    continue;
  }

  if (!curBlock) continue;

  // Section detection within a chapter block — handle inline content like "سورة الفلان \"...\""
  const surahMatch = trimmed.match(/^(سورة\s*\S*)\s*(.*)$/);
  if (surahMatch) {
    flushBuffer(curBlock);
    curBlock._section = 'quran';
    curBlock.quranSurah = surahMatch[1].trim();
    if (surahMatch[2]) curBlock._buffer.push(surahMatch[2].trim());
    continue;
  }
  const hadithMatch = trimmed.match(/^(الحديث)\s*(.*)$/);
  if (hadithMatch) {
    flushBuffer(curBlock);
    curBlock._section = 'hadith';
    if (hadithMatch[2]) curBlock._buffer.push(hadithMatch[2].trim());
    continue;
  }
  if (/^Story/i.test(trimmed)) {
    flushBuffer(curBlock);
    curBlock._section = 'story';
    let st = trimmed;
    if (!/^Story/.test(st)) st = 'Story';
    curBlock.storyTitle = st;
    continue;
  }
  if (/^Reflection/i.test(trimmed)) {
    flushBuffer(curBlock);
    curBlock._section = 'reflection';
    const rest = trimmed.replace(/^Reflection[:\s]*/i, '').trim();
    if (rest) curBlock._buffer.push(rest);
    continue;
  }
  if (/Parenting Tip/i.test(trimmed)) {
    flushBuffer(curBlock);
    curBlock._section = 'parentTip';
    const stripped = trimmed.replace(/^[💡🟦\s]*Parenting Tip[:\s]*/i, '').trim();
    if (stripped) curBlock._buffer.push(stripped);
    continue;
  }

  if (trimmed) {
    curBlock._buffer.push(trimmed);
  } else {
    handleBlankLine(curBlock);
  }
}
pushBlock();

function flushBuffer(b) {
  if (!b._buffer.length) return;
  const text = b._buffer.join(' ').replace(/\s+/g, ' ').trim();
  switch (b._section) {
    case 'intro':       b.intro       = (b.intro       ? b.intro       + ' ' : '') + text; break;
    case 'quran':       b.quranText   = (b.quranText   ? b.quranText   + ' ' : '') + text; break;
    case 'hadith':      b.hadithText  = (b.hadithText  ? b.hadithText  + ' ' : '') + text; break;
    case 'story':       b.story.push(text); break;
    case 'reflection':  b.reflection  = (b.reflection  ? b.reflection  + ' ' : '') + text; break;
    case 'parentTip':   b.parentTip   = (b.parentTip   ? b.parentTip   + ' ' : '') + text; break;
  }
  b._buffer = [];
}

// On blank line in hadith section: flush, and auto-switch to story
// (handles cases where no explicit "Story" header exists)
function handleBlankLine(b) {
  if (!b) return;
  if (b._buffer.length) {
    flushBuffer(b);
    // After flushing the first hadith paragraph, treat subsequent content as story
    if (b._section === 'hadith' && b.hadithText && !b.hadithSeenSecond) {
      b.hadithSeenSecond = true;
      b._section = 'story';
    }
  }
}

// Final flush per chapter
chapters.forEach(c => {
  flushBuffer(c);
  delete c._section;
  delete c._buffer;
});

// Filter out spurious blocks (no intro and no story)
const clean = chapters.filter(c => c.intro && (c.story.length || c.reflection));

// Re-number sequentially across whole sequence
clean.forEach((c, i) => { c.day = i + 1; });

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(clean, null, 2), 'utf8');

console.log('Parsed chapters:', clean.length);
console.log('Output:', OUT);
console.log('\n=== Sample (first 3 titles) ===');
clean.slice(0, 3).forEach(c => console.log(`Day ${c.day} [${c.value} | Stage ${c.stage}] ${c.title}`));
console.log('\n=== Distribution by value ===');
const byVal = {};
clean.forEach(c => { byVal[c.value] = (byVal[c.value] || 0) + 1; });
console.log(byVal);
