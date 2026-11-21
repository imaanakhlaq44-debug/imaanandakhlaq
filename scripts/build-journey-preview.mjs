import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const source = process.argv[2];
const output = new URL('../flutter_app/assets/data/journey-preview.json', import.meta.url);
const flutterRoot = new URL('../flutter_app/', import.meta.url);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function releaseDependencies() {
  const directory = 'assets/data/courses/';
  const courses = (await readdir(new URL(directory, flutterRoot)))
    .filter((name) => name.endsWith('.json')).sort();
  const files = [
    ...courses.map((name) => directory + name),
    'assets/data/hadith-demo.json',
    'assets/images/course-scenes.png',
    'assets/images/course-guide-imaan.png',
    'assets/images/course-guide-akhlaq.png',
    'lib/courses/course_journey.dart',
    'lib/courses/duas/duas_data.dart',
    'lib/courses/hajj/hajj_data.dart',
    'lib/courses/ibrah/ibrah_data.dart',
    'lib/courses/quran/quran_data.dart',
    'lib/courses/quran/quran_text.dart',
    'lib/courses/quran/recitation_view.dart',
    'lib/courses/salah/salah_data.dart',
    'lib/courses/tafsir/tafsir_data.dart',
    'lib/courses/taleem/taleem_data.dart',
    'lib/data/hadith_course.dart',
    'lib/data/journey_account.dart',
    'lib/data/journey_lessons.dart',
    'lib/data/journey_urdu.dart',
    'lib/data/learning_journey.dart',
    'lib/l10n/language.dart',
    'lib/screens/journey_practice_view.dart',
    'lib/screens/journey_screen.dart',
    'lib/screens/journey_preferences_sheet.dart',
  ];
  return Object.fromEntries(await Promise.all(files.map(async (path) => [
    path, sha256(path.endsWith('.png')
      ? await readFile(new URL(path, flutterRoot))
      : (await readFile(new URL(path, flutterRoot), 'utf8')).replace(/\r\n/g, '\n')),
  ])));
}

if (!source || process.argv.length !== 3) {
  throw new Error('Usage: node scripts/build-journey-preview.mjs <curriculum.json|--verify>');
}
if (source === '--verify') {
  const { releaseHash, ...manifest } = JSON.parse(await readFile(output, 'utf8'));
  if (sha256(JSON.stringify(manifest)) !== releaseHash ||
      JSON.stringify(await releaseDependencies()) !== JSON.stringify(manifest.dependencies)) {
    throw new Error('Release package has changed. Regenerate it before review and publication.');
  }
  console.log('Verified Journey release ' + releaseHash);
  process.exit(0);
}

const curriculum = JSON.parse((await readFile(source, 'utf8')).replace(/^\uFEFF/, ''));
const briefFields = {
  phase: 'Phase',
  difficulty: 'Difficulty',
  levelType: 'Level Type',
  contentType: 'Content Type',
  sourcePdf: 'Source PDF(s)',
  sourcePages: 'Source PDF Page(s)',
  objective: 'Learning Objective',
  explore: 'Story / Explore Screen',
  understand: 'Understand / Read Screen',
  activity: 'Interactive Mission',
  decision: 'Decision / Assessment Prompt',
  rubric: 'Correct Response / Rubric',
  dailyAction: 'Daily Action (Optional)',
  reflection: 'Private Reflection',
  mastery: 'Mastery Rule',
  accessibility: 'Age and Accessibility',
  session: 'Estimated Session',
  reviewSchedule: 'Review Schedule',
  releaseGate: 'Release Gate',
};
const fields = ['Level Title', 'World Code', 'Source Unit', ...Object.values(briefFields)];
const worlds = new Set(['DUA', 'QUR', 'IBR', 'HAD', 'SAL', 'RHD', 'TAF', 'HAJ']);
if (typeof curriculum.version !== 'string' || curriculum.version.trim() === '' ||
    !Array.isArray(curriculum.levels) || curriculum.levels.length !== 1000) {
  throw new Error('Expected a versioned curriculum with exactly 1,000 levels.');
}

const catalogue = curriculum.levels.map((level, index) => {
  const number = index + 1;
  const id = 'IA-' + String(number).padStart(4, '0');
  if (level?.Level !== number || level['Level ID'] !== id ||
      fields.some((field) => typeof level[field] !== 'string' || !level[field].trim()) ||
      !worlds.has(level['World Code'])) {
    throw new Error('Invalid level number, ID, world or source for ' + id);
  }
  return {
    id,
    number,
    title: level['Level Title'],
    world: level['World Code'],
    sourceUnit: level['Source Unit'],
    sourceReference: level['Source Evidence / Reference']?.trim() ||
      level['Source PDF(s)'] + ' · p. ' + level['Source PDF Page(s)'],
    brief: Object.fromEntries(Object.entries(briefFields).map(([key, field]) => [
      key, level[field],
    ])),
  };
});

const referenceLevels = new Map();
for (const level of catalogue) {
  if (!level.sourceUnit.includes(';')) {
    referenceLevels.set(level.world + ':' + level.title, level.id);
  }
}

for (const level of catalogue) {
  if (level.sourceUnit.includes(';')) {
    const titles = level.title.slice(level.title.indexOf(': ') + 2).split(' + ');
    level.stations = titles.map((title) => referenceLevels.get(level.world + ':' + title));
  } else if (level.number === 1000) {
    level.sourceUnit = level.sourceUnit.split(' + ')[0];
    const sourceUnits = [
      level.sourceUnit, 'QUR-1:1–7', 'HAD-001', 'DUA-V01-L01',
      'F3', 'TAF-V01-M01', 'U05.3', 'RHD-L4-24',
    ];
    level.stations = sourceUnits.map((unit) =>
      catalogue.find((item) => item.sourceUnit === unit)?.id);
  }
  if (level.stations?.some((id) => !id)) {
    throw new Error('Missing referenced lesson for ' + level.id + ' ' + level.title);
  }
}

const manifest = {
  schema: 2,
  curriculumVersion: curriculum.version,
  levels: catalogue,
  dependencies: await releaseDependencies(),
};
const releaseHash = sha256(JSON.stringify(manifest));
await writeFile(output, JSON.stringify({ ...manifest, releaseHash }, null, 2) + '\n');
console.log('Generated 1,000 levels for Journey release ' + releaseHash);
