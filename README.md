# Imaan & Akhlaq – Islamic Education Website

## Project Overview
- **Name**: Imaan & Akhlaq (imaanakhlaq.org)
- **Organization**: Ilm O Amal Initiative
- **Goal**: Modern, Kidba-template-inspired Islamic educational website for children aged 5–12
- **Design**: Pixel-perfect clone of Kidba Kindergarten HTML template, populated with Imaan & Akhlaq content
- **Tech Stack**: Hono + TypeScript + Bootstrap 5 + Swiper.js + AOS + Cloudflare Pages

## 🌐 URLs
- **Live Sandbox**: https://3000-iugoug93vz00vbxjp8k7w-b32ec7bb.sandbox.novita.ai
- **Source Content**: https://www.imaanakhlaq.org
- **Reference Template**: Kidba Kindergarten HTML Template (ThemeForest)
- **Cloudflare Project**: `imaan-akhlaq`

## ✅ Completed Features

### All Sections Built:
1. **Header / Navbar** — Sticky top bar with social links + logo + animated nav links + CTA button
2. **Hero Slider (3 Slides)** — Full-screen Swiper hero with:
   - Slide 1: Character animation (Imaan & Akhlaq CSS characters), stats bar, decorative shapes
   - Slide 2: Puppet show stage visual with curtain animation
   - Slide 3: Multilingual showcase with language badges
3. **Features Strip** — 4 colorful icon cards (story-based, Islamic values, 3 languages, puppet shows)
4. **About Section** — Image collage with floating card, 4 feature highlights, experience badge
5. **Why Choose Us** — 6 gradient icon cards with hover animations
6. **Programs / Courses** — 6 program cards (featured highlighted) with full details
7. **Stories Section** — Swiper carousel with 6 story cards (cover art, ratings, language tags)
8. **Characters / Team** — 4 character cards (Imaan, Akhlaq, Parents, Grandma) with flip animations
9. **Events Section** — 3 upcoming event cards with date badges and registration buttons
10. **Testimonials** — Swiper carousel with 5 parent/teacher quotes and star ratings
11. **Gallery** — CSS grid with filter buttons (All / Puppet Shows / Workshops / Events) + lightbox
12. **Stats Counter** — Animated counter (50+ stories, 120+ schools, 5000+ children, 3 languages)
13. **Creator / Author** — About the creator section with Ilm O Amal badge
14. **Contact Section** — Info panel + full form with subject dropdown + social links
15. **Google Maps** — Embedded map for Barakahu, Islamabad
16. **Footer** — 4-column with newsletter, social links, quick nav, copyright

### Interactive Features:
- Preloader with spinner animation
- Sticky navbar with scroll effect + active link tracking
- Smooth scrolling between sections
- Back-to-top button
- Scroll progress bar (green)
- Counter animation on scroll (IntersectionObserver)
- Gallery filter with fade/scale transitions
- Gallery lightbox on item click
- Contact form with animated submit button + toast notifications
- Newsletter signup with validation
- Mouse parallax on floating elements
- Cursor sparkle effect (fun for kids ⭐)
- Mobile hamburger icon animation
- AOS (Animate On Scroll) for all cards

## 🎨 Design System
- **Colors**: Green (#4CAF50), Orange (#FF9800), Yellow (#FFD93D), Purple (#9C27B0), Blue (#2196F3)
- **Typography**: Poppins (headings/UI) + Nunito (body text)
- **Shapes**: Decorative blob shapes, floating elements, gradient backgrounds
- **Cards**: Rounded (20px radius), soft shadows, hover lift effects
- **Buttons**: Gradient pills with hover lift + glow

## 📁 File Structure
```
webapp/
├── src/
│   └── index.tsx          # Main Hono app (full HTML served as string)
├── public/
│   └── static/
│       ├── css/
│       │   └── style.css  # Full Kidba-inspired stylesheet (50KB+)
│       ├── js/
│       │   └── main.js    # All interactivity (17KB+)
│       └── images/        # (Image directory ready)
├── dist/                  # Built output
├── ecosystem.config.cjs   # PM2 config
├── wrangler.jsonc         # Cloudflare Pages config
├── vite.config.ts         # Vite build config
└── package.json
```

## 🚀 Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Built & Running Locally
- **Cloudflare Project**: `imaan-akhlaq`
- **Deploy Command**: `npm run deploy:prod`

## 🧑‍💻 Local Development
```bash
npm run build          # Build for Cloudflare Pages
pm2 start ecosystem.config.cjs  # Start with PM2
curl http://localhost:3000       # Test
pm2 logs --nostream              # Check logs
```

## 📚 Content Sources
- **Website**: https://www.imaanakhlaq.org
- **Social**: @imaanakhlaq (Instagram, Facebook, Twitter, YouTube)
- **Organization**: Ilm O Amal
- **Contact**: info@imaanakhlaq.org | Barakahu Campus, Islamabad

## 🌙 Islamic Educational Theme
All content maintains the Islamic educational theme:
- Islamic values: Imaan (faith), Akhlaq (good character/manners)
- Prophet stories, Quranic themes
- Multilingual: English, Urdu (اردو), Arabic (عربی)
- Tarbiyah-based learning approach
- Educator and scholar approved content messaging
