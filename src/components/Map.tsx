import { html } from 'hono/html';
export const Map = () => html`\n<!-- ===== MAP ===== -->\n
  <div class="map-section">
    <iframe 
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26530.70498879558!2d73.25741!3d33.72148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfbf4af45f4a6b%3A0x3b4c3b5d6e7f8a9b!2sBarakahu%2C%20Islamabad%2C%20Pakistan!5e0!3m2!1sen!2s!4v1234567890"
      width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy">
    </iframe>
  </div>

  \n`;
