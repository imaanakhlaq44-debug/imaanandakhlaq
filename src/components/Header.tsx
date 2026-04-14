import { html } from 'hono/html';
export const Header = () => html`
<!-- ===== HEADER / NAVBAR ===== -->
<style>
  @media all and (min-width: 992px) {
    .navbar .nav-item.dropdown:hover .dropdown-menu { 
      display: block; 
      visibility: visible; 
      opacity: 1; 
      margin-top: 0;
      transition: all 0.3s ease-in-out;
    }
    .navbar .dropdown-menu { 
      display: block; 
      visibility: hidden; 
      opacity: 0; 
      margin-top: 15px;
      transition: all 0.3s ease-in-out;
      transform-origin: top;
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
                <li><a class="dropdown-item" href="/about/intro.html">Introduction & Objective</a></li>
                <li><a class="dropdown-item" href="/about/genesis.html">Genesis</a></li>
                <li><a class="dropdown-item" href="/about/founder.html">Message from Founder</a></li>
                <li><a class="dropdown-item" href="/about/team.html">Team in Vision</a></li>
                <li><a class="dropdown-item" href="/about/sdg.html">Linked with SDGs</a></li>
                <li><a class="dropdown-item" href="/about/nce.html">Linked NCE Framework</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="productsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Products
              </a>
              <ul class="dropdown-menu" aria-labelledby="productsDropdown" style="border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                <li><a class="dropdown-item" href="/products/books.html">Curriculum Books</a></li>
                <li><a class="dropdown-item" href="/products/coloring.html">Coloring Books</a></li>
                <li><a class="dropdown-item" href="/products/audio.html">Audio Story Portal</a></li>
                <li><a class="dropdown-item" href="/products/puppet.html">Puppet Show</a></li>
                <li><a class="dropdown-item" href="/products/games.html">Game Portal</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="/club.html"><i class="fas fa-crown text-warning"></i> Imaan Akhlaq Club</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="mediaDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Media
              </a>
              <ul class="dropdown-menu" aria-labelledby="mediaDropdown" style="border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px;">
                <li><a class="dropdown-item" href="/blog.html">Blogs</a></li>
                <li><a class="dropdown-item" href="#videos">Videos</a></li>
                <li><a class="dropdown-item" href="#news">News</a></li>
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
        <a href="/auth.html" class="btn btn-nav-cta ms-3" id="authButton">
          <i class="fas fa-user-circle me-1"></i> Login / Register
        </a>
        </div>
      </div>
    </nav>
  </header>

  \n`;
