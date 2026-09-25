import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

// The products / services catalogue.
//
// This page exists for two audiences at once. A parent or school lands here to
// see what we actually sell and what it costs, and a payment gateway's
// onboarding review lands here to confirm this is a real business with a real
// price list before it will enable card / Raast collection. That second reader
// is why every item carries a printed price, a delivery line and a policy
// link: a catalogue that says "contact us for pricing" reads as unverifiable.
//
// /products used to 302 to /products/books. It no longer does — the redirect
// left the site with no single page listing everything on offer.

type Item = {
  name: string
  category: string
  price: string
  unit: string
  delivery: string
  desc: string
  icon: string
  color: string
  href: string
  cta: string
}

const ITEMS: Item[] = [
  {
    name: 'Curriculum Storybook Series',
    category: 'Printed Books',
    price: 'Rs. 3,500',
    unit: 'complete set of 7 books',
    delivery: 'Courier, 3-7 working days',
    desc: 'The full seven-book journey — from The Whispering of Shadows to Beyond the Mountains — illustrated for ages 5-12 and mapped to the character-building curriculum.',
    icon: 'fa-book',
    color: '#E08020',
    href: '/products/books',
    cta: 'View the series'
  },
  {
    name: 'Single Curriculum Storybook',
    category: 'Printed Books',
    price: 'Rs. 550',
    unit: 'per book',
    delivery: 'Courier, 3-7 working days',
    desc: 'Any one title from the series, for families and schools who want to start with a single story before committing to the full set.',
    icon: 'fa-bookmark',
    color: '#D97706',
    href: '/products/books',
    cta: 'Choose a title'
  },
  {
    name: 'Coloring & Activity Books',
    category: 'Printed Books',
    price: 'Rs. 350',
    unit: 'per book',
    delivery: 'Courier, 3-7 working days',
    desc: 'Companion coloring books with character worksheets, tracing pages and reflection prompts that follow the storybook themes.',
    icon: 'fa-paint-brush',
    color: '#D63678',
    href: '/products/coloring',
    cta: 'View coloring books'
  },
  {
    name: 'Character-Building Activity Kit',
    category: 'Printed Books',
    price: 'Rs. 1,800',
    unit: 'per kit',
    delivery: 'Courier, 3-7 working days',
    desc: 'A boxed classroom kit: flashcards, house-point charts, value badges and a facilitator booklet for running weekly character sessions.',
    icon: 'fa-box-open',
    color: '#0EA5E9',
    href: '/contact',
    cta: 'Enquire about kits'
  },
  {
    name: 'Audio Story Portal',
    category: 'Digital Subscription',
    price: 'Rs. 1,200',
    unit: 'per child / year',
    delivery: 'Instant access after payment',
    desc: 'Narrated audio versions of the whole story world, streamable in the browser and in the Android app, with new episodes added through the year.',
    icon: 'fa-headphones',
    color: '#F59E0B',
    href: '/products/audio',
    cta: 'Open the portal'
  },
  {
    name: 'Games Portal Access',
    category: 'Digital Subscription',
    price: 'Rs. 900',
    unit: 'per child / year',
    delivery: 'Instant access after payment',
    desc: 'Value-based quizzes and games where patience, honesty and gratitude score higher than speed — progress feeds the same house-point system as the books.',
    icon: 'fa-gamepad',
    color: '#A855F7',
    href: '/products/games',
    cta: 'See the games'
  },
  {
    name: 'Imaan & Akhlaq Club Membership',
    category: 'Programs',
    price: 'Rs. 1,500',
    unit: 'per student / year',
    delivery: 'Account activated within 24 hours',
    desc: 'Club membership: a student login, the reading tracker, house competitions, certificates and the parent progress wall.',
    icon: 'fa-crown',
    color: '#1A936F',
    href: '/club',
    cta: 'Join the club'
  },
  {
    name: 'School Program Licence',
    category: 'Programs',
    price: 'Rs. 800',
    unit: 'per student / year (min. 50 students)',
    delivery: 'Onboarded within 3 working days',
    desc: 'The full school deployment: roster import, teacher dashboards, class-wise reporting, parent walls and the school activity wall.',
    icon: 'fa-school',
    color: '#1E2D5A',
    href: '/contact',
    cta: 'Request a quote'
  },
  {
    name: 'Teacher Training Workshop',
    category: 'Programs',
    price: 'Rs. 2,500',
    unit: 'per teacher',
    delivery: 'Scheduled on a confirmed date',
    desc: 'A half-day workshop, on-site or online, on running the curriculum: story facilitation, classroom activities and using the teacher dashboard.',
    icon: 'fa-chalkboard-teacher',
    color: '#0F766E',
    href: '/contact',
    cta: 'Book a workshop'
  },
  {
    name: 'Puppet Show Booking',
    category: 'Programs',
    price: 'Rs. 25,000',
    unit: 'per show / event',
    delivery: 'Performed on the booked date',
    desc: 'A live puppet performance of the Imaan & Akhlaq stories at your school or event, including puppeteers, script, sound and props.',
    icon: 'fa-theater-masks',
    color: '#6382EB',
    href: '/products/puppet',
    cta: 'Enquire about shows'
  }
]

const card = (it: Item) => html`
  <div class="col-md-6 col-lg-4" data-aos="fade-up">
    <div class="pc-card h-100" style="--pc-color: ${it.color};">
      <div class="pc-top">
        <span class="pc-icon"><i class="fas ${it.icon}"></i></span>
        <span class="pc-cat">${it.category}</span>
      </div>
      <h3 class="pc-name">${it.name}</h3>
      <p class="pc-desc">${it.desc}</p>
      <div class="pc-price">
        <span class="pc-amount">${it.price}</span>
        <span class="pc-unit">${it.unit}</span>
      </div>
      <p class="pc-delivery"><i class="fas fa-truck-fast"></i> ${it.delivery}</p>
      <a href="${it.href}" class="pc-btn">${it.cta} <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>
`

export const ProductsIndexPage = () => html`
${Head()}
${Header()}

<style>
  .catalogue-page { background: #F8FAFC; color: #334155; font-family: 'Inter', sans-serif; }
  .catalogue-hero { padding: 170px 20px 90px; background: linear-gradient(135deg, #1E2D5A 0%, #D63678 100%); color: #fff; text-align: center; }
  .catalogue-hero h1 { font-family: 'Fredoka One', cursive; font-size: clamp(2.2rem, 5vw, 3.8rem); margin-bottom: 18px; }
  .catalogue-hero p { font-size: 1.15rem; opacity: 0.95; max-width: 760px; margin: 0 auto; line-height: 1.8; }
  .catalogue-body { padding: 70px 0 90px; }

  .pc-card { background: #fff; border-radius: 18px; padding: 28px; border: 1px solid #E2E8F0; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05); display: flex; flex-direction: column; transition: transform .3s ease, box-shadow .3s ease; }
  .pc-card:hover { transform: translateY(-6px); box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12); }
  .pc-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .pc-icon { width: 46px; height: 46px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: var(--pc-color); color: #fff; font-size: 1.15rem; flex: 0 0 auto; }
  .pc-cat { font-size: .72rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--pc-color); }
  .pc-name { font-family: 'Fredoka One', cursive; font-size: 1.3rem; color: #1E2D5A; margin-bottom: 12px; line-height: 1.4; }
  .pc-desc { font-size: .98rem; color: #475569; line-height: 1.7; flex: 1 1 auto; }
  .pc-price { margin: 18px 0 8px; padding-top: 16px; border-top: 1px dashed #E2E8F0; }
  .pc-amount { display: block; font-family: 'Fredoka One', cursive; font-size: 1.7rem; color: var(--pc-color); line-height: 1.2; }
  .pc-unit { display: block; font-size: .85rem; color: #64748B; }
  .pc-delivery { font-size: .85rem; color: #0F766E; margin: 10px 0 18px; }
  .pc-delivery i { margin-right: 6px; }
  .pc-btn { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; padding: 10px 20px; border-radius: 999px; background: var(--pc-color); color: #fff !important; font-weight: 700; font-size: .9rem; text-decoration: none; transition: filter .25s ease; }
  .pc-btn:hover { filter: brightness(1.1); }

  .pay-note { background: #fff; border: 1px solid #E2E8F0; border-radius: 18px; padding: 30px; margin-top: 50px; }
  .pay-note h4 { font-family: 'Fredoka One', cursive; color: #1E2D5A; margin-bottom: 14px; }
  .pay-note p, .pay-note li { color: #475569; line-height: 1.8; }
  .pay-note a { color: #D63678; font-weight: 600; }
</style>

<div class="catalogue-page">
  <div class="catalogue-hero">
    <div data-aos="fade-up">
      <h1>Products &amp; Services</h1>
      <p>Everything Imaan &amp; Akhlaq offers, with prices in Pakistani Rupees. Printed books ship by courier across Pakistan; digital subscriptions and school accounts are activated online.</p>
    </div>
  </div>

  <div class="catalogue-body">
    <div class="container">
      <div class="row g-4">
        ${ITEMS.map(card)}
      </div>

      <div class="pay-note" data-aos="fade-up">
        <h4>Ordering, payment &amp; delivery</h4>
        <p>All prices are in <strong>PKR (Pakistani Rupees)</strong> and include applicable taxes unless stated otherwise on your invoice. Bulk and school pricing is confirmed in writing on a quotation before any payment is taken.</p>
        <ul>
          <li><strong>Payment methods:</strong> debit / credit card, Raast, bank account and mobile wallet, processed through our licensed payment gateway. We never see or store your full card number.</li>
          <li><strong>Printed items:</strong> dispatched from our Islamabad office by courier — see our <a href="/shipping">Shipping &amp; Delivery Policy</a>.</li>
          <li><strong>Digital items:</strong> access is granted to the paying account immediately after a successful payment.</li>
          <li><strong>Changed your mind?</strong> Read the <a href="/refund">Return &amp; Refund Policy</a> before ordering.</li>
          <li><strong>Questions:</strong> call <a href="tel:+923390106475">+92 339 0106475</a> or email <a href="mailto:info@imaanakhlaq.org">info@imaanakhlaq.org</a>.</li>
        </ul>
      </div>
    </div>
  </div>
</div>

${Footer()}
${BackToTop()}
`
