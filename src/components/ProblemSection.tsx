import { html } from 'hono/html'

export const ProblemSection = () => html`
<style>
  .problem-section {
    padding: 100px 20px;
    background: #FDF8F5; /* Very soft warm background */
    color: #1E2D5A;
    font-family: 'Inter', sans-serif;
  }
  
  .problem-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .problem-container {
      grid-template-columns: 1fr;
      text-align: center;
    }
  }

  .problem-content h2 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 4vw, 3rem);
    color: #D63678;
    margin-bottom: 24px;
    line-height: 1.2;
  }

  .problem-content p.lead {
    font-size: 1.2rem;
    line-height: 1.7;
    color: #475569;
    margin-bottom: 30px;
    font-weight: 500;
  }

  .problem-list {
    list-style: none;
    padding: 0;
    margin: 0 0 40px 0;
  }

  .problem-list li {
    font-size: 1.1rem;
    color: #334155;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
  }
  
  @media (max-width: 900px) {
    .problem-list li { justify-content: center; }
  }

  .problem-list li i {
    color: #E08020;
    font-size: 1.3rem;
  }

  .closing-line {
    font-size: 1.3rem;
    font-weight: 800;
    color: #1E2D5A;
    padding: 20px;
    background: white;
    border-left: 5px solid #D63678;
    border-radius: 0 10px 10px 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }
  
  @media (max-width: 900px) {
    .closing-line { border-left: none; border-top: 5px solid #D63678; border-radius: 10px; }
  }

  .problem-visual {
    position: relative;
  }

  .problem-visual img {
    width: 100%;
    max-width: 500px;
    height: auto;
    filter: drop-shadow(0 20px 40px rgba(30, 45, 90, 0.15));
    border-radius: 20px;
  }
  
  .problem-blob {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120%;
    height: 120%;
    background: #FFEDD5;
    border-radius: 50%;
    z-index: -1;
    filter: blur(40px);
  }
</style>

<section class="problem-section" id="explore">
  <div class="problem-container">
    <div class="problem-visual">
      <div class="problem-blob"></div>
      <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 20px; box-shadow: 0 20px 40px rgba(30, 45, 90, 0.15);">
        <iframe src="https://www.youtube.com/embed/nDI47Tgrgh4?si=DBw-eQXIXyYxcDgC" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
    </div>
    
    <div class="problem-content">
      <h2>The Crisis of Character in Today's World</h2>
      <p class="lead">
        In a world driven by information, we are losing transformation. Education is producing knowledgeable minds, but not responsible individuals.
      </p>
      
      <ul class="problem-list">
        <li><i class="fas fa-times-circle"></i> Moral confusion</li>
        <li><i class="fas fa-times-circle"></i> Weak sense of purpose</li>
        <li><i class="fas fa-times-circle"></i> Disconnect between learning and living</li>
      </ul>
      
      <div class="closing-line">
        The question is no longer what children know&hellip; but who they become.
      </div>
    </div>
  </div>
</section>
`
