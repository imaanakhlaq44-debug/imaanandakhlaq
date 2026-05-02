import { describe, it, expect } from 'vitest'
import { FIREBASE_CONFIG, firebaseConfigJS } from '../lib/firebaseConfig'

describe('Firebase Config', () => {
  it('should have all required config keys', () => {
    expect(FIREBASE_CONFIG).toHaveProperty('apiKey')
    expect(FIREBASE_CONFIG).toHaveProperty('authDomain')
    expect(FIREBASE_CONFIG).toHaveProperty('projectId')
    expect(FIREBASE_CONFIG).toHaveProperty('storageBucket')
    expect(FIREBASE_CONFIG).toHaveProperty('messagingSenderId')
    expect(FIREBASE_CONFIG).toHaveProperty('appId')
  })

  it('should have non-empty values for all keys', () => {
    Object.values(FIREBASE_CONFIG).forEach(value => {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    })
  })

  it('should point to the correct project', () => {
    expect(FIREBASE_CONFIG.projectId).toBe('imaan-app-1d2da')
  })

  it('firebaseConfigJS should be a valid JS object literal string', () => {
    expect(firebaseConfigJS).toContain('apiKey')
    expect(firebaseConfigJS).toContain('authDomain')
    expect(firebaseConfigJS).toContain('projectId')
    // Should be parseable as JS (it's an object literal)
    expect(firebaseConfigJS.trim()).toMatch(/^\{/)
    expect(firebaseConfigJS.trim()).toMatch(/\}$/)
  })
})
