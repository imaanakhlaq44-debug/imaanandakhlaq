/**
 * Family logins are usernames, not email addresses.
 *
 * A school-provisioned parent signs in with something like PAR-7K4QM. Firebase
 * Auth only understands email-shaped credentials, so the client turns that
 * username into the same synthetic address the Cloud Function created the
 * account with.
 *
 * That means the domain lives in two packages: here, and in
 * functions/index.js. If the two ever disagree, every family login fails with
 * "user not found" and nothing in the error hints at why. The test in
 * src/__tests__/familyLogin.test.ts reads the string out of the functions
 * source and asserts it still matches this one — cheap, because both files
 * are in this repo.
 */

/** Must stay identical to FAMILY_LOGIN_DOMAIN in functions/index.js. */
export const FAMILY_LOGIN_DOMAIN = 'family.imaanakhlaq.invalid';

/** Usernames are 'PAR-' plus characters from the unambiguous code alphabet. */
export const FAMILY_USERNAME_PATTERN = '^PAR-[A-Z0-9]{4,8}$';

/**
 * Teachers are provisioned the same way and sign in the same way — a TCH-
 * username, not an email. The school hands out the credentials; there is no
 * teacher self-registration any more.
 *
 * A separate domain from the family one, so that a leaked or guessed username
 * cannot cross from one population to the other by changing three letters.
 * Must stay identical to STAFF_LOGIN_DOMAIN in functions/index.js.
 */
export const STAFF_LOGIN_DOMAIN = 'staff.imaanakhlaq.invalid';

/** Same shape as the family pattern, different prefix. */
export const STAFF_USERNAME_PATTERN = '^TCH-[A-Z0-9]{4,8}$';

/**
 * Helpers for the inline auth script. Embed inside a <script> block:
 * ${familyLoginHelpersJS}
 */
export const familyLoginHelpersJS = `
  var FAMILY_LOGIN_DOMAIN = '${FAMILY_LOGIN_DOMAIN}';
  var FAMILY_USERNAME_RE = new RegExp('${FAMILY_USERNAME_PATTERN}');
  var STAFF_LOGIN_DOMAIN = '${STAFF_LOGIN_DOMAIN}';
  var STAFF_USERNAME_RE = new RegExp('${STAFF_USERNAME_PATTERN}');

  function isFamilyUsername(value) {
    return FAMILY_USERNAME_RE.test(String(value || '').trim().toUpperCase());
  }

  function isStaffUsername(value) {
    return STAFF_USERNAME_RE.test(String(value || '').trim().toUpperCase());
  }

  // Lowercased to match how the Cloud Function built the address. Firebase
  // treats the local part case-sensitively on lookup, so 'PAR-7K4QM@...' and
  // 'par-7k4qm@...' are not the same account.
  function familyUsernameToEmail(value) {
    return String(value || '').trim().toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN;
  }

  function staffUsernameToEmail(value) {
    return String(value || '').trim().toLowerCase() + '@' + STAFF_LOGIN_DOMAIN;
  }

  /**
   * The one entry point the login screen should use: hand it whatever was
   * typed and get back the address to sign in with, or null when it is an
   * ordinary email and should be used as-is.
   */
  function usernameToEmail(value) {
    if (isFamilyUsername(value)) return familyUsernameToEmail(value);
    if (isStaffUsername(value)) return staffUsernameToEmail(value);
    return null;
  }
`
