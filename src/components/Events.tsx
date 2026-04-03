import { html } from 'hono/html';
export const Events = () => html`\n<!-- ===== EVENTS ===== -->\n
  <section class="events-section section-padding bg-light-green" id="events">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-7 text-center">
          <div class="section-tag">Upcoming Events</div>
          <h2 class="section-title">Join Our <span class="text-green">Upcoming</span> Events</h2>
          <p class="section-subtitle">From school puppet shows to community workshops, 
          there's always something exciting happening at Imaan & Akhlaq!</p>
        </div>
      </div>
      <div class="row g-4 mt-3">
        <div class="col-md-6 col-lg-4">
          <div class="event-card" data-aos="fade-up" data-aos-delay="100">
            <div class="ev-date-badge" style="background: linear-gradient(135deg, #D63678, #E08020)">
              <span class="ev-day">15</span>
              <span class="ev-month">Apr</span>
            </div>
            <div class="ev-image" style="background: linear-gradient(135deg, #FDE8F4, #FFE8C8)">
              <div class="ev-img-icon">🎭</div>
            </div>
            <div class="ev-body">
              <div class="ev-category">Puppet Show</div>
              <h6 class="ev-title">Spring Puppet Show Tour 2025</h6>
              <p class="ev-desc">Join us as Imaan and Akhlaq visit 10 schools across the city with 
              their amazing puppet performance about honesty and trust.</p>
              <div class="ev-meta">
                <span><i class="fas fa-map-marker-alt"></i> Barakahu Campus, Islamabad</span>
                <span><i class="fas fa-clock"></i> 10:00 AM – 12:00 PM</span>
              </div>
              <a href="#contact" class="btn-ev-register">Register Now</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="event-card" data-aos="fade-up" data-aos-delay="200">
            <div class="ev-date-badge" style="background: linear-gradient(135deg, #E08020, #B85F0A)">
              <span class="ev-day">22</span>
              <span class="ev-month">Apr</span>
            </div>
            <div class="ev-image" style="background: linear-gradient(135deg, #FFF4E8, #FFE8C8)">
              <div class="ev-img-icon">📚</div>
            </div>
            <div class="ev-body">
              <div class="ev-category">Workshop</div>
              <h6 class="ev-title">Storytelling for Islamic Educators</h6>
              <p class="ev-desc">A full-day professional development workshop for Islamic school 
              teachers on using storytelling to teach Quran values effectively.</p>
              <div class="ev-meta">
                <span><i class="fas fa-map-marker-alt"></i> Online (Zoom)</span>
                <span><i class="fas fa-clock"></i> 9:00 AM – 5:00 PM</span>
              </div>
              <a href="#contact" class="btn-ev-register">Register Now</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="event-card" data-aos="fade-up" data-aos-delay="300">
            <div class="ev-date-badge" style="background: linear-gradient(135deg, #1E2D5A, #2E4480)">
              <span class="ev-day">05</span>
              <span class="ev-month">May</span>
            </div>
            <div class="ev-image" style="background: linear-gradient(135deg, #EEF1F8, #E8ECF8)">
              <div class="ev-img-icon">🌙</div>
            </div>
            <div class="ev-body">
              <div class="ev-category">Community Event</div>
              <h6 class="ev-title">Ramadan Story Night 2025</h6>
              <p class="ev-desc">A special family evening celebrating the blessings of Ramadan 
              with Imaan & Akhlaq stories, activities, and community iftar.</p>
              <div class="ev-meta">
                <span><i class="fas fa-map-marker-alt"></i> Community Center, Islamabad</span>
                <span><i class="fas fa-clock"></i> 6:30 PM – 9:00 PM</span>
              </div>
              <a href="#contact" class="btn-ev-register">Register Now</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  \n`;
