# Adding the email curriculum, one course at a time

Source: the "imaa and Akhlaq individual section additions" email thread
(3–10 Nov 2026), already extracted to
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`
(`README.md`, `INDEX.md`, `extracted/` text, `originals/` DOCX).

Status on 15 Nov 2026: only 5 Hadith lessons are playable. Every other
section shows "In preparation".

## Ownership: each course touches only its own files

| Course | Index | Code | Data |
|---|---:|---|---|
| My Qur'an Companion | 0 | `lib/courses/quran/` | `assets/data/courses/quran-*.json` |
| Hadith to Live By | 1 | `lib/data/hadith_course.dart`, `lib/screens/hadith_screen.dart` | `assets/data/hadith-demo.json` |
| Zad al-Qulub Junior (Duas) | 2 | `lib/courses/duas/` | `assets/data/courses/duas-*.json` |
| My Salah Journey | 3 | `lib/courses/salah/` | `assets/data/courses/salah-*.json` |
| Tafsir Through Stories | 4 | `lib/courses/tafsir/` | `assets/data/courses/tafsir-*.json` |
| IBRAH Junior (Prophets) | 5 | `lib/courses/ibrah/` | `assets/data/courses/ibrah-*.json` |
| Hajj & Umrah | 6 | `lib/courses/hajj/` | `assets/data/courses/hajj-*.json` |
| Taleem-ul-Islam | 7 | `lib/courses/taleem/` | `assets/data/courses/taleem-*.json` |

Tests go in `test/courses/<course>_test.dart`.

A course becomes playable by setting its `CourseEntry` in
`lib/courses/<course>/<course>_course.dart` (subtitle + `open(scope)`).
`lib/courses/registry.dart`, `pubspec.yaml` and the shared screens already
route to it; do not edit them, `ui_kit.dart`, or another course's files.
Reuse `lib/screens/ui_kit.dart` (displayStyle, cards, Reveal, Pressable) and
follow the Hadith lesson flow in `hadith_screen.dart` as the pattern.

## Content rules

* Arabic, Qur'an, Hadith and Dua text, references and meanings come word for
  word from the source DOCX/extracted text. Never invent or "fix" them.
* Record the source document for every lesson in the JSON, as hadith-demo.json
  does, and note that scholarly review is still required before release.
* Progress stays on the device per `scope` (see DeviceHadithProgressStore),
  no points and no Firebase writes.
* Mobile first: 375 px wide and large text must not overflow.
