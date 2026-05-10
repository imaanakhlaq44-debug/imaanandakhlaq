# Imaan & Akhlaq App - Finalized Logic & Rules
**This file serves as a permanent record of finalized features, rules, and UI logic for the app. Do not delete or overwrite these rules during future updates.**

## 1. App Navigation & Back Button (Capacitor)
- **Dashboard Pages as Root:** `student-activities`, `parent-dashboard`, `teacher-dashboard`, `admin-dashboard`, and `super-admin-dashboard` are treated as "Home" pages in the Android APK. 
- **Back Button Behavior:** Pressing the hardware back button on any dashboard will NOT navigate back to the marketing website (`index.html`). Instead, it will prompt the user with "Press back again to exit" and safely minimize/exit the app using `App.exitApp()`.
- **Implementation File:** `public/kidba_assets/js/apk-bottombar.js` inside `isHomeLikePage()`.

## 2. Activity Grid (7-Days) Interaction Rules
- **School Students:** Can only interact with the grid column corresponding to the *current day* (Today). Past days are locked (read-only), and future days are disabled.
- **Independent Learners (`role === 'individual'`):** Have unrestricted access. All 7 days of the activity grid are unlocked and interactive at any time, allowing parents and children to complete tasks at their own pace.
- **Implementation File:** `src/components/ActivityPage.tsx` inside `setupInteractiveCells()`.

## 3. Parent Dashboard UI & Stats Cards
- **Compact Layout:** The statistics cards (Reward Points, Chapters Completed, Pending Reviews) on the Parent Dashboard follow the exact mobile-first compact design of the Student Dashboard.
- **Styling Details:** The grid displays as 3 columns on mobile (`grid-template-columns: repeat(3, minmax(0, 1fr))`), 3D icons are hidden to save space, and content is centered with appropriate padding.
- **Implementation File:** `src/components/ParentDashboard.tsx` under the `@media (max-width: 1100px)` media query.

## 4. Book Accordion UI (Student Dashboard)
- **Interactive Books:** Books in the student dashboard expand to reveal their chapters when clicked (Accordion style) instead of navigating to a new page immediately.
- **Styling:** Injected specific mobile-friendly CSS constraints to ensure the book list looks native and prevents "black background" issues on smaller Android devices.
- **Implementation File:** `src/components/ActivityDashboard.tsx`

## 5. Firebase & Firestore Integration
- **Imports:** Always use standard CDN imports for Firebase modules in pure JS template blocks (e.g., `await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js')`). Do not use bare specifiers like `firebase/firestore` as Vite cannot resolve them inside injected raw HTML strings.

---
*(Note: Any AI assistant reading this file in the future must strictly adhere to these rules and avoid undoing them during refactoring or feature additions.)*
