import { html } from 'hono/html';

export const Characters = () => html`
<!-- ===== KIDBA STAFF / TEAM SECTION ===== -->
  <section class="kidba-staff-section" id="team">
    <div class="container">
      
      <div class="kstaff-header" data-aos="fade-up">
        <h2>Expert Teachers</h2>
        <p>Meet our wonderful characters and guides who make learning Islamic values a joyful experience for every child.</p>
      </div>

      <div class="row justify-content-center">
        
        <!-- Member 1 -->
        <div class="col-sm-6 col-lg-3">
          <div class="kstaff-card" data-aos="fade-up" data-aos-delay="100">
            <div class="kstaff-image-wrap">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" alt="Imaan">
              <div class="kstaff-overlay c-overlay-1"></div>
              <div class="kstaff-social">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
              </div>
              <div class="kstaff-blob-btn"><i class="fas fa-plus"></i></div>
            </div>
            <div class="kstaff-info">
              <h4>Imaan</h4>
              <p>Super Sister</p>
            </div>
          </div>
        </div>

        <!-- Member 2 -->
        <div class="col-sm-6 col-lg-3">
          <div class="kstaff-card" data-aos="fade-up" data-aos-delay="200">
            <div class="kstaff-image-wrap">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" alt="Akhlaq">
              <div class="kstaff-overlay c-overlay-2"></div>
              <div class="kstaff-social">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
              </div>
              <div class="kstaff-blob-btn"><i class="fas fa-plus"></i></div>
            </div>
            <div class="kstaff-info">
              <h4>Akhlaq</h4>
              <p>Zoom Brother</p>
            </div>
          </div>
        </div>

        <!-- Member 3 -->
        <div class="col-sm-6 col-lg-3">
          <div class="kstaff-card" data-aos="fade-up" data-aos-delay="300">
            <div class="kstaff-image-wrap">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" alt="The Parents">
              <div class="kstaff-overlay c-overlay-3"></div>
              <div class="kstaff-social">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
              </div>
              <div class="kstaff-blob-btn"><i class="fas fa-plus"></i></div>
            </div>
            <div class="kstaff-info">
              <h4>The Parents</h4>
              <p>The Guides</p>
            </div>
          </div>
        </div>

        <!-- Member 4 -->
        <div class="col-sm-6 col-lg-3">
          <div class="kstaff-card" data-aos="fade-up" data-aos-delay="400">
            <div class="kstaff-image-wrap">
              <img src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=400&q=80" alt="Grandma">
              <div class="kstaff-overlay c-overlay-4"></div>
              <div class="kstaff-social">
                <a href="#"><i class="fab fa-facebook-f"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
              </div>
              <div class="kstaff-blob-btn"><i class="fas fa-plus"></i></div>
            </div>
            <div class="kstaff-info">
              <h4>Grandma</h4>
              <p>Wisdom Keeper</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
`;
