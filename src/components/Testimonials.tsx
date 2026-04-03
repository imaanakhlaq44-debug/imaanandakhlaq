import { html } from 'hono/html';
export const Testimonials = () => html`\n<!-- ===== TESTIMONIALS ===== -->\n
  <section class="testimonials-section section-padding" id="testimonials">
    <div class="testi-bg-shape"></div>
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-7 text-center">
          <div class="section-tag">Testimonials</div>
          <h2 class="section-title">What <span class="text-orange">Parents & Teachers</span> Say</h2>
          <p class="section-subtitle">Hear from the families and educators who have experienced 
          the magic of Imaan & Akhlaq firsthand.</p>
        </div>
      </div>
      <div class="swiper testi-swiper mt-4">
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <div class="testi-card">
              <div class="testi-quote"><i class="fas fa-quote-left"></i></div>
              <p class="testi-text">
                "My daughter absolutely loves Imaan! She started telling me the stories herself and even 
                started practicing the manners she learned. Imaan & Akhlaq has made Islamic education 
                something she looks forward to every day!"
              </p>
              <div class="testi-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                <i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <div class="testi-author">
                <div class="ta-avatar">👩‍🦱</div>
                <div class="ta-info">
                  <strong>Sister Fatima A.</strong>
                  <span>Parent, Islamabad</span>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-slide">
            <div class="testi-card">
              <div class="testi-quote"><i class="fas fa-quote-left"></i></div>
              <p class="testi-text">
                "The puppet show at our school was extraordinary. The children were completely engaged 
                and were talking about Akhlaq's lessons for weeks afterward. This is exactly the kind 
                of Islamic education our children need!"
              </p>
              <div class="testi-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                <i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <div class="testi-author">
                <div class="ta-avatar">👨‍🏫</div>
                <div class="ta-info">
                  <strong>Ustaz Ibrahim K.</strong>
                  <span>Islamic School Principal</span>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-slide">
            <div class="testi-card">
              <div class="testi-quote"><i class="fas fa-quote-left"></i></div>
              <p class="testi-text">
                "As a mother, I struggled to make Islamic lessons interesting for my son. Imaan & Akhlaq 
                changed that completely. The stories are so well-crafted — they entertain while teaching 
                deep values. BarakAllahu feekum!"
              </p>
              <div class="testi-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                <i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <div class="testi-author">
                <div class="ta-avatar">👩</div>
                <div class="ta-info">
                  <strong>Umm Khalid</strong>
                  <span>Parent, Lahore</span>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-slide">
            <div class="testi-card">
              <div class="testi-quote"><i class="fas fa-quote-left"></i></div>
              <p class="testi-text">
                "We integrated the Imaan & Akhlaq curriculum into our Grade 2 class and the results 
                have been remarkable. Children are more respectful, more empathetic, and they're 
                actually excited to come to Islamic Studies. Highly recommended!"
              </p>
              <div class="testi-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                <i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
              </div>
              <div class="testi-author">
                <div class="ta-avatar">👩‍🏫</div>
                <div class="ta-info">
                  <strong>Teacher Zainab M.</strong>
                  <span>Grade 2 Teacher, Karachi</span>
                </div>
              </div>
            </div>
          </div>
          <div class="swiper-slide">
            <div class="testi-card">
              <div class="testi-quote"><i class="fas fa-quote-left"></i></div>
              <p class="testi-text">
                "The multilingual approach is genius! My children understand some English and some Urdu, 
                so having both languages available means every story reaches them clearly. The Arabic 
                phrases they've picked up are a beautiful bonus!"
              </p>
              <div class="testi-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                <i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <div class="testi-author">
                <div class="ta-avatar">👨</div>
                <div class="ta-info">
                  <strong>Brother Ahmed S.</strong>
                  <span>Parent, Rawalpindi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="swiper-pagination testi-pagination"></div>
      </div>
    </div>
  </section>

  \n`;
