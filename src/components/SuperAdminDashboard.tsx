import { html, raw } from 'hono/html'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { valueEconomyHelpersJS, COMPLAINT_MAX_POINTS } from '../lib/valueEconomy'
import { clubHelpersJS } from '../lib/clubData'

export const SuperAdminDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

  :root {
    --brand-primary: #29416d;
    --brand-secondary: #cf296d;
    --brand-tertiary: #ea8300;
    --brand-accent: #34d399;
    --brand-purple: #8b5cf6;
    --sidebar-bg: #1d3156;
    --header-bg: #29416d;
    --body-bg: #f4f7fa;
    --text-dark: #1e293b;
    --text-light: #94a3b8;
    --white: #ffffff;
    --border-color: #e2e8f0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
  body { background-color: var(--body-bg); color: var(--text-dark); }
  .super-admin-layout { display: flex; min-height: 100vh; width: 100%; }

  /* Sidebar */
  .sidebar { width: 250px; background-color: var(--sidebar-bg); color: var(--white); display: flex; flex-direction: column; z-index: 10; }
  .sidebar-header { height: 70px; display: flex; align-items: center; padding: 0 20px; background-color: rgba(0, 0, 0, 0.1); font-size: 1.1rem; font-weight: 600; gap: 12px; }
  .sidebar-header img { width: 35px; height: 35px; border-radius: 8px; object-fit: cover; }
  .sidebar-nav { flex: 1; padding: 20px 0; overflow-y: auto; }
  .nav-item { padding: 14px 25px; display: flex; align-items: center; gap: 15px; color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 0.95rem; transition: all 0.2s ease; cursor: pointer; }
  .nav-item:hover, .nav-item.active { color: var(--white); background-color: rgba(255, 255, 255, 0.05); border-left: 4px solid var(--brand-secondary); }
  .nav-item i { width: 20px; text-align: center; font-size: 1.1rem; }

  /* Main Wrapper */
  .main-wrapper { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }

  /* Header */
  .top-header { height: 70px; background-color: var(--header-bg); display: flex; align-items: center; justify-content: space-between; padding: 0 20px 0 30px; color: var(--white); box-shadow: 0 2px 10px rgba(0,0,0,0.1); gap: 12px; flex-wrap: nowrap; }
  .header-title { font-size: 1.1rem; font-weight: 500; white-space: nowrap; flex: 0 0 auto; }
  .header-search { position: relative; display: flex; align-items: center; flex: 1 1 auto; max-width: 320px; margin: 0 auto; }
  .header-search input { background-color: rgba(255,255,255,0.12); border: none; border-radius: 20px; padding: 8px 15px 8px 35px; color: var(--white); font-size: 0.9rem; width: 100%; outline: none; }
  .header-search input::placeholder { color: rgba(255,255,255,0.6); }
  .header-search i { position: absolute; left: 12px; color: rgba(255,255,255,0.6); }
  .header-actions { display: flex; align-items: center; gap: 18px; flex: 0 0 auto; }
  .action-icon { font-size: 1.2rem; cursor: pointer; position: relative; color: rgba(255,255,255,0.8); transition: color 0.2s; }
  .action-icon:hover { color: var(--white); }
  .badge { position: absolute; top: -5px; right: -5px; background-color: var(--brand-secondary); color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

  /* Content */
  .content-area { padding: 24px; flex: 1; overflow-y: auto; }

  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
  .stat-card { border-radius: 16px; padding: 25px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 20px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: -50%; right: -20%; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; z-index: 1; }
  .stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.12); }
  .stat-card.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  .stat-card.green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
  .stat-card.red { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); }
  .stat-card.purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
  .stat-info { position: relative; z-index: 2; }
  .stat-info h3 { font-size: 2.2rem; font-weight: 700; margin-bottom: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .stat-info p { font-size: 0.95rem; opacity: 0.9; font-weight: 500; }
  .stat-icon { font-size: 3rem; opacity: 0.4; position: relative; z-index: 2; }

  /* Filters */
  .filter-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .filter-tabs { display: flex; background: var(--white); border-radius: 10px; padding: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  .filter-tab { padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; color: var(--text-light); }
  .filter-tab.active { background: var(--brand-primary); color: var(--white); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .filter-tab:hover:not(.active) { color: var(--brand-primary); background: rgba(41, 65, 109, 0.05); }

  /* Dashboard Grid */
  .dash-grid { display: grid; grid-template-columns: 1fr; gap: 25px; margin-bottom: 25px; }
  .card { background: var(--white); border-radius: 16px; padding: 25px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.02); }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
  .card-title { font-size: 1.15rem; font-weight: 600; color: var(--text-dark); display: flex; align-items: center; gap: 10px; }

  /* Beautiful Graph Area */
  .graph-wrapper { position: relative; height: 300px; width: 100%; display: flex; align-items: flex-end; justify-content: space-around; padding-top: 20px; background: radial-gradient(circle at top right, rgba(207, 41, 109, 0.03), transparent 50%); border-radius: 10px; }
  .graph-line-bg { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.5; background: repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.03) 49px, rgba(0,0,0,0.03) 50px); }
  .graph-bar-container { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: 8%; z-index: 2; position: relative; }
  .graph-bar { width: 100%; border-radius: 6px 6px 0 0; transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; }
  .graph-bar.schools { background: linear-gradient(to top, var(--brand-primary), #4facfe); }
  .graph-bar.students { background: linear-gradient(to top, var(--brand-secondary), #ff758c); width: 60%; position: absolute; bottom: 0; border-radius: 4px 4px 0 0; opacity: 0.9; }
  .graph-label { margin-top: 10px; font-size: 0.75rem; font-weight: 500; color: var(--text-light); }
  
  .graph-tooltip { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: var(--text-dark); color: var(--white); padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; white-space: nowrap; opacity: 0; transition: opacity 0.2s, top 0.2s; pointer-events: none; z-index: 10; }
  .graph-bar-container:hover .graph-tooltip { opacity: 1; top: -55px; }
  .graph-tooltip::after { content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); border-width: 4px 4px 0; border-style: solid; border-color: var(--text-dark) transparent transparent transparent; }

  .graph-legend { display: flex; justify-content: center; gap: 20px; margin-top: 20px; position: relative; z-index: 2; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 500; color: var(--text-dark); }
  .legend-dot { width: 12px; height: 12px; border-radius: 4px; }

  /* Table */
  .table-responsive { overflow-x: auto; }
  table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
  th, td { padding: 15px; text-align: left; }
  th { font-weight: 600; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase; border-bottom: 2px solid var(--border-color); }
  tbody tr { background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.02); border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  tbody tr:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); background: #fcfcfc; }
  tbody td:first-child { border-radius: 10px 0 0 10px; }
  tbody td:last-child { border-radius: 0 10px 10px 0; }
  
  .school-info { display: flex; align-items: center; gap: 15px; }
  .school-logo { width: 45px; height: 45px; border-radius: 10px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--brand-primary); font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
  .school-details strong { display: block; color: var(--text-dark); font-weight: 600; font-size: 1rem; }
  .school-details span { font-size: 0.8rem; color: var(--text-light); }
  
  .badge-status { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-active { background: rgba(52, 211, 153, 0.1); color: #059669; }
  .badge-pending { background: rgba(234, 131, 0, 0.1); color: #b45309; }

  .metrics-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; background: #f1f5f9; font-size: 0.85rem; font-weight: 600; color: var(--text-dark); }
  .metrics-pill i { color: var(--brand-secondary); font-size: 0.8rem; }

  .btn-icon { background: #f1f5f9; border: none; cursor: pointer; color: var(--text-light); font-size: 0.9rem; width: 35px; height: 35px; border-radius: 8px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; margin-right: 5px; }
  .btn-icon:hover { color: var(--white); background-color: var(--brand-primary); box-shadow: 0 2px 5px rgba(41, 65, 109, 0.3); }

  .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--brand-primary); display: none; }
  .loading-overlay.active { display: flex; }

  @media (max-width: 1100px) { .dash-grid { grid-template-columns: 1fr; } }

  /* Reports grid — collapses on narrow screens */
  .reports-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-bottom: 25px; }
  @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr !important; } }

  /* ── Mobile Sidebar: slide-in from left ── */
  .mobile-menu-btn {
    display: none;
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: 1100;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: var(--brand-primary, #29416d);
    color: #fff;
    font-size: 1.3rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    transition: transform 0.2s, background 0.2s;
    align-items: center;
    justify-content: center;
  }
  .mobile-menu-btn:hover { transform: scale(1.08); }
  .mobile-menu-btn .bar {
    display: block;
    width: 22px;
    height: 2.5px;
    background: #fff;
    border-radius: 2px;
    transition: all 0.3s ease;
    margin: 4px auto;
  }
  .mobile-menu-btn.active .bar:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .mobile-menu-btn.active .bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .mobile-menu-btn.active .bar:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .sidebar-overlay.active { display: block; opacity: 1; }

  @media (max-width: 768px) {
    .mobile-menu-btn { display: flex; }

    .sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      height: 100vh;
      width: 260px;
      z-index: 1050;
      transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: none;
    }
    .sidebar.open {
      left: 0;
      box-shadow: 8px 0 30px rgba(0,0,0,0.3);
    }

    /* Header: smaller on mobile, shift right for hamburger */
    .top-header { padding: 0 12px 0 68px; height: 56px; }
    .header-title { font-size: 0.88rem; }
    .header-search { display: none; }

    /* Content */
    .content-area { padding: 10px; padding-bottom: 72px; }

    /* Stats: 2-column grid on mobile */
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; margin-bottom: 12px; }
    .stat-card { padding: 14px; border-radius: 12px !important; }
    .stat-info h3 { font-size: 1.55rem !important; }
    .stat-info p { font-size: 0.78rem; }
    .stat-icon { font-size: 2rem; }

    /* Cards */
    .card { padding: 14px; border-radius: 12px !important; }
    .card-header { flex-wrap: wrap; gap: 8px; }
    .filter-tabs { flex-wrap: wrap; }
    .filter-tab { padding: 5px 9px; font-size: 0.74rem; }

    /* Table: horizontal scroll */
    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { min-width: 460px; }
    th, td { padding: 10px 8px; font-size: 0.76rem; }

    /* Reports */
    .reports-grid { grid-template-columns: 1fr !important; }
  }

  /* Mobile bottom navigation bar */
  .mobile-bottom-bar { display: none; }
  @media (max-width: 768px) {
    .mobile-bottom-bar {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #ffffff;
      border-top: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 -4px 14px rgba(30,45,90,0.1);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 8px 4px calc(8px + env(safe-area-inset-bottom)) 4px;
    }
    .mob-nav-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 3px; background: transparent; border: none;
      color: #64748b; font-size: 10px; font-weight: 600; cursor: pointer;
      font-family: 'Poppins', sans-serif; flex: 1;
    }
    .mob-nav-btn i { font-size: 17px; padding: 5px; border-radius: 8px; background: #f1f5f9; color: #334155; }
    .mob-nav-btn.active i { color: #fff; background: var(--brand-primary); }
    .mob-nav-btn.active { color: var(--brand-primary); }
    .mob-nav-btn.danger i { color: #fff; background: #dc2626; }
  }

  .sidebar-cam-badge, .school-cam-badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #d63678 0%, #e46c2e 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    border: 2px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: transform 0.2s;
  }
  .sidebar-cam-badge:hover, .school-cam-badge:hover {
    transform: scale(1.1);
  }

  /* ============================================================
     DESKTOP POLISH — Super Admin Dashboard
     ============================================================ */
  :root {
    --brand-primary: #29416d;
    --brand-secondary: #cf296d;
    --brand-tertiary: #ea8300;
    --brand-success: #34d399;
    --brand-danger: #ef4444;
  }

  @media (min-width: 1280px) {
    .super-admin-layout .sidebar { width: 260px !important; min-width: 260px !important; }
  }
  @media (min-width: 1600px) {
    .super-admin-layout .sidebar { width: 280px !important; min-width: 280px !important; }
  }

  .super-admin-layout .card,
  .super-admin-layout .stat-card,
  .super-admin-layout .panel-card,
  .super-admin-layout .section-card,
  .super-admin-layout .widget-card {
    border-radius: 20px !important;
    box-shadow: 0 6px 22px rgba(41, 65, 109, 0.08), 0 1px 3px rgba(41, 65, 109, 0.04) !important;
    border: 1px solid rgba(41, 65, 109, 0.06) !important;
    transition: transform 0.25s ease, box-shadow 0.25s ease !important;
  }
  .super-admin-layout .card:hover,
  .super-admin-layout .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 34px rgba(41, 65, 109, 0.12), 0 3px 8px rgba(41, 65, 109, 0.05) !important;
  }

  .super-admin-layout .stat-card.card-green  { border-left: 4px solid var(--brand-success) !important; }
  .super-admin-layout .stat-card.card-yellow { border-left: 4px solid var(--brand-tertiary) !important; }
  .super-admin-layout .stat-card.card-orange { border-left: 4px solid var(--brand-secondary) !important; }
  .super-admin-layout .stat-card.card-blue   { border-left: 4px solid var(--brand-primary) !important; }

  .super-admin-layout .btn-logout,
  .super-admin-layout .logout-btn,
  .super-admin-layout .btn-outline-light.btn-logout {
    background: linear-gradient(135deg, #ef4444 0%, #cf296d 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.28) !important;
    font-weight: 700 !important;
  }
  .super-admin-layout .btn-logout:hover,
  .super-admin-layout .logout-btn:hover { background: linear-gradient(135deg, #dc2626 0%, #b91c5e 100%) !important; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(239, 68, 68, 0.36) !important; }
  .super-admin-layout .btn-logout i,
  .super-admin-layout .logout-btn i { color: #ffffff !important; }

  /* Value Economy price editor. A table of numbers that change what every
     school pays, so it reads as a form rather than a dashboard: one row per
     category, the built-in price always visible beside the override, and no
     way to save without seeing what you changed. */
  .ve-admin-chip {
    background: rgba(207, 41, 109, 0.1); color: var(--brand-secondary);
    font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 999px;
  }
  .ve-admin-intro {
    color: var(--text-sec); font-size: 0.9rem; line-height: 1.6;
    margin: 0 0 18px; max-width: 720px;
  }
  .ve-admin-table { display: flex; flex-direction: column; gap: 8px; }
  .ve-admin-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 14px; border-radius: 12px;
    background: #f8fafc; border: 1px solid #e2e8f0;
  }
  .ve-admin-row.is-changed { border-color: var(--brand-secondary); background: #fff; }
  .ve-admin-row.is-off { opacity: 0.6; }
  .ve-admin-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ve-admin-names { flex: 1; min-width: 0; }
  .ve-admin-name { font-weight: 600; color: var(--brand-primary); font-size: 0.92rem; }
  /* The Urdu name is what a Pakistani admin scans for first. */
  .ve-admin-name-ur { font-size: 0.85rem; color: var(--text-sec); direction: rtl; text-align: right; }
  .ve-admin-seed {
    font-size: 0.74rem; color: var(--text-light); white-space: nowrap;
    background: #eef2f7; border-radius: 999px; padding: 3px 10px;
  }
  .ve-admin-row input[type="number"] {
    width: 92px; border: 1px solid #cbd5e1; border-radius: 9px;
    padding: 7px 10px; font-size: 0.9rem; font-family: inherit;
    color: var(--brand-primary); text-align: center; background: #fff;
  }
  .ve-admin-row input[type="number"]:focus { outline: none; border-color: var(--brand-secondary); }
  .ve-admin-active {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.78rem; color: var(--text-sec); cursor: pointer; white-space: nowrap;
  }
  .ve-admin-active input { width: 16px; height: 16px; cursor: pointer; }

  .ve-admin-foot {
    display: flex; align-items: center; gap: 10px;
    margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; flex-wrap: wrap;
  }
  .ve-admin-status { font-size: 0.84rem; font-weight: 600; color: var(--text-light); margin-right: auto; }
  .ve-admin-status.is-dirty { color: var(--brand-secondary); }
  .ve-admin-status.is-saved { color: #16a34a; }
  .ve-admin-btn {
    border: none; border-radius: 999px; padding: 9px 20px;
    font-size: 0.86rem; font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .ve-admin-btn.save { background: var(--brand-secondary); color: #fff; }
  .ve-admin-btn.save:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
  .ve-admin-btn.ghost { background: #f1f5f9; color: var(--text-sec); }

  @media (max-width: 767px) {
    .ve-admin-row { flex-wrap: wrap; gap: 10px; }
    .ve-admin-names { flex: 1 1 100%; }
    .ve-admin-foot .ve-admin-btn { flex: 1; }
  }

  .super-admin-layout .nav-item.active,
  .super-admin-layout .nav-link.active,
  .super-admin-layout a.nav-item.active {
    background: linear-gradient(90deg, rgba(207, 41, 109, 0.18), transparent) !important;
    border-left: 3px solid var(--brand-secondary) !important;
    color: #ffffff !important;
  }

  @media (max-width: 1199px) and (min-width: 768px) {
    .super-admin-layout .sidebar { width: 200px !important; min-width: 200px !important; }
  }
  /* Mobile: sidebar is fixed/offcanvas — don't alter main flex layout */
  @media (max-width: 767px) {
    .super-admin-layout .sidebar { width: 260px !important; }
  }

</style>

<div class="super-admin-layout">
  <!-- Mobile Hamburger Button -->
  <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu">
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </button>
  <!-- Mobile Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/" style="display:flex; align-items:center; gap:12px; text-decoration:none; color:inherit;">
        <img src="/kidba_assets/favicon.jpg" alt="Logo" />
        <span>Super Admin</span>
      </a>
    </div>
    <div class="sidebar-nav" id="sidebar-menu">
      <a href="#" class="nav-item active" data-target="dashboard"><i class="fas fa-th-large"></i> Dashboard</a>
      <a href="#" class="nav-item" data-target="schools"><i class="fas fa-school"></i> Schools</a>
      <a href="#" class="nav-item" data-target="reports"><i class="fas fa-chart-pie"></i> Global Reports</a>
      <a href="#" class="nav-item" data-target="value-economy"><i class="fas fa-coins"></i> Value Economy</a>
      <a href="#" class="nav-item" data-target="coming-soon"><i class="fas fa-file-invoice-dollar"></i> Billing & Plans</a>
      <a href="#" class="nav-item" data-target="coming-soon"><i class="fas fa-bullhorn"></i> Announcements</a>
      <a href="#" class="nav-item" data-target="coming-soon"><i class="fas fa-cog"></i> Platform Settings</a>
    </div>
  </aside>

  <!-- Main Wrapper -->
  <div class="main-wrapper" style="position: relative;">
    <div id="loading" class="loading-overlay active">Loading Live Data from Database...</div>
    
    <header class="top-header">
      <div class="header-title">Imaan & Akhlaq - Central Admin</div>
      <div class="header-search">
        <i class="fas fa-search"></i>
        <input type="text" id="dashboard-search" placeholder="Search schools, locations, admins...">
      </div>
      <div class="header-actions">
        <div class="action-icon" title="Notifications">
          <i class="fas fa-bell"></i>
          <span class="notification-badge">0</span>
        </div>
        <div class="action-icon" style="position: relative;" id="profile-btn">
          <i class="fas fa-user-circle"></i>
          <div id="profile-dropdown" style="display: none; position: absolute; right: 0; top: 120%; background: white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-radius: 8px; width: 160px; overflow: hidden; z-index: 100; text-align: left;">
            <div style="padding: 12px; border-bottom: 1px solid #eee; font-size: 0.9rem; font-weight: 600; color: var(--brand-primary);">Super Admin</div>
            <a href="#" id="back-btn" onclick="window.history.back()" style="display: block; padding: 12px; color: #64748b; text-decoration: none; font-size: 0.9rem; transition: background 0.2s;">
               <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Back
            </a>
            <a href="#" id="refresh-btn" onclick="window.location.reload()" style="display: block; padding: 12px; color: #10b981; text-decoration: none; font-size: 0.9rem; transition: background 0.2s;">
               <i class="fas fa-sync-alt" style="margin-right: 8px;"></i> Refresh
            </a>
            <a href="#" id="logout-btn" style="display: block; padding: 12px; color: #dc3545; text-decoration: none; font-size: 0.9rem; transition: background 0.2s;">
               <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i> Logout
            </a>
          </div>
        </div>
      </div>
    </header>

    <div class="content-area">

      <!-- Coming Soon Placeholder -->
      <div id="coming-soon-section" style="display: none; text-align: center; padding: 60px 20px;">
        <i class="fas fa-tools" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
        <h2 style="color: var(--brand-primary); margin-bottom: 10px;">Feature In Development</h2>
        <p style="color: var(--text-sec); max-width: 500px; margin: 0 auto;">This section is currently being built and will be available in future updates.</p>
      </div>

      <!-- Value Economy — what each category is worth -->
      <!--
        The one screen the concept insists on: "points must be changeable from
        the Super Admin panel, never hard-coded". The table in valueEconomy.ts
        is only a seed, and until this page existed the only way to change a
        price was the Firestore console.
      -->
      <div id="dash-value-economy" style="display: none;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-coins" style="color: var(--brand-tertiary)"></i>
              Value Credit Categories
            </div>
            <span class="ve-admin-chip" id="veAdminChip">Loading</span>
          </div>

          <p class="ve-admin-intro">
            What the Values Council awards for each act. A change here applies to every
            school and takes effect on the next award — entries already ruled on keep
            what they were paid. Blank means the category is left at its built-in price.
          </p>

          <div class="ve-admin-table" id="veAdminTable">
            <div style="text-align:center;color:var(--text-light);padding:40px;">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
            </div>
          </div>

          <div class="ve-admin-foot">
            <span class="ve-admin-status" id="veAdminStatus"></span>
            <button class="ve-admin-btn ghost" type="button" onclick="window.veAdminReset()">
              <i class="fas fa-rotate-left"></i> Reset all to built-in prices
            </button>
            <button class="ve-admin-btn save" type="button" id="veAdminSave" onclick="window.veAdminSave()">
              <i class="fas fa-check"></i> Save prices
            </button>
          </div>
        </div>
      </div>

      <!-- Global Reports Section -->
      <div id="dash-reports" style="display: none;">
        <div class="reports-grid">
          <!-- Bar Chart Card -->
          <div class="card" style="margin: 0;">
            <div class="card-header" style="border-bottom: none;">
              <div class="card-title">
                <i class="fas fa-chart-bar" style="color: var(--brand-secondary)"></i> 
                Top Schools by Population
              </div>
            </div>
            <div style="position: relative; height: 320px; width: 100%; padding: 0 10px;">
               <canvas id="schoolsChartCanvas"></canvas>
            </div>
          </div>

          <!-- Donut Chart Card -->
          <div class="card" style="margin: 0;">
            <div class="card-header" style="border-bottom: none;">
              <div class="card-title">
                <i class="fas fa-chart-pie" style="color: var(--brand-tertiary)"></i> 
                Demographics
              </div>
            </div>
            <div style="position: relative; height: 320px; width: 100%; padding: 0 10px;">
               <canvas id="demoChartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid" id="dash-stats">
        <div class="stat-card blue">
          <div class="stat-info">
            <h3 id="total-schools-count">...</h3>
            <p>Total Schools</p>
          </div>
          <div class="stat-icon"><i class="fas fa-school"></i></div>
        </div>
        <div class="stat-card green">
          <div class="stat-info">
            <h3 id="total-students-count">...</h3>
            <p>Total Students</p>
          </div>
          <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
        </div>
        <div class="stat-card red">
          <div class="stat-info">
            <h3 id="total-teachers-count">...</h3>
            <p>Total Teachers</p>
          </div>
          <div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        </div>
        <div class="stat-card purple">
          <div class="stat-info">
            <h3>$500</h3>
            <p>Monthly Revenue</p>
          </div>
          <div class="stat-icon"><i class="fas fa-wallet"></i></div>
        </div>
      </div>

      <!-- Graph Section -->
      <div class="card" id="dash-graph" style="margin-bottom: 25px;">
        <div class="card-header">
          <div class="card-title">
            <i class="fas fa-chart-area" style="color: var(--brand-secondary)"></i> 
            Platform Growth & Registrations
          </div>
          <div class="filter-tabs">
            <div class="filter-tab">1 Week</div>
            <div class="filter-tab active">1 Month</div>
            <div class="filter-tab">3 Months</div>
            <div class="filter-tab">6 Months</div>
            <div class="filter-tab">1 Year</div>
          </div>
        </div>
        <div class="graph-wrapper">
          <div class="graph-line-bg"></div>
          <!-- Graph Bars (Dummy Data) -->
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 30%"></div>
            <div class="graph-bar students" style="height: 15%"></div>
            <div class="graph-tooltip">W1: 5 Schools, 200 Students</div>
            <div class="graph-label">Week 1</div>
          </div>
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 45%"></div>
            <div class="graph-bar students" style="height: 25%"></div>
            <div class="graph-tooltip">W2: 8 Schools, 400 Students</div>
            <div class="graph-label">Week 2</div>
          </div>
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 60%"></div>
            <div class="graph-bar students" style="height: 35%"></div>
            <div class="graph-tooltip">W3: 12 Schools, 600 Students</div>
            <div class="graph-label">Week 3</div>
          </div>
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 85%"></div>
            <div class="graph-bar students" style="height: 55%"></div>
            <div class="graph-tooltip">W4: 18 Schools, 1200 Students</div>
            <div class="graph-label">Week 4</div>
          </div>
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 70%"></div>
            <div class="graph-bar students" style="height: 40%"></div>
            <div class="graph-tooltip">W5: 15 Schools, 800 Students</div>
            <div class="graph-label">Week 5</div>
          </div>
          <div class="graph-bar-container">
            <div class="graph-bar schools" style="height: 100%"></div>
            <div class="graph-bar students" style="height: 75%"></div>
            <div class="graph-tooltip">W6: 22 Schools, 1800 Students</div>
            <div class="graph-label">Week 6</div>
          </div>
        </div>
        <div class="graph-legend">
          <div class="legend-item"><div class="legend-dot" style="background: var(--brand-primary)"></div> New Schools Registered</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--brand-secondary)"></div> New Students Registered</div>
        </div>
      </div>

      <!-- Schools List -->
      <div class="card" id="dash-schools">
        <div class="card-header">
          <div class="card-title">
            <i class="fas fa-building" style="color: var(--brand-tertiary)"></i>
            Registered Schools Directory
          </div>
          <button class="btn-icon" title="Export Data"><i class="fas fa-download"></i></button>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>School Name & Admin</th>
                <th>Location</th>
                <th>Teachers</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="schools-table-body">
              <tr><td colspan="6" style="text-align:center; padding: 30px;">Loading Live Database...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile bottom nav bar -->
  <div class="mobile-bottom-bar">
    <button class="mob-nav-btn active" id="mobBtnDash" onclick="document.querySelector('[data-target=dashboard]').click(); document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active')">
      <i class="fas fa-th-large"></i><span>Dashboard</span>
    </button>
    <button class="mob-nav-btn" id="mobBtnSchools" onclick="document.querySelector('[data-target=schools]').click(); document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active')">
      <i class="fas fa-school"></i><span>Schools</span>
    </button>
    <button class="mob-nav-btn" id="mobBtnReports" onclick="document.querySelector('[data-target=reports]').click(); document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active')">
      <i class="fas fa-chart-pie"></i><span>Reports</span>
    </button>
    <button class="mob-nav-btn danger" onclick="document.getElementById('logout-btn').click()">
      <i class="fas fa-sign-out-alt"></i><span>Logout</span>
    </button>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import Chart from "https://esm.sh/chart.js/auto";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // CLUB_HOUSES / clubHouse come from clubData.ts — the price rows are dotted
  // in the house colour a category belongs to, the same colour the student and
  // the Council already see it in.
  ${raw(clubHelpersJS)}

  // VALUE_CATEGORIES comes from valueEconomy.ts. The prices in it are the
  // BUILT-IN defaults this screen edits away from, never the live values.
  ${raw(valueEconomyHelpersJS)}

  const VE_MAX_POINTS = ${COMPLAINT_MAX_POINTS};

  // HTML escape helper to prevent XSS when using innerHTML
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str || '');
    return div.innerHTML;
  }

  // Mobile hamburger menu toggle
  (function() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!menuBtn || !sidebar) return;

    function toggleMenu() {
      const isOpen = sidebar.classList.toggle('open');
      menuBtn.classList.toggle('active', isOpen);
      if (overlay) overlay.classList.toggle('active', isOpen);
    }

    function closeMenu() {
      sidebar.classList.remove('open');
      menuBtn.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }

    menuBtn.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Close sidebar when a nav item is clicked on mobile
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeMenu();
      });
    });
  })();

  async function loadDashboardData() {
    try {
      const schoolsSnap = await getDocs(collection(db, "schools"));
      const schools = [];
      schoolsSnap.forEach(d => schools.push({id: d.id, ...d.data()}));

      const usersSnap = await getDocs(collection(db, "users"));
      const users = [];
      usersSnap.forEach(d => users.push({uid: d.id, ...d.data()}));

      let totalStudents = 0;
      let totalTeachers = 0;

      users.forEach(u => {
         if (u.role === 'student') totalStudents++;
         if (u.role === 'teacher') totalTeachers++;
      });

      document.getElementById('total-schools-count').textContent = schools.length;
      document.getElementById('total-students-count').textContent = totalStudents;
      document.getElementById('total-teachers-count').textContent = totalTeachers;

      const tbody = document.getElementById('schools-table-body');
      tbody.innerHTML = '';
      
      if(schools.length === 0) {
         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">No schools registered yet.</td></tr>';
      } else {
         schools.forEach(school => {
            let schTch = 0;
            let schStu = 0;
            let adminName = "Unknown Admin";

            users.forEach(u => {
               if (u.school_id === school.id) {
                  if(u.role === 'teacher') schTch++;
                  if(u.role === 'student') schStu++;
                  if(u.role === 'school_admin' && (u.uid === school.admin_uid || u.email === school.admin_email)) {
                     adminName = u.name;
                  }
               }
            });

            const shortName = (school.name || 'SC').substring(0,2).toUpperCase();
            
            tbody.innerHTML += \`
              <tr>
                <td>
                  <div class="school-info">
                    <div class="school-logo">\${esc(shortName)}</div>
                    <div class="school-details">
                      <strong>\${esc(school.name || 'Unnamed School')}</strong>
                      <span>Admin: \${esc(adminName)}</span>
                    </div>
                  </div>
                </td>
                <td>\${esc(school.location || 'Not specified')}</td>
                <td><div class="metrics-pill"><i class="fas fa-chalkboard-teacher"></i> \${schTch}</div></td>
                <td><div class="metrics-pill"><i class="fas fa-user-graduate"></i> \${schStu}</div></td>
                <td><span class="badge-status badge-active">Active</span></td>
                <td>
                  <button class="btn-icon" title="View Details"><i class="fas fa-eye"></i></button>
                  <button class="btn-icon" title="Edit School"><i class="fas fa-edit"></i></button>
                </td>
              </tr>
            \`;
         });
      }
      
      // BUILD GLOBAL REPORTS DATA
      let schoolStats = schools.map(school => {
         let schTch = 0, schStu = 0;
         users.forEach(u => {
            if(u.school_id === school.id) {
               if(u.role === 'teacher') schTch++;
               if(u.role === 'student') schStu++;
            }
         });
         return { name: school.name || 'Unnamed', students: schStu, teachers: schTch, total: schStu + schTch };
      });

      // Sort by total users and take top 5
      schoolStats.sort((a,b) => b.total - a.total);
      const topSchools = schoolStats.slice(0, 5);
      
      const schoolNames = topSchools.map(s => s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name);
      const schoolStudents = topSchools.map(s => s.students);
      const schoolTeachers = topSchools.map(s => s.teachers);

      // Render Bar Chart (Chart.js)
      if (window.mySchoolsChart) window.mySchoolsChart.destroy();
      const ctxSchools = document.getElementById('schoolsChartCanvas').getContext('2d');
      
      // Beautiful Gradients
      const gradBlue = ctxSchools.createLinearGradient(0, 0, 0, 400);
      gradBlue.addColorStop(0, '#4facfe');
      gradBlue.addColorStop(1, '#29416d');
      
      const gradPink = ctxSchools.createLinearGradient(0, 0, 0, 400);
      gradPink.addColorStop(0, '#ff758c');
      gradPink.addColorStop(1, '#cf296d');

      window.mySchoolsChart = new Chart(ctxSchools, {
         type: 'bar',
         data: {
            labels: schoolNames.length ? schoolNames : ['No Data'],
            datasets: [
               {
                  label: 'Students',
                  data: schoolStudents.length ? schoolStudents : [0],
                  backgroundColor: gradPink,
                  borderRadius: 8,
                  borderSkipped: false,
                  barPercentage: 0.6,
                  categoryPercentage: 0.8
               },
               {
                  label: 'Teachers',
                  data: schoolTeachers.length ? schoolTeachers : [0],
                  backgroundColor: gradBlue,
                  borderRadius: 8,
                  borderSkipped: false,
                  barPercentage: 0.6,
                  categoryPercentage: 0.8
               }
            ]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
               legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Poppins', size: 12 } } },
               tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.9)', titleFont: { family: 'Poppins' }, bodyFont: { family: 'Poppins' }, padding: 12, cornerRadius: 8 }
            },
            scales: {
               y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, ticks: { font: { family: 'Poppins' } } },
               x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: 'Poppins' } } }
            },
            animation: { duration: 2000, easing: 'easeOutQuart' }
         }
      });

      // Render Doughnut Chart (Chart.js)
      if (window.myDemoChart) window.myDemoChart.destroy();
      const ctxDemo = document.getElementById('demoChartCanvas').getContext('2d');
      
      const gradOrange = ctxDemo.createLinearGradient(0, 0, 0, 400);
      gradOrange.addColorStop(0, '#fad961');
      gradOrange.addColorStop(1, '#ea8300');

      window.myDemoChart = new Chart(ctxDemo, {
         type: 'doughnut',
         data: {
            labels: ['Students', 'Teachers'],
            datasets: [{
               data: [(totalStudents || 1), totalTeachers], // Default 1 to show empty ring if no data
               backgroundColor: [gradPink, gradOrange],
               borderWidth: 0,
               hoverOffset: 10
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
               legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Poppins', size: 13 } } },
               tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.9)', bodyFont: { family: 'Poppins' }, padding: 12, cornerRadius: 8, callbacks: { label: function(context) { return ' ' + context.label + ': ' + (totalStudents + totalTeachers === 0 ? 0 : context.raw); } } }
            },
            animation: { animateScale: true, animateRotate: true, duration: 2000, easing: 'easeOutQuart' }
         }
      });
      
      document.getElementById('loading').classList.remove('active');
    } catch(err) {
      console.error(err);
      document.getElementById('loading').textContent = 'Error: ' + err.message + ' (You might need to login first)';
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const waitOverlay = document.getElementById('authWaitOverlay');
      if (waitOverlay) waitOverlay.remove();
      // Only the super_admin role may open this dashboard — everyone else
      // is sent back to login. (Firestore rules enforce this server-side
      // too; this check just fails fast with a clear message.)
      let role = '';
      try {
        const meSnap = await getDoc(doc(db, 'users', user.uid));
        role = meSnap.exists() ? (meSnap.data().role || '') : '';
      } catch (e) { console.error('Role check failed:', e); }
      if (role !== 'super_admin') {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.textContent = 'Access denied: this area is for the platform administrator only. Redirecting...';
        setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
        return;
      }
      loadDashboardData();
    } else {
      const stored = (function () {
        try { return sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user'); } catch (e) { return null; }
      })();
      const isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
      const maxAttempts = isCap ? 12 : 6;
      if (stored) {
        document.body.insertAdjacentHTML('beforeend', \`
          <div id="authWaitOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:99999;">
             <i class="fas fa-spinner fa-spin" style="font-size:3rem; color:#E08020; margin-bottom:20px;"></i>
             <h3 style="font-family:'Fredoka One', cursive; color:#ffffff;">Restoring Session...</h3>
             <p style="color:#cbd5e1;">Please wait</p>
          </div>
        \`);
        let restored = false;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(function (r) { setTimeout(r, 1000); });
          if (auth.currentUser) { restored = true; break; }
        }
        const waitOverlay = document.getElementById('authWaitOverlay');
        if (waitOverlay) waitOverlay.remove();
        if (restored) return;
      }

      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.textContent = 'Please log in first to access the database. Redirecting...';
      setTimeout(() => {
        window.location.href = 'auth.html';
      }, 2000);
    }
  });


  // ── Value Economy — the price list ──────────────────────────────────────
  //
  // The concept's rule, and the reason this screen exists at all: "points must
  // be changeable from the Super Admin panel, never hard-coded." The table in
  // valueEconomy.ts is a seed; a /credit_categories document overrides it, and
  // this is where those documents are written.
  //
  // An override is stored ONLY when it differs from the built-in price. That
  // keeps the collection to the handful of rows a school actually changed, and
  // it means clearing a box genuinely restores the default rather than pinning
  // today's default forever as an override.

  /** Overrides as loaded, keyed by category id: { points, is_active }. */
  let veStored = {};

  const veSeedOf = (id) => {
    const cat = valueCategory(id);
    return cat ? cat.points : null;
  };

  async function veAdminLoad() {
    const chip = document.getElementById('veAdminChip');
    veStored = {};
    try {
      const snap = await getDocs(collection(db, 'credit_categories'));
      snap.forEach((d) => {
        const data = d.data() || {};
        veStored[d.id] = {
          points: typeof data.points === 'number' ? data.points : null,
          is_active: data.is_active !== false
        };
      });
      if (chip) {
        const edited = Object.keys(veStored).length;
        chip.textContent = edited
          ? edited + ' of ' + VALUE_CATEGORIES.length + ' customised'
          : 'All at built-in prices';
      }
    } catch (e) {
      console.error('[Value Economy] Could not read the price list:', e);
      if (chip) chip.textContent = 'Could not load';
    }
    veAdminRender();
  }

  function veAdminRender() {
    const el = document.getElementById('veAdminTable');
    if (!el) return;

    el.innerHTML = VALUE_CATEGORIES.map((cat) => {
      const house = clubHouse(cat.house);
      const dot = house ? house.color : '#94a3b8';
      const stored = veStored[cat.id] || {};
      const value = typeof stored.points === 'number' ? stored.points : '';
      const active = stored.is_active !== false;

      return '<div class="ve-admin-row' + (active ? '' : ' is-off') + '" id="veAdminRow_' + cat.id + '">' +
        '<span class="ve-admin-dot" style="background:' + dot + ';"></span>' +
        '<span class="ve-admin-names">' +
          '<span class="ve-admin-name">' + esc(cat.name) + '</span>' +
          '<span class="ve-admin-name-ur">' + esc(cat.nameUr) + '</span>' +
        '</span>' +
        '<span class="ve-admin-seed">built-in ' + cat.points + '</span>' +
        '<input type="number" min="0" max="' + VE_MAX_POINTS + '" step="5"' +
          ' id="veAdminInput_' + cat.id + '" value="' + value + '"' +
          ' placeholder="' + cat.points + '"' +
          ' oninput="window.veAdminDirty()">' +
        '<label class="ve-admin-active">' +
          '<input type="checkbox" id="veAdminActive_' + cat.id + '"' + (active ? ' checked' : '') +
            ' onchange="window.veAdminDirty()">' +
          '<span>Awardable</span>' +
        '</label>' +
      '</div>';
    }).join('');

    window.veAdminDirty();
  }

  /** What is on screen right now, per category. */
  function veAdminReadForm() {
    return VALUE_CATEGORIES.map((cat) => {
      const input = document.getElementById('veAdminInput_' + cat.id);
      const active = document.getElementById('veAdminActive_' + cat.id);
      const raw = input ? String(input.value).trim() : '';
      return {
        id: cat.id,
        seed: cat.points,
        // Blank means "no override" — the built-in price stands.
        points: raw === '' ? null : Number(raw),
        is_active: active ? active.checked : true
      };
    });
  }

  /**
   * Mark rows that differ from what is saved, and gate the save button.
   *
   * A price outside 0..VE_MAX_POINTS is refused here as well as in the
   * callable — the callable already ignores a nonsense price and falls back to
   * the seed, so without this an admin could type 5000, see it saved, and
   * never find out that no award ever used it.
   */
  window.veAdminDirty = () => {
    const rows = veAdminReadForm();
    let changed = 0;
    let invalid = 0;

    rows.forEach((row) => {
      const stored = veStored[row.id] || {};
      const storedPoints = typeof stored.points === 'number' ? stored.points : null;
      const storedActive = stored.is_active !== false;

      const bad = row.points !== null &&
        (!Number.isFinite(row.points) || row.points < 0 || row.points > VE_MAX_POINTS);
      if (bad) invalid++;

      // Typing the built-in price is not an override — saving would clear the
      // document, not write one. Normalising here keeps what the screen says
      // in step with what Save actually does, instead of reporting a change
      // that then leaves the box blank for no visible reason.
      const effective = row.points === row.seed ? null : row.points;
      const differs = effective !== storedPoints || row.is_active !== storedActive;
      if (differs) changed++;

      const el = document.getElementById('veAdminRow_' + row.id);
      if (el) {
        el.classList.toggle('is-changed', differs && !bad);
        el.classList.toggle('is-off', !row.is_active);
        el.style.borderColor = bad ? '#dc2626' : '';
      }
    });

    const status = document.getElementById('veAdminStatus');
    const save = document.getElementById('veAdminSave');
    if (status) {
      status.classList.remove('is-saved');
      if (invalid) {
        status.textContent = invalid + ' price' + (invalid === 1 ? '' : 's') + ' must be between 0 and ' + VE_MAX_POINTS;
        status.classList.add('is-dirty');
      } else if (changed) {
        status.textContent = changed + ' change' + (changed === 1 ? '' : 's') + ' not saved';
        status.classList.add('is-dirty');
      } else {
        status.textContent = 'No unsaved changes';
        status.classList.remove('is-dirty');
      }
    }
    if (save) save.disabled = invalid > 0 || changed === 0;
  };

  window.veAdminSave = async () => {
    const rows = veAdminReadForm();
    const save = document.getElementById('veAdminSave');
    const status = document.getElementById('veAdminStatus');

    const retiring = rows.filter((r) => !r.is_active).map((r) => r.id);
    if (retiring.length && !confirm(
      retiring.length + ' categor' + (retiring.length === 1 ? 'y' : 'ies') +
      ' will stop being awardable.\\n\\nEntries students have already filed under them cannot be awarded and the Council will see them marked "retired".'
    )) {
      return;
    }

    if (save) save.disabled = true;
    if (status) { status.textContent = 'Saving…'; status.classList.remove('is-saved'); }

    try {
      const batch = writeBatch(db);
      const next = {};

      rows.forEach((row) => {
        const ref = doc(db, 'credit_categories', row.id);
        const overridesPrice = row.points !== null && row.points !== row.seed;

        if (!overridesPrice && row.is_active) {
          // Back to the built-in price and awardable: the override has nothing
          // left to say, so it is removed rather than left behind pinning
          // today's default as tomorrow's override.
          batch.delete(ref);
          return;
        }

        const payload = { is_active: row.is_active };
        if (overridesPrice) payload.points = row.points;
        // Written for a human reading the collection directly, never read back
        // by the callable — which prices from the id alone.
        payload.name = (valueCategory(row.id) || {}).name || row.id;
        payload.updated_at = new Date().toISOString();

        batch.set(ref, payload, { merge: true });
        next[row.id] = { points: overridesPrice ? row.points : null, is_active: row.is_active };
      });

      await batch.commit();
      veStored = next;
      veAdminRender();

      if (status) {
        status.textContent = 'Saved. New awards use these prices from now on.';
        status.classList.remove('is-dirty');
        status.classList.add('is-saved');
      }
      const chip = document.getElementById('veAdminChip');
      if (chip) {
        const edited = Object.keys(veStored).length;
        chip.textContent = edited
          ? edited + ' of ' + VALUE_CATEGORIES.length + ' customised'
          : 'All at built-in prices';
      }
    } catch (e) {
      console.error('[Value Economy] Could not save the price list:', e);
      alert('Could not save those prices: ' + (e && e.message ? e.message : 'unknown error'));
      if (status) { status.textContent = 'Not saved'; status.classList.add('is-dirty'); }
      if (save) save.disabled = false;
    }
  };

  /** Clear every override, putting all twelve back to their built-in price. */
  window.veAdminReset = () => {
    if (!confirm('Put all ' + VALUE_CATEGORIES.length + ' categories back to their built-in prices and make them all awardable?')) return;
    VALUE_CATEGORIES.forEach((cat) => {
      const input = document.getElementById('veAdminInput_' + cat.id);
      const active = document.getElementById('veAdminActive_' + cat.id);
      if (input) input.value = '';
      if (active) active.checked = true;
    });
    // Not saved yet on purpose — the admin still has to press Save, and can
    // walk away from a mis-click without having changed anything.
    window.veAdminDirty();
  };

  // Sidebar Navigation Logic
  document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('#sidebar-menu .nav-item');
    const secStats = document.getElementById('dash-stats');
    const secGraph = document.getElementById('dash-graph');
    const secSchools = document.getElementById('dash-schools');
    const secReports = document.getElementById('dash-reports');
    const secComingSoon = document.getElementById('coming-soon-section');
    const secValueEconomy = document.getElementById('dash-value-economy');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const target = item.getAttribute('data-target');

        // Hide everything first
        secStats.style.display = 'none';
        secGraph.style.display = 'none';
        secSchools.style.display = 'none';
        secReports.style.display = 'none';
        secComingSoon.style.display = 'none';
        if (secValueEconomy) secValueEconomy.style.display = 'none';

        // Show appropriate sections
        if (target === 'dashboard') {
          secStats.style.display = 'grid';
          secGraph.style.display = 'block';
          secSchools.style.display = 'block';
        } else if (target === 'schools' || target === 'admins') {
          secSchools.style.display = 'block';
        } else if (target === 'reports') {
          secReports.style.display = 'block';
        } else if (target === 'value-economy') {
          secValueEconomy.style.display = 'block';
          // Re-read on every open rather than caching: another HQ admin may
          // have repriced something since this tab was left open, and saving
          // over a stale copy would silently undo their change.
          veAdminLoad();
        } else {
          secComingSoon.style.display = 'block';
        }
      });
    });

    // Graph Filter Logic — uses REAL data from Firestore
    const filterTabs = document.querySelectorAll('.filter-tab');
    const graphContainers = document.querySelectorAll('#dash-graph .graph-bar-container');

    // Build real growth data from loaded Firestore data
    function buildGrowthData(schools, users) {
      // Per-school distribution (actual registered counts)
      const perSchool = schools.map(school => {
        let stu = 0, tch = 0;
        users.forEach(u => {
          if (u.school_id === school.id) {
            if (u.role === 'student') stu++;
            if (u.role === 'teacher') tch++;
          }
        });
        return { name: school.name || 'Unnamed', stu, tch };
      }).sort((a, b) => (b.stu + b.tch) - (a.stu + a.tch));

      // Individual students (no school)
      const indivStudents = users.filter(u => u.role === 'individual').length;

      // Normalize to percentage (max = 100%)
      const allCounts = perSchool.map(s => Math.max(s.stu, s.tch));
      if (indivStudents > 0) allCounts.push(indivStudents);
      const maxVal = Math.max(...allCounts, 1);

      const bars = [];
      perSchool.slice(0, 5).forEach(s => {
        bars.push({
          l: s.name.length > 8 ? s.name.substring(0, 8) + '…' : s.name,
          s: Math.round((s.stu / maxVal) * 100),
          t: Math.round((s.tch / maxVal) * 100),
          rawS: s.stu,
          rawT: s.tch
        });
      });

      if (indivStudents > 0 && bars.length < 6) {
        bars.push({
          l: 'Individual',
          s: Math.round((indivStudents / maxVal) * 100),
          t: 0,
          rawS: indivStudents,
          rawT: 0
        });
      }

      // Pad to 6 slots if needed
      while (bars.length < 6) bars.push({ l: '', s: 0, t: 0, rawS: 0, rawT: 0 });

      return bars;
    }

    const realBars = buildGrowthData(schools, users);

    // Render real data into the bar chart
    graphContainers.forEach((container, i) => {
      if (realBars[i] && realBars[i].l !== '') {
        container.style.display = 'flex';
        const schoolBar = container.querySelector('.schools');
        const studentBar = container.querySelector('.students');
        const tooltip = container.querySelector('.graph-tooltip');
        const label = container.querySelector('.graph-label');

        schoolBar.style.height = realBars[i].s + '%';
        studentBar.style.height = realBars[i].t + '%';
        label.textContent = realBars[i].l;
        tooltip.textContent = realBars[i].l + ': ' + realBars[i].rawS + ' Students, ' + realBars[i].rawT + ' Teachers';
      } else {
        container.style.display = 'none';
      }
    });

    // Hide filter tabs since data is now live (no time-range filtering without timestamps)
    filterTabs.forEach(tab => {
      tab.style.opacity = '0.5';
      tab.style.pointerEvents = 'none';
    });
    // Mark the first tab as the only active one with a label change
    if (filterTabs.length > 0) {
      filterTabs.forEach(t => t.classList.remove('active'));
      filterTabs[0].textContent = 'Live';
      filterTabs[0].classList.add('active');
      filterTabs[0].style.opacity = '1';
    }
    // Live Search Functionality
    const searchInput = document.getElementById('dashboard-search');
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#schools-table-body tr');
      
      rows.forEach(row => {
        // Don't filter the "No data" or "Loading" rows
        if (row.cells.length === 1) return;
        
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(term)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });

    // Profile Dropdown & Logout Logic
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      profileDropdown.style.display = 'none';
    });

    document.getElementById('logout-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        localStorage.removeItem('auth_user');
        window.location.href = 'auth.html';
      } catch (err) {
        alert("Error logging out: " + err.message);
      }
    });

  });

</script>
`
