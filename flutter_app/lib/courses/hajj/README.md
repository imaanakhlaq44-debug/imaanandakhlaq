# Journey to the Holy Cities (Safar al-Haramayn) — Hajj & Umrah

Course index 6. Opens through `hajjCourse` in `hajj_course.dart`.

**Status: draft for scholarly review.** Every dua, ruling, sequence and
reference is shown word for word from the guide. Nothing has been checked by
a scholar yet. The guide itself requires that check before release (section 1,
"All religious rulings…", and the "Editorial workflow" in section 15).

## Source

* `Imaan_Akhlaq_Kids_Hajj_Umrah_Gamified_Curriculum_Developer_Guide.docx`,
  Version 1.0, 6 November 2026 (email thread "imaa and Akhlaq individual
  section additions", 3–10 Nov 2026).
* Extracted text:
  `C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14\extracted\07-Hajj-Umrah\…Developer_Guide.txt`
  (975 paragraphs).
* `assets/data/courses/hajj-course.json` is **generated** from that text by
  `tool/gen_hajj_course.dart`. No one types the content by hand. To rebuild it:

  ```
  E:\flutter\bin\dart.bat run lib/courses/hajj/tool/gen_hajj_course.dart "<extracted .txt>" assets/data/courses/hajj-course.json
  ```

  The generator fails if the guide's structure changes. That covers the 24
  worlds and 72 missions, the 14 duas, the 24 decision-bank items, the 40 days,
  the 10 site cards, the 10 FAQs and the 16 sources.

## What is built

| Guide section | In the app |
|---|---|
| 4 World map: Umrah U01–U10, Hajj H01–H12, Explore Z01–Z02 | Three adventures → worlds (story beat) → 3 missions each, 72 in all |
| 5–7 Missions (Teach / Play / Extend / Daily action / Evidence) | Mission steps: Story → Learn → Dua echo (when linked) → Try it → Daily action → notebook page |
| 8 Scripted scenes 01–06 | The dialogue appears on the first mission of U01, U05, U07, H05, H07 and Z02, labelled as fictional. Each scene's learning check is used as a check |
| 6 Hajj safety + status gate | Banner on the Hajj adventure. There is no "performing Hajj now" mode |
| 3 Three age bands | "Who is learning?" chips (saved per learner). **3–5:** read-aloud banner, the short Talbiyah/Tahlil echo, "We tried it together". **6–9:** the Play brief. **10–14:** the Extend brief ("Go deeper") and the Extend task for practice-only missions |
| 9 Progress feedback, DEV CHECK | Three states: Heard the story / Understood the idea (learning completed) / Practised the value (**only a grown-up can mark this**). No points, no scores, no leaderboard. Missions can be replayed (T30) |
| 9 Muhasabah | One of the three prompts on each notebook page, with "Yes" / "I need another try". It is private and optional |
| 10 Dua studio D01–D14 | Arabic (NotoNaskhArabic), meaning, source and teaching note, plus "Hide words", "I practised this today" and a revisit-tomorrow note |
| 7 Historical-site cards | "Makkah & Madinah places": 10 cards, each with its classification |
| 11 Decision bank Q01–Q24 | Each item is a check on one mission of its own world (every item used once) |
| 12 Forty days | 40 actions as private ticks. No streaks; missing a day is fine |
| 1, 6, 13C, 14, 17 | Parent Corner (behind a grown-up prompt): promise, boundaries, Tamattu‘/Qiran/Ifrad glossary, Hajj-days teaching map + DEV NOTE, companion rules, 10 FAQs, S01–S16 with links, final warning, and "Clear Journey progress" (T22) |
| 13D "Ask my guardian" on every page (T25) | Hand icon in every app bar. It opens the guide's "lost, unwell or overheated" answer |

Progress is stored on the device only (`DeviceHajjProgressStore`, key
`imaan.hajj.v1.<scope>`), following the same pattern as
`DeviceHadithProgressStore`. Nothing is written to Firebase.

## Editorial choices (not stated in the guide; need review)

The guide's missions are production briefs. The links below are where this
build attached material to a mission. Each link is asserted against the source
text in the generator:

* **Dua per mission.** The guide does not assign duas to missions. Duas were
  attached by context: U01.2 D03, U02.2 D04, U03.3 D01 (Talbiyah, S07),
  U04.1 D06+D07, U05.3 D02 ("useful during Tawaf"), U06.3 D05, U07.1 D10+D09
  (Safa/Marwah), H03.2 D01, H03.3 D13, H04.3 D12, H05.2 D04, H06.2 D11,
  H07.3 D08 (Takbir, with no throwing animation, as its note asks), Z01.1 D06
  and Z02.1 D14.
* **Short echo.** For D01 and D09 this is the exact Arabic before the first
  "،". It follows the teaching notes "Short echo for younger ages" and
  "younger learners repeat first phrase".
* **Checks.** Each check uses only the guide's own question and answer.
  Questions answered Yes/No get Yes/No buttons; the others use "think, then
  show the answer". No wrong options were invented. The check placement
  (for example Q18 on H07.1 and Q21 on H10.3) is this build's choice.
* **Play interactions.** These were built only where the guide names the
  items:
  * sequences: U01.2 (Extend text), U10.1 (T07), U04.3, H02.1 (Tamattu‘
    glossary row), H04.1 and H12.1 (chronological map);
  * counting seven: U05.2, H07.1, and U07.2 (lengths labelled
    Safa→Marwah / Marwah→Safa, per Scene 03 and T08);
  * two-option choices where the Play brief names both options: U01.3, U05.3,
    H07.2, H08.2, H10.3.

  The other 37 missions show their Play/Extend brief as a "Try it" card with
  an "I tried it" tick.
* **UI wording.** Short app phrases such as "That is the kind, safe choice.",
  "Not yet — try another card" and "Ask my guardian" are interface wording,
  not curriculum content.

## Gaps (named in the guide, not built here)

* **Audio.** There is no Arabic recitation, line-by-line replay or "Repeat
  slowly" (sections 10 and 13D); this needs a qualified reciter. There are no
  narrated episodes either, so the 3–5 band relies on a grown-up reading
  aloud rather than "no reading dependence" (T01).
* **Transliteration and Urdu.** The guide supplies English meanings only.
  Urdu and transliteration need separately reviewed text (T23).
* **Illustrations.** There are no illustrations, maps or picture cards for
  "Find the Ka‘bah in the picture", "Place Mina on a map" and similar tasks.
  Those missions show the brief as text.
* **Question metadata.** The decision bank has no hints or incorrect-answer
  feedback. The developer rule in section 11 asks for them, but the guide
  does not provide them.
* **Parent gate.** It is a simple "I am a grown-up" prompt, not a verified
  guardian account. There is no travel/companion mode, no PolicyPack expiry
  and no FiqhVariant engine (13A/13C). The Parent Corner is reference reading
  only and never certifies rites (T04).
* **Other modes.** There is no Teacher Desk, printable sheets or classroom
  mode (MVP 4). There is no reduced-motion setting beyond the system one,
  although `Reveal` respects the system "disable animations" setting.

## Tests

`test/courses/hajj_test.dart` checks:

* the registry wiring;
* the 24/72 structure;
* the verbatim Talbiyah and D03 code points;
* the T07/T08 sequences;
* that there are no points;
* store scopes and data corruption;
* the full flow from the map, including the grown-up mark;
* **all 72 missions played to the end**;
* 320 px at 1.6× text for every age band;
* the Dua Studio, 40-day path, Parent Corner and clearing progress;
* save failure and retry;
* "Ask a trusted adult".
