# Mobile refresh — 15 November 2026

Active project: `E:\Almas\almas_app\imaan\flutter_app`

This update supersedes the old four-card school portal and role-specific sign-in guidance in earlier notes.

## Current behavior

- Original splash, then two mobile entry buttons: Individual and School.
- Individual opens the guest learning home. School opens the common sign-in form directly.
- One `AuthScreen` accepts email, TCH teacher usernames and PAR family usernames through the existing `loginEmail` mapping and Firebase sign-in.
- The authenticated server profile determines the workspace. The entry button does not restrict or grant an account role. Unknown or missing profiles stay blocked.
- Individual and school registration remain separate; teachers and families still receive accounts from their school. School registration is a link on the common login, not a separate login card.
- Compact home: original reading characters, rounded lower hero corners, playback-style reading action, outlined three-column subject grid and working ninth Adventure map shortcut. Narrow screens or large text use two columns.
- Inner guest tabs have normal screen titles; repeated brand/login toolbars are removed. Authentication actions live in Profile.
- Native controls use consistent 48–54 logical pixel tap areas. The bottom navigation is 64 pixels plus system insets.
- Approved map art, pin positions, brand colors, local Hadith progress and ownership restrictions are preserved.

## Android testing build

Version `1.5.1+40`. The profile build uses AOT compilation, debug signing, and application ID `com.imaanakhlaq.flutterdev` to update the existing testing app without replacing the older production app.

```powershell
Set-Location -LiteralPath 'E:\Almas\almas_app\imaan\flutter_app'
& 'E:\flutter\bin\flutter.bat' build apk --profile --no-pub --target-platform android-arm64 --dart-define-from-file=config/firebase.local.json
& 'E:\AndroidSDK\platform-tools\adb.exe' install -r build\app\outputs\flutter-apk\app-profile.apk
```

Do not use this signing setup for store publication. Keep the local Firebase configuration private.

## Verification scope

The regression suite covers one-form sign-in with all four account roles using a fake repository, invalid child-code rejection, role routing from either entry, registration, large text with an on-screen keyboard, native back behavior, map navigation and the existing Hadith lessons. Automated role tests do not establish live Firebase credentials or production email delivery.

Teacher/admin full tools, remaining curricula and cloud Hadith synchronization remain pending as documented in `HANDOFF.md`. No backend deployment or production data migration is part of this visual update.

## Verified result

- 42 tests passed in the normal comparison run (not only golden generation).
- Static analysis: no issues.
- Android profile build completed; 48.1 MB, arm64, versionName 1.5.1/versionCode 40.
- `adb install -r`: Success on Huawei STK_L21, serial 4TKNW20424002564. No data clear or uninstall performed.
- Installed app opened successfully. Native entry/home, working home-to-map shortcut, Profile login, School direct common login, keyboard opening and Android back navigation were checked. Recent AndroidRuntime/Flutter error logs were empty at the end of the check.
- Actual device screenshots are saved in the shared workspace as `mobile-phone-home-final.png`, `mobile-phone-login.png`, and `mobile-phone-school-login.png`.
- The app was left on Individual Home for the user to review.
- Role login routing was tested with a fake repository. No real credentials were supplied and no live successful sign-in or account creation is claimed.
