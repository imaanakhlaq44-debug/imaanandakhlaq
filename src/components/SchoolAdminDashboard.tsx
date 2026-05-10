import { html } from 'hono/html'

export const SchoolAdminDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');

  :root {
    --admin-bg-start: #07111d;
    --admin-bg-end: #162b49;
    --admin-blue: #29416d;
    --admin-blue-deep: #1d3156;
    --admin-accent: #cf296d;
    --admin-accent-soft: #ea8300;
    --admin-accent-gold: #cb955d;
    --admin-navy: #243d6b;
    --admin-sidebar: #21375f;
    --admin-ink: #16233b;
    --admin-muted: #6b7a90;
    --admin-surface: #f2f6fb;
    --admin-surface-alt: #ffffff;
    --admin-line: #dce5f0;
    --admin-border-strong: rgba(148,163,184,0.3);
    --admin-shadow: 0 22px 60px rgba(8,18,37,0.2);
    --admin-soft-shadow: 0 10px 28px rgba(15,23,42,0.08);
  }

  * {
    box-sizing: border-box;
  }

  .admin-page,
  .login-wrapper {
    position: relative;
    min-height: 100vh;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(214,54,120,0.22), transparent 30%),
      radial-gradient(circle at bottom right, rgba(245,158,11,0.18), transparent 24%),
      linear-gradient(135deg, var(--admin-bg-start), var(--admin-bg-end));
    font-family: 'Nunito', sans-serif;
    color: var(--admin-ink);
  }

  .admin-page {
    padding: 0;
    align-items: stretch;
  }

  .admin-page::before {
    display: none;
  }

  .admin-page::before,
  .login-wrapper::before {
    content: '';
    position: absolute;
    inset: 18px;
    border-radius: 34px;
    border: 1px solid rgba(255,255,255,0.08);
    background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
    pointer-events: none;
  }

  .login-card {
    position: relative;
    z-index: 1;
    width: min(100%, 520px);
    padding: 2.4rem 2rem;
    border-radius: 30px;
    background: rgba(247,249,252,0.93);
    backdrop-filter: blur(24px);
    box-shadow: var(--admin-shadow);
    border: 1px solid rgba(255,255,255,0.6);
    text-align: left;
  }

  .login-visual {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .login-visual img {
    width: 150px;
    height: 150px;
    object-fit: contain;
    filter: drop-shadow(0 16px 26px rgba(29,49,86,0.28));
  }

  .login-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: rgba(214,54,120,0.1);
    color: var(--admin-accent);
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .login-title {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: clamp(2rem, 4vw, 2.6rem);
    font-weight: 800;
    color: var(--admin-ink);
  }

  .login-subtitle {
    margin: 0.8rem 0 1.5rem;
    color: var(--admin-muted);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.6;
  }

  .login-note {
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.95rem 1rem;
    border-radius: 18px;
    background: rgba(255,255,255,0.82);
    color: var(--admin-muted);
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid rgba(226,232,240,0.92);
  }

  .input-light,
  .form-input {
    width: 100%;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(203,213,225,0.95);
    background: rgba(255,255,255,0.96);
    color: var(--admin-ink);
    font-family: 'Nunito', sans-serif;
    font-size: 0.98rem;
    font-weight: 700;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }

  .input-light:focus,
  .form-input:focus {
    border-color: rgba(214, 54, 120, 0.5);
    box-shadow: 0 0 0 4px rgba(214, 54, 120, 0.12);
    transform: translateY(-1px);
  }

  .input-light::placeholder,
  .form-input::placeholder {
    color: #94a3b8;
  }

  .btn-primary-light,
  .btn-solid {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border: none;
    padding: 0.9rem 1.2rem;
    border-radius: 16px;
    font-family: 'Sora', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
    background: linear-gradient(135deg, #d63678 0%, #e46c2e 58%, #f59e0b 100%);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 18px 34px rgba(214, 54, 120, 0.28);
  }

  .btn-primary-light {
    width: 100%;
  }

  .btn-primary-light:hover,
  .btn-solid:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 42px rgba(214, 54, 120, 0.32);
  }

  .btn-outline-light {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.98));
    border: 1px solid rgba(148,163,184,0.26);
    color: #0f172a;
    padding: 0.85rem 1rem;
    border-radius: 16px;
    font-family: 'Sora', sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s;
    box-shadow: 0 10px 20px rgba(15,23,42,0.08);
  }

  .btn-outline-light:hover {
    background: #ffffff;
    border-color: rgba(16,35,63,0.22);
    color: #10233f;
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(15,23,42,0.1);
  }

  .app-container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: none;
    min-height: 100vh;
    background: linear-gradient(180deg, #dfeafa 0%, #eef4fb 100%);
    backdrop-filter: blur(16px);
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    display: grid;
    grid-template-columns: 218px minmax(0, 1fr);
    border: none;
  }

  .app-container::before {
    display: none;
  }

  .top-nav {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.9rem;
    padding: 0.9rem 0.75rem;
    background: linear-gradient(180deg, var(--admin-sidebar) 0%, #123354 55%, #102744 100%);
    border-right: 1px solid rgba(255,255,255,0.08);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    padding: 0.25rem 0.35rem 0.95rem;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }

  .brand-mark {
    width: 58px;
    height: 58px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.22);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.16), 0 12px 28px rgba(29,49,86,0.28);
  }

  .brand-mark img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .brand-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .brand-title-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
  }

  .brand-kicker {
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.62);
    margin-bottom: 0.15rem;
  }

  .brand-title {
    font-family: 'Sora', sans-serif;
    font-size: 1.08rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
  }

  .brand-status {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.92);
    border: 1px solid rgba(255,255,255,0.12);
    font-size: 0.68rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .brand-status i {
    font-size: 0.55rem;
    color: #34d399;
  }

  .nav-center {
    min-width: 0;
    display: flex;
    justify-content: flex-start;
    flex: 1 1 auto;
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.42rem;
    list-style: none;
    margin: 0;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    white-space: normal;
  }

  .nav-links li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.72rem 0.85rem;
    border-radius: 12px;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    font-size: 0.82rem;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .nav-links li::before {
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #ffffff;
    border-radius: 8px;
    font-size: 0.8rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  }

  #nav-overview::before {
    content: '\f3fd';
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
  }

  #nav-teachers::before {
    content: '\f51c';
    background: linear-gradient(180deg, #f29a2a 0%, #ea8300 100%);
  }

  #nav-students::before {
    content: '\f501';
    background: linear-gradient(180deg, #dd4a83 0%, #cf296d 100%);
  }

  #nav-attendance::before {
    content: '\f073';
    background: linear-gradient(180deg, #d8a26d 0%, #cb955d 100%);
  }

  #nav-settings::before {
    content: '\f013';
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
  }

  .nav-links li:hover {
    background: rgba(255,255,255,0.08);
    color: #ffffff;
    transform: translateX(2px);
    border-color: rgba(255,255,255,0.12);
  }

  .nav-links li.active {
    color: #ffffff;
    background: rgba(255,255,255,0.1);
    box-shadow: 0 14px 28px rgba(7,17,29,0.18);
    border-color: rgba(255,255,255,0.16);
    font-weight: 700;
  }

  .nav-links li:hover::before,
  .nav-links li.active::before {
    color: #ffffff;
  }

  .nav-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: 0.65rem;
    min-width: 0;
    margin-top: auto;
  }

  .icon-btn {
    width: 100%;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .icon-btn:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.3);
    box-shadow: 0 12px 24px rgba(10,18,34,0.18);
  }

  .notification-pill {
    position: relative;
  }

  .notification-pill span {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #ef4444;
    color: white;
    font-size: 0.64rem;
    font-weight: 800;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #10233f;
  }

  .nav-profile {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 18px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: #ffffff;
    min-width: 0;
  }

  .nav-profile strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .nav-profile span {
    display: block;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.72);
    line-height: 1.1;
    margin-top: 0.2rem;
  }

  .avatar-mini {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    object-fit: cover;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.18);
  }

  .btn-logout {
    grid-column: 1 / -1;
    width: 100%;
    background: linear-gradient(135deg, rgba(214,54,120,0.92), rgba(239,123,69,0.88));
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 14px 28px rgba(214,54,120,0.22);
  }

  .btn-logout:hover {
    background: linear-gradient(135deg, rgba(214,54,120,1), rgba(239,123,69,0.96));
    color: #ffffff;
    border-color: rgba(255,255,255,0.22);
  }

  .btn-home-nav {
    grid-column: 1 / -1;
    width: 100%;
  }

  .main-content {
    position: relative;
    z-index: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 0.9rem;
    background: linear-gradient(180deg, #edf4fc 0%, #f7f9fc 100%);
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .workspace-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1.15rem;
    border-radius: 18px;
    background: linear-gradient(180deg, var(--admin-blue) 0%, var(--admin-blue-deep) 100%);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.26);
    box-shadow: 0 16px 32px rgba(21,75,146,0.22);
  }

  .workspace-heading {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
  }

  .workspace-brand-asset {
    width: 64px;
    height: 64px;
    flex: 0 0 64px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 16px 24px rgba(10,18,34,0.18);
  }

  .workspace-brand-asset img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sidebar-school-cam-badge {
    position: absolute;
    bottom: -4px;
    right: -4px;
    background: #ffffff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    border: 1px solid #e2e8f0;
  }

  .sidebar-school-cam-badge i {
    color: #29416d;
    font-size: 10px;
  }

  .section-shell {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    min-width: 0;
  }

  .section-asset {
    width: 62px;
    height: 62px;
    flex: 0 0 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #eef4fb 100%);
    border: 1px solid var(--admin-line);
    box-shadow: var(--admin-soft-shadow);
    overflow: hidden;
  }

  .section-asset img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 7px;
  }

  .section-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .workspace-title-group {
    display: flex;
    flex-direction: column;
    gap: 0.16rem;
    min-width: 0;
  }

  .workspace-kicker {
    font-family: 'Sora', sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255,255,255,0.72);
  }

  .workspace-title {
    font-family: 'Sora', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
  }

  .workspace-subtitle {
    color: rgba(255,255,255,0.82);
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.45;
  }

  .workspace-tools {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .workspace-tool {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.12);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s, border-color 0.2s;
  }

  .workspace-tool:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.26);
  }

  .workspace-admin-chip {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.45rem 0.8rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.18);
    min-width: 0;
  }

  .workspace-admin-chip i {
    font-size: 1.1rem;
    color: #ffffff;
  }

  .workspace-admin-chip strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .workspace-admin-chip span {
    display: block;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.7);
    margin-top: 0.12rem;
  }

  .tab-panel {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,251,253,0.98));
    border: 1px solid var(--admin-line);
    box-shadow: var(--admin-soft-shadow);
    border-radius: 16px;
    padding: 0.92rem 0.95rem;
  }

  .tab-panel::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: linear-gradient(90deg, var(--admin-navy) 0%, var(--admin-accent) 55%, var(--admin-accent-gold) 100%);
    pointer-events: none;
  }

  .tab-panel > * {
    position: relative;
    z-index: 1;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 0.85rem;
    padding-bottom: 0.72rem;
    border-bottom: 1px solid var(--admin-line);
    flex-wrap: wrap;
  }

  .section-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.55rem;
    padding: 0.42rem 0.7rem;
    border-radius: 999px;
    background: rgba(16,35,63,0.08);
    color: var(--admin-navy);
    font-family: 'Sora', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
  }

  .section-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.25rem, 1.8vw, 1.72rem);
    font-weight: 800;
    color: var(--admin-ink);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
  }

  .section-subtitle {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    color: var(--admin-muted);
    font-weight: 700;
    max-width: 36rem;
    line-height: 1.48;
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding: 0.45rem;
    border-radius: 18px;
    background: rgba(255,255,255,0.92);
    border: 1px solid var(--admin-line);
    box-shadow: none;
  }

  .class-filter-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 220px;
    padding: 0.68rem 0.82rem;
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid var(--admin-line);
  }

  .class-filter-label {
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: #64748b;
    padding-left: 0.2rem;
  }

  .class-filter-select {
    width: 100%;
    border: 1px solid rgba(203,213,225,0.9);
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
    color: var(--admin-ink);
    padding: 0.72rem 0.95rem;
    border-radius: 14px;
    font-family: 'Sora', sans-serif;
    font-size: 0.86rem;
    font-weight: 700;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
    outline: none;
    cursor: pointer;
  }

  .class-filter-select:focus {
    border-color: rgba(214, 54, 120, 0.38);
    box-shadow: 0 0 0 4px rgba(214,54,120,0.12);
  }

  .filter-summary {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--admin-muted);
    padding-left: 0.2rem;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.68rem 0.82rem;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid var(--admin-line);
    box-shadow: none;
    color: #334155;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .status-pill strong {
    font-family: 'Sora', sans-serif;
    font-size: 0.74rem;
    color: var(--admin-accent);
  }

  .layout-toggle {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid var(--admin-line);
    color: #64748b;
    box-shadow: none;
    cursor: pointer;
  }

  .dropdown-btn {
    border: 1px solid var(--admin-line);
    background: rgba(255,255,255,0.88);
    color: var(--admin-muted);
    padding: 0.5rem 0.8rem;
    border-radius: 12px;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 0.76rem;
    cursor: pointer;
    box-shadow: none;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) repeat(3, minmax(152px, 0.8fr));
    gap: 0.7rem;
    margin-bottom: 0.85rem;
  }

  /* ── Compact hero cards ── */
  .hero-card {
    border-radius: 14px;
    padding: 0.82rem;
    position: relative;
    overflow: hidden;
    border: 1px solid var(--admin-line);
    box-shadow: 0 2px 10px rgba(15,23,42,0.05);
  }

  .card-white {
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 1rem;
  }

  .hero-main-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 106px;
    gap: 0.85rem;
    padding: 0.98rem;
    background: linear-gradient(135deg, var(--admin-navy) 0%, #2b4677 54%, var(--admin-accent) 100%);
    color: #ffffff;
    border: none;
  }

  .hero-main-card .hero-tag {
    background: rgba(255,255,255,0.16);
    color: #ffffff;
  }

  .hero-main-card .hero-tag.soft {
    background: rgba(234,131,0,0.22);
    color: rgba(255,255,255,0.92);
  }

  .hero-main-card .stat-title,
  .hero-main-card .hero-primary-meta,
  .hero-main-card .metric-meta,
  .hero-main-card .hero-badge-card span {
    color: rgba(255,255,255,0.78);
  }

  .hero-main-card .stat-value-large,
  .hero-main-card .hero-badge-card strong {
    color: #ffffff;
  }

  .hero-main-copy {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.58rem;
    flex: 1 1 auto;
  }

  .hero-primary-meta {
    color: var(--admin-muted);
    font-size: 0.78rem;
    font-weight: 700;
    max-width: 22rem;
    line-height: 1.45;
  }

  .hero-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.42rem 0.68rem;
    border-radius: 999px;
    background: #eef4ff;
    color: #183355;
    font-size: 0.7rem;
    font-weight: 800;
    box-shadow: none;
  }

  .hero-tag.soft {
    background: #fff0f6;
    color: var(--admin-accent);
  }

  .hero-score-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.58rem;
  }

  .hero-visual {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
  }

  .hero-visual-ring {
    width: 100%;
    max-width: 96px;
    height: 96px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: rgba(255,255,255,0.12);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
  }

  .hero-visual-ring img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 14px;
  }

  .hero-badge-card {
    min-width: 0;
    padding: 0.58rem 0.64rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: none;
    text-align: center;
  }

  .hero-badge-card span {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    margin-bottom: 0.28rem;
  }

  .hero-badge-card strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 1.08rem;
    font-weight: 800;
    color: var(--admin-ink);
  }

  .card-white::after {
    display: none;
  }

  .stat-block {
    position: relative;
    z-index: 1;
    text-align: left;
  }

  .stat-title {
    font-family: 'Sora', sans-serif;
    font-size: 0.60rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 0.22rem;
  }
  .stat-value-large {
    font-family: 'Sora', sans-serif;
    font-size: 1.55rem;
    font-weight: 800;
    color: var(--admin-ink);
    line-height: 1;
  }

  /* Brand colour tokens — orange=teachers, pink=students, gold=tan */
  .card-green {
    background: linear-gradient(135deg, #f0a43d 0%, #d97706 100%);
    color: #ffffff;
  }
  .card-yellow {
    background: linear-gradient(135deg, #dd4a83 0%, #b91c5c 100%);
    color: #ffffff;
  }
  .card-orange {
    background: linear-gradient(135deg, #d6a16d 0%, #b07540 100%);
    color: #ffffff;
  }

  .tall-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .metric-card {
    position: relative;
    padding: 0.84rem;
    padding-right: 4.65rem;
    justify-content: space-between;
    box-shadow: none;
  }

  .metric-card-copy {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .metric-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: none;
  }

  .metric-label {
    font-family: 'Sora', sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    opacity: 0.82;
  }

  .metric-meta {
    font-size: 0.72rem;
    line-height: 1.38;
    font-weight: 700;
    opacity: 0.88;
  }

  .card-green .metric-icon,
  .card-yellow .metric-icon,
  .card-orange .metric-icon {
    color: #ffffff;
  }

  .metric-illustration {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    width: 58px;
    height: 58px;
    object-fit: contain;
    border-radius: 18px;
    filter: drop-shadow(0 14px 24px rgba(17,24,39,0.18));
  }

  .tall-stat {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.8rem, 2.8vw, 2.34rem);
    font-weight: 800;
    margin: 0;
    line-height: 0.92;
  }

  .tall-label {
    font-size: 0.82rem;
    font-weight: 700;
    opacity: 0.94;
    margin-top: 0.7rem;
    line-height: 1.45;
  }

  .subsection-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid var(--admin-line);
    flex-wrap: wrap;
  }

  .surface-note,
  .scope-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.72rem;
    border-radius: 999px;
    background: #f8fbff;
    border: 1px solid var(--admin-line);
    box-shadow: none;
    color: #475569;
    font-size: 0.74rem;
    font-weight: 800;
  }

  .scope-badge {
    color: var(--admin-accent);
  }

  .overview-lower-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(420px, 0.96fr);
    gap: 0.78rem;
    align-items: start;
  }

  .widget-panel {
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    padding: 0.82rem;
    box-shadow: var(--admin-soft-shadow);
  }

  .widget-panel.compact {
    padding: 0.78rem;
  }

  .widget-table-shell .subsection-toolbar {
    margin-bottom: 0.85rem;
  }

  .panel-stack {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .widget-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.72rem;
  }

  .widget-heading-main {
    display: flex;
    align-items: center;
    gap: 0.62rem;
    min-width: 0;
  }

  .widget-asset {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: linear-gradient(180deg, #f7fbff 0%, #eef4fb 100%);
    border: 1px solid var(--admin-line);
    overflow: hidden;
  }

  .widget-asset img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 5px;
  }

  .widget-heading strong {
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--admin-ink);
  }

  .widget-heading span {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--admin-muted);
  }

  .attendance-widget {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 0.7rem;
    align-items: center;
  }

  .attendance-ring {
    width: 102px;
    height: 102px;
    padding: 10px;
    border-radius: 50%;
    background: conic-gradient(var(--admin-navy) 0% 0%, var(--admin-accent-soft) 0% 0%, var(--admin-accent-gold) 0% 100%);
    display: grid;
    place-items: center;
  }

  .attendance-ring-center {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: inset 0 0 0 1px var(--admin-line);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .attendance-ring-center strong {
    font-family: 'Sora', sans-serif;
    font-size: 1.16rem;
    font-weight: 800;
    color: var(--admin-ink);
    line-height: 1;
  }

  .attendance-ring-center span {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--admin-muted);
    margin-top: 0.25rem;
  }

  .chart-legend {
    display: grid;
    gap: 0.55rem;
  }

  .chart-legend div {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.75rem;
    font-weight: 800;
    color: #405066;
  }

  .chart-legend strong {
    margin-left: auto;
    font-family: 'Sora', sans-serif;
    color: var(--admin-ink);
  }

  .legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: 0 0 10px;
  }

  .legend-swatch.present {
    background: var(--admin-navy);
  }

  .legend-swatch.absent {
    background: var(--admin-accent-soft);
  }

  .legend-swatch.leave {
    background: var(--admin-accent-gold);
  }

  .schedule-list {
    display: grid;
    gap: 0.6rem;
  }

  .schedule-item {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    padding: 0.6rem 0.68rem;
    border-radius: 12px;
    background: #f7fbff;
    border: 1px solid #e1ebf5;
  }

  .schedule-item span {
    display: block;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--admin-muted);
    margin-bottom: 0.18rem;
  }

  .schedule-item strong {
    display: block;
    color: var(--admin-ink);
    font-size: 0.82rem;
    font-weight: 800;
    line-height: 1.35;
  }

  .schedule-date {
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--admin-blue-deep);
    white-space: nowrap;
  }

  .notice-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.55rem;
  }

  .notice-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    color: #44556c;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.45;
  }

  .notice-list li::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(180deg, #49cc84 0%, #24a559 100%);
    flex: 0 0 8px;
    margin-top: 0.36rem;
  }

  .mix-bars {
    display: grid;
    gap: 0.65rem;
  }

  .mix-bar-row {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) 42px;
    gap: 0.55rem;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 800;
    color: #4d5d72;
  }

  .mix-bar-track {
    position: relative;
    height: 12px;
    border-radius: 999px;
    background: #edf3f9;
    overflow: hidden;
  }

  .mix-bar-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
  }

  .mix-bar-fill.students {
    background: linear-gradient(90deg, #ea5a8d 0%, var(--admin-accent) 100%);
  }

  .mix-bar-fill.teachers {
    background: linear-gradient(90deg, #f0a43d 0%, var(--admin-accent-soft) 100%);
  }

  .mix-bar-fill.pending {
    background: linear-gradient(90deg, #d6a16d 0%, var(--admin-accent-gold) 100%);
  }

  .table-header-row {
    display: flex;
    padding: 0 0.68rem 0.5rem;
    color: #64748b;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 0.61rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .col-1 { flex: 2; }
  .col-2 { flex: 1; text-align: center; }
  .col-3 { flex: 2; text-align: center; }
  .col-4 { flex: 1; text-align: center; }
  .col-5 { flex: 1; text-align: center; }
  .col-6 { flex: 1; text-align: center; }
  .col-actions { flex: 1; text-align: right; }

  #studentTableBody,
  #teacherTableBody,
  #studentDirectoryBody,
  #attendanceTableBody {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .pill-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.68rem 0.75rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.98);
    font-weight: 700;
    color: #334155;
    border: 1px solid var(--admin-line);
    box-shadow: none;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .pill-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(15,23,42,0.06);
    border-color: rgba(214,54,120,0.18);
  }

  .row-peach {
    background: linear-gradient(135deg, #fff7fb 0%, #fff2f8 100%);
  }

  .row-yellow {
    background: linear-gradient(135deg, #fffaf3 0%, #fff6e8 100%);
  }

  .row-green {
    background: linear-gradient(135deg, #f5fbfa 0%, #edf8f4 100%);
  }

  .progress-bar-container {
    background: rgba(255,255,255,0.9);
    border-radius: 14px;
    height: 32px;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    border: 1px solid var(--admin-line);
  }

  .progress-fill {
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    border-radius: 20px;
  }

  .progress-text {
    position: relative;
    z-index: 2;
    margin-left: 15px;
    font-weight: 800;
  }

  .circle-badge {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 0.85rem;
    font-weight: 800;
    margin: 0 5px;
  }

  .bg-orange { background: #E08020; }
  .bg-yellow { background: #C99A6B; }
  .bg-green { background: #D63678; }

  .action-btn {
    width: auto;
    min-width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid var(--admin-line);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 800;
    color: #475569;
    padding: 0 0.72rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    gap: 0.38rem;
    transition: color 0.2s, transform 0.2s, border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .action-btn i {
    font-size: 0.82rem;
  }
  .action-btn:hover {
    color: var(--admin-accent);
    transform: translateY(-1px);
    border-color: rgba(214,54,120,0.28);
    background: #ffffff;
    box-shadow: 0 8px 18px rgba(15,23,42,0.08);
  }

  .pill-row .col-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.55rem;
  }

  .action-btn.text-danger {
    color: #dc2626;
    background: linear-gradient(180deg, #fff5f5, #fee2e2);
    border-color: rgba(248,113,113,0.28);
  }

  .action-btn.text-danger:hover {
    color: #991b1b;
    border-color: rgba(220,38,38,0.35);
    background: #fff1f2;
  }

  .action-btn.delete:hover {
    color: #ef4444;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 999;
    padding: 1rem;
    overflow-y: auto;
  }

  .modal-content {
    position: relative;
    margin: auto;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    padding: 30px;
    border-radius: 28px;
    width: min(100%, 540px);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: var(--admin-shadow);
    border: 1px solid rgba(255,255,255,0.65);
  }

  .modal-content.modal-wide {
    width: min(100%, 760px);
  }

  .modal-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(226,232,240,0.9);
  }

  .modal-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.7rem;
    border-radius: 999px;
    background: rgba(16,35,63,0.06);
    color: #10233f;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.8rem;
  }

  .modal-title {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: 1.45rem;
    font-weight: 800;
    color: #0f172a;
  }

  .modal-subtitle {
    margin: 0.5rem 0 0;
    color: #64748b;
    font-size: 0.92rem;
    font-weight: 700;
    max-width: 28rem;
  }

  .modal-close {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(203,213,225,0.92);
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(15,23,42,0.08);
  }

  .modal-close:hover {
    color: var(--admin-accent);
    border-color: rgba(214,54,120,0.28);
  }

  .modal-photo-picker {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 3px solid #e2e8f0;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    box-shadow: 0 10px 25px rgba(15,23,42,0.1);
    position: relative;
  }

  .modal-photo-picker:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: #cbd5e1;
    box-shadow: 0 14px 28px rgba(15,23,42,0.15);
  }

  .modal-photo-picker::after {
    content: '\f030';
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: #ffffff;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #29416d;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    border: 1px solid #e2e8f0;
    pointer-events: none;
    transition: background 0.2s;
  }
  .modal-photo-picker:hover::after {
    background: #f8fafc;
  }

  .class-chip-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: 0.4rem;
  }

  .class-chip {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 0.95rem;
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid rgba(203,213,225,0.88);
    box-shadow: 0 10px 18px rgba(15,23,42,0.05);
    font-weight: 800;
    color: #334155;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .class-chip:hover {
    transform: translateY(-1px);
    border-color: rgba(214,54,120,0.28);
    box-shadow: 0 14px 22px rgba(15,23,42,0.08);
  }

  .class-chip input {
    width: 16px;
    height: 16px;
    accent-color: #d63678;
    margin: 0;
  }

  .modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem 30px 0.2rem;
    margin-left: -30px;
    margin-right: -30px;
    margin-bottom: -10px;
    border-top: 1px solid rgba(226,232,240,0.9);
    background: linear-gradient(180deg, rgba(248,250,252,0.15) 0%, #f8fafc 18%, #f8fafc 100%);
    position: sticky;
    bottom: -30px;
  }

  .modal-content::-webkit-scrollbar {
    width: 10px;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,0.45);
    border-radius: 999px;
  }

  .form-group {
    margin-bottom: 15px;
    text-align: left;
  }

  .form-group label {
    display: block;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    margin-bottom: 6px;
    color: #475569;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .form-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #d6dee8;
    border-radius: 14px;
    background: #f8fafc;
    color: #334155;
    font-weight: 700;
    outline: none;
  }

  .fade-in {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .copyable-code {
    background: rgba(255,255,255,0.9);
    padding: 5px 10px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    box-shadow: none;
    transition: all 0.2s;
    border: 1px solid var(--admin-line);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1e293b;
    font-weight: 800;
  }

  .copyable-code:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(15,23,42,0.08);
    background: #ffffff;
    color: var(--admin-accent);
    border-color: rgba(214,54,120,0.3);
  }

  .copyable-code.copied {
    background: #22c55e;
    color: white;
    border-color: #22c55e;
  }

  .settings-panel {
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border-radius: 20px;
    padding: 1.35rem;
    max-width: 720px;
    box-shadow: none;
    border: 1px solid var(--admin-line);
  }

  #tab-attendance .hero-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    margin-bottom: 1rem !important;
  }

  #tab-attendance .hero-card {
    min-height: 114px;
  }

  .attendance-summary-card {
    min-height: 116px;
  }

  .summary-card-illustration {
    width: 72px;
    height: 72px;
    object-fit: contain;
    filter: drop-shadow(0 14px 22px rgba(17,24,39,0.16));
  }

  @media (max-width: 1180px) {
    .app-container {
      grid-template-columns: 200px minmax(0, 1fr);
    }
    .hero-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .hero-main-card {
      grid-column: 1 / -1;
    }
    .overview-lower-grid {
      grid-template-columns: 1fr;
    }
    .panel-stack {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ── Mobile: off-canvas sidebar + bottom nav ── */
  .mobile-menu-btn {
    display: none;
    position: fixed;
    top: 12px; left: 12px;
    z-index: 1100;
    width: 42px; height: 42px;
    border-radius: 11px;
    border: none;
    background: var(--admin-blue);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }
  .mobile-menu-btn:hover { transform: scale(1.06); }
  .mobile-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(15,23,42,0.55);
    backdrop-filter: blur(4px);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .mobile-overlay.active { display: block; opacity: 1; }
  .admin-mobile-bottom {
    display: none;
  }

  @media (max-width: 900px) {
    .mobile-menu-btn { display: flex; }

    /* Sidebar: fixed off-canvas drawer */
    .app-container {
      grid-template-columns: 1fr;
    }
    .top-nav {
      position: fixed;
      left: -270px;
      top: 0; height: 100vh;
      width: 250px;
      z-index: 1050;
      transition: left 0.32s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: none;
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      border-right: none;
      border-bottom: none;
    }
    .top-nav.open {
      left: 0;
      box-shadow: 8px 0 28px rgba(0,0,0,0.3);
    }

    /* Main content: full width, pad top for hamburger */
    .main-content {
      padding: 0.75rem;
      padding-top: 64px;
      padding-bottom: 72px;
    }

    /* Hero grid: 2-col */
    .hero-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0.55rem;
    }
    .hero-main-card {
      grid-column: 1 / -1;
      grid-template-columns: 1fr;
    }
    .hero-visual { display: none; } /* hide illustration on mobile */
    .hero-score-grid { grid-template-columns: repeat(2, 1fr); }
    .metric-illustration { display: none; }

    /* Overview lower: single col */
    .overview-lower-grid { grid-template-columns: 1fr !important; }
    .panel-stack { grid-template-columns: 1fr; }

    /* Table */
    .table-header-row { display: none; }
    .pill-row { flex-wrap: wrap; align-items: flex-start; }
    .col-1,.col-2,.col-3,.col-4,.col-5,.col-6 { flex: 1 1 calc(50% - 0.35rem); text-align: left; }
    .col-actions { flex: 1 1 100%; }

    .modal-content { padding: 18px; border-radius: 20px; max-height: calc(100vh - 1.5rem); }
    .modal-footer-actions { padding: 0 18px; margin: 0 -18px; bottom: -18px; }
    .class-chip-list { grid-template-columns: 1fr; }

    /* Bottom mobile navigation */
    .admin-mobile-bottom {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #ffffff;
      border-top: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 -4px 14px rgba(30,45,90,0.1);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 8px 4px calc(8px + env(safe-area-inset-bottom)) 4px;
    }
    .adm-mob-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 3px; background: transparent; border: none;
      color: #64748b; font-size: 10px; font-weight: 700;
      font-family: 'Sora', sans-serif; cursor: pointer; flex: 1;
    }
    .adm-mob-btn i { font-size: 17px; padding: 5px; border-radius: 8px; background: #f1f5f9; color: #334155; }
    .adm-mob-btn.active i { color: #fff; background: var(--admin-blue); }
    .adm-mob-btn.active { color: var(--admin-blue); }
    .adm-mob-btn.danger i { color: #fff; background: #dc2626; }
  }

  @media (max-width: 640px) {
    .hero-grid {
      grid-template-columns: 1fr !important;
    }
    .hero-score-grid { grid-template-columns: 1fr; }
    .section-title { font-size: 1.2rem; }
    .workspace-topbar { flex-wrap: wrap; }
    .workspace-tools { width: 100%; justify-content: flex-end; }
    .workspace-admin-chip { width: 100%; }
    .section-actions, .class-filter-wrap { width: 100%; }
    .section-asset { width: 32px; height: 32px; flex: 0 0 32px; }
    .nav-actions { display: none; } /* bottom bar handles these on small screens */
    .login-card { padding: 1.6rem 1.2rem; }
  }

      width: 54px;
      height: 54px;
      flex-basis: 54px;
    }

    .overview-lower-grid {
      gap: 0.75rem;
    }

    .modal-topbar {
      flex-direction: column;
    }

    .modal-close {
      align-self: flex-end;
    }

    .modal-footer-actions {
      flex-direction: column-reverse;
    }

    .modal-footer-actions .btn-solid,
    .modal-footer-actions .btn-outline-light {
      width: 100%;
    }

    .col-1,
    .col-2,
    .col-3,
    .col-4,
    .col-5,
    .col-6,
    .col-actions {
      flex: 1 1 100%;
    }

    .login-card {
      padding: 1.8rem 1.35rem;
    }

    .login-visual img {
      width: 124px;
      height: 124px;
    }
  }
</style>

<!-- LOGIN VIEW (hidden by default to avoid popup after /auth login) -->
<div id="adminLoginView" class="login-wrapper d-none">
  <div class="login-card">
    <div class="login-visual">
      <img src="/kidba_assets/img/3d_school.png" alt="School 3D icon">
    </div>
    <div class="login-chip"><i class="fas fa-shield-alt"></i> Secure admin access</div>
    <h2 class="login-title">School Admin Workspace</h2>
    <p class="login-subtitle">Review performance, enroll students and manage teachers from one polished control center.</p>
    <input type="email" id="adminEmailInput" class="input-light mb-3" placeholder="you@school.edu">
    <input type="password" id="adminPasswordInput" class="input-light mb-4" placeholder="Password">
    <button class="btn-primary-light" onclick="attemptAdminLogin()"><i class="fas fa-right-to-bracket"></i> Sign In</button>
    <div class="login-note">
      <i class="fas fa-circle-info" style="color:#cf296d; margin-top:0.2rem;"></i>
      <span>Use your school admin email and password. If you already signed in from the auth page, this dashboard opens automatically.</span>
    </div>
  </div>
</div>

<!-- DASHBOARD VIEW -->
<div id="adminDashboardView" class="admin-page d-none">
  <!-- Mobile hamburger -->
  <button class="mobile-menu-btn" id="adminMenuBtn" aria-label="Toggle menu">
    <i class="fas fa-bars"></i>
  </button>
  <!-- Overlay -->
  <div class="mobile-overlay" id="adminOverlay"></div>
  
  <div class="app-container">
    <!-- TOP NAV -->
    <div class="top-nav" id="adminSidebar">
      <div class="nav-brand">
        <div class="brand-mark"><img src="/kidba_assets/img/3d_school.png" alt="School 3D icon"></div>
        <div class="brand-copy">
          <div class="brand-kicker">Imaan & Akhlaq</div>
          <div class="brand-title-row">
            <div class="brand-title">School Management System</div>
            <span class="brand-status"><i class="fas fa-circle"></i> Live campus</span>
          </div>
        </div>
      </div>
      <div class="nav-center">
        <ul class="nav-links">
          <li class="active" id="nav-overview" onclick="switchAdminTab('overview')">Dashboard</li>
          <li id="nav-teachers" onclick="switchAdminTab('teachers')">Teachers</li>
          <li id="nav-students" onclick="switchAdminTab('students')">Students</li>
          <li id="nav-attendance" onclick="switchAdminTab('attendance')">Attendance</li>
          <li id="nav-settings" onclick="switchAdminTab('settings')">Settings</li>
        </ul>
      </div>
      <div class="nav-actions">
        <div class="nav-profile">
          <img src="https://ui-avatars.com/api/?name=Admin&background=243d6b&color=fff" class="avatar-mini">
          <div>
            <strong id="navAdminName">School Admin</strong>
            <span>Administrator access</span>
          </div>
        </div>
        <button class="btn-outline-light btn-home-nav" type="button" onclick="window.location.href='auth.html'"><i class="fas fa-house"></i><span>Home</span></button>
        <button class="btn-outline-light btn-logout" type="button" onclick="logoutAdmin()"><i class="fas fa-sign-out-alt"></i><span>Log out</span></button>
      </div>
    </div>

    <!-- MAIN AREA -->
    <div class="main-content">
      <div class="workspace-topbar">
        <div class="workspace-heading">
            <div class="workspace-brand-asset" id="schoolAdminLogoClickArea" title="Click to change school logo" role="button" tabindex="0" style="position:relative; cursor:pointer; overflow:visible;">
              <img id="schoolAdminLogoImg" src="/kidba_assets/img/3d_school.png" alt="School logo" style="width:100%; height:100%; object-fit:cover; border-radius:18px;">
              <div class="sidebar-school-cam-badge"><i class="fas fa-camera"></i></div>
            </div>
            <input id="schoolAdminLogoInput" type="file" accept="image/*" class="d-none">
            <div class="workspace-title-group">
            <span class="workspace-kicker">Imaan &amp; Akhlaq ERP</span>
            <div class="workspace-title">School Management System</div>
            <div class="workspace-subtitle">Compact academic operations dashboard inspired by classic school ERP layouts.</div>
          </div>
        </div>
        <div class="workspace-tools">
          <button class="workspace-tool" type="button" aria-label="Search"><i class="fas fa-search"></i></button>
          <button class="workspace-tool notification-pill" type="button" aria-label="Notifications">
            <i class="far fa-bell"></i>
            <span>3</span>
          </button>
          <div class="workspace-admin-chip">
            <i class="fas fa-user-circle"></i>
            <div>
              <strong id="workspaceAdminName">School Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- OVERVIEW TAB -->
      <div id="tab-overview" class="fade-in tab-panel">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-asset"><img src="/kidba_assets/img/3d_school.png" alt="Overview 3D icon"></div>
            <div class="section-copy">
              <span class="section-eyebrow"><i class="fas fa-chart-line"></i> Dashboard overview</span>
              <h1 class="section-title">School ERP Dashboard</h1>
              <p class="section-subtitle">A denser school operations view with quick metrics, schedule panels and live roster monitoring.</p>
            </div>
          </div>
          <div class="section-actions">
            <label class="class-filter-wrap">
              <span class="class-filter-label">Class filter</span>
              <select id="classFilterSelect" class="class-filter-select" onchange="applyClassFilter(this.value)">
                <option value="all">All Classes</option>
              </select>
              <span id="classFilterSummary" class="filter-summary">Showing every active class</span>
            </label>
            <div class="status-pill"><i class="fas fa-sparkles" style="color:#f59e0b;"></i> Campus status <strong>Stable</strong></div>
            <button class="layout-toggle" type="button" aria-label="Grid layout"><i class="fas fa-th"></i></button>
          </div>
        </div>

        <div class="hero-grid">
          <div class="hero-card card-white hero-main-card">
            <div class="hero-main-copy">
              <div class="hero-tag-row">
                <span class="hero-tag"><i class="fas fa-signal"></i> Live dashboard</span>
                <span class="hero-tag soft"><i class="fas fa-layer-group"></i> Academic scope</span>
              </div>
              <div class="stat-block">
                <div class="stat-title">Current view</div>
                <div class="stat-value-large" id="heroScopeLabel">All Classes</div>
                <div class="hero-primary-meta" id="heroScopeMeta">Review the latest school-wide numbers across every classroom from one unified dashboard.</div>
              </div>
              <div class="hero-score-grid">
                <div class="stat-block">
                  <div class="stat-title">Average learner XP</div>
                  <div class="stat-value-large" id="statPoints">0 XP</div>
                  <div class="metric-meta" id="statPointsMeta">No student activity yet</div>
                </div>
                <div class="stat-block">
                  <div class="stat-title">People in view</div>
                  <div class="stat-value-large" id="statTotalPop">0</div>
                  <div class="metric-meta" id="statPopulationMeta">0 teachers and students</div>
                </div>
              </div>
            </div>
            <div class="hero-visual">
              <div class="hero-visual-ring"><img src="/kidba_assets/img/3d_school.png" alt="School 3D icon"></div>
              <div class="hero-badge-card">
                <span>Classes tracked</span>
                <strong id="statClassesInScope">0</strong>
              </div>
            </div>
          </div>
          
          <div class="hero-card card-green tall-card metric-card">
            <div class="metric-card-copy">
              <div class="metric-icon"><i class="fas fa-chalkboard-teacher"></i></div>
              <div class="metric-label">Teachers</div>
              <div class="tall-stat" id="statTeachers">5</div>
              <div class="metric-meta" id="teachersMeta">No teachers in this view</div>
            </div>
            <img class="metric-illustration" src="/kidba_assets/img/3d_teacher.png" alt="Teacher 3D icon">
          </div>
          
          <div class="hero-card card-yellow tall-card metric-card">
            <div class="metric-card-copy">
              <div class="metric-icon"><i class="fas fa-user-graduate"></i></div>
              <div class="metric-label">Students</div>
              <div class="tall-stat" id="statStudents">10</div>
              <div class="metric-meta" id="studentsMeta">No students in this view</div>
            </div>
            <img class="metric-illustration" src="/kidba_assets/img/3d_student.png" alt="Student 3D icon">
          </div>
          
          <div class="hero-card card-orange tall-card metric-card">
            <div class="metric-card-copy">
              <div class="metric-icon"><i class="fas fa-envelope-open-text"></i></div>
              <div class="metric-label">Pending Invites</div>
              <div class="tall-stat" id="statPending">0</div>
              <div class="metric-meta" id="pendingMeta">No pending invites</div>
            </div>
            <img class="metric-illustration" src="/kidba_assets/img/3d_parent.png" alt="Parent 3D icon">
          </div>
        </div>

        <div class="overview-lower-grid">
          <div class="widget-panel widget-table-shell">
            <div class="subsection-toolbar">
              <div class="widget-heading-main">
                <span class="widget-asset"><img src="/kidba_assets/img/3d_student.png" alt="Students list 3D icon"></span>
                <h2 style="font-size:0.98rem; font-weight:800; margin:0; color:#1e293b;">Students List</h2>
              </div>
              <div style="font-size:0.78rem; font-weight:700; color:#94a3b8; display:flex; gap:12px; flex-wrap:wrap;">
                <span class="surface-note"><i class="far fa-clock"></i> Performance tracker</span>
                <span class="scope-badge" id="activeScopeBadge">All Classes</span>
              </div>
            </div>
            <div class="table-header-row mb-2">
              <div class="col-1">Full Name <i class="fas fa-chevron-up ms-1"></i></div>
              <div class="col-3">Class</div>
              <div class="col-2">Progress</div>
              <div class="col-2">XP</div>
              <div class="col-2">Level</div>
              <div class="col-actions"></div>
            </div>
            <div id="studentTableBody">
              <!-- Loaded via JS -->
            </div>
          </div>
          <div class="panel-stack">
            <div class="widget-panel compact">
              <div class="widget-heading">
                <div class="widget-heading-main">
                  <span class="widget-asset"><img src="/kidba_assets/img/3d_login.png" alt="Attendance summary 3D icon"></span>
                  <strong>Attendance Summary</strong>
                </div>
                <span>Today</span>
              </div>
              <div class="attendance-widget">
                <div class="attendance-ring" id="attendanceRing">
                  <div class="attendance-ring-center">
                    <strong id="attendancePresentPercent">0%</strong>
                    <span>Present</span>
                  </div>
                </div>
                <div class="chart-legend">
                  <div><span class="legend-swatch present"></span>Present <strong id="attendancePresentCount">0</strong></div>
                  <div><span class="legend-swatch absent"></span>Absent <strong id="attendanceAbsentCount">0</strong></div>
                  <div><span class="legend-swatch leave"></span>Pending <strong id="attendanceLeaveCount">0</strong></div>
                </div>
              </div>
            </div>
            <div class="widget-panel compact">
              <div class="widget-heading">
                <div class="widget-heading-main">
                  <span class="widget-asset"><img src="/kidba_assets/img/3d_school.png" alt="Schedule 3D icon"></span>
                  <strong>Upcoming Schedule</strong>
                </div>
                <span>This week</span>
              </div>
              <div class="schedule-list">
                <div class="schedule-item">
                  <div>
                    <span>Parent Meeting</span>
                    <strong>Family review session</strong>
                  </div>
                  <div class="schedule-date">Mon</div>
                </div>
                <div class="schedule-item">
                  <div>
                    <span>Math Exam</span>
                    <strong>Mid-term assessment</strong>
                  </div>
                  <div class="schedule-date">May 15</div>
                </div>
                <div class="schedule-item">
                  <div>
                    <span>English Exam</span>
                    <strong>Reading and writing review</strong>
                  </div>
                  <div class="schedule-date">May 20</div>
                </div>
              </div>
            </div>
            <div class="widget-panel compact">
              <div class="widget-heading">
                <div class="widget-heading-main">
                  <span class="widget-asset"><img src="/kidba_assets/img/3d_individual.png" alt="Operations mix 3D icon"></span>
                  <strong>Operations Mix</strong>
                </div>
                <span>Live</span>
              </div>
              <div class="mix-bars">
                <div class="mix-bar-row">
                  <span>Students</span>
                  <div class="mix-bar-track"><span class="mix-bar-fill students" id="mixStudentsBar"></span></div>
                  <strong id="mixStudentsValue">0</strong>
                </div>
                <div class="mix-bar-row">
                  <span>Teachers</span>
                  <div class="mix-bar-track"><span class="mix-bar-fill teachers" id="mixTeachersBar"></span></div>
                  <strong id="mixTeachersValue">0</strong>
                </div>
                <div class="mix-bar-row">
                  <span>Pending</span>
                  <div class="mix-bar-track"><span class="mix-bar-fill pending" id="mixPendingBar"></span></div>
                  <strong id="mixPendingValue">0</strong>
                </div>
              </div>
            </div>
            <div class="widget-panel compact">
              <div class="widget-heading">
                <div class="widget-heading-main">
                  <span class="widget-asset"><img src="/kidba_assets/img/3d_parent.png" alt="Notice board 3D icon"></span>
                  <strong>Notice Board</strong>
                </div>
                <span>Updates</span>
              </div>
              <ul class="notice-list">
                <li>Bus routes updated for the afternoon shift.</li>
                <li>Science exhibition planning starts this Friday.</li>
                <li>Library arrivals uploaded to the weekly class bulletin.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <!-- TEACHERS TAB -->
      <div id="tab-teachers" class="fade-in tab-panel d-none">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-asset"><img src="/kidba_assets/img/3d_teacher.png" alt="Teacher management 3D icon"></div>
            <div class="section-copy">
              <span class="section-eyebrow"><i class="fas fa-chalkboard-teacher"></i> Faculty administration</span>
              <h1 class="section-title">Teacher Management</h1>
              <p class="section-subtitle">Invite teachers, assign classes and keep registration access organized in one place.</p>
            </div>
          </div>
          <div class="section-actions">
            <button class="btn-solid" onclick="openModal('teacherModal')"><i class="fas fa-plus me-2"></i> Invite Teacher</button>
            <button class="btn-outline-light" onclick="openModal('bulkImportModal')"><i class="fas fa-file-import me-2"></i> Import Roster</button>
          </div>
        </div>
        
        <div class="table-header-row">
          <div class="col-1">Full Name</div>
          <div class="col-3">Assigned Class</div>
          <div class="col-2">Invitation Code</div>
          <div class="col-2">Status</div>
          <div class="col-actions">Actions</div>
        </div>
        <div id="teacherTableBody">
          <!-- Loaded via JS -->
        </div>
      </div>

      <!-- STUDENTS TAB (Main Student Directory) -->
      <div id="tab-students" class="fade-in tab-panel d-none">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-asset"><img src="/kidba_assets/img/3d_student.png" alt="Student management 3D icon"></div>
            <div class="section-copy">
              <span class="section-eyebrow"><i class="fas fa-user-graduate"></i> Student administration</span>
              <h1 class="section-title">Student Management</h1>
              <p class="section-subtitle">Manage student records, class placement and parent access codes from one organized directory.</p>
            </div>
          </div>
          <div class="section-actions">
            <button class="btn-solid" onclick="openModal('studentModal')"><i class="fas fa-user-plus me-2"></i> Add Student</button>
            <button class="btn-outline-light" onclick="openModal('bulkImportModal')"><i class="fas fa-file-import me-2"></i> Import Roster</button>
          </div>
        </div>
        
        <div class="table-header-row mb-2">
          <div class="col-1">Full Name</div>
          <div class="col-2">Class</div>
          <div class="col-2">Student Code</div>
          <div class="col-2">Parent Code</div>
          <div class="col-2">Status</div>
          <div class="col-actions">Actions</div>
        </div>
        <div id="studentDirectoryBody">
          <!-- Loaded via JS -->
        </div>
      </div>

      <!-- ATTENDANCE TAB -->
      <div id="tab-attendance" class="fade-in tab-panel d-none">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-asset"><img src="/kidba_assets/img/3d_login.png" alt="Attendance management 3D icon"></div>
            <div class="section-copy">
              <span class="section-eyebrow"><i class="fas fa-wave-square"></i> Attendance operations</span>
              <h1 class="section-title">Attendance Management</h1>
              <p class="section-subtitle">Review recent student activity and quickly identify present or absent learners.</p>
            </div>
          </div>
          <div class="section-actions">
            <div class="status-pill"><i class="far fa-calendar-alt" style="color:#2563eb;"></i> <span id="currentDateDisplay">Date Here</span></div>
          </div>
        </div>
        
        <div class="hero-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:1rem;">
          <div class="hero-card card-green attendance-summary-card" style="display:flex; justify-content:space-between; align-items:center;">
             <div>
                <div class="tall-stat" id="attPresent">0</div>
                <div class="tall-label">Total Present Today</div>
             </div>
             <img class="summary-card-illustration" src="/kidba_assets/img/3d_student.png" alt="Present attendance 3D icon">
          </div>
           <div class="hero-card card-orange attendance-summary-card" style="display:flex; justify-content:space-between; align-items:center;">
             <div>
                <div class="tall-stat" id="attAbsent">0</div>
                <div class="tall-label">Total Absent</div>
             </div>
             <img class="summary-card-illustration" src="/kidba_assets/img/3d_login.png" alt="Absent attendance 3D icon">
          </div>
        </div>

        <div class="table-header-row mb-2">
          <div class="col-1">Student Name</div>
          <div class="col-2">Class</div>
          <div class="col-3">Last Active</div>
          <div class="col-2">Auto Status</div>
          <div class="col-actions">Override</div>
        </div>
        <div id="attendanceTableBody">
          <!-- Loaded via JS -->
        </div>
      </div>

      <!-- SETTINGS TAB -->
      <div id="tab-settings" class="fade-in tab-panel d-none">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-asset"><img src="/kidba_assets/img/3d_individual.png" alt="System settings 3D icon"></div>
            <div class="section-copy">
              <span class="section-eyebrow"><i class="fas fa-sliders-h"></i> System preferences</span>
              <h1 class="section-title">System Settings</h1>
              <p class="section-subtitle">Review administrator identity and keep school workspace preferences aligned.</p>
            </div>
          </div>
        </div>
        <div class="settings-panel">
          <div class="widget-heading" style="margin-bottom:1rem;">
            <div class="widget-heading-main">
              <span class="widget-asset"><img src="/kidba_assets/img/3d_login.png" alt="Security settings 3D icon"></span>
              <strong>Identity &amp; Access</strong>
            </div>
            <span>Secure</span>
          </div>
          <div class="form-group mb-4">
            <label>Administrator Name</label>
            <input type="text" class="form-input" id="setSchoolName" disabled value="">
          </div>
          <div class="form-group mb-4">
            <label>Admin Email</label>
            <input type="email" class="form-input" id="settingsAdminEmail" disabled value="">
          </div>
          <p style="margin:0 0 0.85rem; color:#64748b; font-size:0.82rem; font-weight:700;">Settings are view-only right now. Editing will be added in a later update.</p>
          <button class="btn-solid" type="button" disabled style="opacity:0.6; cursor:not-allowed;">Editing Coming Soon</button>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- MODALS -->
<div id="teacherModal" class="modal-overlay d-none">
  <div class="modal-content">
    <div class="modal-topbar">
      <div>
        <span class="modal-kicker"><i class="fas fa-user-plus"></i> Faculty access</span>
        <h3 class="modal-title">Add New Teacher</h3>
        <p class="modal-subtitle">Create the teacher profile, assign classes and generate the registration code in one clean step.</p>
      </div>
      <button class="modal-close" type="button" onclick="closeModal('teacherModal')"><i class="fas fa-times"></i></button>
    </div>
    <div class="form-group mt-3">
      <label>Full Name</label>
      <input type="text" id="newTchName" class="form-input" placeholder="e.g. Muallima Fatima">
    </div>
    <div class="form-group">
      <label>Photo (optional)</label>
      <div style="text-align:center; margin: 10px 0;">
        <div id="newTchPicWrap" class="modal-photo-picker" onclick="document.getElementById('newTchPhoto').click()">
          <div style="display:flex; flex-direction:column; align-items:center; color:inherit;">
            <i class="fas fa-camera mb-1" style="font-size:1.6rem; color:#94a3b8;"></i>
            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Photo</span>
          </div>
        </div>
        <input type="file" id="newTchPhoto" accept="image/*" class="d-none" onchange="previewTchImage(this,'newTchPicWrap')">
      </div>

      <label>Assign Classes</label>
      <div id="newTchClassList" class="class-chip-list">
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 1"><span>Class 1</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 2"><span>Class 2</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 3"><span>Class 3</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 4"><span>Class 4</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 5"><span>Class 5</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 6"><span>Class 6</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 7"><span>Class 7</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 8"><span>Class 8</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 9"><span>Class 9</span></label>
        <label class="class-chip"><input type="checkbox" name="newTchClasses" value="Class 10"><span>Class 10</span></label>
      </div>
    </div>
    <div class="modal-footer-actions">
      <button class="btn-outline-light" onclick="closeModal('teacherModal')">Cancel</button>
      <button class="btn-solid" onclick="addTeacherInvite(this)"><i class="fas fa-check"></i> Confirm Teacher</button>
    </div>
  </div>
</div>

<div id="studentModal" class="modal-overlay d-none">
  <div class="modal-content">
    <div class="modal-topbar">
      <div>
        <span class="modal-kicker"><i class="fas fa-user-graduate"></i> Enrollment access</span>
        <h3 class="modal-title">Add New Student</h3>
        <p class="modal-subtitle">Create the student invite and generate both student and parent access codes from one place.</p>
      </div>
      <button class="modal-close" type="button" onclick="closeModal('studentModal')"><i class="fas fa-times"></i></button>
    </div>

    <div style="text-align:center; margin: 10px 0 25px 0;">
      <div id="newStuPicWrap" class="modal-photo-picker" onclick="document.getElementById('newStuPic').click()">
        <div style="display: flex; flex-direction: column; align-items: center; color: inherit;">
          <i class="fas fa-camera mb-1" style="font-size: 1.8rem; color: #94a3b8;"></i>
          <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748b;">Photo</span>
        </div>
      </div>
      <input type="file" id="newStuPic" accept="image/*" class="d-none" onchange="previewStuImage(this)">
    </div>

    <div class="form-group mb-3">
      <label><i class="far fa-address-card text-muted me-1"></i> Student Name</label>
      <input type="text" id="newStuName" class="form-input" placeholder="e.g. Abdullah">
    </div>
    <div class="form-group mb-4">
      <label><i class="fas fa-chalkboard text-muted me-1"></i> Assign Class</label>
      <select id="newStuClass" class="form-input" style="cursor: pointer;">
        <option value="" disabled selected>-- Select Grade --</option>
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
        <option value="Class 4">Class 4</option>
        <option value="Class 5">Class 5</option>
        <option value="Class 6">Class 6</option>
        <option value="Class 7">Class 7</option>
        <option value="Class 8">Class 8</option>
        <option value="Class 9">Class 9</option>
        <option value="Class 10">Class 10</option>
      </select>
    </div>
    <div class="modal-footer-actions">
      <button class="btn-outline-light" onclick="closeModal('studentModal')">Cancel</button>
      <button class="btn-solid" onclick="addStudentInvite(this)"><i class="fas fa-check"></i> Confirm Student</button>
    </div>
  </div>
</div>

<!-- Edit Teacher Modal -->
<div id="editTeacherModal" class="modal-overlay d-none">
  <div class="modal-content">
    <div class="modal-topbar">
      <div>
        <span class="modal-kicker"><i class="fas fa-pen"></i> Faculty editor</span>
        <h3 class="modal-title">Edit Teacher</h3>
        <p class="modal-subtitle">Update teacher details, classes and photo without leaving the dashboard.</p>
      </div>
      <button class="modal-close" type="button" onclick="closeModal('editTeacherModal')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="editTchId">
    <div class="form-group mt-3">
      <label>Full Name</label>
      <input type="text" id="editTchName" class="form-input">
    </div>
    <div class="form-group">
      <label>Photo (optional)</label>
      <div style="text-align:center; margin: 10px 0;">
        <div id="editTchPicWrap" class="modal-photo-picker" onclick="document.getElementById('editTchPhoto').click()">
          <div style="display:flex; flex-direction:column; align-items:center; color:inherit;">
            <i class="fas fa-camera mb-1" style="font-size:1.6rem; color:#94a3b8;"></i>
            <span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Photo</span>
          </div>
        </div>
        <input type="file" id="editTchPhoto" accept="image/*" class="d-none" onchange="previewTchImage(this,'editTchPicWrap')">
      </div>

      <label>Assign Classes</label>
      <div id="editTchClassList" class="class-chip-list">
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 1"><span>Class 1</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 2"><span>Class 2</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 3"><span>Class 3</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 4"><span>Class 4</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 5"><span>Class 5</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 6"><span>Class 6</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 7"><span>Class 7</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 8"><span>Class 8</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 9"><span>Class 9</span></label>
        <label class="class-chip"><input type="checkbox" name="editTchClasses" value="Class 10"><span>Class 10</span></label>
      </div>
    </div>
    <div class="modal-footer-actions">
      <button class="btn-outline-light" onclick="closeModal('editTeacherModal')">Cancel</button>
      <button class="btn-solid" onclick="saveEditTeacher(this)"><i class="fas fa-save"></i> Save Teacher Changes</button>
    </div>
  </div>
</div>

<!-- Edit Student Modal -->
<div id="editStudentModal" class="modal-overlay d-none">
  <div class="modal-content">
    <div class="modal-topbar">
      <div>
        <span class="modal-kicker"><i class="fas fa-user-pen"></i> Student editor</span>
        <h3 class="modal-title">Edit Student</h3>
        <p class="modal-subtitle">Update learner details and class placement from the same control panel.</p>
      </div>
      <button class="modal-close" type="button" onclick="closeModal('editStudentModal')"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="editStuId">
    <div class="form-group mt-3">
      <label>Student Name</label>
      <input type="text" id="editStuName" class="form-input">
    </div>
    <div class="form-group">
      <label>Assign Class</label>
      <select id="editStuClass" class="form-input">
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
        <option value="Class 4">Class 4</option>
        <option value="Class 5">Class 5</option>
        <option value="Class 6">Class 6</option>
        <option value="Class 7">Class 7</option>
        <option value="Class 8">Class 8</option>
        <option value="Class 9">Class 9</option>
        <option value="Class 10">Class 10</option>
      </select>
    </div>
    <div class="modal-footer-actions">
      <button class="btn-outline-light" onclick="closeModal('editStudentModal')">Cancel</button>
      <button class="btn-solid" onclick="saveEditStudent()"><i class="fas fa-save"></i> Save Student Changes</button>
    </div>
  </div>
</div>

<!-- Code Success Modal -->
<div id="codeSuccessModal" class="modal-overlay d-none">
  <div class="modal-content" style="text-align:center;">
    <div style="font-size:3rem; color:#84cc16; margin-bottom:15px;"><i class="fas fa-check-circle"></i></div>
    <h3 id="codeSuccessTitle" style="margin-top:0; font-weight:800;">Success!</h3>
    <p id="codeSuccessDesc" style="color:#64748b; font-size:0.95rem; font-weight:700;"></p>
    <div id="codeSuccessBody"></div>
    <button class="btn-solid mt-4 w-100" onclick="closeModal('codeSuccessModal')">Done</button>
  </div>
</div>

<!-- Bulk Import Modal -->
<div id="bulkImportModal" class="modal-overlay d-none">
  <div class="modal-content modal-wide">
    <div class="modal-topbar">
      <div>
        <span class="modal-kicker"><i class="fas fa-file-import"></i> Data intake</span>
        <h3 class="modal-title">Bulk Import</h3>
        <p class="modal-subtitle">Upload CSV, XLSX or DOCX files. The system will auto-detect teacher, student and parent rows for preview before import.</p>
      </div>
      <button class="modal-close" type="button" onclick="closeModal('bulkImportModal')"><i class="fas fa-times"></i></button>
    </div>
    <div class="form-group">
      <label>File</label>
      <input type="file" id="bulkFileInput" accept=".csv,.txt,.xls,.xlsx,.docx" onchange="handleBulkFileInput(this)" class="form-input">
    </div>
    <div id="bulkImportCounts" style="font-weight:800; color:#64748b; margin-bottom:8px;"></div>
    <div id="bulkPreviewBody" style="max-height:320px; overflow:auto; border:1px solid #e2e8f0; padding:10px; border-radius:8px;"></div>
    <div class="modal-footer-actions">
      <button class="btn-outline-light" onclick="closeModal('bulkImportModal')">Cancel</button>
      <button class="btn-solid" onclick="confirmBulkImport()"><i class="fas fa-check"></i> Confirm Import</button>
    </div>
  </div>
</div>

<!-- Mobile bottom nav bar for School Admin -->
<div class="admin-mobile-bottom" id="adminBottomBar">
  <button class="adm-mob-btn active" id="admMobOverview" onclick="switchAdminTab('overview', this)">
    <i class="fas fa-th-large"></i><span>Overview</span>
  </button>
  <button class="adm-mob-btn" id="admMobTeachers" onclick="switchAdminTab('teachers', this)">
    <i class="fas fa-chalkboard-teacher"></i><span>Teachers</span>
  </button>
  <button class="adm-mob-btn" id="admMobStudents" onclick="switchAdminTab('students', this)">
    <i class="fas fa-user-graduate"></i><span>Students</span>
  </button>
  <button class="adm-mob-btn" id="admMobAttend" onclick="switchAdminTab('attendance', this)">
    <i class="fas fa-calendar-check"></i><span>Attend.</span>
  </button>
  <button class="adm-mob-btn danger" onclick="logoutAdmin()">
    <i class="fas fa-sign-out-alt"></i><span>Logout</span>
  </button>
</div>

<!-- Load parsing libraries for browser (XLSX and mammoth) -->
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
<script src="https://unpkg.com/mammoth/mammoth.browser.min.js"></script>
<script>
  // Mobile sidebar toggle
  (function() {
    const btn = document.getElementById('adminMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('adminOverlay');
    if (!btn || !sidebar) return;
    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      btn.innerHTML = '<i class="fas fa-times"></i>';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      btn.innerHTML = '<i class="fas fa-bars"></i>';
    }
    btn.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);
    // Close on nav item click on mobile
    sidebar.querySelectorAll('.nav-links li').forEach(li => {
      li.addEventListener('click', () => { if (window.innerWidth <= 900) closeSidebar(); });
    });
  })();

  // Bottom nav tab switcher (delegates to existing switchTab function if present)
  function switchAdminTab(tabName, btn) {
    document.querySelectorAll('.adm-mob-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Trigger the sidebar nav item
    const navItem = document.getElementById('nav-' + tabName);
    if (navItem) navItem.click();
  }
</script>
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

  const firebaseConfig = {
    apiKey: "AIzaSyA4MrV-oXhK_johreyzIucti5RFrKcvyG8",
    authDomain: "imaan-app-1d2da.firebaseapp.com",
    projectId: "imaan-app-1d2da",
    storageBucket: "imaan-app-1d2da.firebasestorage.app",
    messagingSenderId: "373650938167",
    appId: "1:373650938167:web:e9da1317c118bc720d22b2"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  function showDebug(msg) {
    void msg;
  }

  function genCode(prefix) { return prefix + '-' + Math.random().toString(36).substr(2,5).toUpperCase(); }

  const loginView = document.getElementById('adminLoginView');
  const dashboardView = document.getElementById('adminDashboardView');
  // Hide the admin login card by default to avoid showing it
  // when the user is already authenticated via the main /auth page.
  if (loginView) loginView.classList.add('d-none');
  
  let currentAdminSession = null;
  let teachersList = [];
  let studentsList = [];
  let invitesList = [];
  let currentClassFilter = 'all';
  const defaultClassOptions = Array.from({ length: 10 }, (_, index) => 'Class ' + (index + 1));

  function normalizeClassName(value) {
    const raw = String(value || '').trim().replace(/\\s+/g, ' ');
    if (!raw) return '';

    const lower = raw.toLowerCase();
    if (lower === 'all classes' || lower === 'all' || lower === 'school-wide' || lower === 'school wide') return 'All Classes';

    const numberMatch = lower.match(/(\\d{1,2})/);
    if (numberMatch) {
      const classNumber = Number.parseInt(numberMatch[1], 10);
      if (!Number.isNaN(classNumber) && classNumber >= 1 && classNumber <= 10) return 'Class ' + classNumber;
    }

    return raw;
  }

  function splitClassNames(value) {
    if (Array.isArray(value)) return value.map(normalizeClassName).filter(Boolean);
    return String(value || '')
      .split(/[;,|&\\n]+/)
      .map((item) => normalizeClassName(item))
      .filter(Boolean);
  }

  function getClassNamesFromRecord(record) {
    if (!record) return [];
    const rawData = record.raw || {};
    const classSource = record.class_id || record.assigned_class || record.class || rawData.class_id || rawData.Class || rawData.class || rawData['Class Name'] || '';
    return splitClassNames(classSource);
  }

  function sortClassNames(classNames) {
    return classNames.sort((left, right) => {
      const leftNumber = Number.parseInt((left.match(/\\d+/) || [])[0] || '', 10);
      const rightNumber = Number.parseInt((right.match(/\\d+/) || [])[0] || '', 10);
      if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && leftNumber !== rightNumber) return leftNumber - rightNumber;
      return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function getAvailableClassOptions() {
    const classSet = new Set(defaultClassOptions);
    [...teachersList, ...studentsList, ...invitesList.filter((invite) => invite.role === 'teacher' || invite.role === 'student')].forEach((record) => {
      getClassNamesFromRecord(record).forEach((className) => {
        const normalized = normalizeClassName(className);
        const lower = normalized.toLowerCase();
        if (normalized && lower !== 'all classes' && lower !== 'school-wide' && lower !== 'all') classSet.add(normalized);
      });
    });

    return sortClassNames(Array.from(classSet));
  }

  function recordMatchesClassFilter(record) {
    if (currentClassFilter === 'all') return true;
    const classes = getClassNamesFromRecord(record);
    if (!classes.length) return false;
    return classes.some((className) => {
      const lower = className.toLowerCase();
      if (lower === 'all classes' || lower === 'school-wide' || lower === 'all') return true;
      return lower === currentClassFilter.toLowerCase();
    });
  }

  function syncClassFilterSelect(classOptions) {
    const select = document.getElementById('classFilterSelect');
    if (!select) return;

    const nextMarkup = ['<option value="all">All Classes</option>']
      .concat(classOptions.map((className) => '<option value="' + className + '">' + className + '</option>'))
      .join('');

    if (select.innerHTML !== nextMarkup) select.innerHTML = nextMarkup;
    if (currentClassFilter !== 'all' && !classOptions.includes(currentClassFilter)) currentClassFilter = 'all';
    select.value = currentClassFilter;
  }

  function getCurrentFilterLabel() {
    return currentClassFilter === 'all' ? 'All Classes' : currentClassFilter;
  }

  window.applyClassFilter = (value) => {
    currentClassFilter = value || 'all';
    renderUI();
  };

  window.previewStuImage = (input) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wrap = document.getElementById('newStuPicWrap');
        wrap.innerHTML = '<img src="' + e.target.result + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
        wrap.style.border = 'none';
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  window.previewTchImage = (input, wrapId) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wrap = document.getElementById(wrapId);
        if (wrap) {
          wrap.innerHTML = '<img src="' + e.target.result + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
          wrap.style.border = 'none';
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(reader.error || new Error('Unable to read image.'));
      reader.readAsDataURL(file);
    });
  }

  async function prepareProfilePhoto(file) {
    if (!file) return null;

    const sourceDataUrl = await readFileAsDataUrl(file);
    if (!sourceDataUrl) return null;

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const longestSide = Math.max(img.width || 1, img.height || 1);
        const scale = Math.min(1, 640 / longestSide);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((img.width || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.height || 1) * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          resolve(sourceDataUrl);
          return;
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(sourceDataUrl);
      img.src = sourceDataUrl;
    });
  }

  function getSelectedClasses(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(cb => cb.value);
  }

  // Bulk import helpers: parsing and preview
  window.openBulkImportModal = () => {
    const modal = document.getElementById('bulkImportModal'); if(modal) modal.classList.remove('d-none');
  };

  window.handleBulkFileInput = async (input) => {
    const file = input.files && input.files[0];
    if(!file) return;
    const fname = (file.name || '').toLowerCase();
    document.getElementById('bulkImportCounts').textContent = 'Parsing file...';
    let rows = [];
    try {
      if (fname.endsWith('.csv') || fname.endsWith('.txt')) {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (fname.endsWith('.xlsx') || fname.endsWith('.xls')) {
        rows = await parseXLSX(file);
      } else if (fname.endsWith('.docx')) {
        rows = await parseDOCX(file);
      } else {
        const text = await file.text();
        rows = parseCSV(text);
      }
    } catch(err) {
      document.getElementById('bulkPreviewBody').textContent = 'Error parsing file: ' + err.message;
      document.getElementById('bulkImportCounts').textContent = '';
      return;
    }

    const teachers = [], students = [], parents = [];
    rows.forEach(r => {
      const role = detectRole(r);
      if (role === 'teacher') teachers.push(r);
      else if (role === 'parent') parents.push(r);
      else students.push(r);
    });

    window.bulkImportPreview = { rows: rows, teachers: teachers, students: students, parents: parents };

    document.getElementById('bulkImportCounts').textContent = 'Detected: ' + teachers.length + ' teachers, ' + students.length + ' students, ' + parents.length + ' parents';

    function makeTable(arr, title, limit) {
      if(!arr || arr.length === 0) return '<div style="margin-bottom:8px; color:#94a3b8;">No ' + title + '</div>';
      let t = '<div style="margin-bottom:10px;"><b>' + title + ' (' + arr.length + ')</b><table style="width:100%; border-collapse:collapse; margin-top:6px;">';
      const cols = Object.keys(arr[0]).slice(0,8);
      t += '<tr>';
      cols.forEach(c => { t += '<th style="text-align:left; padding:6px 8px; color:#64748b; font-weight:700;">' + c + '</th>'; });
      t += '</tr>';
      const lim = Math.min(arr.length, limit || 5);
      for (let i = 0; i < lim; i++) {
        t += '<tr>';
        cols.forEach(c => { t += '<td style="padding:6px 8px; border-top:1px solid #f1f5f9;">' + (arr[i][c] || '') + '</td>'; });
        t += '</tr>';
      }
      t += '</table></div>';
      return t;
    }

    let html = '';
    html += makeTable(teachers, 'Teachers', 5);
    html += makeTable(students, 'Students', 5);
    html += makeTable(parents, 'Parents', 5);
    html += '<div style="color:#94a3b8; font-size:0.9rem; margin-top:6px;">Preview shows first 5 rows of each group. Click Import to confirm.</div>';
    document.getElementById('bulkPreviewBody').innerHTML = html;
  };

  window.confirmBulkImport = async () => {
    const preview = window.bulkImportPreview;
    if(!preview) return alert('No data to import. Upload a file first.');
    const btn = event && event.target ? event.target : null; if(btn) { btn.disabled = true; btn.textContent = 'Importing...'; }
    try {
      let tCount = 0, sCount = 0, pCount = 0;
      // Teachers
      for (const r of preview.teachers) {
        const code = genCode('TCH');
        const name = r.name || r['Full Name'] || r['full name'] || r['Name'] || '';
        const payload = { code: code, role: 'teacher', school_id: currentAdminSession.school_id, name: name, raw: r, status: 'pending', created_at: new Date().toISOString() };
        await setDoc(doc(db, 'invites', code), payload);
        tCount++;
      }
      // Students (create parent invites as well)
      for (const r of preview.students) {
        const code = genCode('STU');
        const parCode = genCode('PAR');
        const name = r.name || r['Full Name'] || r['Name'] || '';
        const classId = r.class || r.Class || r['class_id'] || r['Class'] || r['Class Name'] || '';
        const payload = { code: code, role: 'student', school_id: currentAdminSession.school_id, class_id: classId, name: name, raw: r, status: 'pending', created_at: new Date().toISOString() };
        const parPayload = { code: parCode, role: 'parent', school_id: currentAdminSession.school_id, linked_student_code: code, status: 'pending', created_at: new Date().toISOString() };
        await setDoc(doc(db, 'invites', code), payload);
        await setDoc(doc(db, 'invites', parCode), parPayload);
        sCount++;
      }
      // Parents only (no linked student)
      for (const r of preview.parents) {
        const code = genCode('PAR');
        const name = r.name || r['Name'] || '';
        const payload = { code: code, role: 'parent', school_id: currentAdminSession.school_id, name: name, raw: r, status: 'pending', created_at: new Date().toISOString() };
        await setDoc(doc(db, 'invites', code), payload);
        pCount++;
      }

      closeModal('bulkImportModal');
      await loadDashboardData();
      alert('Imported: ' + tCount + ' teachers, ' + sCount + ' students, ' + pCount + ' parents.');
    } catch(err) {
      alert('Import failed: ' + err.message);
    } finally {
      if(btn) { btn.disabled = false; btn.textContent = 'Confirm Import'; }
    }
  };

  function parseCSV(text) {
    const out = [];
    // Normalize all CR/LF variations to LF using character codes to avoid
    // accidental escape-sequence mangling inside template literals.
    const CR = String.fromCharCode(13);
    const LF = String.fromCharCode(10);
    const normalized = text.split(CR + LF).join(LF).split(CR).join(LF);
    const lines = normalized.split(LF);
    if (!lines.length) return out;

    function parseLine(line) {
      const res = [];
      let cur = ''; let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && i + 1 < line.length && line[i+1] === '"') { cur += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) { res.push(cur); cur = ''; }
        else cur += ch;
      }
      res.push(cur);
      return res;
    }

    const header = parseLine((lines[0] || '')).map(h => h.trim());
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      if (!line || !line.trim()) continue;
      // strip any stray CR remaining at line end
      if (line.charCodeAt(line.length - 1) === 13) line = line.slice(0, -1);
      const vals = parseLine(line);
      const obj = {};
      for (let j = 0; j < header.length; j++) { obj[header[j]] = vals[j] ? vals[j].trim() : ''; }
      out.push(obj);
    }
    return out;
  }

  async function parseXLSX(file) {
    const ab = await file.arrayBuffer();
    const wb = window.XLSX.read(ab, { type: 'array' });
    const first = wb.SheetNames[0];
    const ws = wb.Sheets[first];
    const json = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
    return json;
  }

  async function parseDOCX(file) {
    const ab = await file.arrayBuffer();
    if (!window.mammoth) {
      // fallback to text
      const text = new TextDecoder().decode(ab);
      return parseCSV(text);
    }
    const result = await window.mammoth.convertToHtml({ arrayBuffer: ab });
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value || '', 'text/html');
    const table = doc.querySelector('table');
    if (table) {
      const trs = Array.from(table.querySelectorAll('tr'));
      if (!trs.length) return [];
      const headers = Array.from(trs[0].querySelectorAll('th,td')).map(h => h.textContent.trim());
      const out = [];
      for (let i = 1; i < trs.length; i++) {
        const cells = Array.from(trs[i].querySelectorAll('td,th'));
        const obj = {};
        for (let j = 0; j < headers.length; j++) { obj[headers[j]] = cells[j] ? (cells[j].textContent || '').trim() : ''; }
        out.push(obj);
      }
      return out;
    }
    // fallback: treat text content as CSV-like
    const plain = doc.body ? doc.body.textContent || '' : '';
    if (plain.includes(',')) return parseCSV(plain);
    return [{ content: plain }];
  }

  function detectRole(row) {
    const lower = {};
    Object.keys(row).forEach(k => lower[k.toLowerCase()] = String(row[k] || '').toLowerCase());
    if (lower.role || lower.type || lower.user_type) {
      const v = lower.role || lower.type || lower.user_type;
      if (v.indexOf('teach') !== -1) return 'teacher';
      if (v.indexOf('student') !== -1 || v.indexOf('stu') !== -1) return 'student';
      if (v.indexOf('parent') !== -1 || v.indexOf('par') !== -1) return 'parent';
    }
    const keys = Object.keys(lower);
    if (keys.some(k => k.indexOf('class') !== -1 || k.indexOf('grade') !== -1 || k.indexOf('student') !== -1 || k.indexOf('roll') !== -1)) return 'student';
    if (keys.some(k => k.indexOf('subject') !== -1 || k.indexOf('qualification') !== -1 || k.indexOf('teacher') !== -1 || k.indexOf('employee') !== -1)) return 'teacher';
    if (keys.some(k => k.indexOf('parent') !== -1 || k.indexOf('guardian') !== -1 || k.indexOf('linked') !== -1)) return 'parent';
    const vals = Object.values(lower).join(' ');
    if (vals.indexOf('parent') !== -1) return 'parent';
    return 'student';
  }

  onAuthStateChanged(auth, async (user) => {
    try {
      showDebug('onAuthStateChanged fired — user: ' + (user ? user.uid : 'null'));
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        showDebug('Fetched users/' + user.uid + ' exists=' + (userDoc.exists() ? 'yes' : 'no'));
        const data = userDoc.exists() ? userDoc.data() : null;
        showDebug('role=' + (data ? data.role : 'n/a'));
        if (userDoc.exists() && data && data.role === 'school_admin') {
          currentAdminSession = { ...data, uid: user.uid };
          // hide login UI and ensure dashboard is visible
          if (loginView) loginView.classList.add('d-none');
          if (dashboardView) dashboardView.classList.remove('d-none');

          // persist a brief session snapshot for other pages
          try { sessionStorage.setItem('auth_user', JSON.stringify(currentAdminSession)); } catch(e) { showDebug('sessionStorage set failed'); }

          const nameEl = document.getElementById('setSchoolName'); if (nameEl) nameEl.value = currentAdminSession.name || "School Admin";
          const adminNameEl = document.getElementById('navAdminName'); if (adminNameEl) adminNameEl.textContent = currentAdminSession.name || 'School Admin';
          const workspaceAdminEl = document.getElementById('workspaceAdminName'); if (workspaceAdminEl) workspaceAdminEl.textContent = currentAdminSession.name || 'School Admin';
          const adminEmailEl = document.getElementById('settingsAdminEmail'); if (adminEmailEl) adminEmailEl.value = currentAdminSession.email || '';

          showDebug('Loading dashboard data for school_id=' + (currentAdminSession.school_id || 'unknown'));
          await loadDashboardData();
          showDebug('Dashboard data load complete');
        } else {
           showDebug('Unauthorized or missing user doc — signing out');
           alert("Unauthorized. This portal is for School Admins only.");
           signOut(auth);
           loginView.classList.remove('d-none');
           dashboardView.classList.add('d-none');
        }
      } else {
        showDebug('No authenticated user');
        
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

        if (loginView) loginView.classList.remove('d-none');
        if (dashboardView) dashboardView.classList.add('d-none');
      }
    } catch (err) {
      console.error('onAuthStateChanged error', err);
      showDebug('onAuthStateChanged error: ' + (err && err.message ? err.message : err));
      // ensure UI recovers
      if (loginView) loginView.classList.remove('d-none');
      if (dashboardView) dashboardView.classList.add('d-none');
    }
  });

  window.attemptAdminLogin = async () => {
    try {
      const emailEl = document.getElementById('adminEmailInput');
      const passEl = document.getElementById('adminPasswordInput');
      const email = emailEl ? String(emailEl.value || '').trim() : '';
      const password = passEl ? String(passEl.value || '') : '';
      if (!email || !password) return alert('Please enter email and password.');
      showDebug('attemptAdminLogin: ' + email);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      showDebug('signInWithEmailAndPassword success uid=' + (cred && cred.user ? cred.user.uid : 'unknown'));
      // onAuthStateChanged will pick up the signed-in user and load dashboard
    } catch (err) {
      console.error('Login failed', err);
      showDebug('attemptAdminLogin error: ' + (err && err.message ? err.message : err));
      alert('Login failed: ' + (err && err.message ? err.message : err));
    }
  };

  window.logoutAdmin = () => {
    signOut(auth).then(() => {
      sessionStorage.removeItem('auth_user');
      window.location.href = 'auth.html';
    });
  };

  // Bind logout to top nav button
  setTimeout(() => {
     document.querySelectorAll('.fa-sign-out-alt').forEach(el => {
       el.parentElement.onclick = window.logoutAdmin;
     });
  }, 1000);

  async function loadDashboardData() {
    dashboardView.classList.remove('d-none');
    document.body.style.margin = '0';
    
    try {
      const schoolId = currentAdminSession.school_id;
      
      // Load school profile
      const schoolDoc = await getDoc(doc(db, "schools", schoolId));
      if (schoolDoc.exists()) {
        const schoolData = schoolDoc.data();
        if (schoolData.logo_url) {
          document.getElementById('schoolAdminLogoImg').src = schoolData.logo_url;
        }
      }

      const usersQuery = query(collection(db, "users"), where("school_id", "==", schoolId));
      const usersSnap = await getDocs(usersQuery);
      
      teachersList = [];
      studentsList = [];
      
      usersSnap.forEach(d => {
         const data = d.data();
         data.uid = d.id;
         if(data.role === 'teacher') teachersList.push(data);
         if(data.role === 'student') studentsList.push(data);
      });

      const invitesQuery = query(collection(db, "invites"), where("school_id", "==", schoolId));
      const invitesSnap = await getDocs(invitesQuery);
      invitesList = [];
      invitesSnap.forEach(d => { invitesList.push(d.data()); });

      renderUI();
    } catch(err) {
      console.error("Error loading dashboard:", err);
    }
  }

  const schoolAdminLogoClickArea = document.getElementById('schoolAdminLogoClickArea');
  const schoolAdminLogoInput = document.getElementById('schoolAdminLogoInput');

  if (schoolAdminLogoClickArea && schoolAdminLogoInput) {
    schoolAdminLogoClickArea.addEventListener('click', () => schoolAdminLogoInput.click());
    
    schoolAdminLogoInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const scope = 'schools/' + currentAdminSession.school_id;
        const storageRef = ref(storage, scope + '/school-logo-' + Date.now() + '.' + extension);
        
        // Show loading state
        document.getElementById('schoolAdminLogoImg').style.opacity = '0.5';

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        document.getElementById('schoolAdminLogoImg').src = downloadURL;
        document.getElementById('schoolAdminLogoImg').style.opacity = '1';
        
        await updateDoc(doc(db, 'schools', currentAdminSession.school_id), { logo_url: downloadURL });
        
      } catch (err) {
        console.error('School logo upload error:', err);
        alert('Failed to upload school logo. Please try again.');
        document.getElementById('schoolAdminLogoImg').style.opacity = '1';
      }
    });
  }

  function renderUI() {
    const classOptions = getAvailableClassOptions();
    syncClassFilterSelect(classOptions);

    const teachers = teachersList.filter(recordMatchesClassFilter);
    const students = studentsList.filter(recordMatchesClassFilter);
    const pendingTeacherInvites = invitesList.filter((invite) => invite.role === 'teacher' && invite.status === 'pending' && recordMatchesClassFilter(invite));
    const pendingStudentInvites = invitesList.filter((invite) => invite.role === 'student' && invite.status === 'pending' && recordMatchesClassFilter(invite));
    const pendingInvites = pendingTeacherInvites.length + pendingStudentInvites.length;

    const currentLabel = getCurrentFilterLabel();
    const viewPopulation = teachers.length + students.length;
    const discoveredClasses = new Set();
    [...teachers, ...students, ...pendingTeacherInvites, ...pendingStudentInvites].forEach((record) => {
      getClassNamesFromRecord(record).forEach((className) => discoveredClasses.add(className));
    });

    const classesInScope = currentClassFilter === 'all' ? discoveredClasses.size : 1;
    const themeColors = ['row-peach', 'row-yellow', 'row-green'];
    const bgColors = ['#fb923c', '#fbbf24', '#4ade80'];
    const now = new Date();

    document.getElementById('heroScopeLabel').textContent = currentLabel;
    document.getElementById('heroScopeMeta').textContent = currentClassFilter === 'all'
      ? 'Review live student, teacher and attendance figures across the whole school.'
      : 'Focused academic operations for ' + currentLabel + '.';
    document.getElementById('classFilterSummary').textContent = currentClassFilter === 'all'
      ? 'Showing every active class'
      : 'Showing records for ' + currentLabel;
    document.getElementById('activeScopeBadge').textContent = currentLabel;
    document.getElementById('statClassesInScope').textContent = String(classesInScope);
    document.getElementById('statTeachers').textContent = String(teachers.length);
    document.getElementById('statStudents').textContent = String(students.length);
    document.getElementById('statPending').textContent = String(pendingInvites);
    document.getElementById('statTotalPop').textContent = String(viewPopulation);
    document.getElementById('teachersMeta').textContent = teachers.length ? teachers.length + ' faculty records in scope' : 'No teachers in this view';
    document.getElementById('studentsMeta').textContent = students.length ? students.length + ' learner records in scope' : 'No students in this view';
    document.getElementById('pendingMeta').textContent = pendingInvites ? pendingInvites + ' invitations are still pending' : 'No pending invites';
    document.getElementById('statPopulationMeta').textContent = viewPopulation ? teachers.length + ' teachers and ' + students.length + ' students' : '0 teachers and 0 students';
    document.getElementById('currentDateDisplay').textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    // Teachers
    let tchHtml = '';
    teachers.forEach((teacher, index) => {
      const motif = themeColors[index % 3];
      const color = bgColors[index % 3];
      const code = teacher.invitation_code || 'Accepted';
      const imgSrc = teacher.photoURL ? teacher.photoURL : ('https://ui-avatars.com/api/?name=' + teacher.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#',''));
      tchHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="' + imgSrc + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' + teacher.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (teacher.class_id || teacher.assigned_class || 'All Classes') + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + code + '</code></div>' +
        '<div class="col-2"><span style="color:#22c55e;font-weight:800;"><i class="fas fa-check-circle"></i> Active</span></div>' +
        '<div class="col-actions"><button class="action-btn" onclick="editTeacher(\\'' + teacher.uid + '\\')"><i class="fas fa-edit"></i></button><button class="action-btn text-danger ms-2" onclick="deleteTeacher(\\'' + teacher.uid + '\\')"><i class="fas fa-trash"></i></button></div></div>';
    });

    pendingTeacherInvites.forEach((invite) => {
      const pendingImage = invite.photoURL ? '<img src="' + invite.photoURL + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' : '<div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-user-clock"></i></div>';
      tchHtml += '<div class="pill-row row-peach" style="opacity:0.6;">' +
        '<div class="col-1 d-flex align-items-center gap-3">' + pendingImage + invite.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (invite.class_id || 'Unassigned') + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + invite.code + '</code></div>' +
        '<div class="col-2"><span style="color:#f59e0b;font-weight:800;"><i class="fas fa-clock"></i> Pending</span></div>' +
        '<div class="col-actions"></div></div>';
    });
    document.getElementById('teacherTableBody').innerHTML = tchHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No teachers added yet.</div>';

    // Students Directory
    let stuDirHtml = '';
    students.forEach((student, index) => {
      const motif = themeColors[(index + 1) % 3];
      const color = bgColors[(index + 1) % 3];
      const stuCode = student.invitation_code || 'Accepted';
      const imgSrc = student.photoURL ? student.photoURL : ('https://ui-avatars.com/api/?name=' + student.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#',''));

      stuDirHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="' + imgSrc + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' + student.name + '</div>' +
        '<div class="col-2"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (student.class_id || 'Unknown') + '</span></div>' +
        '<div class="col-2"><code class="copyable-code" onclick="copyCodeInteractive(this, \\'' + stuCode + '\\')" title="Click to copy">' + stuCode + (stuCode !== 'Accepted' ? ' <i class="far fa-copy text-muted"></i>' : '') + '</code></div>' +
        '<div class="col-2"><span style="font-size:0.8rem; font-weight:800; color:#94a3b8; background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:12px;"><i class="fas fa-link"></i> Linked</span></div>' +
        '<div class="col-2"><span style="color:#22c55e;"><i class="fas fa-check-circle"></i> Active</span></div>' +
        '<div class="col-actions"><button class="action-btn" onclick="editStudent(\\'' + student.uid + '\\')"><i class="fas fa-edit"></i></button><button class="action-btn text-danger ms-2" onclick="deleteStudent(\\'' + student.uid + '\\')"><i class="fas fa-trash"></i></button></div></div>';
    });

    pendingStudentInvites.forEach((invite) => {
      const parentInvite = invitesList.find((parent) => parent.role === 'parent' && parent.linked_student_code === invite.code);
      const parentCode = parentInvite ? parentInvite.code : 'N/A';
      const pendingImage = invite.photoURL ? '<img src="' + invite.photoURL + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' : '<div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-user-clock"></i></div>';

      stuDirHtml += '<div class="pill-row row-yellow" style="opacity:0.6;">' +
        '<div class="col-1 d-flex align-items-center gap-3">' + pendingImage + invite.name + '</div>' +
        '<div class="col-2"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (invite.class_id || 'Unknown') + '</span></div>' +
        '<div class="col-2"><code class="copyable-code" onclick="copyCodeInteractive(this, \\'' + invite.code + '\\')" title="Click to copy">' + invite.code + ' <i class="far fa-copy text-muted"></i></code></div>' +
        '<div class="col-2"><code class="copyable-code" onclick="copyCodeInteractive(this, \\'' + parentCode + '\\')" title="Click to copy">' + parentCode + (parentCode !== 'N/A' ? ' <i class="far fa-copy text-muted"></i>' : '') + '</code></div>' +
        '<div class="col-2"><span style="color:#f59e0b; font-weight:800;"><i class="fas fa-clock"></i> Pending</span></div>' +
        '<div class="col-actions"></div></div>';
    });
    document.getElementById('studentDirectoryBody').innerHTML = stuDirHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No students enrolled yet.</div>';

    // Analytics
    let analyticsHtml = '';
    let totalSchoolScore = 0;

    students.forEach((student, index) => {
      const motif = themeColors[index % 3];
      const color = bgColors[index % 3];
      const imgSrc = student.photoURL ? student.photoURL : ('https://ui-avatars.com/api/?name=' + student.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#',''));
      const points = (student.game_state && student.game_state.totalPoints) ? student.game_state.totalPoints : 0;
      const completed = (student.game_state && student.game_state.completed) ? student.game_state.completed.length : 0;
      totalSchoolScore += points;

      let statusRank = 'Beginner';
      if (points > 300) statusRank = 'Gold <i class="fas fa-medal text-warning"></i>';
      else if (points > 100) statusRank = 'Silver <i class="fas fa-medal" style="color:#94a3b8;"></i>';

      analyticsHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="' + imgSrc + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' + student.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (student.class_id || 'Unknown') + '</span></div>' +
        '<div class="col-2"><span style="color:#d946ef; font-weight:800;"><i class="fas fa-book-open me-1"></i> ' + completed + ' Chapters</span></div>' +
        '<div class="col-2"><span style="color:#eab308; font-weight:800; background:#fef08a; padding:4px 10px; border-radius:12px;">' + points + ' XP</span></div>' +
        '<div class="col-2"><span style="font-weight:800;">' + statusRank + '</span></div>' +
        '<div class="col-actions"></div></div>';
    });

    document.getElementById('studentTableBody').innerHTML = analyticsHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No student data available.</div>';

    const avgScore = students.length > 0 ? Math.round(totalSchoolScore / students.length) : 0;
    document.getElementById('statPoints').textContent = avgScore + ' XP';
    document.getElementById('statPointsMeta').textContent = students.length ? 'Average progress across ' + students.length + ' learners' : 'No student activity yet';

    const mixMax = Math.max(students.length, teachers.length, pendingInvites, 1);
    const setMixBar = (id, value) => {
      const bar = document.getElementById(id);
      if (!bar) return;
      const width = value === 0 ? 0 : Math.max(12, Math.round((value / mixMax) * 100));
      bar.style.width = width + '%';
    };

    document.getElementById('mixStudentsValue').textContent = String(students.length);
    document.getElementById('mixTeachersValue').textContent = String(teachers.length);
    document.getElementById('mixPendingValue').textContent = String(pendingInvites);
    setMixBar('mixStudentsBar', students.length);
    setMixBar('mixTeachersBar', teachers.length);
    setMixBar('mixPendingBar', pendingInvites);

    // Attendance
    let attHtml = '';
    let presentCount = 0;
    let absentCount = 0;

    students.forEach((student, index) => {
      const motif = themeColors[index % 3];
      const color = bgColors[index % 3];
      const imgSrc = student.photoURL ? student.photoURL : ('https://ui-avatars.com/api/?name=' + student.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#',''));
      let loginStatus = '<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> No Login Yet</span>';
      let hoursAgo = 'N/A';

      if (student.last_login_at) {
        const loginDate = new Date(student.last_login_at);
        const diffMs = now - loginDate;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHrs / 24);

        if (diffHrs < 24) {
          presentCount += 1;
          loginStatus = '<span style="color:#22c55e;"><i class="fas fa-check-circle"></i> Present (Today)</span>';
          hoursAgo = diffHrs === 0 ? 'Just now' : diffHrs + ' hrs ago';
        } else {
          absentCount += 1;
          loginStatus = '<span style="color:#f59e0b;"><i class="fas fa-exclamation-circle"></i> Absent</span>';
          hoursAgo = diffDays === 1 ? 'Yesterday' : diffDays + ' days ago';
        }
      } else {
        absentCount += 1;
      }

      attHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="' + imgSrc + '" style="border-radius:50%; width:40px; height:40px; object-fit:cover;">' + student.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (student.class_id || 'Unknown') + '</span></div>' +
        '<div class="col-2">' + loginStatus + '</div>' +
        '<div class="col-2"><span style="color:#64748b; font-weight:800; font-size:0.9rem;">' + hoursAgo + '</span></div>' +
        '<div class="col-actions"></div></div>';
    });

    document.getElementById('attendanceTableBody').innerHTML = attHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No attendance records found.</div>';
    document.getElementById('attPresent').textContent = String(presentCount);
    document.getElementById('attAbsent').textContent = String(absentCount);

    const totalAttendance = students.length;
    const presentPercent = totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : 0;
    const absentPercent = totalAttendance ? Math.round((absentCount / totalAttendance) * 100) : 0;
    const attendanceRing = document.getElementById('attendanceRing');
    if (attendanceRing) {
      attendanceRing.style.background = 'conic-gradient(#243d6b 0% ' + presentPercent + '%, #ea8300 ' + presentPercent + '% ' + (presentPercent + absentPercent) + '%, #cb955d ' + (presentPercent + absentPercent) + '% 100%)';
    }
    document.getElementById('attendancePresentPercent').textContent = presentPercent + '%';
    document.getElementById('attendancePresentCount').textContent = String(presentCount);
    document.getElementById('attendanceAbsentCount').textContent = String(absentCount);
    document.getElementById('attendanceLeaveCount').textContent = String(pendingInvites);
  }

  window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('d-none');
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
  }
  window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('d-none');
  }
  window.copyCode = (code) => { navigator.clipboard.writeText(code); }
  
  window.copyCodeInteractive = (element, code) => {
    if(code && code !== 'Accepted' && code !== 'N/A' && code !== 'Unknown') {
      navigator.clipboard.writeText(code);
      const originalHtml = element.innerHTML;
      element.classList.add('copied');
      element.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        element.classList.remove('copied');
        element.innerHTML = originalHtml;
      }, 1500);
    }
  };

  window.switchAdminTab = (tab) => {
    ['overview', 'teachers', 'students', 'attendance', 'settings'].forEach(t => {
      document.getElementById('tab-' + t).classList.add('d-none');
      document.getElementById('nav-' + t).classList.remove('active');
    });
    document.getElementById('tab-' + tab).classList.remove('d-none');
    document.getElementById('nav-' + tab).classList.add('active');
  };

  window.addTeacherInvite = async (trigger) => {
    const name = document.getElementById('newTchName').value.trim();
    const classes = getSelectedClasses('newTchClasses');
    const cls = classes.join(', ');
    if(!name) return;

    const tchCode = genCode('TCH');
    const btn = trigger || document.querySelector('#teacherModal .btn-solid');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating...';
    }

    let photoURL = null;
    const file = document.getElementById('newTchPhoto').files[0];

    try {
      if (file) {
        if (btn) btn.textContent = 'Processing Photo...';
        photoURL = await prepareProfilePhoto(file);
      }

      await setDoc(doc(db, "invites", tchCode), {
        code: tchCode,
        role: 'teacher',
        school_id: currentAdminSession.school_id,
        class_id: cls,
        name: name,
        photoURL: photoURL,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      closeModal('teacherModal');
      document.getElementById('newTchName').value = '';
      document.getElementById('newTchPhoto').value = '';
      document.getElementById('newTchPicWrap').innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; color: inherit;"><i class="fas fa-camera mb-1" style="font-size: 1.6rem; color: #94a3b8;"></i><span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748b;">Photo</span></div>';
      document.getElementById('newTchPicWrap').style.border = '';
      // Reset checkboxes
      document.querySelectorAll('input[name="newTchClasses"]').forEach(cb => cb.checked = false);

      document.getElementById('codeSuccessTitle').textContent = 'Teacher Code Generated';
      document.getElementById('codeSuccessDesc').textContent = 'Send this code to ' + name + ' to register on the platform.';
      document.getElementById('codeSuccessBody').innerHTML = 
        '<div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:15px; padding:15px; margin:15px 0;">' +
        '<div style="font-size:0.8rem; color:#94a3b8; text-transform:uppercase; font-weight:800;">Teacher Code</div>' +
        '<div style="font-family:monospace; font-size:2rem; font-weight:800; color:#3b82f6; letter-spacing:2px; margin:5px 0;">' + tchCode + '</div>' +
        '<button class="btn-outline-light" onclick="navigator.clipboard.writeText(\\'' + tchCode + '\\');this.textContent=\\'Copied!\\'"><i class="fas fa-copy"></i> Copy</button></div>';

      openModal('codeSuccessModal');
      await loadDashboardData();
    } catch(err) {
      alert("Error generating code: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Confirm Teacher';
      }
    }
  };

  window.addStudentInvite = async (trigger) => {
    const name = document.getElementById('newStuName').value.trim();
    const cls = document.getElementById('newStuClass').value;
    if(!name) return;
    
    const stuCode = genCode('STU');
    const parCode = genCode('PAR');
    const btn = trigger || document.querySelector('#studentModal .btn-solid');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating...';
    }

    let photoURL = null;
    const file = document.getElementById('newStuPic').files[0];

    try {
      if (file) {
        if (btn) btn.textContent = 'Processing Photo...';
        photoURL = await prepareProfilePhoto(file);
      }

      await setDoc(doc(db, "invites", stuCode), {
        code: stuCode,
        role: 'student',
        school_id: currentAdminSession.school_id,
        class_id: cls,
        name: name,
        photoURL: photoURL,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      await setDoc(doc(db, "invites", parCode), {
        code: parCode,
        role: 'parent',
        school_id: currentAdminSession.school_id,
        linked_student_code: stuCode,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      closeModal('studentModal');
      document.getElementById('newStuName').value = '';
      document.getElementById('newStuPic').value = '';
      document.getElementById('newStuPicWrap').innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; color: inherit;"><i class="fas fa-camera mb-1" style="font-size: 1.8rem; color: #94a3b8; transition:color 0.2s;"></i><span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748b;">Photo</span></div>';
      document.getElementById('newStuPicWrap').style.border = '3px dashed #cbd5e1';
      
      document.getElementById('codeSuccessTitle').textContent = 'Student Codes Generated';
      document.getElementById('codeSuccessDesc').textContent = 'Share these codes for ' + name + ' and their parent.';
      document.getElementById('codeSuccessBody').innerHTML =
        '<div style="background:#fef9c3; border:2px dashed #fde047; border-radius:15px; padding:15px; margin:10px 0;">' +
        '<div style="font-size:0.8rem; color:#a16207; text-transform:uppercase; font-weight:800;">Student Code</div>' +
        '<div style="font-family:monospace; font-size:1.8rem; font-weight:800; color:#ca8a04; letter-spacing:2px; margin:5px 0;">' + stuCode + '</div>' +
        '<button class="btn-outline-light" onclick="navigator.clipboard.writeText(\\'' + stuCode + '\\');this.textContent=\\'Copied!\\'"><i class="fas fa-copy"></i> Copy</button></div>' +
        '<div style="background:#f0fdf4; border:2px dashed #86efac; border-radius:15px; padding:15px; margin:10px 0;">' +
        '<div style="font-size:0.8rem; color:#166534; text-transform:uppercase; font-weight:800;">Parent Code</div>' +
        '<div style="font-family:monospace; font-size:1.8rem; font-weight:800; color:#15803d; letter-spacing:2px; margin:5px 0;">' + parCode + '</div>' +
        '<button class="btn-outline-light" onclick="navigator.clipboard.writeText(\\'' + parCode + '\\');this.textContent=\\'Copied!\\'"><i class="fas fa-copy"></i> Copy</button></div>';
      
      openModal('codeSuccessModal');
      await loadDashboardData();
    } catch(err) {
      alert("Error generating codes: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Confirm Student';
      }
    }
  };

  window.editTeacher = (uid) => { 
    const tch = teachersList.find(t => t.uid === uid);
    if(tch) {
      document.getElementById('editTchId').value = uid;
      document.getElementById('editTchName').value = tch.name;
      // reset checkboxes
      document.querySelectorAll('input[name="editTchClasses"]').forEach(cb => cb.checked = false);
      const clsStr = tch.class_id || '';
      const clsArr = Array.isArray(clsStr) ? clsStr : String(clsStr).split(',').map(s => s.trim()).filter(Boolean);
      clsArr.forEach(c => {
        const cb = document.querySelector('input[name="editTchClasses"][value="' + c + '"]');
        if(cb) cb.checked = true;
      });
      if (tch.photoURL) {
        const wrap = document.getElementById('editTchPicWrap');
        wrap.innerHTML = '<img src="' + tch.photoURL + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
        wrap.style.border = 'none';
      } else {
        const wrap = document.getElementById('editTchPicWrap');
        wrap.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; color:inherit;"><i class="fas fa-camera mb-1" style="font-size:1.6rem; color:#94a3b8;"></i><span style="font-size:0.65rem; font-weight:800; color:#64748b; text-transform:uppercase;">Photo</span></div>';
        wrap.style.border = '';
      }
      openModal('editTeacherModal');
    }
  };

  window.saveEditTeacher = async (trigger) => {
    const uid = document.getElementById('editTchId').value;
    const name = document.getElementById('editTchName').value.trim();
    const classes = getSelectedClasses('editTchClasses');
    const classStr = classes.join(', ');
    if(!name) return;
    const file = document.getElementById('editTchPhoto').files[0];
    const btn = trigger || document.querySelector('#editTeacherModal .btn-solid');
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      }
      let photoURL = null;
      if (file) {
        photoURL = await prepareProfilePhoto(file);
      }

      const updatePayload = { name: name, class_id: classStr };
      if (photoURL) updatePayload.photoURL = photoURL;
      await updateDoc(doc(db, "users", uid), updatePayload);
      closeModal('editTeacherModal');
      await loadDashboardData();
    } catch(err) {
      alert("Error updating teacher: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Teacher Changes';
      }
    }
  };

  window.editStudent = (uid) => { 
    const stu = studentsList.find(s => s.uid === uid);
    if(stu) {
      document.getElementById('editStuId').value = uid;
      document.getElementById('editStuName').value = stu.name;
      document.getElementById('editStuClass').value = stu.class_id || '';
      openModal('editStudentModal');
    }
  };

  window.saveEditStudent = async () => {
    const uid = document.getElementById('editStuId').value;
    const name = document.getElementById('editStuName').value.trim();
    const cls = document.getElementById('editStuClass').value;
    if(!name) return;
    try {
      await updateDoc(doc(db, "users", uid), { name: name, class_id: cls });
      closeModal('editStudentModal');
      await loadDashboardData();
    } catch(err) {
      alert("Error updating student: " + err.message);
    }
  };

  window.deleteTeacher = async (uid) => {
    if (confirm("Are you sure you want to completely remove this Teacher? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        await loadDashboardData();
        alert("Teacher deleted successfully.");
      } catch(err) {
        alert("Error deleting teacher: " + err.message);
      }
    }
  };

  window.deleteStudent = async (uid) => {
    if (confirm("Are you sure you want to completely remove this Student? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        await loadDashboardData();
        alert("Student deleted successfully.");
      } catch(err) {
        alert("Error deleting student: " + err.message);
      }
    }
  };

</script>

`
