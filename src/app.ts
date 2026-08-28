import { Hono } from 'hono'
import activitiesData from './data/activities.json'
import { html } from 'hono/html'
import { pullToRefreshJS } from './lib/pullToRefresh'
import { firebaseConfigJS } from './lib/firebaseConfig'
import { emulatorConnectJS } from './lib/devEmulators'
import { Head } from './components/Head'
import { ScrollProgress } from './components/ScrollProgress'
import { Preloader } from './components/Preloader'
import { BackToTop } from './components/BackToTop'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

// NEW HOMEPAGE FLOW COMPONENTS
import { HeroSectionV2 } from './components/HeroSectionV2'
import { ProblemSection } from './components/ProblemSection'
import { SolutionSection } from './components/SolutionSection'
import { StoryWorldV2 } from './components/StoryWorldV2'
import { UniqueFeatures } from './components/UniqueFeatures'
import { EcosystemSection } from './components/EcosystemSection'
import { UniversalValues } from './components/UniversalValues'
import { ImpactStatsV2 } from './components/ImpactStatsV2'
import { VisionCallToAction } from './components/VisionCallToAction'
import { AboutIntroPage } from './components/AboutIntroPage'
import { AboutGenesisPage } from './components/AboutGenesisPage'
import { AboutFounderPage } from './components/AboutFounderPage'
import { AboutTeamPage } from './components/AboutTeamPage'
import { AboutSDGPage } from './components/AboutSDGPage'
import { ProductBooksPage } from './components/ProductBooksPage'
import { ProductColoringPage } from './components/ProductColoringPage'
import { ProductAudioPage } from './components/ProductAudioPage'
import { ProductComingSoonPage } from './components/ProductComingSoonPage'
import { ClubPortal } from './components/ClubPortal'
// ADSENSE & LEGAL COMPONENTS
import { PrivacyPage } from './components/PrivacyPage'
import { TermsPage } from './components/TermsPage'
import { ContactPage } from './components/ContactPage'
import { DeleteAccountPage } from './components/DeleteAccountPage'
import { BlogDirectoryPage } from './components/BlogDirectoryPage'
import { BlogArticlePage } from './components/BlogArticlePage'

import { ActivityDashboard } from './components/ActivityDashboard'
import { ActivityPage } from './components/ActivityPage'
import { TeacherDashboard } from './components/TeacherDashboard'
import { SchoolAdminDashboard } from './components/SchoolAdminDashboard'
import { AuthPage } from './components/AuthPage'
import { FamilyDashboard } from './components/FamilyDashboard'
import { SuperAdminDashboard } from './components/SuperAdminDashboard'
import { SchoolWall } from './components/SchoolWall'
import { generateOrgJoinHTML } from './components/OrgJoinPage'
import { generateStudentPinHTML } from './components/StudentPinPage'
import { generateOrgsDashboardHTML } from './components/OrgsDashboard'
import { ParentWall } from './components/ParentWall'
import { NotFoundPage } from './components/NotFoundPage'

export const app = new Hono()
app.use('*', async (c, next) => {
  if (c.req.path.endsWith('.html') && c.req.path !== '/index.html') {
    return c.redirect(c.req.path.replace('.html', ''))
  }
  if (c.req.path === '/index.html') return c.redirect('/')
  await next()
})

import { AboutNCEPage } from './components/AboutNCEPage'

// Main homepage
app.get('/', (c) => {
  return c.html(generateHTML())
})

// About Dropdown Routes
app.get('/about/intro', (c) => c.html(html`${AboutIntroPage()}`))
app.get('/about/genesis', (c) => c.html(html`${AboutGenesisPage()}`))
app.get('/about/founder', (c) => c.html(html`${AboutFounderPage()}`))
app.get('/about/team', (c) => c.html(html`${AboutTeamPage()}`))
app.get('/about/sdg', (c) => c.html(html`${AboutSDGPage()}`))
app.get('/about/nce', (c) => c.html(html`${AboutNCEPage()}`))

// Keep legacy /about redirecting to intro
app.get('/about', (c) => c.redirect('/about/intro'))

// Main Products Route
app.get('/products/books', (c) => c.html(html`${ProductBooksPage()}`))
app.get('/products/coloring', (c) => c.html(html`${ProductColoringPage()}`))
app.get('/products/audio', (c) => c.html(html`${ProductAudioPage()}`))
app.get('/products/puppet', (c) => c.html(html`${ProductComingSoonPage('Puppet Show')}`))
app.get('/products/games', (c) => c.html(html`${ProductComingSoonPage('Game Portal')}`))
app.get('/club', (c) => c.html(generateClubPortalHTML()))

app.get('/products', (c) => c.redirect('/products/books'))

// Legal Pages
app.get('/privacy', (c) => c.html(PrivacyPage()))
app.get('/terms', (c) => c.html(TermsPage()))
app.get('/contact', (c) => c.html(ContactPage()))
app.get('/delete-account', (c) => c.html(DeleteAccountPage()))

// Blog Directory
app.get('/blog', (c) => c.html(BlogDirectoryPage()))

// Media Dropdown Routes
app.get('/media/videos', (c) => c.html(html`${ProductComingSoonPage('Videos', '/blog', 'Read Our Blogs')}`))
app.get('/media/news', (c) => c.html(html`${ProductComingSoonPage('News', '/blog', 'Read Our Blogs')}`))
app.get('/media', (c) => c.redirect('/blog'))

// Blog Articles
app.get('/blog-article-1', (c) => c.html(BlogArticlePage({
  title: "5 Ways to Inculcate Sunnah in Daily Life",
  category: "PARENTING",
  author: "Editorial Team",
  date: "April 5, 2026",
  content: "<h2>1. Eating with the Right Hand</h2><p>One of the simplest ways... We teach children to emulate the Prophets...</p><p>By integrating these small habits into daily routines, kids naturally absorb the Sunnah as part of their lifestyle rather than as a strict subject to memorize.</p>"
})))

app.get('/blog-article-2', (c) => c.html(BlogArticlePage({
  title: "The Power of Storytelling in Islamic Education",
  category: "ISLAMIC STORIES",
  author: "Editorial Team",
  date: "April 2, 2026",
  content: "<h2>Stories Resonate with the Heart</h2><p>The Quran itself uses stories (Qisas) as a primary method of teaching. For children, a narrative about a Prophet showing patience under trial is far more effective than a dry lecture on patience.</p><p>Explore our library of stories where Imaan and Akhlaq face everyday challenges and seek guidance from historical events.</p>"
})))

app.get('/blog-article-3', (c) => c.html(BlogArticlePage({
  title: "Teaching Sabr (Patience) in a Digital World",
  category: "CHARACTER BUILDING",
  author: "Editorial Team",
  date: "March 28, 2026",
  content: "<h2>The Age of Instant Gratification</h2><p>With smartphones and instant videos, Sabr is becoming a rare trait. How do we teach our kids to wait, persist, and remain calm?</p><ul><li>Limit screen time and enforce 'waiting periods'</li><li>Teach the story of Prophet Ayyub (AS)</li><li>Model patience yourself during stressful moments</li></ul><p>Our upcoming modules specifically focus on gamified mechanisms where patience is rewarded higher than impulsive actions.</p>"
})))

app.get('/student-activities', (c) => {
  return c.html(generateDashboardHTML())
})

app.get('/activity', (c) => {
  return c.html(generateActivityPageHTML())
})

// /parent-dashboard is gone and stays gone. What replaces it is /family: a
// school-provisioned account with one card per child. The difference is not
// cosmetic — the old parent dashboard sat in the middle of the workflow and
// had to sign off every chapter. This one is read-only, and work still goes
// from the student straight to the teacher.
app.get('/family', (c) => {
  return c.html(generateFamilyDashboardHTML())
})

// The school wall. Web only — the page itself redirects out of the APK,
// because the SSG build renders every route into dist/ and Capacitor copies
// dist/ wholesale, so the file ships in the app whatever links to it.
app.get('/school-wall', (c) => {
  return c.html(generateSchoolWallHTML())
})

// A parent opens their child's wall with a link, no account: /wall/p#TOKEN.
//
// The token is a URL FRAGMENT, and that is load-bearing twice over. A fragment
// is never sent to the server, so it cannot land in an access log or a Referer
// header — and this site is a static SSG build, where a path segment like
// /wall/p/:token has no file to be served from at all.
//
// The page reads nothing from Firestore; readParentWall on the Admin SDK is
// the only door. See SCHOOL_GROUP_PLAN.md §7.
app.get('/wall/p', (c) => {
  return c.html(generateParentWallHTML())
})

// Organisation portals. See ORG_PORTAL_PLAN.md.
//
// All three take their secret from the URL FRAGMENT and their names from the
// QUERY, and both halves of that are load-bearing. The fragment never reaches
// a server, so a token cannot land in an access log or a Referer header. The
// query is what lets ONE file answer for every organisation: this is a static
// SSG build with no rewrite rules, so /join/alkhidmat would need a file that
// a build running before the organisation existed could not have written.
app.get('/join', (c) => {
  return c.html(generateOrgJoinHTML())
})

app.get('/s', (c) => {
  return c.html(generateStudentPinHTML())
})

app.get('/orgs', (c) => {
  return c.html(generateOrgsDashboardHTML())
})

app.get('/teacher-dashboard', (c) => {
  return c.html(generateTeacherDashboardHTML())
})

// ---------------------------------------------------------------------------
// What belongs in public/
//
// Two things write into dist/: Vite copies public/ verbatim, and the SSG
// plugin renders every route below. When both produce the same filename the
// SSG output wins — but only because the copy happens first, which nothing
// enforces. So a page kept in public/ that ALSO has a route here is dead
// weight: editing it changes nothing, and it drifts out of sync until someone
// reads it and believes it.
//
// That is not hypothetical. public/super-admin-dashboard.html sat here long
// enough to lose its super_admin role check, and a later review read that copy
// and reported a security hole the live page did not have.
//
// So public/*.html is only for: pages with no route at all (viewer.html,
// pdfviewer2.html), or pages a route reads explicitly, like the two below.
// Everything else lives in src/components and is rendered, never copied.
// ---------------------------------------------------------------------------

// The school admin dashboard is maintained as a standalone page in
// public/admin-dashboard.html (roster import, bulk delete, mobile layout).
// The SSG build writes this route to dist/admin-dashboard.html, so rendering
// the older <SchoolAdminDashboard/> component here would overwrite the copied
// static file and silently ship a stale dashboard. Serve the real file.
app.get('/admin-dashboard', async (c) => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const filePath = path.default.join(process.cwd(), 'public', 'admin-dashboard.html')
  let source: string
  try {
    source = fs.default.readFileSync(filePath, 'utf-8')
  } catch (e) {
    return c.html(generateSchoolAdminDashboardHTML())
  }

  // That file is plain static HTML, so Vite never substitutes import.meta.env
  // into it and its Firebase block was a hardcoded literal — the one page whose
  // key the .env / GitHub Secrets could not reach. Swap the block for the
  // env-built one so the config lives in exactly one place, like it does in
  // every SSG-rendered page.
  const CONFIG_BLOCK = /const firebaseConfig = \{[\s\S]*?\};/
  if (!CONFIG_BLOCK.test(source)) {
    // Fail the build rather than quietly shipping a config .env can't change.
    throw new Error(
      'admin-dashboard.html: firebaseConfig block not found. If it was renamed ' +
      'or reformatted, update this route to match.'
    )
  }
  source = source.replace(CONFIG_BLOCK, 'const firebaseConfig = ' + firebaseConfigJS + ';')

  // Same reasoning for pull to refresh. This page carried its own copy, which
  // drifted from every other dashboard's — a different threshold and none of
  // the rules that tell a pull apart from a scroll. One implementation now,
  // substituted here.
  const PTR_MARKER = /\/\* IA_PULL_TO_REFRESH[\s\S]*?\*\//
  if (!PTR_MARKER.test(source)) {
    throw new Error(
      'admin-dashboard.html: the IA_PULL_TO_REFRESH marker is gone. Put it back, ' +
      'or this page silently ships without pull to refresh.'
    )
  }
  source = source.replace(PTR_MARKER, pullToRefreshJS)

  // Same substitution for the local emulator connector. The marker is a
  // comment in the static file, so a production build simply leaves the
  // already-dead USE_EMULATORS block in place.
  const EMU_MARKER = /\/\* IA_DEV_EMULATORS[\s\S]*?\*\//
  if (EMU_MARKER.test(source)) {
    source = source.replace(
      EMU_MARKER,
      emulatorConnectJS +
        '\n  connectEmulators({ auth, db, functions, storage,' +
        '\n    connectAuthEmulator, connectFirestoreEmulator,' +
        '\n    connectFunctionsEmulator, connectStorageEmulator });'
    )
  }

  return c.html(source)
})

app.get('/super-admin-dashboard', (c) => {
  return c.html(generateSuperAdminDashboardHTML())
})

app.get('/teacher-reader', async (c) => {
  // Serve static HTML from public/teacher-reader.html
  const fs = await import('node:fs')
  const path = await import('node:path')
  const filePath = path.default.join(process.cwd(), 'public', 'teacher-reader.html')
  try {
    const content = fs.default.readFileSync(filePath, 'utf-8')
    return c.html(content)
  } catch (e) {
    return c.text('teacher-reader.html not found', 404)
  }
})

app.get('/auth', (c) => {
  return c.html(generateAuthPageHTML())
})

app.get('/api-activities', (c) => {
  return c.json(activitiesData)
})

function generateDashboardHTML() {
  return html`${Head()}
${ActivityDashboard()}`
}

function generateTeacherDashboardHTML() {
  return html`${Head()}
${TeacherDashboard()}`
}

function generateFamilyDashboardHTML() {
  return html`${Head()}
${FamilyDashboard()}`
}

function generateAuthPageHTML() {
  return html`${Head()}
${AuthPage()}`
}

function generateSchoolAdminDashboardHTML() {
  return html`${Head()}
${SchoolAdminDashboard()}`
}

function generateSuperAdminDashboardHTML() {
  return html`${Head()}
${SuperAdminDashboard()}`
}

function generateParentWallHTML() {
  return html`${Head()}
${ParentWall()}`
}

function generateSchoolWallHTML() {
  return html`${Head()}
${SchoolWall()}`
}

function generateClubPortalHTML() {
  return html`${Head()}
${ClubPortal()}`
}

function generateActivityPageHTML() {
  return html`${Head()}
${ActivityPage()}`
}


function generateHTML() {
  return html`${Head()}
${ScrollProgress()}
${Preloader()}
${BackToTop()}
${Header()}
${HeroSectionV2()}
${ProblemSection()}
${SolutionSection()}
${StoryWorldV2()}
${UniqueFeatures()}
${EcosystemSection()}
${UniversalValues()}
${ImpactStatsV2()}
${VisionCallToAction()}
${Footer()}
<!-- Imaan & Akhlaq pointing at their hero cards: plain JS, no GSAP needed.
     Remove this line to drop it. -->
<script src="/kidba_assets/js/hero-pointers.js"></script>
`
}

// 404 Catch-All — must be the LAST route
app.notFound((c) => {
  return c.html(NotFoundPage(), 404)
})

export default app
