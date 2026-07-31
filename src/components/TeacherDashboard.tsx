import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'

export const TeacherDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');

  :root {
    --teacher-blue: #243d6b;
    --teacher-blue-deep: #1d3156;
    --teacher-pink: #cf296d;
    --teacher-orange: #ea8300;
    --teacher-tan: #cb955d;
    --teacher-ink: #1b2942;
    --teacher-muted: #6f7f96;
    --teacher-line: #dce6f1;
    --teacher-surface: #eef4fb;
    --teacher-soft-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  .teacher-page {
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at top left, rgba(207,41,109,0.22), transparent 26%),
      radial-gradient(circle at bottom right, rgba(234,131,0,0.16), transparent 24%),
      linear-gradient(135deg, #0c1730 0%, #1d3156 100%);
    font-family: 'Nunito', sans-serif;
    color: var(--teacher-ink);
  }

  .dashboard-shell {
    min-height: 100vh;
    width: 100%;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    background: linear-gradient(180deg, #dfe9f7 0%, #eef4fb 100%);
  }

  .sidebar-panel {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 0.9rem 0.75rem;
    background: linear-gradient(180deg, var(--teacher-blue) 0%, var(--teacher-blue-deep) 100%);
    color: #ffffff;
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

  .sidebar-nav li:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.12);
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

  .nav-badge.students {
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
  }

  .nav-badge.review {
    background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%);
  }

  .nav-badge.reports {
    background: linear-gradient(180deg, #d6a16d 0%, #cb955d 100%);
  }

  .nav-badge.attendance {
    background: linear-gradient(180deg, #1d8f95 0%, #136f7f 100%);
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
    gap: 0.5rem;
    width: calc(100% - 2rem);
    margin: 0.6rem 1rem 0.8rem;
    padding: 0.55rem 1rem;
    background: rgba(255,255,255,0.08);
    border: 1.5px solid rgba(255,255,255,0.22);
    border-radius: 10px;
    color: rgba(255,255,255,0.85);
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
  }
  .sidebar-logout-btn:hover {
    background: rgba(214,54,120,0.55);
    color: #fff;
  }

  .dashboard-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.78rem;
    padding: 0.85rem;
    background: linear-gradient(180deg, #ebf3fb 0%, #f7f9fc 100%);
  }

  .workspace-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--teacher-blue) 0%, #2b4677 52%, var(--teacher-pink) 100%);
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

  .workspace-profile div {
    min-width: 0;
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

  /* ── Compact summary cards ── */
  .summary-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.55rem;
    margin-bottom: 0.55rem;
  }

  .summary-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.18rem;
    padding: 0.75rem 0.85rem;
    border-radius: 14px;
    color: #ffffff;
    min-height: unset;
    box-shadow: 0 4px 14px rgba(15,23,42,0.14);
  }

  .summary-card.summary-link {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .summary-card.summary-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.2);
  }
  .summary-card.summary-link.is-active {
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.2);
    outline: 2px solid rgba(255,255,255,0.38);
    outline-offset: -2px;
  }

  .summary-card.students  { background: linear-gradient(135deg, #314a7f 0%, #1d3156 100%); }
  .summary-card.pending   { background: linear-gradient(135deg, #df4a82 0%, #b91c5c 100%); }
  .summary-card.points    { background: linear-gradient(135deg, #f0a43d 0%, #d97706 100%); }
  .summary-card.attendance{ background: linear-gradient(135deg, #d6a16d 0%, #b7763d 100%); }
  .summary-card.absent    { background: linear-gradient(135deg, #f43f5e 0%, #c2143a 100%); }

  .summary-copy { position: relative; z-index: 1; width: 100%; }
  .summary-label {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.68);
    margin-bottom: 0.1rem;
  }
  .summary-value {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }
  .summary-meta {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.62rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    line-height: 1.3;
  }
  /* Hide 3D images from summary cards */
  .summary-card img { display: none; }

  .teacher-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    align-items: start;
  }

  .surface-card {
    background: #ffffff;
    border: 1px solid rgba(220,230,241,0.8);
    border-radius: 14px;
    padding: 0.85rem;
    box-shadow: 0 2px 10px rgba(15,23,42,0.05);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.7rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.72rem;
    border-bottom: 1px solid var(--teacher-line);
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    min-width: 0;
  }

  /* Compact section asset — icon area */
  .section-asset {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 10px;
    overflow: hidden;
    background: #f0f6ff;
    border: 1px solid var(--teacher-line);
  }
  .section-asset img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }

  .section-heading h3 {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--teacher-ink);
  }

  .section-heading p {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--teacher-muted);
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
    color: var(--teacher-pink);
    font-size: 0.74rem;
    font-weight: 800;
  }

  .section-caption {
    margin: 0 0 0.9rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--teacher-muted);
    line-height: 1.45;
  }

  .teacher-tab-panels {
    display: flex;
    flex-direction: column;
    gap: 0.78rem;
  }

  .teacher-panel {
    display: none;
  }

  .teacher-panel.active {
    display: block;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .quick-link-card {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.95rem;
    text-align: left;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    border: 1px solid var(--teacher-line);
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .quick-link-card:hover {
    transform: translateY(-1px);
    border-color: rgba(36, 61, 107, 0.2);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }

  .quick-link-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--teacher-ink);
  }

  .quick-link-copy span {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.45;
    color: var(--teacher-muted);
  }

  .surface-card.compact {
    height: 100%;
  }

  .snapshot-list {
    display: grid;
    gap: 0.7rem;
  }

  .snapshot-item {
    padding: 0.85rem 0.95rem;
    border-radius: 14px;
    background: #f8fbff;
    border: 1px solid var(--teacher-line);
  }

  .snapshot-item strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--teacher-ink);
  }

  .snapshot-item span {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--teacher-muted);
  }

  .student-roster {
    display: grid;
    gap: 0.8rem;
  }

  .student-roster-group {
    display: grid;
    gap: 0.8rem;
  }

  .student-roster-group-title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.72rem;
    border-radius: 999px;
    background: rgba(36, 61, 107, 0.08);
    color: var(--teacher-blue);
    font-family: 'Sora', sans-serif;
    font-size: 0.76rem;
    font-weight: 800;
  }

  /* ── Compact student roster items ── */
  .student-roster-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e8edf5;
    border-left: 3px solid var(--teacher-blue);
    box-shadow: none;
    transition: transform 0.16s, background 0.16s;
  }
  .student-roster-item:hover {
    background: #fff;
    transform: translateX(2px);
    box-shadow: 0 3px 12px rgba(36,61,107,0.07);
  }

  .student-roster-copy {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .student-roster-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--teacher-ink);
  }

  .student-roster-copy span {
    display: block;
    margin-top: 0.18rem;
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.45;
    color: var(--teacher-muted);
  }

  .student-roster-classline {
    color: var(--teacher-blue);
  }

  /* Smaller roster avatar */
  .student-roster-photo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--teacher-line);
    background: #fff;
    flex: 0 0 32px;
  }

  .student-roster-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--teacher-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .student-roster-copy span {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.68rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--teacher-muted);
  }
  .student-roster-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.3rem;
  }

  /* Compact roster action buttons */
  .student-roster-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: nowrap;
    justify-content: flex-end;
    flex: 0 0 auto;
  }
  .quick-link-action {
    border: none;
    border-radius: 999px;
    padding: 0.38rem 0.75rem;
    background: linear-gradient(135deg, var(--teacher-blue) 0%, #2b4677 100%);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(36, 61, 107, 0.18);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    white-space: nowrap;
  }
  .quick-link-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(36, 61, 107, 0.24);
  }
  .quick-link-action.secondary {
    background: #eef4fb;
    color: var(--teacher-blue);
    border: 1px solid var(--teacher-line);
    box-shadow: none;
  }

  .leaderboard-card,
  .review-queue-card {
    min-width: 0;
  }

  .attendance-card {
    min-width: 0;
  }

  .attendance-list {
    display: grid;
    gap: 0.72rem;
    max-height: 430px;
    overflow-y: auto;
    padding-right: 0.1rem;
  }

  .attendance-item {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 0.8rem 0.84rem;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid var(--teacher-line);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .attendance-item:hover {
    transform: translateY(-1px);
    border-color: rgba(36,61,107,0.2);
    box-shadow: 0 10px 20px rgba(15,23,42,0.06);
  }

  .attendance-stamp {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
    color: #ffffff;
    font-size: 0.94rem;
    box-shadow: 0 10px 20px rgba(29,49,86,0.14);
  }

  .attendance-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .attendance-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--teacher-ink);
  }

  .attendance-copy span {
    display: block;
    margin-top: 0.18rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--teacher-muted);
    line-height: 1.4;
  }

  .attendance-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.55rem;
  }

  .attendance-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.35rem 0.62rem;
    border-radius: 999px;
    font-size: 0.71rem;
    font-weight: 800;
  }

  .attendance-pill.started {
    background: #eef6ff;
    color: #1d4ed8;
  }

  .attendance-pill.completed {
    background: #dcfce7;
    color: #15803d;
  }

  .attendance-pill.revisit {
    background: #fff2f8;
    color: #be185d;
  }

  .attendance-pill.time {
    background: #f8fafc;
    color: #475569;
  }

  .attendance-pill.duration {
    background: #fff7ed;
    color: #c2410c;
  }

  .attendance-empty {
    padding: 1.2rem;
    border-radius: 14px;
    background: #f8fbff;
    border: 1px dashed #cbd5e1;
    text-align: center;
    color: var(--teacher-muted);
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.5;
  }

  .student-rank-item {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    padding: 0.72rem 0.8rem;
    border-radius: 14px;
    margin-bottom: 0.68rem;
    background: #ffffff;
    box-shadow: none;
    border: 1px solid var(--teacher-line);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .student-rank-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(15,23,42,0.06);
    border-color: rgba(36,61,107,0.2);
  }

  .rank-badge {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 900;
    color: white;
    font-size: 0.9rem;
    box-shadow: 0 4px 10px rgba(15,23,42,0.08);
  }

  .rank-1 { background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%); }
  .rank-2 { background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%); }
  .rank-3 { background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%); }
  .rank-other { background: #e2e8f0; color: #475569; box-shadow: none; }

  .student-avatar {
    width: 38px;
    height: 38px;
    background: #f7fbff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1rem;
    color: var(--teacher-blue);
    border: 1px solid var(--teacher-line);
  }

  .student-name {
    flex-grow: 1;
    min-width: 0;
    font-weight: 800;
    font-size: 0.94rem;
    color: var(--teacher-ink);
  }

  .student-rank-copy {
    flex-grow: 1;
    min-width: 0;
  }

  .student-rank-subtitle {
    margin-top: 0.16rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--teacher-muted);
  }

  .student-score {
    font-family: 'Sora', sans-serif;
    color: var(--teacher-orange);
    font-size: 0.96rem;
    font-weight: 800;
    white-space: nowrap;
  }

  /* ── Compact review items ── */
  .review-item {
    background: #f8fafc;
    border: 1px solid #e8edf5;
    border-left: 3px solid var(--teacher-pink);
    border-radius: 10px;
    padding: 0.65rem 0.8rem;
    margin-bottom: 0.5rem;
    position: relative;
    transition: transform 0.18s, background 0.18s, box-shadow 0.18s;
  }
  .review-item:hover {
    background: #fff;
    transform: translateX(2px);
    box-shadow: 0 4px 14px rgba(207,41,109,0.07);
  }

  .student-discussion-text {
    background: #f8fbff;
    padding: 0.82rem;
    border-radius: 12px;
    font-style: italic;
    color: #475569;
    border: 1px dashed #cbd5e1;
    margin: 0.8rem 0;
    font-size: 0.84rem;
  }

  .btn-approve {
    background: linear-gradient(135deg, var(--teacher-pink) 0%, #b92460 100%);
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
    transform: translateY(-1px);
    box-shadow: 0 14px 24px rgba(207,41,109,0.22);
  }

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
    border-color: var(--teacher-blue);
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
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .sidebar-note {
      width: 100%;
      margin-top: 0;
    }

    .summary-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .summary-card {
      flex-direction: column;
      text-align: center;
      justify-content: center;
      padding: 1.5rem 0.5rem;
    }
    .summary-meta {
      display: none;
    }
    .teacher-grid {
      grid-template-columns: 1fr;
    }

    .overview-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .teacher-page {
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

    .summary-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .summary-card {
      flex-direction: column;
      text-align: center;
      justify-content: center;
      padding: 1.5rem 0.5rem;
    }
    .summary-meta {
      display: none;
    }

    .student-roster-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .student-roster-actions {
      width: 100%;
      justify-content: stretch;
    }

    .quick-link-action {
      width: 100%;
    }
  }

  /* === BOOKS READER === */
  /* New compact list (matches student dashboard book accordion look) */
  .teacher-book-list {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-top: 1rem;
  }
  .teacher-book-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem 1rem 1.35rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid rgba(41, 65, 109, 0.08);
    box-shadow: 0 8px 22px rgba(41, 65, 109, 0.07), 0 1px 3px rgba(41, 65, 109, 0.04);
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .teacher-book-row::before {
    content: '';
    position: absolute;
    left: 0; top: 14%; bottom: 14%;
    width: 4px;
    border-radius: 0 4px 4px 0;
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
    box-shadow: 0 4px 14px rgba(207, 41, 109, 0.25);
  }
  .teacher-book-row:nth-child(2)::before { background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%); box-shadow: 0 4px 14px rgba(234,131,0,0.25); }
  .teacher-book-row:nth-child(3)::before { background: linear-gradient(180deg, #4f6dbb 0%, #29416d 100%); box-shadow: 0 4px 14px rgba(41, 65, 109, 0.25); }
  .teacher-book-row:nth-child(4)::before { background: linear-gradient(180deg, #d6a16d 0%, #cb955d 100%); }
  .teacher-book-row:nth-child(5)::before { background: linear-gradient(180deg, #34d399 0%, #059669 100%); }
  .teacher-book-row:nth-child(6)::before { background: linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%); }
  .teacher-book-row:hover,
  .teacher-book-row:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(207, 41, 109, 0.25);
    box-shadow: 0 14px 28px rgba(41, 65, 109, 0.12), 0 3px 8px rgba(207, 41, 109, 0.10);
    outline: none;
  }
  .teacher-book-num {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #df4a82 0%, #cf296d 100%);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 1.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 20px rgba(207, 41, 109, 0.28), inset 0 1px 0 rgba(255,255,255,0.25);
  }
  .teacher-book-row:nth-child(2) .teacher-book-num { background: linear-gradient(135deg, #f0a43d 0%, #ea8300 100%); box-shadow: 0 10px 20px rgba(234,131,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25); }
  .teacher-book-row:nth-child(3) .teacher-book-num { background: linear-gradient(135deg, #4f6dbb 0%, #29416d 100%); box-shadow: 0 10px 20px rgba(41,65,109,0.28), inset 0 1px 0 rgba(255,255,255,0.25); }
  .teacher-book-row:nth-child(4) .teacher-book-num { background: linear-gradient(135deg, #d6a16d 0%, #cb955d 100%); }
  .teacher-book-row:nth-child(5) .teacher-book-num { background: linear-gradient(135deg, #34d399 0%, #059669 100%); }
  .teacher-book-row:nth-child(6) .teacher-book-num { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); }
  .teacher-book-meta {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .teacher-book-meta::before {
    content: 'BOOK';
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--teacher-muted);
    line-height: 1;
  }
  .teacher-book-meta strong {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 0.98rem;
    color: var(--teacher-ink);
    line-height: 1.3;
  }
  .teacher-book-meta span {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--teacher-muted);
  }
  .teacher-book-chev {
    color: #94a3b8;
    font-size: 0.95rem;
    flex: 0 0 auto;
    transition: color 0.18s ease, transform 0.18s ease;
  }
  .teacher-book-row:hover .teacher-book-chev {
    color: #cf296d;
    transform: translateX(3px);
  }
  .teacher-book-row.locked {
    cursor: not-allowed;
    background: #f8fafc;
    opacity: 0.72;
  }
  .teacher-book-row.locked::before {
    background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%) !important;
    box-shadow: none !important;
  }
  .teacher-book-row.locked:hover {
    transform: none;
    border-color: rgba(41, 65, 109, 0.08);
    box-shadow: 0 8px 22px rgba(41, 65, 109, 0.07), 0 1px 3px rgba(41, 65, 109, 0.04);
  }
  .teacher-book-row.locked .teacher-book-num {
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%) !important;
    box-shadow: 0 4px 10px rgba(148,163,184,0.18) !important;
  }
  .teacher-book-row.locked .teacher-book-chev {
    color: #94a3b8;
  }
  @media (max-width: 480px) {
    .teacher-book-row { padding: 0.85rem 0.85rem 0.85rem 1.1rem; gap: 0.7rem; border-radius: 14px; }
    .teacher-book-num { width: 44px; height: 44px; flex: 0 0 44px; font-size: 1.05rem; border-radius: 12px; }
    .teacher-book-meta::before { font-size: 0.58rem; letter-spacing: 0.13em; }
    .teacher-book-meta strong { font-size: 0.88rem; }
    .teacher-book-meta span { font-size: 0.7rem; }
  }

  .books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  .book-card {
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(15,23,42,0.08);
    cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s;
    border: 2px solid transparent;
  }
  .book-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 14px 36px rgba(15,23,42,0.14);
    border-color: var(--teacher-pink);
  }
  .book-card-cover {
    width: 100%;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    padding: 1.5rem;
    text-align: center;
    position: relative;
    border-bottom: 2px solid rgba(36, 61, 107, 0.10);
  }
  .book-card-cover .book-badge {
    position: absolute;
    top: 12px; right: 12px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(6px);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
  }
  .book-card-info {
    padding: 1rem 1.2rem;
  }
  .book-card-info strong {
    display: block;
    font-size: 0.95rem;
    color: var(--teacher-ink);
    margin-bottom: 0.2rem;
  }
  .book-card-info span {
    font-size: 0.8rem;
    color: var(--teacher-muted);
  }
  .book-card-btn {
    display: block;
    width: calc(100% - 2.4rem);
    margin: 0 1.2rem 1rem;
    padding: 10px;
    background: var(--teacher-blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .book-card-btn:hover { background: var(--teacher-pink); }
  .book-card.coming-soon { opacity: 0.85; cursor: default; }
  .book-card.coming-soon:hover { transform: none; box-shadow: 0 6px 24px rgba(15,23,42,0.08); border-color: transparent; }
  .book-card.coming-soon .book-card-btn { background: #94a3b8; cursor: default; }
  .book-card.coming-soon .book-card-btn:hover { background: #94a3b8; }
  .coming-soon-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); color: #fff; padding: 8px 18px; border-radius: 24px; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px; z-index: 2; }

  /* Book Reader Modal */
  .book-reader-overlay {
    position: fixed;
    inset: 0;
    background: rgba(12, 23, 48, 0.92);
    backdrop-filter: blur(8px);
    z-index: 99999;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .book-reader-overlay.active { display: flex; }
  .book-reader-header {
    width: 100%;
    max-width: 900px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    color: #fff;
  }
  .book-reader-header h3 {
    font-family: 'Sora', sans-serif;
    font-size: 1.1rem;
    margin: 0;
  }
  .book-reader-close {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 42px; height: 42px;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .book-reader-close:hover { background: var(--teacher-pink); }
  .book-reader-canvas-wrap {
    flex: 1;
    width: 100%;
    max-width: 900px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 12px 12px;
    -webkit-user-select: none;
    user-select: none;
    touch-action: pan-y;
    overscroll-behavior: contain;
    perspective: 2200px;
    perspective-origin: center center;
  }
  .book-reader-page-shell {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: flex-start;
    max-width: 100%;
    transform-origin: center center;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform, opacity, filter;
    isolation: isolate;
    --page-turn-gloss: 0;
    --page-turn-shadow: 0;
    --page-turn-direction: to right;
  }
  .book-reader-page-shell::before {
    content: '';
    position: absolute;
    inset: 14px 10px;
    border-radius: 10px;
    pointer-events: none;
    background: linear-gradient(var(--page-turn-direction), rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 18%, rgba(8,15,30,0.18) 48%, rgba(8,15,30,0.4) 100%);
    opacity: var(--page-turn-gloss);
    transition: opacity 120ms ease;
  }
  .book-reader-page-shell::after {
    content: '';
    position: absolute;
    inset: 18px 14px;
    border-radius: 12px;
    pointer-events: none;
    background: linear-gradient(var(--page-turn-direction), rgba(2,6,23,0.34) 0%, rgba(2,6,23,0.16) 22%, rgba(2,6,23,0) 60%);
    opacity: var(--page-turn-shadow);
    filter: blur(18px);
    transition: opacity 120ms ease;
    transform: translateZ(-1px);
  }
  .book-reader-canvas-wrap canvas {
    position: relative;
    z-index: 1;
    max-width: 100%;
    border-radius: 4px;
    box-shadow: 0 14px 34px rgba(0,0,0,0.28);
    backface-visibility: hidden;
  }
  .book-reader-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 20px 16px;
  }
  .book-reader-nav button {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 44px; height: 44px;
    border-radius: 50%;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .book-reader-nav button:hover { background: var(--teacher-pink); }
  .book-reader-nav button:disabled { opacity: 0.3; cursor: default; }
  .book-reader-nav span {
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    min-width: 100px;
    text-align: center;
  }
  .book-reader-lock {
    color: rgba(255,255,255,0.5);
    font-size: 0.75rem;
    padding-bottom: 10px;
  }
  .book-reader-lock i { margin-right: 4px; }
  @media (max-width: 600px) {
    .books-grid { grid-template-columns: 1fr 1fr; gap: 0.8rem; }
    .book-card-cover { padding: 1rem; }
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
     DESKTOP POLISH — Teacher Dashboard
     Brand colors, modern cards, responsive, logout highlight.
     ============================================================ */
  :root {
    --brand-primary: #29416d;
    --brand-secondary: #cf296d;
    --brand-tertiary: #ea8300;
    --brand-success: #34d399;
    --brand-danger: #ef4444;
  }

  @media (min-width: 1280px) {
    .teacher-page .app-container { grid-template-columns: 260px minmax(0, 1fr) !important; }
  }
  @media (min-width: 1600px) {
    .teacher-page .app-container { grid-template-columns: 280px minmax(0, 1fr) !important; }
    .teacher-page .hero-grid { gap: 1.5rem !important; }
  }

  .teacher-page .hero-card,
  .teacher-page .card-white,
  .teacher-page .section-card,
  .teacher-page .widget-card,
  .teacher-page .panel-card {
    border-radius: 20px !important;
    box-shadow: 0 6px 22px rgba(41, 65, 109, 0.08), 0 1px 3px rgba(41, 65, 109, 0.04) !important;
    border: 1px solid rgba(41, 65, 109, 0.06) !important;
    transition: transform 0.25s ease, box-shadow 0.25s ease !important;
  }
  .teacher-page .hero-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 34px rgba(41, 65, 109, 0.12), 0 3px 8px rgba(41, 65, 109, 0.05) !important;
  }

  .teacher-page .hero-card.card-green  { background: linear-gradient(135deg, rgba(52, 211, 153, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-success) !important; }
  .teacher-page .hero-card.card-yellow { background: linear-gradient(135deg, rgba(234, 131, 0, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-tertiary) !important; }
  .teacher-page .hero-card.card-orange { background: linear-gradient(135deg, rgba(207, 41, 109, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-secondary) !important; }
  .teacher-page .hero-card.card-blue   { background: linear-gradient(135deg, rgba(41, 65, 109, 0.10), rgba(255,255,255,0.95)) !important; border-left: 4px solid var(--brand-primary) !important; }

  .teacher-page .metric-illustration,
  .teacher-page .summary-card-illustration { opacity: 0.85; max-width: 110px !important; }

  .teacher-page .btn-logout,
  .teacher-page .btn-outline-light.btn-logout {
    background: linear-gradient(135deg, #ef4444 0%, #cf296d 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.28) !important;
    font-weight: 700 !important;
  }
  .teacher-page .btn-logout:hover { background: linear-gradient(135deg, #dc2626 0%, #b91c5e 100%) !important; transform: translateY(-1px); box-shadow: 0 10px 22px rgba(239, 68, 68, 0.36) !important; }
  .teacher-page .btn-logout i { color: #ffffff !important; }

  .teacher-page .nav-item.active,
  .teacher-page .nav-link.active,
  .teacher-page a.nav-item.active {
    background: linear-gradient(90deg, rgba(207, 41, 109, 0.18), transparent) !important;
    border-left: 3px solid var(--brand-secondary) !important;
    color: #ffffff !important;
  }

  @media (max-width: 1199px) and (min-width: 768px) {
    .teacher-page .app-container { grid-template-columns: 200px minmax(0, 1fr) !important; }
    .teacher-page .hero-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
  }
  @media (max-width: 767px) {
    .teacher-page .app-container { grid-template-columns: 1fr !important; }
    .teacher-page .top-nav { flex-direction: row !important; flex-wrap: wrap !important; padding: 0.6rem 0.8rem !important; gap: 0.5rem !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
    .teacher-page .nav-brand { padding: 0 !important; border-bottom: none !important; flex: 1 1 auto; }
    .teacher-page .brand-mark { width: 42px !important; height: 42px !important; }
    .teacher-page .nav-list, .teacher-page .nav-actions { width: 100% !important; }
    .teacher-page .hero-grid { grid-template-columns: 1fr !important; gap: 0.8rem !important; }
    .teacher-page .metric-illustration, .teacher-page .summary-card-illustration { max-width: 80px !important; }
    .teacher-page .hero-card { padding: 1rem !important; }
  }


  .nav-badge.absent {
    background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
    color: #fff;
  }

  .register-table-wrapper {
    overflow-x: auto;
    margin-top: 1rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.06);
    border: 1px solid rgba(41, 65, 109, 0.08);
  }
  .register-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    text-align: center;
  }
  .register-table th, .register-table td {
    padding: 8px 4px;
    border: 1px solid #e2e8f0;
  }
  .register-table th {
    background: #f8fafc;
    color: var(--teacher-ink);
    font-weight: 700;
  }
  .register-table td.student-name {
    text-align: left;
    padding-left: 12px;
    font-weight: 600;
    white-space: nowrap;
    position: sticky;
    left: 0;
    background: #fff;
    z-index: 1;
    border-right: 2px solid #cbd5e1;
  }
  .register-table th.student-name-header {
    text-align: left;
    padding-left: 12px;
    position: sticky;
    left: 0;
    background: #f8fafc;
    z-index: 2;
    border-right: 2px solid #cbd5e1;
  }
  .register-table td i.fa-check { color: #10b981; font-size: 0.9rem; }
  .register-table td i.fa-times { color: #f43f5e; font-size: 0.9rem; }
  .register-class-title {
    font-family: 'Sora', sans-serif;
    color: var(--teacher-ink);
    margin: 1.5rem 0 0.5rem 0;
    font-size: 1.1rem;
  }
  .register-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  .register-controls input[type="month"] {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
  }
  .register-controls button {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .register-controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  }

  .mobile-bottom-actions { display: none; }
  @media (max-width: 760px) {
    .sidebar-chip-actions { display: none !important; }
    .teacher-page .dashboard-main { padding-bottom: 82px !important; }
    .mobile-bottom-actions {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #ffffff;
      border-top: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 -4px 16px rgba(30,45,90,0.10);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 8px 4px calc(8px + env(safe-area-inset-bottom)) 4px;
    }
    .mobile-action-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 3px; background: transparent; border: none;
      color: #64748b; font-size: 10px; font-weight: 700; cursor: pointer;
      flex: 1; padding: 4px 2px;
    }
    .mobile-action-btn i {
      font-size: 17px; color: #475569; margin-bottom: 1px;
      padding: 7px; border-radius: 12px; background: #f1f5f9;
      transition: background 0.2s, color 0.2s;
    }
    .mobile-action-btn.active i { color: #fff; background: linear-gradient(135deg, #1E2D5A, #3b55a0); }
    .mobile-action-btn.active { color: #1E2D5A; }
    .mobile-action-btn.logout i { color: #ffffff; background: #dc2626; }
    .mobile-action-btn.logout { color: #dc2626; }
  }
</style>

<div class="teacher-page">

  <!-- DASHBOARD VIEW -->
  <div id="teacherDashboardView" class="dashboard-shell d-none">
    <aside class="sidebar-panel">
      <div class="sidebar-brand sidebar-brand-v2">
        <div class="sidebar-profile-cluster">
          <div class="sidebar-brand-art" id="sidebarAvatarClickArea" title="Click to change photo" role="button" tabindex="0" style="position:relative; cursor:pointer; overflow:visible;">
            <img id="sidebarProfilePhoto" src="/kidba_assets/img/3d_teacher.png" alt="Teacher profile" style="border-radius:50%; width:100%; height:100%; object-fit:cover;">
            <div class="sidebar-cam-badge"><i class="fas fa-camera"></i></div>
            <input type="file" id="teacherProfileFileInput" accept="image/*" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10;">
          </div>
          <div class="sidebar-name-block">
            <span class="sidebar-title" id="sidebarProfileName" style="margin:0;">Teacher Name</span>
          </div>
        </div>

        <div class="sidebar-school-chip">
          <div class="sidebar-school-art" style="position:relative; overflow:hidden;">
            <img id="schoolLogoImg" src="/kidba_assets/img/3d_school.png" alt="School logo" style="border-radius:8px; width:100%; height:100%; object-fit:cover;">
          </div>
          <span class="sidebar-school-name" id="welcomeName">School</span>
          <div class="sidebar-chip-actions">
            <button class="sidebar-icon-btn home" type="button" onclick="window.location.href='auth.html'" title="Home" aria-label="Home"><i class="fas fa-house"></i></button>
            <button class="sidebar-icon-btn logout" type="button" onclick="logoutTeacher()" title="Logout" aria-label="Logout"><i class="fas fa-sign-out-alt"></i></button>
          </div>
        </div>
      </div>
      <ul class="sidebar-nav">
        <li class="active" data-section="overview" onclick="switchTeacherSection('overview')"><span class="nav-badge overview"><i class="fas fa-chart-pie"></i></span><span>Overview</span></li>
        <li data-section="reviews" onclick="switchTeacherSection('reviews')"><span class="nav-badge review"><i class="fas fa-clipboard-check"></i></span><span>Reviews</span></li>
        <li data-section="rankings" onclick="switchTeacherSection('rankings')"><span class="nav-badge reports"><i class="fas fa-medal"></i></span><span>Rankings</span></li>
        <li data-section="register" onclick="switchTeacherSection('register')"><span class="nav-badge overview" style="background:linear-gradient(135deg,#3b82f6,#2563eb);"><i class="fas fa-calendar-alt"></i></span><span>Monthly Log</span></li>
      </ul>
      <div class="sidebar-note">
        <img src="/kidba_assets/img/3d_student.png" alt="Student 3D icon">
        <div>
          <strong>Daily Goal</strong>
          <span>Review submissions, approve learning sheets and track class momentum.</span>
        </div>
      </div>
    </aside>

    <div class="dashboard-main">
      <!-- ── Dashboard Stats ── -->
      <div style="padding:16px 16px 4px 16px;">

        <!-- Top row: 2 wide cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">

          <!-- Students in Scope -->
          <div onclick="switchTeacherSection('students')" style="background:#fff;border-radius:18px;padding:16px 14px 14px;box-shadow:0 2px 12px rgba(0,0,0,0.07);cursor:pointer;border:1px solid #f0f4ff;position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,#1E2D5A,#4f72d0);border-radius:4px 0 0 4px;"></div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="width:36px;height:36px;border-radius:10px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-user-graduate" style="color:#1E2D5A;font-size:15px;"></i>
              </div>
              <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Students</span>
            </div>
            <div style="font-size:34px;font-weight:900;color:#1E2D5A;line-height:1;" id="teacherStudentCount">0</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">in your scope</div>
          </div>

          <!-- Sheets to Review -->
          <div onclick="switchTeacherSection('reviews')" style="background:#fff;border-radius:18px;padding:16px 14px 14px;box-shadow:0 2px 12px rgba(0,0,0,0.07);cursor:pointer;border:1px solid #fff0f8;position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,#D63678,#f97316);border-radius:4px 0 0 4px;"></div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="width:36px;height:36px;border-radius:10px;background:#FFF0F8;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-clipboard-check" style="color:#D63678;font-size:15px;"></i>
              </div>
              <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">To Review</span>
            </div>
            <div style="font-size:34px;font-weight:900;color:#D63678;line-height:1;" id="teacherPendingReviews">0</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">sheets pending</div>
          </div>

        </div>

        <!-- Bottom row: 3 mini cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">

          <!-- Top Points -->
          <div onclick="switchTeacherSection('rankings')" style="background:#fff;border-radius:16px;padding:14px 10px 12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);cursor:pointer;text-align:center;border:1px solid #f5f0ff;">
            <div style="width:34px;height:34px;border-radius:10px;background:#F5F0FF;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
              <i class="fas fa-trophy" style="color:#7c3aed;font-size:14px;"></i>
            </div>
            <div style="font-size:24px;font-weight:900;color:#7c3aed;line-height:1;" id="teacherTopPoints">0</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:0.3px;">Top Points</div>
          </div>

          <!-- Active Today -->
          <div onclick="switchTeacherSection('attendance')" style="background:#fff;border-radius:16px;padding:14px 10px 12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);cursor:pointer;text-align:center;border:1px solid #f0fdf4;">
            <div style="width:34px;height:34px;border-radius:10px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
              <i class="fas fa-check-circle" style="color:#059669;font-size:14px;"></i>
            </div>
            <div style="font-size:24px;font-weight:900;color:#059669;line-height:1;" id="teacherAttendanceCount">0</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:0.3px;">Active</div>
          </div>

          <!-- Absent Today -->
          <div onclick="switchTeacherSection('absent')" style="background:#fff;border-radius:16px;padding:14px 10px 12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);cursor:pointer;text-align:center;border:1px solid #fff5f5;">
            <div style="width:34px;height:34px;border-radius:10px;background:#FFF5F5;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
              <i class="fas fa-times-circle" style="color:#dc2626;font-size:14px;"></i>
            </div>
            <div style="font-size:24px;font-weight:900;color:#dc2626;line-height:1;" id="teacherAbsentCount">0</div>
            <div style="font-size:10px;font-weight:700;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:0.3px;">Absent</div>
          </div>

        </div>
      </div>

      <div class="teacher-tab-panels">
        <section id="teacherPanelOverview" class="teacher-panel active">
          <div class="teacher-grid">
            <section class="surface-card compact">
              <div class="section-header">
                <div class="section-heading">
                  <div class="section-asset"><img src="/kidba_assets/img/3d_teacher.png" alt="Teaching snapshot 3D icon"></div>
                  <div>
                    <h3>Today&apos;s Snapshot</h3>
                    <p>One glance summary for your next best action.</p>
                  </div>
                </div>\n              </div>
              <div class="snapshot-list">
                <div class="snapshot-item"><strong id="overviewStudentSummary">Loading class roster...</strong><span>Student coverage</span></div>
                <div class="snapshot-item"><strong id="overviewReviewSummary">Loading review queue...</strong><span>Review pressure</span></div>
                <div class="snapshot-item"><strong id="overviewAttendanceSummary">Loading attendance panel...</strong><span>Attendance pulse</span></div>
              </div>
              <p class="section-caption" id="overviewFocusNote">Preparing today&apos;s teaching focus...</p>
            </section>
          </div>
        </section>

        <section id="teacherPanelStudents" class="teacher-panel">
          <section class="surface-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_student.png" alt="Student roster 3D icon"></div>
                <div>
                  <h3>Students by Class</h3>
                  <p id="teacherRosterSummary">Browse learners by class / section with progress, review status and the latest activity update.</p>
                </div>
              </div>
              <span class="section-chip" id="teacherRosterClassChip"><i class="fas fa-user-group"></i> Loading classes</span>
            </div>
            <p class="section-caption">Each card shows class / section, points earned and the quickest path to reviews or activity logs.</p>
            <div id="teacherStudentRoster" class="student-roster">
              <!-- Injected via JS -->
            </div>
          </section>
        </section>

        <section id="teacherPanelReviews" class="teacher-panel">
          <section class="surface-card review-queue-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_teacher.png" alt="Review queue 3D icon"></div>
                <div>
                  <h3>Grading &amp; Reviews</h3>
                  <p>Review discussion answers, inspect sheets and award class points.</p>
                </div>
              </div>
              <span class="section-chip" id="pendingCountBadge">0</span>
            </div>
            <p class="section-caption">Review your students' discussion answers and award them points.</p>
            <div id="reviewsList">
              <!-- Injected via JS -->
            </div>
          </section>
        </section>

        <section id="teacherPanelAttendance" class="teacher-panel">
          <section class="surface-card attendance-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_login.png" alt="Attendance activity 3D icon"></div>
                <div>
                  <h3>Activity Attendance</h3>
                  <p>See which students opened an activity today, when they started and how long the task took.</p>
                </div>
              </div>
              <span class="section-chip" id="attendanceDateBadge"><i class="fas fa-calendar-day"></i> Today</span>
            </div>
            <p class="section-caption">This panel updates from live student activity sessions recorded during the day.</p>
            <div id="attendanceList" class="attendance-list">
              <!-- Injected via JS -->
            </div>
          </section>
        <section id="teacherPanelAbsent" class="teacher-panel">
          <section class="surface-card attendance-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_login.png" alt="Absent 3D icon"></div>
                <div>
                  <h3>Absent Students</h3>
                  <p>Learners who have not opened any activities today.</p>
                </div>
              </div>
              <span class="section-chip" id="absentDateBadge"><i class="fas fa-calendar-times"></i> Today</span>
            </div>
            <p class="section-caption">This panel shows students currently in your scope who have not logged any activity today.</p>
            <div id="absentList" class="attendance-list">
              <!-- Injected via JS -->
            </div>
          </section>
        </section>

        </section>

        <section id="teacherPanelRankings" class="teacher-panel">
          <section class="surface-card leaderboard-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_student.png" alt="Leaderboard 3D icon"></div>
                <div>
                  <h3>Student Rankings</h3>
                  <p id="teacherRankingCaption">Top-performing learners across your current school scope, with class labels for quick context.</p>
                </div>
              </div>
              <span class="section-chip" id="teacherRankingScopeChip"><i class="fas fa-trophy"></i> Loading scope</span>
            </div>
            <div id="leaderboardList">
              <!-- Rendered via JS -->
            </div>
          </section>
        </section>
        <section id="teacherPanelBooks" class="teacher-panel">
          <section class="surface-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_school.png" alt="Books 3D icon"></div>
                <div>
                  <h3>Book Library</h3>
                  <p>Read the currently available Imaan &amp; Akhlaq books online. Downloads are disabled to protect content.</p>
                </div>
              </div>
              <span class="section-chip" style="background:linear-gradient(135deg,#cf296d,#ea8300);color:#fff;"><i class="fas fa-lock"></i> View Only</span>
            </div>
            <p class="section-caption">Only live books are shown here so the teacher dashboard stays focused on real classroom material.</p>
            <div class="teacher-book-list">

              <div class="teacher-book-row" role="button" tabindex="0" onclick="openBookReader('book1', 'Imaan & Akhlaq - Book 1')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openBookReader('book1','Imaan &amp; Akhlaq - Book 1');}">
                <span class="teacher-book-num">1</span>
                <div class="teacher-book-meta">
                  <strong>Book 1</strong>
                  <span>18 Chapters &bull; 74 Pages</span>
                </div>
                <i class="fas fa-chevron-right teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row" role="button" tabindex="0" onclick="openBookReader('book2', 'Imaan & Akhlaq - Book 2')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openBookReader('book2','Imaan &amp; Akhlaq - Book 2');}">
                <span class="teacher-book-num">2</span>
                <div class="teacher-book-meta">
                  <strong>Book 2</strong>
                  <span>15 Chapters &bull; 93 Pages</span>
                </div>
                <i class="fas fa-chevron-right teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row" role="button" tabindex="0" onclick="openBookReader('book3', 'Imaan & Akhlaq - Book 3')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openBookReader('book3','Imaan &amp; Akhlaq - Book 3');}">
                <span class="teacher-book-num">3</span>
                <div class="teacher-book-meta">
                  <strong>Book 3</strong>
                  <span>15 Chapters &bull; 96 Pages</span>
                </div>
                <i class="fas fa-chevron-right teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row" role="button" tabindex="0" onclick="openBookReader('book4', 'Imaan &amp; Akhlaq - Book 4')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openBookReader('book4','Imaan &amp; Akhlaq - Book 4');}">
                <span class="teacher-book-num">4</span>
                <div class="teacher-book-meta">
                  <strong>Book 4</strong>
                  <span>13 Chapters &bull; 118 Pages</span>
                </div>
                <i class="fas fa-chevron-right teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row locked" aria-disabled="true">
                <span class="teacher-book-num">5</span>
                <div class="teacher-book-meta">
                  <strong>Book 5</strong>
                  <span>Moral Guidance &bull; Coming Soon</span>
                </div>
                <i class="fas fa-lock teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row locked" aria-disabled="true">
                <span class="teacher-book-num">6</span>
                <div class="teacher-book-meta">
                  <strong>Book 6</strong>
                  <span>Prophets History &bull; Coming Soon</span>
                </div>
                <i class="fas fa-lock teacher-book-chev"></i>
              </div>

              <div class="teacher-book-row locked" aria-disabled="true">
                <span class="teacher-book-num">7</span>
                <div class="teacher-book-meta">
                  <strong>Book 7</strong>
                  <span>Advanced Lessons &bull; Coming Soon</span>
                </div>
                <i class="fas fa-lock teacher-book-chev"></i>
              </div>
            </div>
          </section>
        </section>
        <section id="teacherPanelRegister" class="teacher-panel">
          <section class="surface-card">
            <div class="section-header">
              <div class="section-heading">
                <div class="section-asset"><img src="/kidba_assets/img/3d_school.png" alt="Register 3D icon"></div>
                <div>
                  <h3>Monthly Attendance Register</h3>
                  <p>Daily activity log for all your classes.</p>
                </div>
              </div>
            </div>
            <div class="register-controls">
              <input type="month" id="registerMonthFilter" onchange="window.renderRegisterTables()" />
              <button onclick="window.downloadRegisterCSV()"><i class="fas fa-download"></i> Download CSV</button>
            </div>
            <div id="registerTablesContainer">
              <!-- Rendered via JS -->
            </div>
          </section>
        </section>

      </div>
    </div>

    <div class="mobile-bottom-actions" id="teacherMobileNav">
      <button class="mobile-action-btn" id="tmb-books" type="button" onclick="switchTeacherSection('books'); setTeacherMobActive(this)">
        <i class="fas fa-book-open"></i><span>Books</span>
      </button>
      <button class="mobile-action-btn" id="tmb-attendance" type="button" onclick="switchTeacherSection('attendance'); setTeacherMobActive(this)">
        <i class="fas fa-user-clock"></i><span>Attendance</span>
      </button>
      <button class="mobile-action-btn active" id="tmb-students" type="button" onclick="switchTeacherSection('students'); setTeacherMobActive(this)">
        <i class="fas fa-user-graduate"></i><span>Students</span>
      </button>
      <button class="mobile-action-btn" id="tmb-register" type="button" onclick="switchTeacherSection('register'); setTeacherMobActive(this)">
        <i class="fas fa-calendar-alt"></i><span>Monthly Log</span>
      </button>
      <button class="mobile-action-btn logout" type="button" onclick="window.logoutTeacher()">
        <i class="fas fa-sign-out-alt"></i><span>Logout</span>
      </button>
    </div>
  </div>
</div>

<!-- Book Reader Modal -->
<div class="book-reader-overlay" id="bookReaderOverlay" oncontextmenu="return false;" role="dialog" aria-modal="true" tabindex="-1">
  <div class="book-reader-header">
    <h3 id="bookReaderTitle">Loading Book...</h3>
    <button class="book-reader-close" onclick="closeBookReader()" title="Close"><i class="fas fa-times"></i></button>
  </div>
  <div class="book-reader-canvas-wrap" id="bookReaderCanvasWrap"></div>
  <div class="book-reader-nav">
    <button id="bookReaderPrev" onclick="bookReaderGo(-1)"><i class="fas fa-chevron-left"></i></button>
    <span id="bookReaderPageInfo">Page 1 / 1</span>
    <button id="bookReaderNext" onclick="bookReaderGo(1)"><i class="fas fa-chevron-right"></i></button>
  </div>
  <div class="book-reader-lock"><i class="fas fa-lock"></i> Download disabled &mdash; View only mode</div>
</div>

<script src="/kidba_assets/js/pdf.min.js"></script>

<script type="module">
  // Defensive shim: ensure DOM elements that legacy JS writes to always exist.
  // Some IDs (schoolNameTag, classInfo, teacherInfo) used to live in the
  // workspace bar and were removed/redesigned; the JS still references them,
  // so a missing element used to crash initDashboard with
  // "Cannot set properties of null (setting 'innerHTML')". This shim creates
  // hidden stubs for any missing IDs at boot, before scripts run.
  (function ensureLegacyDomIds() {
    var ids = ['welcomeName', 'schoolNameTag', 'classInfo', 'teacherInfo'];
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
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const ACTIVITIES_DATA = ${raw(JSON.stringify(activitiesData))};
  
  
  window.teacherAttendanceData = [];
  window.teacherStudentMap = {};

  window.renderRegisterTables = function() {
    const container = document.getElementById('registerTablesContainer');
    if (!container) return;
    
    const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const monthInput = document.getElementById('registerMonthFilter');
    let selectedDate = new Date();
    if (monthInput && monthInput.value) {
       selectedDate = new Date(monthInput.value + '-01T00:00:00');
    } else {
       if (monthInput) {
         const y = selectedDate.getFullYear();
         const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
         monthInput.value = y + '-' + m;
       }
    }
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    const currentDay = today.getDate();
    
    const classGroups = {};
    for (const uid in window.teacherStudentMap) {
      const student = window.teacherStudentMap[uid];
      let rawClass = student.class_id || student.classId || '';
      const cLabel = String(rawClass).trim() || 'Unassigned';
      if (!classGroups[cLabel]) classGroups[cLabel] = [];
      classGroups[cLabel].push(student);
    }
    
    const attMap = {};
    window.teacherAttendanceData.forEach(session => {
       const dateStr = session.sessionDate || String(session.activityStartedAt || '').slice(0, 10);
       if (dateStr.startsWith(year + '-' + String(month+1).padStart(2,'0'))) {
          if (!attMap[session.student_uid]) attMap[session.student_uid] = {};
          attMap[session.student_uid][dateStr] = true;
       }
    });

    let html = '';
    for (const classId in classGroups) {
      const students = classGroups[classId].sort((a,b) => (a.name||'').localeCompare(b.name||''));
      html += '<h4 class="register-class-title"><i class="fas fa-users" style="color:var(--teacher-pink); margin-right:8px;"></i>Class: ' + esc(classId) + '</h4>';
      html += '<div class="register-table-wrapper"><table class="register-table"><thead><tr><th class="student-name-header">Student Name</th>';
      for (let d = 1; d <= daysInMonth; d++) html += '<th>' + d + '</th>';
      html += '</tr></thead><tbody>';
      
      students.forEach(student => {
        html += '<tr><td class="student-name">' + esc(student.name || 'Unknown') + '</td>';
        for (let d = 1; d <= daysInMonth; d++) {
           const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
           const isPastOrToday = !isCurrentMonth || d <= currentDay;
           const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());
           const shouldShowCross = isPastMonth || isPastOrToday;
           const hasAttended = attMap[student.uid] && attMap[student.uid][dateStr];
           
           if (hasAttended) {
             html += '<td><i class="fas fa-check"></i></td>';
           } else if (shouldShowCross) {
             html += '<td><i class="fas fa-times"></i></td>';
           } else {
             html += '<td></td>';
           }
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }
    
    if (Object.keys(classGroups).length === 0) {
       html = '<div class="attendance-empty"><i class="fas fa-folder-open" style="font-size:1.35rem; margin-bottom:0.5rem; color:#94a3b8;"></i><br>No students found.</div>';
    }
    container.innerHTML = html;
  };

  window.downloadRegisterCSV = function() {
    const monthInput = document.getElementById('registerMonthFilter');
    const selectedDate = monthInput && monthInput.value ? new Date(monthInput.value + '-01T00:00:00') : new Date();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    const currentDay = today.getDate();
    const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());

    let csv = 'Class,Student Name,';
    for (let d = 1; d <= daysInMonth; d++) csv += d + ',';
    csv += String.fromCharCode(10);
    
    const attMap = {};
    window.teacherAttendanceData.forEach(session => {
       const dateStr = session.sessionDate || String(session.activityStartedAt || '').slice(0, 10);
       if (dateStr.startsWith(year + '-' + String(month+1).padStart(2,'0'))) {
          if (!attMap[session.student_uid]) attMap[session.student_uid] = {};
          attMap[session.student_uid][dateStr] = true;
       }
    });

    const classGroups = {};
    for (const uid in window.teacherStudentMap) {
      const student = window.teacherStudentMap[uid];
      let rawClass = student.class_id || student.classId || '';
      const cLabel = String(rawClass).trim() || 'Unassigned';
      if (!classGroups[cLabel]) classGroups[cLabel] = [];
      classGroups[cLabel].push(student);
    }
    
    for (const classId in classGroups) {
      const students = classGroups[classId].sort((a,b) => (a.name||'').localeCompare(b.name||''));
      students.forEach(student => {
        csv += ('"' + classId.replace(/"/g, '""') + '","' + (student.name||'').replace(/"/g, '""') + '",');
        for (let d = 1; d <= daysInMonth; d++) {
           const dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
           const shouldShowCross = isPastMonth || (!isCurrentMonth || d <= currentDay);
           const hasAttended = attMap[student.uid] && attMap[student.uid][dateStr];
           
           if (hasAttended) csv += 'Present,';
           else if (shouldShowCross) csv += 'Absent,';
           else csv += ',';
        }
        csv += String.fromCharCode(10);
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", ('attendance_register_' + year + '_' + String(month+1).padStart(2,'0') + '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  let currentTeacher = null;
  let teacherSchoolId = null;
  let currentTeacherSection = 'overview';
  const teacherSectionTargets = {
    overview: 'teacherPanelOverview',
    students: 'teacherPanelStudents',
    reviews: 'teacherPanelReviews',
    attendance: 'teacherPanelAttendance',
    rankings: 'teacherPanelRankings',
    books: 'teacherPanelBooks',
    register: 'teacherPanelRegister',
    absent: 'teacherPanelAbsent'
  };

  /* === Book Reader (canvas-based, no download) === */
  let bookReaderPdf = null;
  let bookReaderPage = 1;
  let bookReaderTotal = 1;
  let bookReaderTouchStartX = null;
  let bookReaderTouchDeltaX = 0;
  let bookReaderRendering = false;
  let bookReaderAnimating = false;

  function getActiveBookReaderShell() {
    const canvasWrap = document.getElementById('bookReaderCanvasWrap');
    return canvasWrap ? canvasWrap.querySelector('.book-reader-page-shell') : null;
  }

  function ensureBookReaderOverlayMounted() {
    const overlay = document.getElementById('bookReaderOverlay');
    if (overlay && overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function clearBookReaderTurnStyles(element) {
    if (!element) return;
    element.style.transformOrigin = '';
    element.style.setProperty('--page-turn-direction', 'to right');
    element.style.setProperty('--page-turn-gloss', '0');
    element.style.setProperty('--page-turn-shadow', '0');
  }

  function applyBookReaderSwipePreview(deltaX) {
    const activeShell = getActiveBookReaderShell();
    if (!activeShell) return;

    const direction = deltaX < 0 ? 1 : -1;
    const progress = Math.min(1, Math.abs(deltaX) / 140);
    const angle = progress * 18;

    activeShell.style.transition = '';
    activeShell.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
    activeShell.style.setProperty('--page-turn-direction', direction > 0 ? 'to right' : 'to left');
    activeShell.style.setProperty('--page-turn-gloss', String(0.12 + (progress * 0.44)));
    activeShell.style.setProperty('--page-turn-shadow', String(0.08 + (progress * 0.28)));
    activeShell.style.transform = 'perspective(2200px) translateX(' + (deltaX * 0.16) + 'px) rotateY(' + (direction > 0 ? angle : -angle) + 'deg) scale(' + (1 - (progress * 0.012)) + ')';
    activeShell.style.opacity = String(1 - (progress * 0.14));
  }

  function resetBookReaderSwipePreview(animateBack) {
    const activeShell = getActiveBookReaderShell();
    bookReaderTouchDeltaX = 0;
    if (!activeShell) return;

    if (animateBack) {
      activeShell.style.transition = 'transform 180ms ease, opacity 180ms ease';
      activeShell.style.transform = 'perspective(2200px) translateX(0px) rotateY(0deg) scale(1)';
      activeShell.style.opacity = '1';
      clearBookReaderTurnStyles(activeShell);
      window.setTimeout(function() {
        activeShell.style.transition = '';
      }, 190);
      return;
    }

    activeShell.style.transition = '';
    activeShell.style.transform = '';
    activeShell.style.opacity = '';
    clearBookReaderTurnStyles(activeShell);
  }

  function animateBookReaderExit(element, direction) {
    if (!element || !direction) return Promise.resolve();

    bookReaderAnimating = true;

    return new Promise(function(resolve) {
      element.style.transition = 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease';
      element.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
      element.style.setProperty('--page-turn-direction', direction > 0 ? 'to right' : 'to left');
      element.style.setProperty('--page-turn-gloss', '0.56');
      element.style.setProperty('--page-turn-shadow', '0.38');

      requestAnimationFrame(function() {
        element.style.transform = 'perspective(2200px) translateX(' + (direction > 0 ? -18 : 18) + 'px) rotateY(' + (direction > 0 ? 68 : -68) + 'deg) scale(0.972)';
        element.style.opacity = '0.18';
      });

      window.setTimeout(function() {
        resolve();
      }, 225);
    });
  }

  function animateBookReaderEntry(element, direction) {
    if (!element || !direction) {
      bookReaderAnimating = false;
      if (element) clearBookReaderTurnStyles(element);
      return Promise.resolve();
    }

    bookReaderAnimating = true;

    return new Promise(function(resolve) {
      element.style.transition = 'none';
      element.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
      element.style.setProperty('--page-turn-direction', direction > 0 ? 'to right' : 'to left');
      element.style.setProperty('--page-turn-gloss', '0.56');
      element.style.setProperty('--page-turn-shadow', '0.38');
      element.style.transform = 'perspective(2200px) translateX(' + (direction > 0 ? 18 : -18) + 'px) rotateY(' + (direction > 0 ? -68 : 68) + 'deg) scale(0.972)';
      element.style.opacity = '0.18';

      requestAnimationFrame(function() {
        element.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease';
        element.style.transform = 'perspective(2200px) translateX(0px) rotateY(0deg) scale(1)';
        element.style.opacity = '1';
        element.style.setProperty('--page-turn-gloss', '0');
        element.style.setProperty('--page-turn-shadow', '0');
      });

      window.setTimeout(function() {
        element.style.transition = '';
        clearBookReaderTurnStyles(element);
        bookReaderAnimating = false;
        resolve();
      }, 310);
    });
  }

  window.openBookReader = async function(bookKey, bookTitle) {
    const overlay = ensureBookReaderOverlayMounted();
    const canvasWrap = document.getElementById('bookReaderCanvasWrap');
    const titleEl = document.getElementById('bookReaderTitle');

    titleEl.textContent = bookTitle;
    canvasWrap.innerHTML = '<div id="bookReaderProgressWrap" style="color:#fff;text-align:center;padding:60px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading book... <span id="bookReaderProgressPct">0%</span><div style="width:240px;height:6px;background:rgba(255,255,255,0.18);border-radius:3px;margin:14px auto 0;overflow:hidden;"><div id="bookReaderProgressBar" style="height:100%;width:0%;background:linear-gradient(90deg,#cf296d,#ea8300);transition:width 0.2s;"></div></div></div>';
    overlay.classList.add('active');
    overlay.focus();
    document.body.style.overflow = 'hidden';
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    bookReaderPage = 1;
    bookReaderTouchStartX = null;
    bookReaderTouchDeltaX = 0;
    bookReaderRendering = false;
    bookReaderAnimating = false;

    try {
      // Robust pdfjs loader: try existing global, then local, then CDN fallback.
      if (typeof window.pdfjsLib === 'undefined') {
        const tryLoad = (src) => new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = () => resolve(true);
          s.onerror = () => reject(new Error('script load failed: ' + src));
          document.head.appendChild(s);
        });
        try {
          await tryLoad('/kidba_assets/js/pdf.min.js');
        } catch(_) {
          await tryLoad('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');
        }
      }
      if (typeof window.pdfjsLib === 'undefined') {
        canvasWrap.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:40px;">PDF viewer failed to load. Please check your internet connection and refresh.</p>';
        return;
      }
      // Worker: prefer local, but fall back to CDN.
      try {
        const workerProbe = await fetch('/kidba_assets/js/pdf.worker.min.js', { method: 'HEAD' });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerProbe.ok
          ? '/kidba_assets/js/pdf.worker.min.js'
          : 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      } catch(_) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      }
      // Use range/stream loading: only the bytes for current page download upfront,
      // rest streams in background. disableAutoFetch=true => no full-PDF prefetch.
      const loadingTask = window.pdfjsLib.getDocument({
        url: '/' + bookKey + '.pdf',
        disableStream: false,
        disableRange: false,
        disableAutoFetch: true,
        rangeChunkSize: 131072
      });
      loadingTask.onProgress = function(p) {
        if (!p || !p.total) return;
        const pct = Math.min(100, Math.round((p.loaded / p.total) * 100));
        const pctEl = document.getElementById('bookReaderProgressPct');
        const barEl = document.getElementById('bookReaderProgressBar');
        if (pctEl) pctEl.textContent = pct + '%';
        if (barEl) barEl.style.width = pct + '%';
      };
      bookReaderPdf = await loadingTask.promise;
      bookReaderTotal = bookReaderPdf.numPages;
      renderBookReaderPage(0);
    } catch(e) {
      console.error('openBookReader error:', e);
      canvasWrap.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:40px;"><i class="fas fa-exclamation-triangle"></i> Could not load PDF. Make sure the book file exists on the server.</p>';
    }
  };

  async function renderBookReaderPage(direction) {
    const canvasWrap = document.getElementById('bookReaderCanvasWrap');
    if (!canvasWrap || !bookReaderPdf || bookReaderRendering || bookReaderAnimating) return false;

    bookReaderRendering = true;

    try {
      const currentShell = getActiveBookReaderShell();
      const page = await bookReaderPdf.getPage(bookReaderPage);
      const pixelRatio = window.devicePixelRatio || 1;
      const wrapWidth = canvasWrap.clientWidth - 24;
      const unscaled = page.getViewport({ scale: 1 });
      const baseScale = Math.min(wrapWidth / unscaled.width, 1.8);
      const viewport = page.getViewport({ scale: baseScale * pixelRatio });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = (viewport.width / pixelRatio) + 'px';
      canvas.style.height = (viewport.height / pixelRatio) + 'px';
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const shell = document.createElement('div');
      shell.className = 'book-reader-page-shell';

      if (currentShell && direction) {
        await animateBookReaderExit(currentShell, direction);
      }

      canvasWrap.innerHTML = '';
      shell.appendChild(canvas);
      canvasWrap.appendChild(shell);
      await animateBookReaderEntry(shell, direction || 0);
    } catch(e) {
      canvasWrap.innerHTML = '<p style="color:#ff6b6b;">Error rendering page ' + bookReaderPage + '</p>';
      bookReaderAnimating = false;
    } finally {
      document.getElementById('bookReaderPageInfo').textContent = 'Page ' + bookReaderPage + ' / ' + bookReaderTotal;
      document.getElementById('bookReaderPrev').disabled = bookReaderPage <= 1;
      document.getElementById('bookReaderNext').disabled = bookReaderPage >= bookReaderTotal;
      canvasWrap.scrollTop = 0;
      bookReaderRendering = false;
    }

    return true;
  }

  window.bookReaderGo = function(dir) {
    if (bookReaderRendering || bookReaderAnimating) return false;
    const next = bookReaderPage + dir;
    if (next < 1 || next > bookReaderTotal) return false;
    bookReaderPage = next;
    renderBookReaderPage(dir);
    return true;
  };

  window.closeBookReader = function() {
    document.getElementById('bookReaderOverlay').classList.remove('active');
    document.body.style.overflow = '';
    bookReaderTouchStartX = null;
    bookReaderTouchDeltaX = 0;
    bookReaderRendering = false;
    bookReaderAnimating = false;
    resetBookReaderSwipePreview(false);
    bookReaderPdf = null;
  };

  document.addEventListener('keydown', function(e) {
    const overlay = document.getElementById('bookReaderOverlay');
    if (!overlay || !overlay.classList.contains('active')) return;
    if (e.key === 'Escape') window.closeBookReader();
    if (bookReaderRendering || bookReaderAnimating) return;
    if (e.key === 'ArrowLeft') window.bookReaderGo(-1);
    if (e.key === 'ArrowRight') window.bookReaderGo(1);
  });

  ensureBookReaderOverlayMounted();

  const bookReaderCanvasWrap = document.getElementById('bookReaderCanvasWrap');
  if (bookReaderCanvasWrap && bookReaderCanvasWrap.dataset.swipeBound !== 'true') {
    bookReaderCanvasWrap.dataset.swipeBound = 'true';

    bookReaderCanvasWrap.addEventListener('touchstart', function(e) {
      if (!bookReaderPdf || bookReaderRendering || bookReaderAnimating || e.touches.length !== 1) return;
      bookReaderTouchStartX = e.touches[0].clientX;
      bookReaderTouchDeltaX = 0;
    }, { passive: true });

    bookReaderCanvasWrap.addEventListener('touchmove', function(e) {
      if (bookReaderTouchStartX === null || bookReaderRendering || bookReaderAnimating || e.touches.length !== 1) return;

      bookReaderTouchDeltaX = e.touches[0].clientX - bookReaderTouchStartX;
      applyBookReaderSwipePreview(bookReaderTouchDeltaX);
    }, { passive: true });

    bookReaderCanvasWrap.addEventListener('touchend', function() {
      if (bookReaderTouchStartX === null || bookReaderRendering || bookReaderAnimating) {
        bookReaderTouchStartX = null;
        return;
      }

      const deltaX = bookReaderTouchDeltaX;
      bookReaderTouchStartX = null;

      if (Math.abs(deltaX) < 55) {
        resetBookReaderSwipePreview(true);
        return;
      }

      const moved = deltaX < 0 ? window.bookReaderGo(1) : window.bookReaderGo(-1);
      if (!moved) {
        resetBookReaderSwipePreview(true);
      }
    }, { passive: true });

    bookReaderCanvasWrap.addEventListener('touchcancel', function() {
      bookReaderTouchStartX = null;
      resetBookReaderSwipePreview(true);
    }, { passive: true });
  }

  // Mobile bottom nav active state helper
  window.setTeacherMobActive = (btn) => {
    document.querySelectorAll('#teacherMobileNav .mobile-action-btn:not(.logout)').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  };

  window.switchTeacherSection = (section, options = {}) => {
    const nextSection = teacherSectionTargets[section] ? section : 'overview';
    const shouldScroll = options && typeof options === 'object' ? options.scroll !== false : true;
    currentTeacherSection = nextSection;

    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((item) => {
      item.classList.toggle('active', item.dataset.section === nextSection);
    });

    document.querySelectorAll('.teacher-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === teacherSectionTargets[nextSection]);
    });

    document.querySelectorAll('.summary-card.summary-link').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.section === nextSection);
    });

    if (shouldScroll) {
      const activePanel = document.getElementById(teacherSectionTargets[nextSection]);
      if (activePanel) {
        window.requestAnimationFrame(function() {
          activePanel.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      }
    }
  };

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function normalizeGameState(state) {
    const nextState = state && typeof state === 'object' ? { ...state } : {};
    if (!Array.isArray(nextState.completed)) nextState.completed = [];
    if (!Array.isArray(nextState.parent_approved)) nextState.parent_approved = [];
    if (!Array.isArray(nextState.teacher_approved)) nextState.teacher_approved = [];
    if (typeof nextState.points !== 'number') {
      nextState.points = typeof nextState.totalPoints === 'number' ? nextState.totalPoints : 50;
    }
    if (typeof nextState.unlockedCount !== 'number' || nextState.unlockedCount < 1) {
      nextState.unlockedCount = 1;
    }
    return nextState;
  }

  function hasMeaningfulParentNote(notes) {
    return Array.isArray(notes) && notes.some((note) => String(note || '').trim().length > 1);
  }

  function getReviewTimestamp(reviewLike) {
    const value = reviewLike && (reviewLike.parentApprovedAt || reviewLike.submittedAt || reviewLike.updatedAt || reviewLike.activityCompletedAt || reviewLike.activityStartedAt);
    const timestamp = new Date(value || 0).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function buildPendingReviewQueue(studentMap, submissionDocs) {
    const submissionByKey = {};
    const pendingByKey = {};

    submissionDocs.forEach((submission) => {
      if (!submission || !submission.student_uid || !submission.chapter_id || !studentMap[submission.student_uid]) return;

      const key = submission.student_uid + '::' + submission.chapter_id;
      const existingSubmission = submissionByKey[key];
      if (!existingSubmission || getReviewTimestamp(submission) >= getReviewTimestamp(existingSubmission)) {
        submissionByKey[key] = submission;
      }
    });

    Object.keys(submissionByKey).forEach((key) => {
      const submission = submissionByKey[key];
      const student = studentMap[submission.student_uid];
      const state = normalizeGameState(student.game_state);
      const isTeacherApproved = state.teacher_approved.includes(submission.chapter_id) || submission.reviewStatus === 'teacher_approved' || !!submission.teacherApprovedAt;
      const isReadyForTeacher = state.parent_approved.includes(submission.chapter_id) || submission.reviewStatus === 'pending_teacher' || !!submission.parentApprovedAt || hasMeaningfulParentNote(submission.parentNotes);
      const hasStudentSubmission = !!(submission.submittedAt || submission.activityCompletedAt || submission.discussionText || submission.gridState);

      if (!hasStudentSubmission || isTeacherApproved) return;

      pendingByKey[key] = {
        subId: submission.id,
        studentUid: submission.student_uid,
        studentName: student.name,
        chapId: submission.chapter_id,
        answer: submission.discussionText || 'No written answer provided.',
        grid: submission.gridState || null,
        parents: submission.parentNotes || [],
        isSubmissionMissing: false,
        canTeacherApprove: isReadyForTeacher,
        statusLabel: isReadyForTeacher ? 'Teacher Review Pending' : 'Waiting for Parent',
        statusClass: isReadyForTeacher ? 'bg-warning text-dark' : 'bg-info text-dark',
        blockedReason: isReadyForTeacher ? '' : 'This activity is visible for teacher tracking, but approval stays locked until the parent completes their review.',
        updatedAt: getReviewTimestamp(submission)
      };
    });

    Object.values(studentMap).forEach((student) => {
      const state = normalizeGameState(student.game_state);
      state.parent_approved.forEach((chapterId) => {
        const key = student.uid + '::' + chapterId;
        if (state.teacher_approved.includes(chapterId) || pendingByKey[key]) return;

        const submission = submissionByKey[key] || null;
        pendingByKey[key] = {
          subId: submission ? submission.id : student.uid + '_' + chapterId,
          studentUid: student.uid,
          studentName: student.name,
          chapId: chapterId,
          answer: submission && submission.discussionText ? submission.discussionText : 'Submission details are missing for this chapter. Ask the student to reopen the activity if this review looks empty.',
          grid: submission ? submission.gridState || null : null,
          parents: submission ? submission.parentNotes || [] : [],
          isSubmissionMissing: !submission,
          canTeacherApprove: !!submission,
          statusLabel: submission ? 'Teacher Review Pending' : 'Submission Missing',
          statusClass: submission ? 'bg-warning text-dark' : 'bg-danger',
          blockedReason: submission ? '' : 'The student state shows parent approval, but the saved activity sheet is missing. Ask the student to reopen and resubmit this chapter.',
          updatedAt: submission ? getReviewTimestamp(submission) : 0
        };
      });
    });

    return Object.values(pendingByKey).sort((left, right) => right.updatedAt - left.updatedAt);
  }

  function formatClockTime(isoString) {
    if (!isoString) return 'No time recorded';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'No time recorded';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatAttendanceDate(dateKey) {
    if (!dateKey) return 'Today';
    const date = new Date(dateKey + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return 'Today';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatDuration(seconds) {
    if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds <= 0) return 'In progress';
    if (seconds < 60) return seconds + ' sec';

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return minutes + ' min';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? hours + 'h ' + remainingMinutes + 'm' : hours + 'h';
  }

  function getClassLabel(classId) {
    const value = String(classId || '').trim();
    return value || 'No class assigned';
  }

  function getClassScopeMeta(leaderboardData) {
    const uniqueClasses = [...new Set((leaderboardData || []).map((student) => getClassLabel(student.classId)))];

    if (!uniqueClasses.length) {
      return {
        chipText: 'No classes yet',
        workspaceText: 'No students linked to this school yet.',
        rosterText: 'Students will appear here with class / section labels after they join the school.',
        rankingText: 'No ranking data yet'
      };
    }

    if (uniqueClasses.length === 1) {
      const classLabel = uniqueClasses[0];
      return {
        chipText: 'Class / Section: ' + classLabel,
        workspaceText: 'Class / Section in view: ' + classLabel,
        rosterText: 'Browse learners in ' + classLabel + ' with progress, review status and the latest activity update.',
        rankingText: 'Single class ranking'
      };
    }

    const classPreview = uniqueClasses.slice(0, 3).join(', ');
    const extraClasses = uniqueClasses.length - 3;
    const previewText = extraClasses > 0 ? classPreview + ' +' + extraClasses + ' more' : classPreview;

    return {
      chipText: uniqueClasses.length + ' classes visible',
      workspaceText: 'School-wide teacher view | ' + uniqueClasses.length + ' classes visible',
      rosterText: 'Browse learners across ' + uniqueClasses.length + ' classes. Current classes: ' + previewText + '.',
      rankingText: 'School-wide ranking'
    };
  }

  function getAttendanceStatusMeta(session) {
    if (session.activityCompletedAt || session.status === 'completed') {
      return { className: 'completed', label: 'Completed', icon: 'fa-check-double' };
    }

    if (session.status === 'revisit') {
      return { className: 'revisit', label: 'Opened Again', icon: 'fa-rotate-right' };
    }

    return { className: 'started', label: 'Started', icon: 'fa-right-to-bracket' };
  }

  function renderAttendancePanel(attendanceDocs, studentMap) {
    const attendanceListEl = document.getElementById('attendanceList');
    const attendanceCountEl = document.getElementById('teacherAttendanceCount');
    const attendanceDateBadgeEl = document.getElementById('attendanceDateBadge');
    const todayKey = new Date().toISOString().slice(0, 10);

    if (attendanceDateBadgeEl) {
      attendanceDateBadgeEl.innerHTML = '<i class="fas fa-calendar-day"></i> ' + formatAttendanceDate(todayKey);
    }

    const todaysAttendance = attendanceDocs
      .filter((session) => {
        const sessionKey = session.sessionDate || String(session.activityStartedAt || '').slice(0, 10);
        return sessionKey === todayKey && studentMap[session.student_uid];
      })
      .sort((a, b) => new Date(b.activityStartedAt || b.lastUpdatedAt || 0) - new Date(a.activityStartedAt || a.lastUpdatedAt || 0));

    const uniqueStudents = new Set(todaysAttendance.map((session) => session.student_uid));
    if (attendanceCountEl) {
      attendanceCountEl.textContent = String(uniqueStudents.size);
    }

    if (!attendanceListEl) return;

    if (!todaysAttendance.length) {
      attendanceListEl.innerHTML = '<div class="attendance-empty"><i class="fas fa-user-clock" style="font-size:1.35rem; color:#243d6b; margin-bottom:0.5rem;"></i><br>No student activity attendance has been logged yet today.</div>';
      return;
    }

    let attendanceHtml = '';
    todaysAttendance.forEach((session) => {
      const statusMeta = getAttendanceStatusMeta(session);
      const studentName = session.student_name || (studentMap[session.student_uid] && studentMap[session.student_uid].name) || 'Student';
      const chapterTitle = session.chapter_title || getChapterTitle(session.chapter_id);
      const startedLabel = formatClockTime(session.activityStartedAt || session.lastUpdatedAt || session.activityCompletedAt);
      const durationLabel = formatDuration(session.activityDurationSeconds);

      attendanceHtml +=
        '<div class="attendance-item">' +
          '<div class="attendance-stamp"><i class="fas fa-clock"></i></div>' +
          '<div class="attendance-copy">' +
            '<strong>' + escapeHtml(studentName) + '</strong>' +
            '<span>' + escapeHtml(chapterTitle) + '</span>' +
            '<div class="attendance-meta">' +
              '<span class="attendance-pill ' + statusMeta.className + '"><i class="fas ' + statusMeta.icon + '"></i> ' + escapeHtml(statusMeta.label) + '</span>' +
              '<span class="attendance-pill time"><i class="fas fa-right-to-bracket"></i> ' + escapeHtml(startedLabel) + '</span>' +
              '<span class="attendance-pill duration"><i class="fas fa-stopwatch"></i> ' + escapeHtml(durationLabel) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    attendanceListEl.innerHTML = attendanceHtml;

    const absentListEl = document.getElementById('absentList');
    const absentCountEl = document.getElementById('teacherAbsentCount');
    const absentDateBadgeEl = document.getElementById('absentDateBadge');
    
    if (absentDateBadgeEl) {
      absentDateBadgeEl.innerHTML = '<i class="fas fa-calendar-times"></i> ' + formatAttendanceDate(todayKey);
    }

    const absentStudents = [];
    for (const uid in studentMap) {
      if (!uniqueStudents.has(uid)) {
        absentStudents.push(studentMap[uid]);
      }
    }

    if (absentCountEl) {
      absentCountEl.textContent = String(absentStudents.length);
    }

    if (absentListEl) {
      if (absentStudents.length === 0) {
        absentListEl.innerHTML = '<div class="attendance-empty"><i class="fas fa-check-circle" style="font-size:1.35rem; color:#10b981; margin-bottom:0.5rem;"></i><br>All students have been active today!</div>';
      } else {
        let absentHtml = '';
        absentStudents.forEach((student) => {
          const studentName = student.name || 'Student';
          const classLabel = getClassLabel(student.classId);
          absentHtml +=
            '<div class="attendance-item">' +
              '<div class="attendance-stamp" style="background: rgba(244, 63, 94, 0.1); color: #f43f5e;"><i class="fas fa-user-xmark"></i></div>' +
              '<div class="attendance-copy">' +
                '<strong>' + escapeHtml(studentName) + '</strong>' +
                '<span>Class: ' + escapeHtml(classLabel) + '</span>' +
              '</div>' +
            '</div>';
        });
        absentListEl.innerHTML = absentHtml;
      }
    }
  }


  function renderOverviewSnapshot(leaderboardData, pendingReviews, attendanceDocs) {
    const studentSummaryEl = document.getElementById('overviewStudentSummary');
    const reviewSummaryEl = document.getElementById('overviewReviewSummary');
    const attendanceSummaryEl = document.getElementById('overviewAttendanceSummary');
    const focusNoteEl = document.getElementById('overviewFocusNote');
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaysSessions = attendanceDocs.filter((session) => {
      const sessionKey = session.sessionDate || String(session.activityStartedAt || '').slice(0, 10);
      return sessionKey === todayKey;
    });
    const activeTodayCount = new Set(todaysSessions.map((session) => session.student_uid)).size;
    const completedTodayCount = todaysSessions.filter((session) => session.activityCompletedAt || session.status === 'completed').length;

    if (studentSummaryEl) {
      studentSummaryEl.textContent = leaderboardData.length
        ? leaderboardData.length + ' students are visible in your teacher scope.'
        : 'No students are linked to this teacher scope yet.';
    }

    if (reviewSummaryEl) {
      reviewSummaryEl.textContent = pendingReviews.length
        ? pendingReviews.length + ' student sheet' + (pendingReviews.length === 1 ? ' is' : 's are') + ' waiting for review.'
        : 'All student sheets are currently reviewed.';
    }

    if (attendanceSummaryEl) {
      attendanceSummaryEl.textContent = activeTodayCount
        ? activeTodayCount + ' learner' + (activeTodayCount === 1 ? ' has' : 's have') + ' opened activities today.'
        : 'No activity attendance has been logged today yet.';
    }

    if (focusNoteEl) {
      if (pendingReviews.length) {
        focusNoteEl.textContent = 'Priority: ' + pendingReviews[0].studentName + ' is waiting for review in ' + getChapterTitle(pendingReviews[0].chapId) + '.';
      } else if (completedTodayCount) {
        focusNoteEl.textContent = completedTodayCount + ' activity session' + (completedTodayCount === 1 ? ' has' : 's have') + ' already been completed today.';
      } else if (leaderboardData.length) {
        focusNoteEl.textContent = 'No urgent review is pending. Open the Students page to monitor class readiness in detail.';
      } else {
        focusNoteEl.textContent = 'No learners are visible yet. Ask the school admin to connect students to this school scope.';
      }
    }
  }

  function renderStudentRoster(leaderboardData, pendingReviews, attendanceDocs) {
    const rosterEl = document.getElementById('teacherStudentRoster');
    if (!rosterEl) return;

    if (!leaderboardData.length) {
      rosterEl.innerHTML = '<div class="attendance-empty"><i class="fas fa-user-graduate" style="font-size:1.35rem; color:#243d6b; margin-bottom:0.5rem;"></i><br>No students are available in your current teacher scope.</div>';
      return;
    }

    const pendingByStudent = {};
    pendingReviews.forEach((review) => {
      pendingByStudent[review.studentUid] = (pendingByStudent[review.studentUid] || 0) + 1;
    });

    const todayKey = new Date().toISOString().slice(0, 10);
    const latestAttendanceByStudent = {};
    attendanceDocs.forEach((session) => {
      const sessionKey = session.sessionDate || String(session.activityStartedAt || '').slice(0, 10);
      if (sessionKey !== todayKey) return;

      const existing = latestAttendanceByStudent[session.student_uid];
      const sessionTime = new Date(session.activityStartedAt || session.lastUpdatedAt || session.activityCompletedAt || 0).getTime();
      const existingTime = existing ? new Date(existing.activityStartedAt || existing.lastUpdatedAt || existing.activityCompletedAt || 0).getTime() : -1;
      if (!existing || sessionTime > existingTime) {
        latestAttendanceByStudent[session.student_uid] = session;
      }
    });

    let rosterHtml = '';
    let currentClassGroup = '';
    [...leaderboardData]
      .sort((left, right) => {
        const leftClass = getClassLabel(left.classId);
        const rightClass = getClassLabel(right.classId);
        return leftClass.localeCompare(rightClass, undefined, { sensitivity: 'base' }) || left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
      })
      .forEach((student) => {
        const latestSession = latestAttendanceByStudent[student.uid];
        const latestMeta = latestSession ? getAttendanceStatusMeta(latestSession) : null;
        const latestTitle = latestSession ? (latestSession.chapter_title || getChapterTitle(latestSession.chapter_id)) : 'No activity opened today';
        const latestTime = latestSession ? formatClockTime(latestSession.activityStartedAt || latestSession.lastUpdatedAt || latestSession.activityCompletedAt) : 'Awaiting activity';
        const reviewCount = pendingByStudent[student.uid] || 0;
        const completedCount = student.completedCount || 0;
        const studentName = escapeHtml(student.name);
        const classLabel = escapeHtml(getClassLabel(student.classId));
        const photoMarkup = student.photoURL
          ? '<img class="student-roster-photo" src="' + escapeHtml(student.photoURL) + '" alt="' + studentName + '">'
          : '<div class="student-avatar"><i class="fas fa-user-graduate"></i></div>';
        const reviewMarkup = reviewCount
          ? '<span class="attendance-pill revisit"><i class="fas fa-clipboard-check"></i> ' + reviewCount + ' pending review' + (reviewCount > 1 ? 's' : '') + '</span>'
          : '<span class="attendance-pill completed"><i class="fas fa-circle-check"></i> Reviews clear</span>';
        const attendanceMarkup = latestMeta
          ? '<span class="attendance-pill ' + latestMeta.className + '"><i class="fas ' + latestMeta.icon + '"></i> ' + escapeHtml(latestMeta.label) + '</span>'
          : '<span class="attendance-pill time"><i class="fas fa-clock"></i> No activity yet</span>';

        const currentStudentClass = getClassLabel(student.classId);
        if (currentStudentClass !== currentClassGroup) {
          if (currentClassGroup) {
            rosterHtml += '</div>';
          }

          currentClassGroup = currentStudentClass;
          rosterHtml +=
            '<div class="student-roster-group">' +
              '<div class="student-roster-group-title"><i class="fas fa-layer-group"></i> Class / Section: ' + escapeHtml(currentStudentClass) + '</div>';
        }

        const rosterActionMarkup = reviewCount
          ? '<div class="student-roster-actions"><button class="quick-link-action" type="button" onclick="switchTeacherSection(&quot;reviews&quot;)">Open Review Queue</button></div>'
          : (latestSession
            ? '<div class="student-roster-actions"><button class="quick-link-action secondary" type="button" onclick="switchTeacherSection(&quot;attendance&quot;)">Open Activity Log</button></div>'
            : '');

        rosterHtml +=
          '<div class="student-roster-item">' +
            '<div class="student-roster-copy">' +
              photoMarkup +
              '<div>' +
                '<strong>' + studentName + '</strong>' +
                '<span class="student-roster-classline">Class / Section: ' + classLabel + '</span>' +
                '<span>Points earned: ' + student.totalPoints + ' points | Chapters completed: ' + completedCount + '</span>' +
                '<div class="student-roster-meta">' +
                  reviewMarkup +
                  attendanceMarkup +
                  '<span class="attendance-pill duration"><i class="fas fa-book-open"></i> ' + escapeHtml(latestTitle) + '</span>' +
                  '<span class="attendance-pill time"><i class="fas fa-clock"></i> ' + escapeHtml(latestTime) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            rosterActionMarkup +
          '</div>';
      });

    if (currentClassGroup) {
      rosterHtml += '</div>';
    }

    rosterEl.innerHTML = rosterHtml;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const waitOverlay = document.getElementById('authWaitOverlay');
      if (waitOverlay) waitOverlay.remove();
      const demoOverlay = document.getElementById('demoOverlay');
      if (demoOverlay) demoOverlay.remove();
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'teacher') {
          currentTeacher = { uid: user.uid, ...userDoc.data() };
          teacherSchoolId = currentTeacher.school_id;
          
          if (teacherSchoolId && !currentTeacher.school_name) {
            try {
              const schoolSnap = await getDoc(doc(db, 'schools', teacherSchoolId));
              if (schoolSnap.exists()) {
                currentTeacher.school_name = schoolSnap.data().name || teacherSchoolId;
                if (!currentTeacher.school_logo_url && schoolSnap.data().logo_url) {
                  currentTeacher.school_logo_url = schoolSnap.data().logo_url;
                }
              }
            } catch (e) {
              console.warn('Failed to load school details:', e);
            }
          }
          
          document.getElementById('teacherDashboardView').classList.remove('d-none');
          initDashboard();
        } else {
          document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-lock" style="font-size:3rem; color:#1E2D5A; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Teacher Login Required</h3>
                 <p style="color:#64748b; margin-bottom:25px;">You cannot view this page with your current account.</p>
                 <button onclick="window.location.href = 'auth.html'" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
              </div>
            </div>
          \`);
        }
      } catch(e) { 
        console.error(e); 
        document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ef4444; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Connection Error</h3>
                 <p style="color:#64748b; margin-bottom:25px;">Could not connect to the database. Please check your internet connection.</p>
                 <button onclick="window.location.reload()" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Retry</button>
              </div>
            </div>
          \`);
      }
    } else {
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
        if (restored) return;
      }

      document.body.insertAdjacentHTML('beforeend', \`
        <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
          <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
             <i class="fas fa-lock" style="font-size:3rem; color:#1E2D5A; margin-bottom:20px;"></i>
             <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Teacher Login Required</h3>
             <p style="color:#64748b; margin-bottom:25px;">You must be logged in as a Teacher to track your class.</p>
             <button onclick="window.location.href = 'auth.html'" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
          </div>
        </div>
      \`);
    }
  });

  async function initDashboard() {
    const schoolNameText = currentTeacher.school_name || 'Your School';
      document.getElementById('welcomeName').textContent = schoolNameText;
      const sidebarName = document.getElementById('sidebarProfileName');
      if (sidebarName) sidebarName.textContent = currentTeacher.name || 'Teacher';
      const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
      if (sidebarPhoto && currentTeacher.photoURL) sidebarPhoto.src = currentTeacher.photoURL;
      const schoolLogo = document.getElementById('schoolLogoImg');
      if (schoolLogo && currentTeacher.school_logo_url) schoolLogo.src = currentTeacher.school_logo_url;
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-school"></i> School Access Granted';
    document.getElementById('classInfo').textContent = 'Loading class scope...';

    // 1. Fetch all students in the teacher's school
    const usersRef = collection(db, "users");
    let leaderboardData = [];
    let studentMap = {}; 
    let studentsSnap;

    if (!teacherSchoolId) {
      console.warn('[Teacher Dashboard] teacherSchoolId is missing. Skipping student fetch.');
      const rosterEl = document.getElementById('teacherStudentRoster');
      if (rosterEl) rosterEl.innerHTML = '<div style="padding: 2rem; background: #fee2e2; color: #991b1b; border-radius: 12px; text-align: center;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>School Link Missing</strong><br>Your teacher account is not linked to any school. Please ask your School Admin to provide a Teacher Invitation Code, or you will not be able to see any students.</div>';
    } else {
      const qStudents = query(usersRef, where("school_id", "==", teacherSchoolId));
      try {
        studentsSnap = await getDocs(qStudents);
      } catch(e) { console.error('[Teacher Dashboard] Failed to fetch students:', e); }
    }
    
    if (studentsSnap) {
      studentsSnap.forEach(docSnap => {
          let stu = docSnap.data();
          if (stu.role !== 'student') return;
        stu.uid = docSnap.id;
        stu.game_state = normalizeGameState(stu.game_state);
        studentMap[stu.uid] = stu;
        
        let points = stu.game_state.points;
        leaderboardData.push({
          uid: stu.uid,
          name: stu.name,
          totalPoints: points,
          classId: stu.class_id || '',
          photoURL: stu.photoURL || '',
          completedCount: stu.game_state.completed.length,
          game_state: stu.game_state
        });
      });
    }

    console.log('[Teacher Dashboard] Found', Object.keys(studentMap).length, 'students for school', teacherSchoolId);
    Object.values(studentMap).forEach(function(s) {
      var gs = s.game_state || {};
      console.log('[Teacher Dashboard] Student:', s.name, '| completed:', (gs.completed||[]).length, '| parent_approved:', (gs.parent_approved||[]).length, '| teacher_approved:', (gs.teacher_approved||[]).length);
    });

    // Sort and Render Leaderboard
    leaderboardData.sort((a,b) => b.totalPoints - a.totalPoints);
    const classScopeMeta = getClassScopeMeta(leaderboardData);
    document.getElementById('teacherStudentCount').textContent = String(leaderboardData.length);
    document.getElementById('teacherTopPoints').textContent = leaderboardData.length ? String(leaderboardData[0].totalPoints) : '0';
    
    // Inject Auto-Sync Utility if 0 students
    if (leaderboardData.length === 0) {
      document.getElementById('classInfo').innerHTML = classScopeMeta.workspaceText + 
        '<br><br><button id="forceSyncBtn" style="background:var(--student-purple); color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold; font-family:Sora, sans-serif;"><i class="fas fa-link"></i> Force Sync Unlinked Students</button>';
        
      setTimeout(() => {
        const syncBtn = document.getElementById('forceSyncBtn');
        if (syncBtn) {
          syncBtn.addEventListener('click', async () => {
            syncBtn.textContent = 'Syncing... Please wait';
            syncBtn.disabled = true;
            try {
              // Repair only students who registered with THIS school's invite
              // codes but whose profile is missing the school link. (Scanning
              // or claiming other schools' students is blocked by the rules.)
              const invSnap = await getDocs(query(collection(db, 'invites'),
                where('school_id', '==', teacherSchoolId),
                where('role', '==', 'student'),
                where('status', '==', 'used')));
              let fixed = 0;
              for (const inv of invSnap.docs) {
                const uid = inv.data().used_by_uid;
                if (!uid) continue;
                try {
                  await updateDoc(doc(db, 'users', uid), { school_id: teacherSchoolId });
                  fixed++;
                } catch (e) { /* already linked — nothing to fix */ }
              }
              alert(fixed + ' students have been linked to your school! Please refresh the page.');
              window.location.reload();
            } catch(err) {
              console.error(err);
              alert('Could not sync automatically. You may need to register the students using the correct Invitation Code. Error: ' + err.message);
              syncBtn.textContent = 'Force Sync Unlinked Students';
              syncBtn.disabled = false;
            }
          });
        }
      }, 500);
    } else {
      document.getElementById('classInfo').textContent = classScopeMeta.workspaceText;
    }

    const rosterClassChip = document.getElementById('teacherRosterClassChip');
    if (rosterClassChip) {
      rosterClassChip.innerHTML = '<i class="fas fa-user-group"></i> ' + escapeHtml(classScopeMeta.chipText);
    }

    const rosterSummary = document.getElementById('teacherRosterSummary');
    if (rosterSummary) {
      rosterSummary.textContent = classScopeMeta.rosterText;
    }

    const rankingScopeChip = document.getElementById('teacherRankingScopeChip');
    if (rankingScopeChip) {
      rankingScopeChip.innerHTML = '<i class="fas fa-trophy"></i> ' + escapeHtml(classScopeMeta.rankingText);
    }

    let lbHtml = '';
    leaderboardData.forEach((s, idx) => {
      let rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'rank-other'));
      const studentName = escapeHtml(s.name);
      const classLabel = escapeHtml(getClassLabel(s.classId));
      lbHtml += 
        '<div class="student-rank-item">' +
          '<div class="rank-badge ' + rankClass + '">' + (idx + 1) + '</div>' +
          '<div class="student-avatar"><i class="fas fa-user-graduate"></i></div>' +
          '<div class="student-rank-copy">' +
            '<div class="student-name">' + studentName + '</div>' +
            '<div class="student-rank-subtitle">Class / Section: ' + classLabel + '</div>' +
          '</div>' +
          '<div class="student-score">' + s.totalPoints + ' points</div>' +
        '</div>';
    });
    document.getElementById('leaderboardList').innerHTML = lbHtml;

    // 2. Fetch specific submissions matching teacher's students
    let pendingReviews = [];
    let subDocs = [];

    const seenSubmissionIds = new Set();
    const pushUniqueSubmissions = (snapshot) => {
        snapshot.forEach((docSnap) => {
        if (seenSubmissionIds.has(docSnap.id)) return;
        seenSubmissionIds.add(docSnap.id);
        subDocs.push({ id: docSnap.id, ...docSnap.data() });
      });
    };

    // Attempt primary school_id query
    const qSub = query(collection(db, "activity_submissions"), where("school_id", "==", teacherSchoolId));
    pushUniqueSubmissions(await getDocs(qSub));
    console.log('[Teacher Dashboard] Primary query returned', subDocs.length, 'submissions for school', teacherSchoolId);

    // Fallback for older or partially migrated submissions that are missing school_id.
    try {
      const studentUids = Object.keys(studentMap);
      for (let index = 0; index < studentUids.length; index += 10) {
        const studentUidChunk = studentUids.slice(index, index + 10);
        if (!studentUidChunk.length) continue;

        const qSubFallback = query(collection(db, "activity_submissions"), where("student_uid", "in", studentUidChunk));
        pushUniqueSubmissions(await getDocs(qSubFallback));
      }
      console.log('[Teacher Dashboard] After fallback, total submissions:', subDocs.length);
    } catch(fallbackErr) {
      console.warn('[Teacher Dashboard] Fallback submission query skipped (permission):', fallbackErr.message);
    }

    pendingReviews = buildPendingReviewQueue(studentMap, subDocs);
    console.log('[Teacher Dashboard] Pending reviews for teacher:', pendingReviews.length, pendingReviews.map(function(r){ return r.studentName + ' / ' + r.chapId + ' / ready=' + r.canTeacherApprove; }));

    // Render Review Queue
    document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
    document.getElementById('teacherPendingReviews').textContent = String(pendingReviews.length);
    let revHtml = '';
    if (pendingReviews.length === 0) {
      revHtml = '<div class="text-center p-5"><i class="fas fa-glass-cheers text-success fa-3x mb-3"></i><h4>All Caught Up!</h4><p class="text-muted">You have reviewed all student answers.</p></div>';
    } else {
      pendingReviews.forEach((rev) => {
        let cTitle = getChapterTitle(rev.chapId);
        let rawData = encodeURIComponent(JSON.stringify(rev));
        let statusLabel = rev.statusLabel || (rev.isSubmissionMissing ? 'Submission Missing' : 'Teacher Review Pending');
        let statusClass = rev.statusClass || (rev.isSubmissionMissing ? 'bg-danger' : 'bg-warning text-dark');
        let answerPreview = rev.isSubmissionMissing
          ? 'The chapter is marked as waiting for teacher review, but the saved submission sheet is missing. Open the full sheet to see the recovery note.'
          : rev.answer;
        let actionButton = rev.canTeacherApprove
          ? '<button class="btn-approve" onclick="awardTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\', \\'' + rev.subId + '\\')"><i class="fas fa-check"></i> Quick Pass</button>'
          : '<button class="btn btn-secondary rounded-pill" type="button" disabled><i class="fas fa-lock"></i> ' + (rev.isSubmissionMissing ? 'Sheet Missing' : 'Waiting for Parent') + '</button>';
        
        revHtml += 
          '<div class="review-item">' +
            '<div class="d-flex align-items-center mb-2">' +
              '<div class="student-avatar" style="width:30px; height:30px; font-size:1rem; margin-right:10px;"><i class="fas fa-user-graduate"></i></div>' +
              '<strong style="font-size: 1.1rem; color: #1e293b;">' + rev.studentName + '</strong>' +
              '<span class="ms-auto" style="font-size: 0.85rem; color: #64748b; background: white; padding: 2px 8px; border-radius: 10px; border: 1px solid #cbd5e1;">' + cTitle + '</span>' +
            '</div>' +
            '<div style="font-size:0.9rem; font-weight:bold; color:#D63678;">Status: <span class="badge ' + statusClass + '">' + statusLabel + '</span></div>' +
            '<div class="student-discussion-text" style="max-height:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"' + answerPreview + '"</div>' +
            '<div class="d-flex justify-content-end mt-3">' +
              '<button class="btn btn-primary rounded-pill me-2" onclick="openReviewModal(\\'' + rawData + '\\')"><i class="fas fa-search"></i> View Full Sheet</button>' +
              actionButton +
            '</div>' +
          '</div>';
      });
    }
    document.getElementById('reviewsList').innerHTML = revHtml;

    // 3. Fetch today's attendance sessions for this school
    let attendanceDocs = [];
    try {
      const attendanceSnap = await getDocs(query(collection(db, "activity_attendance"), where("school_id", "==", teacherSchoolId)));
      attendanceSnap.forEach((docSnap) => attendanceDocs.push({ id: docSnap.id, ...docSnap.data() }));
    } catch (attendanceError) {
      console.error('Attendance query error:', attendanceError);
    }

    renderAttendancePanel(attendanceDocs, studentMap);
      window.teacherAttendanceData = attendanceDocs;
      window.teacherStudentMap = studentMap;
      window.renderRegisterTables();
    renderStudentRoster(leaderboardData, pendingReviews, attendanceDocs);
    renderOverviewSnapshot(leaderboardData, pendingReviews, attendanceDocs);
    window.switchTeacherSection(currentTeacherSection, { scroll: false });
  }

  window.awardTeacherPoints = async (studentUid, chapterId, submissionId = '') => {
    try {
      const reviewRef = doc(db, "activity_submissions", submissionId || (studentUid + '_' + chapterId));
      const reviewSnap = await getDoc(reviewRef);
      const studentRef = doc(db, "users", studentUid);
      const studentDoc = await getDoc(studentRef);
      if (!studentDoc.exists()) {
        alert("Student record not found.");
        return;
      }

      let state = normalizeGameState(studentDoc.data().game_state);
      const reviewData = reviewSnap.exists() ? reviewSnap.data() : null;
      const isReadyForTeacher = state.parent_approved.includes(chapterId) || (reviewData && (reviewData.reviewStatus === 'pending_teacher' || !!reviewData.parentApprovedAt || hasMeaningfulParentNote(reviewData.parentNotes)));

      if (!reviewSnap.exists()) {
        alert("This submission sheet is missing. Ask the student to reopen and resubmit the chapter first.");
        return;
      }

      if (!isReadyForTeacher) {
        alert("This activity is still waiting for parent approval.");
        return;
      }

      if (!state.teacher_approved.includes(chapterId)) {
        state.teacher_approved.push(chapterId);
        state.points += 50;
        await updateDoc(studentRef, { game_state: state });
      }

      await updateDoc(reviewRef, {
        reviewStatus: 'teacher_approved',
        teacherApprovedAt: new Date().toISOString(),
        teacherApprovedBy: currentTeacher ? currentTeacher.uid : '',
        updatedAt: new Date().toISOString()
      });
      
      closeReviewModal();
      initDashboard(); // Re-render
      alert("Answer marked as Excellent. 50 points awarded to the student.");
    } catch(err) {
      console.error(err);
      alert("Error saving approval.");
    }
  };

  window.rejectTeacherPoints = async (studentUid, chapterId, submissionId = '') => {
    if (confirm("Are you sure you want to reject this answer? The student will have to fill it out again.")) {
      try {
        // Remove from student completed list so they can do it again
        const studentRef = doc(db, "users", studentUid);
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          let state = normalizeGameState(studentDoc.data().game_state);
          state.completed = state.completed.filter(id => id !== chapterId);
          state.parent_approved = state.parent_approved.filter(id => id !== chapterId);
          state.teacher_approved = state.teacher_approved.filter(id => id !== chapterId);
          await updateDoc(studentRef, { game_state: state });
        }
        
        // Delete submission entirely
        await deleteDoc(doc(db, "activity_submissions", submissionId || ("" + studentUid + "_" + chapterId)));
        
        closeReviewModal();
        initDashboard();
          alert("Submission rejected. It has been sent back to the student.");
      } catch(e) {
        console.error(e);
        alert("Error rejecting submission.");
      }
    }
  };

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

    // Modal Logic
    const modalHTML = 
      '<div class="custom-modal-overlay" id="reviewModalOverlay">' +
        '<div class="custom-modal" id="reviewModal">' +
          '<button class="modal-close-btn" onclick="closeReviewModal()"><i class="fas fa-times"></i></button>' +
          '<h3 style="font-family: \\'Fredoka One\\', cursive; color:#1e293b;"><i class="fas fa-clipboard-check text-primary"></i> Activity Sheet Review</h3>' +
          '<p class="text-muted" id="rmStudentInfo" style="font-size: 0.9rem; margin-bottom: 20px;"></p>' +
          '<h5 style="color:#D63678; font-weight:800; font-size:1rem;">Discussion Answer:</h5>' +
          '<div class="student-discussion-text" id="rmDiscussion" style="background:#FDF8F5; border-color:#D63678;"></div>' +
          '<h5 style="color:#D63678; font-weight:800; font-size:1rem; margin-top:15px;">Daily Action Grid Summary:</h5>' +
          '<div class="grid-summary" id="rmGrid"></div>' +
          '<h5 style="color:#D63678; font-weight:800; font-size:1rem; margin-top:15px;">Parent Feedback:</h5>' +
          '<div class="grid-summary" id="rmParents" style="background: #FDF8F5; border-color:#E08020;"></div>' +
          '<div class="text-center mt-4" id="rmActionBtn">' +
            '<!-- Injected dynamically -->' +
          '</div>' +
        '</div>' +
      '</div>';
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

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
      htmlContent += '<thead style="background:#FDF8F5; font-family: \\'Fredoka One\\', cursive; color:#1E2D5A;"><tr><th class="text-start">Activity</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th></tr></thead><tbody>';
      
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

    window.openReviewModal = (rawData) => {
      let rev = JSON.parse(decodeURIComponent(rawData));
      document.getElementById('rmStudentInfo').innerHTML = '<strong>' + rev.studentName + '</strong> &bull; ' + getChapterTitle(rev.chapId);
      document.getElementById('rmDiscussion').innerText = rev.answer;
      
      let gridHtml = 'No grid data captured.';
      if(rev.grid && rev.chapId) {
        gridHtml = generateGridHtml(rev.chapId, rev.grid);
      }
      document.getElementById('rmGrid').innerHTML = gridHtml;

      let parentHtml = '';
      if(rev.parents && rev.parents.length > 0) {
        let validNotes = rev.parents.filter(n => n.trim() !== '');
        if(validNotes.length > 0) {
           parentHtml = '<ul>' + validNotes.map(n => '<li>"' + n + '"</li>').join('') + '</ul>';
        } else {
           parentHtml = 'No parent notes provided.';
        }
      } else {
        parentHtml = 'No parent notes provided.';
      }
      document.getElementById('rmParents').innerHTML = parentHtml;

      if (rev.canTeacherApprove) {
        document.getElementById('rmActionBtn').innerHTML = 
          '<button class="btn btn-outline-danger px-4 rounded-pill fw-bold mb-2 me-2" onclick="rejectTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\', \\'' + rev.subId + '\\')"><i class="fas fa-undo"></i> Reject (Needs Changes)</button>' +
          '<button class="btn btn-success px-4 rounded-pill fw-bold mb-2 shadow-sm" onclick="awardTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\', \\'' + rev.subId + '\\')"><i class="fas fa-star text-warning"></i> Mark Excellent & Award 50 points</button>';
      } else {
        document.getElementById('rmActionBtn').innerHTML =
          '<div class="alert ' + (rev.isSubmissionMissing ? 'alert-danger' : 'alert-info') + ' text-start mb-0">' +
            (rev.blockedReason || 'This activity is still waiting for the parent review before teacher approval can continue.') +
          '</div>';
      }

      document.getElementById('reviewModalOverlay').style.display = 'flex';
      document.getElementById('reviewModal').classList.add('animate__animated', 'animate__zoomIn');
    };

    window.closeReviewModal = () => {
      document.getElementById('reviewModalOverlay').style.display = 'none';
      document.getElementById('reviewModal').classList.remove('animate__animated', 'animate__zoomIn');
    };

  window.logoutTeacher = () => {
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

  // ── Teacher Profile Photo Upload ──
  async function uploadTeacherProfile(file) {
    if (!currentTeacher || !file) return;
    if (!file.type || !file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
    const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
    const badge = document.querySelector('#sidebarAvatarClickArea .sidebar-cam-badge');
    if (badge) badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const scope = currentTeacher.school_id ? 'schools/' + currentTeacher.school_id : 'independent';
      const storageRef = ref(storage, scope + '/users/' + currentTeacher.uid + '/profile-' + Date.now() + '.' + ext);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', currentTeacher.uid), { photoURL: downloadURL });
      currentTeacher.photoURL = downloadURL;
      if (sidebarPhoto) sidebarPhoto.src = downloadURL;
    } catch (err) {
      console.error('Teacher profile upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      if (badge) badge.innerHTML = '<i class="fas fa-camera"></i>';
    }
  }

  // File input is now directly inside avatar div — direct user touch triggers picker
  const teacherFileInput = document.getElementById('teacherProfileFileInput');
  if (teacherFileInput) {
    teacherFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await uploadTeacherProfile(e.target.files[0]);
        e.target.value = '';
      }
    });
  }
    
</script>
`

