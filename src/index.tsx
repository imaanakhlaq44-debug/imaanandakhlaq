import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Vite and Cloudflare Pages automatically serve static files from /public and /dist

// Main homepage
app.get('/', (c) => {
  return c.html(generateHTML())
})

app.get('/student/activities', (c) => {
  return c.html(generateDashboardHTML())
})

app.get('/activity/:book/:chapter', (c) => {
  const book = c.req.param('book')
  const chapter = c.req.param('chapter')
  return c.html(generateActivityPageHTML(book, chapter))
})

app.get('/parent/dashboard', (c) => {
  return c.html(generateParentDashboardHTML())
})

app.get('/teacher/dashboard', (c) => {
  return c.html(generateTeacherDashboardHTML())
})

app.get('/admin/dashboard', (c) => {
  return c.html(generateSchoolAdminDashboardHTML())
})

app.get('/auth', (c) => {
  return c.html(generateAuthPageHTML())
})

// Components
import { html } from 'hono/html'
import { Head } from './components/Head'
import { ScrollProgress } from './components/ScrollProgress'
import { Preloader } from './components/Preloader'
import { BackToTop } from './components/BackToTop'
import { Header } from './components/Header'
import { HeroSlider } from './components/HeroSlider'
import { FeaturesStrip } from './components/FeaturesStrip'
import { AboutSection } from './components/AboutSection'
import { WelcomeSection } from './components/Features'
import { Programs } from './components/Programs'
import { StoriesSection } from './components/StoriesSection'
import { Characters } from './components/Characters'
import { Events } from './components/Events'
import { Testimonials } from './components/Testimonials'
import { Gallery } from './components/Gallery'
import { StatsCounter } from './components/StatsCounter'
import { Creator } from './components/Creator'
import { Contact } from './components/Contact'
import { Map } from './components/Map'
import { Footer } from './components/Footer'
import { ActivityDashboard } from './components/ActivityDashboard'
import { ActivityPage } from './components/ActivityPage'
import { ParentDashboard } from './components/ParentDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'
import { SchoolAdminDashboard } from './components/SchoolAdminDashboard'
import { AuthPage } from './components/AuthPage'

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

function generateActivityPageHTML(book: string, chapter: string) {
  return html`${Head()}
${ActivityPage(book, chapter)}`
}

function generateHTML() {
  return html`${Head()}
${ScrollProgress()}
${Preloader()}
${BackToTop()}
${Header()}
${HeroSlider()}
${WelcomeSection()}
${AboutSection()}
${Programs()}
${StoriesSection()}
${StatsCounter()}
${Characters()}
${Footer()}
`
}

export default app
