import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'

export const ParentDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');

  :root {
    --parent-blue: #243d6b;
    --parent-blue-deep: #1d3156;
    --parent-pink: #cf296d;
    --parent-orange: #ea8300;
    --parent-tan: #cb955d;
    --parent-ink: #1b2942;
    --parent-muted: #6f7f96;
    --parent-line: #dce6f1;
    --parent-soft-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  .parent-page {
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at top left, rgba(207,41,109,0.2), transparent 24%),
      radial-gradient(circle at bottom right, rgba(234,131,0,0.2), transparent 22%),
      linear-gradient(135deg, #0c1730 0%, #1d3156 100%);
    font-family: 'Nunito', sans-serif;
    color: var(--parent-ink);
  }

  .dashboard-shell {
    min-height: 100vh;
    width: 100%;
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    background: linear-gradient(180deg, #edf3fb 0%, #f7f9fc 100%);
  }

  .sidebar-panel {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1rem 0.75rem;
    background: linear-gradient(180deg, #1a2e50 0%, #12213a 100%);
    color: #ffffff;
    min-height: 100vh;
  }

  /* Profile at top of sidebar */
  .sidebar-profile-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0 0.9rem;
    border-bottom: 1px solid rgba(255,255,255,0.10);
  }
  .sidebar-profile-top .sidebar-brand-art {
    width: 62px; height: 62px; flex: 0 0 62px;
    border-radius: 50%; overflow: hidden;
    background: rgba(255,255,255,0.1);
    border: 2.5px solid rgba(255,255,255,0.5);
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    position: relative; cursor: pointer;
  }
  .sidebar-profile-top .sidebar-brand-art img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
  }
  .sidebar-profile-top .sidebar-title {
    font-family: 'Sora', sans-serif; font-size: 0.82rem; font-weight: 700;
    color: #ffffff; text-align: center; word-break: break-word; line-height: 1.3;
  }

  /* Compact sidebar header with school chip (home + logout icons) */
  .sidebar-brand-v2 {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 0.5rem !important;
    padding: 0.45rem 0.5rem 0.85rem !important;
    border-bottom: 1px solid rgba(255,255,255,0.12) !important;
  }
  .sidebar-profile-cluster {
    display: flex; align-items: center; gap: 0.55rem; min-width: 0; flex: 1 1 auto;
  }
  .sidebar-profile-cluster .sidebar-brand-art {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    border-radius: 50%;
    border-width: 2px;
  }
  .sidebar-name-block { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
  .sidebar-name-block .sidebar-title {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 8rem; font-size: 0.92rem;
  }
  .sidebar-school-chip {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.28rem 0.36rem 0.28rem 0.32rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 14px rgba(7,17,29,0.18);
    flex: 0 0 auto; min-width: 0;
  }
  .sidebar-school-art {
    width: 26px; height: 26px; flex: 0 0 26px; border-radius: 8px; overflow: hidden;
    background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.18); position: relative;
  }
  .sidebar-school-art img { width: 100%; height: 100%; object-fit: cover; }
  .sidebar-school-cam-badge {
    position: absolute; bottom: -2px; right: -2px;
    background: #D63678; border-radius: 50%; width: 14px; height: 14px;
    display: flex; align-items: center; justify-content: center; pointer-events: none;
    border: 1.5px solid #1f3559;
  }
  .sidebar-school-cam-badge i { color: #fff; font-size: 6px; }
  .sidebar-school-name {
    font-family: 'Sora', sans-serif; font-size: 0.72rem; font-weight: 700; color: #fff;
    letter-spacing: 0.2px; max-width: 5.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sidebar-chip-actions { display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.1rem; }
  .sidebar-icon-btn {
    width: 26px; height: 26px; flex: 0 0 26px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 50%; border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.12); color: #fff; cursor: pointer; font-size: 0.72rem;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  .sidebar-icon-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.22); }
  .sidebar-icon-btn.home {
    background: linear-gradient(135deg, #3a5891 0%, #243d6b 100%);
    border-color: rgba(255,255,255,0.28);
    box-shadow: 0 4px 10px rgba(36,61,107,0.35);
  }
  .sidebar-icon-btn.logout {
    background: linear-gradient(135deg, #ef4444 0%, #cf296d 100%);
    border-color: rgba(239,68,68,0.45);
    box-shadow: 0 4px 10px rgba(239,68,68,0.35);
  }
  .sidebar-icon-btn.logout:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c5e 100%);
    box-shadow: 0 6px 14px rgba(239,68,68,0.45);
  }
  .sidebar-icon-btn.refresh {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: rgba(16,185,129,0.45);
    box-shadow: 0 4px 10px rgba(16,185,129,0.35);
  }
  .sidebar-icon-btn.refresh:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 6px 14px rgba(16,185,129,0.45);
  }
  .sidebar-icon-btn.back {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    border-color: rgba(100,116,139,0.45);
    box-shadow: 0 4px 10px rgba(100,116,139,0.35);
  }
  .sidebar-icon-btn.back:hover {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    box-shadow: 0 6px 14px rgba(100,116,139,0.45);
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.25rem 0.35rem 0.95rem;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }

  .sidebar-brand-art {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 14px 24px rgba(7,17,29,0.22);
  }

  .sidebar-brand-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sidebar-kicker {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.66);
    margin-bottom: 0.2rem;
  }

  .sidebar-title {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
  }

  .sidebar-subtitle {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: rgba(255,255,255,0.72);
  }

  .sidebar-nav {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  .sidebar-nav li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.8rem;
    border-radius: 12px;
    font-family: 'Sora', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255,255,255,0.82);
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .sidebar-nav li:hover,
  .sidebar-nav li:focus-visible {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.12);
    outline: none;
  }

  .sidebar-nav li.active {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.16);
    box-shadow: 0 12px 24px rgba(7,17,29,0.16);
  }

  .nav-badge {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    color: #ffffff;
    font-size: 0.8rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  }

  .nav-badge.overview {
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
  }

  .nav-badge.child {
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
  }

  .nav-badge.approvals {
    background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%);
  }

  .nav-badge.family {
    background: linear-gradient(180deg, #d6a16d 0%, #cb955d 100%);
  }

  .sidebar-note {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.75rem;
    border-radius: 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .sidebar-note img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 12px 16px rgba(7,17,29,0.18));
  }

  .sidebar-note strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .sidebar-note span {
    display: block;
    margin-top: 0.18rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(255,255,255,0.72);
    line-height: 1.35;
  }

  .sidebar-logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    width: 100%;
    margin-top: auto;
    padding: 0.7rem 1rem;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    border-radius: 12px;
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  }
  .sidebar-logout-btn:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(239, 68, 68, 0.5);
  }

  .dashboard-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.78rem;
    padding: 0.85rem;
    background: linear-gradient(180deg, #f8eee8 0%, #f7f9fc 100%);
  }

  .workspace-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--parent-blue) 0%, #2b4677 52%, var(--parent-pink) 100%);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 18px 32px rgba(29,49,86,0.22);
  }

  .workspace-heading {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
  }

  .workspace-art {
    width: 66px;
    height: 66px;
    flex: 0 0 66px;
    border-radius: 18px;
    overflow: hidden;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.16);
  }

  .workspace-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .workspace-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.72);
    margin-bottom: 0.24rem;
  }

  .workspace-title {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.28rem, 2.4vw, 1.75rem);
    font-weight: 800;
    color: #ffffff;
  }

  .workspace-subtitle {
    margin: 0.3rem 0 0;
    font-size: 0.82rem;
    font-weight: 700;
    color: rgba(255,255,255,0.78);
    line-height: 1.45;
  }

  .workspace-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .dashboard-home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.48rem;
    padding: 0.68rem 0.9rem;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.14);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 12px 24px rgba(7,17,29,0.14);
    transition: transform 0.2s, background 0.2s, border-color 0.2s;
  }

  .dashboard-home-btn:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.24);
  }

  .workspace-profile {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0.8rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.16);
    white-space: nowrap;
  }

  .workspace-profile img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .workspace-profile strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .workspace-profile span {
    display: block;
    margin-top: 0.16rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(255,255,255,0.72);
  }

  .surface-card {
    background: #ffffff;
    border: 1px solid rgba(220,230,241,0.8);
    border-radius: 14px;
    padding: 0.85rem;
    box-shadow: 0 2px 12px rgba(15,23,42,0.05);
  }

  .stats-card {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
    background: transparent;
    padding: 0;
    box-shadow: none;
    border: none;
    margin-bottom: 0.6rem;
  }

  /* ── Compact stat cards: icon + number + label in a tight pill ── */
  .stat-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    min-height: unset;
    border-radius: 14px;
    padding: 0.75rem 0.85rem;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(15,23,42,0.14);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card[data-section] {
    cursor: pointer;
  }

  .stat-card[data-section]:hover,
  .stat-card[data-section]:focus-visible,
  .stat-card.is-active {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.2);
    outline: none;
  }

  .stat-card.points {
    background: linear-gradient(135deg, #314a7f 0%, #1d3156 100%);
  }
  .stat-card.chapters {
    background: linear-gradient(135deg, #df4a82 0%, #b91c5c 100%);
  }
  .stat-card.approvals {
    background: linear-gradient(135deg, #f0a43d 0%, #d97706 100%);
  }

  .stat-copy {
    position: relative;
    z-index: 1;
    width: 100%;
  }
  .stat-label {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.68);
    margin-bottom: 0.12rem;
  }
  .stat-value {
    font-family: 'Sora', sans-serif;
    font-size: 1.55rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    line-height: 1;
  }
  .stat-meta {
    display: block;
    margin-top: 0.22rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: rgba(255,255,255,0.72);
    line-height: 1.3;
  }
  /* Hide the 3D image on stat cards — keeps them tight */
  .stat-card img {
    display: none;
  }

  .action-queue-card {
    min-width: 0;
  }

  .family-notes-stack {
    display: grid;
    gap: 0.7rem;
  }

  .family-note-item,
  .family-note-empty {
    padding: 0.82rem 0.88rem;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid var(--parent-line);
  }

  .family-note-item strong,
  .family-note-empty strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--parent-ink);
  }

  .family-note-item span,
  .family-note-empty span {
    display: block;
    margin-top: 0.24rem;
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--parent-muted);
    line-height: 1.5;
  }

  .login-container {
    max-width: 400px;
    margin: 40px auto;
    text-align: center;
  }
  .pin-input {
    font-size: 2rem;
    letter-spacing: 0.5rem;
    text-align: center;
    border: 3px solid #cbd5e1;
    border-radius: 12px;
    padding: 10px;
    width: 200px;
    margin: 20px auto;
    display: block;
    outline: none;
    transition: border-color 0.3s;
    font-family: 'Fredoka One', cursive;
  }
  .pin-input:focus {
    border-color: var(--parent-pink);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.7rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.72rem;
    border-bottom: 1px solid var(--parent-line);
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    min-width: 0;
  }

  .section-asset {
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    border-radius: 14px;
    overflow: hidden;
    background: linear-gradient(180deg, #fff9f6 0%, #f7efe7 100%);
    border: 1px solid var(--parent-line);
  }

  .section-asset img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 5px;
  }

  .section-heading h3 {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--parent-ink);
  }

  .section-heading p {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--parent-muted);
    line-height: 1.45;
  }

  .section-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.46rem 0.72rem;
    border-radius: 999px;
    background: #fff2f8;
    border: 1px solid rgba(207,41,109,0.18);
    color: var(--parent-pink);
    font-size: 0.74rem;
    font-weight: 800;
  }

  .section-caption {
    margin: 0 0 0.9rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--parent-muted);
    line-height: 1.45;
  }

  /* ── Compact approval item row ── */
  .approval-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    background: #f8fafc;
    border: 1px solid #e8edf5;
    border-left: 3px solid var(--parent-pink);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.5rem;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  }
  .approval-item:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 14px rgba(207,41,109,0.08);
    border-left-color: #b91c5c;
    background: #fff;
  }
  .approval-item-info {
    min-width: 0;
    flex: 1;
  }
  .approval-item-title {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--parent-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .approval-item-sub {
    font-size: 0.7rem;
    color: var(--parent-muted);
    font-weight: 600;
    margin-top: 0.1rem;
    display: block;
  }
  .approval-item-action {
    flex: 0 0 auto;
  }
  .btn-open-sheet {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: linear-gradient(135deg, var(--parent-pink) 0%, #b91c5c 100%);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    font-size: 0.74rem;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(207,41,109,0.2);
    transition: transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .btn-open-sheet:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(207,41,109,0.28);
  }

  .parent-text-input {
    width: 100%;
    padding: 0.82rem 0.95rem;
    border: 1px solid var(--parent-line);
    border-radius: 12px;
    font-size: 0.95rem;
    margin: 10px 0;
    font-family: 'Nunito', sans-serif;
    background: #fdfefe;
  }
  .parent-text-input:focus {
    outline: none;
    border-color: var(--parent-orange);
    box-shadow: 0 0 0 3px rgba(234, 131, 0, 0.18);
  }

  .btn-approve {
    background: linear-gradient(135deg, var(--parent-pink) 0%, #b92460 100%);
    color: white;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    border: none;
    padding: 0.72rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.84rem;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 12px 20px rgba(207,41,109,0.18);
  }
  .btn-approve:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(207,41,109,0.22);
  }

  .link-student-card {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(260px, 0.55fr);
    gap: 1rem;
    align-items: center;
  }

  .link-copy h3 {
    margin: 0 0 0.45rem;
    font-family: 'Sora', sans-serif;
    font-size: 1.18rem;
    font-weight: 800;
    color: var(--parent-ink);
  }

  .link-copy p {
    margin: 0 0 0.9rem;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--parent-muted);
    line-height: 1.55;
  }

  .link-meta {
    display: grid;
    gap: 0.45rem;
  }

  .link-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: fit-content;
    padding: 0.46rem 0.7rem;
    border-radius: 999px;
    background: #fff7ef;
    border: 1px solid rgba(234,131,0,0.18);
    color: var(--parent-orange);
    font-size: 0.74rem;
    font-weight: 800;
  }

  .link-form-shell {
    background: linear-gradient(180deg, #fffefc 0%, #f9f4ef 100%);
    border: 1px solid var(--parent-line);
    border-radius: 16px;
    padding: 0.95rem;
  }

  .link-art-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 0.6rem;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(36,61,107,0.08) 0%, rgba(207,41,109,0.08) 100%);
    border: 1px solid var(--parent-line);
  }

  .link-art-panel img {
    width: min(220px, 100%);
    object-fit: contain;
    filter: drop-shadow(0 18px 26px rgba(15,23,42,0.12));
  }
  
  /* Modal Styles */
  .custom-modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(12px);
    z-index: 1050;
    justify-content: center;
    align-items: center;
  }
  .custom-modal {
    background: white;
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    position: relative;
    font-family: 'Nunito', sans-serif;
  }
  .modal-close-btn {
    position: absolute;
    top: 15px; right: 20px;
    background: none; border: none;
    font-size: 1.5rem;
    color: #94a3b8;
    cursor: pointer;
  }
  .modal-close-btn:hover { color: #f43f5e; }
  .grid-summary {
    background: #f1f5f9;
    padding: 15px;
    border-radius: 12px;
    margin: 15px 0;
    border: 1px solid #e2e8f0;
  }

  @media (max-width: 1100px) {
    .dashboard-shell {
      grid-template-columns: 1fr;
    }

    .sidebar-panel {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }

    .sidebar-brand {
      flex: 1 1 auto;
      padding-bottom: 0;
      border-bottom: none;
    }

    .sidebar-nav {
      width: 100%;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .sidebar-note {
      width: 100%;
      margin-top: 0;
    }

    .stats-card {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.4rem !important;
      margin: 0 !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    .stat-card {
      padding: 0.55rem 0.35rem !important;
      min-height: 0 !important;
      min-width: 0 !important;
      border-radius: 12px !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 0.15rem !important;
      text-align: center !important;
      overflow: hidden !important;
    }
    .stat-card img { display: none !important; }
    .stat-copy { gap: 0.1rem !important; align-items: center !important; text-align: center !important; min-width: 0 !important; }
    .stat-label {
      font-size: 0.55rem !important;
      letter-spacing: 0.02em !important;
      white-space: normal !important;
      line-height: 1.1 !important;
      overflow-wrap: anywhere !important;
    }
    .stat-value { font-size: 1.35rem !important; line-height: 1 !important; }
    .stat-meta { display: none !important; }

    .link-student-card {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .parent-page {
      font-size: 15px;
    }

    .dashboard-main {
      padding: 0.7rem;
    }

    .workspace-bar {
      flex-wrap: wrap;
      padding: 0.8rem;
    }

      .workspace-actions {
        width: 100%;
        flex-wrap: wrap;
      }

    .workspace-profile {
      width: 100%;
      justify-content: flex-start;
    }

    .sidebar-nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .section-header {
      flex-wrap: wrap;
    }
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
     DESKTOP POLISH — Parent Dashboard
     ============================================================ */
  :root {
    --brand-primary: #29416d;
    --brand-secondary: #cf296d;
    --brand-tertiary: #ea8300;
    --brand-success: #34d399;
    --brand-danger: #ef4444;
  }

  @media (min-width: 1280px) {
    .parent-page .app-container { grid-template-columns: 260px minmax(0, 1fr) !important; }
  }
  @media (min-width: 1600px) {
    .parent-page .app-container { grid-template-columns: 280px minmax(0, 1fr) !important; }
    .parent-page .hero-grid { gap: 1.5rem !important; }
  }

  .parent-page .hero-card,
  .parent-page .card-white,
  .parent-page .section-card,
  .parent-page .widget-card,
  .parent-page .panel-card {
    border-radius: 20px !important;
    box-shadow: 0 6px 22px rgba(41, 65, 109, 0.08), 0 1px 3px rgba(41, 65, 109, 0.04) !important;
    border: 1px solid rgba(41, 65, 109, 0.06) !important;
    transition: transform 0.25s ease, box-shadow 0.25s ease !important;
  }
  .parent-page .hero-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 34px rgba(41, 65, 109, 0.12), 0 3px 8px rgba(41, 65, 109, 0.05) !important;
  }

  .parent-page .hero-card.card-green  { background: linear-gradient(135deg, rgba(52, 211, 153, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-success) !important; }
  .parent-page .hero-card.card-yellow { background: linear-gradient(135deg, rgba(234, 131, 0, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-tertiary) !important; }
  .parent-page .hero-card.card-orange { background: linear-gradient(135deg, rgba(207, 41, 109, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-secondary) !important; }
  .parent-page .hero-card.card-blue   { background: linear-gradient(135deg, rgba(41, 65, 109, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-primary) !important; }

  .parent-page .metric-illustration,
  .parent-page .summary-card-illustration { opacity: 0.85; max-width: 110px !important; }

  .parent-page .btn-logout,
  .parent-page .btn-outline-light.btn-logout {
    background: linear-gradient(135deg, #ef4444 0%, #cf296d 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.28) !important;
    font-weight: 700 !important;
  }
  .parent-page .btn-logout:hover { background: linear-gradient(135deg, #dc2626 0%, #b91c5e 100%) !important; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(239, 68, 68, 0.36) !important; }
  .parent-page .btn-logout i { color: #ffffff !important; }

  .parent-page .nav-item.active,
  .parent-page .nav-link.active,
  .parent-page a.nav-item.active {
    background: linear-gradient(90deg, rgba(207, 41, 109, 0.18), transparent) !important;
    border-left: 3px solid var(--brand-secondary) !important;
    color: #ffffff !important;
  }

  @media (max-width: 1199px) and (min-width: 768px) {
    .parent-page .app-container { grid-template-columns: 200px minmax(0, 1fr) !important; }
    .parent-page .hero-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
  }
  @media (max-width: 767px) {
    .parent-page .app-container { grid-template-columns: 1fr !important; }
    .parent-page .top-nav { flex-direction: row !important; flex-wrap: wrap !important; padding: 0.6rem 0.8rem !important; gap: 0.5rem !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
    .parent-page .nav-brand { padding: 0 !important; border-bottom: none !important; flex: 1 1 auto; }
    .parent-page .brand-mark { width: 42px !important; height: 42px !important; }
    .parent-page .nav-list, .parent-page .nav-actions { width: 100% !important; }
    .parent-page .hero-grid { grid-template-columns: 1fr !important; gap: 0.8rem !important; }
    .parent-page .metric-illustration, .parent-page .summary-card-illustration { max-width: 80px !important; }
    .parent-page .hero-card { padding: 1rem !important; }
  }

  .mobile-bottom-actions { display: none; }
  @media (max-width: 760px) {
    .sidebar-chip-actions { display: none !important; }
    .parent-page .dashboard-main { padding-bottom: 74px !important; }
    .mobile-bottom-actions {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #ffffff;
      border-top: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 -4px 12px rgba(30,45,90,0.08);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 10px 10px calc(10px + env(safe-area-inset-bottom)) 10px;
    }
    .mobile-action-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; background: transparent; border: none;
      color: #64748b; font-size: 11px; font-weight: 700; cursor: pointer;
    }
    .mobile-action-btn i {
      font-size: 18px; color: #1e293b; margin-bottom: 2px;
      padding: 6px; border-radius: 10px; background: #f1f5f9;
    }
    .mobile-action-btn.logout i { color: #ffffff; background: #dc2626; }
  }

</style>

<div class="parent-page">
  <!-- DASHBOARD VIEW -->
  <div id="parentDashboardView" class="dashboard-shell d-none">
    <aside class="sidebar-panel">
      <div class="sidebar-profile-top">
        <div class="sidebar-brand-art" id="sidebarAvatarClickArea" title="Click to change photo" role="button" tabindex="0">
          <img id="sidebarProfilePhoto" src="/kidba_assets/img/3d_parent.png" alt="Parent profile">
          <div class="sidebar-cam-badge"><i class="fas fa-camera"></i></div>
          <input type="file" id="parentProfileFileInput" accept="image/*" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10;">
        </div>
        <span class="sidebar-title" id="sidebarProfileName">Parent Name</span>
      </div>

      <ul class="sidebar-nav">
        <li class="active" data-section="overview" role="button" tabindex="0"><span class="nav-badge overview"><i class="fas fa-chart-line"></i></span><span>Overview</span></li>
        <li data-section="child" role="button" tabindex="0"><span class="nav-badge child"><i class="fas fa-child"></i></span><span>Child Progress</span></li>
        <li data-section="approvals" role="button" tabindex="0"><span class="nav-badge approvals"><i class="fas fa-clipboard-check"></i></span><span>Needs Review</span></li>
      </ul>

      <button class="sidebar-logout-btn" type="button" onclick="logoutParent()">
        <i class="fas fa-sign-out-alt"></i>
        <span>LOGOUT</span>
      </button>
    </aside>

    <div class="dashboard-main">

      <div class="surface-card link-student-card d-none" id="linkStudentCard">
        <div class="link-copy">
          <span class="link-chip"><i class="fas fa-link"></i> Student Link Required</span>
          <h3>Connect Your Child</h3>
          <p>Enter the student invitation code once so you can review work and send notes to the teacher.</p>
          <div class="link-meta">
            <div class="link-form-shell">
              <input type="text" id="parentStudentCodeInput" class="parent-text-input text-center" placeholder="e.g. STU-XXXXXXXXXX" style="font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; text-transform: uppercase;">
              <button class="btn-approve mt-3 w-100" id="linkStudentBtn" onclick="linkStudentAction()">Connect Child Account</button>
            </div>
          </div>
        </div>
        <div class="link-art-panel">
          <img src="/kidba_assets/img/3d_parent.png" alt="Link student 3D icon">
        </div>
      </div>

      <div class="stats-card" id="statsCard">
        <div class="stat-card points" data-section="child" role="button" tabindex="0">
          <div class="stat-copy">
            <span class="stat-label">Reward Points</span>
            <h3 class="stat-value" id="totalPointsVal">0</h3>
            <span class="stat-meta">Points your child has earned so far.</span>
          </div>
          <img src="/kidba_assets/img/3d_student.png" alt="Points 3D icon">
        </div>

        <div class="stat-card chapters" data-section="child" role="button" tabindex="0">
          <div class="stat-copy">
            <span class="stat-label">Chapters Completed</span>
            <h3 class="stat-value" id="completedChapCount">0</h3>
            <span class="stat-meta">Chapters already submitted by your child.</span>
          </div>
          <img src="/kidba_assets/img/3d_school.png" alt="Chapter 3D icon">
        </div>

        <div class="stat-card approvals" data-section="approvals" role="button" tabindex="0">
          <div class="stat-copy">
            <span class="stat-label">Need Your Review</span>
            <h3 class="stat-value" id="parentPendingApprovals">0</h3>
            <span class="stat-meta">Open these sheets, add one short note, and send them to the teacher.</span>
          </div>
          <img src="/kidba_assets/img/3d_login.png" alt="Approval 3D icon">
        </div>
      </div>

      <section class="surface-card action-queue-card" id="actionQueueCard">
        <div class="section-header">
          <div class="section-heading">
            <div class="section-asset"><img src="/kidba_assets/img/3d_parent.png" alt="Approvals 3D icon"></div>
            <div>
              <h3>Actions Required</h3>
              <p>Only the sheets that need your review appear here.</p>
            </div>
          </div>
          <span class="section-chip" id="pendingCountBadge">0</span>
        </div>
        <p class="section-caption">Simple flow: open the sheet, write one good sentence, then send it forward for teacher review.</p>
        <div id="approvalsList">
          <!-- Injected via JS -->
        </div>
      </section>

      <section class="surface-card" id="familyNotesCard">
        <div class="section-header">
          <div class="section-heading">
            <div class="section-asset"><img src="/kidba_assets/img/3d_parent.png" alt="Family notes 3D icon"></div>
            <div>
              <h3>Recent Note History</h3>
              <p>Optional reference for the latest notes already sent from home.</p>
            </div>
          </div>
          <span class="section-chip" id="familyNotesCountChip">0</span>
        </div>
        <p class="section-caption">Use this panel only when you want to look back at your recent home notes.</p>
        <div id="familyNotesContent" class="family-notes-stack">
          <!-- Injected via JS -->
        </div>
      </section>
  </div>

  <div class="mobile-bottom-actions">
    <button class="mobile-action-btn" type="button" onclick="window.location.href='auth.html'">
      <i class="fas fa-house"></i><span>Home</span>
    </button>

    <button class="mobile-action-btn logout" type="button" onclick="window.logoutParent()">
      <i class="fas fa-sign-out-alt"></i><span>Logout</span>
    </button>
  </div>
</div>

<script type="module">
  // Defensive shim: ensure legacy DOM IDs always exist so JS innerHTML
  // assignments don't crash when the matching element was removed/restyled.
  (function ensureLegacyDomIds() {
    var ids = ['welcomeName', 'schoolNameTag', 'teacherInfo', 'classInfo'];
    function ensure() {
      ids.forEach(function (id) {
        if (!document.getElementById(id)) {
          var s = document.createElement('span');
          s.id = id;
          s.style.display = 'none';
          (document.body || document.documentElement).appendChild(s);
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensure, { once: true });
    } else {
      ensure();
    }
  })();

  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  const ACTIVITIES_DATA = ${raw(JSON.stringify(activitiesData))};
  
  let currentParent = null;
  let linkedStudent = null;
  let currentParentSection = 'overview';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function isVisible(element) {
    return !!(element && !element.classList.contains('d-none'));
  }

  function getParentSectionTarget(section) {
    const topSection = document.getElementById('parentTopSection');
    const linkCard = document.getElementById('linkStudentCard');
    const statsCard = document.getElementById('statsCard');
    const approvalsCard = document.getElementById('actionQueueCard');
    const familyCard = document.getElementById('familyNotesCard');
    const childTarget = isVisible(statsCard) ? statsCard : linkCard;

    if (section === 'child') return childTarget || topSection;
    if (section === 'approvals') return isVisible(approvalsCard) ? approvalsCard : (childTarget || topSection);
    if (section === 'family') return familyCard || (childTarget || topSection);
    return topSection;
  }

  function bindParentSectionControls() {
    document.querySelectorAll('.sidebar-nav li[data-section], .stat-card[data-section]').forEach((control) => {
      if (control.dataset.sectionBound === 'true') return;

      control.dataset.sectionBound = 'true';
      control.addEventListener('click', () => window.switchParentSection(control.dataset.section));
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.switchParentSection(control.dataset.section);
        }
      });
    });
  }

  window.switchParentSection = (section, shouldScroll = true) => {
    const nextSection = ['overview', 'child', 'approvals', 'family'].includes(section) ? section : 'overview';
    currentParentSection = nextSection;

    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((item) => {
      item.classList.toggle('active', item.dataset.section === nextSection);
    });

    document.querySelectorAll('.stat-card[data-section]').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.section === nextSection);
    });

    const target = getParentSectionTarget(nextSection);
    if (shouldScroll && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  function renderFamilyNotesPanel(pendingReviews, submissionList, state) {
    const contentEl = document.getElementById('familyNotesContent');
    const countEl = document.getElementById('familyNotesCountChip');
    if (!contentEl || !countEl) return;

    if (!linkedStudent) {
      countEl.textContent = 'Link first';
      contentEl.innerHTML = '<div class="family-note-empty"><strong>No child linked yet.</strong><span>Connect a student account to see note history and any pending home reviews.</span></div>';
      return;
    }

    const recentParentNotes = submissionList
      .filter((submission) => Array.isArray(submission.parentNotes) && submission.parentNotes.length)
      .slice(-3)
      .reverse();
    const parentApprovedCount = state && Array.isArray(state.parent_approved) ? state.parent_approved.length : 0;

    if (pendingReviews.length) {
      countEl.textContent = pendingReviews.length + ' pending';
    } else if (recentParentNotes.length) {
      countEl.textContent = recentParentNotes.length + ' notes';
    } else {
      countEl.textContent = 'Up to date';
    }

    let familyHtml =
      '<div class="family-note-item">' +
        '<strong>' + escapeHtml(linkedStudent.name || 'My Child') + '</strong>' +
        '<span>Notes sent: ' + parentApprovedCount + ' | Waiting for home review: ' + pendingReviews.length + '</span>' +
      '</div>';

    if (recentParentNotes.length) {
      recentParentNotes.forEach((submission) => {
        const latestNote = submission.parentNotes[submission.parentNotes.length - 1];
        familyHtml +=
          '<div class="family-note-item">' +
            '<strong>' + escapeHtml(getChapterTitle(submission.chapter_id)) + '</strong>' +
            '<span>' + escapeHtml(latestNote) + '</span>' +
          '</div>';
      });
    } else if (pendingReviews.length) {
      familyHtml += '<div class="family-note-empty"><strong>Next step</strong><span>Open Actions Required and add one good sentence before sending the sheet to the teacher.</span></div>';
    } else {
      familyHtml += '<div class="family-note-empty"><strong>No pending home actions.</strong><span>Your child is up to date. New note history will appear here after your next approval.</span></div>';
    }

    contentEl.innerHTML = familyHtml;
  }

  bindParentSectionControls();

  // ─── WebView-safe auth guard ───────────────────────────────────────────────
  // On Android WebView, Firebase fires onAuthStateChanged(null) briefly when
  // the app resumes from background. We wait up to 12 s before redirecting.
  let hasInitializedDashboard = false;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const waitOverlay = document.getElementById('authWaitOverlay');
      if (waitOverlay) waitOverlay.remove();
      const demoOverlay = document.getElementById('demoOverlay');
      if (demoOverlay) demoOverlay.remove();
      if (hasInitializedDashboard) return; // already loaded — ignore repeated calls
      hasInitializedDashboard = true;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'parent') {
          currentParent = { uid: user.uid, ...userDoc.data() };
          await initDashboard();
        } else {
          document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-lock" style="font-size:3rem; color:#E08020; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Parent Login Required</h3>
                 <p style="color:#64748b; margin-bottom:25px;">You cannot view this page with your current account.</p>
                 <button onclick="window.location.href = 'auth.html'" style="width:100%; padding:12px; background:#E08020; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
              </div>
            </div>
          \`);
        }
      } catch (err) {
        console.error("Error fetching parent profile:", err);
        document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ef4444; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Connection Error</h3>
                 <p style="color:#64748b; margin-bottom:25px;">Could not connect to the database. Please check your internet connection.</p>
                 <button onclick="window.location.reload()" style="width:100%; padding:12px; background:#E08020; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Retry</button>
              </div>
            </div>
          \`);
      }
    } else {
      // null — might be a temporary WebView resume flicker; wait before redirecting
      if (hasInitializedDashboard) return; // dashboard is already open — ignore

      const stored = (function () {
        try { return localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user'); } catch (e) { return null; }
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
        if (restored) return; // a fresh onAuthStateChanged with the user will fire
      }

      document.body.insertAdjacentHTML('beforeend', \`
        <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
          <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
             <i class="fas fa-lock" style="font-size:3rem; color:#E08020; margin-bottom:20px;"></i>
             <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Parent Login Required</h3>
             <p style="color:#64748b; margin-bottom:25px;">You must be logged in as a Parent to track your child's progress.</p>
             <button onclick="window.location.href = 'auth.html'" style="width:100%; padding:12px; background:#E08020; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
          </div>
        </div>
      \`);
    }
  });

  async function initDashboard() {
    const dashboardView = document.getElementById('parentDashboardView');
    dashboardView.classList.remove('d-none');
    
    document.getElementById('welcomeName').textContent = 'Parent Dashboard';
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating Student...';
    document.getElementById('parentPendingApprovals').textContent = '0';

    if (!currentParent.linked_student_code) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> No Student Linked';
      document.getElementById('teacherInfo').textContent = 'Please link a student below.';
      
      document.getElementById('statsCard').classList.add('d-none');
      document.getElementById('actionQueueCard').classList.add('d-none');
      document.getElementById('linkStudentCard').classList.remove('d-none');
      renderFamilyNotesPanel([], [], null);
      window.switchParentSection(currentParentSection, false);
      return;
    } else {
      document.getElementById('statsCard').classList.remove('d-none');
      document.getElementById('actionQueueCard').classList.remove('d-none');
      if(document.getElementById('linkStudentCard')) document.getElementById('linkStudentCard').classList.add('d-none');
    }

    // Firestore rules only let a parent read users of their OWN school, so
    // the query must carry the school_id filter to be allowed.
    const stq = query(collection(db, "users"),
      where("school_id", "==", currentParent.school_id || ''),
      where("invitation_code", "==", currentParent.linked_student_code));
    const sqSnap = await getDocs(stq);
    if (sqSnap.empty) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> Student Not Registered Yet';
      document.getElementById('teacherInfo').textContent = 'Waiting for student to use their invite code.';
      return;
    }

    linkedStudent = { uid: sqSnap.docs[0].id, ...sqSnap.docs[0].data() };

    // Keep the child's uid on the parent doc — the security rules use it to
    // grant this parent access to the child's submissions and approvals.
    if (currentParent.linked_student_uid !== linkedStudent.uid) {
      try {
        await updateDoc(doc(db, "users", currentParent.uid), { linked_student_uid: linkedStudent.uid });
        currentParent.linked_student_uid = linkedStudent.uid;
      } catch (e) { console.warn('Could not save linked_student_uid:', e); }
    }

    // Fetch school name if available
    let schoolNameStr = 'Parent Dashboard';
    if (linkedStudent.school_id && !linkedStudent.school_name) {
      try {
        const schoolSnap = await getDoc(doc(db, "schools", linkedStudent.school_id));
        if (schoolSnap.exists()) {
          linkedStudent.school_name = schoolSnap.data().name;
          if (schoolSnap.data().logo_url) {
            const sl = document.getElementById('schoolLogoImg');
            if (sl) sl.src = schoolSnap.data().logo_url;
          }
        }
      } catch (e) { console.error(e); }
    }
    if (linkedStudent.school_name) {
      schoolNameStr = linkedStudent.school_name;
    }

    document.getElementById('welcomeName').textContent = schoolNameStr;
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-home"></i> Tracking: ' + linkedStudent.name;
    
    let classLabelStr = linkedStudent.class_name || linkedStudent.class_id || 'Unassigned';
    classLabelStr = classLabelStr.replace(/Class\s*(Class\s*)+/gi, 'Class ');
    if (!classLabelStr.toLowerCase().startsWith('class')) classLabelStr = 'Class ' + classLabelStr;
    document.getElementById('teacherInfo').textContent = classLabelStr;

    const gameState = linkedStudent.game_state || { points:0, unlockedCount:1, completed:[], parent_approved:[], teacher_approved:[] };
    if (!gameState.parent_approved) gameState.parent_approved = [];
    if (!gameState.completed) gameState.completed = [];

    document.getElementById('totalPointsVal').textContent = gameState.points || 0;
    document.getElementById('completedChapCount').textContent = gameState.completed.length;

    const subQ = query(collection(db, "activity_submissions"), where("student_uid", "==", linkedStudent.uid));
    const subSnap = await getDocs(subQ);
    
    let allSubmissions = {};
    let submissionList = [];
    subSnap.forEach(docSnap => {
      const submissionData = { id: docSnap.id, ...docSnap.data() };
      allSubmissions[submissionData.chapter_id] = submissionData;
      submissionList.push(submissionData);
    });

    const pendingChapters = gameState.completed.filter(id => !gameState.parent_approved.includes(id));
    let pendingReviews = [];

    pendingChapters.forEach(chap => {
       let sub = allSubmissions[chap];
       pendingReviews.push({
          studentName: linkedStudent.name, 
          chapId: chap,
         docId: sub ? sub.id : (linkedStudent.uid + '_' + chap),
         answer: sub ? sub.discussionText : "Submission details are missing for this chapter. Ask the student to reopen the activity if this remains blank.",
          grid: sub ? sub.gridState : null,
          status: 'Waiting for Parent'
       });
    });

    document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
    document.getElementById('parentPendingApprovals').textContent = String(pendingReviews.length);
    renderFamilyNotesPanel(pendingReviews, submissionList, gameState);
    
    const listEl = document.getElementById('approvalsList');
    if (pendingReviews.length === 0) {
      listEl.innerHTML = '<div class="text-center p-4"><i class="fas fa-check-circle text-success fa-3x mb-3"></i><h4>All Caught Up!</h4><p class="text-muted">No pending activities require your attention.</p></div>';
    } else {
      let htmlSnippet = '';
      pendingReviews.forEach((rev) => {
        let cTitle = getChapterTitle(rev.chapId);
        let rawData = encodeURIComponent(JSON.stringify(rev));
        htmlSnippet +=
          '<div class="approval-item">' +
            '<div class="approval-item-info">' +
              '<p class="approval-item-title"><i class="fas fa-clock" style="color:#f59e0b; font-size:0.65rem; margin-right:4px;"></i>' + escapeHtml(cTitle) + '</p>' +
              '<span class="approval-item-sub">From: ' + escapeHtml(rev.studentName) + ' &nbsp;&middot;&nbsp; Waiting for your review</span>' +
            '</div>' +
            '<div class="approval-item-action">' +
              '<button class="btn-open-sheet" onclick="openParentReviewModal(\\'' + rawData + '\\')"><i class="fas fa-eye"></i> Review</button>' +
            '</div>' +
          '</div>';
      });
      listEl.innerHTML = htmlSnippet;
    }

    window.switchParentSection(currentParentSection, false);
  }
  
  function getChapterTitle(chapId) {
    let title = chapId;
    ['book1', 'book2', 'book3'].forEach(b => {
      if(ACTIVITIES_DATA[b] && ACTIVITIES_DATA[b].chapters) {
        Object.values(ACTIVITIES_DATA[b].chapters).forEach(c => {
          if(c.id === chapId) title = c.title;
        });
      }
    });
    return title;
  }

  function generateGridHtml(chapId, gridState) {
    let chapterData = null;
    ['book1', 'book2', 'book3'].forEach(b => {
      if(ACTIVITIES_DATA[b] && ACTIVITIES_DATA[b].chapters) {
        Object.values(ACTIVITIES_DATA[b].chapters).forEach(c => {
          if(c.id === chapId) {
             chapterData = c;
          }
        });
      }
    });
    if (!chapterData || !chapterData.sections) return '<p class="text-danger">Activity details not found.</p>';
    
    const statesList = ['', 'yes', 'no'];
    const iconList = {
      '': '<span style="color:#cbd5e1;">-</span>',
      'yes': '<i class="fas fa-check-circle text-success fs-5"></i>',
      'no': '<i class="fas fa-times-circle text-danger fs-5"></i>'
    };

    let htmlContent = '<div class="table-responsive"><table class="table table-bordered text-center align-middle" style="background:white; border-radius:10px; overflow:hidden;">';
    htmlContent += '<thead style="background:#FDF8F5; font-family: &quot;Fredoka One&quot;, cursive; color:#1E2D5A;"><tr><th class="text-start">Activity</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th></tr></thead><tbody>';
    
    let cellIndex = 0;
    chapterData.sections.forEach(section => {
      htmlContent += '<tr style="background:rgba(214,54,120,0.05); font-weight:bold; color:#D63678;"><td colspan="8" class="text-start p-2">' + section.heading + '</td></tr>';
      section.questions.forEach(q => {
        htmlContent += '<tr><td class="text-start fw-bold text-secondary p-2" style="font-size:0.85rem;">' + q + '</td>';
        for (let d = 0; d < 7; d++) {
           let stIdx = (gridState && gridState.cells && gridState.cells.length > cellIndex) ? gridState.cells[cellIndex] : 0;
           htmlContent += '<td class="p-1">' + iconList[statesList[stIdx]] + '</td>';
           cellIndex++;
        }
        htmlContent += '</tr>';
      });
    });
    htmlContent += '</tbody></table></div>';
    return htmlContent;
  }

  const modalHTML = 
    '<div class="custom-modal-overlay" id="parentReviewModalOverlay">' +
      '<div class="custom-modal" id="parentReviewModal">' +
        '<button class="modal-close-btn" onclick="closeParentReviewModal()"><i class="fas fa-times"></i></button>' +
        '<h3 style="font-family: &quot;Fredoka One&quot;, cursive; color:#1e293b;"><i class="fas fa-clipboard-check text-primary"></i> Activity Sheet Review</h3>' +
        '<p class="text-muted" id="p_rmStudentInfo" style="font-size: 0.9rem; margin-bottom: 20px;"></p>' +
        '<h5 style="color:#D63678; font-weight:800; font-size:1rem;">Discussion Answer:</h5>' +
        '<div class="student-discussion-text mb-3 p-3 bg-light rounded border" id="p_rmDiscussion"></div>' +
        '<h5 style="color:#D63678; font-weight:800; font-size:1rem; margin-top:15px;">Daily Action Grid Details:</h5>' +
        '<div class="grid-summary" id="p_rmGrid"></div>' +
        '<h5 style="color:#D63678; font-weight:800; font-size:1rem; margin-top:15px;">Your "One Good Sentence":</h5>' +
        '<input type="text" id="modalSentenceInput" class="parent-text-input mb-4" placeholder="e.g., MashaAllah, I saw Ali practicing patience today...">' +
        '<div class="text-center mt-4" id="p_rmActionBtn"></div>' +
      '</div>' +
    '</div>';
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  window.openParentReviewModal = (rawData) => {
    let rev = JSON.parse(decodeURIComponent(rawData));
    document.getElementById('p_rmStudentInfo').innerHTML = '<strong>' + rev.studentName + '</strong> &bull; ' + getChapterTitle(rev.chapId);
    document.getElementById('p_rmDiscussion').innerText = rev.answer;
    
    let gridHtml = 'No grid data captured.';
    if(rev.grid && rev.chapId) {
      gridHtml = generateGridHtml(rev.chapId, rev.grid);
    }
    document.getElementById('p_rmGrid').innerHTML = gridHtml;
    
    document.getElementById('modalSentenceInput').value = '';

    document.getElementById('p_rmActionBtn').innerHTML = 
      '<button class="btn-approve px-5 py-2 fs-5" id="parentApproveBtn" onclick="approveFromModal(\\'' + rev.chapId + '\\', \\'' + rev.docId + '\\')"><i class="fas fa-check me-2"></i> Send to Teacher</button>';

    document.getElementById('parentReviewModalOverlay').style.display = 'flex';
    document.getElementById('parentReviewModal').classList.add('animate__animated', 'animate__zoomIn');
  };

  window.closeParentReviewModal = () => {
    document.getElementById('parentReviewModalOverlay').style.display = 'none';
    document.getElementById('parentReviewModal').classList.remove('animate__animated', 'animate__zoomIn');
  };

  window.linkStudentAction = async () => {
    const codeInput = document.getElementById('parentStudentCodeInput');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    if (!code) {
      alert("Please enter a student code!");
      return;
    }
    
    const btn = document.getElementById('linkStudentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Linking...';

    try {
      // School filter required by security rules (parents may only read
      // users of their own school).
      const stq = query(collection(db, "users"),
        where("school_id", "==", currentParent.school_id || ''),
        where("invitation_code", "==", code));
      const sqSnap = await getDocs(stq);

      if (sqSnap.empty) {
        alert("Student code not found. Make sure the student has created their account first.");
        btn.disabled = false;
        btn.innerHTML = 'Link Student Account';
        return;
      }

      const studentUid = sqSnap.docs[0].id;
      const parentRef = doc(db, "users", currentParent.uid);
      await updateDoc(parentRef, { linked_student_code: code, linked_student_uid: studentUid });

      alert("Successfully linked to student profile!");
      currentParent.linked_student_code = code;
      currentParent.linked_student_uid = studentUid;
      
      await initDashboard();

    } catch (error) {
      console.error(error);
      alert("Error linking student: " + error.message);
      btn.disabled = false;
      btn.innerHTML = 'Link Student Account';
    }
  };

  window.approveFromModal = async (chapterId, docId) => {
    const sentenceInput = document.getElementById('modalSentenceInput');
    const approvalNote = sentenceInput.value.trim();
    if(approvalNote.split(' ').length < 2) {
      alert("Please write at least one meaningful sentence!");
      return;
    }
    
    const btn = document.getElementById('parentApproveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Approving...';

    try {
      const submissionId = docId && docId !== 'null'
        ? docId
        : (linkedStudent && linkedStudent.uid ? (linkedStudent.uid + '_' + chapterId) : '');

      if (!submissionId) {
        throw new Error('Student submission reference is missing.');
      }

      const subRef = doc(db, "activity_submissions", submissionId);
      const subSnap = await getDoc(subRef);
      if (!subSnap.exists()) {
        throw new Error('The student activity sheet was not found. Ask the student to submit this chapter again before approving it.');
      }

      const approvalTimestamp = new Date().toISOString();
      const submissionData = subSnap.data();
      const submissionUpdate = {
        parentNotes: [approvalNote],
        reviewStatus: 'pending_teacher',
        parentApprovedAt: approvalTimestamp,
        parentApprovedBy: currentParent ? currentParent.uid : '',
        updatedAt: approvalTimestamp
      };

      if (linkedStudent && linkedStudent.school_id) {
        submissionUpdate.school_id = linkedStudent.school_id;
      }

      if (!submissionData.student_uid && linkedStudent && linkedStudent.uid) {
        submissionUpdate.student_uid = linkedStudent.uid;
      }

      if (!submissionData.chapter_id && chapterId) {
        submissionUpdate.chapter_id = chapterId;
      }

      const batch = writeBatch(db);
      batch.update(subRef, submissionUpdate);

      if (linkedStudent && linkedStudent.uid) {
        const stuRef = doc(db, "users", linkedStudent.uid);
        batch.update(stuRef, {
          "game_state.parent_approved": arrayUnion(chapterId)
        });
      }

      await batch.commit();

      closeParentReviewModal();
      await initDashboard(); // Refresh
      alert("✅ Approved! This activity is now waiting for the Teacher's review.");
    } catch(err) {
      console.error(err);
      alert("Error approving activity: " + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check me-2"></i> Send to Teacher';
    }
  };

  // ── Parent Profile Photo Upload ──
  async function uploadParentProfile(file) {
    if (!currentParent || !file) return;
    if (!file.type || !file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
    const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
    const badge = document.querySelector('#sidebarAvatarClickArea .sidebar-cam-badge');
    if (badge) badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const scope = currentParent.school_id ? 'schools/' + currentParent.school_id : 'independent';
      const storageRef = ref(storage, scope + '/users/' + currentParent.uid + '/profile-' + Date.now() + '.' + ext);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', currentParent.uid), { photoURL: downloadURL });
      currentParent.photoURL = downloadURL;
      if (sidebarPhoto) sidebarPhoto.src = downloadURL;
    } catch (err) {
      console.error('Parent profile upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      if (badge) badge.innerHTML = '<i class="fas fa-camera"></i>';
    }
  }

  // File input is now directly inside avatar div — direct user touch triggers picker
  const parentFileInput = document.getElementById('parentProfileFileInput');
  if (parentFileInput) {
    parentFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await uploadParentProfile(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  window.logoutParent = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
      window.location.href = 'auth.html';
    }).catch(() => {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
      window.location.href = 'auth.html';
    });
  };
</script>
`
