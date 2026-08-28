# Paper Workflow — Implementation Plan

A community school prints the activity sheet, the children fill it in by hand,
the teacher collects the sheets and records them. No child needs a login, a
phone, or a parent.

Extends `SCHOOL_GROUP_PLAN.md`. Everything there assumed the wall was the whole
feature; this plan is what happens when the rest of the app has to reach the
same children.

---

## 1. The gap this exists to close

`createRosterStudents` gives a community school its roster without logins —
`roster_only: true`, no auth account, no family. That was the right call and
it stands.

But `firestore.rules` lets exactly two parties create an
`activity_submissions` document:

```js
allow create: if signedIn() && (
  request.resource.data.student_uid == request.auth.uid ||   // the student
  isMyFamily(request.resource.data)                          // their family
);
```

A roster-only student is neither. They have no uid to sign in with and no
family attached. So:

> **For a community school, no activity submission can ever exist.** No
> attendance, no progress, no points, no teacher review queue. Of the whole
> app, only the wall works.

Six phases of wall shipped without anyone noticing, because the wall genuinely
does work — it just turned out to be the only thing that did. The paper
workflow is not a nice-to-have on top; it is how these schools use the
product at all.

### Why the fix is a callable, not a rules branch

The obvious patch is to let staff create submissions for same-school students.
It should not be done:

- A rule cannot tell *transcribing a sheet the child filled in* from
  *inventing work the child never did*. Both are a teacher writing into a
  child's record.
- `sameSchool()` would make one compromised teacher account able to write
  into all 298 children's records directly, with nothing recording who did it.

A callable on the Admin SDK stamps `recorded_by` and `source: 'paper'` on
every row it writes, so the record always says a teacher typed this. That is
the same split that already protects `club_points` and `school_posts`.

---

## 2. What gets printed

**The activity sheet, not the book.** The teacher's Book Library is
deliberately view-only with downloads disabled, "to protect content"
(`TeacherDashboard.tsx`). Printing the book would quietly undo that decision,
and it is not this plan's decision to undo. **OPEN** — if the school does need
printed books, that is a separate call about content protection, not a
side effect of printing worksheets.

The sheet is generated from data the repo already has. `activities.json`
carries, per chapter:

```
{ id, title, pageStart, pageEnd, discussionQuestion,
  sections: [ { heading, questions: [...] } ] }
```

which is exactly what the on-screen grid is built from. A printed sheet is the
same table with empty boxes.

### One sheet per child, name pre-printed

| Part | Content |
|---|---|
| Header | School name, chapter title, the week's date |
| Identity | **Child's first name + class, pre-printed** |
| Grid | Each section's questions × 7 day columns, empty boxes |
| Discussion | The chapter's `discussionQuestion` + ruled lines |

Pre-printing the name is not decoration. Two hundred sheets go out and come
back in a pile; a name written in the corner by a seven-year-old is how they
get mixed up, and the teacher entering them later would be matching
handwriting to a roster. It also means the sheet can carry a small code the
entry screen can jump to.

A **blank** variant (no name) prints too, for a child who turns up unlisted.

### Printing a whole class at once

One button on the teacher dashboard: pick chapter, pick class, print. One
page per child, `page-break-after: always`, A4 portrait. Same approach as the
notice-board poster in `SCHOOL_GROUP_PLAN.md` §10c — a hidden print root and a
print stylesheet, not a new route.

**Full names never appear on a printed sheet either.** First name and class,
the same rule the wall follows, because a stack of sheets leaves the classroom
in a child's bag.

---

### What P1 actually shipped

A new **Activity Sheets** section on the teacher dashboard: pick a chapter
(all 63, across every book, flattened from `activities.json`), pick a class,
pick the week, print. One page per child, plus a **blank sheet** for a child
who turns up unlisted.

Decisions made while building it:

- **The class list comes from the roster, not a fixed 1–10.** A school that
  names its classes "Nazra" and "Hifz" would otherwise print nothing and be
  told nothing about why.
- **A confirmation above 60 pages.** Selecting "All classes" on a roster of
  three hundred is usually a misclick, and it is three hundred sheets if it
  is not.
- **`setTimeout` before `window.print()`, never `requestAnimationFrame`** —
  rAF does not fire in a tab the browser is not compositing, so the dialog
  would never open and nothing on screen would say why. The same trap the
  notice-board poster hit.
- **The name is split with `/\\s+/`, doubled.** This script lives inside a
  template literal, where a lone `\s` is swallowed and the regex becomes
  `/s+/` — which would split a child's name on the letter *s*. Caught here
  because it had already shipped once on the recap card.

---

## 3. What the teacher records afterwards

Here is where the plan resists the obvious design.

The obvious design is to give the teacher the same grid the child would have
tapped, and let them re-enter it. Do the arithmetic first: 21 questions × 7
days is **147 cells per child**. For one class of thirty that is 4,410 taps,
every week. Nobody will do it twice, and a teacher who does it once and stops
leaves the school worse off than if the feature had never shipped — the data
now looks maintained and is not.

So the system does not ask for the cells.

### The sheet is the record; the system holds the outcome

| Recorded | How |
|---|---|
| This child completed this chapter, on this date | one tap, in bulk |
| Their discussion answer | optional typed field |
| **The sheet itself** | optional photograph, attached to the submission |

The photograph is the honest artefact. It is the child's actual handwriting,
it takes the teacher a few seconds, and it reuses the compression and
resumable upload the wall already has. `gridState` stays absent on a paper
submission rather than being filled with invented numbers — a summary nobody
counted is worse than no summary.

The review modal renders `gridState` today; for `source: 'paper'` it renders
the scan instead, and falls back to "recorded from paper — no scan attached"
when there is none.

### New callable: `recordActivityForStudent`

```
recordActivityForStudent({
  school_id?, chapter_id, book_id, session_date,
  students: [{ student_uid, discussion_text?, scan_path? }]
}) -> { recorded: [...], skipped: [{ student_uid, reason }] }
```

- `requireStaff(request, ['teacher', 'school_admin', 'super_admin'])`.
- Max 60 students per call; the client chunks. One batch per call.
- Per student it writes `activity_submissions/{student_uid}_{chapter_id}` —
  the same id shape the student flow uses, so nothing downstream needs to know
  which route the work came in by.
- Stamps `source: 'paper'`, `recorded_by`, `recorded_at`.
- `reviewStatus: 'teacher_approved'`. The teacher marked the paper; asking
  them to queue their own transcription for their own review is theatre.
- Also writes `activity_attendance` for `session_date`, which is what the
  register and the wall's "Share today" already read.
- Also updates `game_state` — `completed`, `teacher_approved`, `points += 50`
  — the same award the logged-in path gives, because the child did the same
  work.
- `scan_path` is verified against the caller's own staging prefix and moved,
  exactly as `publishPost` does with wall media. A client-supplied path is
  otherwise an invitation to attach any file in the bucket.

### Idempotency

Re-recording the same chapter for the same child overwrites the submission and
does **not** award points twice — `game_state.teacher_approved` is checked
first, the same guard `awardTeacherPoints` uses today. A teacher who loses
their place in a pile of sheets will re-enter some of them; that must be
boring, not expensive.

---

## 4. The teacher's screen

A new **Activities** section on the teacher dashboard:

1. Pick a chapter (from `activities.json`) and a class.
2. **Print sheets** — the whole class, one page each.
3. Later: the same list, now as a check-off roster. Tick the children whose
   sheets came back. Optionally open one to type their discussion answer or
   photograph the sheet.
4. **Record** — one call, the whole class.

The list is the roster the teacher already sees elsewhere, filtered by class.
Children who cannot be photographed are not treated differently here — consent
governs the wall, not whether a child's work is recorded.

---

## 5. Orphans, and who the audience is

The reason this plan exists at all: a school where many children have no
parents. `SCHOOL_GROUP_PLAN.md` §7 built parent links on an assumption that
does not hold for them — that every child has someone to hand a link to.

Nothing needs to be built to fix it. What was built already serves them, and
in one case serves them better:

**The notice-board poster is the answer.** It hangs in the school, and the
child sees their own name and their own photograph on it. For a child with
nobody to receive a link, this is the thing that gives them exactly what every
other child gets from a parent's phone. It was designed as a distribution
channel; it turns out to be the fairness mechanism.

**A parent link is bound to a child, not to a parent.** It can go to an uncle,
a grandmother, or the warden of the home the child lives in. Nothing in
`issueParentLink` says "parent" except the label.

**Consent for a child in the school's care is the school's to record.** The
system already supports this — the admin marks it — and it should stay a
deliberate act about that particular child, not a blanket setting. **OPEN:**
whether the roster should carry a `guardian_type` so the school can tell later
why it answered for a child. Leaning yes, as a note field rather than a
category.

---

## 6. Rules changes

Almost none, which is the point.

- `activity_submissions` — **no new client branch**. The callable writes on the
  Admin SDK. The existing staff `update` branch already lets a teacher correct
  a submission afterwards.
- `users` — `game_state` is already in the teacher update whitelist.
- Storage — one new staging prefix for sheet scans, mirroring
  `wall_staging/{schoolId}/{uid}/`:

```
paper_staging/{schoolId}/{uid}/{file}    written by the teacher, read by them
paper/{schoolId}/{submissionId}/{file}   moved there by the callable
```

---

## 7. Tests

| File | What to add |
|---|---|
| `src/__tests__/functions.test.ts` | records a whole class in one call; refuses a student from another school; does not award points twice for the same chapter; rejects a `scan_path` outside the caller's staging prefix; writes attendance for `session_date` |
| `src/__tests__/rules.test.ts` | a teacher still cannot create an `activity_submissions` document directly — the callable is the only route |
| `src/__tests__/inline-scripts.test.ts` | the teacher dashboard still parses |

---

## 8. Phasing

| Phase | Scope | Ships |
|---|---|---|
| P1 ✅ | Printable class sheets from the teacher dashboard | Children can do the activity on paper |
| P2 | `recordActivityForStudent` + the check-off screen | Their work exists in the system |
| P3 | Sheet scans attached to submissions | The evidence is the child's own handwriting |
| P4 | Review modal renders paper submissions | The existing queue reads them properly |

P1 alone is worth shipping: a school can start using paper immediately, and
the wall already handles photographs of the results.

---

## 9. Open questions

- **Printed books.** The library is view-only on purpose. Does the school need
  printed book pages too, and if so, is that decision being revisited?
- **Points for paper work.** 50 per chapter, the same as the on-screen path?
  It keeps the leaderboard comparable, but a class recorded in bulk earns
  faster than a child tapping through the app alone.
- **`guardian_type` on the roster** — see §5.
- **A child with no sheet returned.** Nothing is recorded, which is correct;
  should the screen show who is missing, the way the consent step counts who
  has not been asked? Leaning yes.
