import { Hono } from 'hono'
import activitiesData from './data/activities.json'
import { html } from 'hono/html'
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
import { BlogDirectoryPage } from './components/BlogDirectoryPage'
import { BlogArticlePage } from './components/BlogArticlePage'

import { ActivityDashboard } from './components/ActivityDashboard'
import { ActivityPage } from './components/ActivityPage'
import { ParentDashboard } from './components/ParentDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { SchoolAdminDashboard } from './components/SchoolAdminDashboard'
import { AuthPage } from './components/AuthPage'
import { DemoSwitcher } from './components/DemoSwitcher'

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
app.get('/club', (c) => c.html(html`${ClubPortal()}`))

app.get('/products', (c) => c.redirect('/products/books'))

// Legal Pages
app.get('/privacy', (c) => c.html(PrivacyPage()))
app.get('/terms', (c) => c.html(TermsPage()))
app.get('/contact', (c) => c.html(ContactPage()))

// Blog Directory
app.get('/blog', (c) => c.html(BlogDirectoryPage()))

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

app.get('/parent-dashboard', (c) => {
  return c.html(generateParentDashboardHTML())
})

app.get('/teacher-dashboard', (c) => {
  return c.html(generateTeacherDashboardHTML())
})

app.get('/admin-dashboard', (c) => {
  return c.html(generateSchoolAdminDashboardHTML())
})

app.get('/auth', (c) => {
  return c.html(generateAuthPageHTML())
})

app.get('/club', (c) => {
  return c.html(generateClubPortalHTML())
})

app.get('/api-activities', (c) => {
  return c.json(activitiesData)
})

function generateDashboardHTML() {
  return html`${Head()}
${ActivityDashboard()}`
}

function generateParentDashboardHTML() {
  return html`${Head()}
${ParentDashboard()}`
}

function generateTeacherDashboardHTML() {
  return html`${Head()}
${TeacherDashboard()}`
}

function generateAuthPageHTML() {
  return html`${Head()}
${AuthPage()}`
}

function generateSchoolAdminDashboardHTML() {
  return html`${Head()}
${SchoolAdminDashboard()}`
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
`
}

export default app
