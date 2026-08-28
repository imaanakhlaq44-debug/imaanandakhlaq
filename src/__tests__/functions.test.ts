import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeApp as initAdmin, deleteApp as deleteAdminApp, type App } from 'firebase-admin/app'
import { getFirestore as adminFirestore } from 'firebase-admin/firestore'
import { getAuth as adminAuth } from 'firebase-admin/auth'
import { getStorage as adminStorage } from 'firebase-admin/storage'
import { initializeApp as initClient, deleteApp as deleteClientApp } from 'firebase/app'
import {
  getAuth, connectAuthEmulator, signInWithCustomToken,
  signInWithEmailAndPassword, signOut
} from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { FAMILY_LOGIN_DOMAIN, STAFF_LOGIN_DOMAIN } from '../lib/familyLogin'

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
// The bucket the Storage emulator serves for this project. The test process
// has no FIREBASE_CONFIG of its own, so it names the bucket the way the
// emulator does — the function inside gets the same one from its config.
const BUCKET = PROJECT + '.firebasestorage.app'

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

/**
 * Wait for a background trigger to land.
 *
 * countWallReactions owns like_count and comment_count, and a trigger runs
 * after the callable has already returned — reading the counter straight
 * afterwards races it. Polling states what the test is actually waiting for;
 * a fixed sleep would either be flaky or slow, and usually both.
 */
async function waitFor<T>(read: () => Promise<T>, want: (value: T) => boolean, label = 'condition') {
  for (let i = 0; i < 50; i++) {
    const value = await read()
    if (want(value)) return value
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('timed out waiting for ' + label)
}

async function likeCount(postId: string) {
  const snap = await db.collection('school_posts').doc(postId).get()
  return (snap.data() || {}).like_count
}

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

  /**
   * A community school's roster. The property that matters is what these
   * students DO NOT have: no invite code, because a slip nobody redeems is a
   * pending counter that never reaches zero, and no consent, because a
   * photograph of a child is opt-in and nobody has been asked yet.
   */
  describe('community school roster', () => {
    it('creates students with no login and no claim code', async () => {
      await seedAdmin()
      const res = await call('createRosterStudents', {
        students: [
          { name: 'Abdullah', class_id: 'Class 4' },
          { name: 'Maryam', class_id: 'Class 5' }
        ]
      })

      expect(res.created).toHaveLength(2)
      expect(res.skipped).toHaveLength(0)

      const doc = (await db.collection('users').doc(res.created[0].student_uid).get()).data()!
      expect(doc.role).toBe('student')
      expect(doc.school_id).toBe(SCHOOL)
      expect(doc.class_id).toBe('Class 4')
      expect(doc.roster_only).toBe(true)
      // 'unset' and not 'granted': publishPost treats it exactly like denied.
      expect(doc.media_consent).toBe('unset')
      expect(doc.family_uid).toBeUndefined()
      expect(doc.phone).toBeUndefined()

      const invites = await db.collection('invites').get()
      expect(invites.size).toBe(0)
    }, 60000)

    it('skips a student already on the roster instead of failing the import', async () => {
      await seedAdmin()
      await call('createRosterStudents', { students: [{ name: 'Abdullah', class_id: 'Class 4' }] })

      const res = await call('createRosterStudents', {
        students: [
          { name: '  abdullah  ', class_id: 'Class 4' },  // same person, sloppier sheet
          { name: 'Abdullah', class_id: 'Class 5' },      // same name, different class
          { name: 'Yusuf', class_id: 'Class 4' }
        ]
      })

      expect(res.created).toHaveLength(2)
      expect(res.skipped).toHaveLength(1)
      expect(res.skipped[0].reason).toBe('duplicate')
    }, 60000)

    it('skips an unusable row rather than writing it', async () => {
      await seedAdmin()
      const res = await call('createRosterStudents', {
        students: [{ name: 'A', class_id: 'Class 4' }, { name: 'Fatima', class_id: 'Class 4' }]
      })
      expect(res.created).toHaveLength(1)
      expect(res.skipped[0].reason).toBe('invalid_name')
    }, 60000)

    it('refuses a caller who is not school staff', async () => {
      await db.collection('users').doc('pupil').set({ role: 'student', school_id: SCHOOL })
      await signInAs('pupil')
      await expect(call('createRosterStudents', {
        students: [{ name: 'Ghost', class_id: 'Class 1' }]
      })).rejects.toThrow()
      expect((await db.collection('users').where('roster_only', '==', true).get()).size).toBe(0)
    }, 60000)
  })

  describe('unlocking a community school wall', () => {
    async function seedPendingSchool() {
      await db.collection('schools').doc(SCHOOL).set({
        name: 'Saturday Academy', type: 'weekly', admin_uid: 'admin-1',
        approval_status: 'pending', wall_enabled: false
      })
    }

    it('a super admin approves and the wall unlocks', async () => {
      await seedPendingSchool()
      await db.collection('users').doc('hq').set({ role: 'super_admin', name: 'HQ' })
      await signInAs('hq')

      await call('approveSchool', { school_id: SCHOOL })

      const school = (await db.collection('schools').doc(SCHOOL).get()).data()!
      expect(school.approval_status).toBe('approved')
      expect(school.wall_enabled).toBe(true)
      expect(school.approved_by).toBe('hq')
    }, 60000)

    it('the school admin cannot approve their own school', async () => {
      await seedPendingSchool()
      await seedAdmin()

      await expect(call('approveSchool', { school_id: SCHOOL })).rejects.toThrow()

      const school = (await db.collection('schools').doc(SCHOOL).get()).data()!
      expect(school.wall_enabled).toBe(false)
    }, 60000)

    it('putting a school back to pending locks the wall again', async () => {
      await seedPendingSchool()
      await db.collection('users').doc('hq').set({ role: 'super_admin', name: 'HQ' })
      await signInAs('hq')

      await call('approveSchool', { school_id: SCHOOL })
      await call('approveSchool', { school_id: SCHOOL, approved: false })

      const school = (await db.collection('schools').doc(SCHOOL).get()).data()!
      expect(school.approval_status).toBe('pending')
      expect(school.wall_enabled).toBe(false)
    }, 60000)
  })

  /**
   * Teachers no longer register themselves — the Teacher card is gone from the
   * auth page, so this callable is the only way a teacher account comes into
   * existence, and the login it produces has to actually work.
   */
  describe('teacher provisioning', () => {
    it('creates a teacher login the school can hand over', async () => {
      await seedAdmin()
      const res = await call('createTeacherAccount', { name: 'Muallima Fatima', class_id: 'Class 4' })

      expect(res.username).toMatch(/^TCH-[A-Z0-9]{5}$/)
      expect(res.password).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)

      const profile = (await db.collection('users').doc(res.teacher_uid).get()).data()!
      expect(profile.role).toBe('teacher')
      expect(profile.school_id).toBe(SCHOOL)
      expect(profile.class_id).toBe('Class 4')
      expect(profile.username).toBe(res.username)

      // No invite is minted: the whole point of provisioning is that there is
      // no code left lying around for anyone to redeem.
      expect((await db.collection('invites').get()).size).toBe(0)
    }, 60000)

    it('signs in with the address the login page builds from the username', async () => {
      await seedAdmin()
      const res = await call('createTeacherAccount', { name: 'Muallima Fatima' })

      // Exactly what usernameToEmail does for a TCH- username. If the two ever
      // disagreed on the domain, this is where it shows.
      const email = res.username.toLowerCase() + '@' + STAFF_LOGIN_DOMAIN
      const cred = await signInWithEmailAndPassword(auth, email, res.password)
      expect(cred.user.uid).toBe(res.teacher_uid)
    }, 60000)

    it('refuses a caller who is not school staff', async () => {
      await db.collection('users').doc('pupil2').set({ role: 'student', school_id: SCHOOL })
      await signInAs('pupil2')
      await expect(call('createTeacherAccount', { name: 'Sneaky' })).rejects.toThrow()
    }, 60000)

    it('reissues a password, and the old one stops working', async () => {
      await seedAdmin()
      const created = await call('createTeacherAccount', { name: 'Muallima Fatima' })
      const reset = await call('resetTeacherPassword', { teacher_uid: created.teacher_uid })

      expect(reset.username).toBe(created.username)
      expect(reset.password).not.toBe(created.password)

      const email = created.username.toLowerCase() + '@' + STAFF_LOGIN_DOMAIN
      await expect(signInWithEmailAndPassword(auth, email, created.password)).rejects.toThrow()
      await expect(signInWithEmailAndPassword(auth, email, reset.password)).resolves.toBeTruthy()
    }, 60000)

    it('will not reset a teacher who owns a real email address', async () => {
      // Someone who registered with an old TCH- invite has no username, and
      // their address is theirs — a school admin must not take it over.
      await seedAdmin()
      await db.collection('users').doc('legacy-teacher').set({
        role: 'teacher', school_id: SCHOOL, name: 'Legacy', email: 'her@example.com'
      })
      await expect(call('resetTeacherPassword', { teacher_uid: 'legacy-teacher' }))
        .rejects.toThrow()
    }, 60000)

    it('will not reset a teacher from another school', async () => {
      await seedAdmin()
      await db.collection('users').doc('outsider').set({
        role: 'teacher', school_id: 'some-other-school', name: 'Outsider', username: 'TCH-ZZZZZ'
      })
      await expect(call('resetTeacherPassword', { teacher_uid: 'outsider' })).rejects.toThrow()
    }, 60000)
  })

  /**
   * The wall. publishPost is the only writer of school_posts, and the reason
   * it exists rather than a client write is consent: a child whose parent was
   * never asked must not appear in a photograph, and rules cannot prove that
   * without a document read per tag.
   */
  describe('the school wall', () => {
    const TEACHER = 'wall-teacher-1'

    async function seedOpenSchool(settings: any = {}) {
      await db.collection('schools').doc(SCHOOL).set({
        name: 'Saturday Academy', type: 'weekly', admin_uid: 'admin-1',
        approval_status: 'approved', wall_enabled: true,
        wall_settings: Object.assign({ comments: 'staff', require_approval: false }, settings)
      })
    }

    /** A roster student with consent recorded one way or the other. */
    async function seedStudent(uid: string, name: string, consent: string, classId = 'Class 4') {
      await db.collection('users').doc(uid).set({
        role: 'student', school_id: SCHOOL, class_id: classId,
        name: name, roster_only: true, media_consent: consent
      })
      return uid
    }

    async function seedTeacher(uid = TEACHER) {
      await db.collection('users').doc(uid).set({
        role: 'teacher', school_id: SCHOOL, name: 'Muallima Fatima', username: 'TCH-AAAAA'
      })
      await signInAs(uid)
      return uid
    }

    it('publishes a post and tags only the children who may be photographed', async () => {
      await seedOpenSchool()
      await seedStudent('stu-yes', 'Abdullah Ahmed', 'granted')
      await seedStudent('stu-no', 'Maryam Khan', 'denied')
      await seedStudent('stu-unasked', 'Yusuf Ali', 'unset')
      await seedTeacher()

      const res = await call('publishPost', {
        text: 'Wudu practice',
        session_date: '2026-08-22',
        tagged: ['stu-yes', 'stu-no', 'stu-unasked']
      })

      expect(res.status).toBe('published')
      expect(res.dropped_tags).toHaveLength(2)
      expect(res.dropped_tags.every((d: any) => d.reason === 'no_consent')).toBe(true)

      const post = (await db.collection('school_posts').doc(res.post_id).get()).data()!
      expect(post.tagged).toHaveLength(1)
      expect(post.tagged[0].student_uid).toBe('stu-yes')
      // First name only. A full name never reaches the wall.
      expect(post.tagged[0].first_name).toBe('Abdullah')
      expect(post.school_id).toBe(SCHOOL)
    }, 60000)

    it('files the post under every tagged class, whatever the caller passed', async () => {
      await seedOpenSchool()
      await seedStudent('stu-a', 'Abdullah', 'granted', 'Class 4')
      await seedStudent('stu-b', 'Maryam', 'granted', 'Class 5')
      await seedTeacher()

      const res = await call('publishPost', {
        text: 'Joint session', session_date: '2026-08-22',
        class_ids: ['Class 1'], tagged: ['stu-a', 'stu-b']
      })

      const post = (await db.collection('school_posts').doc(res.post_id).get()).data()!
      // A post showing a Class 4 child has to be findable under Class 4.
      expect(post.class_ids.sort()).toEqual(['Class 1', 'Class 4', 'Class 5'])
    }, 60000)

    it('will not publish while the school is still unverified', async () => {
      await db.collection('schools').doc(SCHOOL).set({
        name: 'Saturday Academy', type: 'weekly', admin_uid: 'admin-1',
        approval_status: 'pending', wall_enabled: false
      })
      await seedTeacher()

      await expect(call('publishPost', { text: 'Too early', session_date: '2026-08-22' }))
        .rejects.toThrow()
      expect((await db.collection('school_posts').get()).size).toBe(0)
    }, 60000)

    it('drops a child who belongs to another school', async () => {
      await seedOpenSchool()
      await db.collection('users').doc('stu-elsewhere').set({
        role: 'student', school_id: 'some-other-school', name: 'Zainab', media_consent: 'granted'
      })
      await seedTeacher()

      const res = await call('publishPost', {
        text: 'Session', session_date: '2026-08-22', tagged: ['stu-elsewhere']
      })
      expect(res.dropped_tags[0].reason).toBe('other_school')
      const post = (await db.collection('school_posts').doc(res.post_id).get()).data()!
      expect(post.tagged).toHaveLength(0)
    }, 60000)

    it('refuses a media path outside the caller own staging tray', async () => {
      await seedOpenSchool()
      await seedTeacher()

      // Another teacher's tray. Without the prefix check, naming any file in
      // the bucket would publish it under this post.
      await expect(call('publishPost', {
        text: 'Borrowed', session_date: '2026-08-22',
        media: [{ path: 'wall_staging/' + SCHOOL + '/someone-else/photo.jpg' }]
      })).rejects.toThrow()

      // And a traversal out of it.
      await expect(call('publishPost', {
        text: 'Borrowed', session_date: '2026-08-22',
        media: [{ path: 'wall_staging/' + SCHOOL + '/' + TEACHER + '/../../../secret.jpg' }]
      })).rejects.toThrow()

      expect((await db.collection('school_posts').get()).size).toBe(0)
    }, 60000)

    it('moves a staged photo into the post and leaves the tray empty', async () => {
      await seedOpenSchool()
      await seedTeacher()

      const bucket = adminStorage(adminApp).bucket(BUCKET)
      const staged = 'wall_staging/' + SCHOOL + '/' + TEACHER + '/snap.jpg'
      await bucket.file(staged).save(Buffer.from('not really a jpeg'), {
        contentType: 'image/jpeg'
      })

      const res = await call('publishPost', {
        text: 'Wudu practice', session_date: '2026-08-22',
        media: [{ path: staged, w: 1600, h: 1200, bytes: 17 }]
      })

      const post = (await db.collection('school_posts').doc(res.post_id).get()).data()!
      expect(post.media).toHaveLength(1)
      expect(post.media[0].path).toBe('wall/' + SCHOOL + '/' + res.post_id + '/snap.jpg')
      expect(post.media[0].type).toBe('image')
      expect(post.media[0].w).toBe(1600)

      // Moved, not copied. A staging tray that keeps a second copy of every
      // photograph is a second place a parent's takedown request has to reach.
      const [stillStaged] = await bucket.file(staged).exists()
      expect(stillStaged).toBe(false)
      const [published] = await bucket.file(post.media[0].path).exists()
      expect(published).toBe(true)
    }, 60000)

    it('deleting a post takes its photographs with it', async () => {
      await seedOpenSchool()
      await seedTeacher()

      const bucket = adminStorage(adminApp).bucket(BUCKET)
      const staged = 'wall_staging/' + SCHOOL + '/' + TEACHER + '/gone.jpg'
      await bucket.file(staged).save(Buffer.from('x'), { contentType: 'image/jpeg' })

      const res = await call('publishPost', {
        text: 'Session', session_date: '2026-08-22', media: [{ path: staged }]
      })
      const published = 'wall/' + SCHOOL + '/' + res.post_id + '/gone.jpg'
      expect((await bucket.file(published).exists())[0]).toBe(true)

      await call('moderatePost', { post_id: res.post_id, action: 'delete' })

      // A post taken down because a parent asked is not taken down while its
      // images are still fetchable by anyone holding the URL.
      expect((await bucket.file(published).exists())[0]).toBe(false)
    }, 60000)

    it('refuses a post with neither a photo nor a note, and a bad date', async () => {
      await seedOpenSchool()
      await seedTeacher()

      await expect(call('publishPost', { session_date: '2026-08-22' })).rejects.toThrow()
      await expect(call('publishPost', { text: 'Hello', session_date: '22 August' })).rejects.toThrow()
      await expect(call('publishPost', { text: 'Hello', session_date: '' })).rejects.toThrow()
    }, 60000)

    it('holds a teacher post for review when the school asked for that', async () => {
      await seedOpenSchool({ require_approval: true })
      await seedTeacher()

      const res = await call('publishPost', { text: 'Waiting', session_date: '2026-08-22' })
      expect(res.status).toBe('pending')

      const post = (await db.collection('school_posts').doc(res.post_id).get()).data()!
      expect(post.published_at).toBeUndefined()
    }, 60000)

    it('does not hold an admin own post for the admin own review', async () => {
      await seedOpenSchool({ require_approval: true })
      await seedAdmin()

      const res = await call('publishPost', { text: 'Mine', session_date: '2026-08-22' })
      expect(res.status).toBe('published')
    }, 60000)

    it('refuses a caller who is not staff', async () => {
      await seedOpenSchool()
      await db.collection('users').doc('a-pupil').set({ role: 'student', school_id: SCHOOL })
      await signInAs('a-pupil')

      await expect(call('publishPost', { text: 'Hi', session_date: '2026-08-22' }))
        .rejects.toThrow()
    }, 60000)

    /**
     * countWallReactions is the only writer of like_count and comment_count.
     * These check that it is exactly one writer — not none, and not two.
     */
    describe('reaction counters', () => {
      async function postWithSchool() {
        await seedOpenSchool()
        await seedTeacher()
        return call('publishPost', { text: 'A session', session_date: '2026-08-22' })
      }

      it('counts a like written straight to Firestore', async () => {
        const post = await postWithSchool()
        const likes = db.collection('school_posts').doc(post.post_id).collection('likes')

        await likes.doc('someone').set({ school_id: SCHOOL, created_at: '2026-08-22T00:00:00.000Z' })
        await waitFor(() => likeCount(post.post_id), (n) => n === 1, 'one like')

        await likes.doc('someone').delete()
        await waitFor(() => likeCount(post.post_id), (n) => n === 0, 'no likes')
      }, 60000)

      it('counts each person once, however many rewrites', async () => {
        const post = await postWithSchool()
        const like = db.collection('school_posts').doc(post.post_id).collection('likes').doc('someone')

        await like.set({ school_id: SCHOOL, created_at: 'a' })
        await like.set({ school_id: SCHOOL, created_at: 'b' })
        await like.set({ school_id: SCHOOL, created_at: 'c' })

        await waitFor(() => likeCount(post.post_id), (n) => n === 1, 'still one like')
        // Give a stray increment time to arrive before declaring it absent.
        await new Promise((r) => setTimeout(r, 600))
        expect(await likeCount(post.post_id)).toBe(1)
      }, 60000)

      it('counts comments separately, and hiding one does not change the count', async () => {
        const post = await postWithSchool()
        const comments = db.collection('school_posts').doc(post.post_id).collection('comments')

        await comments.doc('c1').set({
          school_id: SCHOOL, author_uid: 'someone', text: 'Well done', status: 'visible'
        })
        await waitFor(
          async () => (await db.collection('school_posts').doc(post.post_id).get()).get('comment_count'),
          (n) => n === 1, 'one comment'
        )

        // A hidden comment still occupies a row in the thread staff can see.
        await comments.doc('c1').update({ status: 'hidden' })
        await new Promise((r) => setTimeout(r, 600))
        const snap = await db.collection('school_posts').doc(post.post_id).get()
        expect(snap.get('comment_count')).toBe(1)
        expect(snap.get('like_count')).toBe(0)
      }, 60000)

      it('deleting a post takes its likes and comments with it', async () => {
        const post = await postWithSchool()
        const ref = db.collection('school_posts').doc(post.post_id)
        await ref.collection('likes').doc('someone').set({ school_id: SCHOOL, created_at: 'a' })
        await ref.collection('comments').doc('c1').set({
          school_id: SCHOOL, author_uid: 'someone', text: 'Hello', status: 'visible'
        })
        await waitFor(() => likeCount(post.post_id), (n) => n === 1, 'one like')

        await call('moderatePost', { post_id: post.post_id, action: 'delete' })

        // Firestore does not delete subcollections with their parent. Left
        // alone, a post taken down because a parent asked would keep every
        // like and comment written about their child.
        expect((await ref.collection('likes').get()).size).toBe(0)
        expect((await ref.collection('comments').get()).size).toBe(0)
        expect((await ref.get()).exists).toBe(false)
      }, 60000)
    })

    describe('moderation', () => {
      async function publishAs(uid: string) {
        await seedOpenSchool()
        await seedTeacher(uid)
        return call('publishPost', { text: 'Session', session_date: '2026-08-22' })
      }

      it('hides and restores a post', async () => {
        const post = await publishAs(TEACHER)

        await call('moderatePost', { post_id: post.post_id, action: 'hide' })
        let doc = (await db.collection('school_posts').doc(post.post_id).get()).data()!
        expect(doc.status).toBe('hidden')

        await call('moderatePost', { post_id: post.post_id, action: 'publish' })
        doc = (await db.collection('school_posts').doc(post.post_id).get()).data()!
        expect(doc.status).toBe('published')
      }, 60000)

      it('deletes a post', async () => {
        const post = await publishAs(TEACHER)
        await call('moderatePost', { post_id: post.post_id, action: 'delete' })
        expect((await db.collection('school_posts').doc(post.post_id).get()).exists).toBe(false)
      }, 60000)

      it('stops one teacher from taking down another teacher post', async () => {
        const post = await publishAs(TEACHER)

        // A second teacher at the same school.
        await db.collection('users').doc('teacher-2').set({
          role: 'teacher', school_id: SCHOOL, name: 'Another'
        })
        await signInAs('teacher-2')

        await expect(call('moderatePost', { post_id: post.post_id, action: 'delete' }))
          .rejects.toThrow()
        expect((await db.collection('school_posts').doc(post.post_id).get()).exists).toBe(true)
      }, 60000)

      it('lets the school admin moderate anyone post', async () => {
        const post = await publishAs(TEACHER)
        await seedAdmin()
        await call('moderatePost', { post_id: post.post_id, action: 'hide' })
        const doc = (await db.collection('school_posts').doc(post.post_id).get()).data()!
        expect(doc.status).toBe('hidden')
      }, 60000)

      it('stops another school staff from touching it at all', async () => {
        const post = await publishAs(TEACHER)
        await db.collection('users').doc('outsider-admin').set({
          role: 'school_admin', school_id: 'some-other-school', name: 'Outsider'
        })
        await signInAs('outsider-admin')

        await expect(call('moderatePost', { post_id: post.post_id, action: 'delete' }))
          .rejects.toThrow()
      }, 60000)
    })
  })

  /**
   * Parent access. The token is the credential — there is no sign-in — so the
   * properties that matter are what a token does NOT open: another child's
   * posts, an unpublished post, or anything after it expires or is revoked.
   */
  describe('parent links', () => {
    const TEACHER = 'wall-teacher-2'

    async function seedOpenSchool() {
      await db.collection('schools').doc(SCHOOL).set({
        name: 'Saturday Academy', type: 'weekly', admin_uid: 'admin-1',
        approval_status: 'approved', wall_enabled: true,
        wall_settings: { comments: 'staff', require_approval: false }
      })
    }

    async function seedStudent(uid: string, name: string, classId = 'Class 4') {
      await db.collection('users').doc(uid).set({
        role: 'student', school_id: SCHOOL, class_id: classId,
        name: name, roster_only: true, media_consent: 'granted'
      })
    }

    async function seedTeacher(uid = TEACHER) {
      await db.collection('users').doc(uid).set({
        role: 'teacher', school_id: SCHOOL, name: 'Muallima Fatima'
      })
      await signInAs(uid)
    }

    /** School set up, two children, one post tagging only the first. */
    async function setup() {
      await seedOpenSchool()
      await seedStudent('stu-mine', 'Abdullah Ahmed')
      await seedStudent('stu-theirs', 'Yusuf Ali', 'Class 5')
      await seedTeacher()
      const post = await call('publishPost', {
        text: 'Wudu practice', session_date: '2026-08-22', tagged: ['stu-mine']
      })
      const link = await call('issueParentLink', { student_uid: 'stu-mine' })
      return { post, link }
    }

    it('issues a link and marks the student, without putting the token on them', async () => {
      const { link } = await setup()

      expect(link.token).toMatch(/^[A-Z0-9]{32}$/)
      expect(link.path).toBe('/wall/p#' + link.token)

      const student = (await db.collection('users').doc('stu-mine').get()).data()!
      expect(student.parent_link_issued_at).toBeTruthy()
      // The roster is a list a whole staff room reads. A token on it would be
      // every parent's link on one screen.
      expect(JSON.stringify(student)).not.toContain(link.token)
    }, 60000)

    it('shows the parent their own child posts', async () => {
      const { link } = await setup()
      await signOut(auth)

      const wall = await call('readParentWall', { token: link.token })
      expect(wall.student_name).toBe('Abdullah Ahmed')
      expect(wall.school_name).toBe('Saturday Academy')
      expect(wall.posts).toHaveLength(1)
      expect(wall.posts[0].text).toBe('Wudu practice')
      expect(wall.posts[0].child_first_name).toBe('Abdullah')
    }, 60000)

    it('hands the parent a usable link to each photo', async () => {
      await seedOpenSchool()
      await seedStudent('stu-mine', 'Abdullah Ahmed')
      await seedTeacher()

      const bucket = adminStorage(adminApp).bucket(BUCKET)
      const staged = 'wall_staging/' + SCHOOL + '/' + TEACHER + '/p.jpg'
      await bucket.file(staged).save(Buffer.from('x'), { contentType: 'image/jpeg' })
      await call('publishPost', {
        text: 'With a photo', session_date: '2026-08-22',
        tagged: ['stu-mine'], media: [{ path: staged, w: 1600, h: 1200 }]
      })
      const link = await call('issueParentLink', { student_uid: 'stu-mine' })
      await signOut(auth)

      const wall = await call('readParentWall', { token: link.token })
      // The entry survives even when the URL could not be produced, so the
      // page can draw a placeholder. Dropping it would show the parent a post
      // that looks like it never had a photograph, and nobody reports a
      // photograph that quietly went missing.
      expect(wall.posts[0].media).toHaveLength(1)
      expect(wall.posts[0].media[0].w).toBe(1600)

      // The URL itself needs the service account's signBlob permission. A
      // deployed function has it; the Storage emulator cannot sign at all
      // ('Cannot sign data without client_email'), so this half of the
      // guarantee is only checkable where signing works.
      if (wall.posts[0].media[0].url) {
        expect(wall.posts[0].media[0].url).toMatch(/^https?:/)
      }
    }, 60000)

    it('does not show a post that does not tag their child', async () => {
      const { link } = await setup()
      await seedTeacher()
      await call('publishPost', {
        text: 'A different class', session_date: '2026-08-22', tagged: ['stu-theirs']
      })
      await signOut(auth)

      const wall = await call('readParentWall', { token: link.token })
      // One link must not become a reader of the whole school's photographs.
      expect(wall.posts).toHaveLength(1)
      expect(wall.posts[0].text).toBe('Wudu practice')
    }, 60000)

    it('names only their own child on a post that tags several', async () => {
      await seedOpenSchool()
      await seedStudent('stu-mine', 'Abdullah Ahmed')
      await seedStudent('stu-other', 'Maryam Khan')
      await seedTeacher()
      await call('publishPost', {
        text: 'Both classes', session_date: '2026-08-22', tagged: ['stu-mine', 'stu-other']
      })
      const link = await call('issueParentLink', { student_uid: 'stu-mine' })
      await signOut(auth)

      const wall = await call('readParentWall', { token: link.token })
      expect(wall.posts[0].child_first_name).toBe('Abdullah')
      // The other children are in the picture; their names are not this
      // parent's to collect.
      expect(JSON.stringify(wall.posts[0])).not.toContain('Maryam')
    }, 60000)

    it('hides a post the school took down', async () => {
      const { post, link } = await setup()
      await call('moderatePost', { post_id: post.post_id, action: 'hide' })
      await signOut(auth)

      const wall = await call('readParentWall', { token: link.token })
      expect(wall.posts).toHaveLength(0)
    }, 60000)

    it('refuses a wrong, revoked or expired token the same way', async () => {
      const { link } = await setup()

      await signOut(auth)
      await expect(call('readParentWall', { token: 'NOTAREALTOKEN' })).rejects.toThrow()

      await seedTeacher()
      await call('revokeParentLink', { token: link.token })
      await signOut(auth)
      await expect(call('readParentWall', { token: link.token })).rejects.toThrow()

      // Revoking also clears the roster marker, or the school would think the
      // parent still had a working link.
      const student = (await db.collection('users').doc('stu-mine').get()).data()!
      expect(student.parent_link_issued_at).toBeUndefined()
    }, 60000)

    it('expires', async () => {
      const { link } = await setup()
      await db.collection('parent_links').doc(link.token)
        .update({ expires_at: new Date(Date.now() - 86400000).toISOString() })
      await signOut(auth)

      await expect(call('readParentWall', { token: link.token })).rejects.toThrow()
    }, 60000)

    it('reissuing revokes the previous slip', async () => {
      const { link } = await setup()
      const second = await call('issueParentLink', { student_uid: 'stu-mine' })
      expect(second.token).not.toBe(link.token)

      await signOut(auth)
      // A slip handed to the wrong parent has to stop working.
      await expect(call('readParentWall', { token: link.token })).rejects.toThrow()
      await expect(call('readParentWall', { token: second.token })).resolves.toBeTruthy()
    }, 60000)

    it('will not issue a link for another school student', async () => {
      await seedOpenSchool()
      await db.collection('users').doc('stu-elsewhere').set({
        role: 'student', school_id: 'some-other-school', name: 'Zainab'
      })
      await seedTeacher()
      await expect(call('issueParentLink', { student_uid: 'stu-elsewhere' })).rejects.toThrow()
    }, 60000)

    describe('appreciation', () => {
      it('adds a heart, and taking it back removes it', async () => {
        const { post, link } = await setup()
        await signOut(auth)

        const on = await call('appreciatePost', { token: link.token, post_id: post.post_id })
        expect(on.liked).toBe(true)
        // The counter is the trigger's, not the callable's, so it lands a beat
        // later. appreciatePost stopped incrementing when countWallReactions
        // shipped — doing both would count one heart twice.
        await waitFor(() => likeCount(post.post_id), (n) => n === 1, 'like_count 1')

        const off = await call('appreciatePost', { token: link.token, post_id: post.post_id })
        expect(off.liked).toBe(false)
        await waitFor(() => likeCount(post.post_id), (n) => n === 0, 'like_count 0')
      }, 60000)

      it('counts one link once, however many times it is tapped', async () => {
        const { post, link } = await setup()
        await signOut(auth)

        await call('appreciatePost', { token: link.token, post_id: post.post_id })
        await call('appreciatePost', { token: link.token, post_id: post.post_id })
        await call('appreciatePost', { token: link.token, post_id: post.post_id })

        await waitFor(() => likeCount(post.post_id), (n) => n === 1, 'like_count 1')

        const wall = await call('readParentWall', { token: link.token })
        expect(wall.posts[0].liked).toBe(true)
        expect(wall.posts[0].like_count).toBe(1)
      }, 60000)

      it('stores no token on the like document', async () => {
        const { post, link } = await setup()
        await signOut(auth)
        await call('appreciatePost', { token: link.token, post_id: post.post_id })

        const likes = await db.collection('school_posts').doc(post.post_id)
          .collection('likes').get()
        expect(likes.size).toBe(1)
        // The id is a hash and the body carries no token: a like is read by
        // the page, and a token in readable data is a token that leaks.
        expect(likes.docs[0].id).toMatch(/^guardian_[0-9a-f]{16}$/)
        expect(JSON.stringify(likes.docs[0].data())).not.toContain(link.token)
      }, 60000)

      it('cannot appreciate a post that does not tag their child', async () => {
        const { link } = await setup()
        await seedTeacher()
        const other = await call('publishPost', {
          text: 'A different class', session_date: '2026-08-22', tagged: ['stu-theirs']
        })
        await signOut(auth)

        await expect(call('appreciatePost', { token: link.token, post_id: other.post_id }))
          .rejects.toThrow()
      }, 60000)

      it('cannot appreciate with a revoked token', async () => {
        const { post, link } = await setup()
        await seedTeacher()
        await call('revokeParentLink', { token: link.token })
        await signOut(auth)

        await expect(call('appreciatePost', { token: link.token, post_id: post.post_id }))
          .rejects.toThrow()
      }, 60000)
    })
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


  /**
   * Mentor verification of club habits.
   *
   * The rules already prove a client cannot write 'approved'. What is left to
   * prove is the other half: that this callable pays exactly the mentors it
   * should, refuses the ones it should not, and that approving a batch twice
   * does not pay twice.
   */
  describe('Club habit verification', () => {
    const TEACHER = 'teacher-c'
    const OTHER_TEACHER = 'teacher-other'
    const STUDENT = 'student-c'
    const OTHER_SCHOOL = 'school-other'

    beforeEach(async () => {
      await signOut(auth).catch(() => {})
      await clearEmulators()
      await db.collection('users').doc(TEACHER).set({ role: 'teacher', school_id: SCHOOL, name: 'Mentor' })
      await db.collection('users').doc(OTHER_TEACHER).set({ role: 'teacher', school_id: OTHER_SCHOOL, name: 'Other Mentor' })
      await db.collection('users').doc(STUDENT).set({
        role: 'student', school_id: SCHOOL, house: 'sidq', name: 'Abdullah'
      })
    })

    // Distinct per log on purpose: a batch of logs that all said the same
    // thing would now be caught as repeats, which is a different test.
    const reflectionFor = (id: string) =>
      'Today I did the habit and this is what actually happened when I did it: ' + id

    const seedLog = async (id: string, habitId = 'sidq_daily_truth', extra: Record<string, unknown> = {}) => {
      const text = reflectionFor(id)
      await db.collection('habit_logs').doc(id).set({
        student_uid: STUDENT,
        school_id: SCHOOL,
        house: 'sidq',
        habit_id: habitId,
        habit_name: habitId,
        log_date: '2026-08-14',
        status: 'pending',
        reflection_text: text,
        reflection_key: text.toLowerCase(),
        ...extra
      })
      return id
    }

    it('awards credits to the student and to their house', async () => {
      await seedLog('log-1', 'sidq_daily_truth')
      await seedLog('log-2', 'sidq_own_it')
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', { log_ids: ['log-1', 'log-2'], decision: 'approve' })
      expect(res.reviewed).toBe(2)
      expect(res.credits_awarded).toBe(20)

      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBe(20)

      const house = (await db.collection('house_scores').doc(SCHOOL + '__sidq').get()).data()!
      expect(house.points).toBe(20)
      expect(house.house).toBe('sidq')

      const log = (await db.collection('habit_logs').doc('log-1').get()).data()!
      expect(log.status).toBe('approved')
      expect(log.points_awarded).toBe(10)
      expect(log.verified_by).toBe(TEACHER)
    }, 60000)

    it('does not pay twice when the same batch is approved again', async () => {
      await seedLog('log-1')
      await signInAs(TEACHER)

      await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })
      const second = await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })

      expect(second.reviewed).toBe(0)
      expect(second.skipped[0].reason).toBe('already-reviewed')
      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBe(10)
    }, 60000)

    it('refuses a mentor from another school', async () => {
      await seedLog('log-1')
      await signInAs(OTHER_TEACHER)

      const res = await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('other-school')

      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBeUndefined()
    }, 60000)

    it('refuses a student trying to approve their own habit', async () => {
      await seedLog('log-1')
      await signInAs(STUDENT)

      await expect(call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' }))
        .rejects.toThrow(/mentor/i)
    }, 60000)

    it('will not approve a tick with no reflection behind it', async () => {
      // Logs written before reflections were required still exist, and a
      // client that skips the box would send exactly this.
      await seedLog('log-1', 'sidq_daily_truth', { reflection_text: '', reflection_key: '' })
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.credits_awarded).toBe(0)
      expect(res.skipped[0].reason).toBe('no-reflection')
    }, 60000)

    it('still lets a mentor send an empty tick back', async () => {
      await seedLog('log-1', 'sidq_daily_truth', { reflection_text: '', reflection_key: '' })
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', {
        log_ids: ['log-1'], decision: 'reject', note: 'Please write what you did.'
      })
      expect(res.reviewed).toBe(1)
    }, 60000)

    it('pays for one copy of a reflection pasted across a day', async () => {
      const same = 'I helped somebody today and it went well enough to write about here.'
      await seedLog('log-1', 'sidq_daily_truth', { reflection_text: same, reflection_key: same.toLowerCase() })
      await seedLog('log-2', 'sidq_own_it', { reflection_text: same, reflection_key: same.toLowerCase() })
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', { log_ids: ['log-1', 'log-2'], decision: 'approve' })
      expect(res.reviewed).toBe(1)
      expect(res.credits_awarded).toBe(10)
      expect(res.skipped[0].reason).toBe('duplicate-reflection')
    }, 60000)

    it('catches a reflection reused from an earlier day', async () => {
      const same = 'I helped somebody today and it went well enough to write about here.'
      await seedLog('log-1', 'sidq_daily_truth', { reflection_text: same, reflection_key: same.toLowerCase() })
      await signInAs(TEACHER)
      await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })

      // Same words, different day, different habit.
      await seedLog('log-2', 'sidq_own_it', {
        log_date: '2026-08-15', reflection_text: same, reflection_key: same.toLowerCase()
      })
      const res = await call('reviewHabitLogs', { log_ids: ['log-2'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('duplicate-reflection')
    }, 60000)

    it('is not fooled by re-casing or re-spacing the same words', async () => {
      const original = 'I returned the book I borrowed from the library in better condition.'
      await seedLog('log-1', 'sidq_daily_truth', {
        reflection_text: original, reflection_key: original.toLowerCase()
      })
      await signInAs(TEACHER)
      await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })

      // The client stores whatever key it likes; the callable recomputes.
      const dressed = '  I RETURNED the book   I borrowed\nfrom the library in better condition.  '
      await seedLog('log-2', 'sidq_own_it', {
        log_date: '2026-08-15', reflection_text: dressed, reflection_key: 'something-else-entirely'
      })
      const res = await call('reviewHabitLogs', { log_ids: ['log-2'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('duplicate-reflection')
    }, 60000)

    it('will not price a habit id it does not recognise', async () => {
      // A forged log naming an invented habit must not pay out just because a
      // mentor clicked approve on a queue row.
      await seedLog('log-1', 'sidq_infinite_credits')
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('unknown-habit')
    }, 60000)

    it('sends a habit back with the mentor note and no credits', async () => {
      await seedLog('log-1')
      await signInAs(TEACHER)

      const res = await call('reviewHabitLogs', {
        log_ids: ['log-1'], decision: 'reject', note: 'Tell me what you actually did.'
      })
      expect(res.reviewed).toBe(1)

      const log = (await db.collection('habit_logs').doc('log-1').get()).data()!
      expect(log.status).toBe('rejected')
      expect(log.points_awarded).toBe(0)
      expect(log.mentor_note).toBe('Tell me what you actually did.')

      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBeUndefined()
    }, 60000)

    it('insists on a note when sending work back', async () => {
      await seedLog('log-1')
      await signInAs(TEACHER)

      await expect(call('reviewHabitLogs', { log_ids: ['log-1'], decision: 'reject' }))
        .rejects.toThrow(/note/i)
    }, 60000)

    it('lets a self-study individual approve their own, and nobody else', async () => {
      // Individual accounts have no mentor to wait for — the same allowance
      // activity_submissions already makes for them.
      const SOLO = 'solo-1'
      await db.collection('users').doc(SOLO).set({ role: 'individual', house: 'adl', name: 'Solo' })
      const soloText = reflectionFor('solo-log')
      await db.collection('habit_logs').doc('solo-log').set({
        student_uid: SOLO, house: 'adl', habit_id: 'adl_speak_up',
        log_date: '2026-08-14', status: 'pending',
        reflection_text: soloText, reflection_key: soloText.toLowerCase()
      })
      await seedLog('log-1')
      await signInAs(SOLO)

      const res = await call('reviewHabitLogs', {
        log_ids: ['solo-log', 'log-1'], decision: 'approve'
      })
      expect(res.reviewed).toBe(1)
      expect(res.skipped[0].reason).toBe('not-yours')

      // No school: the credits land in the Global Virtual House.
      const house = (await db.collection('house_scores').doc('global__adl').get()).data()!
      expect(house.points).toBe(10)
    }, 60000)
  })

  describe('Value Economy — awards and Council complaints', () => {
    const ADMIN = 'admin-v'
    const TEACHER = 'teacher-v'
    const STUDENT = 'student-v'
    const OTHER_SCHOOL = 'school-other-v'

    beforeEach(async () => {
      await signOut(auth).catch(() => {})
      await clearEmulators()
      await db.collection('users').doc(ADMIN).set({ role: 'school_admin', school_id: SCHOOL, name: 'Principal' })
      await db.collection('users').doc(TEACHER).set({ role: 'teacher', school_id: SCHOOL, name: 'Mentor' })
      await db.collection('users').doc(STUDENT).set({
        role: 'student', school_id: SCHOOL, house: 'sidq', name: 'Abdullah'
      })
    })

    const describeFor = (id: string) =>
      'This is what I actually did today and how it went when I did it: ' + id

    const seedEntry = async (id: string, categoryId = 'greet_with_salaam', extra: Record<string, unknown> = {}) => {
      await db.collection('credit_entries').doc(id).set({
        student_uid: STUDENT,
        school_id: SCHOOL,
        house: 'sidq',
        category_id: categoryId,
        description: describeFor(id),
        status: 'pending',
        created_at: new Date().toISOString(),
        ...extra
      })
      return id
    }

    it('prices an award from the seed before anyone has opened the panel', async () => {
      // The economy has to work on a school's first day. Nothing has been
      // written to /credit_categories here at all.
      await seedEntry('e-1', 'avoid_injustice')   // seeded at 60
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.reviewed).toBe(1)
      expect(res.credits_awarded).toBe(60)

      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBe(60)
      const house = (await db.collection('house_scores').doc(SCHOOL + '__sidq').get()).data()!
      expect(house.points).toBe(60)
    }, 60000)

    it('lets an edited price win over the seed', async () => {
      // The concept's rule: points are changed from the panel, never in code.
      await db.collection('credit_categories').doc('greet_with_salaam').set({ points: 35 })
      await seedEntry('e-1', 'greet_with_salaam')  // seeded at 20
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.credits_awarded).toBe(35)
    }, 60000)

    it('refuses to price a category the school has switched off', async () => {
      await db.collection('credit_categories').doc('greet_with_salaam').set({ points: 20, is_active: false })
      await seedEntry('e-1', 'greet_with_salaam')
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('unknown-category')
    }, 60000)

    it('falls back to the seed when the panel holds a nonsense price', async () => {
      // A negative price is a typo, not an instruction to take credits away.
      await db.collection('credit_categories').doc('greet_with_salaam').set({ points: -500 })
      await seedEntry('e-1', 'greet_with_salaam')
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.credits_awarded).toBe(20)
    }, 60000)

    it('will not price an entry naming a category nothing recognises', async () => {
      await seedEntry('e-1', 'invented_by_a_forged_client')
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('unknown-category')
    }, 60000)

    it('will not pay for an entry with nothing written on it', async () => {
      await seedEntry('e-1', 'greet_with_salaam', { description: 'did it' })
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('no-description')
    }, 60000)

    it('keeps a bulk approve idempotent', async () => {
      await seedEntry('e-1')
      await signInAs(TEACHER)

      await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      const second = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(second.reviewed).toBe(0)
      expect(second.skipped[0].reason).toBe('already-reviewed')

      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBe(20)
    }, 60000)

    it("will not let a mentor rule on another school's entry", async () => {
      await seedEntry('e-1', 'greet_with_salaam', { school_id: OTHER_SCHOOL })
      await signInAs(TEACHER)

      const res = await call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'approve' })
      expect(res.reviewed).toBe(0)
      expect(res.skipped[0].reason).toBe('other-school')
    }, 60000)

    it('demands a note when an entry is sent back', async () => {
      await seedEntry('e-1')
      await signInAs(TEACHER)
      await expect(call('reviewCreditEntries', { entry_ids: ['e-1'], decision: 'reject' }))
        .rejects.toThrow()
    }, 60000)

    // ── The Values Council's complaint ────────────────────────────────
    //
    // The school's rule: one member breaks the code, the house answers. What
    // these pin is the shape of that — the house pays, and no child's own
    // record is marked for something another child did.

    const REASON = 'One member of this house was heard using bad language in the corridor this morning, in front of younger students.'

    it('takes the penalty off the house and off nobody else', async () => {
      await db.collection('house_scores').doc(SCHOOL + '__sidq').set({
        school_id: SCHOOL, house: 'sidq', points: 200
      })
      await db.collection('users').doc(STUDENT).set({ club_points: 90 }, { merge: true })
      await signInAs(ADMIN)

      const res = await call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 50 })
      expect(res.points_deducted).toBe(50)

      const house = (await db.collection('house_scores').doc(SCHOOL + '__sidq').get()).data()!
      expect(house.points).toBe(150)

      // The line that matters: a member who did nothing keeps their record.
      const student = (await db.collection('users').doc(STUDENT).get()).data()!
      expect(student.club_points).toBe(90)
    }, 60000)

    it('never takes a house below zero', async () => {
      await db.collection('house_scores').doc(SCHOOL + '__sidq').set({
        school_id: SCHOOL, house: 'sidq', points: 20
      })
      await signInAs(ADMIN)

      const res = await call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 100 })
      // Both are kept: the house was fined 100 and could only pay 20.
      expect(res.points_requested).toBe(100)
      expect(res.points_deducted).toBe(20)

      const house = (await db.collection('house_scores').doc(SCHOOL + '__sidq').get()).data()!
      expect(house.points).toBe(0)
    }, 60000)

    it('records what the house was fined for, so it can be told', async () => {
      await signInAs(ADMIN)
      const res = await call('fileCouncilComplaint', { house: 'adl', reason: REASON, points: 30 })

      const filed = (await db.collection('council_complaints').doc(res.complaint_id).get()).data()!
      expect(filed.house).toBe('adl')
      expect(filed.reason).toBe(REASON)
      expect(filed.school_id).toBe(SCHOOL)
      expect(filed.raised_by).toBe(ADMIN)
    }, 60000)

    it('refuses a complaint with no explanation behind it', async () => {
      await signInAs(ADMIN)
      await expect(call('fileCouncilComplaint', { house: 'sidq', reason: 'bad', points: 30 }))
        .rejects.toThrow()
    }, 60000)

    it('refuses a penalty outside what the Council may impose', async () => {
      await signInAs(ADMIN)
      await expect(call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 5 }))
        .rejects.toThrow()
      await expect(call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 500 }))
        .rejects.toThrow()
    }, 60000)

    it('refuses a house that does not exist', async () => {
      await signInAs(ADMIN)
      await expect(call('fileCouncilComplaint', { house: 'greenhouse', reason: REASON, points: 30 }))
        .rejects.toThrow()
    }, 60000)

    it('will not let a teacher fine a whole house on their own', async () => {
      // The Values Council is the school admin's to convene. A mentor rules on
      // one student's entry; fining four houses' worth of children is not the
      // same power and is deliberately not granted with it.
      await signInAs(TEACHER)
      await expect(call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 30 }))
        .rejects.toThrow()
    }, 60000)

    it('will not let a student fine a house at all', async () => {
      await signInAs(STUDENT)
      await expect(call('fileCouncilComplaint', { house: 'sidq', reason: REASON, points: 30 }))
        .rejects.toThrow()
    }, 60000)
  })

  describe('joining a house without a school', () => {
    const SOLO = 'solo-q'
    const SCHOOL_STUDENT = 'student-q'

    // Answers taken from src/lib/houseQuiz.ts. Kept literal rather than
    // imported so that a wrong edit to the key shows up here as a house that
    // changed, not as a test that quietly follows it.
    const allSidq = { q1: 'a', q2: 'c', q3: 'c', q4: 'd', q5: 'a', q6: 'b' }
    const allAdl = { q1: 'd', q2: 'b', q3: 'b', q4: 'a', q5: 'c', q6: 'd' }
    const allRahmah = { q1: 'b', q2: 'd', q3: 'a', q4: 'c', q5: 'd', q6: 'a' }

    beforeEach(async () => {
      await signOut(auth).catch(() => {})
      await clearEmulators()
      await db.collection('users').doc(SOLO).set({ role: 'individual', name: 'Self study' })
      await db.collection('users').doc(SCHOOL_STUDENT).set({
        role: 'student', school_id: SCHOOL, name: 'School child'
      })
    })

    it('sorts a self-study member into the house their answers lean toward', async () => {
      await signInAs(SOLO)
      const res = await call('assignHouseFromQuiz', { answers: allSidq })
      expect(res.house).toBe('sidq')
      expect(res.was_tie).toBe(false)

      const me = (await db.collection('users').doc(SOLO).get()).data()!
      expect(me.house).toBe('sidq')
      // How they got here is recorded — a school-allocated student has no
      // such field, so the two can always be told apart.
      expect(me.house_source).toBe('quiz')
    }, 60000)

    it('reads the answers, not a house the client tried to name', async () => {
      await signInAs(SOLO)
      // The whole reason the scoring is server-side.
      const res = await call('assignHouseFromQuiz', { answers: allAdl, house: 'sidq' })
      expect(res.house).toBe('adl')
    }, 60000)

    it('gives different answers different houses', async () => {
      await signInAs(SOLO)
      expect((await call('assignHouseFromQuiz', { answers: allRahmah })).house).toBe('rahmah')
    }, 60000)

    it('refuses a half-answered quiz', async () => {
      await signInAs(SOLO)
      const partial = { q1: 'a', q2: 'c' }
      await expect(call('assignHouseFromQuiz', { answers: partial })).rejects.toThrow()
      const me = (await db.collection('users').doc(SOLO).get()).data()!
      expect(me.house).toBeUndefined()
    }, 60000)

    it('refuses an option that does not exist', async () => {
      await signInAs(SOLO)
      await expect(call('assignHouseFromQuiz', {
        answers: { ...allSidq, q3: 'z' }
      })).rejects.toThrow()
    }, 60000)

    it('will not re-sort someone who already has a house', async () => {
      // A quiz you can retake until you like the answer is a house you chose,
      // and a house you chose is one you can leave when its habits look hard.
      await signInAs(SOLO)
      await call('assignHouseFromQuiz', { answers: allSidq })
      await expect(call('assignHouseFromQuiz', { answers: allAdl })).rejects.toThrow()

      const me = (await db.collection('users').doc(SOLO).get()).data()!
      expect(me.house).toBe('sidq')
    }, 60000)

    it('will not let a school student sort themselves', async () => {
      // Their school allocates them. This route exists only for members who
      // have nobody to do that.
      await signInAs(SCHOOL_STUDENT)
      await expect(call('assignHouseFromQuiz', { answers: allSidq })).rejects.toThrow()

      const me = (await db.collection('users').doc(SCHOOL_STUDENT).get()).data()!
      expect(me.house).toBeUndefined()
    }, 60000)

    it('marks a self-study member\'s own approvals as self-verified', async () => {
      await db.collection('users').doc(SOLO).set({ house: 'sidq' }, { merge: true })
      const text = 'Today I told my mother the truth about the plate I broke, before she asked me about it.'
      await db.collection('habit_logs').doc('solo-1').set({
        student_uid: SOLO, house: 'sidq', habit_id: 'sidq_daily_truth',
        log_date: '2026-08-16', status: 'pending',
        reflection_text: text, reflection_key: text.toLowerCase()
      })
      await signInAs(SOLO)
      await call('reviewHabitLogs', { log_ids: ['solo-1'], decision: 'approve' })

      const log = (await db.collection('habit_logs').doc('solo-1').get()).data()!
      expect(log.status).toBe('approved')
      // A credit nobody else read must not look like one a teacher signed off.
      expect(log.self_verified).toBe(true)
    }, 60000)

    it('marks a mentor-approved habit as NOT self-verified', async () => {
      await db.collection('users').doc('teacher-q').set({ role: 'teacher', school_id: SCHOOL })
      const text = 'I owned up to breaking the window in the corridor even though nobody had seen me do it.'
      await db.collection('habit_logs').doc('school-1').set({
        student_uid: SCHOOL_STUDENT, school_id: SCHOOL, house: 'sidq',
        habit_id: 'sidq_daily_truth', log_date: '2026-08-16', status: 'pending',
        reflection_text: text, reflection_key: text.toLowerCase()
      })
      await signInAs('teacher-q')
      await call('reviewHabitLogs', { log_ids: ['school-1'], decision: 'approve' })

      const log = (await db.collection('habit_logs').doc('school-1').get()).data()!
      // Stamped either way, so an old log missing the field is never mistaken
      // for one that was actually checked.
      expect(log.self_verified).toBe(false)
    }, 60000)
  })

})