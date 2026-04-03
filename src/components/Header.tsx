import { html } from 'hono/html';
export const Header = () => html`\n<!-- ===== HEADER / NAVBAR ===== -->\n
  <header class="site-header" id="siteHeader">
    <div class="top-bar">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <ul class="top-bar-info">
              <li><i class="fas fa-envelope"></i> info@imaanakhlaq.org</li>
              <li><i class="fas fa-phone"></i> +92 300 1234567</li>
            </ul>
          </div>
          <div class="col-md-6 text-end">
            <div class="top-bar-social">
              <a href="https://www.instagram.com/imaanakhlaq/" target="_blank"><i class="fab fa-instagram"></i></a>
              <a href="https://www.facebook.com/ImaanAkhlaqTalks/" target="_blank"><i class="fab fa-facebook-f"></i></a>
              <a href="https://www.youtube.com/@ImaanAkhlaq" target="_blank"><i class="fab fa-youtube"></i></a>
              <a href="https://twitter.com/ImaanAkhlaq" target="_blank"><i class="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav class="navbar navbar-expand-lg main-navbar" id="mainNavbar">
      <div class="container">
        <a class="navbar-brand" href="#">
          <img src="/static/img/logo.png" alt="Imaan & Akhlaq" class="site-logo">
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="toggler-icon"><span></span><span></span><span></span></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link active" href="#home">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
            <li class="nav-item"><a class="nav-link" href="#programs">Programs</a></li>
            <li class="nav-item"><a class="nav-link" href="#stories">Stories</a></li>
            <li class="nav-item"><a class="nav-link" href="#team">Characters</a></li>
            <li class="nav-item"><a class="nav-link" href="#events">Events</a></li>
            <li class="nav-item"><a class="nav-link" href="#gallery">Gallery</a></li>
            <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
          </ul>
        <!-- LOGIN / REGISTER BUTTON -->
        <a href="/auth" class="btn btn-nav-cta ms-3" id="authButton">
          <i class="fas fa-user-circle me-1"></i> Login / Register
        </a>
        </div>
      </div>
    </nav>
  </header>

  \n`;
