import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'

export const ProductComingSoonPage = (title: string) => html`
${Head()}
${Header()}

<style>
  .cs-page { font-family: 'Inter', sans-serif; background: #F8FAFC; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 20px; text-align: center; }
  .cs-icon { font-size: 5rem; color: #E08020; margin-bottom: 30px; animation: bounce 2s infinite; }
  .cs-title { font-family: 'Fredoka One', cursive; font-size: 3rem; color: #1E2D5A; margin-bottom: 20px; }
  .cs-text { font-size: 1.25rem; color: #64748b; max-width: 600px; line-height: 1.8; margin-bottom: 40px; }
  @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } 60% { transform: translateY(-15px); } }
</style>

<div class="cs-page">
  <div class="cs-icon"><i class="fas fa-tools"></i></div>
  <h1 class="cs-title">${title} is Coming Soon!</h1>
  <p class="cs-text">We are pouring our creativity and passion into building the ultimate interactive experience for you. Please check back soon as we finalize the magical details behind the scenes.</p>
  <a href="/products/books" class="btn btn-lg" style="background:#1E2D5A; color:white; padding: 12px 30px; border-radius: 30px; font-weight:700;"><i class="fas fa-arrow-left"></i> Explore Curriculum Books</a>
</div>

${Footer()}
`
