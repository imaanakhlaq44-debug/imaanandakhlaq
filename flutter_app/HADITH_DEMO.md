# Hadith: five-lesson playable preview

## Content provenance

The Arabic passages, lesson names, child-friendly meanings, explanations, daily actions and source references come from the supplied `Imaan_Akhlaq_50_Hadith_Curriculum_Interactive_Developer_Edition.docx` (3 November 2026, version 1.1), extracted from the email thread. The first five entries of World 01, My Words and Honesty, are used.

| Lesson | Source reference |
|---|---|
| Truth Lights the Way | Sahih al-Bukhari 6094 |
| A Promise Matters | Sahih al-Bukhari 33 |
| Choose Kind Words | Sahih al-Bukhari 6018 |
| Safe Hands, Safe Words | Sahih al-Bukhari 10 |
| Beautiful Character | Sahih al-Bukhari 3559 |

Source URLs are retained per lesson. The short memorization fields must not be mistaken for a replacement for the complete narration. Excerpt flags are preserved from the provided curriculum; the source action opens the full narration.

The modern Imaan/Akhlaq scenarios, three-choice questions and formative feedback were authored for this sample as fictional teaching activities. They are not presented as quotations, historical reports, or new religious rules. The Arabic learning chunks recombine into the exact supplied passage. The first source guide itself requires final Arabic/Hadith/pedagogy review before production publication; this sample is not an independent scholarly certification.

## Implemented flow

Individual → Hadith (Home card, map's Hadith House or Learning Hub) → five-lesson list → Story → Understand → Remember → Choose → Daily action → optional reflection.

The memory step can hide/show the Arabic. A mistaken contextual choice gives corrective feedback; the child can try again without penalties. A correct choice permits continuation. Planning a daily action records that the lesson was explored, not that worship or the action was performed. Reflection offers Yes / I tried / Not yet without penalties. There are no reward points or changes to school-approved chapter records.

School learners retain the existing course preview until school assignment/review workflows are migrated. Merely sharing the book reader does not enroll a school child in this Individual preview.

## Saved progress

`DeviceHadithProgressStore` uses the asynchronous preferences API for small local learning state. It saves the current step, chosen answer, exploration date and optional action reflection. Writes are awaited before advancing the screen; errors keep the current step and show retry feedback. Unreadable existing data is not silently overwritten. Storage keys are separated by the guest or learner scope.

This is device/browser-local progress, not Firebase synchronization, teacher approval or a backup. Browser/device storage deletion removes it. No personal mistake description, voice recording or private reflection essay is collected. The existing production activity-saving callable is not used by this preview.

Package documentation: https://pub.dev/packages/shared_preferences

## Assets and performance

The JSON catalogue is bundled and parsed once. No PDF, remote image or audio download occurs when opening these lessons. The story reuses the approved reading illustration, with a bounded decode size. Arabic uses bundled Noto Naskh Arabic from the Google Fonts repository, licensed under SIL OFL; the license text is bundled alongside it.

Font source: https://github.com/google/fonts/tree/main/ofl/notonaskharabic

No final Arabic audio was supplied, so the preview does not simulate playback or use an unreviewed synthesized recitation.

## Verification

40 Flutter tests passed, including all existing entry/account/book/map tests and eight new Hadith tests. Checks cover the source registry and Arabic chunks, learner/guest storage isolation, reopening saved progress, corrupted storage, save failures, wrong/correct answers, all five lesson questions/actions, optional reflection, and small phones with enlarged text. Course, Arabic-reading and quiz screenshots are included in the golden tests. Static analysis passed and the debug Android arm64 APK built successfully. The live browser flow was exercised from the Individual home: story, Arabic reading, hide/recall, incorrect/correct choices, action plan, optional Not yet reflection, then a full page reload. The course restored 1 of 5 lessons explored from real browser storage. The pane was left on the five-lesson list. No production Firebase progress or rewards were written.
