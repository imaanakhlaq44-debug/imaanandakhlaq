# Imaan & Akhlaq — native Flutter migration

This is an incremental native rebuild of the existing web/Capacitor app. It shares the existing Firebase identities and document IDs. It does not replace the website or deploy backend rules automatically.

## Current working scope

* Email and existing PAR-/TCH-username login using Firebase Auth.
* Session restoration, missing-profile errors, retry, and sign out.
* Live family child selection, claim-code callable, and access revocation handling.
* Native learner dashboard and existing bundled book/chapter catalogue.
* On-demand native PDF reader with chapter start page.
* Reflection and daily activity grid, explicit progress save, and submit for review using legacy document IDs.
* Approved sheets are read-only; submission transactions recheck concurrent teacher approval. No client-side point awards.
* Eight Learning Hub course descriptions, explicitly marked in preparation.

Teacher/admin dashboards, phone lookup, attendance, parent notes, club/rewards, full new curriculum lessons, Urdu localization, audio/revision engine and release signing are pending. Staff accounts can sign in but are shown a migration notice. This is a development build, not feature parity or a production release.

## Setup and run

From the parent project run `powershell -File flutter_app/tool/configure-local.ps1`.
It derives public Firebase client configuration from the existing `.env` and Android `google-services.json`. The generated `config/firebase.local.json` is ignored. Never put private service-account credentials here.

From this directory:

```
E:\flutter\bin\flutter.bat pub get
E:\flutter\bin\flutter.bat analyze
E:\flutter\bin\flutter.bat test
E:\flutter\bin\flutter.bat run --dart-define-from-file=config/firebase.local.json
E:\flutter\bin\flutter.bat build apk --debug --dart-define-from-file=config/firebase.local.json
```

For local Firebase emulators add `--dart-define=FIREBASE_EMULATOR_HOST=10.0.2.2` on an Android emulator, or `127.0.0.1` for Chrome. Use a dedicated test Firebase project configuration for destructive emulator tests. Release builds reject emulator mode.

## Performance and mobile decisions

* Catalogue is bundled, decoded once per app process; dashboards do not download books or media.
* Native widgets and lazy lists replace injected HTML and WebViews.
* PDFs load on demand; the reader bounds rendering cache by default.
* Queries are scoped to the signed-in family; no global user or leaderboard fetch on app launch.
* Data streams are created outside widget build methods and disposed by StreamBuilder.
* Text fields, scrollable forms, system text scaling, safe areas, keyboard resize and labelled controls are used throughout.
* No large curriculum/audio bundle is included in this initial binary.

## Compatibility and security

* Activity IDs remain `{student_uid}_{chapter_id}`.
* School learners edit today's column; individuals may practise across all days.
* A family UID is never used as the student UID.
* Profile progress is read from legacy data; authoritative progress migration is still pending.
* Drafts use a separate activity_drafts/flutter_{uid}_{chapter} document. Only Submit writes the teacher-facing submission. Existing web drafts are not imported yet.
* Save requires the new saveLearnerActivity callable. It transactionally checks ownership, school weekdays, and teacher approval on the server. Failed saves retain the unsaved editor state. Individual work uses self_completed and does not award points or teacher approval.
* Existing Firestore rules still have audit findings. Client checks cannot fix server authorization. Resolve these before production rollout.
* Android application ID remains `com.imaanakhlaq` for eventual upgrade compatibility. Debug uses `.flutterdev` so testing cannot overwrite the existing installed app. A matching Firebase registration/restrictions must be verified for this debug identity before live sign-in testing.
* Release uses the original ID but requires deliberate production signing and version-code selection. Never distribute a debug-signed build as a store update.

## Migration sequence

1. Native learner vertical slice and tests (this increment).
2. Emulator-backed authorization fixes; authoritative progress/awards, attendance and teacher review.
3. Family/teacher/admin feature parity and localization.
4. Reusable lesson/audio/revision engine; editorially approved course import.
5. Offline recovery, accessibility and device profiling; release signing and staged rollout.

Zero defects cannot be guaranteed. Track verified behavior, known limitations and measured performance; do not equate static checks or widget tests with real-device end-to-end coverage.

## Backend deployment prerequisite
The new saveLearnerActivity export and native-catalog.json are prepared in ../functions. They have NOT been deployed. Before any real activity-save test, deploy this callable to a dedicated staging project or run it in Firebase emulators. The development client reports an error if this function is absent. Existing production rules and callable functions are unchanged until an explicit deployment.

Backend unit regression command: node --test functions/native-activities.node-test.cjs (from the parent project). These use an in-memory transaction adapter and do not establish Firestore/emulator integration correctness.


## Verified in this increment — 14 November 2026

* Flutter 3.44.3 / Dart 3.12.2, analyzer: no issues.
* 21 Flutter domain/widget/visual/registration tests passed, including failed login/retry, family access revocation, system back, sign-out route disposal, failed saves, and 1.6x text scaling at 390x844.
* 10 backend unit tests passed. Transaction behavior uses an in-memory adapter; real Firestore integration and concurrency remain to be tested in emulators.
* Android debug APK builds successfully. No production deployment or store release was performed.
* Golden screenshots were visually inspected with bundled fonts. They are not a real-device performance benchmark.
* Android Kotlin incremental compilation is disabled in this checkout to work around cross-drive Pub cache paths on Windows.
* Real-device startup/frame/memory profiling, authenticated Firebase integration, offline recovery and native PDF rendering on Android are still required before release.


## Brand and entry-flow correction
Guest entry now opens the original navy/pink/orange branded home, with Sign in, Create account and learning previews. Native registration supports individual and school accounts using isolated Firebase Auth sessions, profile-first creation, error recovery and verification links. School families and teachers retain school-provisioned login. See GUIDE_ALIGNMENT.md for the exact email-guide requirements and remaining curriculum scope.



## Selected mobile design

Home now follows the approved Smart Dashboard: compact continue card, eight illustrated course tiles and a small daily action. A separate Map tab opens the Amanpur adventure map, with native tappable destinations. Bottom tabs are Home, Map, Learn, Books and Progress/Profile. Guests can explore the same layout and retain Sign in/Create account entry points.

Original Imaan/Akhlaq assets from the user's supplied folder are used throughout; see ASSET_SOURCES.md. Draft courses open honest preparation details; Story Library opens the existing book catalogue. Continue chooses a real next chapter from the existing catalogue and recorded progress. No sample lesson progress is presented as real data.

Verification: 25 Flutter tests pass, covering map routes, actual chapter continuation, account flows, original UI regression coverage and narrow/large-text layouts. Generated home/map screenshots were visually inspected.
