# Handoff: Organisations + Organisation dashboard in the Flutter app

Written 17 Nov 2026 for whoever picks this up next (another account or
session). Read this whole note first. The user writes in Roman Urdu; answer
in Roman Urdu, short and clear.

---

## 0. Where everything is

| What | Where |
|---|---|
| Worktree (all work happens here) | `E:\Almas\almas_app\imaan\.claude\worktrees\app-icon-update-7803ad` |
| Branch | `claude/app-icon-update-7803ad` (NOT pushed, NOT merged to main) |
| Flutter app | `flutter_app/` (Flutter 3.44.3 at `E:\flutter`) |
| Cloud Functions | `functions/` (Node 22, region us-central1) |
| Firestore rules | `firestore.rules` (rules tests: `src/__tests__/rules.test.ts`) |
| Old web app (has the org portal today) | `src/` (Hono/SSG), deployed to Hostinger by `.github/workflows/deploy.yml` from `main` |
| Firebase project | `imaan-app-1d2da` |
| Org design (already written, read it) | `ORG_PORTAL_PLAN.md`, also `PAPER_WORKFLOW_PLAN.md`, `SCHOOL_GROUP_PLAN.md`, `FAMILY_ACCOUNT_PLAN.md` |

Recent commits on the branch (newest first): `b7a1d99` web /app + phone
frame, `717a6ad` guest menu + old FAQ/About, `f0ae620` side menu,
`13b5d29` Individual space for school Gmail, `e1b9e2d` Google sign-in,
password reset, sections, teacher Books.

### What is live right now
- Play Console internal testing: version **62 (2.0.1)** published. Newer
  commits (Individual space, side menu, FAQ/About, phone frame) are NOT in
  an AAB yet. The user said: build the next AAB only after more work.
- Web: **https://www.imaanakhlaq.org/app** = latest build (phone frame,
  side menu, FAQ/About). Upload steps in section 6.
- Firestore rules and `saveLearnerActivity` are deployed (rules include
  section 17 `individual_spaces`).

---

## 1. The task

The user wants the **Organisation portal** (Alkhidmat-style: one
organisation, many schools) inside the new Flutter app (mobile + web
/app), **plus a new Organisation dashboard** so the organisation itself
can see how many schools are running, how many children, activity, etc.

### Decision still open — ask the user first
Should the organisation see **only counts and school-level reports**
(recommended: children's names, photos and PINs stay with their own
school), or also **children's names** (for example top learners per
school)? Build counts-only unless the user says otherwise.

---

## 2. What already exists (old web app + backend)

All of this works today on the old website, NOT in Flutter:

1. Super admin opens `/orgs` (`src/components/OrgsDashboard.tsx`), creates
   an org with `createOrg` (functions/index.js ~line 2883) → join link
   `/join?org=<slug>#<join_token>`. `rotateOrgToken` (~2925) replaces the
   link, `deleteOrg` (~3087), `listOrgs` (~3452).
2. School head opens the join link (`src/components/OrgJoinPage.tsx`):
   `describeOrgInvite` (~3120) shows the org name, `registerSchoolInOrg`
   (~3151) creates the school (`schools.org_id`) and its school_admin
   account. Live at once, no approval.
3. Each school has a children link: `getSchoolLink` (~3402),
   `rotateSchoolLink` (~3420); stored in closed `school_links/{token}`.
4. School issues roll number + 4-digit PIN per child: `issueStudentPins`
   (~3246, max 300 per call), `resetStudentPin` (~3304). PIN stored as
   scrypt hash; shown once for a printed slip.
5. Child opens `/s?org=…&school=…#<token>` (`src/components/StudentPinPage.tsx`),
   types roll no + PIN → `studentSignIn` (~3339) returns a **Firebase
   custom token** for the student's uid. 5 wrong PINs → that child is
   locked 15 minutes (`pin_attempts`).
6. Roster-only children without logins: `createRosterStudents` (~1726);
   paper workflow in `PAPER_WORKFLOW_PLAN.md`.
7. Rules: `firestore.rules` sections 13 (orgs), 14 (pin_attempts), 15
   (school_links). Organisations have **no login of their own** today;
   super admin runs everything.

Flutter today: login is email / `TCH-` / `PAR-` username + password only;
no orgs, no PIN login, no join link. Super admin only gets
`lib/screens/admin_web_screen.dart` (button to the website).

---

## 3. Plan (do in this order, show the user after each part)

### Part 1 — Backend: organisation admin + report
1. New role **`org_admin`** on `users/{uid}`: fields `role: 'org_admin'`,
   `org_id`, `name`, `email`. Created only by super admin (callable
   `createOrgAdmin({org_id, name, email})` → creates Auth user + profile,
   returns a password/reset link the super admin hands over; or invite by
   email reset link). Never self-assignable in rules.
2. Callable **`orgSummary({org_id?})`**: caller must be that org's
   org_admin (or super admin). Returns ONLY aggregates:
   - totals: schools, students, teachers, families, active students this
     week, activities submitted / approved this week and all time;
   - per school: id, name, created_at, students, teachers, active this
     week, submissions this week, last activity date;
   - weekly series (last 8 weeks) of active students and submissions.
   Use Admin SDK `count()` aggregation queries where possible
   (`schools where org_id`, `users where school_id and role`,
   `activity_submissions where school_id and updatedAt >= …`). No child
   names or uids in the response (counts-only decision).
3. Rules: `org_admin` may read `orgs/{org_id}` of their own org and
   `schools where org_id == their org` (name/created_at level only). They
   must NOT read `users`, submissions, PINs or school_links of children.
   Keep `sameSchool()` as the only membership rule for school data (see
   ORG_PORTAL_PLAN §1.1).
4. Org admin may call `rotateOrgToken` for their own org (to replace a
   leaked join link) — extend its caller check.
5. Tests: add to `functions` node tests / `src/__tests__/orgPortal.test.ts`
   (emulator) and `src/__tests__/rules.test.ts`. Run:
   - `node --test functions/*.node-test.cjs`
   - `npm run -s test:rules` (Firestore emulator; ~1–2 min)
   - `npm run -s test:functions` for callables on the emulator
6. Deploy only after the user says yes:
   `npx -y firebase-tools@latest deploy --only firestore:rules,functions:orgSummary,functions:createOrgAdmin,functions:rotateOrgToken --project imaan-app-1d2da --non-interactive`

### Part 2 — Flutter: Organisation dashboard
1. `lib/domain.dart`: add `AccountRole.orgAdmin` ('org_admin') and
   `orgId` on `Profile`.
2. `lib/app.dart` `AccountGate`: route `orgAdmin` → new
   `OrgDashboard`. Section rules (`wrongSectionMessage`): org admin signs
   in from **School**; in Individual they get an Individual space like
   other school logins (`usesIndividualSpace`) — decide and test.
3. New `lib/screens/org_dashboard.dart` (match the soft style of
   `admin_dashboard.dart`; user dislikes loud colours, change only what is
   asked):
   - top stat cards: schools, children, teachers, active this week;
   - school list with search, sorted by activity; a ⚠️ badge for schools
     with no activity for 14 days; tap → school detail (counts only);
   - weekly trend (simple bars, no new chart package needed);
   - "Invite schools" card: copy/share the join link
     (`share_plus` already added), "replace link" (rotateOrgToken);
   - account/menu: sign out, switch section.
4. `lib/data/app_repository.dart`: `orgSummary()`, `orgJoinLink()`,
   `rotateOrgLink()`; add the same to `FakeRepository` in
   `test/app_test.dart` (it `implements AppRepository`).
5. Super admin in Flutter: optional screen to create an org + its admin;
   otherwise keep using the website `/orgs` page.
6. Tests: widget tests for the dashboard at 375 px and text ×1.5, a golden
   like `test/goldens/*.png` (update with `--update-goldens`, then LOOK at
   the png).

### Part 3 — Flutter: join link, PIN slips, child PIN login
1. **School registration from join link** in the app: screen asking
   school name, head's name, email, password → `describeOrgInvite` +
   `registerSchoolInOrg`. On web the link is
   `www.imaanakhlaq.org/app/...`: Flutter web uses hash routing, so the
   token cannot also live in `#`. Use a query param for the app version
   (e.g. `/app/?join=<slug>&t=<token>`) or keep the old website page for
   joining. Decide with the user.
2. **School admin dashboard** (`lib/screens/admin_dashboard.dart`): add
   "Children's PINs" — pick students → `issueStudentPins` → show roll no +
   PIN once with a printable/shareable slip; "reset PIN"; show/copy the
   children link (`getSchoolLink`, `rotateSchoolLink`).
3. **Child login**: on the School login screen add "Student? Use roll
   number + PIN" → school link token + roll no + PIN → `studentSignIn` →
   `FirebaseAuth.signInWithCustomToken`. Show the lockout message after 5
   wrong tries.
4. Tests for each flow (FakeRepository).

---

## 4. How to run and check

- Tests (Windows, from `flutter_app`):
  `cmd //c "E:\\flutter\\bin\\flutter.bat test --no-pub"` (186 pass now)
- Analyze: `cmd //c "E:\\flutter\\bin\\flutter.bat analyze"`
- Format only the files you touch: `cmd //c "E:\\flutter\\bin\\dart.bat format <files>"`
- Local web preview: `.claude/launch.json` config `flutter-web-branch`
  (port 5177, real Firebase). After a rebuild the browser may show the
  OLD build from cache: run in the page
  `for (f of ['/','/main.dart.js','/flutter_bootstrap.js']) await fetch(f,{cache:'reload'}); location.reload()`.
- Config/secrets: Firebase dart-defines in
  `E:\Almas\almas_app\imaan\flutter_app\config\firebase.local.json`
  (main checkout, git-ignored). Never copy keys into the repo or chat.
- Demo school on the emulator: see memory note `demo-school-emulator`
  (logins in `flutter_app/tool/demo/demo-logins.json`, git-ignored).

## 5. Release (only when the user asks)
- Bump `flutter_app/pubspec.yaml` version (now `2.0.1+62`; next `+63`).
- Build AAB (PowerShell, from `flutter_app`):
  `$env:GRADLE_OPTS="-Dorg.gradle.project.releaseKeystoreProperties=E:/Almas/almas_app/imaan/android/keystore.properties"; E:\flutter\bin\flutter.bat build appbundle --release --dart-define-from-file=E:\Almas\almas_app\imaan\flutter_app\config\firebase.local.json`
  Keystore stays in the main checkout; never copy it.
- User uploads the AAB in Play Console (internal testing track); then
  release notes + publish with their OK.

## 6. Web /app update (after app changes)
1. `flutter build web --release --base-href /app/ --output build/web-app --dart-define-from-file=<config above>`
2. `cp web/.htaccess build/web-app/.htaccess`
3. Upload with Hostinger MCP: `hosting_files_generate-upload-url`
   (username `u290283791`, domain `imaanakhlaq.org`), then TUS POST+PATCH
   each file to `<url>/app/<path>?override=true`, entry files
   (`index.html`, `.htaccess`) last. Keep the returned keys in a temp file,
   delete it after. NEVER use site-wide deploy/import operations — they
   overwrite the whole website.
4. Check `https://www.imaanakhlaq.org/app/main.dart.js` md5 = local build.

## 7. Pitfalls already hit
- Many Dart files have CRLF line endings: bash `node -e` replace scripts
  fail silently on multi-line matches — normalise `\r\n` first or use the
  Edit tool. Long node scripts with Urdu text: write them to a file, don't
  inline in bash (quote errors).
- `pumpAndSettle` hangs if a hidden tab shows a spinner forever (fixed in
  teacher Books tab by building it only when selected).
- Goldens change whenever layout changes: update, then open the png.
- Firebase Android app for package `com.imaanakhlaq` was added on 17 Nov
  (Google sign-in); the old `com.imaanakhlaq.app` entry is unused.

## 8. Other backlog (not part of this task)
Quran.com / Jameel Noori licence checks, Families policy + Data safety
form, Play listing icon + feature graphic upload (files in
`play_store_assets/`), "completed chapters" list for Individual spaces,
web payments (JazzCash/Easypaisa), push/merge the branch to `main`.
