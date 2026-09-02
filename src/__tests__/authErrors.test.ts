import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { handleFirebaseError, authErrorHelpersJS } from '../lib/errorHandler'

/**
 * The login screen must never show Firebase's own wording.
 *
 * Firebase throws messages like "Firebase: Error (auth/wrong-password)." and
 * AuthPage.tsx used to put them straight on screen. Two things are wrong with
 * that: a parent cannot act on it, and on the first screen a Play reviewer
 * opens it reads as an unfinished build — the same impression the debug
 * banners gave before they were pulled.
 *
 * The wording lives in one map in errorHandler.ts, used by handleFirebaseError
 * for bundled code and emitted as source by authErrorHelpersJS for the inline
 * <script> blocks, which cannot import it.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

// Rebuild the browser-side helper the same way the page does, so this tests the
// shipped implementation rather than a copy of it.
function browserHelper() {
  // eslint-disable-next-line no-new-func
  return new Function(authErrorHelpersJS + '; return friendlyAuthError;')() as
    (err: any, fallback?: string) => string
}

describe('sign-in errors are written for people', () => {
  const friendly = browserHelper()

  it('translates the codes a parent actually hits', () => {
    expect(friendly({ code: 'auth/wrong-password' })).toBe('Wrong password. Please try again.')
    expect(friendly({ code: 'auth/invalid-email' })).toBe('That email address does not look right.')
    expect(friendly({ code: 'auth/user-disabled' })).toBe('This account has been turned off. Please contact your school.')
    expect(friendly({ code: 'auth/too-many-requests' })).toBe('Too many attempts. Please wait a few minutes and try again.')
    expect(friendly({ code: 'auth/network-request-failed' })).toBe('No internet connection. Please check and try again.')
  })

  it('reads the code back out of a raw Firebase message', () => {
    // Some paths hand over the thrown Error's message rather than an object
    // carrying .code, which is how "Firebase: Error (auth/user-disabled)."
    // reached a real phone's screen.
    expect(friendly({ message: 'Firebase: Error (auth/wrong-password).' }))
      .toBe('Wrong password. Please try again.')
    expect(friendly({ message: 'Firebase: Error (auth/user-disabled).' }))
      .toBe('This account has been turned off. Please contact your school.')
  })

  it('never lets Firebase wording through, even for a code it does not know', () => {
    const unknown = friendly({ code: 'auth/something-invented-later' })
    expect(unknown).not.toMatch(/Firebase/i)
    expect(unknown).not.toMatch(/auth\//)

    const rawUnknown = friendly({ message: 'Firebase: Error (auth/invented-later).' })
    expect(rawUnknown).not.toMatch(/Firebase/i)
    expect(rawUnknown).not.toMatch(/auth\//)

    expect(handleFirebaseError({ code: 'auth/invented-later' })).not.toMatch(/Firebase/i)
    expect(handleFirebaseError({ message: 'Firebase: Error (auth/x).' })).not.toMatch(/Firebase/i)
  })

  it('honours the caller\'s fallback, and passes plain messages through', () => {
    expect(friendly({ code: 'auth/invented' }, 'Registration failed. Please try again.'))
      .toBe('Registration failed. Please try again.')
    // Not a Firebase error at all — the app's own wording should survive.
    expect(friendly({ message: 'User record not found in system.' }))
      .toBe('User record not found in system.')
  })

  it('AuthPage reports every error through the helper', () => {
    const page = read('src/components/AuthPage.tsx')

    // The four sites that used to print the raw message.
    const raw = page.match(/showToast(?:Compat)?\(\s*(?:error|err)\.message/g) || []
    expect(raw, 'AuthPage is showing a raw Firebase message again').toEqual([])

    expect(page).toContain('window.friendlyAuthError')
    // The helper has to be defined outside both script blocks: the legacy one
    // is wrapped in an IIFE and the module one has its own scope, so neither
    // can see a function declared inside the other.
    const helperAt = page.indexOf('authErrorHelpersJS')
    const legacyAt = page.indexOf('__apkLegacyAuthInit')
    expect(helperAt).toBeGreaterThan(-1)
    expect(helperAt).toBeLessThan(legacyAt)
  })
})
