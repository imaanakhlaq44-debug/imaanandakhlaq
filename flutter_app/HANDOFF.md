# Imaan & Akhlaq — current Flutter handoff

Updated: 15 November 2026, Asia/Karachi.

## Saved project

Active Flutter code: `E:\Almas\almas_app\imaan\flutter_app`
Original app and backend: `E:\Almas\almas_app\imaan`
Flutter SDK: `E:\flutter\bin\flutter.bat`
ADB: `E:\AndroidSDK\platform-tools\adb.exe`

Continue in this existing project. Do not recreate or reset it. Current files are saved on disk; they are not committed to Git. Preserve the other uncommitted backend work.

## Latest version and phone installation

Version: **1.5.1+40**.
Optimized arm64 testing APK: `E:\Almas\almas_app\imaan\flutter_app\build\app\outputs\flutter-apk\app-profile.apk`.
Installed successfully on Huawei STK_L21, serial `4TKNW20424002564`, without clearing app data or uninstalling.
Testing package: `com.imaanakhlaq.flutterdev`; activity: `com.imaanakhlaq.MainActivity`.
The app was left on Individual Home after native checks. The older debug APK is not the latest build.

## Current mobile flow

- Original splash, then Individual and School buttons.
- Individual opens the learning home; School opens the common login directly.
- ONE login form accepts email, TCH teacher usernames and PAR family usernames. There are no four role-specific login cards.
- The authenticated server profile determines the workspace, regardless of the entry button. Entry buttons never grant permissions. Missing/unknown profiles remain blocked.
- Individual signup and school registration remain separate. Teachers and families receive accounts from their school.
- Families see their linked children through the existing ownership stream; unlinking removes child access.

## Current design requirements

Think and design as a native mobile app. The user explicitly rejected website-like layouts, large wordy cards, repeated toolbars and separate login routes.

- Compact reading hero with original character artwork and playback-style reading control.
- Outlined white subject tiles in three columns; narrow screens and large text fall back to two columns.
- Ninth home tile opens the adventure map. Bottom navigation stays available.
- Guest inner screens use normal titles; repeated brand/sign-in toolbars were removed. Account actions are in Profile.
- Consistent native buttons and touch targets; scrollable forms support keyboards and large text.
- Original brand: navy `#1E2D5A`, pink `#D63678`, orange `#E08020`.
- Preserve the user's approved character identities, actual Book 1 cover in the reading artwork, walking characters on the map, and corrected small colored text-only pin positions.
- Original character references: `C:\Users\Almas\OneDrive\Desktop\imaan akhlaq`.

## Existing learning content

Five playable Individual Hadith lessons are available from Home, Map and Learn:
1. Truth Lights the Way — Bukhari 6094.
2. A Promise Matters — Bukhari 33.
3. Choose Kind Words — Bukhari 6018.
4. Safe Hands, Safe Words — Bukhari 10.
5. Beautiful Character — Bukhari 3559.

Each has story, Arabic/meaning, memory practice, quiz, daily action and optional reflection. Progress is device-local and isolated by guest/learner scope; it does not synchronize to Firebase or award school points. Reviewed audio remains pending.

The extracted email package has 52 working-set DOCX files and their text extractions:
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas\imaan-email-content-2026-11-14`
Read its README.md and INDEX.md for the eight curricula and missing/duplicate sources. Most content is extracted, not yet implemented as playable lessons.

## Verification

- **42 tests passed** in the final normal run, including visual comparisons.
- Static analysis: **no issues**.
- Android profile APK built and installed successfully.
- Native phone checks: entry, home, home-to-map shortcut, Profile/common login, School/common login, keyboard and Android back behavior.
- Recent AndroidRuntime/Flutter error logs were empty during the check.
- Automatic role/login tests use a fake repository. Successful live Firebase login, production registration and email delivery were not verified with real credentials.

Actual phone screenshots and final test logs are in:
`C:\Users\Almas\OneDrive\Documents\ChatGPT\Almas`
Files: `mobile-phone-home-final.png`, `mobile-phone-login.png`, `mobile-phone-school-login.png`, `mobile-tests-final.log`, `mobile-build.log`.

## Run and build

From the Flutter project directory:

```powershell
& 'E:\flutter\bin\flutter.bat' test --no-pub
& 'E:\flutter\bin\flutter.bat' analyze --no-pub
& 'E:\flutter\bin\flutter.bat' build apk --profile --no-pub --target-platform android-arm64 --dart-define-from-file=config/firebase.local.json
& 'E:\AndroidSDK\platform-tools\adb.exe' install -r build\app\outputs\flutter-apk\app-profile.apk
```

For browser/pane preview, first check whether port 5174 already has a server:

```powershell
& 'E:\flutter\bin\flutter.bat' run --no-pub -d web-server --web-hostname 127.0.0.1 --web-port 5174 --dart-define-from-file=config/firebase.local.json
```

Local Firebase configuration exists under `config/firebase.local.json`. Keep it private and do not commit it. The profile build uses debug signing and the testing package ID; production signing remains separate.

## Remaining work

- Full native teacher/admin tools, class management/reviews, parent PIN and club/house parity.
- Remaining curricula, remaining 95 Hadith lessons, reviewed audio and cloud Hadith progress.
- Prepared `saveLearnerActivity` backend callable has not been deployed.
- Original wider audit findings are not all resolved. No production deployment/data migration was performed in the mobile refresh.

## Files to read next

- `MOBILE_REFRESH.md` — latest mobile redesign and phone verification.
- `HADITH_DEMO.md` — five-lesson provenance/storage.
- `ASSET_SOURCES.md` — artwork/font sources.
- `ENTRY_FLOW_REVIEW.md`, `GUIDE_ALIGNMENT.md` — original flow review; old separate-login UI descriptions are superseded by this note and MOBILE_REFRESH.md.
- Original project: `FINALIZED_APP_RULES.md`, `FAMILY_ACCOUNT_PLAN.md`.
- Workspace: `imaan-audit-2026-11-14.md`.

Main source files: `lib/app.dart`, `lib/app_theme.dart`, `lib/screens/entry_screens.dart`, `welcome_screen.dart`, `auth_screen.dart`, `signup_screen.dart`, `guest_shell.dart`, `learner_shell.dart`, `learning_experience.dart`, `family_screen.dart`, `hadith_screen.dart`, and `lib/data/hadith_course.dart`.

Workspace implementation scripts/staging folders are historical helpers, not the active app. Do not rerun them over current code.