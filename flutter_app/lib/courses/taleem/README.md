# Rihlat al-Huda Junior / Taleem-ul-Islam

Course index 7. Opens from `taleemCourse` in `taleem_course.dart`.

## Sources

Email "imaa and Akhlaq individual section additions" (3–10 Nov 2026), extracted
on 14 Nov 2026 to
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`:

| Edition | Ages | Source DOCX (`originals/08-Taleem-ul-Islam/`) | Data | Journeys | Lessons |
|---|---|---|---|---:|---:|
| The Beginning of Guidance | 6–8 | `Rihlat_al_Huda_Junior_Volume_01_Ages_6_to_8_Complete.docx` | `taleem-volume-01.json` | 9 | 21 |
| Understanding Guidance | 9–10 | `Rihlat_al_Huda_Junior_Volume_02_Ages_9_to_10_Complete.docx` | `taleem-volume-02.json` | 9 | 26 |
| Living the Guidance | 11–12 | `Rihlat_al_Huda_Junior_Volume_03_Ages_11_to_12_Complete.docx` | `taleem-volume-03.json` | 9 | 27 |
| Carrying the Guidance | 13–14 | `Rihlat_al_Huda_Junior_Volume_04_Ages_13_to_14_Complete.docx` | `taleem-volume-04.json` | 9 | 27 |

The JSON is generated, not hand-written:

```
node lib/courses/taleem/tool/extract_taleem.cjs "<...>/extracted/08-Taleem-ul-Islam"
```

Each string is one source line copied verbatim (story, teaching, Arabic,
Q&A, reflection, decision and teacher feedback, daily action, Try It
Together, key words, Remember checklist, parent note, evidence references,
master chapters). Each file records `sourceDocument` and the volume's own
"EDITORIAL WORKING EDITION" status line. `test/courses/taleem_test.dart`
checks every string against the source text when the folder is on the machine.

**Scholarly review is still required before release.** The documents say so
themselves: Arabic, diacritics, Hadith/Qur'an references and Fiqh details
need qualified verification. The app shows this on the course home and on
every edition page.

## Lesson flow

Age edition → 9 journeys → lesson, in six steps that follow the source
learning page: Discover (story) → Understand (teaching, Arabic, evidence) →
Questions & Answers (tap each card to reveal the printed answer) → Reflect &
Decide (teacher answer revealed after deciding; Volume 01 has no Decide) →
Practise (daily action, Try It Together, key words) → Remember (self-check
boxes, parent note) → summary with an optional "did you try it?" reflection.

Progress is stored on the device per learner scope
(`imaan.taleem.v1.<scope>`, `DeviceTaleemProgressStore`). No points, no
Firebase writes, and nothing grades faith or worship.

## Gaps

* **End matter not imported.** Each volume ends with printable practice
  pages / practice workshops (prayer-name lists, Wudu reminder, statement
  sorting tables), a source-chapter crosswalk, the editorial source register
  and a safeguarding checklist. These are paper worksheets or editor notes;
  they would need their own interactive design.
* **Q&A is reveal-and-check, not multiple choice.** The source prints one
  answer per question; inventing wrong options would add unsourced religious
  content, so learners think first and then reveal.
* **Arabic.** Only Volume 01 Lesson 02 prints Arabic (Kalimah Tayyibah and
  Shahadah). Imaan Mujmal / Mufassal and the cited verses are referenced, not
  printed; they must come from a verified Mushaf/text. No recitation audio.
* **Workbook prompts** ("My picture, question or idea", "My next small
  step: ____") are omitted; the daily action and reflection cover them.
* No illustrations per lesson; the source DOCX has none in the extracted text.
* ﷺ is drawn with the bundled Noto Naskh Arabic as a font fallback, because
  the Latin fonts have no glyph for it.
