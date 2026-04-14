import { html } from 'hono/html'
import { Head } from './Head'
import { Header } from './Header'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export const BlogArticlePage = ({ title, category, author, date, content }: any) => html`
${Head()}
${Header()}

<main class="blog-article-container pt-5 mt-5 pb-5">
  <div class="container py-5 mt-4">
    <div class="row justify-content-center mb-5">
      <div class="col-lg-8" data-aos="fade-up">
        <a href="/blog" class="text-decoration-none text-muted mb-4 d-inline-block"><i class="fas fa-arrow-left me-2"></i> Back to Blog</a>
        <br>
        <span class="badge bg-primary px-3 py-2 rounded-pill mb-3">${category}</span>
        <h1 class="display-4 fw-bold kidba-title text-dark">${title}</h1>
        <div class="d-flex align-items-center mt-4 text-muted">
          <div class="rounded-circle bg-light d-flex justify-content-center align-items-center me-3" style="width: 50px; height: 50px; font-size: 1.5rem;">
            <i class="fas fa-user-edit text-primary"></i>
          </div>
          <div>
            <span class="fw-bold d-block text-dark">${author}</span>
            <small>${date} &bull; 5 min read</small>
          </div>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-8" data-aos="fade-up" data-aos-delay="100">
        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          <div class="article-content">
            ${content}
          </div>
        </div>

        <!-- Author Bio Box -->
        <div class="card border-0 shadow-sm rounded-4 mt-5 p-4 bg-light">
          <div class="d-flex align-items-center">
            <div class="rounded-circle bg-white d-flex justify-content-center align-items-center me-4 shadow-sm" style="width: 80px; height: 80px; font-size: 2rem;">
              <i class="fas fa-heart text-danger"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-1">About the Author</h5>
              <p class="text-muted mb-0">The Imaan & Akhlaq Editorial Team is dedicated to creating enriching, educational, and Islamic content for the next generation of Muslim changemakers.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</main>

<style>
  .blog-article-container {
    background-color: #f8f9fa;
    min-height: 80vh;
  }
  .article-content h2, .article-content h3 {
    color: var(--kidba-blue);
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: bold;
  }
  .article-content p {
    font-size: 1.15rem;
    color: #4a5568;
    line-height: 1.9;
    margin-bottom: 1.5rem;
  }
  .article-content ul, .article-content ol {
    font-size: 1.15rem;
    color: #4a5568;
    line-height: 1.9;
    margin-bottom: 1.5rem;
  }
</style>

${Footer()}
${BackToTop()}
`
