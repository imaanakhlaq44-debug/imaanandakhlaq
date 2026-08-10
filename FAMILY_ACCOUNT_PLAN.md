# Family Accounts — Implementation Plan

School-provisioned parent accounts, one per family, with a card per child.

Supersedes the one-account-per-student model. Decisions recorded here are
settled unless noted as **OPEN**.

---

## 1. Data model

```
users/{familyUid}              role: 'family'      ← the login
  name, phone, email?
  username            'PAR-7K4Q'
  school_id
  parentGate          { pinHash, isConfigured, autoLockMinutes }

users/{childId}                role: 'student'     ← no login of its own
  family_uid          familyUid
  school_id, class_id
  name, photoURL, game_state

invites/{code}                                     ← the claim code
  role: 'student'
  child_uid, family_uid, school_id, class_id
  status: 'pending' | 'used'

activity_submissions / activity_drafts / activity_attendance
  student_uid   (unchanged)
  + family_uid  (NEW — denormalized)

public_scores/{childId}        unchanged, per child
```

### Why no separate `families` collection

The parent is just a `users` doc with `role: 'family'`. This keeps the `me()`
rules helper working — it does `get(users/$(request.auth.uid))`, so the caller
must have a `users` doc. A separate collection would need every role check
rewritten.

Knock-on effects, all benign:

- `mirrorPublicScore` — `RANKED_ROLES` is `['student','individual']`, so a
  family doc never reaches the leaderboard, and any stale entry is deleted.
- `setTrialOnSignup` — fires only on `role === 'individual'`. Unaffected.

### Why `'family'` and not the retired `'parent'`

`'parent'` was deliberately retired in `da7f33e` and `AuthPage` still shows an
error for it. Reusing the name would resurrect dead branches. `'family'` is
distinct and greppable.

### No `children` array

The child list is a query: `users where family_uid == <myUid>`. One source of
truth, nothing to keep in sync.

### Why `family_uid` is denormalized onto owned docs

The alternative — `get(/users/$(resource.data.student_uid)).data.family_uid` —
costs a document read per rule evaluation and is awkward inside `allow list`.
Denormalizing matches the pattern the rules already use for `school_id` via
`sameSchool(data)`.

**Accepted limitation:** rules can cheaply prove `family_uid == auth.uid` but
not that `student_uid` belongs to that family. A family could therefore
misattribute work between its *own* children. Blast radius stays inside one
family.

---

## 2. Provisioning — school admin

The admin dashboard gets a **Parents** section, placed first in the nav.

### Add Parent

Admin enters name + phone (email optional). Cloud Function `createFamilyAccount`:

1. Generates username `PAR-XXXX` and a readable 8-char password
   (no `0/O/1/l/I` — these get read aloud and hand-copied).
2. `auth().createUser()` with synthetic email `PAR-XXXX@<schoolSlug>.imaan.app`.
   Firebase Auth needs an email-shaped string; it does not need to be
   deliverable. Same mapping idea as the existing `lookupEmailByPhone` flow.
3. Creates `users/{familyUid}` with `role: 'family'`, `school_id`, `username`.
4. Returns username + password to the admin's screen **once**.

### Add Student under a parent

Admin enters name + class. Cloud Function `createChild`:

1. Creates `users/{childId}` — `role: 'student'`, `family_uid`, `school_id`,
   `class_id`.
2. Creates `invites/{STU-XXXX}` carrying `child_uid` and `family_uid`,
   `status: 'pending'`.
3. Returns the claim code for the admin to print or send.

The student appears in the class teacher's roster immediately — `class_id` +
`school_id` already drive that, no new wiring.

### Both entities stay optional

- A parent with zero children is valid.
- A student with no parent is valid (`family_uid: null`, attached later).

A school always has students whose parents never enrol. Parent-first ordering
must not become parent-required.

### Password handling — **DECIDED: show once, reset, never stored**

Firebase Auth keeps only a hash, so a password cannot be read back. Showing
one permanently in the roster would mean keeping a second plaintext copy in
Firestore, where any school_admin — or anyone who compromises one — could read
every family's password in that school. Password reuse being what it is, that
leak would not stop at this app.

So:

1. The generated password is displayed **once**, at creation, with copy and
   print actions and an explicit "this will not be shown again".
2. A **Reset password** button generates a new one and shows it once. That is
   the recovery path, and it is also how a school signs in as a parent if it
   ever has to — at the cost of having to hand over the new password.
3. Because resetting disrupts the parent, the school gets a better route to
   the thing it actually wants: a **read-only "View children" panel** in the
   admin dashboard. Staff can already read their own school's users and
   submissions under the existing rules, so checking a child's work needs no
   parent login at all.

Nothing about the password is persisted anywhere outside Firebase Auth.

---

## 3. Parent experience

### Login

Username + password. `AuthPage` maps `PAR-XXXX` to the synthetic email before
calling `signInWithEmailAndPassword`, the same way it currently maps a phone
number through `lookupEmailByPhone`. On `role === 'family'` it redirects to
`/family`.

### Family dashboard — `/family`

A responsive card grid: 2 per row on desktop, 1 on mobile.

Each claimed child renders as a card:

- avatar / photo, name, class
- total points
- current chapter and progress
- a badge when work is awaiting teacher review
- **Open** → that child's dashboard

The last tile is always **`+ Add Child`**. There is no fixed capacity. A brand
new parent sees two dashed placeholder boxes plus the `+` tile, so the page
never looks broken or empty.

### Claiming a child

`+` asks for the student code. Cloud Function `claimChild({ code })`:

- invite must be `pending` and `role: 'student'`
- **`invite.family_uid` must equal the caller's uid** — so a stolen or
  mistyped code can never attach someone else's child
- if `family_uid` is null (student created without a parent), the claim
  attaches it and the admin is notified
- flips the invite to `used`
- rate limited per account

### Codes are not PINs

The claim code is `STU-7K4Q` — 6 alphanumeric characters, one-time use.
Deliberately **not** 4 digits: the product already has a 4-digit Parent Area
PIN, two similar-looking secrets would be a support problem, and 10,000
combinations is brute-forceable.

The `invites` collection already implements exactly this — the code is the
secret, `get` is public but `list` is not, and status flips `pending` → `used`.
No new collection.

### The Parent Area PIN changes job

It currently gates a parent section *inside* the student dashboard. Now it
gates the **return trip**: going from a child's dashboard back to the family
dashboard. That stops a child from wandering into a sibling's work or the
family overview. Same hashing helpers, same 5-minute auto-lock.

Honest limit, unchanged from today: one login, one device — the PIN is a UI
gate, not a security boundary.

---

## 4. Child experience

Unchanged from the student's point of view. They open their dashboard from
the parent's card and everything works as it does now.

**Children have no login at all.** If the school ever needs to open a child's
work, the admin resets the family password and signs in.

Work still goes **student → teacher** directly. The parent dashboard is
read-only. This is not a revert of `da7f33e`; what that commit removed was the
parent's approval step in the workflow, not a parent-facing view.

---

## 5. Firestore rules

| Path | Now | Change |
|---|---|---|
| `users` get/list | `auth.uid == userId` | add `resource.data.family_uid == auth.uid` |
| `users` update (self) | `auth.uid == userId` + whitelist | extend to any child of my family; whitelist unchanged |
| `users` create | self only | **remove student self-signup**; children come from Admin SDK |
| `activity_submissions` | `student_uid == auth.uid` | `family_uid == auth.uid` |
| `activity_drafts` | same | same change |
| `activity_attendance` | same | same change |
| `invites` create | staff | unchanged; `child_uid` / `family_uid` fields added |
| `public_scores` | — | no change |

`me()` keeps working because a family caller has a `users` doc.

---

## 6. Cloud Functions

New, all `onCall`, all Admin SDK:

| Function | Caller | Does |
|---|---|---|
| `createFamilyAccount` | school_admin | auth user + `users` doc, returns credentials once |
| `createChild` | school_admin | child doc + claim code |
| `claimChild` | family | validates code, reveals the card |
| `resetFamilyPassword` | school_admin | new password, shown once |
| `attachChildToFamily` | school_admin | links an existing unattached student |

Changed:

- **`lookupEmailByPhone`** — children will carry the family's phone, so
  `limit(1)` can return the wrong doc. Restrict the query to
  `role == 'family'`.

One-off script:

- `disableLegacyStudentLogins` — disables every existing student auth account
  after cutover.

---

## 7. Existing accounts

**Decision: convert, do not start over. No school loses any data.**

Old student *logins* are disabled, but the student *records* are reused, so
every submission, point, approved chapter and teacher note survives.

That is cheap because no id changes. Everything a student owns is keyed on
their uid — `activity_submissions/{uid}_{chapterId}`,
`activity_drafts/draft_{uid}_…`, `activity_attendance/{uid}_…`,
`public_scores/{uid}` — so the student record simply becomes the child record
by gaining `family_uid`. Nothing is renamed and nothing is deleted; the
child's old `phone` and `email` are moved to `legacy_phone` and
`legacy_login_email` rather than dropped, which also makes a run reversible.

### Finding the siblings

The roster import already captures what is needed. Each student's invite
carries `parent_name`, `parent_phone` and `parent_email`, taken from the
Father/Guardian and Contact columns, and the field detector recognises
`fathercontactno`, `parentcontact`, `guardiancontact`, `fatheremail` and
friends. A student's `users` doc carries `invitation_code`, so the join
`user → invite → guardian` is available, with the student's own `phone` as a
fallback. Numbers are keyed on their last 10 digits so `03001234567` and
`+923001234567` group together.

### What must stay manual

Grouping is a *proposal*. Two unrelated children sharing a school office
number would be merged into one household, and then one parent could read
another family's child. That is a privacy breach, not a bug, so
`planFamilyMigration` only suggests and the school confirms each group.

---

## 8. Files touched

| File | Work |
|---|---|
| `firestore.rules` | family branches, drop student self-signup |
| `functions/index.js` | 5 new functions, `lookupEmailByPhone` fix |
| `public/admin-dashboard.html` | Parents section first, add parent / add student, credentials once, reset, print code |
| `src/components/AuthPage.tsx` | username login, `family` redirect, remove student self-registration |
| `src/components/FamilyDashboard.tsx` | **new** — card grid, `+` tile, claim modal |
| `src/app.ts` | `/family` route |
| `src/lib/activeChild.ts` | **new** — active-child resolver, JS-source-string pattern |
| `src/components/ActivityDashboard.tsx` | scope to activeChildId, PIN repointed |
| `src/components/ActivityPage.tsx` | 13 uid usages → activeChildId, `family_uid` on writes |
| `src/components/ParentGateModal.tsx` | PIN on the family doc |
| `src/components/TeacherDashboard.tsx` | **no change** |

`activeChild.ts` must export a JS source string rather than a module, because
the dashboards run their Firebase code in an inline `<script type="module">`
with CDN imports and cannot import project files at runtime — the same
constraint `parentGateService.ts` documents.

---

## 9. Phases

Each phase ships on its own.

**Phase 0 — foundations. DONE.** No visible change. `isMyFamily` added to the
rules as an *additive* branch beside every existing `student_uid` check — never
replacing one, because legacy documents have no `family_uid` and requiring it
would deny every read on day one. `activeChild.ts` added, and the activity page
now resolves the learner through it instead of `auth.currentUser.uid`.

`ActivityDashboard.tsx` needed no change: it already routes every read and
write through `currentStudent`, which is the right seam, and its only use of
`auth.currentUser.uid` is the Parent Area PIN — an account-level field that
belongs on the family doc anyway.

**Phase 1 — admin provisioning. BUILT.** Five callables in
`functions/index.js`, and a **Parents** tab in the admin dashboard placed
first among the management sections: Add Parent, credentials shown once, Add
Student under a family, printable code slip, Reset password, and a read-only
View Children panel.

All ten callables load and initialize in the Functions emulator, on
`us-central1`, which is the region `getFunctions(app)` reaches by default from
the client. That proves they deploy in the right shape; it does not prove they
behave. Their logic, and the dashboard against a real school admin login, are
still untested.

Three things surfaced while wiring it up:

- **A family claim code would have listed the student twice.** The Students
  tab renders enrolled students plus pending invites. Under the old flow no
  user existed until an invite was redeemed; now the student is created
  immediately and the invite is only a claim ticket, so the same child
  appeared as both enrolled and pending. Invites carrying `child_uid` are now
  excluded from that pending list.
- **`invitesList` read `invite.code`, which family codes do not store** — the
  code is the document id. The loader now falls back to the id.
- **All five sidebar icons were already broken.** Their `content: '\fXXXX'`
  escapes had been flattened into literal formfeed bytes, which is a CSS parse
  error, so every icon rule was being dropped. Fixed along with the sixth
  (a modal camera icon) — verified in the browser, all six now resolve to
  real codepoints.

**Drift risk to close when wiring the login.** `AuthPage` will have to turn
`PAR-XXXXX` into `PAR-xxxxx@family.imaanakhlaq.invalid` to sign in, which
means the domain exists in both `functions/index.js` and `src/`. If the two
ever disagree, every family login fails with no useful error. Put the client
copy in one `src/lib` constant and add a test asserting it matches the string
in `functions/index.js` — both files are in this repo, so the test is cheap
and catches the drift exactly.

**Phase 2 — family dashboard. BUILT.** `/family` route and
`FamilyDashboard.tsx`: card grid, `+ Add a child` tile, claim modal, and
username login wired through `AuthPage`.

- The child list is one query on `family_uid`, and review counts are a second
  single query for the whole household — both single-field equalities, so no
  composite index and both provable under the `isMyFamily` list rule.
- Login accepts `PAR-XXXXX` alongside email and phone, in **both** of the
  page's login paths. The compat script is an IIFE, so the helpers are emitted
  into the module script too — from the one constant in `familyLogin.ts`.
- Both redirect chains send `role: 'family'` to `/family`.

**Open activities** remembers the chosen child and hands off to the student
dashboard, which picks the choice up in Phase 3.

**Phase 3 — child scoping. BUILT.** The student dashboard and the activity
page both run on the chosen child, and the whole chain works end to end.

Both Phase 0 constraints are resolved:

- **The student dashboard now accepts a family login.** It loads the account
  doc, resolves the identity, and then loads the chosen child as
  `currentStudent`. Ownership is re-checked against `family_uid` rather than
  trusted from localStorage — the remembered id outlives a logout, so on a
  shared device a second family would otherwise land on the first family's
  child. A stale or missing choice sends them back to `/family`.
- **No composite index is needed after all.** Rather than filtering on both
  `family_uid` and `student_uid`, the Parent Area query filters on
  `family_uid` alone and drops the siblings client-side. That keeps it a
  single-field equality, which the rules can prove for a `list`, and a
  household is at most eight children. `firestore.indexes.json` stays empty.

Also fixed here, and it was a real bug rather than a new requirement: **the
Parent Area PIN was written to one document and read from another.** Setup
saved it to `auth.currentUser.uid` while unlocking compared against
`currentStudent.parentGate`. On a legacy login those are the same doc so it
worked by accident; on a family login they are the parent and the child, and
no PIN the family typed would ever have unlocked the gate. Both sides now go
through the account profile.

The PIN gained a second door: **Switch child**, a sidebar item shown only to
family logins, which returns to `/family` behind the same gate.

**Phase 4 — migration. BUILT (conversion half).**
`planFamilyMigration` scans a school and proposes households;
`migrateFamilyGroup` converts one confirmed group. The admin dashboard gets a
**Migrate existing students** screen: summary counts, one row per proposed
household with an editable family name, and a printable sheet of the logins
it created.

Properties that matter when this runs on a live school:

- **Idempotent.** A child that already has `family_uid` is refused, so a
  re-run cannot mint a second family for the same household.
- **Vetted before anything is written.** Every child is checked first — a
  half-made family with a login nobody was handed is worse than a button that
  refused.
- **Partial runs still hand over the credentials.** If one child fails, the
  others are reported as migrated, the failures are listed, and the username
  and password still come back. A login created but never given out is the one
  outcome with no way back; the straggler can be attached afterwards with
  `attachChildToFamily`.
- **Safe ordering.** `family_uid`, then the history backfill, then the old
  login last. The rules keep both the `student_uid` and `family_uid` branches,
  so the child is reachable at every point in between.
- **Batched.** Backfills commit in chunks of 450 against the 500 cap.

Still to do in this phase: remove student self-signup from `AuthPage` and
tighten the `users` create rule, once the schools have been converted.

**Phase 5 — rollout.** Announce to schools, ship the walkthrough video.

---

## 10. Open items

1. ~~Password display~~ — decided: show once, reset, never stored. See §2.
2. ~~Existing student history~~ — decided: convert, never start over. No
   school loses data. See §7 and Phase 4.
3. Urdu labels on the two screens parents actually touch: the family dashboard
   and the add-child modal. The rest of the app can stay English.
4. **What is verified, and what is not.**

   `npm run test:emulator` runs 38 tests against the Firestore, Auth and
   Functions emulators. They skip themselves when no emulator is up, so
   `npm test` stays green at 34.

   Verified — rules (`src/__tests__/rules.test.ts`, 25 tests): legacy students
   still reach their own work and nothing else; a family reaches its own
   children and no one else's; a family cannot list the school, move a child
   to another family, change a child's role or school, approve its own child's
   work, or rewrite what a teacher signed off; staff are unaffected. The suite
   asserts in both directions, so rules that denied everything would fail it
   just as loudly as rules that allowed everything.

   Verified — callables (`src/__tests__/functions.test.ts`, 13 tests): the
   whole chain, driven the way the app drives it. Provisioning; sign-in with
   the address the client builds from the username, which is the domain drift
   caught end to end; non-staff refused; a claim code redeemable once, by the
   right family only; password reset invalidating the old password; sibling
   grouping across `+92 300 1234567` and `03001234567`; and the migration —
   collection sizes unchanged, every submission, draft and attendance record
   re-stamped in place with its ids intact, `game_state` untouched, contact
   details moved to `legacy_*` rather than dropped, the old login disabled but
   not deleted, the untouched household left exactly as it was, a second run
   refused with no orphan family left behind, and migrated children dropping
   out of the next scan.

   Not verified:
   - **The dashboards against real data.** The client is verified only as far
     as "it builds, the page loads, the DOM and layout are right". No screen
     has been driven by a real logged-in session.
   - **A real school's data.** The migration is proven on seeded rosters, not
     on production shapes — odd phone formats, duplicate guardians, students
     with no invite.
