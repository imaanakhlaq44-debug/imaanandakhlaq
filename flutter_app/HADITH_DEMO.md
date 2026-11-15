# Hadith to Live By: 100 playable lessons

## Content provenance

All 100 lessons are bundled in `assets/data/hadith-demo.json`. The file name stays the same because `pubspec.yaml` lists it.

| Lessons | Worlds | Source document (recorded per lesson in `sourceDocument`) |
|---|---|---|
| 1–50 | 1–10 | `Imaan_Akhlaq_50_Hadith_Curriculum_Interactive_Developer_Edition.docx` (3 November 2026, v1.1) |
| 51–100 | 11–20 | `Imaan_Akhlaq_Hadith_51_to_100_New_Authentic_Actions.docx` |

For lessons 1–50, the base edition (`Imaan_Akhlaq_50_Authentic_Hadith_Character_Action_Curriculum.docx`) was compared field by field with the interactive edition. They are identical.

**Verbatim from the source:** title, Arabic memorization text, the "What it means" text (`meaning`), the "Let's learn" text (`explanation`), the daily action, source reference and URL, and world titles. The memorization label (`label`) is also verbatim, for example "EXCERPT", "NARRATOR'S REPORT; EXCERPT" or "EXCERPT; HASAN GRADING (DARUSSALAM)". `excerpt` is true when that label says EXCERPT. These fields were extracted by script from the email extraction (`imaan-email-content-2026-11-14/extracted/02-Hadith`). Nothing in them was typed by hand or corrected. Lessons 1–5 already in the app matched the source exactly and were kept.

**Written for the app (fictional teaching activities, not quotations or rulings):** story, question, three choices with feedback, and the Arabic chunk break points used on the Remember step. The stories feature Imaan and Akhlaq in modern everyday scenes. They never dramatize the Prophet ﷺ or his Companions. Chunks always join back into the exact source Arabic, and the tests enforce this. Each lesson has 2–4 chunks, and phrases such as صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ are kept whole.

**Scholarly review is still required before public release.** The source documents require it themselves. It covers the Arabic wording, excerpt boundaries, chunk break points, translations, and the age-appropriateness of the authored scenarios. Take extra care with lessons 53, 83, 85 and 92, which the source flags for sensitive adaptation or adult context. The JSON `reviewStatus` field records this.

Each narrator's report (lessons 77, 79, 80, 82, 94, 97, 100) shows "A narrator's report, not words spoken by the Prophet ﷺ". Every lesson also shows its verbatim curriculum note under the reference, so Tirmidhi gradings are never presented as Bukhari/Muslim.

## Implemented flow

Individual → Hadith (Home card, the map's Hadith House or the Learning Hub) → course list → Story → Understand → Remember → Choose → Daily action → optional reflection.

The course list groups lessons into the 20 curriculum worlds as collapsible cards. A world card shows its number, title, lesson range and how many lessons have been explored. Only the world holding the next unexplored lesson opens by default. The navy header shows "x of 100 lessons explored" and a "Start with lesson 1" / "Next: lesson N" button. The list is built lazily (`ListView.builder`), and a world's rows are only built while it is open.

The Remember step can hide/show the Arabic. A wrong choice gives corrective feedback, and the child can try again without penalty. Only the correct choice lets them continue. Saving the daily-action plan records that the lesson was explored, not that worship or the action was performed. Reflection offers Yes / I tried / Not yet without penalties. There are no reward points and no changes to school-approved chapter records.

School learners keep the existing course preview until the school assignment/review workflows are migrated.

## Saved progress

`DeviceHadithProgressStore` saves to device storage (`SharedPreferencesAsync`), separated by guest or learner scope. Each lesson's entry holds the current step, the chosen answer, the exploration date and the optional reflection. Existing lesson IDs (`hadith-01`…) are unchanged, so earlier progress on lessons 1–5 still loads. This is device-local only: no Firebase sync, teacher approval or backup.

## Assets and performance

The JSON (~185 KB) is bundled and parsed once. Lessons and worlds come from one parse. No PDF, remote image or audio is downloaded. Arabic uses the bundled Noto Naskh Arabic font (SIL OFL). No final Arabic audio was supplied, so none is simulated.

## Verification

`flutter analyze` is clean, and `flutter test` passes (67 tests, 10 of them for Hadith). The Hadith tests check:

* **Registry:** all 100 lessons in order. Unique primary references whose URL matches the reference. Every chunk set joins back to the exact Arabic. Exactly one correct choice per lesson. Excerpt flag matches the label. World numbers and source documents are correct. Narrator's reports are labelled.
* **Worlds:** 20 worlds of five lessons each.
* **Every lesson plays:** each of the 100 lessons is opened from its world in the list, with a wrong choice (feedback shown), then the correct choice, then its action and the saved plan.
* **Continue and labels:** "Next: lesson 77" opens lesson 77, which shows its narrator note and curriculum note.
* **Small screens:** a 320 px phone at 1.6× text, with every world header open, plus all steps of lesson 94, the longest Arabic passage.
* **Earlier checks kept:** storage isolation, corrupted storage, failed saves, and the school gate.

The course and Understand golden screenshots were regenerated.

## Rebuilding the JSON

The extraction/merge scripts used for this import live outside the repo. To change an authored activity, edit the lesson in the JSON directly and keep `chunks.join(' ') == arabic`. Never edit the verbatim source fields without a new source document.
