import { html } from 'hono/html';

export const StoriesSection = () => html`
<!-- ===== KIDBA STORIES / CLASSES SECTION ===== -->
<section class="kidba-stories-section" id="stories">
  <div class="container">
    <div class="kstories-header" data-aos="fade-up">
      <h2>Colorful Story Adventures</h2>
      <p>Here is what you can expect from our beautifully illustrated digital stories. Let your kids explore the magical world of Imaan & Akhlaq!</p>
    </div>

    <div class="row g-4 justify-content-center">
      
      <!-- Card 1 -->
      <div class="col-md-6 col-lg-4">
        <div class="kstory-card" data-aos="fade-up" data-aos-delay="100">
          <div class="kstory-img">
            <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80" alt="The Whispering Shadows">
            <span class="kstory-tag" style="background:#32B74A;">Islamic Stories</span>
          </div>
          <div class="kstory-body">
            <h5>The Whispering Shadows</h5>
            <div class="kstory-time"><i class="far fa-clock"></i> Reading Time : 15 - 20 min</div>
            <p>Imaan and Akhlaq discover mysterious shadows in the old library and learn about bravery and trust in Allah.</p>
            <div class="kstory-meta">
              <div class="kstory-meta-item">
                <span class="meta-label">Age Group :</span>
                <span class="meta-value">05 - 08</span>
              </div>
              <div class="kstory-divider"></div>
              <div class="kstory-meta-item">
                <span class="meta-label">Grade :</span>
                <span class="meta-value">01 - 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="col-md-6 col-lg-4">
        <div class="kstory-card" data-aos="fade-up" data-aos-delay="200">
          <div class="kstory-img">
            <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80" alt="The Mountain of Sabr">
            <span class="kstory-tag" style="background:#FF9B26;">Prophet Stories</span>
          </div>
          <div class="kstory-body">
            <h5>The Mountain of Sabr</h5>
            <div class="kstory-time"><i class="far fa-clock"></i> Reading Time : 20 - 25 min</div>
            <p>When things get hard, Imaan learns the beautiful lesson of patience (Sabr) from Prophet Ayyub's incredible story.</p>
            <div class="kstory-meta">
              <div class="kstory-meta-item">
                <span class="meta-label">Age Group :</span>
                <span class="meta-value">06 - 10</span>
              </div>
              <div class="kstory-divider"></div>
              <div class="kstory-meta-item">
                <span class="meta-label">Grade :</span>
                <span class="meta-value">02 - 05</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="col-md-6 col-lg-4">
        <div class="kstory-card" data-aos="fade-up" data-aos-delay="300">
          <div class="kstory-img">
            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80" alt="Best Friends Forever">
            <span class="kstory-tag" style="background:#E0287D;">Akhlaq Stories</span>
          </div>
          <div class="kstory-body">
            <h5>Best Friends Forever</h5>
            <div class="kstory-time"><i class="far fa-clock"></i> Reading Time : 10 - 15 min</div>
            <p>Akhlaq learns that true friendship is built on honesty and kindness, inspired by the brotherhood of Islam.</p>
            <div class="kstory-meta">
              <div class="kstory-meta-item">
                <span class="meta-label">Age Group :</span>
                <span class="meta-value">05 - 09</span>
              </div>
              <div class="kstory-divider"></div>
              <div class="kstory-meta-item">
                <span class="meta-label">Grade :</span>
                <span class="meta-value">01 - 04</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="text-center mt-5" data-aos="fade-up" data-aos-delay="400">
      <a href="#" class="btn-kidba-green">SEE MORE STORIES</a>
    </div>

  </div>
</section>
`;
