import { html } from 'hono/html';
export const Creator = () => html`\n<!-- ===== CREATOR / AUTHOR ===== -->\n
  <section class="creator-section section-padding" id="creator">
    <div class="container">
      <div class="row align-items-center g-5">
        <div class="col-lg-5 text-center">
          <div class="creator-visual" data-aos="fade-right">
            <div class="creator-frame">
              <div class="creator-img-art">
                <div class="cr-bg-circle"></div>
                <div class="cr-emoji">✍️</div>
                <div class="cr-sparkles">
                  <span>⭐</span><span>✨</span><span>🌟</span>
                </div>
              </div>
            </div>
            <div class="creator-badge-wrap">
              <div class="creator-org-badge">
                <i class="fas fa-star"></i> Ilm O Amal Initiative
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="creator-content" data-aos="fade-left">
            <div class="section-tag">Meet The Creator</div>
            <h2 class="section-title">The Visionary Behind <span class="text-green">Imaan & Akhlaq's</span> Magical Adventures</h2>
            <p class="section-desc">
              Imaan & Akhlaq was born from a simple but powerful belief: <em>that Islamic values can be 
              taught most effectively through joy, story, and imagination</em>. The creator, under the 
              <strong>Ilm O Amal</strong> initiative, developed these characters after recognizing a 
              critical gap — children were disconnecting from Islamic education because it felt distant 
              from their world.
            </p>
            <p class="section-desc">
              By creating relatable, lovable characters who face real childhood challenges while applying 
              Islamic principles, Imaan & Akhlaq bridges the gap between faith and everyday life — making 
              Islam not just something children learn about, but something they want to live.
            </p>
            <div class="creator-highlights">
              <div class="ch-item">
                <i class="fas fa-certificate"></i>
                <span>Endorsed by Islamic scholars & educators</span>
              </div>
              <div class="ch-item">
                <i class="fas fa-handshake"></i>
                <span>MoU signed with SEERAHT Initiative</span>
              </div>
              <div class="ch-item">
                <i class="fas fa-tv"></i>
                <span>Featured on Pakistan TV and media</span>
              </div>
              <div class="ch-item">
                <i class="fas fa-users"></i>
                <span>Community-driven, purpose-first approach</span>
              </div>
            </div>
            <a href="#contact" class="btn btn-primary-custom mt-4">
              Collaborate With Us <i class="fas fa-arrow-right ms-2"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  \n`;
