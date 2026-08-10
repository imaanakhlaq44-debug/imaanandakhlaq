import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeApp as initAdmin, deleteApp as deleteAdminApp, type App } from 'firebase-admin/app'
import { getFirestore as adminFirestore } from 'firebase-admin/firestore'
import { getAuth as adminAuth } from 'firebase-admin/auth'
import { initializeApp as initClient, deleteApp as deleteClientApp } from 'firebase/app'
import {
  getAuth, connectAuthEmulator, signInWithCustomToken,
  signInWithEmailAndPassword, signOut
} from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { FAMILY_LOGIN_DOMAIN } from '../lib/familyLogin'

/**
 * The provisioning and migration callables, run against the emulators.
 *
 * Loading a function proves it deploys; it does not prove it behaves. These
 * tests drive the whole chain the way the app does — an admin provisions, a
 * parent claims, a school converts — and check the one property the migration
 * exists to guarantee: that no school loses a single record.
 *
 * Run with:  npm run test:functions
 * Skips itself when the emulators are down, so `npm test` stays green.
 */

const HAS_EMULATOR = !!(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)

// singleProjectMode is on, and the Functions emulator serves under the id in
// .firebaserc, so everything here has to agree on it.
const PROJECT = 'imaan-app-1d2da'
const SCHOOL = 'school-m'

let adminApp: App
let clientApp: ReturnType<typeof initClient>
let db: ReturnType<typeof adminFirestore>
let fns: ReturnType<typeof getFunctions>
let auth: ReturnType<typeof getAuth>

async function clearEmulators() {
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' }
  )
  await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`,
    { method: 'DELETE' }
  )
}

/** Sign the client in as a specific uid, the way a real session would look. */
async function signInAs(uid: string) {
  await adminAuth(adminApp).createUser({ uid }).catch(() => {})
  const token = await adminAuth(adminApp).createCustomToken(uid)
  await signInWithCustomToken(auth, token)
}

const call = <T = any>(name: string, data: any = {}) =>
  httpsCallable<any, T>(fns, name)(data).then((r) => r.data)

async function seedAdmin(uid = 'admin-1') {
  await db.collection('users').doc(uid).set({ role: 'school_admin', school_id: SCHOOL, name: 'Admin' })
  await signInAs(uid)
  return uid
}

describe.skipIf(!HAS_EMULATOR)('Family provisioning and migration', () => {
  beforeAll(async () => {
    adminApp = initAdmin({ projectId: PROJECT }, 'admin-test')
    db = adminFirestore(adminApp)

    clientApp = initClient({ projectId: PROJECT, apiKey: 'emulator', appId: 'test' }, 'client-test')
    auth = getAuth(clientApp)
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true })

    const [fnHost, fnPort] = (process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001').split(':')
    fns = getFunctions(clientApp)
    connectFunctionsEmulator(fns, fnHost, Number(fnPort))
  }, 60000)

  afterAll(async () => {
    if (clientApp) await deleteClientApp(clientApp)
    if (adminApp) await deleteAdminApp(adminApp)
  })

  beforeEach(async () => {
    await signOut(auth).catch(() => {})
    await clearEmulators()
  })

  describe('provisioning', () => {
    it('creates a family login and its profile', async () => {
      await seedAdmin()
      const res = await call('createFamilyAccount', { name: 'Ahmed Family', phone: '+92 300 1234567' })

      expect(res.username).toMatch(/^PAR-[A-Z0-9]{5}$/)
      expect(res.password).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)

      const profile = (await db.collection('users').doc(res.family_uid).get()).data()!
      expect(profile.role).toBe('family')
      expect(profile.school_id).toBe(SCHOOL)
      expect(profile.username).toBe(res.username)
    }, 60000)

    it('signs in with the username the client builds from it', async () => {
      await seedAdmin()
      const res = await call('createFamilyAccount', { name: 'Ahmed Family' })

      // Exactly what AuthPage does: familyUsernameToEmail(username).
      // If the two ever disagreed on the domain, this is where it shows.
      const email = res.username.toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN
      const cred = await signInWithEmailAndPassword(auth, email, res.password)
      expect(cred.user.uid).toBe(res.family_uid)
    }, 60000)

    it('refuses a caller who is not school staff', async () => {
      await db.collection('users').doc('nobody').set({ role: 'student', school_id: SCHOOL })
      await signInAs('nobody')
      await expect(call('createFamilyAccount', { name: 'Sneaky' })).rejects.toThrow()
    }, 60000)

    it('creates a child already linked to the family and to a class', async () => {
      await seedAdmin()
      const family = await call('createFamilyAccount', { name: 'Ahmed Family' })
      const child = await call('createChild', {
        family_uid: family.family_uid, name: 'Abdullah', class_id: 'Class 4'
      })

      expect(child.code).toMatch(/^STU-[A-Z0-9]{5}$/)

      const doc = (await db.collection('users').doc(child.child_uid).get()).data()!
      expect(doc.role).toBe('student')
      expect(doc.family_uid).toBe(family.family_uid)
      expect(doc.class_id).toBe('Class 4')
      // A child never carries contact details, or lookupEmailByPhone could
      // answer a parent's phone login with a profile that has no login.
      expect(doc.phone).toBeUndefined()
      expect(doc.email).toBeUndefined()
    }, 60000)
  })

  describe('claiming a child', () => {
    async function setup() {
      await seedAdmin()
      const family = await call('createFamilyAccount', { name: 'Ahmed Family' })
      const child = await call('createChild', {
        family_uid: family.family_uid, name: 'Abdullah', class_id: 'Class 4'
      })
      return { family, child }
    }

    it('lets the right family redeem the code once', async () => {
      const { family, child } = await setup()
      await signInAs(family.family_uid)

      await call('claimChild', { code: child.code })
      const invite = (await db.collection('invites').doc(child.code).get()).data()!
      expect(invite.status).toBe('used')
      expect(invite.used_by_uid).toBe(family.family_uid)

      await expect(call('claimChild', { code: child.code })).rejects.toThrow()
    }, 60000)

    it('refuses a code belonging to another family', async () => {
      const { child } = await setup()
      const other = await call('createFamilyAccount', { name: 'Khan Family' })

      await signInAs(other.family_uid)
      await expect(call('claimChild', { code: child.code })).rejects.toThrow()

      const invite = (await db.collection('invites').doc(child.code).get()).data()!
      expect(invite.status).toBe('pending')
    }, 60000)

    it('refuses a code that does not exist', async () => {
      const { family } = await setup()
      await signInAs(family.family_uid)
      await expect(call('claimChild', { code: 'STU-ZZZZZ' })).rejects.toThrow()
    }, 60000)
  })

  describe('resetting a password', () => {
    it('replaces the old password with a working new one', async () => {
      await seedAdmin()
      const family = await call('createFamilyAccount', { name: 'Ahmed Family' })
      const email = family.username.toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN

      const reset = await call('resetFamilyPassword', { family_uid: family.family_uid })
      expect(reset.password).not.toBe(family.password)
      expect(reset.username).toBe(family.username)

      await expect(signInWithEmailAndPassword(auth, email, family.password)).rejects.toThrow()
      const cred = await signInWithEmailAndPassword(auth, email, reset.password)
      expect(cred.user.uid).toBe(family.family_uid)
    }, 60000)
  })

  describe('migrating a school that is already running', () => {
    const L1 = 'legacy-1'
    const L2 = 'legacy-2'
    const L3 = 'legacy-3'

    /** A school as it looks today: students with their own logins and work. */
    async function seedLegacySchool() {
      await db.collection('invites').doc('STU-AAAAA').set({
        role: 'student', status: 'used', school_id: SCHOOL,
        parent_name: 'Muhammad Ahmed', parent_phone: '+92 300 1234567'
      })
      // Same household, written the local way. The grouping keys on the last
      // ten digits precisely so these two land together.
      await db.collection('invites').doc('STU-BBBBB').set({
        role: 'student', status: 'used', school_id: SCHOOL,
        parent_name: 'Muhammad Ahmed', parent_phone: '03001234567'
      })
      await db.collection('invites').doc('STU-CCCCC').set({
        role: 'student', status: 'used', school_id: SCHOOL,
        parent_name: 'Imran Khan', parent_phone: '0321 7654321'
      })

      const students: Array<[string, string, string, string]> = [
        [L1, 'Abdullah', 'Class 4', 'STU-AAAAA'],
        [L2, 'Maryam', 'Class 2', 'STU-BBBBB'],
        [L3, 'Zainab', 'Class 5', 'STU-CCCCC']
      ]

      for (const [uid, name, cls, code] of students) {
        await db.collection('users').doc(uid).set({
          role: 'student', school_id: SCHOOL, class_id: cls, name,
          invitation_code: code,
          phone: '+92 300 1234567',
          email: uid + '@old.example.com',
          game_state: { points: 150, teacher_approved: ['c1', 'c2'], completed: ['c1', 'c2'] }
        })
        await adminAuth(adminApp).createUser({ uid, email: uid + '@old.example.com', password: 'oldpass123' })
      }

      // Work that must survive untouched.
      for (const uid of [L1, L2]) {
        for (const chapter of ['c1', 'c2', 'c3']) {
          await db.collection('activity_submissions').doc(uid + '_' + chapter).set({
            student_uid: uid, school_id: SCHOOL, chapter_id: chapter, reviewStatus: 'teacher_approved'
          })
        }
        for (let day = 0; day < 4; day++) {
          await db.collection('activity_drafts').doc('draft_' + uid + '_c4_d' + day).set({
            student_uid: uid, chapter_id: 'c4', day_index: day
          })
        }
        await db.collection('activity_attendance').doc(uid + '_c1_seed').set({
          student_uid: uid, school_id: SCHOOL, chapter_id: 'c1'
        })
      }
    }

    it('groups siblings by the guardian contact on the roster', async () => {
      await seedLegacySchool()
      await seedAdmin()

      const plan = await call('planFamilyMigration', {})
      expect(plan.total_students).toBe(3)
      expect(plan.already_migrated).toBe(0)
      expect(plan.families).toHaveLength(2)

      const ahmed = plan.families.find((f: any) => f.suggested_name === 'Muhammad Ahmed')
      expect(ahmed.children.map((c: any) => c.uid).sort()).toEqual([L1, L2])

      const khan = plan.families.find((f: any) => f.suggested_name === 'Imran Khan')
      expect(khan.children.map((c: any) => c.uid)).toEqual([L3])
    }, 60000)

    it('converts a household without losing a single record', async () => {
      await seedLegacySchool()
      await seedAdmin()

      // Count everything first, so "nothing was lost" is measured, not assumed.
      const before: Record<string, number> = {}
      for (const name of ['activity_submissions', 'activity_drafts', 'activity_attendance']) {
        before[name] = (await db.collection(name).get()).size
      }

      const result = await call('migrateFamilyGroup', {
        child_uids: [L1, L2], family_name: 'Muhammad Ahmed', family_phone: '+92 300 1234567'
      })

      expect(result.failed).toHaveLength(0)
      expect(result.migrated).toHaveLength(2)

      // Nothing was created or deleted anywhere.
      for (const name of ['activity_submissions', 'activity_drafts', 'activity_attendance']) {
        expect((await db.collection(name).get()).size, name + ' changed size').toBe(before[name])
      }

      for (const uid of [L1, L2]) {
        // The id is the whole point: keep it and the history keeps itself.
        const child = (await db.collection('users').doc(uid).get()).data()!
        expect(child.family_uid).toBe(result.family_uid)
        expect(child.game_state.points).toBe(150)
        expect(child.game_state.teacher_approved).toEqual(['c1', 'c2'])

        // Contact details moved aside rather than being dropped.
        expect(child.phone).toBeUndefined()
        expect(child.legacy_phone).toBe('+92 300 1234567')
        expect(child.email).toBeUndefined()
        expect(child.legacy_login_email).toBe(uid + '@old.example.com')

        // Every owned document now carries the family, and the doc ids are
        // untouched — these are the same documents, not copies.
        for (const [name, expected] of [
          ['activity_submissions', 3], ['activity_drafts', 4], ['activity_attendance', 1]
        ] as Array<[string, number]>) {
          const owned = await db.collection(name).where('student_uid', '==', uid).get()
          expect(owned.size, uid + ' ' + name).toBe(expected)
          owned.forEach((d) => expect(d.get('family_uid'), name + '/' + d.id).toBe(result.family_uid))
        }

        // The old student login is closed, but the account still exists, so
        // the change can be undone.
        const authUser = await adminAuth(adminApp).getUser(uid)
        expect(authUser.disabled).toBe(true)
      }

      // The untouched household is exactly as it was.
      const zainab = (await db.collection('users').doc(L3).get()).data()!
      expect(zainab.family_uid).toBeUndefined()
      expect(zainab.phone).toBe('+92 300 1234567')
      expect((await adminAuth(adminApp).getUser(L3)).disabled).toBe(false)
    }, 90000)

    it('hands over credentials that actually sign in', async () => {
      await seedLegacySchool()
      await seedAdmin()

      const result = await call('migrateFamilyGroup', {
        child_uids: [L1, L2], family_name: 'Muhammad Ahmed', family_phone: '+92 300 1234567'
      })

      const email = result.username.toLowerCase() + '@' + FAMILY_LOGIN_DOMAIN
      const cred = await signInWithEmailAndPassword(auth, email, result.password)
      expect(cred.user.uid).toBe(result.family_uid)
    }, 90000)

    it('refuses to run twice over the same children', async () => {
      await seedLegacySchool()
      await seedAdmin()

      await call('migrateFamilyGroup', { child_uids: [L1, L2], family_name: 'Muhammad Ahmed' })
      await expect(
        call('migrateFamilyGroup', { child_uids: [L1, L2], family_name: 'Muhammad Ahmed' })
      ).rejects.toThrow()

      // And the second attempt left no orphan family behind.
      const families = await db.collection('users').where('role', '==', 'family').get()
      expect(families.size).toBe(1)
    }, 90000)

    it('leaves migrated children out of a re-scan', async () => {
      await seedLegacySchool()
      await seedAdmin()

      await call('migrateFamilyGroup', { child_uids: [L1, L2], family_name: 'Muhammad Ahmed' })

      const plan = await call('planFamilyMigration', {})
      expect(plan.already_migrated).toBe(2)
      expect(plan.families).toHaveLength(1)
      expect(plan.families[0].children.map((c: any) => c.uid)).toEqual([L3])
    }, 90000)
  })
})
