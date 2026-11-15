# Tafsir Through Stories (course index 4)

Playable: worlds 1–7, 107 missions. World 8 shows as "Coming soon".

## Sources

From the email "imaa and Akhlaq individual section additions" (3–10 Nov 2026),
extracted to
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`
(`originals/05-Tafsir/*.docx`, `extracted/05-Tafsir/*.txt`).

| World | Source document | Missions | Ayahs | Data |
|---:|---|---:|---:|---|
| 1 | Imaan_Akhlaq_Tafsir_Stories_Volume_01_Surah_Al_Hujurat.docx | 12 | 18 | `tafsir-world-01.json` |
| 2 | Imaan_Akhlaq_Tafsir_Stories_Volume_02_Surah_Al_Kahf.docx | 16 | 75 | `tafsir-world-02.json` |
| 3 | Imaan_Akhlaq_Tafsir_Stories_Volume_03_Surah_Luqman.docx | 15 | 35 (31:17 twice) | `tafsir-world-03.json` |
| 4 | Imaan_Akhlaq_Tafsir_Stories_Volume_04_The_World_of_Gratitude.docx | 16 | 49 | `tafsir-world-04.json` |
| 5 | Imaan_Akhlaq_Tafsir_Stories_Volume_05_The_World_of_Honesty.docx | 16 | 20 | `tafsir-world-05.json` |
| 6 | Imaan_Akhlaq_Tafsir_Stories_Volume_06_The_World_of_Compassion.docx | 16 | 30 | `tafsir-world-06.json` |
| 7 | Imaan_Akhlaq_Tafsir_Stories_Volume_07_The_World_of_Time_and_Responsibility.docx | 16 | 27 | `tafsir-world-07.json` |

World titles, mission counts and ayah counts match the developer manual
(`Imaan_Akhlaq_Tafsir_8_Volumes_Complete_Gamification_Developer_Manual.docx`,
"Learning scope — eight existing worlds"); the tests check them.

## Missing volume

World 8, **The World of Self-Improvement** (16 missions, 31 ayahs in the
manual's catalogue), has no Volume 08 DOCX in the email thread. The manual
only lists mission titles and ayah anchors, without Arabic, meanings,
stories or decisions, so nothing was written for it. Ask the content owner
for `Imaan_Akhlaq_Tafsir_Stories_Volume_08_The_World_of_Self_Improvement.docx`.

## How the data is made

`tool/extract_tafsir.mjs` reads the extracted text and writes the JSON. Every
field is a verbatim source line: title, ayah references, Arabic, the
volume's English meaning guides (per ayah in volumes 1–5, one passage
meaning in 6–7), Tafsir, the fictional Imaan & Akhlaq story, the decision
and its answer key, daily action, reflection, vocabulary, parent/teacher
note and source path. The developer mini-game specs are left out. Re-run
after a corrected volume arrives:

```
node lib/courses/tafsir/tool/extract_tafsir.mjs "<...>/extracted/05-Tafsir"
```

The only text not from the source is UI wording, including the hint shown
after a wrong decision (the volumes give feedback only for the right answer).

## Review status

These are working editions. The volumes themselves say "scholarly review
required before release": Arabic text, meanings, Tafsir, audio and child
safety must be approved by qualified reviewers before launch. The app says
so on the course, world and mission screens.

## Flow and progress

World list → mission list → Story → Read the ayah → Understand → Decide →
Daily action → reflection summary, following `hadith_screen.dart`. Progress
is saved on the device per learner scope (`imaan.tafsir.v1.<scope>`), with no
points and no Firebase writes.
