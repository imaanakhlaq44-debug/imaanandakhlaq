# Individual and School entry review

Reviewed against the original source on 14 November 2026. This records implemented behavior separately from remaining feature migration.

## Original splash

`scripts/apk-splash.cjs` uses `public/kidba_assets/img/splash_logo.jpg`, animated lettering, loading decoration, and a role-based automatic redirect. The new user instruction replaces the automatic home redirect with two explicit choices. Flutter reuses the original logo without changing the characters, shows it while Firebase initializes, then applies a short fade/scale before the section selector. The logo is bundled locally and no video, remote font or PDF is fetched for these screens.

## Individual in the original app

* `src/components/AuthPage.tsx`: name, email, phone and password registration. `functions/index.js::setTrialOnSignup` stamps the three-day trial date. The client must not issue or extend it.
* `ActivityDashboard.tsx` and `ActivityPage.tsx`: shared stories and chapter activities, independent learner identity, seven-day activity grid available at the learner's own pace; individual submissions are self-verified instead of waiting for a school teacher.
* The club adds house discovery/quiz, daily habits and value-credit features. `isSelfVerifier()` permits independent learners to review their own entries; school students need their assigned mentor. This is real original behavior, not part of the eight future curriculum previews.
* A trial timestamp is created in the reviewed source, but a complete paid subscription or trial-expiry access gate was not found in these source paths. The new screens do not introduce payments or claim that a payment flow exists.

## School in the original app

* School self-registration creates a `school_admin` profile before the corresponding `schools` document, with administrator UID and school code.
* Teachers are provisioned by school staff and use `TCH-…` accounts. Family accounts use `PAR-…`; usernames map to the existing synthetic Firebase email identities through the shared login rules.
* There is no teacher, child or family self-registration. Some older comments in `AuthPage.tsx` describe an obsolete parent model; the actual `FamilyDashboard.tsx`, current callable functions and `FAMILY_ACCOUNT_PLAN.md` define the current family account model.
* Child records have `role: student`, `family_uid`, `school_id` and class details. A family list is queried by `family_uid`; children do not acquire a new login when added to a family. No records or past work should be deleted/recreated during this migration.
* `claimChild` validates a pending school-issued `STU-…` invite. A code already assigned to another family is refused; an unattached child can be linked by a valid claim. Flutter continues to call that existing server function rather than directly writing ownership.
* School learners' activity grid permits today's column, with work submitted for teacher review. The original parent PIN, staff provisioning, class management, review tools, house/mentor workflows and password resets must be evaluated as distinct native migration tasks.

The original School admin dashboard also includes overview, teacher/student rosters, class assignment, attendance, settings and bulk-import previews. The teacher dashboard includes overview, chapter reviews, club habits, rankings and a monthly log; review actions approve work or request a redo. These existing tools are recorded for native parity, not represented as implemented by the new login screens.

## Implemented in this change

1. Original-art splash → Individual / School selection, including when a login is remembered.
2. Individual → existing home/map/books, its own email sign-in and fixed Individual registration form.
3. School → school registration, administrator login, TCH teacher login, PAR family login. Forms cannot switch account type across sections. Teacher and family pages provide no create-account action.
4. Existing Firebase registration and sign-in services remain the data path; school details are sent as School registration, not Individual registration.
5. A signed-in account is checked against its actual profile role before entering the selected section. Switching section disposes the previous navigation tree and creates a fresh auth stream.
6. Family login continues to the existing live linked-child list. Available school/class names and recorded chapter counts are shown from the child profile. Ownership changes continue to remove access immediately.
7. Back navigation within the Individual tabs returns to home first; back from home returns to the section selector. Back from School forms returns to its portal.

## Remaining limits

This is the section-entry and authentication migration, not full feature parity. Native school administration/teacher review dashboards, parent PIN and club/house workflows are still pending. The Individual Hadith course now has a five-lesson playable preview; other curricula and school assignment remain pending (see HADITH_DEMO.md). The prepared native activity-saving callable still needs deployment. Live sign-up/email delivery and real school account operations were not exercised against production in this change; automated integration checks use fake repositories. Legacy phone-number sign-in is not yet exposed in these native forms.

## Verification

32 Flutter tests passed, including initial splash/selection, separate sign-up paths, School registration request type, family username validation, linked-child navigation, wrong-section handling, section switching, back navigation, existing map/books/activity checks and large-text small-screen layout. Static analysis passed. The debug Android arm64 APK built successfully. In the live pane, the section selector, actual-role mismatch guard, School portal and PAR family login were inspected; the pane was left on the two-section selector. No production registration or child linking was submitted.
