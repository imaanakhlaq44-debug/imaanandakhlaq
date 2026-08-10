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
 * Helpers for the inline auth script. Embed inside a <script> block:
 * ${familyLoginHelpersJS}
 */
export const familyLoginHelpersJS = `
  var FAMILY_LOGIN_DOMAIN = '${FAMILY_LOGIN_DOMAIN}';
  var FAMILY_USERNAME_RE = new RegExp('${FAMILY_USERNAME_PATTERN}');

  function isFamilyUsername(value) {
    return FAMILY_USERNAME_RE.test(String(value || '').trim().toUpperCase());
  }

  // Lowercased to match how the Cloud Function built the address. Firebase
  // treats the local part case-sensitively on lookup, so 'PAR-7K4QM@...' and
  // 'par-7k4qm@...' are not the same account.
  function familyUsernameToEmail(value) {
    return String(value || '').trim().toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN;
  }
`
