// Builds assets/data/courses/taleem-volume-0N.json from the extracted
// Rihlat al-Huda Junior texts. Every teaching string is copied verbatim from
// the source line; nothing is rewritten.
//
//   node lib/courses/taleem/tool/extract_taleem.cjs <extracted-folder>
//
// (Run from flutter_app/. The folder is
// imaan-email-content-2026-11-14/extracted/08-Taleem-ul-Islam.)
'use strict';
const fs = require('fs');
const path = require('path');

const files = [
  'Rihlat_al_Huda_Junior_Volume_01_Ages_6_to_8_Complete',
  'Rihlat_al_Huda_Junior_Volume_02_Ages_9_to_10_Complete',
  'Rihlat_al_Huda_Junior_Volume_03_Ages_11_to_12_Complete',
  'Rihlat_al_Huda_Junior_Volume_04_Ages_13_to_14_Complete',
];
const arabic = /[؀-ۿ]/;
const isArabicLine = (s) => {
  const letters = s.replace(/[\s\d\p{P}]/gu, '');
  const ar = [...letters].filter((c) => arabic.test(c)).length;
  return letters.length > 0 && ar / letters.length > 0.6;
};

function parse(file, src) {
  const lines = fs
    .readFileSync(path.join(src, file + '.txt'), 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);
  const volume = Number(/Volume_0(\d)/.exec(file)[1]);
  const edition = {
    id: `taleem-v${volume}`,
    volume,
    title: lines[3],
    arabicTitle: lines[4],
    ages: /Ages_(\d+)_to_(\d+)/.exec(file).slice(1).join('–'),
    declared: lines[6],
    status: lines.find((l) => l.startsWith('EDITORIAL WORKING EDITION')),
    welcome: lines[lines.findIndex((l) => l.startsWith('Welcome')) + 1],
    sourceDocument: file + '.docx',
    journeys: [],
  };
  const unparsed = [];
  let journey = null;
  let lesson = null;
  let section = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = /^LEARNING JOURNEY (\d+)$/.exec(l))) {
      journey = {
        number: Number(m[1]),
        title: lines[++i],
        aim: lines[++i],
        lessons: [],
      };
      edition.journeys.push(journey);
      lesson = null;
      continue;
    }
    if ((m = /^LESSON (\d+)\s+•\s+AGES/.exec(l))) {
      lesson = {
        id: `${edition.id}-l${m[1]}`,
        number: Number(m[1]),
        title: lines[++i],
        story: [],
        teaching: [],
        questions: [],
        reflect: [],
        decide: null,
        remember: [],
      };
      journey.lessons.push(lesson);
      section = 'head';
      continue;
    }
    if (!lesson) continue;
    if (section === 'tail') {
      unparsed.push(l);
      continue;
    }
    if ((m = /^What I will learn:\s*(.*)$/.exec(l))) {
      lesson.objective = m[1];
    } else if (
      (m =
        /^(?:From|Based on) master chapter\(s\):\s*(.*?)\s+\|\s+(Evidence [^:]*):\s*(.*)$/.exec(
          l,
        ))
    ) {
      lesson.masterChapters = m[1];
      lesson.evidenceLabel = m[2];
      lesson.evidence = m[3];
    } else if (l === 'Discover — An Imaan & Akhlaq Story') {
      section = 'story';
    } else if (l === 'Understand — Our Teaching') {
      section = 'teaching';
    } else if (/^LESSON \d+\s+(•|—)\s+MY LEARNING PAGE$/.test(l)) {
      section = 'page';
    } else if (l === 'Questions & Answers') {
      section = 'qa';
    } else if (l === 'A Moment to Reflect') {
      section = 'reflect';
    } else if (l === 'Decide — What Would You Do?') {
      section = 'decide';
      lesson.decide = { scenario: [], feedback: null };
    } else if ((m = /^Teacher answer and feedback:\s*(.*)$/.exec(l))) {
      lesson.decide.feedback = m[1];
    } else if ((m = /^Q\.\s*(.*)$/.exec(l)) && section === 'qa') {
      lesson.questions.push({ q: m[1], a: null });
    } else if ((m = /^A\.\s*(.*)$/.exec(l)) && section === 'qa') {
      lesson.questions[lesson.questions.length - 1].a = m[1];
    } else if ((m = /^My First Step — A Daily Action\s+(.*)$/.exec(l))) {
      lesson.dailyAction = m[1];
    } else if ((m = /^Try It Together\s+(.*)$/.exec(l))) {
      lesson.tryTogether = m[1];
    } else if ((m = /^Key Words(?: to Remember)?\s+(.*)$/.exec(l))) {
      lesson.keyWords = m[1];
    } else if ((m = /^Remember:\s*(.*)$/.exec(l))) {
      lesson.remember = m[1]
        .split('□')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if ((m = /^For parents and teachers:\s*(.*)$/.exec(l))) {
      lesson.parentNote = m[1];
    } else if (/^My (picture|explanation)/.test(l)) {
      // Workbook prompt for paper; not a teaching line.
    } else if (/^My next small step:/.test(l)) {
      section = 'tail';
    } else if (section === 'story') {
      lesson.story.push(l);
    } else if (section === 'teaching') {
      lesson.teaching.push(
        isArabicLine(l) ? { arabic: l } : { text: l },
      );
    } else if (section === 'reflect') {
      lesson.reflect.push(l);
    } else if (section === 'decide') {
      lesson.decide.scenario.push(l);
    } else {
      unparsed.push(`[${lesson.id}/${section}] ${l}`);
    }
  }
  // Pair an Arabic line with the English line that explains it.
  for (const j of edition.journeys) {
    for (const ls of j.lessons) {
      const t = [];
      for (let k = 0; k < ls.teaching.length; k++) {
        const p = ls.teaching[k];
        const next = ls.teaching[k + 1];
        if (p.arabic && next && next.text && next.text.length < 220) {
          t.push({ arabic: p.arabic, meaning: next.text });
          k++;
        } else {
          t.push(p);
        }
      }
      ls.teaching = t;
    }
  }
  return { edition, unparsed };
}

const src = process.argv[2];
const out = path.join(__dirname, '..', '..', '..', '..', 'assets', 'data', 'courses');
const report = [];
for (const f of files) {
  const { edition, unparsed } = parse(f, src);
  const lessons = edition.journeys.flatMap((j) => j.lessons);
  const problems = [];
  for (const l of lessons) {
    for (const k of ['objective', 'evidence', 'dailyAction', 'tryTogether', 'keyWords', 'parentNote']) {
      if (!l[k]) problems.push(`${l.id} missing ${k}`);
    }
    if (!l.story.length || !l.teaching.length || !l.reflect.length) problems.push(`${l.id} empty section`);
    if (l.questions.some((q) => !q.a)) problems.push(`${l.id} question without answer`);
    if (edition.volume > 1 && (!l.decide || !l.decide.feedback)) problems.push(`${l.id} missing decide`);
    if (l.remember.length !== 3) problems.push(`${l.id} remember ${l.remember.length}`);
  }
  const doc = {
    course: 'Rihlat al-Huda Junior / Taleem-ul-Islam',
    review: 'Editorial working edition. Arabic, references and rulings need qualified scholarly review before release.',
    ...edition,
  };
  fs.writeFileSync(
    path.join(out, `taleem-volume-0${edition.volume}.json`),
    JSON.stringify(doc, null, 1) + '\n',
  );
  report.push(
    `Volume ${edition.volume}: ${edition.journeys.length} journeys, ${lessons.length} lessons, ` +
      `${lessons.reduce((n, l) => n + l.questions.length, 0)} Q&A, ` +
      `${lessons.reduce((n, l) => n + l.teaching.filter((t) => t.arabic).length, 0)} Arabic lines; ` +
      `problems: ${problems.length ? problems.join('; ') : 'none'}; ` +
      `${unparsed.length} lines after the last lesson (workbook pages, crosswalk, register)`,
  );
  // Set TALEEM_DEBUG to a folder to see the end matter that was not imported.
  if (process.env.TALEEM_DEBUG) {
    fs.writeFileSync(
      path.join(process.env.TALEEM_DEBUG, `taleem-v${edition.volume}-unparsed.txt`),
      unparsed.join('\n'),
    );
  }
}
console.log(report.join('\n'));
