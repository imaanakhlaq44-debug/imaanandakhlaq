# Imaan & Akhlaq — 1.4.6 (build 38)

Previous release on Play: **1.3 (build 31)**, 29 May 2026.
62 commits between the two.

---

## A. Play Console "What's new" — English (paste this)

> The app is now 28 MB instead of 148 MB — quicker to install, lighter on your phone.
>
> New: parents get their own account, with a card for every child and a daily reading plan to go through together. The Imaan Akhlaq Club tracks daily habits a mentor signs off. Teachers sign in with a username their school issues.
>
> Fixed: pinching to zoom no longer turns the page, the back button behaves on every screen, and the leaderboard loads. Clearer navigation across all dashboards.

---

## B. Play Console "What's new" — Urdu (optional second language)

> ایپ اب 148 MB کے بجائے 28 MB کی ہے — انسٹال تیز، فون پر بوجھ کم۔
>
> نیا: والدین کا اپنا اکاؤنٹ، ہر بچے کا الگ کارڈ، اور روزانہ کا ریڈنگ پلان جو بچے کے ساتھ پڑھا جائے۔ ایمان و اخلاق کلب روزمرہ عادتیں سنبھالتا ہے جن پر مینٹور دستخط کرتا ہے۔ اساتذہ اب اسکول کے دیے ہوئے یوزرنیم سے لاگ اِن کرتے ہیں۔
>
> درست کیا گیا: زوم کرنے پر صفحہ نہیں پلٹتا، بیک بٹن ہر اسکرین پر ٹھیک کام کرتا ہے، اور لیڈر بورڈ لوڈ ہوتا ہے۔

---

## C. Full changelog (internal record — not for the store)

### Families

- **Family accounts.** A parent now has an account of their own instead of
  borrowing the child's. One card per child on the family dashboard, and a way
  into each of them.
- **Reading plan.** The 133-day plan — a value, a verse, a hadith, a story and a
  question to ask afterwards — used to be reachable only through the activity
  page's "Family Sync Time" gate, which self-study families never reached. It has
  its own page now, and follows the child's progress rather than a calendar.
- **The Parent Area is gone** from inside the student dashboard. It was the
  pre-family design: a parent's view tucked behind a PIN because a parent had no
  account to sign into. They have one now.
- Work now goes straight to the teacher. The old parent-approval step is retired.

### Schools and teachers

- **Teacher logins are provisioned by the school.** A teacher gets a username
  (TCH-7K4QM) and a password, shown once. Previously they registered themselves
  with an invite code, and the school could never answer which address they had
  used or how to reset it.
- Schools get a **Parents section**, and a way to convert a roster they are
  already running.
- Collision-safe invite codes.
- Roster import auto-detects columns.

### The club

- **The Imaan Akhlaq Club** — daily habits a mentor has to sign off.
- The **Value Economy**, and a way into the club without a school.

### Reading

- **Pinch to zoom no longer turns the page.** The page-flip library counted every
  finger on the book as a page turn, so a child zooming flipped three or four
  pages, and a fingertip resting on the paper turned it. Only a deliberate swipe
  flips now.
- Page-curl reader for teachers.
- PDF reader: 3x quality, scroll/button/pinch zoom.

### The app itself

- **148 MB → 28 MB.** The books are served from Firebase Storage and were being
  shipped inside the bundle as well; the homepage illustrations and hero slider
  were shipping too, on pages the app can never open.
- **Update prompt on launch.** Android updates apps in the background whenever it
  feels like it, so a school could sit on an old build for weeks. The app now
  asks.
- **Back button** behaves the same on every screen. On the school admin dashboard
  two handlers were answering the same press.
- **Pull-to-refresh** no longer arms on the student dashboard — children scroll it
  hard and fast, and most of what looked like a pull was not one.
- Splash screen and every icon regenerated from one master logo.

### Dashboards

- One design system across student, teacher, school-admin and super-admin.
  Each had grown its own 2,000-line stylesheet, so the same idea was drawn four
  different ways.
- **Student navigation is clearer.** The sidebar items are buttons now, each with
  its own brand colour, and the phone's bottom bar finally shows which section is
  open — it used to look identical no matter where you were.
- One navigation on the student dashboard instead of three; one logout button
  instead of two.
- Leaderboard reads a collection it is actually allowed to read. It had been
  failing on permissions.
- Books fit a phone screen.
- Sora font actually loads.

### Security

- Stopped deploying a permission-fix PHP script.
- Firestore rules and Cloud Functions covered by emulator tests.
