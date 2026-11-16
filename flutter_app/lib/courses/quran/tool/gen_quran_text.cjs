#!/usr/bin/env node
// Imports the verified Uthmani text and Husary (Muallim) recitation data for
// every ayah the Qur'an course uses, from the Quran.com API (Quran
// Foundation). Nothing is typed or generated: each verse's text, words and
// audio timings are copied exactly as the API returns them.
//
//   node lib/courses/quran/tool/gen_quran_text.cjs
//
// Writes assets/data/courses/quran-text.json with a SHA-256 checksum of all
// verse texts, which the tests check. Re-run only when an editor approves a
// new import, and review the diff.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../../..');
const framework = require(path.join(root, 'assets/data/courses/quran-framework.json'));
const out = path.join(root, 'assets/data/courses/quran-text.json');
const RECITATION = 12; // Mahmoud Khalil Al-Husary (Muallim), Hafs an Asim
const API = 'https://api.quran.com/api/v4';

function neededAyahs() {
  const need = new Map(); // surah -> Set(ayah)
  for (const p of framework.passages) {
    for (const part of p.range.split(/[,;] ?/)) {
      const m = part.trim().match(/^(\d+):(\d+)(?:-(\d+))?$/);
      if (!m) throw new Error(`Unreadable range ${p.range} in ${p.id}`);
      const s = +m[1], a = +m[2], b = m[3] ? +m[3] : a;
      if (!need.has(s)) need.set(s, new Set());
      for (let i = a; i <= b; i++) need.get(s).add(i);
    }
  }
  return need;
}

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.ok) return res.json();
    if (attempt >= 4) throw new Error(`${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 800 * attempt));
  }
}

async function chapter(surah) {
  const verses = [];
  for (let page = 1; ; page++) {
    const q = new URLSearchParams({
      fields: 'text_uthmani',
      words: 'true',
      word_fields: 'text_uthmani',
      audio: String(RECITATION),
      per_page: '50',
      page: String(page),
    });
    const j = await getJson(`${API}/verses/by_chapter/${surah}?${q}`);
    verses.push(...j.verses);
    if (!j.pagination || !j.pagination.next_page) break;
  }
  return verses;
}

(async () => {
  const need = neededAyahs();
  const verses = {};
  for (const surah of [...need.keys()].sort((a, b) => a - b)) {
    const wanted = need.get(surah);
    for (const v of await chapter(surah)) {
      if (!wanted.has(v.verse_number)) continue;
      const words = v.words.filter((w) => w.char_type_name === 'word');
      const timing = new Array(words.length).fill(null);
      for (const seg of (v.audio && v.audio.segments) || []) {
        const [from, , start, end] = seg;
        if (Number.isInteger(from) && from >= 0 && from < words.length) timing[from] = [start, end];
      }
      verses[v.verse_key] = {
        text: v.text_uthmani,
        words: words.map((w) => w.text_uthmani),
        timing,
        audio: v.audio && v.audio.url ? `https:${v.audio.url}` : null,
        juz: v.juz_number,
        page: v.page_number,
        sajdah: v.sajdah_number != null,
      };
    }
    const missing = [...wanted].filter((a) => !verses[`${surah}:${a}`]);
    if (missing.length) throw new Error(`Surah ${surah} missing ayahs ${missing.join(',')}`);
    process.stdout.write(`${surah} `);
  }
  const keys = Object.keys(verses).sort((a, b) => {
    const [s1, a1] = a.split(':').map(Number), [s2, a2] = b.split(':').map(Number);
    return s1 - s2 || a1 - a2;
  });
  const sorted = Object.fromEntries(keys.map((k) => [k, verses[k]]));
  const checksum = crypto
    .createHash('sha256')
    .update(keys.map((k) => `${k}\t${sorted[k].text}`).join('\n'))
    .digest('hex');
  const doc = {
    version: 1,
    edition: 'Uthmani script, Hafs an Asim (Quran.com API v4, text_uthmani)',
    recitation: {
      id: RECITATION,
      reciter: 'Mahmoud Khalil Al-Husary',
      style: 'Muallim (teaching, with pauses)',
      audioHost: 'mirrors.quranicaudio.com (EveryAyah)',
    },
    source: 'https://api.quran.com/api/v4',
    importedOn: new Date().toISOString().slice(0, 10),
    licenceNote:
      'Text and recitation belong to their publishers. Confirm commercial-use permission with the Quran Foundation / QuranicAudio before a paid release.',
    reviewStatus: 'Imported verbatim; an editor must spot-check against a printed Madinah mushaf before release.',
    checksum,
    count: keys.length,
    verses: sorted,
  };
  fs.writeFileSync(out, JSON.stringify(doc) + '\n');
  console.log(`\nwrote ${keys.length} verses, sha256 ${checksum}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
