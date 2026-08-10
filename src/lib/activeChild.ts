/**
 * Active child — who the dashboards are currently working as.
 *
 * Two identities used to be the same thing. They are not any more:
 *
 *   familyUid   the account that is SIGNED IN
 *   studentUid  the child whose work is being read and written
 *
 * On a legacy account they still coincide — a self-registered student signs in
 * as themselves. On a school-provisioned family account they do not: one login
 * owns several children, none of which has a login of its own.
 *
 * Every call site that means "the learner" must go through studentUid, never
 * through auth.currentUser.uid. That distinction is the whole point of this
 * file, and getting it wrong writes one child's homework onto another's sheet.
 *
 * The dashboard runs its Firebase code inside an inline <script type="module">
 * with CDN imports, so it cannot import this file at runtime. Following the
 * same pattern as firebaseConfigJS and parentGateService, the helpers are
 * exported as a JS source string that the component interpolates into that
 * script.
 */

/** localStorage key prefix for the remembered child, one entry per family. */
export const ACTIVE_CHILD_STORAGE_PREFIX = 'imaan_active_child:';

/** What acResolveIdentity() hands back. */
export interface ActiveIdentity {
  /** True when the signed-in /users doc has role 'family'. */
  isFamilyAccount: boolean;
  /** The owning family. '' on a legacy account that has never been linked. */
  familyUid: string;
  /** The learner. '' on a family account until a child card is opened. */
  studentUid: string;
}

/**
 * Helpers for the inline dashboard scripts. Embed inside a
 * <script type="module"> block:  ${activeChildHelpersJS}
 */
export const activeChildHelpersJS = `
  const AC_KEY_PREFIX = '${ACTIVE_CHILD_STORAGE_PREFIX}';

  // Remembered per family, per device. Two children on two phones stay on
  // their own profile; the same phone reopens whoever used it last.
  function acRecall(familyUid) {
    if (!familyUid) return '';
    try { return localStorage.getItem(AC_KEY_PREFIX + familyUid) || ''; }
    catch (e) { return ''; }
  }

  function acRemember(familyUid, childUid) {
    if (!familyUid || !childUid) return;
    try { localStorage.setItem(AC_KEY_PREFIX + familyUid, childUid); }
    catch (e) {}
  }

  function acForget(familyUid) {
    if (!familyUid) return;
    try { localStorage.removeItem(AC_KEY_PREFIX + familyUid); }
    catch (e) {}
  }

  /**
   * Work out who we are from the signed-in uid and that account's /users doc.
   * Pass the raw doc data; a missing doc is treated as a legacy account, which
   * is what every account is until the family rollout reaches its school.
   */
  function acResolveIdentity(authUid, userData) {
    const data = userData || {};

    if (data.role === 'family') {
      // The account is the parent. studentUid stays empty until a card is
      // opened — callers must handle that rather than falling back to authUid,
      // which is not a learner and owns no submissions.
      return {
        isFamilyAccount: true,
        familyUid: authUid,
        studentUid: acRecall(authUid)
      };
    }

    // A legacy self-registered student, or an individual trial account: the
    // signed-in account IS the learner. A school-created child doc also lands
    // here if it is ever signed into directly, and carries family_uid.
    return {
      isFamilyAccount: false,
      familyUid: data.family_uid || '',
      studentUid: authUid
    };
  }

  /**
   * Stamp ownership onto a document the learner owns.
   *
   * family_uid is written only when there is one. Legacy docs must stay
   * without the field: the Firestore rules read it with get('family_uid', '')
   * and match it against the caller, so writing a placeholder or an empty
   * string would be worse than writing nothing.
   */
  function acOwnership(identity) {
    const owner = { student_uid: identity.studentUid };
    if (identity.familyUid) owner.family_uid = identity.familyUid;
    return owner;
  }
`
