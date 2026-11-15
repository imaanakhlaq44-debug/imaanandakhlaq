# My Salah Journey (course index 3)

## Source

One document from the "imaa and Akhlaq individual section additions" email
thread (3–10 Nov 2026), extracted on 14 Nov 2026:

* `originals/04-Salah/Imaan_Akhlaq_My_Salah_Journey_COMPLETE_Curriculum_and_Developer_Manual.docx`
* `extracted/04-Salah/…Developer_Manual.txt`, under
  `C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`

`assets/data/courses/salah-journey.json` is **generated** from the extracted
text by `gen_salah_json.js` in this folder:

```
node lib/courses/salah/gen_salah_json.js <extracted .txt> assets/data/courses/salah-journey.json
```

Every Arabic text, Urdu meaning, English meaning, scene, lesson text, daily
action, evidence anchor, guardrail, table and Fiqh note is copied word for
word. A check run on 15 Nov 2026 confirmed that each of these fields appears
verbatim in the source text. The test locks the Arabic with a fingerprint,
so any change to a letter or mark fails until someone reviews it.

| App part | Manual section |
|---|---|
| 8 worlds (Getting Ready + 7) | Part I §6–13 (discover, evidence, outcome, teaching flow, scholarly note) |
| 30 missions P1–B2 | Part II A (scene, what the child learns, check, feedback, daily action, evidence anchor, guardrail) |
| "Try again" message | Part II A, try-again line (same for every mission) |
| Mission tables (F6, F7, S3, W2, J2, B2) | Part II B2, Part I §7, B5, B6, B8, B10 |
| Recitation library R01–R18 | Part I §15 (Arabic, source, editorial note) + Part II C (child meaning, Urdu, memorization plan) |
| Surah al-Fatihah | Part II C1 |
| Respecting differences | Part II D, D1 and Part I §14 (Raf‘ al-Yadayn, child text used verbatim) |
| Tasbih notice | Part II B10 "Prominent notice" |
| Source links | Only URLs listed in the manual's own registers (§22 and H) |

## How a mission plays

Story → Learn (lesson text, table, respect note, evidence + links) → Words
(only when the mission has linked recitations) → Check (must pick the
manual's correct answer; a wrong pick shows the manual's try-again text) →
Practise (daily action + grown-up guardrail) → summary with an optional
"did you try it?" reflection.

Progress: `DeviceSalahProgressStore`, key `imaan.salah.v1.<scope>`, on the
device only. No points, no streaks, no Firebase writes.

## What was authored (not in the source)

* Short question stems and the split of each check into answer buttons. The
  options use the question's own wording. Two checks needed distractors the
  manual does not give: **F4** ("Ruku") and **B2** ("65", "300", both taken
  from the B10 count table).
* Which recitations appear in which mission (`recitsFor` in the generator),
  chosen from each world's "Recitations to connect" line and mission topic.
* UI copy: headings, button labels, the Janazah "learn with a grown-up"
  notice, "Audio coming after review", the course hero line (taken from the
  catalog subtitle).

## Gaps and decisions for the reviewers

* **Scholarly review pending.** The manual says: "NO GO-LIVE until the final
  Arabic and method paths are source-locked and the reviewer sign-off sheet
  is completed." The app shows a review notice on the course home and in the
  library.
* **No audio.** Every recitation shows an "Audio coming after review" slot.
  No audio is generated or synthesised.
* **No method profile.** The manual wants a guardian-selected Fiqh profile
  (Hanafi / Shafi‘i / Maliki / Hanbali / unselected) that controls detailed
  steps. That setting does not exist yet, so the app shows the comparisons
  as the manual writes them (W2, J2 tables) plus "Ask your family or teacher
  for the detailed method".
* **Hanafi Thana and Hanafi Qunut** are named in the manual but their texts
  are not supplied (C2 lists them as future library items). They are not in
  the app.
* **Janazah Salawat reference.** World Five says "R13 Salawat", but R13 is
  the after-Salah remembrance and the Salawat is R09. Left as written in the
  world note; no recitation is attached to J2.
* **Evidence without a register link.** Several mission anchors (e.g. Qur’an
  5:6, Bukhari 164, 756, 757, 722, 1117, 6464, Muslim 226, Tirmidhi 415) have
  no URL in the manual, so they are shown as text only.
* **Al-Fatihah** comes from the manual's C1 line. The manual says to link
  the approved Qur’an text from the Hifz module and segment by verified verse
  boundaries; it is shown whole, unsegmented, until that module exists.
* **Wudu.** P3 is a short refresher; the manual asks for a separate
  jurist-approved full Wudu unit, which is not in the source.
* **Not built:** posture animations/"watch" screens, drag-to-order sequence
  builder, spaced review reminders, age modes and guardian gating settings.
  Tasbih (optional) and Janazah missions show a grown-up notice that can be
  declined; Tasbih never counts toward the 28-mission progress.
* **"Watch the calm demonstration"** in the try-again text refers to a
  demonstration the app does not yet have; kept verbatim.
