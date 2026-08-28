import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  FAMILY_LOGIN_DOMAIN, FAMILY_USERNAME_PATTERN, familyLoginHelpersJS,
  STAFF_LOGIN_DOMAIN, STAFF_USERNAME_PATTERN
} from '../lib/familyLogin'

/**
 * The parent's username is turned into a synthetic email in two places: the
 * Cloud Function that creates the account, and the login page that signs them
 * in. They are in different packages and are deployed separately, so nothing
 * makes them agree except this test.
 *
 * When they disagree the failure is silent and total — Firebase reports
 * "user not found" for a username that plainly exists, and no error anywhere
 * mentions a domain.
 */
const functionsSource = readFileSync(
  resolve(__dirname, '../../functions/index.js'),
  'utf-8'
)

describe('Family login domain', () => {
  it('matches the domain the Cloud Function creates accounts with', () => {
    const match = functionsSource.match(/const FAMILY_LOGIN_DOMAIN = '([^']+)'/)
    expect(match, 'FAMILY_LOGIN_DOMAIN not found in functions/index.js').toBeTruthy()
    expect(match![1]).toBe(FAMILY_LOGIN_DOMAIN)
  })

  it('builds the same address the function used, lowercased', () => {
    // familyEmail() in functions/index.js is username.toLowerCase() + '@' + domain.
    expect('PAR-7K4QM'.toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN)
      .toBe('par-7k4qm@family.imaanakhlaq.invalid')
  })

  it('accepts the usernames the function generates and rejects other logins', () => {
    const re = new RegExp(FAMILY_USERNAME_PATTERN)
    // FAMILY_USERNAME_LENGTH is 5 in functions/index.js, drawn from
    // CODE_ALPHABET, which is uppercase letters and digits.
    expect(re.test('PAR-7K4QM')).toBe(true)
    expect(re.test('STU-7K4QM')).toBe(false)
    expect(re.test('parent@example.com')).toBe(false)
    expect(re.test('+923001234567')).toBe(false)
  })

  it('emits helpers the inline auth script can use', () => {
    expect(familyLoginHelpersJS).toContain(FAMILY_LOGIN_DOMAIN)
    expect(familyLoginHelpersJS).toContain('function isFamilyUsername')
    expect(familyLoginHelpersJS).toContain('function familyUsernameToEmail')
  })
})

/**
 * Teachers are now provisioned the same way families are, so the same silent
 * failure is possible: a TCH- username that plainly exists, refused with
 * "user not found", and no error anywhere mentioning a domain.
 */
describe('Staff login domain', () => {
  it('matches the domain the Cloud Function creates accounts with', () => {
    const match = functionsSource.match(/const STAFF_LOGIN_DOMAIN = '([^']+)'/)
    expect(match, 'STAFF_LOGIN_DOMAIN not found in functions/index.js').toBeTruthy()
    expect(match![1]).toBe(STAFF_LOGIN_DOMAIN)
  })

  it('is a different domain from the family one', () => {
    // Deliberate: a guessed username must not cross from one population to the
    // other by changing three letters.
    expect(STAFF_LOGIN_DOMAIN).not.toBe(FAMILY_LOGIN_DOMAIN)
  })

  it('accepts the usernames the function generates and nothing else', () => {
    const re = new RegExp(STAFF_USERNAME_PATTERN)
    expect(re.test('TCH-7K4QM')).toBe(true)
    expect(re.test('PAR-7K4QM')).toBe(false)
    expect(re.test('STU-7K4QM')).toBe(false)
    expect(re.test('teacher@example.com')).toBe(false)
  })

  it('routes each username to its own domain', () => {
    // usernameToEmail is the single entry point the login screen uses. If it
    // ever sent a TCH- login to the family domain, the account would not exist
    // and the teacher would be told their password was wrong.
    const scope: any = {}
    new Function(familyLoginHelpersJS + '; this.usernameToEmail = usernameToEmail;').call(scope)

    expect(scope.usernameToEmail('TCH-7K4QM')).toBe('tch-7k4qm@' + STAFF_LOGIN_DOMAIN)
    expect(scope.usernameToEmail('PAR-7K4QM')).toBe('par-7k4qm@' + FAMILY_LOGIN_DOMAIN)
    // An ordinary email is not a username and must be used exactly as typed.
    expect(scope.usernameToEmail('teacher@example.com')).toBeNull()
  })
})

/**
 * The APK is built by rewriting dist/auth.html. For a while one of those
 * rewrites swapped in its own copy of window.loginUser, written before family
 * accounts existed: it stripped the hyphen out of PAR-7K4QM and looked the
 * result up as a phone number. The credentials a school printed worked on the
 * website and failed in the app, with an error blaming the phone number.
 *
 * Any handler the APK build injects has to know about family usernames, or
 * that comes straight back.
 */
const apkSplashSource = readFileSync(
  resolve(__dirname, '../../scripts/apk-splash.cjs'),
  'utf-8'
)

describe('APK auth patch', () => {
  it('does not ship a login handler that cannot sign a family in', () => {
    // Every window.loginUser the patch script writes into the page — the string
    // appears in comments too, so only assignments count.
    const handlers = apkSplashSource.split(/window\.loginUser\s*=/).slice(1)

    for (const handler of handlers) {
      // Each injected handler is a self-contained block; the next injection or
      // the end of the template ends it. Checking the 4 KB after the assignment
      // is enough to cover one handler body.
      const body = handler.slice(0, 4000)
      expect(
        body.includes('isFamilyUsername'),
        'apk-splash.cjs injects a window.loginUser with no family-username branch. ' +
        'A PAR- login would be treated as a phone number and refused in the APK.'
      ).toBe(true)
    }
  })
})
