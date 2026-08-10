import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FAMILY_LOGIN_DOMAIN, FAMILY_USERNAME_PATTERN, familyLoginHelpersJS } from '../lib/familyLogin'

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
