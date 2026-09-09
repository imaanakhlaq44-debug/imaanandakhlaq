# App ko ek page (SPA) banane ka plan

Status: tajweez, abhi manzoor nahi. Likha gaya 9 Sep 2026.

## 1. Aaj ki haalat

App ki har screen alag HTML file hai. Har navigation par WebView poora naya page load karta hai: 550 KB CSS, 617 KB Firebase, session restore, phir data. Har tap par 1 se 3 second ka jhatka isi ka nateeja hai.

Code ka hajam (sirf logged-in hissa):

| Screen | File | Lines | `window.x =` globals | inline `onclick` |
|---|---|---|---|---|
| Login / registration | AuthPage.tsx | 2,330 | 22 | 38 |
| Student dashboard | ActivityDashboard.tsx | 4,849 | 29 | 24 |
| Activity (kitab + task) | ActivityPage.tsx | 2,084 | 1 | 2 |
| Teacher dashboard | TeacherDashboard.tsx | 4,856 | 33 | 47 |
| School admin | public/admin-dashboard.html | 7,180 | 67 | 107 |
| Super admin | SuperAdminDashboard.tsx | 1,705 | 11 | 12 |
| Family | FamilyDashboard.tsx | 666 | 5 | 6 |
| Club | ClubPortal.tsx | 589 | 2 | 2 |
| School wall | SchoolWall.tsx | 1,582 | 18 | 16 |
| Qibla, Tasbeeh, FAQs, Azkar, About | scripts/apk-bottombar.cjs | ~2,300 | | |

Kul taqreeban 28,000 lines page code, 190 globals, 250 inline handlers. Har page apna Firebase init karta hai, apna session restore karta hai, apna "Restoring session" overlay rakhta hai. Ye sab ek jagah aana chahiye.

Website (marketing pages, blog, about) alag masla hai; ye plan un ko chhoota nahi.

## 2. Manzil

- Ek `app.html` (shell). CSS aur Firebase ek baar load, session ek baar restore.
- Har screen ek module: `mount(root, params)`, `unmount()`, `onBack()`.
- Router: `#/student`, `#/activity?book=3`, `#/teacher`, `#/admin`, `#/qibla` waghaira. Hash routing is liye ke Hostinger par koi rewrite rule nahi chahiye.
- Screens ke beech slide/fade transition, data cache mein, dobara khulne par foran.
- Hardware back, keyboard, bottom bar, layer stack (modal, sheet, drawer) shell ka kaam. Screens sirf apna `onBack()` batati hain.
- Purane links (`/student-activities.html`, `/teacher-dashboard.html`) kaam karte rahein: chhoti redirect files jo `app.html#/...` par bhej dein.

## 3. Do raste

**Rasta A: framework rewrite (Preact ya Svelte).** Har screen ko components mein dobara likhna. Nateeja sab se saaf, lekin 28,000 lines ka imperative DOM code logic samait dobara likhna hai: 2 se 3 mahine, aur is dauran do code bases (purana web, naya app) sath chalane parenge.

**Rasta B: shell + modules (tajweez).** Screens ka HTML, CSS aur logic waisa hi rehta hai; sirf uska "lifafa" badalta hai: global functions module functions ban jate hain, inline `onclick` event delegation ban jate hain, page-level init `mount()` ban jata hai. Ye asli SPA hai (ek page, ek Firebase, instant navigation) lekin logic ka rewrite nahi. 4 se 5 hafte ek aadmi ke liye. Baad mein chahein to screen by screen framework par le ja sakte hain, kyunke boundaries ban chuki hongi.

Neeche ka plan Rasta B ka hai.

## 4. Architecture (Rasta B)

```
src/app/
  app.html            shell: head, CSS links, <div id="screen">, bottom bar, layers
  main.ts             boot: Firebase once, session, router, back, keyboard
  router.ts           hash routes, params, transitions, screen cache
  session.ts          ek onAuthStateChanged, profile, role, auth_user cache
  layers.ts           modal / sheet / drawer stack; back sab se upar wali band karta hai
  ui/                 toast, skeleton, sheet, confirm dialog (sab screens share karein)
  data/               Firestore reads with in-memory cache + offline persistence
  screens/
    auth/             login, register, PIN, family claim
    student/          dashboard, sections, parent gate, club
    activity/         reader + task (student ke andar hi khulta hai)
    teacher/          dashboard, book reader, attendance, register
    admin/            school admin (static html se module)
    superadmin/
    family/
    tools/            qibla, tasbeeh, faqs, azkar, about
```

Har screen ka shakal:

```ts
export default {
  css: () => import('./teacher.css?inline'),   // pehli baar inject, prefix .scr-teacher
  html: () => template,                        // HTML string, ids ki jagah data-ref
  mount(root, params, ctx) { ... },            // ctx: session, data, layers, router
  onBack() { return false },                   // true = maine sambhal liya
  unmount() { listeners, timers, subscriptions saaf }
}
```

Qawaid jo har screen par lagu honge:

1. `window.xyz =` mana. Har function module ke andar. Buttons `data-action="save"` ke zariye ek delegated listener tak pahunchte hain.
2. `document.getElementById` sirf `root` ke andar (`root.querySelector`). Do screens memory mein ho sakti hain; ids takra sakte hain.
3. Firebase `ctx.db`, `ctx.auth` se; screen khud `initializeApp` nahi karti.
4. Session ka intezar screen nahi karti; router screen tab hi mount karta hai jab session ready ho. 12 second wali polling khatam.
5. Har listener/timer/onSnapshot `unmount()` mein band.

## 5. Marhale aur waqt

Andaza ek developer ka hai, full time. Har marhala khud test ho kar phone par chalne ke qabil hai; app kisi marhale par rok kar release ho sakti hai kyunke purane pages tab tak zinda rehte hain.

| # | Marhala | Din | Kya milta hai |
|---|---|---|---|
| 0 | Shell: router, session, layers, back, keyboard, bottom bar, transitions, skeleton, ek test screen | 3 | Buniyad. APK build scripts (`apk-shell`, `apk-bottombar`) shell ka hissa ban jate hain |
| 1 | Auth screen (login, registration, PIN, family, resume) | 3 | Login ke baad dashboard bina reload ke khulta hai |
| 2 | Student dashboard + Activity + Club + Parent gate | 6 | Sab se zyada istemal wala safar (dashboard ↔ kitab) instant |
| 3 | Teacher dashboard + book reader + teacher-reader | 5 | |
| 4 | School admin (7,180 lines, static html se module; roster import lazy hi rahega) | 6 | |
| 5 | Super admin, Family, Qibla/Tasbeeh/FAQs/Azkar/About | 3 | Har screen shell mein; purane html files sirf redirect |
| 6 | Polish: offline cache, transitions, Android back har screen par, keyboard, low-end phone par jank test, Play release | 4 | |

Kul 30 kaam ke din, yani 6 hafte ek aadmi ke liye. Do log (ek dashboards, ek shell/auth/admin) 3.5 se 4 hafte.

## 6. Website par asar

- Marketing pages, blog, about: koi tabdeeli nahi. SSG waise hi chalta rahega.
- `/auth`, `/student-activities`, `/teacher-dashboard`, `/admin-dashboard`, `/family` par web par bhi shell chalega (`app.html#/...`). Ye web ke liye bhi behtar hai; alag versions rakhne ki zaroorat nahi.
- `public/admin-dashboard.html` aur `app.ts` ka wo khaas route jo use padh kar config badalta hai, khatam. Admin bhi baqi screens jaisa module.
- `.htaccess` ko hath nahi lagana; hash routing static hosting par chal jati hai.

## 7. Khatray aur unka hal

| Khatra | Hal |
|---|---|
| 190 globals, 250 inline onclick: mechanical lekin bohat | Ek script (`scripts/migrate-screen.cjs`) jo `window.x =` ko module export aur `onclick="x(...)"` ko `data-action` mein badal de; baqi hath se |
| Do screens ke ids takrana | Screen ka DOM `root` se bahar na jaye; `unmount()` poora DOM hata de |
| Memory barhna (listeners, onSnapshot) | `unmount()` lazmi; shell ek screen se zyada memory mein na rakhe siwaye pichhli ke |
| Admin dashboard ka size | Marhala 4 ko do hisson mein: pehle students/teachers/families tabs, phir settings/import |
| Tests: `routes.test.ts`, `inline-scripts.test.ts` purani shakal par | Marhala 0 mein hi in ko shell ke mutabiq karna; nayi screen ke liye mount/unmount smoke test |
| Release branch (`claude/explain-again-110996`) ke APK scripts alag hain | Marhala 0 mein release branch ko main par le aana, phir aage sirf main |
| Website aur app ek hi shell: web bug app mein bhi | Ye faida bhi hai; `isApp()` guard sirf native cheezon (back, keyboard, bar) ke liye |

## 8. Jo nahi badalta

Firebase rules, Cloud Functions, Firestore data, Play Store release ka tareeqa, keystore, `.env`. Backend ko ye plan chhoota nahi.

## 9. Faisle jo aap ko karne hain

1. Rasta B (shell + modules) ya Rasta A (framework)? Tajweez B.
2. Web par bhi shell chale ya sirf app mein? Tajweez dono; alag rakhna do guna kaam hai.
3. Kab shuru: abhi wali build (back, bar, fonts) phone par test hone ke baad, ya us se pehle?
4. Kaun karega: ek aadmi 6 hafte, ya do 4 hafte.
