/**
 * Parent Gate — shared PIN helpers.
 *
 * The dashboard runs its Firebase code inside an inline <script type="module">
 * with CDN imports, so it cannot import this file at runtime. Following the
 * same pattern as firebaseConfigJS, the helpers are exported as a JS source
 * string that the component interpolates into that script. Defining them here
 * once means the salt and the hash algorithm can never drift between two
 * copies — if they did, every existing PIN would silently stop matching.
 */

/** Shape of the `parentGate` field on a user doc. */
export interface ParentGateConfig {
  isConfigured: boolean;
  /** SHA-256 of the PIN plus PG_SALT. Never store the PIN itself. */
  pinHash: string;
  lastUnlockedAt?: string;
  autoLockMinutes: number;
}

/** Minutes of inactivity before the Parent Area locks itself again. */
export const PARENT_GATE_AUTO_LOCK_MINUTES = 5;

/**
 * Helpers for the inline dashboard script. Embed inside a
 * <script type="module"> block:  ${parentGateHelpersJS}
 */
export const parentGateHelpersJS = `
  const PG_SALT = '_parent_gate_salt_imaan';
  const PG_AUTO_LOCK_MINUTES = ${PARENT_GATE_AUTO_LOCK_MINUTES};
  const PG_AUTO_LOCK_MS = PG_AUTO_LOCK_MINUTES * 60 * 1000;

  async function pgHashPin(pin) {
    const data = new TextEncoder().encode(String(pin).trim() + PG_SALT);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function pgIsValidPin(pin) {
    return /^\\d{4}$/.test(String(pin).trim());
  }
`
