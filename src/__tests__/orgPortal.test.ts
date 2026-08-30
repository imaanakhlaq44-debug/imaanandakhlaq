import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeApp as initAdmin, deleteApp as deleteAdminApp, type App } from 'firebase-admin/app'
import { getFirestore as adminFirestore } from 'firebase-admin/firestore'
import { getAuth as adminAuth } from 'firebase-admin/auth'
import { initializeApp as initClient, deleteApp as deleteClientApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signInWithCustomToken, signOut } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'

/**
 * Organisation portals, run against the emulators. See ORG_PORTAL_PLAN.md.
 *
 * These are the properties the feature would be unsafe without, so they are
 * asserted rather than assumed: that a wrong token cannot be told apart from a
 * wrong PIN, that a PIN is never stored, that guessing gets locked out, and
 * that a school registered through a link is sealed off from every other
 * school exactly as one that registered directly.
 *
 * Run with:  npm run test:functions
 * Skips itself when the emulators are down, so `npm test` stays green.
 */

const HAS_EMULATOR = !!(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)
const PROJECT = 'imaan-app-1d2da'

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

async function signInAs(uid: string) {
  await adminAuth(adminApp).createUser({ uid }).catch(() => {})
  const token = await adminAuth(adminApp).createCustomToken(uid)
  await signInWithCustomToken(auth, token)
}

const call = <T = any>(name: string, data: any = {}) =>
  httpsCallable<any, T>(fns, name)(data).then((r) => r.data)

/** The error code a callable rejected with, or '' when it resolved. */
async function codeOf(promise: Promise<unknown>) {
  try {
    await promise
    return ''
  } catch (err: any) {
    return String(err.code || '')
  }
}

async function seedSuper(uid = 'super-1') {
  await db.collection('users').doc(uid).set({ role: 'super_admin', name: 'Super' })
  await signInAs(uid)
  return uid
}

/** The fragment of a link, which is where every secret in this feature lives. */
function tokenOf(path: string) {
  return path.split('#')[1] || ''
}

/** An organisation and a school inside it, the way the real flow builds them. */
async function seedOrgWithSchool() {
  await seedSuper()
  const org = await call('createOrg', { name: 'Alkhidmat Foundation' })
  await signOut(auth)

  const school = await call('registerSchoolInOrg', {
    slug: org.slug,
    token: tokenOf(org.join_path),
    school_name: 'Gulshan Campus',
    admin_name: 'Head Teacher',
    email: 'head@gulshan.example',
    password: 'secret123'
  })
  return { org, school }
}

describe.skipIf(!HAS_EMULATOR)('Organisation portals', () => {
  beforeAll(async () => {
    adminApp = initAdmin({ projectId: PROJECT }, 'admin-org-test')
    db = adminFirestore(adminApp)

    clientApp = initClient({ projectId: PROJECT, apiKey: 'emulator', appId: 'test' }, 'client-org-test')
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

  describe('the organisation link', () => {
    it('mints a readable path with the secret in the fragment', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat Foundation' })

      expect(org.slug).toBe('alkhidmat-foundation')
      expect(org.join_path).toMatch(/^\/join\?org=alkhidmat-foundation#[A-Z0-9]{8}$/)
    }, 60000)

    it('refuses a second organisation on the same path', async () => {
      await seedSuper()
      await call('createOrg', { name: 'Alkhidmat' })
      expect(await codeOf(call('createOrg', { name: 'Alkhidmat' }))).toBe('functions/already-exists')
    }, 60000)

    it('is the super admin\'s to create, nobody else\'s', async () => {
      await db.collection('users').doc('admin-2').set({ role: 'school_admin', school_id: 's1' })
      await signInAs('admin-2')
      expect(await codeOf(call('createOrg', { name: 'Not Mine' }))).toBe('functions/permission-denied')
    }, 60000)

    it('tells an unauthenticated caller the name and nothing else', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat Foundation', contact_email: 'ops@alkhidmat.example' })
      await signOut(auth)

      const seen = await call('describeOrgInvite', { slug: org.slug, token: tokenOf(org.join_path) })

      expect(seen.name).toBe('Alkhidmat Foundation')
      // The whole point of the function: no id, no contact details, no
      // schools. Anybody on the internet can call this one.
      expect(Object.keys(seen).sort()).toEqual(['name', 'slug'])
    }, 60000)

    it('answers a wrong token the same way as a wrong organisation', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await signOut(auth)

      const wrongToken = await codeOf(call('describeOrgInvite', { slug: org.slug, token: 'AAAAAAAA' }))
      const noSuchOrg = await codeOf(call('describeOrgInvite', { slug: 'nobody', token: 'AAAAAAAA' }))
      expect(wrongToken).toBe('functions/not-found')
      expect(noSuchOrg).toBe(wrongToken)
    }, 60000)

    it('lists every organisation for the super admin, and for nobody else', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      const listed = (await call('listOrgs')).orgs

      expect(listed).toHaveLength(1)
      expect(listed[0].name).toBe('Alkhidmat')
      // The dashboard cannot read orgs directly — it is closed — so the join
      // link has to arrive here, which is why this is not merely signed-in.
      expect(listed[0].join_path).toBe(org.join_path)

      await signOut(auth)
      await db.collection('users').doc('head-list').set({ role: 'school_admin', school_id: 's1' })
      await signInAs('head-list')
      expect(await codeOf(call('listOrgs'))).toBe('functions/permission-denied')
    }, 60000)

    it('rotating retires every copy of the old link', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      const rotated = await call('rotateOrgToken', { org_id: org.org_id })
      await signOut(auth)

      expect(tokenOf(rotated.join_path)).not.toBe(tokenOf(org.join_path))
      expect(await codeOf(call('describeOrgInvite', { slug: org.slug, token: tokenOf(org.join_path) })))
        .toBe('functions/not-found')
      await expect(call('describeOrgInvite', { slug: org.slug, token: tokenOf(rotated.join_path) }))
        .resolves.toBeTruthy()
    }, 60000)

    it('deletes an organisation nothing has joined, and its link with it', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await call('deleteOrg', { org_id: org.org_id })

      expect((await db.collection('orgs').doc(org.org_id).get()).exists).toBe(false)

      await signOut(auth)
      expect(await codeOf(call('describeOrgInvite', { slug: org.slug, token: tokenOf(org.join_path) })))
        .toBe('functions/not-found')
    }, 60000)

    it('refuses to delete one a school has registered through', async () => {
      const { org } = await seedOrgWithSchool()
      await seedSuper()

      expect(await codeOf(call('deleteOrg', { org_id: org.org_id }))).toBe('functions/failed-precondition')
      // The point of refusing: the school keeps the organisation it belongs to.
      expect((await db.collection('orgs').doc(org.org_id).get()).exists).toBe(true)
    }, 60000)

    it('is the super admin\'s to delete, nobody else\'s', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await signOut(auth)

      await db.collection('users').doc('head-9').set({ role: 'school_admin', school_id: 's1' })
      await signInAs('head-9')
      expect(await codeOf(call('deleteOrg', { org_id: org.org_id }))).toBe('functions/permission-denied')
      expect((await db.collection('orgs').doc(org.org_id).get()).exists).toBe(true)
    }, 60000)
  })

  describe('a school arriving through the link', () => {
    it('registers, is live at once, and leaves with its own link', async () => {
      const { org, school } = await seedOrgWithSchool()

      expect(school.student_path).toMatch(/^\/s\?org=alkhidmat-foundation&school=gulshan-campus#[A-Z0-9]{8}$/)

      const doc = (await db.collection('schools').doc(school.school_id).get()).data()!
      expect(doc.org_id).toBe(org.org_id)
      expect(doc.approval_status).toBe('approved')
      // Being able to log in and being able to publish photographs of
      // children are two different decisions.
      expect(doc.wall_enabled).toBe(false)
    }, 60000)

    it('keeps the school link out of the school document', async () => {
      const { school } = await seedOrgWithSchool()

      // schools is `allow read: if signedIn()`. A token on this document is a
      // token every account in the system can read.
      const doc = (await db.collection('schools').doc(school.school_id).get()).data()!
      expect(doc.student_token).toBeUndefined()
      expect(JSON.stringify(doc)).not.toContain(tokenOf(school.student_path))
    }, 60000)

    it('gives two schools of the same name different paths', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await signOut(auth)

      const common = { slug: org.slug, token: tokenOf(org.join_path), school_name: 'Main Campus', admin_name: 'Head', password: 'secret123' }
      const first = await call('registerSchoolInOrg', { ...common, email: 'one@x.example' })
      const second = await call('registerSchoolInOrg', { ...common, email: 'two@x.example' })

      expect(first.school_slug).toBe('main-campus')
      expect(second.school_slug).toBe('main-campus-2')
    }, 60000)

    it('leaves nothing behind when the email is already taken', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await signOut(auth)

      const args = { slug: org.slug, token: tokenOf(org.join_path), school_name: 'Campus', admin_name: 'Head', email: 'taken@x.example', password: 'secret123' }
      await call('registerSchoolInOrg', args)
      expect(await codeOf(call('registerSchoolInOrg', args))).toBe('functions/already-exists')

      // One school, not one school and a wreck.
      const schools = await db.collection('schools').get()
      expect(schools.size).toBe(1)
      expect((await db.collection('orgs').doc(org.org_id).get()).get('school_count')).toBe(1)
    }, 60000)

    it('refuses a rotated join token', async () => {
      await seedSuper()
      const org = await call('createOrg', { name: 'Alkhidmat' })
      await call('rotateOrgToken', { org_id: org.org_id })
      await signOut(auth)

      expect(await codeOf(call('registerSchoolInOrg', {
        slug: org.slug, token: tokenOf(org.join_path),
        school_name: 'Campus', admin_name: 'Head', email: 'late@x.example', password: 'secret123'
      }))).toBe('functions/not-found')
    }, 60000)
  })

  describe('removing a school', () => {
    /** A school with a child, a PIN, a wall post and a parent link on it. */
    async function seedFurnishedSchool() {
      const { org, school } = await seedOrgWithSchool()
      const schoolId = school.school_id

      await db.collection('users').doc('kid-1').set({
        role: 'student', name: 'Ayesha', school_id: schoolId, class_id: '3', roll_no: '1'
      })
      await db.collection('habit_logs').doc('log-1').set({ student_uid: 'kid-1', status: 'pending' })
      await db.collection('school_posts').doc('post-1').set({ school_id: schoolId, text: 'Sports day' })
      await db.collection('school_posts').doc('post-1').collection('likes').doc('someone').set({ at: 'now' })
      await db.collection('parent_links').doc('PTOKEN12').set({ school_id: schoolId, student_uid: 'kid-1' })
      await db.collection('pin_attempts').doc(schoolId + '_1').set({ fails: 2 })

      return { org, school, schoolId }
    }

    it('takes the school, its people and everything keyed to them', async () => {
      const { schoolId } = await seedFurnishedSchool()
      await seedSuper()

      await call('deleteSchool', { school_id: schoolId, confirm_name: 'Gulshan Campus' })

      expect((await db.collection('schools').doc(schoolId).get()).exists).toBe(false)
      expect((await db.collection('users').doc('kid-1').get()).exists).toBe(false)
      expect((await db.collection('habit_logs').doc('log-1').get()).exists).toBe(false)
      expect((await db.collection('school_posts').doc('post-1').get()).exists).toBe(false)
      expect((await db.collection('parent_links').doc('PTOKEN12').get()).exists).toBe(false)
      expect((await db.collection('pin_attempts').doc(schoolId + '_1').get()).exists).toBe(false)

      // The subcollection under the post, which a plain delete would strand.
      const likes = await db.collection('school_posts').doc('post-1').collection('likes').get()
      expect(likes.empty).toBe(true)

      // The school's own link, so a slip already printed stops working.
      const links = await db.collection('school_links').where('school_id', '==', schoolId).get()
      expect(links.empty).toBe(true)
    }, 120000)

    it('refuses unless the name is typed exactly', async () => {
      const { schoolId } = await seedFurnishedSchool()
      await seedSuper()

      expect(await codeOf(call('deleteSchool', { school_id: schoolId, confirm_name: 'Gulshan' })))
        .toBe('functions/failed-precondition')
      expect(await codeOf(call('deleteSchool', { school_id: schoolId })))
        .toBe('functions/failed-precondition')

      // Nothing was touched on the way to being refused.
      expect((await db.collection('schools').doc(schoolId).get()).exists).toBe(true)
      expect((await db.collection('users').doc('kid-1').get()).exists).toBe(true)
    }, 120000)

    it('is the super admin\'s to do, nobody else\'s', async () => {
      const { schoolId } = await seedFurnishedSchool()

      await db.collection('users').doc('head-9').set({ role: 'school_admin', school_id: schoolId })
      await signInAs('head-9')
      expect(await codeOf(call('deleteSchool', { school_id: schoolId, confirm_name: 'Gulshan Campus' })))
        .toBe('functions/permission-denied')
      expect((await db.collection('schools').doc(schoolId).get()).exists).toBe(true)
    }, 120000)

    it('frees the organisation it belonged to, so that can go too', async () => {
      const { org, schoolId } = await seedFurnishedSchool()
      await seedSuper()

      // The whole reason this exists: deleteOrg refuses while a school is here.
      expect(await codeOf(call('deleteOrg', { org_id: org.org_id }))).toBe('functions/failed-precondition')

      await call('deleteSchool', { school_id: schoolId, confirm_name: 'Gulshan Campus' })
      await call('deleteOrg', { org_id: org.org_id })

      expect((await db.collection('orgs').doc(org.org_id).get()).exists).toBe(false)
    }, 120000)
  })

  describe('a child signing in', () => {
    async function seedChild() {
      const { school } = await seedOrgWithSchool()
      const uid = 'student-1'
      await db.collection('users').doc(uid).set({
        role: 'student', school_id: school.school_id, name: 'Ayesha', class_id: '3', roster_only: true
      })

      await db.collection('users').doc('head-1').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-1')
      const issued = await call('issueStudentPins', { student_uids: [uid] })
      await signOut(auth)

      return { school, uid, roll_no: issued.issued[0].roll_no, pin: issued.issued[0].pin }
    }

    it('stores the hash and never the PIN', async () => {
      const { uid, pin } = await seedChild()

      const doc = (await db.collection('users').doc(uid).get()).data()!
      expect(doc.pin_hash).toMatch(/^[0-9a-f]{128}$/)
      expect(doc.pin_salt).toBeTruthy()
      expect(JSON.stringify(doc)).not.toContain(pin)
    }, 60000)

    it('opens the child\'s own session', async () => {
      const { school, uid, roll_no, pin } = await seedChild()

      const res = await call('studentSignIn', { school_token: tokenOf(school.student_path), roll_no, pin })
      expect(res.student_uid).toBe(uid)

      // The point of section 1.2: what comes back is a real session, so every
      // rule already written for a student applies with no change.
      await signInWithCustomToken(auth, res.token)
      expect(auth.currentUser!.uid).toBe(uid)
    }, 60000)

    it('answers a wrong school token exactly as it answers a wrong PIN', async () => {
      const { school, roll_no, pin } = await seedChild()
      const token = tokenOf(school.student_path)

      const badPin = await codeOf(call('studentSignIn', { school_token: token, roll_no, pin: '0000' }))
      const badToken = await codeOf(call('studentSignIn', { school_token: 'ZZZZZZZZ', roll_no, pin }))
      const badRoll = await codeOf(call('studentSignIn', { school_token: token, roll_no: '999', pin }))

      expect(badPin).toBe('functions/permission-denied')
      expect(badToken).toBe(badPin)
      expect(badRoll).toBe(badPin)
    }, 60000)

    it('locks the child out after five wrong PINs, and only that child', async () => {
      const { school, uid, roll_no, pin } = await seedChild()
      const token = tokenOf(school.student_path)

      for (let i = 0; i < 5; i++) {
        await codeOf(call('studentSignIn', { school_token: token, roll_no, pin: '0000' }))
      }

      // Even the right PIN waits now — that is what makes four digits safe.
      expect(await codeOf(call('studentSignIn', { school_token: token, roll_no, pin })))
        .toBe('functions/resource-exhausted')

      // A classmate is unaffected: the counter is per child, never per school.
      await db.collection('users').doc('student-2').set({
        role: 'student', school_id: school.school_id, name: 'Bilal', class_id: '3'
      })
      await db.collection('users').doc('head-2').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-2')
      const other = await call('issueStudentPins', { student_uids: ['student-2'] })
      await signOut(auth)

      const res = await call('studentSignIn', {
        school_token: token, roll_no: other.issued[0].roll_no, pin: other.issued[0].pin
      })
      expect(res.student_uid).toBe('student-2')

      // And a reset clears the lockout, so a teacher can rescue the morning.
      await signInAs('head-2')
      const fresh = await call('resetStudentPin', { student_uid: uid })
      await signOut(auth)
      const back = await call('studentSignIn', { school_token: token, roll_no, pin: fresh.pin })
      expect(back.student_uid).toBe(uid)
    }, 60000)

    it('numbers a second import on from the last roll number', async () => {
      const { school, roll_no } = await seedChild()
      expect(roll_no).toBe('1')

      await db.collection('users').doc('student-3').set({
        role: 'student', school_id: school.school_id, name: 'Zara', class_id: '4'
      })
      await db.collection('users').doc('head-3').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-3')
      const next = await call('issueStudentPins', { student_uids: ['student-3'] })

      expect(next.issued[0].roll_no).toBe('2')
    }, 60000)

    it('refuses to issue a PIN for another school\'s child', async () => {
      const { school } = await seedOrgWithSchool()
      await db.collection('users').doc('outsider').set({ role: 'student', school_id: 'someone-else', name: 'Not Ours' })
      await db.collection('users').doc('head-4').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-4')

      expect(await codeOf(call('issueStudentPins', { student_uids: ['outsider'] })))
        .toBe('functions/permission-denied')
    }, 60000)
  })

  describe('the school\'s own link', () => {
    it('comes back to its staff, and to nobody else', async () => {
      const { school } = await seedOrgWithSchool()

      await db.collection('users').doc('head-5').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-5')
      expect((await call('getSchoolLink')).path).toBe(school.student_path)
      await signOut(auth)

      await db.collection('users').doc('stranger').set({ role: 'school_admin', school_id: 'another-school' })
      await signInAs('stranger')
      expect(await codeOf(call('getSchoolLink'))).toBe('functions/not-found')
    }, 60000)

    it('rotating breaks every slip already handed out', async () => {
      const { school } = await seedOrgWithSchool()
      const uid = 'student-9'
      await db.collection('users').doc(uid).set({ role: 'student', school_id: school.school_id, name: 'Sana' })
      await db.collection('users').doc('head-6').set({ role: 'school_admin', school_id: school.school_id })
      await signInAs('head-6')
      const issued = await call('issueStudentPins', { student_uids: [uid] })
      const rotated = await call('rotateSchoolLink', {})
      await signOut(auth)

      const { roll_no, pin } = issued.issued[0]
      // The PIN is untouched — a leaked link is not a leaked PIN — but the
      // old fragment no longer resolves to a school.
      expect(await codeOf(call('studentSignIn', { school_token: tokenOf(school.student_path), roll_no, pin })))
        .toBe('functions/permission-denied')
      const res = await call('studentSignIn', { school_token: tokenOf(rotated.path), roll_no, pin })
      expect(res.student_uid).toBe(uid)
    }, 60000)
  })
})
