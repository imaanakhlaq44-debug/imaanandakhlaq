# School Groups (the Wall) — Implementation Plan

A school registers once and becomes a group. Its whole roster is added in one
place, every student carrying a class. After an activity day the teacher posts
the snaps to the school's wall; each tagged child shows as *first name +
class*. Likes and comments live on the post. Web only — the Android app never
renders this.

Written for schools whose students attend **one day a week**. That single
constraint drives most of the decisions below.

Supersedes nothing. Builds on `FAMILY_ACCOUNT_PLAN.md` — the "child without a
login" pattern it established is the foundation here. Decisions are settled
unless marked **OPEN**.

---

## 1. The two decisions everything else follows from

### 1.1 The school *is* the group

No `groups` collection. `schools/{schoolId}` is the group, gaining a few
fields (§2). Membership is `users.school_id`, which already exists on every
member and which `sameSchool(data)` in `firestore.rules` already proves for
free.

A parallel grouping concept would need its own membership model, its own rules
helper beside `mySchool()`, and a second answer to "is this person allowed to
see this" — with the two answers free to disagree. If a school later wants
several walls (junior/senior), that is a `wall_id` field *inside* the school,
not a new top-level container.

### 1.2 The client never writes a post

`school_posts` is `allow write: if false` for clients, exactly like
`public_scores`. Posting goes through a `publishPost` callable on the Admin
SDK.

This is not ceremony. Publishing has to check, per tagged child, that media
consent was granted (§8). Rules would need one `get()` per tagged student —
20 document reads on a class post, evaluated on every write attempt, and still
unprovable inside `allow list`. The callable does it in one `getAll()`. The
same split already protects `club_points`: the thing that must not be
forgeable is written only by the Admin SDK.

Likes and comments are the opposite — small, frequent, self-owned — so they
stay ordinary client writes governed by rules.

---

## 2. Data model

```
schools/{schoolId}                                   ← the group
  name, location, school_code, admin_uid             (existing)
  type                'full_time' | 'weekly'         (NEW — the concept flag, §12)
  meeting_day         'saturday' | 'sunday' | …      (NEW)
  approval_status     'pending' | 'approved'         (NEW — §12.4)
  wall_enabled        boolean                        (NEW)
  wall_settings       { comments: 'staff' | 'off',
                        require_approval: boolean }  (NEW)

users/{studentId}     role: 'student'                ← roster entry, no login
  school_id, class_id, name, photoURL                (existing)
  family_uid?                                        (existing, optional)
  media_consent       'granted' | 'denied' | 'unset' (NEW, default 'unset')
  roster_only         boolean                        (NEW — never had a login)

school_posts/{postId}
  school_id
  class_ids           ['3', '4']        array, for the class filter
  author_uid, author_name, author_role
  text                <= 2000 chars
  media               [{ path, type: 'image'|'video', w, h, bytes }]
  tagged              [{ student_uid, first_name, class_id }]
  session_date        'YYYY-MM-DD'      the activity day, not the upload day
  source              'manual' | 'activity_submission'
  source_id?          activity_submissions doc id, when auto-shared
  status              'published' | 'pending' | 'hidden'
  comments_policy     denormalized copy of wall_settings.comments
  like_count, comment_count
  created_at, published_at

school_posts/{postId}/likes/{uid}
  uid, school_id, created_at

school_posts/{postId}/comments/{commentId}
  author_uid, author_name, author_role, school_id
  text                <= 500 chars
  status              'visible' | 'hidden'
  created_at

parent_links/{token}                                 ← §7
  student_uid, school_id, created_by, created_at
  expires_at, revoked_at?
```

### Why `school_id` is copied onto likes and comments

A rule on `school_posts/{postId}/likes/{uid}` cannot see the parent post's
fields. Without the copy every like write costs a `get()` of the post, and
`allow list` on comments becomes unprovable. This is the same denormalization
`family_uid` uses, for the same reason.

**This limitation was NOT accepted in the end.** The plan originally said a
client could write a like carrying a `school_id` that did not match its parent
post, and that it gained nothing. A rules test proved otherwise: a teacher
from another school could write a like into a post they cannot read, and
`countWallReactions` would dutifully increment that post's counter. Both
create branches now also `get()` the parent post and compare its `school_id` —
one read on a low-frequency write. The denormalized field still serves the
`list` and `delete` branches, where a `get()` is not available.

### Why `tagged` stores a name snapshot

The wall is read constantly and the roster changes rarely. Resolving 20 names
per post per scroll is the query that will make this page feel slow on a
school's connection. First name and class are snapshotted at publish time. An
admin renaming a student does **not** rewrite history; old posts keep the old
name. That is the correct behaviour for a photo caption anyway.

Only the **first name** is ever stored here. Full names never reach the wall,
in any field.

### Why `session_date` is separate from `created_at`

The teacher uploads on Tuesday what happened on Saturday. The wall groups by
`session_date` (§6), so it must not be inferred from the upload timestamp.

---

## 3. Provisioning — the roster

The admin dashboard is `public/admin-dashboard.html` (5,900 lines, served
through the `/admin-dashboard` route in `src/app.ts`, which patches its
Firebase config and pull-to-refresh in). `src/components/SchoolAdminDashboard.tsx`
is **not** the live page — do not edit it and expect anything to change.

That page already imports rosters from CSV/XLS/DOCX/PDF and writes
`invites/{code}` docs in batches. An invite is a *claim slip*: the student
becomes real only when someone registers with it.

That is wrong for a weekly school. Nobody is going to register 200 logins for
children who own no phone and attend on Saturdays. The roster must produce
**students, not invitations**.

### New callable: `createRosterStudents`

```
createRosterStudents({ school_id?, students: [{ name, class_id }] })
  -> { created: [{ student_uid, name, class_id }], skipped: [...] }
```

- `requireStaff(request, ['school_admin', 'super_admin'])`, then
  `resolveSchoolId(caller, data.school_id)` — both already exist in
  `functions/index.js`.
- Max **100 students per call**; the client chunks with the existing
  `chunked(list, size)` helper. One `db.batch()` per call.
- Writes `users/{id}` with `role: 'student'`, `roster_only: true`,
  `media_consent: 'unset'`, no `family_uid`, no phone, no email. (The
  `createChild` comment on why a child never carries a phone —
  `lookupEmailByPhone` matching it — applies unchanged.)
- Allocates **no invite code**. A code is only minted later, on demand, if a
  family wants a login. `createChild`'s existing `create()`-based code
  allocation stays the one place that happens.
- Duplicate guard: skip a row whose `(school_id, class_id, name)` already
  exists. Report skips rather than failing the batch — re-importing last
  term's list is the normal case, not an error.

### Dashboard changes

The existing import modal gains a mode switch: **"Create students directly"**
(new default for schools with `wall_enabled`) vs **"Generate claim codes"**
(today's behaviour, unchanged). The parser, the preview table and the class
normalization (`normalizeClassName`, `splitClassNames`) are reused as-is.

A roster-only student converts to a login later without a migration: mint a
`STU-` invite carrying `child_uid`, and `claimChild` attaches it. That path
already works.

---

## 4. Firestore rules

Added at the end of `firestore.rules`, in the existing numbered-section style.

```js
// ---------------------------------------------------------------
// N. School Wall — posts
// ---------------------------------------------------------------
// Posts are written ONLY by the publishPost / moderatePost callables on the
// Admin SDK. Media consent is checked per tagged child there; rules cannot
// do it without one get() per tag. Same split as club_points.
match /school_posts/{postId} {
  allow get, list: if signedIn() && (
    isSuper() ||
    (sameSchool(resource.data) && resource.data.status == 'published') ||
    (isStaff() && sameSchool(resource.data))     // staff also see pending/hidden
  );
  allow write: if false;

  // -------------------------------------------------------------
  // Likes — one doc per person per post, id == uid, so a second
  // like overwrites rather than accumulating.
  // like_count is NOT written here: the countWallReactions trigger
  // owns it. A client that could increment it could mint applause.
  // -------------------------------------------------------------
  match /likes/{likerUid} {
    allow get, list: if signedIn() && sameSchool(resource.data);
    allow create, delete: if signedIn() &&
      likerUid == request.auth.uid &&
      request.resource.data.school_id == mySchool();
    allow update: if false;
  }

  match /comments/{commentId} {
    allow get, list: if signedIn() && sameSchool(resource.data) &&
      (resource.data.status == 'visible' || isStaff());

    allow create: if signedIn() &&
      request.resource.data.school_id == mySchool() &&
      request.resource.data.author_uid == request.auth.uid &&
      request.resource.data.status == 'visible' &&
      request.resource.data.text is string &&
      request.resource.data.text.size() > 0 &&
      request.resource.data.text.size() <= 500 &&
      // Staff only, per §11. The policy is denormalized onto the post at
      // publish time, so 'off' is provable without reading the school doc.
      isStaff() &&
      get(/databases/$(database)/documents/school_posts/$(postId)).data.comments_policy
        != 'off';

    // Authors do not edit. Staff hide; nobody rewrites.
    allow update: if isStaff() && sameSchool(resource.data) &&
      onlyKeys(['status']);
    allow delete: if isSuper() ||
      (signedIn() && me().role == 'school_admin' && sameSchool(resource.data));
  }
}
```

Two notes on the above:

- The comment `create` branch does spend one `get()` of the parent post. It is
  unavoidable — the policy must be read from somewhere trustworthy — but it is
  one read on a low-frequency write, not on every list.
- No `guardian` role appears anywhere in this file, and none should. Parents
  reach the wall through a token resolved on the Admin SDK (§7), which is the
  whole reason the rules stay this short.

`parent_links` gets `allow read, write: if false` — a bearer token is useless
if the collection is world-readable, and only the Admin SDK ever touches it.

---

## 5. Cloud Functions

All in `functions/index.js`, following the existing `onCall({ cors: true })` +
`requireStaff` shape.

| Function | Kind | Purpose |
|---|---|---|
| `createRosterStudents` | callable | §3 — bulk roster, no logins |
| `publishPost` | callable | validate, consent-check, write the post |
| `moderatePost` | callable | hide / unhide / delete a post and its media |
| `countWallReactions` | `onDocumentWritten` | maintain `like_count` / `comment_count` |
| `issueParentLink` | callable | §7 — mint a printable parent token |
| `readParentWall` | callable | §7 — token in, one child's posts + signed URLs out |
| `appreciatePost` | callable | §7 — a parent's heart, no account |
| `approveSchool` | callable | §12.4 — super admin unlocks a new school's wall |

### `publishPost`

```
publishPost({
  school_id?, text, session_date, class_ids,
  tagged: [student_uid],
  media: [{ path, type, w, h, bytes }],
  source?, source_id?
}) -> { post_id, dropped_tags: [{ student_uid, reason }] }
```

1. `requireStaff(request, ['teacher', 'school_admin', 'super_admin'])`.
2. Load the school; reject unless `wall_enabled`.
3. `getAll()` every tagged `users/{id}`. Drop a tag — and report it — when the
   student is not in this school, or `media_consent !== 'granted'`.
   **Consent is enforced here and nowhere else that matters.** A UI checkbox
   is a reminder; this is the rule.
4. Verify each `media[].path` sits under `wall_staging/{schoolId}/{callerUid}/`
   and exists in Storage, then move it to `wall/{schoolId}/{postId}/`. A
   client-supplied path is otherwise an invitation to attach someone else's
   file to a post.
5. Cap: 10 media items, 2,000 chars of text, 40 tags.
6. Write the post with `status` = `'pending'` when
   `wall_settings.require_approval` and the caller is a teacher, else
   `'published'`; stamp `comments_policy` from the school.

### Decisions made while building it

**`moderatePost` — a teacher moderates only their own post.** Taking down a
colleague's is the admin's call. Without that line the wall becomes a place
where staff quietly delete each other's classes, and nothing records that it
happened.

**Deleting a post deletes its images.** A post taken down because a parent
asked has not been taken down while its photographs are still fetchable by
anyone holding the URL. `moderatePost` empties the Storage prefix before it
deletes the document.

**Media is moved out of staging, not copied.** A staging tray that keeps a
second copy of every photograph is a second place a takedown request has to
reach, and nobody would remember it was there.

**`class_ids` is computed, never trusted.** Whatever the caller passes is
merged with the class of every tagged child. A post showing a Class 4 child
must be findable under Class 4 — otherwise the class filter quietly hides
children from their own parents.

**The bucket is resolved through `wallBucket()`.** `getStorage().bucket()`
throws "Bucket name not specified" when `FIREBASE_CONFIG` carries no
storageBucket — which a deployed function always has and a bare
`initializeApp()` does not. Wrapped so that failure arrives as a sentence
rather than from inside a publish the teacher already waited for.

### `countWallReactions`

One trigger on `school_posts/{postId}/{sub}/{docId}` handling both
subcollections: `FieldValue.increment(+1)` on create, `-1` on delete, no-op on
update. Firestore's one-write-per-second-per-document ceiling is not a concern
at a school's scale, and a lost count is cosmetic — but the count must never
be client-writable, so the trigger is the only writer.

---

## 6. Web surface

### Route

`app.get('/school-wall', ...)` in `src/app.ts`, rendering a new
`src/components/SchoolWall.tsx` in the established shape: a `hono/html`
template with one inline `<script type="module">` that imports Firebase from
`gstatic`. Follow `ClubPortal.tsx` for structure, not `SchoolAdminDashboard.tsx`.

Register the route in **both** test lists or the suite will not cover it:
`src/__tests__/routes.test.ts` and the `ROUTES` array in
`src/__tests__/inline-scripts.test.ts`.

### Feed shape — sessions, not an infinite stream

The unit of the wall is **one activity day**, not one post. The feed renders a
card per `session_date`, containing that day's posts, its photo grid and its
tagged children. A school that meets weekly produces ~4 cards a month; an
undifferentiated Facebook stream would look empty and read as abandoned.

Above it: a class filter (`All`, then one chip per distinct `class_id`).

### Queries and indexes

`firestore.indexes.json` is currently `{"indexes": [], "fieldOverrides": []}`.
Both of these must be added there and deployed, or the wall works against the
emulator and fails in production:

```
school_posts:  school_id ASC, status ASC, session_date DESC
school_posts:  school_id ASC, class_ids ARRAY_CONTAINS, session_date DESC
```

Page size 15, `startAfter` cursor.

### Media upload pipeline

Client-side, before upload:

1. Draw to a `<canvas>`, longest edge 1600px, `toBlob('image/jpeg', 0.82)`. A
   4 MB phone photo lands around 250–400 KB. Thirty of those over a school's
   connection is the difference between a teacher finishing and a teacher
   giving up.
2. Upload to `wall_staging/{schoolId}/{uid}/{uuid}.jpg`, then call
   `publishPost`.
3. Sequential uploads with a visible per-file progress bar, resumable via
   `uploadBytesResumable` — not the `uploadBytes` the dashboards use today.

**Video is out of scope for the first release.** A 30-second clip is 20–40 MB,
which is a storage bill and an upload the connection will drop. Ship images;
revisit with a transcoding step if schools ask. **OPEN.**

### Storage rules — currently missing from the repo

There is no `storage.rules` file and `firebase.json` declares no `storage`
block, so Storage rules live only in the console and nothing here reviews or
tests them. Add the file, register it, and gate the new paths:

```js
match /wall_staging/{schoolId}/{uid}/{file} {
  allow write: if request.auth != null && request.auth.uid == uid
    && request.resource.size < 8 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
  allow read: if request.auth != null && request.auth.uid == uid;
}
match /wall/{schoolId}/{postId}/{file} {
  allow read: if request.auth != null;   // tightened by §7 if guardians land
  allow write: if false;                 // only publishPost moves files here
}
```

### Decisions made while building the page

**Four indexes, not two.** Staff query the feed without a `status` filter, so
pending and hidden posts reach the people who have to act on them; everyone
else filters to `published`. With the class chip that is four query shapes,
and each needs its own composite index. Index count is not a cost worth
trading a wall an admin cannot moderate for.

**Non-consenting children are listed in the tag picker, greyed, with the
reason.** Omitting them looked like a bug — the teacher retypes the name and
concludes the search is broken. "Maryam Khan · Class 4 · No photos" tells her
to go and ask the parent, which is the action that actually resolves it.
"Consent not recorded" and "No photos" are distinct for the same reason
`'unset'` is a distinct state.

**`dropped_tags` is surfaced after publishing, not only before.** Consent is
checked in the callable, so a child can still be dropped between the roster
loading and the teacher pressing Publish. A tag that silently vanished would
never be chased up.

**Session dates are never parsed with `new Date('2026-08-22')`.** That reads
as UTC and renders the previous day everywhere west of Greenwich — which for a
school that meets once a week means the card is labelled with the wrong
session entirely.

### Keeping it off Android

The SSG build renders every route into `dist/`, which Capacitor then copies —
so `/school-wall` ships inside the APK whether or not anything links to it.
Two guards, both needed:

- No nav entry on any dashboard when `isApp()` (`src/lib/platform.ts`).
- The wall's own inline script redirects to `/` when
  `Capacitor.isNativePlatform()`.

Note that `npm run build:apk` currently references `scripts/apk-prune.cjs`,
which does not exist in the repo — worth fixing before relying on that chain
to strip anything.

---

## 7. Parent access

Parents are the reason a school stays. They must not have to create accounts.

### Phase 3a — read-only link (ship this first)

`issueParentLink({ student_uid })` (staff) mints `parent_links/{token}` — 32
chars from `randomCode`, 180-day expiry — and returns a URL plus a QR the
admin can print onto a slip.

`/wall/p/:token` renders a page whose only backend call is
`readParentWall({ token })`, a callable that resolves the token on the Admin
SDK and returns that child's posts with **signed media URLs** (short TTL). No
Firebase sign-in, no rules involvement, no new role.

The token is a bearer secret: forwarded, it works. That is the same trade the
existing `invites` collection already makes (`allow get: if true` — the code
is the secret), and it is the right trade for a printed slip. Expiry plus
`revoked_at` bound the damage.

### Decisions made while building it

**The token is a URL fragment: `/wall/p#TOKEN`.** Not a path segment, not a
query string. A fragment is never sent to the server, so the token cannot land
in an access log or a `Referer` header — and this site is a static SSG build,
where `/wall/p/:token` would need a rendered file per token and simply has
nowhere to be served from.

**One live link per child.** Issuing again revokes the previous one, and the
dashboard warns before it does. Without that, a slip handed to the wrong
parent stays valid forever and the school has no way to take it back — the
token was never written down anywhere they can reach.

**`parent_links` is closed to every client, staff included.** A readable
collection of bearer tokens is not a collection of secrets: one signed-in
teacher could list every parent's link in the school. The roster instead
carries `parent_link_issued_at` — a date, never the token, because the roster
is a list a whole staff room reads.

**Wrong, expired and revoked tokens fail identically.** Whoever is holding a
token learns only that it does not work, not which of the three it is.

**Media entries survive a signing failure.** `getSignedUrl` needs the service
account's signBlob permission, which a deployed function has and the Storage
emulator does not. A photo whose URL could not be built is still returned, and
the page draws a placeholder — dropping it would show the parent a post that
looks like it never had a photograph, and nobody reports a photograph that
quietly went missing.

**The page reloads on `hashchange`.** A family with two children holds two
links; opening the second while the first is on screen changes only the
fragment, which does not reload the page. Without the listener the parent
keeps looking at the other child's wall with no way to tell.

### Appreciation without an account

The token holder may also call `appreciatePost({ token, post_id })`. The
callable resolves the token, then writes the like on the Admin SDK under
`guardian_<sha256(token)[0:16]>` — a stable synthetic id, so one link
appreciates a post once and un-appreciates by deleting the same doc.
`countWallReactions` counts it like any other like.

No sign-in, no password, no `guardian` role anywhere in `firestore.rules`.
Comments remain staff-only (§11).

**Guardian logins are not on the roadmap.** They were considered and dropped:
a parent who taps a heart on a printed-slip link will not create an account,
and the role would have cost a new branch in every rule that reads
`me().role`. Reopen only if schools ask for parent comments specifically.

---

## 8. Privacy — the parts that are not optional

This feature puts photographs of children next to their names in a place where
other people can type. Three constraints, all enforced in code, none left to a
teacher's memory:

1. **Nothing on the wall is public.** No route, no signed URL, and no Storage
   path is reachable without either a session in that school or an unexpired
   parent token. `allow read: if signedIn()` on `school_posts` without
   `sameSchool()` would leak every school to every user — the check is not
   decoration.
2. **Consent is per child and defaults to no.** `media_consent: 'unset'`
   behaves exactly like `'denied'` at publish time. The admin dashboard gets a
   consent column and a bulk toggle; `publishPost` drops non-consenting
   children from `tagged` and tells the teacher which ones, so the omission is
   visible rather than a mystery.
3. **First name and class only.** Never a full name, never a date of birth,
   never a parent's phone number, in any wall document.

`src/components/PrivacyPage.tsx` needs a clause covering wall media, tagging,
consent and retention before this goes live. It currently describes activity
data only.

**Retention — OPEN.** Proposal: media older than 24 months is deleted by a
scheduled function unless the school opts out. Needs a decision before the
first upload, not after.

---

## 9. Tests

| File | What to add |
|---|---|
| `src/__tests__/routes.test.ts` | `/school-wall` → 200; `/wall/p/bad-token` renders without crashing |
| `src/__tests__/inline-scripts.test.ts` | add `/school-wall` to `ROUTES` |
| `src/__tests__/rules.test.ts` | new `describe`: another school's post is unreadable; a student cannot write a post; a like doc under a foreign uid fails; a student comment fails under `comments: 'staff'`; a staff `status` flip succeeds and a text edit fails |
| `src/__tests__/functions.test.ts` | `publishPost` drops a `media_consent: 'unset'` child from `tagged`; rejects a `media.path` outside the caller's staging prefix; rejects a school with `approval_status: 'pending'`; `createRosterStudents` skips duplicates and creates no invite; `appreciatePost` is idempotent for one token |

The rules tests run against the emulator via `npm run test:rules` and skip when
it is not up, so `npm test` stays green either way.

---

## 10. Phasing

| Phase | Scope | Ships |
|---|---|---|
| 1 ✅ | Auth card + `type: 'weekly'` school, `approveSchool`, `createRosterStudents`, dashboard checklist, consent column — plus `createTeacherAccount` / `resetTeacherPassword` (§12.2b) | A school can join and get its roster in |
| 2 — backend ✅ | `school_posts` rules, `publishPost`, `moderatePost`, `storage.rules`, indexes | The wall exists and enforces consent |
| 2 — UI ✅ | `/school-wall` read + post, compression, resumable upload, moderation | A working wall for staff |
| 3 ✅ | Parent links, `/wall/p#token`, `appreciatePost` | **The thing that sells this to schools** |
| 4 ✅ | Staff likes, comments, moderation, `countWallReactions` | Interaction inside the school |
| 5 ✅ | "Share today to the wall" from the teacher dashboard | Posting costs the teacher no second data entry |
| 6 ✅ | Weekly recap card (shareable image) + printable notice-board poster | Distribution |

Parent links moved ahead of comments deliberately. A wall no parent can see
is a wall the school stops updating by week four; comments are a feature the
school will not miss until it has an audience.

---

## 10a. Phase 4 — interaction inside the school

Likes are open to anyone signed in at the school, including families.
Comments are **staff only**: a wall carrying photographs of children is not a
place for a disagreement between two families to happen under somebody's
child.

`countWallReactions` is the sole writer of `like_count` and `comment_count`,
and the emphasis is on *sole*. `appreciatePost` had been incrementing the
counter itself since Phase 3; when the trigger landed, that increment had to
come out, or a parent's single heart would have counted twice with nothing in
the system ever recomputing the total from the documents.

One trigger serves both subcollections — two would be the same eight lines
twice, and they would drift. It counts creates and deletes only: hiding a
comment leaves the document in place, and a hidden comment still occupies a
row in the thread staff can see.

### Things the tests forced

**Deleting a post has to delete its subcollections.** Firestore does not do it
for you — a deleted document leaves its likes and comments addressable under a
path whose parent is gone. A post taken down because a parent asked would have
kept every like and comment written about their child, out of reach of the
dashboard meant to have removed it. `moderatePost` now empties both before it
deletes the post.

**A like must match the POST's school, not just the caller's.** See §2 — a
rules test caught a cross-school write that the original design had waved
through.

**Reactions are drawn only on published posts.** Liking something the school
has hidden, or has not approved yet, is applause for a thing nobody outside
the staff room can see.

**One like repaints one post, not the feed.** A full re-render would collapse
any comment thread somebody had open mid-read.

---

## 10b. Phase 5 — sharing the day without typing it twice

The plan said "Share to wall on a reviewed `activity_submission`". Building it
turned up the thing that changes the design: **a submission has no photograph
in it.** `activity_submissions` holds `gridState`, `discussionText`,
`chapter_id` and a review status — a filled worksheet, not an image. There was
never a picture to carry over.

So the handover is the *day*, not one submission. The teacher dashboard's
attendance panel — which already knows who turned up today and which chapters
they opened — gains **"Share today to the wall"**, and that carries across:

| Carried | From |
|---|---|
| `session_date` | today's attendance key |
| `text` | the distinct chapter titles opened today, joined |
| `tagged` | every student who took part |

The photographs stay the teacher's to add, which is the one part only they can
do. Everything fiddly — the date, the description, and tagging twenty children
one at a time — arrives already done.

**Handed over in `sessionStorage`, never in the URL.** The draft carries a list
of student ids; a query string would write children's identifiers into browser
history, the address bar, and any `Referer` header the next page sends.

**The draft is deleted as it is read.** Otherwise the composer would reopen
every time the teacher came back to the wall, over a session they had already
posted.

**Only children with consent arrive pre-ticked**, and the composer says how
many were left out. Pre-ticking a blocked child would render a checkbox that
is checked and disabled at once, and `publishPost` would drop the tag anyway —
the teacher would find out after posting instead of before.

**The tags are re-checked against the wall's own roster.** A student who left
between the dashboard rendering and the wall loading must not arrive as a tag
nobody can see.

---

## 10c. Phase 6 — the two things that actually travel

Both hang off a session card's header, staff only, and both work on the whole
day rather than one post.

**"Save card"** draws the day onto a 1080×1350 canvas — school name in a brand
band, the date, up to four photos, the note, and how many children took part —
then hands it to `navigator.share` where the phone has one, and a download
where it does not. Portrait because it is going into WhatsApp, which shows a
landscape image as a letterbox the size of a stamp.

**"Print poster"** fills a hidden `#poster` element and calls `window.print()`.
A print stylesheet hides the rest of the page: a school hitting Ctrl+P wants
the day on a wall, not a screenshot of a web page with a sticky bar across the
top. First names and classes only — the same rule the wall follows, and it
matters more here, because this ends up somewhere anyone walking past can read
it.

### Traps found while building it

**The template-literal backslash.** This whole script lives inside a JS
template literal, where an unrecognised escape is silently swallowed:
`split(/\s+/)` in the source reached the browser as `split(/s+/)`, so every
letter *s* in a teacher's note became a word break. The card read "The children
practi ed wudu tep by tep". Written `\\s` now, with a comment, because nothing
about the symptom points at the cause. No other component in the repo has this
— they all either double the backslash or avoid the escape.

**`requestAnimationFrame` before `window.print()`.** rAF does not fire at all
in a tab the browser is not compositing, so the print dialog would simply never
open, with nothing on screen to say why. A `setTimeout` fires either way.

**An ellipsis on text that fitted.** The wrapper appended "…" whenever it
filled its last allowed line, whether or not anything had been dropped — so
every school name short enough for one line was rendered with an ellipsis
after it, on the card that carries the school's own name.

**Canvas tainting is a real deploy risk.** Photos are drawn with
`crossOrigin: 'anonymous'`, which needs the site's origin in the bucket's CORS
list. `cors.json` covers the live domains; a new domain will produce a
`SecurityError` and the card will refuse to build. The error message says so
in those words rather than "something went wrong".

---

## 11. Decisions (formerly open)

**Video — images only, permanently for v1.** `media[].type` stays in the
schema so adding video later is a feature, not a migration. A 30-second clip
is 20–40 MB; on the connection these schools actually have, it is an upload
that fails halfway and a teacher who does not try again.

**Retention — kept while the school is active; purged 90 days after the
school is deactivated.** No 24-month timer. For a school that meets once a
week, the wall *is* the archive — three years of Saturdays is the whole
point, and silently deleting a parent's photographs on a schedule nobody
remembers agreeing to is worse than the storage bill. At 1600px/JPEG-0.82 a
school produces roughly 0.5 GB a year. The controls that matter instead:
admins delete any post at any time, and the super admin dashboard shows
per-school storage with a warning past 5 GB.

**Teacher posting — any teacher may post to any class in their own school.**
These schools often have one or two teachers running every class; a
per-class restriction would be friction with nothing behind it. `author_uid`
is recorded on every post, so accountability does not depend on the
restriction. Revisit only if a large school asks.

**`require_approval` — default off**, switch present from day one. The real
risk (a non-consenting child appearing in a photo) is handled by
`publishPost` refusing the tag, not by an admin reading every post. Making
the admin a gatekeeper on a school with one activity day would mean posts
appear on Wednesday for something that happened on Saturday.

**Parents — read-only, plus one appreciation, and no accounts.** Phase 3b
(guardian logins) is **dropped from the roadmap** rather than deferred. In
its place: a token holder may call `appreciatePost({ token, post_id })`,
which writes a like on the Admin SDK under the synthetic id
`guardian_<sha256(token)[0:16]>` — one appreciation per link per post, no
sign-up, no password, no new role in `firestore.rules`. Comments stay
staff-only.

That is the correct trade for this audience. A parent who receives a printed
slip will tap a heart; the same parent will not create an account, and the
guardian role would have cost a new branch in every rule that reads
`me().role`.

---

## 12. Registration — how one of these schools joins

### 12.1 These are not the schools the auth page was built for

`/auth` offered four cards: School Admin, Teacher, Student & Family,
Individual — and its own copy said *"Schools register directly. Teachers,
Students, and Parents need a school invitation code."* That whole model
assumes a full-time school where everyone eventually gets a login.

A community school has one teacher, two hundred children who will never log in,
and parents who want photographs. Putting it behind the existing **School
Admin** card would drop its admin into a dashboard whose first three actions —
invite teachers, invite students, hand out claim codes — are all wrong for
them. So it gets its own card.

### 12.2 But it does **not** get its own role

`users.role` stays `'school_admin'`. The difference lives on the school:

```
schools/{schoolId}
  type              'full_time' | 'weekly'     (NEW — the concept flag)
  meeting_day       'saturday' | 'sunday' | …  (NEW)
  approval_status   'pending' | 'approved'     (NEW — see 12.4)
  wall_enabled      boolean                    (§2)
```

A new role string would mean auditing every branch that reads
`me().role == 'school_admin'`, `isStaff()`, and `sameSchool()` — around eight
places in `firestore.rules`, each of them load-bearing. A field on the school
doc changes what the *dashboard renders* and costs the rules file nothing.

**The concept is a school type, not a permission level.** Keep it that way.

### 12.2b Nobody but a school registers any more

Building the card raised the obvious question about the other three: who
actually registers from this page? The answer turned out to be only schools.

- A **family** has been school-provisioned since `FAMILY_ACCOUNT_PLAN.md` —
  `createFamilyAccount` issues `PAR-XXXXX` + password and the parent signs in
  on the login panel. The registration card asked people who already held
  credentials to make a second account.
- A **teacher** was the exception, and only by omission: the admin dashboard
  minted a `TCH-` invite and the teacher built their own login at `/auth`.

So teachers are now provisioned the same way families are, and both cards are
gone from the role list:

| Callable | Issues |
|---|---|
| `createTeacherAccount` | `TCH-XXXXX` + password, role `teacher`, shown once |
| `resetTeacherPassword` | a new password for a lost one |

`resetTeacherPassword` is not a nicety. A `TCH-` login has no deliverable
address behind it, so Firebase's own reset email cannot reach the teacher —
without it, one forgotten password locks a teacher out of a school that
employs them, permanently.

**Separate login domains.** Families map to `family.imaanakhlaq.invalid`,
teachers to `staff.imaanakhlaq.invalid`, so a guessed username cannot cross
from one population to the other by changing three letters. Both domains are
pinned to `functions/index.js` by a test, because the failure when they drift
is silent: the username plainly exists, Firebase says "user not found", and
nothing in the error mentions a domain.

**Old codes still work.** `TCH-` and `STU-` invites handed out before this
change remain redeemable through a text link under the role list — a closing
path, deliberately not a card.

### 12.3 The auth page change

A fifth card in the `role-list` of `src/components/AuthPage.tsx` (around
line 1016), sitting directly under **School Admin**:

```
┌────────────────────────────────────────────────┐
│ 🗓  Community School                              │
│    Meets once a week. Add your whole roster    │
│    in one go and share activity photos with    │
│    parents — no logins for students.           │
└────────────────────────────────────────────────┘
```

- `onclick="selectRole('community')"` — `selectRole` and the
  `.reg-form-wrapper` show/hide machinery already exist; this is one more
  branch.
- Form `#form-community` = the existing school form plus one field, **"Which
  day do you meet?"**. Same OTP gate via `beginOtp` — no new verification
  path.
- `registerCommunitySchool()` is `registerSchool()` with a different school
  doc:

```js
await setDoc(doc(db, "users", user.uid), {
  role: 'school_admin',            // unchanged — no new role
  email, phone, name: admin, school_id: sId
});
await setDoc(doc(db, "schools", sId), {
  name, location: loc, school_code: code, admin_uid: user.uid,
  type: 'weekly',
  meeting_day: day,
  approval_status: 'pending',
  wall_enabled: false,             // §12.4
  wall_settings: { comments: 'staff', require_approval: false }
});
```

The `users` doc is still written **before** the school doc — the existing
comment on that ordering is not stylistic, the `schools` create rule calls
`me()` and needs the profile to exist.

- `selectRole` also accepts a deep link: `/auth?role=community` opens the card
  pre-selected, so a landing page can point straight at it.

**Naming.** "Community School" is my recommendation because it self-selects —
a school reading the four existing cards has no idea which one it is, and
this one is unmistakable. "Community School" is the alternative if some of
these meet on a weekday. Whatever the label, `type: 'weekly'` in the data
should not change with it.

### 12.4 Self-registration is open; the wall is not

Registration stays instant — email OTP, no waiting. The admin can immediately
add classes, import the roster, and set consent.

**The wall stays locked until a super admin approves the school.**
`wall_enabled: false` at creation; `publishPost` rejects anything from an
unapproved school; the dashboard shows *"Verification in progress"* on the
Wall tab.

This is the one place friction is worth it. Anyone with an email address can
create a school today — that was acceptable when a fake school could only
generate invite codes nobody would redeem. It is not acceptable when the same
account can upload photographs of children and hand out parent links. The
gate costs a real school one approval; it costs an impostor the whole
feature.

`SuperAdminDashboard.tsx` gets a **Pending Schools** list: name, city,
meeting day, admin email, phone, and one Approve button that sets
`approval_status: 'approved'` and `wall_enabled: true`.

### 12.5 The onboarding the admin actually sees

`public/admin-dashboard.html` branches on `school.type`. For `'weekly'` it
opens on a four-step checklist instead of the invite-code screens:

| Step | Action | Backed by |
|---|---|---|
| 1 | Add your classes | existing class management |
| 2 | Import your students | `createRosterStudents` (§3) |
| 3 | Mark photo consent | consent column (§8) |
| 4 | Post your first activity day | `publishPost` — unlocks on approval |

Teacher invites and student claim codes stay available, moved to an
**Advanced** section. A community school that later wants a second teacher, or
one family that wants a login, still has the whole existing machinery — it is
just no longer the first thing they see.

Each step reads its own state rather than storing a "completed" flag. A flag
goes stale the moment an admin deletes their last class, and then tells a
school it has finished something it has not. The panel hides itself once all
four are done — a permanent "you have finished" banner above the numbers is
just clutter.

The consent step is deliberately not satisfied by *some* students being
marked. Until every child has an answer recorded, the step stays open and says
how many are missing, because a child nobody was asked about is a child left
out of every photograph without anyone noticing.
