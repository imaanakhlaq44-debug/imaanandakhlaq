/**
 * The pages the Android app is allowed to show — one list, used everywhere.
 *
 * This list was written out by hand in three places, and every one of them had
 * to be updated to add a page:
 *
 *   1. the Capacitor route guard in Head.tsx, which sends anything unlisted to
 *      auth.html;
 *   2. patchApkInternalLinks() in scripts/apk-splash.cjs, which rewrites
 *      "/page" links to "/page.html" because the APK is served from a file
 *      tree with no extensionless routing;
 *   3. a second copy of (1) in the same script, which overwrote whatever
 *      Head.tsx had emitted.
 *
 * Adding /reading-plan to the first one and not the others is what made the
 * Daily reading button restart the app at the splash screen: the link stayed
 * "/reading-plan", nothing in the APK answers that path, and Capacitor's local
 * server falls back to index.html — which is the splash.
 *
 * (3) is gone. (1) and (2) now both come from here. Nothing about a missing
 * entry is visible at build time, so src/__tests__/backButton.test.ts checks
 * that this list still reaches both of them.
 */

/**
 * Page names, without a leading slash or a .html suffix. Marketing pages are
 * deliberately absent: the APK never shows them, and the guard bouncing them
 * to the login screen is the intended behaviour.
 */
export const APK_PAGES = [
  'auth',
  'student-activities',
  'family',
  'reading-plan',
  'teacher-dashboard',
  'teacher-reader',
  'admin-dashboard',
  'super-admin-dashboard',
  'activity',
  'club',
] as const

/** The guard's array literal, e.g. "'/auth', '/student-activities', …". */
export const apkAllowedRoutesJS = APK_PAGES.map((page) => "'/" + page + "'").join(', ')

/**
 * Where each role lands after signing in, and where a remembered session
 * resumes to.
 *
 * This was written out four times: twice in AuthPage.tsx's two login handlers,
 * once in a dashboardFor() helper whose comment claimed it was "in one place",
 * and once in the APK splash script in scripts/apk-splash.cjs. The splash copy
 * was a role short — it had no branch for super_admin — so a signed-in super
 * admin reopening the app was sent to the login page instead of their
 * dashboard.
 *
 * 'parent' is absent on purpose: those accounts are retired and the login
 * handlers show them a message rather than a destination.
 */
export const ROLE_HOME: Record<string, string> = {
  super_admin: 'super-admin-dashboard.html',
  school_admin: 'admin-dashboard.html',
  teacher: 'teacher-dashboard.html',
  student: 'student-activities.html',
  individual: 'student-activities.html',
  family: 'family.html',
}

/**
 * The same map as a JS literal, for the inline scripts that cannot import it —
 * AuthPage.tsx's compat block and the splash page the APK build writes.
 */
export const roleHomeJS = JSON.stringify(ROLE_HOME)
