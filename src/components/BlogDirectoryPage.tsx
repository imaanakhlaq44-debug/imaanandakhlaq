import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export const BlogDirectoryPage = () => html`
${Head()}
${Header()}

<main class="blog-page-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row mb-5 text-center">
      <div class="col-12" data-aos="fade-up">
        <span class="badge bg-primary px-3 py-2 rounded-pill mb-3">Our Articles</span>
        <h1 class="display-4 fw-bold kidba-title text-primary">Imaan & Akhlaq Blog</h1>
        <p class="lead text-muted">Insights on Islamic parenting, child psychology, and character building.</p>
      </div>
    </div>

    <div class="row g-4">
      <!-- Article 1 -->
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
        <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden blog-card">
          <div class="bg-primary text-white d-flex align-items-center justify-content-center" style="height: 200px; font-size: 3rem;">
            <i class="fas fa-child"></i>
          </div>
          <div class="card-body p-4 d-flex flex-column">
            <span class="text-primary fw-bold small mb-2">PARENTING</span>
            <h4 class="fw-bold mb-3">5 Ways to Inculcate Sunnah in Daily Life</h4>
            <p class="text-muted mb-4 flex-grow-1">Discover practical and fun methods to teach your children the Sunnah of Prophet Muhammad (SAW) through everyday activities, keeping them engaged and spiritually connected.</p>
            <a href="/blog-article-1" class="btn btn-outline-primary rounded-pill align-self-start stretched-link">Read Full Article</a>
          </div>
        </div>
      </div>

      <!-- Article 2 -->
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
        <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden blog-card">
          <div class="bg-success text-white d-flex align-items-center justify-content-center" style="height: 200px; font-size: 3rem;">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="card-body p-4 d-flex flex-column">
            <span class="text-success fw-bold small mb-2">ISLAMIC STORIES</span>
            <h4 class="fw-bold mb-3">The Power of Storytelling in Islamic Education</h4>
            <p class="text-muted mb-4 flex-grow-1">Why stories are the best mechanism for teaching moral values (Akhlaq) to kids. Learn how the Quran uses narrative to shape human psychology and character.</p>
            <a href="/blog-article-2" class="btn btn-outline-success rounded-pill align-self-start stretched-link">Read Full Article</a>
          </div>
        </div>
      </div>

      <!-- Article 3 -->
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
        <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden blog-card">
          <div class="bg-warning text-dark d-flex align-items-center justify-content-center" style="height: 200px; font-size: 3rem;">
            <i class="fas fa-star-and-crescent"></i>
          </div>
          <div class="card-body p-4 d-flex flex-column">
            <span class="text-warning fw-bold small mb-2">CHARACTER BUILDING</span>
            <h4 class="fw-bold mb-3">Teaching Sabr (Patience) in a Digital World</h4>
            <p class="text-muted mb-4 flex-grow-1">In an era of instant gratification, teaching children patience is harder than ever. Explore our structured approach to introducing Sabr through gamified learning.</p>
            <a href="/blog-article-3" class="btn btn-outline-warning rounded-pill align-self-start stretched-link">Read Full Article</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Newsletter Subscription (Great for AdSense trust) -->
    <div class="row justify-content-center mt-5 pt-5" data-aos="fade-up">
      <div class="col-lg-8">
        <div class="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-primary text-white text-center">
          <h3 class="fw-bold mb-3">Subscribe to Our Newsletter</h3>
          <p class="mb-4">Get the latest parenting tips, new story updates, and educational resources delivered to your inbox.</p>
          <form class="d-flex flex-column flex-md-row gap-2 justify-content-center" onsubmit="event.preventDefault(); alert('Subscribed successfully!');">
            <input type="email" class="form-control form-control-lg rounded-pill border-0" placeholder="Your Email Address" required style="max-width: 400px;">
            <button type="submit" class="btn btn-warning btn-lg rounded-pill px-4 fw-bold text-dark">Subscribe</button>
          </form>
        </div>
      </div>
    </div>

  </div>
</main>

<style>
  .blog-page-container {
    background-color: #f8f9fa;
    min-height: 80vh;
  }
  .blog-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .blog-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
  }
  .text-warning {
    color: #ffc107 !important;
  }
</style>

${Footer()}
${BackToTop()}
`
