import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs
} from 'firebase/firestore'

/**
 * Firestore rules, exercised against the emulator.
 *
 * Compiling proves only that the file parses. What matters is whether the
 * family branches added alongside every student_uid check actually reach one
 * household's children and no one else's — and, just as important, that the
 * legacy student paths still behave exactly as they did.
 *
 * Run with:  npm run test:rules
 * (firebase emulators:exec sets FIRESTORE_EMULATOR_HOST, which is what these
 * tests skip on when the emulator is not up, so `npm test` stays green.)
 */

const HAS_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST

const SCHOOL = 'school-1'
const FAMILY = 'family-1'
const OTHER_FAMILY = 'family-2'
const CHILD = 'child-1'
const SIBLING = 'child-2'
const OUTSIDER_CHILD = 'child-3'
const LEGACY_STUDENT = 'legacy-1'
const OTHER_LEGACY = 'legacy-2'
const TEACHER = 'teacher-1'

let env: RulesTestEnvironment

describe.skipIf(!HAS_EMULATOR)('Firestore rules', () => {
  beforeAll(async () => {
    const [host, port] = String(process.env.FIRESTORE_EMULATOR_HOST).split(':')
    env = await initializeTestEnvironment({
      projectId: 'imaan-rules-test',
      firestore: {
        host,
        port: Number(port),
        rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf-8')
      }
    })
  })

  afterAll(async () => { if (env) await env.cleanup() })

  beforeEach(async () => {
    await env.clearFirestore()
    // Seed through an admin context so the rules do not gate the fixtures.
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'users', FAMILY), { role: 'family', school_id: SCHOOL, name: 'Ahmed Family' })
      await setDoc(doc(db, 'users', OTHER_FAMILY), { role: 'family', school_id: SCHOOL, name: 'Khan Family' })
      await setDoc(doc(db, 'users', TEACHER), { role: 'teacher', school_id: SCHOOL, name: 'Teacher' })

      await setDoc(doc(db, 'users', CHILD), { role: 'student', school_id: SCHOOL, family_uid: FAMILY, name: 'Abdullah' })
      await setDoc(doc(db, 'users', SIBLING), { role: 'student', school_id: SCHOOL, family_uid: FAMILY, name: 'Maryam' })
      await setDoc(doc(db, 'users', OUTSIDER_CHILD), { role: 'student', school_id: SCHOOL, family_uid: OTHER_FAMILY, name: 'Zainab' })

      // No family_uid at all: exactly the shape of every account that exists
      // today, and the reason the family branches had to be additive.
      await setDoc(doc(db, 'users', LEGACY_STUDENT), { role: 'student', school_id: SCHOOL, name: 'Legacy' })
      await setDoc(doc(db, 'users', OTHER_LEGACY), { role: 'student', school_id: SCHOOL, name: 'Other Legacy' })

      await setDoc(doc(db, 'activity_submissions', CHILD + '_c1'), {
        student_uid: CHILD, family_uid: FAMILY, school_id: SCHOOL, reviewStatus: 'pending_teacher'
      })
      await setDoc(doc(db, 'activity_submissions', OUTSIDER_CHILD + '_c1'), {
        student_uid: OUTSIDER_CHILD, family_uid: OTHER_FAMILY, school_id: SCHOOL, reviewStatus: 'pending_teacher'
      })
      await setDoc(doc(db, 'activity_submissions', LEGACY_STUDENT + '_c1'), {
        student_uid: LEGACY_STUDENT, school_id: SCHOOL, reviewStatus: 'pending_teacher'
      })
    })
  })

  const asFamily = () => env.authenticatedContext(FAMILY).firestore()
  const asOtherFamily = () => env.authenticatedContext(OTHER_FAMILY).firestore()
  const asLegacy = () => env.authenticatedContext(LEGACY_STUDENT).firestore()
  const asTeacher = () => env.authenticatedContext(TEACHER).firestore()

  describe('legacy students are unaffected', () => {
    it('reads their own submission', async () => {
      await assertSucceeds(getDoc(doc(asLegacy(), 'activity_submissions', LEGACY_STUDENT + '_c1')))
    })

    it('cannot read another student submission', async () => {
      await assertFails(getDoc(doc(asLegacy(), 'activity_submissions', CHILD + '_c1')))
    })

    it('can still save their own work', async () => {
      await assertSucceeds(updateDoc(
        doc(asLegacy(), 'activity_submissions', LEGACY_STUDENT + '_c1'),
        { gridState: { yes: 1 } }
      ))
    })

    it('can create work with no family_uid on it', async () => {
      await assertSucceeds(setDoc(
        doc(asLegacy(), 'activity_submissions', LEGACY_STUDENT + '_c2'),
        { student_uid: LEGACY_STUDENT, school_id: SCHOOL }
      ))
    })
  })

  describe('a family reaches its own children only', () => {
    it('reads its own child profile', async () => {
      await assertSucceeds(getDoc(doc(asFamily(), 'users', CHILD)))
    })

    it('cannot read a child of another family', async () => {
      await assertFails(getDoc(doc(asFamily(), 'users', OUTSIDER_CHILD)))
    })

    it('cannot read a legacy student who belongs to no family', async () => {
      await assertFails(getDoc(doc(asFamily(), 'users', LEGACY_STUDENT)))
    })

    it('lists its children by family_uid', async () => {
      const snap = await assertSucceeds(getDocs(query(
        collection(asFamily(), 'users'), where('family_uid', '==', FAMILY)
      )))
      expect((snap as any).size).toBe(2)
    })

    it('cannot list another family children', async () => {
      await assertFails(getDocs(query(
        collection(asFamily(), 'users'), where('family_uid', '==', OTHER_FAMILY)
      )))
    })

    it('cannot list every student in the school', async () => {
      await assertFails(getDocs(query(
        collection(asFamily(), 'users'), where('school_id', '==', SCHOOL)
      )))
    })
  })

  describe('a family and its children work', () => {
    it('reads its child submissions filtered by family_uid', async () => {
      const snap = await assertSucceeds(getDocs(query(
        collection(asFamily(), 'activity_submissions'), where('family_uid', '==', FAMILY)
      )))
      expect((snap as any).size).toBe(1)
    })

    it('cannot read another family submissions', async () => {
      await assertFails(getDoc(doc(asFamily(), 'activity_submissions', OUTSIDER_CHILD + '_c1')))
    })

    it('creates a submission stamped with its own family_uid', async () => {
      await assertSucceeds(setDoc(doc(asFamily(), 'activity_submissions', CHILD + '_c2'), {
        student_uid: CHILD, family_uid: FAMILY, school_id: SCHOOL
      }))
    })

    it('cannot forge a submission for another family', async () => {
      await assertFails(setDoc(doc(asFamily(), 'activity_submissions', OUTSIDER_CHILD + '_c2'), {
        student_uid: OUTSIDER_CHILD, family_uid: OTHER_FAMILY, school_id: SCHOOL
      }))
    })

    it('cannot hand its own submission to another family', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'activity_submissions', CHILD + '_c1'), {
        family_uid: OTHER_FAMILY
      }))
    })

    it('cannot rewrite work the teacher already approved', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), 'activity_submissions', CHILD + '_c1'), {
          reviewStatus: 'teacher_approved'
        })
      })
      await assertFails(updateDoc(
        doc(asFamily(), 'activity_submissions', CHILD + '_c1'),
        { gridState: { yes: 9 } }
      ))
    })

    it('cannot approve its own child work', async () => {
      await assertFails(updateDoc(
        doc(asFamily(), 'activity_submissions', CHILD + '_c1'),
        { reviewStatus: 'teacher_approved' }
      ))
    })
  })

  describe('what a family may change on a child', () => {
    it('updates game_state', async () => {
      await assertSucceeds(updateDoc(doc(asFamily(), 'users', CHILD), { game_state: { points: 50 } }))
    })

    it('cannot change the child role', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'users', CHILD), { role: 'teacher' }))
    })

    it('cannot move the child to another school', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'users', CHILD), { school_id: 'school-2' }))
    })

    it('cannot move the child into another family', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'users', CHILD), { family_uid: OTHER_FAMILY }))
    })

    it('cannot claim an unattached legacy student', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'users', LEGACY_STUDENT), { family_uid: FAMILY }))
    })

    it('cannot touch a child of another family', async () => {
      await assertFails(updateDoc(doc(asOtherFamily(), 'users', CHILD), { game_state: { points: 999 } }))
    })
  })

  describe('staff are unaffected', () => {
    it('a teacher still reads same-school students', async () => {
      const snap = await assertSucceeds(getDocs(query(
        collection(asTeacher(), 'users'), where('school_id', '==', SCHOOL)
      )))
      expect((snap as any).size).toBeGreaterThan(0)
    })

    it('a teacher still reads a family child submission', async () => {
      await assertSucceeds(getDoc(doc(asTeacher(), 'activity_submissions', CHILD + '_c1')))
    })
  })
})
