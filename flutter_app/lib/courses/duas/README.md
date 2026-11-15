# Zad al-Qulub Junior (Duas course)

10 volumes, 100 duas and adhkar, all playable. Course index 2.

## Sources

The text comes word for word from the ten DOCX files sent in the email
curriculum (3–10 Nov 2026), under
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14\originals\03-Duas\`:

| Volume | DOCX | Duas |
|---:|---|---|
| 1 | Zad_al_Qulub_Junior_Volume_01_First_Remembrances.docx | 1–10 |
| 2 | Zad_al_Qulub_Junior_Volume_02_My_Everyday_Sunnah.docx | 11–20 |
| 3 | Zad_al_Qulub_Junior_Volume_03_My_Home_and_Family.docx | 21–30 |
| 4 | Zad_al_Qulub_Junior_Volume_04_My_Salah_and_Masjid.docx | 31–40 |
| 5 | Zad_al_Qulub_Junior_Volume_05_Talking_to_Allah_Through_the_Quran.docx | 41–50 |
| 6 | Zad_al_Qulub_Junior_Volume_06_Allah_Helps_Me_Through_Difficulties.docx | 51–60 |
| 7 | Zad_al_Qulub_Junior_Volume_07_My_Morning_and_Evening.docx | 61–70 |
| 8 | Zad_al_Qulub_Junior_Volume_08_Duas_of_the_Prophets.docx | 71–80 |
| 9 | Zad_al_Qulub_Junior_Volume_09_Gratitude_Faith_and_Good_Character.docx | 81–90 |
| 10 | Zad_al_Qulub_Junior_Volume_10_Treasures_of_the_Sunnah.docx | 91–100 |

`assets/data/courses/duas-volume-NN.json` is generated from the DOCX by
`tool/build.js`. The script reads `word/document.xml` directly so that line
breaks inside a paragraph, such as the three surahs in dua 67, are kept.
It only splits paragraphs into fields and never rewrites the text. To
regenerate, extract each DOCX's `word/document.xml` into one folder (named
after the DOCX), then run `node tool/build.js <that folder> ../../../assets/data/courses`.

When the files were built (15 Nov 2026), every Arabic phrase, meaning,
occasion, source, story, explanation, chunk, action, feedback and
reflection was checked against the extracted text of the email: all 100
were found verbatim. Each volume JSON records its `sourceDocument` and a
`reviewStatus`.

**Scholarly review is still required before release.** The documents call
themselves a working edition for scholarly, Arabic, Urdu and pronunciation
review. The app says so on the course screen and in each dua's source
details.

## Lesson flow

Volume list → dua list → Story → Learn (Arabic in NotoNaskhArabic,
transliteration, English and Urdu meaning, when to say it, explanation,
source link, full source details) → Remember (source chunks, hide and
recall, optional "build the words" ordering) → Check (pick the matching
meaning; wrong answers can be retried) → One action → reflection
(Yes / I tried / Not yet).

The check takes its wrong options from other duas' meanings in the same
volume, so no question text was written for it. The only app-written lines
are UI prompts and feedback such as "Not quite…"; none is religious content.
Progress is saved on the device per learner scope (`imaan.duas.v1.<scope>`).
There are no points and no Firebase writes.

## Gaps in the source

* **No transliteration** for duas 67–68 and 91–100. The DOCX omits it
  (dua 68 says transliteration should be reviewed separately).
* **No "When to say it" field** in volumes 8–10. The occasion is given in
  the context section, which appears under Source details.
* **Chunks:** dua 4 is a single word. Dua 8 gives no chunk list; its full
  three-part exchange appears under Source details. Dua 67's chunks are
  surah names, so the app memorises it surah by surah from the Arabic text.
* **No audio** was supplied. Nothing is synthesised.
* The "Interactive app mission" descriptions are developer notes for
  future mini-games. Only their "Gentle feedback" line is shown, after a
  correct check.
