import { html } from 'hono/html';
export const Gallery = () => html`\n<!-- ===== GALLERY ===== -->\n
  <section class="gallery-section section-padding bg-light-green" id="gallery">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-7 text-center">
          <div class="section-tag">Our Gallery</div>
          <h2 class="section-title">Moments of <span class="text-green">Joy & Learning</span></h2>
          <p class="section-subtitle">Glimpses from our puppet shows, workshops, and 
          community events that brought smiles and learning to thousands of children.</p>
        </div>
      </div>
      <div class="gallery-filter mt-4 text-center">
        <button class="gf-btn active" data-filter="all">All</button>
        <button class="gf-btn" data-filter="shows">Puppet Shows</button>
        <button class="gf-btn" data-filter="workshops">Workshops</button>
        <button class="gf-btn" data-filter="events">Events</button>
      </div>
      <div class="gallery-grid mt-4">
        <div class="gallery-item gi-large" data-category="shows">
          <div class="gi-inner" style="background: linear-gradient(135deg, #1E2D5A, #2E4480)">
            <div class="gi-content">
              <div class="gi-icon">🎭</div>
              <div class="gi-label">Puppet Show at Model School</div>
              <div class="gi-sub">250 children attended</div>
            </div>
            <div class="gi-overlay">
              <div class="gi-view"><i class="fas fa-expand"></i></div>
            </div>
          </div>
        </div>
        <div class="gallery-item" data-category="workshops">
          <div class="gi-inner" style="background: linear-gradient(135deg, #D63678, #B02460)">
            <div class="gi-content">
              <div class="gi-icon">📚</div>
              <div class="gi-label">Teacher Training Workshop</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item" data-category="events">
          <div class="gi-inner" style="background: linear-gradient(135deg, #1E2D5A, #D63678)">
            <div class="gi-content">
              <div class="gi-icon">🌙</div>
              <div class="gi-label">Ramadan Story Night</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item" data-category="shows">
          <div class="gi-inner" style="background: linear-gradient(135deg, #D63678, #E08020)">
            <div class="gi-content">
              <div class="gi-icon">🎪</div>
              <div class="gi-label">Community Center Show</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item gi-tall" data-category="workshops">
          <div class="gi-inner" style="background: linear-gradient(135deg, #E08020, #C99A6B)">
            <div class="gi-content">
              <div class="gi-icon">✏️</div>
              <div class="gi-label">Story Writing Workshop for Kids</div>
              <div class="gi-sub">Grade 3–5 students</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item" data-category="events">
          <div class="gi-inner" style="background: linear-gradient(135deg, #C99A6B, #D63678)">
            <div class="gi-content">
              <div class="gi-icon">🤝</div>
              <div class="gi-label">MoU Signing Ceremony</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item" data-category="shows">
          <div class="gi-inner" style="background: linear-gradient(135deg, #E08020, #1E2D5A)">
            <div class="gi-content">
              <div class="gi-icon">🏫</div>
              <div class="gi-label">Revival School Performance</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
        <div class="gallery-item" data-category="events">
          <div class="gi-inner" style="background: linear-gradient(135deg, #1E2D5A, #C99A6B)">
            <div class="gi-content">
              <div class="gi-icon">🌟</div>
              <div class="gi-label">Annual Celebration Day</div>
            </div>
            <div class="gi-overlay"><div class="gi-view"><i class="fas fa-expand"></i></div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  \n`;
