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
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs
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
const SUPER = 'hq-1'

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
  const asSuper = () => env.authenticatedContext(SUPER).firestore()

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

  // -------------------------------------------------------------------
  // Club habit logs
  // -------------------------------------------------------------------
  // The club is only worth something if a student cannot pay themselves.
  // Everything below is really one claim tested from several directions:
  // create a pending log, yes; decide its outcome, never.
  describe('club habit logs', () => {
    // Comfortably over REFLECTION_MIN (60). Every tick has to carry one now,
    // so the factory does too — a log without it is a separate test below.
    const REFLECTION =
      'I told my friend the truth about breaking his pencil even though I was afraid he would be angry with me.'
    const KEY = REFLECTION.toLowerCase()

    const pendingLog = (studentUid: string, familyUid?: string) => {
      const log: Record<string, unknown> = {
        student_uid: studentUid,
        school_id: SCHOOL,
        house: 'sidq',
        habit_id: 'sidq_daily_truth',
        habit_name: 'Daily Truth',
        log_date: '2026-08-14',
        status: 'pending',
        reflection_text: REFLECTION,
        reflection_key: KEY
      }
      if (familyUid) log.family_uid = familyUid
      return log
    }

    it('a student ticks their own habit', async () => {
      await assertSucceeds(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'),
        pendingLog(LEGACY_STUDENT)
      ))
    })

    it('a family ticks a habit for its own child', async () => {
      await assertSucceeds(setDoc(
        doc(asFamily(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth'),
        pendingLog(CHILD, FAMILY)
      ))
    })

    it('a family cannot tick for another family child', async () => {
      await assertFails(setDoc(
        doc(asOtherFamily(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth'),
        pendingLog(CHILD, FAMILY)
      ))
    })

    it('a student cannot file a log in another student name', async () => {
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', OTHER_LEGACY + '_2026-08-14_sidq_daily_truth'),
        pendingLog(OTHER_LEGACY)
      ))
    })

    it('refuses a log that arrives already approved', async () => {
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_own_it'),
        { ...pendingLog(LEGACY_STUDENT), habit_id: 'sidq_own_it', status: 'approved' }
      ))
    })

    it('refuses a log that arrives carrying its own credits', async () => {
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_own_it'),
        { ...pendingLog(LEGACY_STUDENT), habit_id: 'sidq_own_it', points_awarded: 500 }
      ))
    })

    it('refuses a house that does not exist', async () => {
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_bogus'),
        { ...pendingLog(LEGACY_STUDENT), house: 'greenhouse' }
      ))
    })

    it('refuses a tick with no reflection at all', async () => {
      const log = pendingLog(LEGACY_STUDENT)
      delete log.reflection_text
      delete log.reflection_key
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_own_it'),
        { ...log, habit_id: 'sidq_own_it' }
      ))
    })

    it('refuses a reflection too short to be a sentence', async () => {
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_own_it'),
        { ...pendingLog(LEGACY_STUDENT), habit_id: 'sidq_own_it', reflection_text: 'did it', reflection_key: 'did it' }
      ))
    })

    it('refuses a tick that omits the duplicate-detection key', async () => {
      const log = pendingLog(LEGACY_STUDENT)
      delete log.reflection_key
      await assertFails(setDoc(
        doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_own_it'),
        { ...log, habit_id: 'sidq_own_it' }
      ))
    })

    it('lets a student rewrite a reflection while it is still pending', async () => {
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'
      await assertSucceeds(setDoc(doc(asLegacy(), 'habit_logs', id), pendingLog(LEGACY_STUDENT)))
      const better = REFLECTION + ' I said sorry and offered to buy him a new one from my own pocket money.'
      await assertSucceeds(updateDoc(doc(asLegacy(), 'habit_logs', id), {
        reflection_text: better,
        reflection_key: better.toLowerCase(),
        updated_at: '2026-08-14T10:00:00.000Z'
      }))
    })

    it('will not let a rewrite drop below the floor', async () => {
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'
      await assertSucceeds(setDoc(doc(asLegacy(), 'habit_logs', id), pendingLog(LEGACY_STUDENT)))
      await assertFails(updateDoc(doc(asLegacy(), 'habit_logs', id), {
        reflection_text: 'nvm',
        reflection_key: 'nvm',
        updated_at: '2026-08-14T10:00:00.000Z'
      }))
    })

    it('lets a student un-tick while it is still pending', async () => {
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'
      await assertSucceeds(setDoc(doc(asLegacy(), 'habit_logs', id), pendingLog(LEGACY_STUDENT)))
      await assertSucceeds(deleteDoc(doc(asLegacy(), 'habit_logs', id)))
    })

    it('will not let a student approve their own habit', async () => {
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'
      await assertSucceeds(setDoc(doc(asLegacy(), 'habit_logs', id), pendingLog(LEGACY_STUDENT)))
      await assertFails(updateDoc(doc(asLegacy(), 'habit_logs', id), {
        status: 'approved', points_awarded: 10
      }))
    })

    it('will not let a TEACHER write the approval directly either', async () => {
      // Not an oversight. Approval has to run through reviewHabitLogs so the
      // credits and the house tally are written in the same batch as the
      // status — a teacher flipping the field by hand would approve the habit
      // and pay nobody.
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', id), pendingLog(LEGACY_STUDENT))
      })
      await assertFails(updateDoc(doc(asTeacher(), 'habit_logs', id), {
        status: 'approved', points_awarded: 10
      }))
    })

    it('will not let a student delete a log a mentor has ruled on', async () => {
      const id = LEGACY_STUDENT + '_2026-08-14_sidq_own_it'
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', id), {
          ...pendingLog(LEGACY_STUDENT), habit_id: 'sidq_own_it', status: 'approved', points_awarded: 10
        })
      })
      await assertFails(deleteDoc(doc(asLegacy(), 'habit_logs', id)))
    })

    it('a teacher reads their school queue', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth'),
          pendingLog(CHILD, FAMILY))
      })
      const snap = await assertSucceeds(getDocs(query(
        collection(asTeacher(), 'habit_logs'),
        where('school_id', '==', SCHOOL),
        where('status', '==', 'pending')
      )))
      expect((snap as any).size).toBeGreaterThan(0)
    })

    it('a student cannot read another student habit log', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth'),
          pendingLog(CHILD, FAMILY))
      })
      await assertFails(getDoc(doc(asLegacy(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth')))
    })

    // A get on a log that has not been ticked yet evaluates
    // resource.data.student_uid against null, which the rules raise as an
    // error rather than returning an empty snapshot. The dashboard used to
    // fetch today's three habits by id and so broke for every student who had
    // not ticked all three — the state every student is in each morning. It
    // asks for them as a list instead, which is only ever evaluated against
    // documents that exist. These two pin both halves of that.
    it('a get on a log that does not exist yet is denied, not empty', async () => {
      await assertFails(getDoc(doc(asLegacy(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth')))
    })

    it("a student lists today's habits, ticked or not", async () => {
      const todaysList = () => getDocs(query(
        collection(asLegacy(), 'habit_logs'),
        where('student_uid', '==', LEGACY_STUDENT),
        where('log_date', '==', '2026-08-14')
      ))

      // The empty day is the case that was broken: nothing ticked yet.
      expect(((await assertSucceeds(todaysList())) as any).size).toBe(0)

      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', LEGACY_STUDENT + '_2026-08-14_sidq_daily_truth'),
          pendingLog(LEGACY_STUDENT))
      })
      expect(((await assertSucceeds(todaysList())) as any).size).toBe(1)
    })

    // A family is not the student, so a student_uid filter proves nothing the
    // rules can match on and the whole list is refused — a list is allowed
    // only when the query itself constrains what the rule will check. The
    // dashboard filters on family_uid for these callers and drops the siblings
    // in memory, exactly as the chapter list does.
    it("a family lists its household's habits for the day", async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'habit_logs', CHILD + '_2026-08-14_sidq_daily_truth'),
          pendingLog(CHILD, FAMILY))
      })
      const snap = await assertSucceeds(getDocs(query(
        collection(asFamily(), 'habit_logs'),
        where('family_uid', '==', FAMILY),
        where('log_date', '==', '2026-08-14')
      )))
      expect((snap as any).size).toBe(1)
    })

    it('a family filtering by student_uid alone is refused', async () => {
      await assertFails(getDocs(query(
        collection(asFamily(), 'habit_logs'),
        where('student_uid', '==', CHILD),
        where('log_date', '==', '2026-08-14')
      )))
    })

    it("a family cannot list another household's habits", async () => {
      await assertFails(getDocs(query(
        collection(asOtherFamily(), 'habit_logs'),
        where('family_uid', '==', FAMILY),
        where('log_date', '==', '2026-08-14')
      )))
    })
  })

  describe('club house standings', () => {
    it('are readable but never client-writable', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'house_scores', SCHOOL + '__sidq'), {
          school_id: SCHOOL, house: 'sidq', points: 40
        })
      })
      await assertSucceeds(getDoc(doc(asLegacy(), 'house_scores', SCHOOL + '__sidq')))
      await assertFails(setDoc(doc(asTeacher(), 'house_scores', SCHOOL + '__sidq'), {
        school_id: SCHOOL, house: 'sidq', points: 99999
      }))
    })
  })

  describe('a house is never the member\'s own to write', () => {
    // The rule the whole club rests on, and now the quiz too: the quiz is only
    // a quiz because its result cannot be posted directly. If a client could
    // write 'house', a member would simply set the one whose habits looked
    // easiest and skip the questions entirely.
    it('a student cannot put themselves in a house', async () => {
      await assertFails(updateDoc(doc(asLegacy(), 'users', LEGACY_STUDENT), { house: 'sidq' }))
    })

    it('a student cannot move themselves to another house', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', LEGACY_STUDENT), { house: 'adl' }, { merge: true })
      })
      await assertFails(updateDoc(doc(asLegacy(), 'users', LEGACY_STUDENT), { house: 'sidq' }))
    })

    it('a family cannot put its child in a house either', async () => {
      await assertFails(updateDoc(doc(asFamily(), 'users', CHILD), { house: 'sidq' }))
    })

    it('a teacher cannot, but their school admin can', async () => {
      await assertFails(updateDoc(doc(asTeacher(), 'users', CHILD), { house: 'sidq' }))
    })
  })

  describe('value economy — credit entries', () => {
    const DESCRIPTION = 'I stayed behind after class and helped Bilal with the sums he had not understood all week.'

    const pendingEntry = (studentUid: string, familyUid?: string) => {
      const entry: Record<string, unknown> = {
        student_uid: studentUid,
        school_id: SCHOOL,
        house: 'sidq',
        category_id: 'help_struggling_peer',
        description: DESCRIPTION,
        status: 'pending'
      }
      if (familyUid) entry.family_uid = familyUid
      return entry
    }

    it('a student files their own entry', async () => {
      await assertSucceeds(setDoc(doc(asLegacy(), 'credit_entries', 'e1'), pendingEntry(LEGACY_STUDENT)))
    })

    it('a family files one for its own child', async () => {
      await assertSucceeds(setDoc(doc(asFamily(), 'credit_entries', 'e2'), pendingEntry(CHILD, FAMILY)))
    })

    it('a family cannot file for another household', async () => {
      await assertFails(setDoc(doc(asOtherFamily(), 'credit_entries', 'e3'), pendingEntry(CHILD, FAMILY)))
    })

    it('refuses an entry that arrives already approved', async () => {
      await assertFails(setDoc(doc(asLegacy(), 'credit_entries', 'e4'), {
        ...pendingEntry(LEGACY_STUDENT), status: 'approved'
      }))
    })

    it('refuses an entry carrying its own credits', async () => {
      // The line the module rests on: a student who can set points_awarded is
      // a student who mints their own credits.
      await assertFails(setDoc(doc(asLegacy(), 'credit_entries', 'e5'), {
        ...pendingEntry(LEGACY_STUDENT), points_awarded: 100
      }))
    })

    it('refuses an entry with nothing written on it', async () => {
      await assertFails(setDoc(doc(asLegacy(), 'credit_entries', 'e6'), {
        ...pendingEntry(LEGACY_STUDENT), description: 'did it'
      }))
    })

    it('refuses a house that does not exist', async () => {
      await assertFails(setDoc(doc(asLegacy(), 'credit_entries', 'e7'), {
        ...pendingEntry(LEGACY_STUDENT), house: 'greenhouse'
      }))
    })

    it('will not let a student award their own entry', async () => {
      await assertSucceeds(setDoc(doc(asLegacy(), 'credit_entries', 'e8'), pendingEntry(LEGACY_STUDENT)))
      await assertFails(updateDoc(doc(asLegacy(), 'credit_entries', 'e8'), {
        status: 'approved', points_awarded: 100
      }))
    })

    it('will not let a TEACHER write the award directly either', async () => {
      // Same reasoning as habit_logs: the award and the credits have to be
      // written in one batch, so approval runs through reviewCreditEntries.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'credit_entries', 'e9'), pendingEntry(LEGACY_STUDENT))
      })
      await assertFails(updateDoc(doc(asTeacher(), 'credit_entries', 'e9'), {
        status: 'approved', points_awarded: 60
      }))
    })

    it('a student may withdraw an entry until it is ruled on, then not', async () => {
      await assertSucceeds(setDoc(doc(asLegacy(), 'credit_entries', 'e10'), pendingEntry(LEGACY_STUDENT)))
      await assertSucceeds(deleteDoc(doc(asLegacy(), 'credit_entries', 'e10')))

      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'credit_entries', 'e11'), {
          ...pendingEntry(LEGACY_STUDENT), status: 'approved', points_awarded: 40
        })
      })
      await assertFails(deleteDoc(doc(asLegacy(), 'credit_entries', 'e11')))
    })

    it('a student cannot read another student entry', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'credit_entries', 'e12'), pendingEntry(CHILD, FAMILY))
      })
      await assertFails(getDoc(doc(asLegacy(), 'credit_entries', 'e12')))
    })

    it('a teacher reads their school queue', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'credit_entries', 'e13'), pendingEntry(CHILD, FAMILY))
      })
      const snap = await assertSucceeds(getDocs(query(
        collection(asTeacher(), 'credit_entries'),
        where('school_id', '==', SCHOOL),
        where('status', '==', 'pending')
      )))
      expect((snap as any).size).toBeGreaterThan(0)
    })
  })

  describe('value economy — prices and Council complaints', () => {
    it('anyone signed in may read a price, and no one but HQ may set one', async () => {
      // Editing one number here changes what every future award is worth.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'credit_categories', 'greet_with_salaam'), { points: 20 })
      })
      await assertSucceeds(getDoc(doc(asLegacy(), 'credit_categories', 'greet_with_salaam')))
      await assertFails(setDoc(doc(asTeacher(), 'credit_categories', 'greet_with_salaam'), { points: 5000 }))
      await assertFails(setDoc(doc(asLegacy(), 'credit_categories', 'greet_with_salaam'), { points: 5000 }))
    })

    // What the Super Admin price screen actually does. Rejecting everyone is
    // easy to get right by accident; the panel is useless unless HQ can both
    // write an override and clear one back to the built-in price.
    it('HQ may set a price and clear it again', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', SUPER), { role: 'super_admin', name: 'HQ' })
      })
      await assertSucceeds(setDoc(doc(asSuper(), 'credit_categories', 'greet_with_salaam'), {
        points: 35, is_active: true
      }))
      await assertSucceeds(setDoc(doc(asSuper(), 'credit_categories', 'consistency'), {
        is_active: false
      }, { merge: true }))
      // Clearing an override is a delete — the panel removes the document
      // rather than pinning today's default as tomorrow's override.
      await assertSucceeds(deleteDoc(doc(asSuper(), 'credit_categories', 'greet_with_salaam')))
      // Deleting one that was never there is what a bulk save does for every
      // untouched category, so it must not be an error either.
      await assertSucceeds(deleteDoc(doc(asSuper(), 'credit_categories', 'clean_speech')))
    })

    it('a house can read what it was fined for', async () => {
      // A house told only that it lost fifty points has been punished without
      // being told what for.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'council_complaints', 'c1'), {
          school_id: SCHOOL, house: 'sidq', reason: 'Bad language in the corridor.',
          points_requested: 50, points_deducted: 50, raised_by: 'admin-1'
        })
      })
      await assertSucceeds(getDoc(doc(asLegacy(), 'council_complaints', 'c1')))
      await assertSucceeds(getDoc(doc(asTeacher(), 'council_complaints', 'c1')))
    })

    it('nobody may write a complaint from a client — not even the Council', async () => {
      // A penalty against a whole house has to carry a record of who filed it
      // that the filer cannot revise afterwards.
      const complaint = {
        school_id: SCHOOL, house: 'sidq', reason: 'Made up.',
        points_requested: 50, points_deducted: 50, raised_by: TEACHER
      }
      await assertFails(setDoc(doc(asTeacher(), 'council_complaints', 'c2'), complaint))
      await assertFails(setDoc(doc(asLegacy(), 'council_complaints', 'c2'), complaint))
      await assertFails(setDoc(doc(asFamily(), 'council_complaints', 'c2'), complaint))
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
