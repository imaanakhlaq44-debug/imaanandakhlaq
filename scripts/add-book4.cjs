// Adds Book 4 chapters to activities.json AND patches both student-activities.html files
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SECTION = [
  { heading: 'My Daily Actions:', questions: ['I applied the core learning today ?', 'I helped a friend understand this ?', 'I practiced the sunnah associated with this ?'] },
  { heading: 'Ethics in Class:', questions: ['I listened when the teacher spoke about this ?', 'I asked questions to clarify my doubts ?', "I didn't distract others during the lesson ?"] },
  { heading: 'With My Family:', questions: ['I shared this story with my parents ?', 'I promised to improve my character ?', 'I thanked Allah for the guidance ?'] }
];

const CHAPTERS_PAGES = [
  [1, 13], [14, 21], [22, 29], [30, 37], [38, 43],
  [44, 51], [52, 58], [59, 67], [68, 77], [78, 87],
  [88, 99], [100, 109], [110, 118], [119, 129], [130, 144]
];

const book4 = {
  title: 'Imaan and Akhlaaq - Book 4',
  pdfUrl: 'https://imaanakhlaq.org/Book4.pdf',
  chapters: {}
};

CHAPTERS_PAGES.forEach(([start, end], i) => {
  const n = i + 1;
  book4.chapters[`chapter${n}`] = {
    id: `b4_c${n}`,
    title: `Chapter ${n}`,
    pageStart: start,
    pageEnd: end,
    discussionQuestion: 'What is the main lesson from this chapter?',
    sections: SECTION
  };
});

// 1. Update src/data/activities.json
const jsonPath = path.join(ROOT, 'src', 'data', 'activities.json');
const activitiesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (activitiesData.book4) {
  console.log('activities.json: book4 already exists — overwriting');
}
activitiesData.book4 = book4;
fs.writeFileSync(jsonPath, JSON.stringify(activitiesData, null, 2), 'utf8');
console.log('✓ Updated: src/data/activities.json');

// 2. Patch inline JSON in student-activities.html files
const MINIFIED = JSON.stringify(activitiesData);
const HTML_FILES = [
  path.join(ROOT, 'imaan_hostinger', 'student-activities.html'),
  path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public', 'student-activities.html'),
];

// The inline data starts with `{"book1":` and ends before `;\n      apiData`
const OLD_BOOK1_START = '{"book1":';
const END_MARKER = '};';

HTML_FILES.forEach(filePath => {
  if (!fs.existsSync(filePath)) { console.warn('  MISSING:', filePath); return; }
  let html = fs.readFileSync(filePath, 'utf8');

  // Find the const data = {...}; block
  const markerStart = 'const data = ';
  const idx = html.indexOf(markerStart);
  if (idx === -1) { console.warn('  Could not find "const data = " in:', filePath); return; }

  // Find the matching closing }; after the JSON
  const jsonStart = idx + markerStart.length;
  // Scan for the semicolon after the closing brace
  let braceDepth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') braceDepth++;
    else if (html[i] === '}') {
      braceDepth--;
      if (braceDepth === 0) { jsonEnd = i + 1; break; }
    }
  }
  if (jsonEnd === -1) { console.warn('  Could not find end of JSON in:', filePath); return; }

  const before = html.slice(0, jsonStart);
  const after = html.slice(jsonEnd);
  html = before + MINIFIED + after;
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✓ Patched:', path.relative(ROOT, filePath));
});

console.log('\nDone! Book 4 added with 15 chapters.');
console.log('NOTE: Set pdfUrl in activities.json once you upload Book4.pdf to Google Drive.');
