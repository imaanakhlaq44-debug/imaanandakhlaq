/**
 * Teacher logins are usernames, not email addresses.
 *
 * A school-provisioned teacher signs in with something like TCH-7K4QM.
 * Firebase Auth only understands email-shaped credentials, so the client turns
 * that username into the same synthetic address the Cloud Function created the
 * account with.
 *
 * That means the domain lives in two packages: here, and in
 * functions/index.js. If the two ever disagree, every teacher login fails with
 * "user not found" and nothing in the error hints at why. The test in
 * src/__tests__/teacherLogin.test.ts reads the string out of the functions
 * source and asserts it still matches this one.
 *
 * See src/lib/familyLogin.ts — parents work exactly the same way, on their own
 * domain so the two namespaces can never collide.
 */

/** Must stay identical to TEACHER_LOGIN_DOMAIN in functions/index.js. */
export const TEACHER_LOGIN_DOMAIN = 'teacher.imaanakhlaq.invalid';

/** Usernames are 'TCH-' plus characters from the unambiguous code alphabet. */
export const TEACHER_USERNAME_PATTERN = '^TCH-[A-Z0-9]{4,8}$';

/**
 * Helpers for the inline auth script. Embed inside a <script> block:
 * ${teacherLoginHelpersJS}
 */
export const teacherLoginHelpersJS = `
  var TEACHER_LOGIN_DOMAIN = '${TEACHER_LOGIN_DOMAIN}';
  var TEACHER_USERNAME_RE = new RegExp('${TEACHER_USERNAME_PATTERN}');

  function isTeacherUsername(value) {
    return TEACHER_USERNAME_RE.test(String(value || '').trim().toUpperCase());
  }

  // Lowercased to match how the Cloud Function built the address. Firebase
  // treats the local part case-sensitively on lookup, so 'TCH-7K4QM@...' and
  // 'tch-7k4qm@...' are not the same account.
  function teacherUsernameToEmail(value) {
    return String(value || '').trim().toLowerCase() + '@' + TEACHER_LOGIN_DOMAIN;
  }
`
