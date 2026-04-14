import { html } from 'hono/html';

export const BackToTop = () => html`
<style>
  .floating-whatsapp {
    position: fixed;
    bottom: 26px;
    left: 26px; /* Positioned on the left to balance back-to-top on the right */
    z-index: 998;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #25D366, #128C7E);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
    transition: all 0.3s ease;
    text-decoration: none;
    animation: bounceObj 3s infinite;
  }
  .floating-whatsapp:hover {
    transform: translateY(-4px) scale(1.1);
    color: #fff;
    box-shadow: 0 10px 25px rgba(37, 211, 102, 0.6);
    animation: none;
  }
  @keyframes bounceObj {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    60% { transform: translateY(-4px); }
  }
</style>

<!-- ===== WHATSAPP FLOATING BUTTON ===== -->
<a href="https://wa.me/923390106475" target="_blank" class="floating-whatsapp" aria-label="Chat with us on WhatsApp">
  <i class="fab fa-whatsapp"></i>
</a>

<!-- ===== BACK TO TOP ===== -->
<a href="#" class="back-to-top" id="backToTop">
  <i class="fas fa-arrow-up"></i>
</a>
`;
