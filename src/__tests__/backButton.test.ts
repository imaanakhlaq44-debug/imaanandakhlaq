import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { APK_PAGES, ROLE_HOME } from '../lib/appRoutes'

/**
 * The app gets ONE hardware back listener, registered in Head.tsx.
 *
 * It had three. Head.tsx registered one at DOMContentLoaded; the student
 * dashboard registered another 1.2s later and called
 * removeAllListeners('backButton') first, deleting the other two; the bottom
 * bar polls for the Capacitor plugin every 250ms for up to 10s and could
 * re-register itself after that deletion. Which handler answered a press
 * depended on when the press happened, and when two survived together one tap
 * both navigated away and put up "Press back again to exit" over the page it
 * had already left.
 *
 * Nothing about that is visible in a diff that adds one more listener, so it
 * is pinned here instead. A page that needs to answer back itself sets
 * window.__iaBackIntercept and returns true when it has handled the press.
 */

const root = resolve(__dirname, '../..')

function read(rel: string) {
  return readFileSync(resolve(root, rel), 'utf-8')
}

/** Source with // line comments removed, so prose about a call is not a call. */
function code(rel: string) {
  return read(rel)
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n')
}

const componentDir = resolve(root, 'src/components')
const componentFiles = readdirSync(componentDir).filter((f) => f.endsWith('.tsx'))

describe('back button ownership', () => {
  it('registers the listener in exactly one place', () => {
    const scanned = componentFiles
      .map((f) => 'src/components/' + f)
      .concat(readdirSync(resolve(root, 'src/lib')).map((f) => 'src/lib/' + f))

    const owners: string[] = []
    for (const file of scanned) {
      const matches = code(file).match(/addListener\(\s*['"]backButton['"]/g)
      if (matches) owners.push(file + ' (' + matches.length + ')')
    }
    expect(
      owners,
      'Only src/lib/backButton.ts may register the backButton listener. A ' +
      'second one races the first and the same press gets answered twice. ' +
      'Set window.__iaBackIntercept instead.'
    ).toEqual(['src/lib/backButton.ts (1)'])
  })

  it('leaves no hand-written handler in the static pages either', () => {
    // This suite only ever read src/components, so it passed while
    // public/admin-dashboard.html — a hand-maintained page — kept its own
    // handler that never set __iaBackHandler. The bottom bar therefore never
    // stood down there, and the school admin dashboard was the one screen
    // still answering a single press twice.
    const staticPages = readdirSync(resolve(root, 'public')).filter((f) => f.endsWith('.html'))
    const offenders: string[] = []
    for (const file of staticPages) {
      const source = code('public/' + file)
      if (/addListener\(\s*['"]backButton['"]/.test(source)) offenders.push(file)
    }
    expect(
      offenders,
      'A static page registers its own backButton listener. Leave a ' +
      '/* IA_BACK_BUTTON */ marker instead and let the route substitute the ' +
      'shared handler from src/lib/backButton.ts.'
    ).toEqual([])
  })

  it('substitutes the shared pieces into the static admin dashboard', () => {
    const page = read('public/admin-dashboard.html')
    const route = read('src/app.ts')
    for (const marker of ['IA_APK_ALLOWED', 'IA_APP_UPDATE', 'IA_BACK_BUTTON', 'IA_PULL_TO_REFRESH']) {
      expect(page, marker + ' marker missing from admin-dashboard.html').toContain(marker)
      expect(route, marker + ' is never substituted by the /admin-dashboard route').toContain(marker)
    }
  })

  it('never wipes the listener out from under another page', () => {
    const callers: string[] = []
    for (const file of componentFiles) {
      if (/removeAllListeners\(\s*['"]backButton['"]/.test(code('src/components/' + file))) {
        callers.push(file)
      }
    }
    expect(
      callers,
      'removeAllListeners(\'backButton\') deletes handlers this file does not own, ' +
      'including the bottom bar\'s, and whether it wins is a race with a timer.'
    ).toEqual([])
  })
})

describe('the bottom bar stands down', () => {
  const bar = code('scripts/apk-bottombar.cjs')

  it('checks the page-owns-back flag before doing anything else', () => {
    const listenerAt = bar.indexOf("addListener('backButton'")
    expect(listenerAt, 'bottom bar backButton listener not found').toBeGreaterThan(-1)

    const body = bar.slice(listenerAt)
    const guardAt = body.indexOf('window.__iaBackHandler')
    const navigateAt = body.indexOf('window.location')
    const historyAt = body.indexOf('window.history.back')

    expect(guardAt, '__iaBackHandler guard missing from the bar listener').toBeGreaterThan(-1)
    // The guard used to sit fourth, behind a branch that navigated to the
    // student dashboard — so on a chapter page the bar acted before standing
    // down, and Head.tsx acted too.
    for (const [label, at] of [['a navigation', navigateAt], ['history.back', historyAt]] as const) {
      if (at > -1) {
        expect(
          guardAt,
          'The bar reaches ' + label + ' before checking __iaBackHandler.'
        ).toBeLessThan(at)
      }
    }
  })

  it('offers the same intercept contract Head.tsx uses', () => {
    // auth.html has no Head.tsx script — the APK build strips it — so the bar
    // is the only handler there, and the auth page states its rule the same way.
    expect(bar).toContain('__iaBackIntercept')
  })
})

describe('where back goes', () => {
  // The handler itself lives in the lib; Head.tsx and the static admin
  // dashboard both take it from there.
  const head = read('src/lib/backButton.ts')

  it('sends every sub-page to an explicit parent, not into history', () => {
    // history.back() can step into auth.html, which is still on the WebView
    // stack after signing in — that is what made back look like a logout.
    for (const [page, parent] of [
      ['activity', 'student-activities.html'],
      ['club', 'student-activities.html'],
      ['reading-plan', 'family.html'],
      ['teacher-reader', 'teacher-dashboard.html'],
    ]) {
      expect(head, page + ' has no parent screen').toContain(
        "'" + page + "': '" + parent + "'"
      )
    }
  })

  it('treats every landing page as a root', () => {
    // A page a person is sent to after signing in has nothing above it, so
    // back leaves the app rather than walking backwards into the login page.
    for (const rootPage of [
      'auth', 'student-activities', 'family',
      'teacher-dashboard', 'admin-dashboard', 'super-admin-dashboard',
    ]) {
      expect(head, rootPage + ' missing from BACK_ROOTS').toMatch(
        new RegExp("BACK_ROOTS[\\s\\S]{0,300}'" + rootPage + "'")
      )
    }
  })

  it('claims the flag before the bar can attach', () => {
    // The bar reads __iaBackHandler when it attaches, which can be before
    // DOMContentLoaded. Setting the flag inside that event was a race.
    const flagAt = head.indexOf('window.__iaBackHandler = true')
    const domReadyAt = head.indexOf("document.addEventListener('DOMContentLoaded'", flagAt)
    expect(flagAt).toBeGreaterThan(-1)
    expect(
      domReadyAt,
      '__iaBackHandler must be set before the DOMContentLoaded handler, not inside it.'
    ).toBeGreaterThan(flagAt)
  })
})

describe('where each role lands', () => {
  it('is decided in one place', () => {
    // Four copies of this ladder existed: two login handlers in AuthPage.tsx,
    // a dashboardFor() whose comment claimed it was "in one place", and the
    // APK splash script. The splash copy had no branch for super_admin, so a
    // signed-in super admin reopening the app got the login page.
    const auth = code('src/components/AuthPage.tsx')
    const ladders = auth.match(/role === 'school_admin'\)\s*(window\.location|dest)/g) || []
    expect(
      ladders.length,
      'AuthPage.tsx spells out a role ladder again. Use dashboardFor() or the ' +
      'emitted ROLE_HOME literal.'
    ).toBe(0)
    expect(auth).toContain('roleHomeJS')

    const splash = code('scripts/apk-splash.cjs')
    expect(
      /u\.role === 'school_admin'/.test(splash),
      'apk-splash.cjs spells out its own role ladder again.'
    ).toBe(false)
    expect(splash).toContain('ROLE_HOME')
  })

  it('sends every signed-in role somewhere real', () => {
    for (const role of ['super_admin', 'school_admin', 'teacher', 'student', 'individual', 'family']) {
      const page = ROLE_HOME[role]
      expect(page, role + ' has no landing page').toBeTruthy()
      expect(
        APK_PAGES as readonly string[],
        role + ' lands on ' + page + ', which the APK guard would bounce'
      ).toContain(page.replace(/\.html$/, ''))
    }
  })

  it('lets the splash script read that map', () => {
    const source = read('src/lib/appRoutes.ts')
    const block = source.match(/export const ROLE_HOME[^=]*= \{([\s\S]*?)\n\}/)
    expect(block, 'apk-splash.cjs parses ROLE_HOME with this exact shape').toBeTruthy()
    const parsed: Record<string, string> = {}
    for (const line of block![1].split('\n')) {
      const entry = line.match(/([a-z_]+)\s*:\s*'([^']+)'/)
      if (entry) parsed[entry[1]] = entry[2]
    }
    expect(parsed).toEqual(ROLE_HOME)
  })
})

describe('the packaged app never needs the network for Firebase', () => {
  it('rewrites dynamic imports, not just static ones', () => {
    // Three `await import('https://…firebase-firestore.js')` calls in the
    // student dashboard were never matched by the static-import rewrite, so
    // they went to the CDN at runtime inside the APK.
    const patcher = read('scripts/apk-firebase-local.cjs')
    expect(patcher).toContain('FIREBASE_DYNAMIC_RE')
    expect(
      patcher,
      'apk-firebase-local.cjs must check its own work — a page it never ' +
      'patched ships an APK that fails without a connection.'
    ).toContain('verifyNothingReachesTheCdn')
  })

  it('lists every page that talks to Firebase', () => {
    const patcher = read('scripts/apk-firebase-local.cjs')
    const block = patcher.match(/const HTML_FILES = \[([\s\S]*?)\]/)
    expect(block, 'HTML_FILES not found').toBeTruthy()

    // Pages rendered by a route that use Firebase have to be in that list.
    for (const page of ['auth', 'family', 'reading-plan', 'student-activities', 'teacher-dashboard']) {
      expect(block![1], page + '.html is missing from HTML_FILES').toContain(page + '.html')
    }
  })
})

describe('every page a route can reach is allowed in the APK', () => {
  const app = read('src/app.ts')

  it('has a Hono route behind every page the APK may open', () => {
    for (const page of APK_PAGES) {
      // teacher-reader is a static file in public/, not a rendered route.
      if (page === 'teacher-reader') continue
      expect(app, '/' + page + ' is not a route any more').toContain(
        "app.get('/" + page + "'"
      )
    }
  })

  it('covers the pages the dashboards actually link to', () => {
    for (const page of ['family', 'reading-plan', 'student-activities', 'activity', 'club']) {
      expect(
        APK_PAGES as readonly string[],
        page + ' is missing from APK_PAGES: inside the APK the guard sends it ' +
        'to auth.html and its links keep the extensionless form, which the ' +
        'local server answers with index.html — the splash.'
      ).toContain(page)
    }
  })

  it('keeps the list in one place', () => {
    // This list was written out by hand in three places. Adding
    // /reading-plan to one of them left the other two behind: the guard
    // bounced the page to auth.html, and the link rewriter left the Daily
    // reading button pointing at "/reading-plan", which the APK's server
    // answers with index.html — so the button restarted the app at the
    // splash screen.
    const head = code('src/components/Head.tsx')
    expect(
      head,
      'Head.tsx should interpolate the shared list, not spell one out.'
    ).toContain('apkAllowedRoutesJS')

    // public/admin-dashboard.html carried a fourth copy that was four entries
    // short — it still named the set of pages from some releases ago.
    for (const script of [
      'scripts/apk-splash.cjs',
      'scripts/apk-bottombar.cjs',
      'public/admin-dashboard.html',
    ]) {
      const source = code(script)
      expect(
        /var allowed = \[/.test(source),
        script + ' declares its own APK allowlist.'
      ).toBe(false)
      expect(
        /^\s*'(student-activities|reading-plan|teacher-dashboard)',/m.test(source),
        script + ' spells out its own page list. Read src/lib/appRoutes.ts instead.'
      ).toBe(false)
    }
  })

  it('lets the build script read that list', () => {
    // The rewriter parses the .ts file, so a reformat that breaks the parse
    // has to fail the build rather than quietly rewrite nothing.
    const splash = read('scripts/apk-splash.cjs')
    expect(splash).toContain('appRoutes.ts')
    expect(splash).toContain('APK_PAGES')

    const source = read('src/lib/appRoutes.ts')
    const block = source.match(/export const APK_PAGES = \[([\s\S]*?)\]/)
    expect(block, 'apk-splash.cjs parses APK_PAGES with this exact shape').toBeTruthy()
    const parsed = (block![1].match(/'([a-z0-9-]+)'/g) || []).map((q) => q.slice(1, -1))
    expect(parsed).toEqual([...APK_PAGES])
  })

  it('lets the splash screen finish before anything redirects', () => {
    // apk-bottombar.cjs used to inject a <head> redirect into index.html that
    // ran before the body, so the splash apk-splash.cjs builds into that same
    // file — logo, animated wordmark, progress bar — was never once seen.
    const bar = code('scripts/apk-bottombar.cjs')
    expect(
      bar.includes("window.location.replace('auth.html')"),
      'apk-bottombar.cjs redirects index.html again. The page that draws the ' +
      'splash decides when it is over; a second redirect skips it entirely.'
    ).toBe(false)
  })
})
