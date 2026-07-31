import { html } from 'hono/html';
export const Header = () => html`
<!-- ===== HEADER / NAVBAR ===== -->
<style>
  @media all and (min-width: 992px) {
    .navbar .dropdown-menu {
      display: block;
      visibility: hidden;
      opacity: 0;
      margin-top: 15px;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, margin-top 0.3s ease-in-out;
      transform-origin: top;
    }
    /* Open on hover AND on click/tap (Bootstrap adds .show) */
    .navbar .nav-item.dropdown:hover > .dropdown-menu,
    .navbar .nav-item.dropdown > .dropdown-menu.show {
      visibility: visible;
      opacity: 1;
      margin-top: 0;
      pointer-events: auto;
    }
  }
</style>
  <header class="site-header" id="siteHeader">
    <div class="top-bar">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <ul class="top-bar-info">
              <li><i class="fas fa-envelope"></i> info@imaanakhlaq.org</li>
              <li><i class="fas fa-phone"></i> +92 339 0106475</li>
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
          <img src="/kidba_assets/img/splash_logo.jpg" alt="Imaan & Akhlaq" class="site-logo" style="border-radius: 50%; border: 3px solid #FF7681; object-fit: cover; width: 55px; height: 55px; padding: 2px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        </a>

        <style>
          /* Mobile-only Login/Register button shown next to the hamburger */
          .btn-nav-cta-mobile { display: none; }
          @media (max-width: 991.98px) {
            .btn-nav-cta-mobile {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              margin-left: auto;
              margin-right: 10px;
              padding: 7px 14px;
              font-size: 0.82rem;
              font-weight: 700;
              border-radius: 999px;
              background: linear-gradient(135deg, #D63678, #E08020);
              color: #fff !important;
              text-decoration: none;
              box-shadow: 0 3px 10px rgba(214, 54, 120, 0.3);
              white-space: nowrap;
            }
            .btn-nav-cta-mobile i { font-size: 0.95rem; }
            /* Hide the in-collapse desktop button on mobile to avoid duplication */
            #authButton { display: none !important; }
          }
          @media (max-width: 380px) {
            .btn-nav-cta-mobile { padding: 6px 10px; font-size: 0.74rem; }
            .btn-nav-cta-mobile .btn-cta-label-full { display: none; }
            .btn-nav-cta-mobile .btn-cta-label-short { display: inline; }
          }
          @media (min-width: 381px) {
            .btn-nav-cta-mobile .btn-cta-label-short { display: none; }
          }
        </style>
        <a href="/auth" class="btn-nav-cta-mobile" aria-label="Login or Register">
          <i class="fas fa-user-circle"></i>
          <span class="btn-cta-label-full">Login / Register</span>
          <span class="btn-cta-label-short">Login</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="toggler-icon"><span></span><span></span><span></span></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link active" href="/#home">Home</a></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="aboutDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                About Us
              </a>
              <ul class="dropdown-menu" aria-labelledby="aboutDropdown" style="border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                <li><a class="dropdown-item" href="/about/intro">Introduction & Objective</a></li>
                <li><a class="dropdown-item" href="/about/genesis">Genesis</a></li>
                <li><a class="dropdown-item" href="/about/founder">Message from Founder</a></li>
                <li><a class="dropdown-item" href="/about/team">Team in Vision</a></li>
                <li><a class="dropdown-item" href="/about/sdg">Linked with SDGs</a></li>
                <li><a class="dropdown-item" href="/about/nce">Linked NCE Framework</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="productsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Products
              </a>
              <ul class="dropdown-menu" aria-labelledby="productsDropdown" style="border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                <li><a class="dropdown-item" href="/products/books">Curriculum Books</a></li>
                <li><a class="dropdown-item" href="/products/coloring">Coloring Books</a></li>
                <li><a class="dropdown-item" href="/products/audio">Audio Story Portal</a></li>
                <li><a class="dropdown-item" href="/products/puppet">Puppet Show</a></li>
                <li><a class="dropdown-item" href="/products/games">Game Portal</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="/club"><i class="fas fa-crown text-warning"></i> Imaan Akhlaq Club</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="mediaDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Media
              </a>
              <ul class="dropdown-menu" aria-labelledby="mediaDropdown" style="border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                <li><a class="dropdown-item" href="/blog">Blogs</a></li>
                <li><a class="dropdown-item" href="/media/videos">Videos</a></li>
                <li><a class="dropdown-item" href="/media/news">News</a></li>
              </ul>
            </li>
          </ul>
        <style>
          .btn-club-cta {
            background: linear-gradient(135deg, #FFD700, #E08020);
            color: #fff !important;
            font-family: 'Fredoka One', cursive;
            font-weight: 400;
            padding: 8px 20px;
            border-radius: 50px;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(224, 128, 32, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            animation: club-pulse 2s infinite;
          }
          .btn-club-cta:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 20px rgba(224, 128, 32, 0.6);
            color: #fff !important;
          }
          @keyframes club-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
          }
        </style>
        <!-- CLUB BUTTON PENDED -->
        <!-- <a href="/club" class="btn btn-club-cta ms-lg-3" id="clubButton">
          <i class="fas fa-crown"></i> I&A Club
        </a> -->
        <!-- LOGIN / REGISTER BUTTON -->
        <a href="/auth" class="btn btn-nav-cta ms-3" id="authButton">
          <i class="fas fa-user-circle me-1"></i> Login / Register
        </a>
        </div>
      </div>
    </nav>
  </header>

  \n`;
