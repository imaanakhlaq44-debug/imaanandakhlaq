import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  TEACHER_LOGIN_DOMAIN,
  TEACHER_USERNAME_PATTERN,
  teacherLoginHelpersJS,
} from '../lib/teacherLogin'
import { FAMILY_LOGIN_DOMAIN } from '../lib/familyLogin'

/**
 * Same guard the family login has, for the same reason: the username is
 * turned into a synthetic email in two separately-deployed packages, and
 * nothing but this test makes them agree. When they disagree Firebase reports
 * "user not found" for a username that plainly exists, and no error anywhere
 * mentions a domain.
 */
const functionsSource = readFileSync(
  resolve(__dirname, '../../functions/index.js'),
  'utf-8'
)

describe('Teacher login domain', () => {
  it('matches the domain the Cloud Function creates accounts with', () => {
    const match = functionsSource.match(/const TEACHER_LOGIN_DOMAIN = '([^']+)'/)
    expect(match, 'TEACHER_LOGIN_DOMAIN not found in functions/index.js').toBeTruthy()
    expect(match![1]).toBe(TEACHER_LOGIN_DOMAIN)
  })

  it('builds the same address the function used, lowercased', () => {
    // teacherEmail() in functions/index.js is username.toLowerCase() + '@' + domain.
    expect('TCH-7K4QM'.toLowerCase() + '@' + TEACHER_LOGIN_DOMAIN)
      .toBe('tch-7k4qm@teacher.imaanakhlaq.invalid')
  })

  it('keeps teachers and families in separate namespaces', () => {
    // One domain for both would let a PAR- and a TCH- account collide on the
    // same address, and the second createUser would fail for no visible reason.
    expect(TEACHER_LOGIN_DOMAIN).not.toBe(FAMILY_LOGIN_DOMAIN)
  })

  it('accepts the usernames the function generates and rejects other logins', () => {
    const re = new RegExp(TEACHER_USERNAME_PATTERN)
    // TEACHER_USERNAME_LENGTH is 5 in functions/index.js, drawn from
    // CODE_ALPHABET, which is uppercase letters and digits.
    expect(re.test('TCH-7K4QM')).toBe(true)
    expect(re.test('PAR-7K4QM')).toBe(false)
    expect(re.test('STU-7K4QM')).toBe(false)
    expect(re.test('teacher@school.com')).toBe(false)
    expect(re.test('+923001234567')).toBe(false)
  })

  it('emits helpers the inline auth script can use', () => {
    expect(teacherLoginHelpersJS).toContain(TEACHER_LOGIN_DOMAIN)
    expect(teacherLoginHelpersJS).toContain('function isTeacherUsername')
    expect(teacherLoginHelpersJS).toContain('function teacherUsernameToEmail')
  })
})

/**
 * The login page has to branch on a TCH- username before it falls through to
 * the phone-number lookup. Without that branch a teacher's username is
 * stripped to digits and looked up as a phone, and the school-issued
 * credentials fail with an error blaming the phone number — exactly the bug
 * families hit in the APK before their branch existed.
 */
const authPageSource = readFileSync(
  resolve(__dirname, '../components/AuthPage.tsx'),
  'utf-8'
)

describe('Auth page', () => {
  it('signs a teacher in by username in both login handlers', () => {
    // One handler in the compat IIFE, one in the module script.
    const branches = authPageSource.match(/isTeacherUsername\(rawId\)/g) || []
    expect(
      branches.length,
      'AuthPage.tsx has a login handler with no TCH- branch; a teacher username ' +
      'would be treated as a phone number and refused.'
    ).toBe(2)
    expect(authPageSource).toContain('teacherUsernameToEmail(rawId)')
  })

  it('no longer offers teachers a way to register themselves', () => {
    // The school provisions the login now. A second door would let a teacher
    // create an account the school cannot reset or even identify.
    expect(authPageSource).not.toContain('id="regTchCode"')
    expect(authPageSource).not.toContain("selectRole('teacher')")
    expect(authPageSource).not.toContain("registerWithCode('teacher')")
  })
})
