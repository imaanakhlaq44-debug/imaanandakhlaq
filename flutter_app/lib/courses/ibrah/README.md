# IBRAH Junior / Qisas-ul-Nabiyeen (course index 5)

Status 15 Nov 2026: **all 24 volumes are playable** (200 stories, 280 missions).
None are left. Everything still needs scholarly review before release (see below).

## Flow

Prophet list (24 volume cards) → volume page → **stories** (read, mark as read)
→ **missions** in four steps, following the Hadith lesson flow:

1. **Discover** – the mission card's Qur'an/Arabic, meaning, explanation and the
   fictional Imaan & Akhlaq situation. Cards that only cite a verse (Shuʿayb,
   Dawud, …) show the matching āyah from the volume's own source library.
2. **Decide** – the source question and choices with the source feedback. The
   right choice must be found to continue; wrong choices retry without penalty.
3. **Daily action** – the one action from the source.
4. **Remember** – reflection/vocabulary lines from the source, plus a private
   "Practised / Still learning / Skip" self-check.

→ **Volume review**: match the volume's Arabic passages to their meaning guides,
then the volume's closing synthesis. No points, no leaderboards.

Progress: `DeviceIbrahProgressStore`, key `imaan.ibrah.v1.<scope>` in
SharedPreferences, one document per learner scope. No Firebase writes.

## Files

| File | What |
|---|---|
| `ibrah_course.dart` | `ibrahCourse` CourseEntry |
| `ibrah_data.dart` | models, asset loader, progress store/controller |
| `ibrah_screens.dart` | course, volume, story, mission and review screens |
| `tool/build_ibrah_data.dart` | generator for the JSON (not imported by the app) |
| `assets/data/courses/ibrah-index.json` | the 24 volume cards |
| `assets/data/courses/ibrah-01.json` … `ibrah-24.json` | one volume each |
| `test/courses/ibrah_test.dart` | data, store, play-through, 375 px + 1.6× text |

Regenerate the JSON (from `flutter_app/`):

```
E:\flutter\bin\dart.bat run lib/courses/ibrah/tool/build_ibrah_data.dart
```

## Sources and content rules

Source: the **later 24-file IBRAH bundle** of the "imaa and Akhlaq individual
section additions" email thread (3–10 Nov 2026), extracted to
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`
(`extracted/06-IBRAH/*.txt`, originals in `originals/06-IBRAH/*.docx`). Each
volume JSON records its DOCX path and SHA-256 from `inventory.json`.

* Stories, Arabic, references, meanings, questions, choices, feedback and daily
  actions are copied **word for word** by the generator; it only assigns lines
  to screens. Nothing was rewritten or corrected.
* Left out of the child view (still in the source documents): developer and
  release notes, mission IDs, age-adaptation tables, mini-game build
  instructions, and Idris's "For other choices" note (it is addressed to
  developers). Where a wrong choice has no source feedback (Idris, Nuh) the app
  shows its own neutral line: "Not quite. Read the guidance again and try
  another choice."
* Volume 12 (Shuʿayb) repeats two production instructions inside its mission
  cards ("Read/listen to the cited verse… Present a short age-appropriate
  explanation…"); the generator removes those sentences only.
* App-written UI text (headings, buttons, the fiction notice) is not religious
  content.

## Before release

* Every document says it is a working edition needing scholarly, Arabic
  (muṣḥaf), translation and child-safeguarding review. Each volume page shows
  its own review line; the course list shows a review notice.
* Volume 7 (Lūṭ) includes the source's verses and meaning guides about the
  people of Lūṭ; reviewers should confirm the age treatment.
* Bespoke mini-games from the documents (scales, sorters, etc.) are not built;
  the interactive parts are the decision cards and the review matching game.
* Arabic recitation audio is not included.
* Volumes with few library passages have short reviews (Al-Yasaʿ 2, Dhul-Kifl 3).
