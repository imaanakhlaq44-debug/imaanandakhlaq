import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'

export const ActivityDashboard = () => html`
<style>
  /* Fonts loaded via <link> in layout — no duplicate @import needed */

  :root {
    --student-blue: #243d6b;
    --student-blue-deep: #1d3156;
    --student-pink: #cf296d;
    --student-orange: #ea8300;
    --student-tan: #cb955d;
    --student-ink: #1b2942;
    --student-muted: #6f7f96;
    --student-line: #dce6f1;
    --student-soft-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  .d-none {
    display: none !important;
  }

  .student-page {
    min-height: 100vh;
    margin: 0;
    background:
      radial-gradient(circle at top left, rgba(207,41,109,0.22), transparent 25%),
      radial-gradient(circle at bottom right, rgba(234,131,0,0.18), transparent 24%),
      linear-gradient(135deg, #0c1730 0%, #1d3156 100%);
    font-family: 'Nunito', sans-serif;
    color: var(--student-ink);
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

  /* Profile section at top of sidebar */
  .sidebar-profile-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0 0.9rem;
    border-bottom: 1px solid rgba(255,255,255,0.10);
  }
  .sidebar-profile-top .sidebar-brand-art {
    width: 62px;
    height: 62px;
    flex: 0 0 62px;
  }
  .sidebar-profile-top .sidebar-title {
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
    word-break: break-word;
    line-height: 1.3;
  }

  /* ============================================================
     SIDEBAR BRAND v2 — profile + compact school chip with icons
     ============================================================ */
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
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    flex: 1 1 auto;
  }
  .sidebar-profile-cluster .sidebar-brand-art {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    border-radius: 50%;
    border-width: 2px;
  }
  .sidebar-name-block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }
  .sidebar-name-block .sidebar-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 8rem;
    font-size: 0.92rem;
  }
  .sidebar-school-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.36rem 0.28rem 0.32rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 14px rgba(7,17,29,0.18);
    flex: 0 0 auto;
    min-width: 0;
  }
  .sidebar-school-art {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.18);
    position: relative;
  }
  .sidebar-school-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sidebar-school-cam-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: #D63678;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    border: 1.5px solid #1f3559;
  }
  .sidebar-school-cam-badge i {
    color: #fff;
    font-size: 6px;
  }
  .sidebar-school-name {
    font-family: 'Sora', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.2px;
    max-width: 5.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sidebar-chip-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: 0.1rem;
  }
  .sidebar-icon-btn {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.12);
    color: #ffffff;
    cursor: pointer;
    font-size: 0.72rem;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  .sidebar-icon-btn:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.22);
  }
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
    width: 64px;
    height: 64px;
    flex: 0 0 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: 3px solid rgba(255,255,255,0.8);
    box-shadow: 0 10px 24px rgba(7,17,29,0.3);
    position: relative;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .sidebar-brand-art:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 28px rgba(7,17,29,0.4);
    border-color: #ffffff;
  }
  .sidebar-brand-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .sidebar-brand-art .sidebar-cam-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: #ffffff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    border: 1px solid #e2e8f0;
    transition: background 0.2s;
  }
  .sidebar-brand-art:hover .sidebar-cam-badge {
    background: #f8fafc;
  }
  .sidebar-brand-art .sidebar-cam-badge i {
    color: #29416d;
    font-size: 11px;
  }

  .workspace-art {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .workspace-art:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  }
  .workspace-art .school-cam-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: #D63678;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .workspace-art .school-cam-badge i {
    color: #fff;
    font-size: 9px;
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

  /* School name, sitting quietly under the student's own name. This replaces
     the old "SCHOOL DASHBOARD" banner further down the page, which spent a
     full-width card on one line of text. Kept small and uppercase-tracked so
     it reads as a label rather than competing with the name above it. */
  .sidebar-school {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.62);
    margin-top: 0.15rem;
    text-align: center;
  }
  .sidebar-school:empty {
    display: none;
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

  .nav-badge.books {
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
  }

  .nav-badge.progress {
    background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%);
  }

  .nav-badge.profile {
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
    background: linear-gradient(135deg, var(--student-blue) 0%, #2b4677 52%, var(--student-pink) 100%);
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
    min-width: 0;
  }

  .dashboard-home-btn,
  .profile-manage-btn,
  .dashboard-ghost-btn,
  .unlock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
  }

  .dashboard-home-btn {
    padding: 0.7rem 0.95rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.16);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 12px 24px rgba(7,17,29,0.12);
  }

  .dashboard-home-btn:hover,
  .profile-manage-btn:hover,
  .dashboard-ghost-btn:hover,
  .unlock-btn:hover {
    transform: translateY(-1px);
  }

  .workspace-profile-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.8rem;
    border-radius: 14px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.16);
    min-width: 0;
  }

  .workspace-profile-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .profile-avatar-shell {
    width: 52px;
    height: 52px;
    flex: 0 0 52px;
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 12px 22px rgba(7,17,29,0.14);
  }

  .profile-avatar-shell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .profile-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
  }

  .profile-copy span {
    display: block;
    margin-top: 0.16rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(255,255,255,0.72);
    line-height: 1.35;
  }

  .profile-manage-btn {
    padding: 0.68rem 0.8rem;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.96));
    color: var(--student-blue-deep);
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: 0 12px 22px rgba(15,23,42,0.1);
    white-space: nowrap;
  }

  .summary-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .summary-card {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    color: #ffffff;
    min-height: 118px;
    box-shadow: var(--student-soft-shadow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .summary-card[data-section] {
    cursor: pointer;
  }

  .summary-card[data-section]:hover,
  .summary-card[data-section]:focus-visible,
  .summary-card.is-active {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px rgba(15, 23, 42, 0.16);
    outline: none;
  }

  .summary-card.points {
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
  }

  .summary-card.completed {
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
  }

  .summary-card.pending {
    background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%);
  }

  /* ===== Champions Board ===== */
  .champions-board {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
    border-radius: 20px;
    padding: 24px 20px 20px;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 52, 96, 0.35);
  }
  .champions-board::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 10% 20%, rgba(255,215,0,0.12), transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(214,54,120,0.10), transparent 40%);
    pointer-events: none;
  }
  .champions-header {
    text-align: center; margin-bottom: 18px; position: relative; z-index: 1;
  }
  .champions-header h3 {
    font-family: 'Sora', sans-serif;
    color: #FFD700; font-size: 1.15rem; font-weight: 800;
    margin: 0 0 4px; letter-spacing: 0.5px;
    text-shadow: 0 0 20px rgba(255,215,0,0.4);
  }
  .champions-header p {
    color: rgba(255,255,255,0.7); font-size: 0.8rem; margin: 0;
    font-weight: 600;
  }
  .champions-podium {
    display: flex; justify-content: center; align-items: flex-end;
    gap: 12px; position: relative; z-index: 1;
  }
  .podium-slot {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; flex: 0 0 auto; width: 100px;
  }
  .podium-slot.rank-1 { order: 2; }
  .podium-slot.rank-2 { order: 1; }
  .podium-slot.rank-3 { order: 3; }
  .podium-avatar-wrap {
    position: relative; margin-bottom: 6px;
  }
  .podium-avatar {
    width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
    border: 3px solid rgba(255,255,255,0.3);
  }
  .rank-1 .podium-avatar { width: 68px; height: 68px; border-color: #FFD700; box-shadow: 0 0 18px rgba(255,215,0,0.5); }
  .rank-2 .podium-avatar { border-color: #C0C0C0; }
  .rank-3 .podium-avatar { border-color: #CD7F32; }
  .podium-crown {
    position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
    font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  }
  .podium-badge {
    position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 900; color: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  }
  .rank-1 .podium-badge { background: linear-gradient(135deg, #FFD700, #FFA500); }
  .rank-2 .podium-badge { background: linear-gradient(135deg, #C0C0C0, #8a8a8a); }
  .rank-3 .podium-badge { background: linear-gradient(135deg, #CD7F32, #8B4513); }
  .podium-name {
    color: #fff; font-size: 0.78rem; font-weight: 700;
    max-width: 96px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .podium-xp {
    color: #FFD700; font-family: 'Orbitron', monospace;
    font-size: 0.75rem; font-weight: 800;
  }
  .podium-bar {
    width: 80px; border-radius: 8px 8px 0 0; margin-top: 6px;
  }
  .rank-1 .podium-bar { height: 64px; background: linear-gradient(180deg, #FFD700 0%, #cc8800 100%); }
  .rank-2 .podium-bar { height: 46px; background: linear-gradient(180deg, #C0C0C0 0%, #7a7a7a 100%); }
  .rank-3 .podium-bar { height: 32px; background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%); }
  .champions-gift-banner {
    margin-top: 14px; text-align: center; position: relative; z-index: 1;
    background: linear-gradient(90deg, rgba(255,215,0,0.12), rgba(214,54,120,0.12));
    border: 1px solid rgba(255,215,0,0.25); border-radius: 12px;
    padding: 10px 14px;
  }
  .champions-gift-banner p {
    margin: 0; color: #FFD700; font-size: 0.82rem; font-weight: 700;
    line-height: 1.4;
  }
  .champions-gift-banner .gift-icon {
    font-size: 1.1rem; margin-right: 4px;
  }
  .champions-loading {
    text-align: center; padding: 20px; color: rgba(255,255,255,0.5);
    font-size: 0.85rem;
  }
  @media (max-width: 480px) {
    .podium-slot { width: 85px; }
    .podium-avatar { width: 48px; height: 48px; }
    .rank-1 .podium-avatar { width: 58px; height: 58px; }
    .podium-bar { width: 65px; }
    .champions-podium { gap: 8px; }
  }

  .summary-copy {
    position: relative;
    z-index: 1;
  }

  .summary-label {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.74);
    margin-bottom: 0.3rem;
  }

  .summary-value {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.6rem, 2.7vw, 2.2rem);
    font-weight: 800;
    line-height: 1;
  }

  .summary-meta {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: rgba(255,255,255,0.78);
    line-height: 1.35;
  }

  .summary-card img {
    width: 68px;
    height: 68px;
    object-fit: contain;
    filter: drop-shadow(0 14px 22px rgba(15,23,42,0.18));
  }

  .student-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(290px, 0.8fr);
    gap: 0.75rem;
    align-items: start;
  }

  .surface-card {
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,251,253,0.98));
    border: 1px solid var(--student-line);
    border-radius: 16px;
    padding: 0.9rem;
    box-shadow: var(--student-soft-shadow);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.7rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.72rem;
    border-bottom: 1px solid var(--student-line);
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
    background: linear-gradient(180deg, #f7fbff 0%, #eef4fb 100%);
    border: 1px solid var(--student-line);
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
    color: var(--student-ink);
  }

  .section-heading p {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--student-muted);
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
    color: var(--student-pink);
    font-size: 0.74rem;
    font-weight: 800;
  }

  .toolbar-block {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.9rem;
  }

  .toolbar-info {
    min-width: 0;
  }

  .toolbar-info h3 {
    margin: 0.55rem 0 0;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--student-ink);
  }

  .toolbar-info p {
    margin: 0.28rem 0 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--student-muted);
    line-height: 1.45;
  }

  .dashboard-ghost-btn {
    padding: 0.72rem 0.92rem;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
    color: var(--student-blue);
    border: 1px solid var(--student-line);
    box-shadow: 0 10px 20px rgba(15,23,42,0.06);
    white-space: nowrap;
  }

  #backToBooksBtn {
    background: linear-gradient(135deg, var(--student-blue) 0%, #3b5998 100%);
    color: #fff;
    border: none;
    padding: 0.65rem 1.3rem;
    border-radius: 14px;
    font-weight: 800;
    font-size: 0.92rem;
    box-shadow: 0 6px 18px rgba(36, 61, 107, 0.35);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: backBtnPulse 2s ease-in-out infinite;
    letter-spacing: 0.3px;
  }
  #backToBooksBtn i {
    margin-right: 6px;
  }
  #backToBooksBtn:hover,
  #backToBooksBtn:active {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 10px 24px rgba(36, 61, 107, 0.45);
  }
  @keyframes backBtnPulse {
    0%, 100% { box-shadow: 0 6px 18px rgba(36, 61, 107, 0.35); }
    50% { box-shadow: 0 6px 24px rgba(36, 61, 107, 0.55), 0 0 0 4px rgba(36, 61, 107, 0.12); }
  }

  .catalog-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  /* Chapter view: single-column full-width list */
  .catalog-grid.chapter-mode {
    grid-template-columns: 1fr !important;
    gap: 0.6rem !important;
  }
  .catalog-grid.chapter-mode .library-item {
    border-radius: 16px;
  }

  .library-item {
    background: #ffffff;
    border-radius: 16px;
    padding: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(41, 65, 109, 0.08);
    box-shadow: 0 2px 8px rgba(15,23,42,0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden;
  }

  .library-item[role="button"] {
    cursor: pointer;
  }

  .library-item[role="button"]:hover,
  .library-item[role="button"]:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(15,23,42,0.08);
    border-color: rgba(36,61,107,0.22);
    outline: none;
  }

  .library-item.locked {
    background: #f8fbfe;
    border-style: dashed;
    border-color: #d6dfeb;
  }

  .library-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    background: linear-gradient(180deg, #f0f5fb 0%, #dce7f7 100%);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .library-cover img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;   /* full book cover, no cropping */
    object-position: center;
    transition: transform 0.3s ease;
    image-rendering: auto;
  }

  .library-item[role="button"]:hover .library-cover img {
    transform: scale(1.03);
  }

  .library-topline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .book-chip,
  .status-pill,
  .chapter-order-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.52rem;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 700;
  }

  .book-chip {
    background: #f6f9fd;
    border: 1px solid var(--student-line);
    color: var(--student-blue);
  }

  .book-chip.muted {
    color: var(--student-muted);
  }

  .library-body {
    padding: 0.6rem 0.7rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
  }

  .library-title {
    font-family: 'Sora', sans-serif;
    font-size: 0.76rem;
    font-weight: 800;
    color: var(--student-ink);
    line-height: 1.3;
    margin: 0;
  }

  .library-subtitle {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--student-muted);
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .library-meta {
    margin-top: auto;
    padding-top: 0.4rem;
    display: flex;
    align-items: center;
  }

  /* Pink View Chapters button */
  .lib-view-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.38rem 0.7rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #cf296d 0%, #e0446e 100%);
    border: none;
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    box-shadow: 0 3px 10px rgba(207, 41, 109, 0.3);
    white-space: nowrap;
    pointer-events: none;
  }
  .library-item[role="button"]:hover .lib-view-btn {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(207, 41, 109, 0.4);
  }

  .library-subtitle {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--student-muted);
    line-height: 1.4;
    margin: 0;
  }

  .library-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .status-pill.ready {
    background: #fff2f8;
    color: var(--student-pink);
  }

  .status-pill.completed {
    background: #dcfce7;
    color: #15803d;
  }

  .status-pill.pending {
    background: #fff3cd;
    color: #856404;
  }

  .status-pill.teacher {
    background: #e0f2fe;
    color: #0369a1;
  }

  .status-pill.locked {
    background: #f1f5f9;
    color: #64748b;
  }

  /* ── Chapter card: redesigned single-row layout ── */
  .chapter-card-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem 1rem 1.35rem;
    position: relative;
  }

  .chapter-accent {
    position: absolute;
    left: 0; top: 12%; bottom: 12%;
    width: 4px;
    border-radius: 0 4px 4px 0;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }

  .chapter-icon {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    color: #ffffff;
    font-size: 1.4rem;
    box-shadow: 0 10px 20px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.25);
  }

  .chapter-icon.locked {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8) !important;
    color: #f8fafc;
    box-shadow: 0 4px 10px rgba(100,116,139,0.18);
  }

  .chapter-text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .chapter-text .ch-kicker {
    font-family: 'Sora', sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--student-muted);
    line-height: 1;
  }

  .chapter-text .ch-title {
    font-family: 'Sora', sans-serif;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--student-ink);
    line-height: 1.3;
    margin: 0;
    word-break: normal;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .chapter-action {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: 0.25rem;
  }

  .unlock-btn {
    padding: 0.55rem 0.85rem;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--student-orange) 0%, #d97706 100%);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    box-shadow: 0 10px 22px rgba(234,131,0,0.28);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .unlock-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(234,131,0,0.36);
  }

  .progress-card {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .journey-stack {
    display: grid;
    gap: 0.65rem;
  }

  .journey-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.75rem 0.82rem;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid var(--student-line);
  }

  .journey-icon {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    color: #ffffff;
    font-size: 0.92rem;
  }

  .journey-icon.unlocked {
    background: linear-gradient(180deg, #314a7f 0%, #243d6b 100%);
  }

  .journey-icon.approved {
    background: linear-gradient(180deg, #df4a82 0%, #cf296d 100%);
  }

  .journey-icon.parent {
    background: linear-gradient(180deg, #f0a43d 0%, #ea8300 100%);
  }

  .journey-icon.teacher {
    background: linear-gradient(180deg, #d6a16d 0%, #cb955d 100%);
  }

  .journey-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .journey-copy strong {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--student-ink);
  }

  .journey-copy span {
    display: block;
    margin-top: 0.16rem;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--student-muted);
    line-height: 1.35;
  }

  .journey-value {
    font-family: 'Sora', sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--student-blue);
    white-space: nowrap;
  }

  .journey-note {
    padding: 0.82rem 0.9rem;
    border-radius: 14px;
    background: linear-gradient(180deg, #fff7ed 0%, #fffbf5 100%);
    border: 1px solid rgba(234,131,0,0.18);
    color: #9a3412;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.5;
  }

  .error-card {
    text-align: center;
  }

  .error-card h3 {
    margin: 0.65rem 0 0.3rem;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--student-ink);
  }

  .error-card p {
    margin: 0.2rem 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--student-muted);
  }

  .empty-state {
    grid-column: 1 / -1;
    padding: 1.2rem;
    text-align: center;
    border-radius: 18px;
    border: 1px dashed #cbd5e1;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  }

  .empty-state h4 {
    margin: 0.5rem 0 0.2rem;
    font-family: 'Sora', sans-serif;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--student-ink);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--student-muted);
  }

  .skeleton-card {
    min-height: 280px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }

  @media (max-width: 1120px) {
    .dashboard-shell {
      grid-template-columns: 1fr;
    }

    .sidebar-panel {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      /* Below this width the shell is a single column, so the sidebar is a
         strip above the content rather than a full-height rail. Without
         releasing the 100vh floor it stayed a whole screen tall while holding
         about 56px of content, which is what left the huge empty gaps between
         the avatar, the nav and the logout button on phones. */
      min-height: 0;
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

    .student-grid,
    .summary-strip {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .dashboard-main {
      padding: 0.7rem;
    }

    .workspace-bar {
      flex-wrap: wrap;
      padding: 0.85rem;
    }

    .workspace-actions {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }

    .workspace-profile-card {
      width: 100%;
      flex-wrap: wrap;
    }

    .profile-manage-btn,
    .dashboard-home-btn,
    .dashboard-ghost-btn {
      width: 100%;
    }

    .sidebar-nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .toolbar-block {
      flex-wrap: wrap;
    }

    .catalog-grid {
      gap: 0.6rem;
    }
  }

  /* ============================================================
     DESKTOP POLISH — Student Activities Dashboard
     ============================================================ */
  :root {
    --brand-primary: #29416d;
    --brand-secondary: #cf296d;
    --brand-tertiary: #ea8300;
    --brand-success: #34d399;
    --brand-danger: #ef4444;
  }

  @media (min-width: 1280px) {
    .student-page .dashboard-shell { grid-template-columns: 260px minmax(0, 1fr) !important; }
  }
  @media (min-width: 1600px) {
    .student-page .dashboard-shell { grid-template-columns: 280px minmax(0, 1fr) !important; }
    .student-page .catalog-grid { gap: 1.5rem !important; }
  }

  .student-page .library-item,
  .student-page .summary-card,
  .student-page .panel-card,
  .student-page .section-card,
  .student-page .widget-card {
    border-radius: 20px !important;
    box-shadow: 0 6px 22px rgba(41, 65, 109, 0.08), 0 1px 3px rgba(41, 65, 109, 0.04) !important;
    border: 1px solid rgba(41, 65, 109, 0.06) !important;
    transition: transform 0.25s ease, box-shadow 0.25s ease !important;
  }
  .student-page .library-item[role="button"]:hover,
  .student-page .summary-card:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 14px 34px rgba(41, 65, 109, 0.12), 0 3px 8px rgba(41, 65, 109, 0.05) !important;
  }

  .student-page .summary-card.card-green  { border-left: 4px solid var(--brand-success) !important; }
  .student-page .summary-card.card-yellow { border-left: 4px solid var(--brand-tertiary) !important; }
  .student-page .summary-card.card-orange { border-left: 4px solid var(--brand-secondary) !important; }
  .student-page .summary-card.card-blue   { border-left: 4px solid var(--brand-primary) !important; }

  .student-page .sidebar-logout-btn {
    background: linear-gradient(135deg, #ef4444 0%, #cf296d 100%) !important;
    color: #ffffff !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.28) !important;
    font-weight: 700 !important;
  }
  .student-page .sidebar-logout-btn:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c5e 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(239, 68, 68, 0.36) !important;
    color: #ffffff !important;
  }
  .student-page .sidebar-logout-btn i { color: #ffffff !important; }

  .student-page .sidebar-nav li.active,
  .student-page .sidebar-nav li[aria-current="true"] {
    background: linear-gradient(90deg, rgba(207, 41, 109, 0.20), transparent) !important;
    border-left: 3px solid var(--brand-secondary) !important;
    color: #ffffff !important;
  }

  @media (max-width: 1199px) and (min-width: 768px) {
    .student-page .dashboard-shell { grid-template-columns: 200px minmax(0, 1fr) !important; }
    .student-page .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 767px) {
    .student-page .summary-card,
    .student-page .library-item { padding: 1rem !important; }
    /* Phones never had a column rule of their own, so the grid fell back to the
       base "repeat(4, ...)" and squeezed every book card into ~85px. The APK
       accordion normally hides that, but it only re-runs when cards are
       re-rendered — resize into a phone width and the 4-col grid stays. Two
       columns is the readable floor when the accordion is not in play. */
    .student-page .catalog-grid:not(.apk-book-accordion) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .student-page .catalog-grid.chapter-mode {
      grid-template-columns: 1fr !important;
    }
  }

  /* ============================================================
     MODERN REDESIGN v2 — colorful brand-rich UI
     ============================================================ */
  .student-page {
    background:
      radial-gradient(circle at 12% 8%, rgba(207, 41, 109, 0.10), transparent 30%),
      radial-gradient(circle at 88% 92%, rgba(234, 131, 0, 0.10), transparent 32%),
      linear-gradient(160deg, #f5f7fb 0%, #eef3fb 100%) !important;
  }
  .student-page .dashboard-shell {
    background: transparent !important;
  }

  /* Sidebar: deeper gradient with subtle pink edge */
  .student-page .sidebar-panel {
    background: linear-gradient(180deg, #1f3559 0%, #14223e 100%) !important;
    border-right: 1px solid rgba(207, 41, 109, 0.18) !important;
    box-shadow: 4px 0 24px rgba(15, 23, 42, 0.08) !important;
  }
  .student-page .sidebar-nav li {
    border-radius: 12px !important;
    margin: 2px 0 !important;
    transition: background 0.2s ease, transform 0.2s ease !important;
  }
  .student-page .sidebar-nav li:hover {
    background: rgba(255,255,255,0.06) !important;
    transform: translateX(2px);
  }
  .student-page .sidebar-nav li.active,
  .student-page .sidebar-nav li[aria-current="true"] {
    background: linear-gradient(90deg, rgba(207, 41, 109, 0.32), rgba(234, 131, 0, 0.12) 70%, transparent) !important;
    border-left: 3px solid #cf296d !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06) !important;
  }
  .student-page .sidebar-title {
    font-family: 'Sora', 'Nunito', sans-serif !important;
    font-weight: 700 !important;
    letter-spacing: 0.2px !important;
  }

  /* Hero workspace bar: vivid gradient hero */
  .student-page .workspace-bar {
    background: linear-gradient(135deg, #29416d 0%, #3a5891 45%, #cf296d 100%) !important;
    color: #ffffff !important;
    padding: 1.6rem 1.8rem !important;
    border-radius: 24px !important;
    margin: 1rem !important;
    box-shadow: 0 18px 40px rgba(41, 65, 109, 0.25), 0 4px 10px rgba(207, 41, 109, 0.18) !important;
    position: relative;
    overflow: hidden;
  }
  .student-page .workspace-bar::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -10%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(244, 197, 66, 0.22), transparent 60%);
    pointer-events: none;
  }
  .student-page .workspace-bar::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: 30%;
    width: 260px;
    height: 260px;
    background: radial-gradient(circle, rgba(234, 131, 0, 0.20), transparent 65%);
    pointer-events: none;
  }
  .student-page .workspace-title {
    color: #ffffff !important;
    font-family: 'Sora', 'Nunito', sans-serif !important;
    font-size: 1.75rem !important;
    font-weight: 800 !important;
    letter-spacing: -0.3px !important;
    text-shadow: 0 2px 8px rgba(0,0,0,0.18) !important;
  }
  .student-page .workspace-art {
    border: 3px solid rgba(255,255,255,0.35) !important;
    box-shadow: 0 10px 24px rgba(0,0,0,0.25) !important;
  }
  .student-page .dashboard-home-btn {
    background: rgba(255,255,255,0.18) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    backdrop-filter: blur(8px);
    border-radius: 12px !important;
    font-weight: 700 !important;
    transition: all 0.2s ease !important;
  }
  .student-page .dashboard-home-btn:hover {
    background: rgba(255,255,255,0.28) !important;
    transform: translateY(-1px);
  }

  /* Summary cards: colorful gradient backgrounds */
  .student-page .summary-strip {
    margin: 0 1rem 1rem !important;
    gap: 1rem !important;
  }
  .student-page .summary-card {
    background: #ffffff !important;
    border: none !important;
    border-radius: 24px !important;
    padding: 1.5rem 1.6rem !important;
    box-shadow: 0 12px 30px rgba(41, 65, 109, 0.10), 0 2px 4px rgba(41, 65, 109, 0.04) !important;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease !important;
    color: #ffffff !important;
  }
  .student-page .summary-card * { color: #ffffff !important; }
  .student-page .summary-card.card-green,
  .student-page .summary-card.completed { background: linear-gradient(135deg, #29416d 0%, #1d3156 100%) !important; }
  .student-page .summary-card.card-yellow,
  .student-page .summary-card.pending  { background: linear-gradient(135deg, #f4c542 0%, #ea8300 100%) !important; }
  .student-page .summary-card.card-orange,
  .student-page .summary-card.points   { background: linear-gradient(135deg, #cf296d 0%, #ea8300 100%) !important; }
  .student-page .summary-card.card-blue   { background: linear-gradient(135deg, #29416d 0%, #cf296d 100%) !important; }
  .student-page .summary-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%);
    border-radius: 50%;
    pointer-events: none;
  }
  .student-page .summary-card { border-left: none !important; }
  .student-page .summary-card:hover {
    transform: translateY(-6px) scale(1.02) !important;
    box-shadow: 0 22px 45px rgba(41, 65, 109, 0.20), 0 5px 12px rgba(207, 41, 109, 0.12) !important;
  }

  /* Section headings */
  .student-page .section-title,
  .student-page .panel-title,
  .student-page h2 {
    font-family: 'Sora', 'Nunito', sans-serif !important;
    color: #29416d !important;
    font-weight: 800 !important;
    letter-spacing: -0.2px !important;
  }

  /* Activity catalog cards */
  .student-page .catalog-grid {
    padding: 0 1rem 1rem !important;
    gap: 1.25rem !important;
  }
  .student-page .library-item {
    background: #ffffff !important;
    border-radius: 22px !important;
    border: 1px solid rgba(41, 65, 109, 0.06) !important;
    box-shadow: 0 8px 22px rgba(41, 65, 109, 0.07), 0 1px 3px rgba(41, 65, 109, 0.04) !important;
    position: relative;
    transition: transform 0.28s ease, box-shadow 0.28s ease !important;
  }
  .student-page .library-item::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #cf296d, #ea8300, #f4c542);
    opacity: 0.85;
    border-radius: 22px 22px 0 0;
  }
  .student-page .library-item[role="button"]:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 22px 42px rgba(41, 65, 109, 0.16), 0 5px 12px rgba(207, 41, 109, 0.10) !important;
  }
  .student-page .library-item.locked {
    opacity: 0.65;
    filter: saturate(0.6);
  }
  .student-page .library-item.locked::before {
    background: linear-gradient(90deg, #94a3b8, #64748b) !important;
  }

  /* Status pills */
  .student-page .status-pill {
    border-radius: 999px !important;
    padding: 4px 12px !important;
    font-weight: 700 !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.2px !important;
  }
  .student-page .status-pill.completed {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0) !important;
    color: #065f46 !important;
  }
  .student-page .status-pill.pending {
    background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
    color: #92400e !important;
  }
  .student-page .status-pill.rejected {
    background: linear-gradient(135deg, #fecaca, #fca5a5) !important;
    color: #991b1b !important;
  }

  /* Panel/Widget cards softer */
  .student-page .panel-card,
  .student-page .section-card,
  .student-page .widget-card {
    background: #ffffff !important;
    border-radius: 22px !important;
  }

  /* Buttons inside cards */
  .student-page .btn-primary,
  .student-page button.btn-primary {
    background: linear-gradient(135deg, #cf296d 0%, #ea8300 100%) !important;
    border: none !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    border-radius: 12px !important;
    box-shadow: 0 6px 16px rgba(207, 41, 109, 0.25) !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  }
  .student-page .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(207, 41, 109, 0.35) !important;
  }

  /* Mobile spacing */
  @media (max-width: 767px) {
    .student-page .workspace-bar { margin: 0.5rem !important; padding: 1.1rem 1.2rem !important; border-radius: 18px !important; }
    .student-page .workspace-title { font-size: 1.3rem !important; }
    .student-page .summary-strip { margin: 0 0.5rem 0.75rem !important; gap: 0.75rem !important; }
    .student-page .catalog-grid { padding: 0 0.5rem 0.75rem !important; gap: 0.75rem !important; }
  }

  /* Leaderboard styles */
  .student-page .leaderboard-card {
    padding: 1.5rem !important;
  }
  .student-page .lb-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border-radius: 12px;
    background: #f8fafc;
    margin-bottom: 0.5rem;
    border: 1px solid #f1f5f9;
    transition: transform 0.2s;
  }
  .student-page .lb-item:hover {
    transform: translateX(4px);
    background: #f1f5f9;
  }
  .student-page .lb-item.is-me {
    background: linear-gradient(to right, rgba(207, 41, 109, 0.05), transparent);
    border-left: 3px solid #cf296d;
    border-color: rgba(207, 41, 109, 0.1);
  }
  .student-page .lb-rank {
    width: 28px;
    font-weight: 800;
    font-size: 1.1rem;
    color: #94a3b8;
    text-align: center;
  }
  .student-page .lb-rank.gold { color: #f59e0b; font-size: 1.3rem; }
  .student-page .lb-rank.silver { color: #94a3b8; font-size: 1.2rem; }
  .student-page .lb-rank.bronze { color: #b45309; font-size: 1.1rem; }
  
  .student-page .lb-avatar {
    width: 40px; height: 40px; border-radius: 10px; object-fit: cover;
  }
  .student-page .lb-info {
    flex: 1; min-width: 0;
  }
  .student-page .lb-name {
    font-weight: 700; color: #1e293b; font-size: 0.95rem; margin: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .student-page .lb-school {
    font-size: 0.75rem; color: #64748b; margin: 0;
  }
  .student-page .lb-points {
    font-weight: 800; color: #ea8300; font-size: 1rem;
    background: rgba(234, 131, 0, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 8px;
  }

  .mobile-bottom-actions {
    display: none;
  }
  @media (max-width: 760px) {
    .sidebar-chip-actions {
      display: none !important;
    }
    /* The bar fixed to the bottom of the screen is the whole navigation on a
       phone -- all four sections plus Logout. Repeating any of it up here just
       spends the top of the screen saying the same thing twice, which is what
       left Logout showing in two places. So the sidebar keeps only identity:
       avatar, name, school. */
    .student-page .sidebar-nav,
    .student-page .sidebar-logout-btn {
      display: none !important;
    }
    .dashboard-main {
      padding-bottom: 74px !important;
    }
    .mobile-bottom-actions {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      border-top: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 -4px 12px rgba(30,45,90,0.08);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding: 10px 10px calc(10px + env(safe-area-inset-bottom)) 10px;
    }
    .mobile-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .mobile-action-btn i {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 2px;
      padding: 6px;
      border-radius: 10px;
      background: #f1f5f9;
    }
    .mobile-action-btn.logout i {
      color: #ffffff;
      background: #dc2626;
    }
  }

</style>

<div class="student-page">
  <div id="studentDashboardView" class="dashboard-shell d-none">
    <aside class="sidebar-panel">
      <!-- Profile at top -->
      <div class="sidebar-profile-top">
        <div class="sidebar-brand-art" id="studentAvatarClickArea" title="Click to change photo" role="button" tabindex="0" style="position:relative; cursor:pointer; overflow:visible;">
          <img id="studentProfilePreview" src="/kidba_assets/img/3d_student.png" alt="Student profile" style="border-radius:50%; width:100%; height:100%; object-fit:cover;">
          <div class="sidebar-cam-badge"><i class="fas fa-camera"></i></div>
          <input id="studentProfileFileInput" type="file" accept="image/*" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10;">
        </div>
        <span class="sidebar-title" id="sidebarProfileName">Student Name</span>
        <span class="sidebar-school" id="sidebarSchoolName"></span>
      </div>

      <!-- Nav items -->
      <ul class="sidebar-nav">
        <li class="active" data-section="overview" role="button" tabindex="0"><span class="nav-badge overview"><i class="fas fa-chart-pie"></i></span><span>Overview</span></li>
        <li data-section="books" role="button" tabindex="0"><span class="nav-badge books"><i class="fas fa-book-open"></i></span><span>Books</span></li>
        <li data-section="progress" role="button" tabindex="0"><span class="nav-badge progress"><i class="fas fa-star"></i></span><span>Progress</span></li>
        <li data-section="rankings" role="button" tabindex="0"><span class="nav-badge reports"><i class="fas fa-medal"></i></span><span>Rankings</span></li>
      </ul>

      <!-- Red Logout button at bottom -->
      <button class="sidebar-logout-btn" type="button" onclick="logoutStudent()">
        <i class="fas fa-sign-out-alt"></i>
        <span>LOGOUT</span>
      </button>
    </aside>

    <div class="dashboard-main">

      <div id="championsBoard" class="champions-board" style="display:none">
        <div class="champions-header">
          <h3>🏆 Champions Board</h3>
          <p>Top 3 learners win exclusive gifts from Imaan & Akhlaq!</p>
        </div>
        <div id="championsPodium" class="champions-podium">
          <div class="champions-loading"><i class="fas fa-spinner fa-spin"></i> Loading champions...</div>
        </div>
        <div class="champions-gift-banner">
          <p><span class="gift-icon">🎁</span> Top 3 champions will receive <strong>exclusive gifts</strong> from Imaan & Akhlaq! Keep earning points to claim your spot!</p>
        </div>
      </div>

      <!-- The "School Dashboard" banner that used to sit here is gone. It
           spent a full-width card on the school name plus a Home button that
           duplicated the one in the bottom bar. The school name now sits under
           the student's name in the sidebar; see #sidebarSchoolName. -->

      <div class="summary-strip" id="studentOverviewSection">
        <div class="summary-card points" data-section="books" role="button" tabindex="0">
          <div class="summary-copy">
            <span class="summary-label">Total Points</span>
            <strong class="summary-value" id="starsValue">0</strong>
            <span class="summary-meta">Use 50 points to unlock the next chapter in your sequence.</span>
          </div>
          <img src="/kidba_assets/img/3d_individual.png" alt="Points 3D icon">
        </div>

        <div class="summary-card completed" data-section="progress" role="button" tabindex="0">
          <div class="summary-copy">
            <span class="summary-label">Chapters Completed</span>
            <strong class="summary-value" id="studentCompletedCount">0</strong>
            <span class="summary-meta">Activities submitted by you across the learning journey.</span>
          </div>
          <img src="/kidba_assets/img/3d_student.png" alt="Completed 3D icon">
        </div>

        <div class="summary-card pending" data-section="progress" role="button" tabindex="0">
          <div class="summary-copy">
            <span class="summary-label">Pending Review</span>
            <strong class="summary-value" id="studentPendingReviewCount">0</strong>
            <span class="summary-meta">Submitted chapters still moving through approval.</span>
          </div>
          <img src="/kidba_assets/img/3d_login.png" alt="Pending review 3D icon">
        </div>
      </div>

      <div class="student-grid">
        <section class="surface-card" id="studentBooksSection">
          <div class="section-header">
            <div class="section-heading">
              <div class="section-asset"><img src="/kidba_assets/img/3d_school.png" alt="Book library 3D icon"></div>
              <div>
                <h3>Book Library</h3>
                <p>Choose a title to browse chapters, continue tasks and unlock the next step in your path.</p>
              </div>
            </div>
          </div>

          <div class="toolbar-block">
            <div class="toolbar-info">

              <h3 id="currentBookTitle">Choose a Book</h3>
              <p id="currentBookSubtitle">Select a title to open its chapters and continue your learning journey.</p>
            </div>
            <button class="dashboard-ghost-btn d-none" id="backToBooksBtn" type="button"><i class="fas fa-arrow-left"></i><span>Back to Books</span></button>
          </div>

          <div id="activitiesRoot" class="catalog-grid">
            <div class="library-item skeleton-card"></div>
            <div class="library-item skeleton-card"></div>
            <div class="library-item skeleton-card"></div>
          </div>
        </section>

        <aside class="surface-card progress-card" id="studentProgressSection">
          <div class="section-header">
            <div class="section-heading">
              <div class="section-asset"><img src="/kidba_assets/img/3d_teacher.png" alt="Progress 3D icon"></div>
              <div>
                <h3>Journey Status</h3>
                <p>See what is unlocked, what is approved and where your next review step is waiting.</p>
              </div>
            </div>
          </div>

          <div class="journey-stack">
            <div class="journey-item">
              <span class="journey-icon unlocked"><i class="fas fa-unlock"></i></span>
              <div class="journey-copy">
                <strong>Unlocked Access</strong>
                <span>Chapters currently open in your sequence.</span>
              </div>
              <span class="journey-value" id="studentUnlockedCount">0</span>
            </div>

            <div class="journey-item">
              <span class="journey-icon approved"><i class="fas fa-check-double"></i></span>
              <div class="journey-copy">
                <strong>Teacher Approved</strong>
                <span>Chapters fully approved and counted in your progress.</span>
              </div>
              <span class="journey-value" id="studentApprovedCount">0</span>
            </div>

            <div class="journey-item" id="studentPendingParentRow">
              <span class="journey-icon parent"><i class="fas fa-house-user"></i></span>
              <div class="journey-copy">
                <strong>Waiting For Parent</strong>
                <span>Completed chapters still needing family review.</span>
              </div>
              <span class="journey-value" id="studentPendingParentCount">0</span>
            </div>

            <div class="journey-item" id="studentPendingTeacherRow">
              <span class="journey-icon teacher"><i class="fas fa-user-check"></i></span>
              <div class="journey-copy">
                <strong>Waiting For Teacher</strong>
                <span>Parent-cleared chapters still awaiting teacher approval.</span>
              </div>
              <span class="journey-value" id="studentPendingTeacherCount">0</span>
            </div>
          </div>

          <div class="journey-note" id="studentJourneyStatus">Complete a chapter task to keep your next unlock moving forward.</div>
        </aside>

        <section class="surface-card leaderboard-card d-none" id="studentRankingsSection">
          <div class="section-header">
            <div class="section-heading">
              <div class="section-asset"><img src="/kidba_assets/img/3d_teacher.png" alt="Leaderboard 3D icon"></div>
              <div>
                <h3>Global Rankings</h3>
                <p>Top 30 performing learners globally. Keep learning to climb the leaderboard!</p>
              </div>
            </div>
            <span class="section-chip"><i class="fas fa-globe"></i> Global Top 30</span>
          </div>
          <div id="globalLeaderboardList" style="margin-top: 1rem;">
            <div style="text-align: center; color: #64748b; padding: 2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
          </div>
        </section>
      </div>

      <div id="errorState" class="surface-card error-card d-none">
        <i class="fas fa-exclamation-triangle fa-3x" style="color:#ea8300;"></i>
        <h3>We could not load your dashboard</h3>
        <p>Please refresh the page or try again in a moment.</p>
        <p id="errorDetailsText"></p>
        <button class="dashboard-ghost-btn" type="button" onclick="location.reload()"><i class="fas fa-rotate-right"></i><span>Try Again</span></button>
      </div>
    </div>
    
    <!-- On phones this bar is the only navigation: the sidebar list is hidden
         below 760px. It therefore has to carry all four sections. Overview and
         Rankings were previously reachable only from that hidden list, so
         dropping the list without adding them here would have stranded the
         Champions Board with no way to open it.
         The old Home button is gone: it pointed at auth.html, which bounces a
         signed-in student straight back here, and it duplicated the Home in
         the school banner that this change removes. -->
    <div class="mobile-bottom-actions">
      <button class="mobile-action-btn" type="button" onclick="window.switchStudentSection('overview', false)">
        <i class="fas fa-chart-pie"></i>
        <span>Overview</span>
      </button>
      <button class="mobile-action-btn" type="button" onclick="window.switchStudentSection('books', false)">
        <i class="fas fa-book-open"></i>
        <span>Books</span>
      </button>
      <button class="mobile-action-btn" type="button" onclick="window.switchStudentSection('progress', false)">
        <i class="fas fa-star"></i>
        <span>Progress</span>
      </button>
      <button class="mobile-action-btn" type="button" onclick="window.switchStudentSection('rankings', false)">
        <i class="fas fa-medal"></i>
        <span>Rankings</span>
      </button>

      <button class="mobile-action-btn logout" type="button" onclick="window.logoutStudent()">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, updateDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
  import { getDoc as _getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Enable Firestore offline persistence for faster initial loading
  enableIndexedDbPersistence(db).catch(function(err) {
    if (err.code == 'failed-precondition') {
      console.warn('[Student Dashboard] Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('[Student Dashboard] The current browser does not support all of the features required to enable persistence');
    }
  });

  // Force persistent login (survives browser idle, refresh, tab close).
  // Try IndexedDB first (more reliable in some browsers), fallback to localStorage.
  setPersistence(auth, indexedDBLocalPersistence).catch(function () {
    return setPersistence(auth, browserLocalPersistence);
  }).catch(function (e) {
    console.warn('[Student Dashboard] Could not set auth persistence:', e && e.message);
  });

  const root = document.getElementById('activitiesRoot');
  const errorS = document.getElementById('errorState');
  const errorDetailsText = document.getElementById('errorDetailsText');
  const studentDashboardView = document.getElementById('studentDashboardView');
  const stars = document.getElementById('starsValue');
  const studentCompletedCount = document.getElementById('studentCompletedCount');
  const studentPendingReviewCount = document.getElementById('studentPendingReviewCount');
  const studentUnlockedCount = document.getElementById('studentUnlockedCount');
  const studentApprovedCount = document.getElementById('studentApprovedCount');
  const studentPendingParentCount = document.getElementById('studentPendingParentCount');
  const studentPendingTeacherCount = document.getElementById('studentPendingTeacherCount');
  const studentJourneyStatus = document.getElementById('studentJourneyStatus');
  const studentSchoolTag = document.getElementById('studentSchoolTag');
  const studentJourneyNote = document.getElementById('studentJourneyNote');
  const studentProfilePreview = document.getElementById('studentProfilePreview');
  const studentProfileMeta = document.getElementById('studentProfileMeta');
  const studentProfileAvatarTrigger = document.getElementById('studentAvatarClickArea');
  const studentProfileUploadBtn = document.getElementById('studentProfileManageBtn');
  const studentProfileFileInput = document.getElementById('studentProfileFileInput');
  const studentPendingParentRow = document.getElementById('studentPendingParentRow');
  const studentPendingTeacherRow = document.getElementById('studentPendingTeacherRow');
  const currentBookTitle = document.getElementById('currentBookTitle');
  const currentBookSubtitle = document.getElementById('currentBookSubtitle');

  const backToBooksBtn = document.getElementById('backToBooksBtn');

  let apiData = {};
  let currentStudent = null;
  let currentBookContext = null;
  let currentStudentSection = 'overview';
  let gameState = { points: 50, unlockedCount: 1, completed: [], parent_approved: [], teacher_approved: [] };

  const ALL_BOOKS = [
    { id: 'book1', title: 'Imaan & Akhlaaq - Book 1', cover: '/assets/covers/book1.jpg' },
    { id: 'book2', title: 'Imaan & Akhlaaq - Book 2', cover: '/assets/covers/book2.jpg' },
    { id: 'book3', title: 'Imaan & Akhlaaq - Book 3', cover: '/assets/covers/book3.jpg' },
    { id: 'book4', title: 'Imaan & Akhlaaq - Book 4', cover: '/assets/covers/book4.jpg' },
    { id: 'book5', title: 'Imaan & Akhlaaq - Book 5', cover: '/assets/covers/book5.jpg' },
    { id: 'book6', title: 'Imaan & Akhlaaq - Book 6', cover: '/assets/covers/book6.jpg' },
    { id: 'book7', title: 'Imaan & Akhlaaq - Book 7', cover: '/assets/covers/book7.jpg' }
  ];

  function showAccessOverlay(title, message) {
    if (document.getElementById('demoOverlay')) return;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">' +
        '<div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:420px; box-shadow:0 20px 40px rgba(0,0,0,0.3);">' +
          '<i class="fas fa-lock" style="font-size:3rem; color:#D63678; margin-bottom:20px;"></i>' +
          '<h3 style="font-family:Sora,sans-serif; color:#1E2D5A; margin:0 0 12px;">' + title + '</h3>' +
          '<p style="color:#64748b; margin-bottom:25px; font-weight:700; line-height:1.5;">' + message + '</p>' +
          '<button onclick="window.location.href=&quot;/auth&quot;" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">Go to Login</button>' +
        '</div>' +
      '</div>'
    );
  }

  function buildAvatarUrl(name) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'Student') + '&background=243d6b&color=fff';
  }

  function getLearnerTrackText() {
    if (!currentStudent) return 'Student dashboard';
    if (currentStudent.role === 'individual') return 'Independent learner';
    if (currentStudent.class_id) return 'Class ' + currentStudent.class_id + ' learner';
    return 'School learner';
  }

  function getProfileMetaText() {
    if (!currentStudent) return 'Tap the camera to update your dashboard photo.';
    return getLearnerTrackText() + ' - tap the camera to update your dashboard photo.';
  }

  function getCurrentPhotoUrl() {
    if (currentStudent && currentStudent.photoURL) return currentStudent.photoURL;
    return buildAvatarUrl(currentStudent && currentStudent.name ? currentStudent.name : 'Student');
  }

  function hydrateStudentHeader() {
    if (!currentStudent) return;

    const studentName = currentStudent.name || 'Student';
    const isIndividual = currentStudent.role === 'individual';
    const photoUrl = getCurrentPhotoUrl();

    // Class name logic
    let classLabel = '';
    if (isIndividual) {
      classLabel = 'Independent Learner';
    } else {
      let rawClass = String(currentStudent.class_name || currentStudent.class_id || '').trim();
      if (rawClass) {
        // Remove repeated "Class " words (e.g., "Class Class 2" -> "2")
        rawClass = rawClass.replace(/^(class\s*)+/ig, '').trim();
        // If it was just "Class", default to "Student"
        if (!rawClass) {
          classLabel = 'Student';
        } else {
          // Prepend "Class " unless it already has a rank word
          if (!/^(grade|year|level)\b/i.test(rawClass)) {
            classLabel = 'Class ' + rawClass;
          } else {
            classLabel = rawClass;
          }
        }
      } else {
        classLabel = 'Student';
      }
    }

    // The school name now lives under the student's name in the sidebar,
    // where the removed "School Dashboard" banner used to carry it. Guarded,
    // unlike the old line, which assumed its element always existed.
    const schoolNameText = currentStudent.school_name || (isIndividual ? 'Imaan & Akhlaq Academy' : 'Your School');
    const sidebarSchoolName = document.getElementById('sidebarSchoolName');
    if (sidebarSchoolName) sidebarSchoolName.textContent = schoolNameText;

    if (studentProfileMeta) studentProfileMeta.textContent = classLabel;
    if (studentProfilePreview) {
      studentProfilePreview.src = photoUrl;
      studentProfilePreview.alt = studentName + ' profile photo';
    }

    // Update sidebar with student name and class
    const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
    const sidebarName = document.getElementById('sidebarProfileName');
    const sidebarMeta = document.getElementById('sidebarProfileMeta');
    if (sidebarPhoto) { sidebarPhoto.src = photoUrl; sidebarPhoto.alt = studentName; }
    if (sidebarName) sidebarName.textContent = studentName;
    if (sidebarMeta) sidebarMeta.textContent = classLabel;

    if (studentSchoolTag) {
      studentSchoolTag.innerHTML = isIndividual
        ? '<i class="fas fa-house"></i> Individual Learning Track'
        : '<i class="fas fa-graduation-cap"></i> Student Dashboard';
    }
    if (studentJourneyNote) {
      studentJourneyNote.textContent = isIndividual
        ? 'Independent learner mode is active. Complete tasks to unlock your next chapter.'
        : 'Track your books, unlock chapters and keep your progress moving.';
    }
  }

  function getAllChaptersInOrder() {
    const chapters = [];
    let absoluteOrderCounter = 1;

    ALL_BOOKS.forEach((book) => {
      if (apiData[book.id] && apiData[book.id].chapters) {
        let localOrder = 1;
        // Sort chapter keys numerically (chapter1, chapter2, ..., chapter10, chapter15)
        const sortedKeys = Object.keys(apiData[book.id].chapters).sort((a, b) => {
          const numA = parseInt(a.replace('chapter', ''), 10) || 0;
          const numB = parseInt(b.replace('chapter', ''), 10) || 0;
          return numA - numB;
        });
        sortedKeys.forEach((chapterKey) => {
          const chapterData = apiData[book.id].chapters[chapterKey];
          chapters.push({
            bId: book.id,
            cId: chapterKey,
            title: chapterData.title,
            stateId: chapterData.id || chapterKey,
            globalOrder: absoluteOrderCounter,
            bookOrder: localOrder
          });
          absoluteOrderCounter++;
          localOrder++;
        });
      }
    });

    return chapters;
  }

  function updateDashboardMetrics() {
    const allChapters = getAllChaptersInOrder();
    const totalChapters = allChapters.length;
    const completedCount = (gameState.completed || []).length;
    const parentApprovedCount = (gameState.parent_approved || []).length;
    const teacherApprovedCount = (gameState.teacher_approved || []).length;
    const pendingParentCount = Math.max(completedCount - parentApprovedCount, 0);
    const pendingTeacherCount = Math.max(parentApprovedCount - teacherApprovedCount, 0);
    const pendingReviewCount = Math.max(completedCount - teacherApprovedCount, 0);
    const unlockedCount = totalChapters > 0 ? Math.min(gameState.unlockedCount || 1, totalChapters) : 0;
    const availablePoints = gameState.points || 0;

    stars.textContent = String(availablePoints);
    studentCompletedCount.textContent = String(completedCount);
    studentPendingReviewCount.textContent = String(pendingReviewCount);
    studentUnlockedCount.textContent = String(unlockedCount);
    studentApprovedCount.textContent = String(teacherApprovedCount);
    studentPendingParentCount.textContent = String(pendingParentCount);
    studentPendingTeacherCount.textContent = String(pendingTeacherCount);

    if (studentPendingParentRow) {
      studentPendingParentRow.classList.toggle('d-none', pendingParentCount === 0);
    }

    if (studentPendingTeacherRow) {
      studentPendingTeacherRow.classList.toggle('d-none', pendingTeacherCount === 0);
    }

    if (totalChapters === 0) {
      studentJourneyStatus.textContent = 'Books are loading. Your next chapter path will appear here shortly.';
      return;
    }

    if (unlockedCount >= totalChapters) {
      studentJourneyStatus.textContent = teacherApprovedCount >= totalChapters
        ? 'All current chapters are completed and approved. Great work keeping your journey clean.'
        : 'All currently available chapters are unlocked. Keep clearing reviews to stay ahead.';
      return;
    }

    if (availablePoints >= 50) {
      studentJourneyStatus.textContent = 'You already have enough points to unlock the next chapter in sequence.';
      return;
    }

    studentJourneyStatus.textContent = 'Earn ' + (50 - availablePoints) + ' more points to unlock your next chapter.';
  }

  function getStudentSectionTarget(section) {
    const topSection = document.getElementById('studentTopSection');
    const overviewSection = document.getElementById('studentOverviewSection');
    const booksSection = document.getElementById('studentBooksSection');
    const progressSection = document.getElementById('studentProgressSection');

    const studentRankingsSection = document.getElementById('studentRankingsSection');

    if (section === 'books') return booksSection || topSection;
    if (section === 'progress') return progressSection || topSection;
    if (section === 'rankings') return studentRankingsSection || topSection;
    return overviewSection || topSection;
  }

  function bindStudentSectionControls() {
    document.querySelectorAll('.sidebar-nav li[data-section], .summary-card[data-section]').forEach((control) => {
      if (control.dataset.sectionBound === 'true') return;

      control.dataset.sectionBound = 'true';
      control.addEventListener('click', () => window.switchStudentSection(control.dataset.section));
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.switchStudentSection(control.dataset.section);
        }
      });
    });
  }

  // Define global ranking function
  let leaderboardLoaded = false;
  // Shared cache so Champions + Leaderboard don't duplicate Firebase queries
  let _rankingCache = null;
  // Reads /public_scores, not /users. A student is not allowed to list other
  // people's user docs — those carry phone, email and invitation_code — so the
  // old two-query-on-users version always failed with permission-denied. The
  // mirrorPublicScore Cloud Function keeps this collection in sync with the
  // handful of fields the board renders.
  async function fetchRankingData() {
    if (_rankingCache) return _rankingCache;
    const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    const scoresRef = collection(db, 'public_scores');
    const snap = await getDocs(query(scoresRef, orderBy('points', 'desc'), limit(30)));
    const all = [];
    snap.forEach(d => {
      const s = d.data();
      // Keep the shape the board callers already expect.
      all.push({
        id: d.id,
        name: s.name,
        photoURL: s.photoURL,
        role: s.role,
        school_name: s.school_name,
        game_state: { points: s.points || 0 }
      });
    });
    _rankingCache = all;
    return _rankingCache;
  }

  async function loadChampionsBoard() {
    const board = document.getElementById('championsBoard');
    const podium = document.getElementById('championsPodium');
    if (!board || !podium) return;
    try {
      const all = (await fetchRankingData()).slice(0, 3);
      if (all.length === 0) { board.style.display = 'none'; return; }
      const crowns = ['👑', '', ''];
      let html = '';
      all.forEach((u, i) => {
        const rank = i + 1;
        const pts = u.game_state && u.game_state.points ? u.game_state.points : 0;
        const avatar = u.photoURL || buildAvatarUrl(u.name);
        const name = u.name || 'Learner';
        const isMe = currentStudent && u.id === currentStudent.uid;
        html += '<div class="podium-slot rank-' + rank + '">' +
          '<div class="podium-avatar-wrap">' +
            (rank === 1 ? '<span class="podium-crown">' + crowns[0] + '</span>' : '') +
            '<img class="podium-avatar" src="' + escapeHtml(avatar) + '" alt="">' +
            '<span class="podium-badge">' + rank + '</span>' +
          '</div>' +
          '<div class="podium-name">' + escapeHtml(name) + (isMe ? ' (You)' : '') + '</div>' +
          '<div class="podium-xp">' + pts + ' XP</div>' +
          '<div class="podium-bar"></div>' +
        '</div>';
      });
      podium.innerHTML = html;
      board.style.display = 'block';
    } catch(e) {
      console.error('Champions board error:', e);
      board.style.display = 'none';
    }
  }

  async function loadGlobalRankings() {
    if (leaderboardLoaded) return;
    const listEl = document.getElementById('globalLeaderboardList');
    if (!listEl) return;
    try {
      const combined = await fetchRankingData();

      let lbHtml = '';
      let myRankHTML = '';
      let meInTop30 = false;

      combined.forEach((user, idx) => {
        const rank = idx + 1;
        let rankClass = '';
        let rankIcon = rank;
        if (rank === 1) { rankClass = 'gold'; rankIcon = '<i class="fas fa-crown"></i>'; }
        else if (rank === 2) { rankClass = 'silver'; rankIcon = '<i class="fas fa-medal"></i>'; }
        else if (rank === 3) { rankClass = 'bronze'; rankIcon = '<i class="fas fa-award"></i>'; }

        const isMe = user.id === currentStudent?.uid;
        if (isMe) meInTop30 = true;
        
        const avatar = user.photoURL || buildAvatarUrl(user.name);
        // Show full name
        const displayName = user.name || 'Anonymous Learner';
        const schoolName = user.role === 'individual' ? 'Independent Learner' : (user.school_name || 'School Learner');
        const userPoints = user.game_state && user.game_state.points ? user.game_state.points : 0;

        lbHtml += \`
          <div class="lb-item \${isMe ? 'is-me' : ''}">
            <div class="lb-rank \${rankClass}">\${rankIcon}</div>
            <img class="lb-avatar" src="\${escapeHtml(avatar)}" alt="Avatar">
            <div class="lb-info">
              <p class="lb-name">\${escapeHtml(displayName)}\${isMe ? ' (You)' : ''}</p>
              <p class="lb-school">\${escapeHtml(schoolName)}</p>
            </div>
            <div class="lb-points">\${userPoints} XP</div>
          </div>
        \`;
      });
      
      if (!meInTop30 && currentStudent) {
        myRankHTML = \`
          <div style="border-top: 2px dashed #e2e8f0; margin-top: 1rem; padding-top: 1rem;">
            <div class="lb-item is-me">
              <div class="lb-rank" style="font-size:0.9rem;">--</div>
              <img class="lb-avatar" src="\${escapeHtml(getCurrentPhotoUrl())}" alt="Avatar">
              <div class="lb-info">
                <p class="lb-name">\${escapeHtml(currentStudent.name || 'You')} (You)</p>
                <p class="lb-school">\${escapeHtml(currentStudent.role === 'individual' ? 'Independent Learner' : (currentStudent.school_name || 'School Learner'))}</p>
              </div>
              <div class="lb-points">\${gameState.points || 0} XP</div>
            </div>
          </div>
        \`;
      }

      if (combined.length === 0) {
        lbHtml = '<div style="text-align:center; color:#64748b; padding:2rem;">No rankings available yet.</div>';
      }

      listEl.innerHTML = lbHtml + myRankHTML;
      leaderboardLoaded = true;
    } catch (e) {
      console.error('Error loading leaderboard:', e);
      listEl.innerHTML = '<div style="text-align:center; color:#ef4444; padding:2rem;">Failed to load rankings.</div>';
    }
  }

  window.switchStudentSection = (section, shouldScroll = true) => {
    const nextSection = ['overview', 'books', 'progress', 'rankings'].includes(section) ? section : 'overview';
    currentStudentSection = nextSection;

    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((item) => {
      item.classList.toggle('active', item.dataset.section === nextSection);
    });

    document.querySelectorAll('.summary-card[data-section]').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.section === nextSection);
    });

    if (nextSection === 'rankings') loadGlobalRankings();

    const target = getStudentSectionTarget(nextSection);
    if (shouldScroll && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  bindStudentSectionControls();

  function makeInteractiveCard(element, handler) {
    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    element.addEventListener('click', handler);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    });
  }

  function getIcon(title) {
    const lower = title.toLowerCase();
    if (lower.includes('farm') || lower.includes('sister')) return 'fa-seedling';
    if (lower.includes('burger') || lower.includes('food')) return 'fa-utensils';
    if (lower.includes('goodbye') || lower.includes('begin')) return 'fa-door-open';
    if (lower.includes('truthful') || lower.includes('honest')) return 'fa-shield-halved';
    if (lower.includes('patience') || lower.includes('sabr')) return 'fa-hourglass-half';
    if (lower.includes('caring') || lower.includes('heart') || lower.includes('love')) return 'fa-heart';
    if (lower.includes('truth') || lower.includes('trust')) return 'fa-scale-balanced';
    if (lower.includes('safe') || lower.includes('people') || lower.includes('protect')) return 'fa-user-shield';
    if (lower.includes('prayer') || lower.includes('salah') || lower.includes('dua')) return 'fa-hands-praying';
    if (lower.includes('quran') || lower.includes('read')) return 'fa-book-quran';
    if (lower.includes('mosque') || lower.includes('masjid')) return 'fa-mosque';
    if (lower.includes('family') || lower.includes('parent')) return 'fa-people-roof';
    if (lower.includes('friend') || lower.includes('kind')) return 'fa-hand-holding-heart';
    if (lower.includes('clean') || lower.includes('wudu')) return 'fa-droplet';
    if (lower.includes('share') || lower.includes('give') || lower.includes('charity')) return 'fa-hand-holding-dollar';
    if (lower.includes('respect') || lower.includes('elder')) return 'fa-handshake';
    if (lower.includes('whisper') || lower.includes('shadow')) return 'fa-moon';
    if (lower.includes('giant') || lower.includes('brave') || lower.includes('courage')) return 'fa-star';
    return 'fa-book-open-reader';
  }

  function getIconGradient(order) {
    const gradients = [
      'linear-gradient(135deg, #243d6b 0%, #cf296d 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
      'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
      'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
    ];
    return gradients[(order - 1) % gradients.length];
  }

  function getAccentColor(order) {
    const colors = ['#cf296d','#6366f1','#ef4444','#10b981','#ec4899','#3b82f6','#f43f5e','#22c55e','#a855f7','#f97316'];
    return colors[(order - 1) % colors.length];
  }

  function renderBooks() {
    if (!root) return;

    currentBookContext = null;
    updateDashboardMetrics();
    errorS.classList.add('d-none');
    backToBooksBtn.classList.add('d-none');

    currentBookTitle.textContent = 'Choose a Book';
    currentBookSubtitle.textContent = 'Select a title to open its chapters and continue your learning journey.';
    root.classList.remove('chapter-mode');  // 4-col book grid
    root.innerHTML = '';

    const allChapters = getAllChaptersInOrder();
    const unlockedLimit = gameState.unlockedCount || 1;
    const fragment = document.createDocumentFragment();

    ALL_BOOKS.forEach((book) => {
      const bookChapters = allChapters.filter((chapter) => chapter.bId === book.id);
      const unlockedInBook = bookChapters.filter((chapter) => chapter.bookOrder === 1 || chapter.cId === 'chapter1' || chapter.globalOrder <= unlockedLimit).length;

      const card = document.createElement('div');
      card.className = 'library-item';
      makeInteractiveCard(card, () => showChapters(book.id, book.title));
      card.innerHTML =
        '<div class="library-cover"><img src="' + book.cover + '" alt="' + book.title + '" loading="lazy"></div>' +
        '<div class="library-body">' +
          '<div class="library-topline">' +
            '<span class="book-chip"><i class="fas fa-book"></i> ' + bookChapters.length + ' chapters</span>' +
            '<span class="book-chip muted"><i class="fas fa-lock"></i> ' + unlockedInBook + ' open</span>' +
          '</div>' +
          '<div class="library-title">' + book.title + '</div>' +
          '<div class="library-subtitle">Open this book to browse chapters available in your learning sequence.</div>' +
          '<div class="library-meta"><button class="lib-view-btn" type="button"><i class="fas fa-book-open"></i> View Chapters</button></div>' +
        '</div>';
      fragment.appendChild(card);
    });
    
    root.appendChild(fragment);
  }

  function showChapters(bookId, bookTitle) {
    currentBookContext = { bookId, bookTitle };
    updateDashboardMetrics();
    backToBooksBtn.classList.remove('d-none');

    currentBookTitle.textContent = bookTitle;
    currentBookSubtitle.textContent = 'Choose the next chapter to start, unlock or review.';
    root.classList.add('chapter-mode');  // 1-col chapter list
    root.innerHTML = '';

    const chapters = getAllChaptersInOrder().filter((chapter) => chapter.bId === bookId);

    if (chapters.length === 0) {
      root.innerHTML =
        '<div class="empty-state">' +
          '<i class="fas fa-book-medical fa-2x" style="color:#cf296d;"></i>' +
          '<h4>Coming Soon</h4>' +
          '<p>Chapters for this book are still being uploaded.</p>' +
        '</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    chapters.forEach((item) => {
      const order = item.globalOrder;
      const stateId = item.stateId;
      const isUnlocked = item.bookOrder === 1 || item.cId === 'chapter1' || order <= (gameState.unlockedCount || 1);
      const isCompleted = (gameState.completed || []).includes(stateId);
      const isParentApproved = (gameState.parent_approved || []).includes(stateId);
      const isTeacherApproved = (gameState.teacher_approved || []).includes(stateId);
      const chapterIcon = isUnlocked ? getIcon(item.title) : 'fa-lock';

      const card = document.createElement('div');
      card.className = 'library-item' + (!isUnlocked ? ' locked' : '');

      let subtitle = 'Open this chapter and continue the next step in your learning track.';
      let statusHtml = '';

      if (isUnlocked) {
        makeInteractiveCard(card, () => {
          window.location.href = 'activity.html?book=' + item.bId + '&chapter=' + item.cId;
        });

        if (isTeacherApproved) {
          statusHtml = '<span class="status-pill completed"><i class="fas fa-check-circle"></i> ' + (currentStudent.role === 'individual' ? 'Completed' : 'Approved') + '</span>';
          subtitle = 'This chapter is fully approved and locked into your completed progress.';
        } else if (isParentApproved) {
          statusHtml = '<span class="status-pill teacher"><i class="fas fa-user-check"></i> Pending Teacher</span>';
          subtitle = 'Your family review is done. This chapter is now waiting for teacher approval.';
        } else if (isCompleted) {
          statusHtml = '<span class="status-pill pending"><i class="fas fa-spinner fa-spin"></i> Pending Review</span>';
          subtitle = 'You have submitted this task. It is still moving through the approval flow.';
        } else {
          statusHtml = '<span class="status-pill ready"><i class="fas fa-play-circle"></i> Start Chapter</span>';
        }
      } else if (order === (gameState.unlockedCount || 1) + 1) {
        statusHtml = '<button class="unlock-btn" type="button" onclick="event.stopPropagation(); unlockNext(' + order + ')"><i class="fas fa-unlock"></i><span>Unlock for 50 Points</span></button>';
        subtitle = 'Use 50 points to unlock this chapter and move your sequence forward.';
      } else {
        statusHtml = '<span class="status-pill locked"><i class="fas fa-lock"></i> Locked</span>';
        subtitle = 'Complete earlier chapters first to make this chapter available.';
      }

      const iconBg = isUnlocked ? getIconGradient(order) : 'linear-gradient(135deg, #cbd5e1, #94a3b8)';
      const accentColor = isUnlocked ? getAccentColor(order) : '#94a3b8';

      card.style.position = 'relative';
      card.innerHTML =
        '<div class="chapter-accent" style="background:' + accentColor + '"></div>' +
        '<div class="chapter-card-row">' +
          '<div class="chapter-icon' + (isUnlocked ? '' : ' locked') + '" style="background:' + iconBg + '"><i class="fas ' + chapterIcon + '"></i></div>' +
          '<div class="chapter-text">' +
            '<span class="ch-kicker">Chapter ' + item.bookOrder + '</span>' +
            '<div class="ch-title">' + item.title + '</div>' +
          '</div>' +
          '<div class="chapter-action">' + statusHtml + '</div>' +
        '</div>';
      fragment.appendChild(card);
    });
    
    root.appendChild(fragment);
  }

  async function fetchActivitiesData() {
    try {
      // Use the imported JSON directly; no templating needed.
      const data = ${raw(JSON.stringify(activitiesData))};
      apiData = data.default || data;
      renderBooks();
    } catch (err) {
      console.error('Failed to load activities data:', err);
      if (root) root.innerHTML = '';
      if (errorDetailsText) errorDetailsText.textContent = err && err.message ? err.message : 'Unknown loading error';
      if (errorS) errorS.classList.remove('d-none');
    }
  }

  async function uploadStudentProfile(file) {
    if (!currentStudent) return;

    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      return;
    }

    if (studentProfileUploadBtn) {
      studentProfileUploadBtn.disabled = true;
      studentProfileUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Uploading...</span>';
    }
    if (studentProfileMeta) studentProfileMeta.textContent = 'Uploading your profile photo...';

    try {
      const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const scope = currentStudent.school_id ? 'schools/' + currentStudent.school_id : 'independent';
      const storageRef = ref(storage, scope + '/users/' + currentStudent.uid + '/profile-' + Date.now() + '.' + extension);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentStudent.uid), { photoURL: downloadURL });
      currentStudent.photoURL = downloadURL;
      if (studentProfilePreview) studentProfilePreview.src = downloadURL;
      const sidebarPhotoEl = document.getElementById('sidebarProfilePhoto');
      if (sidebarPhotoEl) sidebarPhotoEl.src = downloadURL;
      if (studentProfileMeta) studentProfileMeta.textContent = getLearnerTrackText() + ' - profile photo updated successfully.';

      try {
        const cachedUser = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
        if (cachedUser && cachedUser.uid === currentStudent.uid) {
          cachedUser.photoURL = downloadURL;
          sessionStorage.setItem('auth_user', JSON.stringify(cachedUser));
        }
      } catch (sessionError) {
        console.error('Session cache update failed:', sessionError);
      }
    } catch (uploadError) {
      console.error('Profile upload error:', uploadError);
      if (studentProfileMeta) studentProfileMeta.textContent = 'Upload failed. Please try again.';
      alert('There was an issue uploading the profile photo.');
    }

    if (studentProfileUploadBtn) {
      studentProfileUploadBtn.disabled = false;
      studentProfileUploadBtn.innerHTML = '<i class="fas fa-camera"></i><span>Change Photo</span>';
    }
  }

  if (backToBooksBtn) {
    backToBooksBtn.addEventListener('click', () => renderBooks());
  }

  // File input is now directly inside avatar div as transparent overlay
  // Direct user touch triggers file picker without needing programmatic .click()
  if (studentProfileFileInput) {
    studentProfileFileInput.addEventListener('change', async (event) => {
      const input = event.target;
      if (input.files && input.files[0]) {
        await uploadStudentProfile(input.files[0]);
        const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
        if (sidebarPhoto && currentStudent && currentStudent.photoURL) {
          sidebarPhoto.src = currentStudent.photoURL;
        }
        input.value = '';
      }
    });
  }

  window.unlockNext = async (num) => {
    if (!currentStudent) return;

    if ((gameState.points || 0) < 50) {
      alert('You need more points to unlock the next chapter.');
      return;
    }

    gameState.points -= 50;
    gameState.unlockedCount = num;

    try {
      await updateDoc(doc(db, 'users', currentStudent.uid), { game_state: gameState });
      updateDashboardMetrics();
      if (currentBookContext) {
        showChapters(currentBookContext.bookId, currentBookContext.bookTitle);
      } else {
        renderBooks();
      }
    } catch (err) {
      console.error(err);
      alert('There was an issue unlocking your chapter.');
    }
  };

  let hasInitializedDashboard = false;

  onAuthStateChanged(auth, async (user) => {
    // CRITICAL: never re-run on back-navigation. Firebase re-emits on every
    // WebView resume — we must ignore all calls after the first successful init.
    if (hasInitializedDashboard) return;

    if (!user) {
      // Don't show "login required" instantly — Firebase can briefly emit
      // null during token refresh, WebView resume, or back-navigation.
      // On Capacitor/Android wait up to 12s (WebView needs more time).
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
      showAccessOverlay('Authentication Required', 'You must be logged in as a Student to view this page with real data.');
      return;
    }

    try {
      const waitOverlay = document.getElementById('authWaitOverlay');
      if (waitOverlay) waitOverlay.remove();
      const demoOverlay = document.getElementById('demoOverlay');
      if (demoOverlay) demoOverlay.remove();
      
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        showAccessOverlay('Student Profile Missing', 'We could not find your student record. Please log in again or contact support.');
        return;
      }

      const userData = userSnap.data();
      if (userData.role !== 'student' && userData.role !== 'individual') {
        showAccessOverlay('Student Login Required', 'You cannot view this page with your current account. Please use a student or individual learner profile.');
        return;
      }

      currentStudent = { uid: user.uid, ...userData };

      if (currentStudent.school_id && !currentStudent.school_name) {
        try {
          const schoolSnap = await getDoc(doc(db, 'schools', currentStudent.school_id));
          if (schoolSnap.exists()) {
             currentStudent.school_name = schoolSnap.data().name || currentStudent.school_id;
             if (!currentStudent.school_logo_url && schoolSnap.data().logo_url) {
                 currentStudent.school_logo_url = schoolSnap.data().logo_url;
             }
          }
        } catch (e) {
          console.error("Could not load school data", e);
        }
      }

      if (currentStudent.game_state) {
        gameState = currentStudent.game_state;
      } else {
        await updateDoc(userDocRef, { game_state: gameState });
      }

      if (!gameState.completed) gameState.completed = [];
      if (!gameState.parent_approved) gameState.parent_approved = [];
      if (!gameState.teacher_approved) gameState.teacher_approved = [];
      
      if (typeof gameState.unlockedCount !== 'number' || gameState.unlockedCount < 1) gameState.unlockedCount = 1;
      if (typeof gameState.points !== 'number') gameState.points = 0;

      // === Auto-migration: fix points from old totalPoints field or recalculate ===
      let needsSave = false;

      // If old 'totalPoints' field exists, merge it into 'points'
      if (typeof gameState.totalPoints === 'number' && gameState.totalPoints > 0 && gameState.points === 0) {
        gameState.points = gameState.totalPoints;
        delete gameState.totalPoints;
        needsSave = true;
      }

      // Safety net: recalculate points from teacher_approved if points are missing
      const expectedPoints = gameState.teacher_approved.length * 50;
      if (gameState.points < expectedPoints) {
        gameState.points = expectedPoints;
        needsSave = true;
      }

      // Ensure unlockedCount matches progress (1 base + teacher_approved chapters)
      const expectedUnlocked = 1 + gameState.teacher_approved.length;
      if (gameState.unlockedCount < expectedUnlocked) {
        gameState.unlockedCount = expectedUnlocked;
        needsSave = true;
      }

      if (needsSave) {
        console.log('[Student Dashboard] Auto-migrating game_state:', gameState);
        await updateDoc(userDocRef, { game_state: gameState });
      }

      currentStudent.game_state = gameState;
      loadChampionsBoard();
      hydrateStudentHeader();
      studentDashboardView.classList.remove('d-none');
      hasInitializedDashboard = true;
      await fetchActivitiesData();
      window.switchStudentSection(currentStudentSection, false);
    } catch (err) {
      console.error('Firebase student dashboard error:', err);
      showAccessOverlay('Unable to Load Dashboard', 'There was a problem loading your dashboard. Please try again shortly.');
    }
  });

  window.logoutStudent = () => {
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

  // ── Refresh game_state silently when student returns from /activity ─────────
  // hasInitializedDashboard stays true so onAuthStateChanged won't re-run.
  // We manually re-fetch so chapters/points reflect the just-completed activity.
  async function refreshGameStateFromFirestore() {
    if (!currentStudent || !auth.currentUser) return;
    try {
      const freshSnap = await getDoc(doc(db, 'users', currentStudent.uid));
      if (!freshSnap.exists()) return;
      const freshData = freshSnap.data();
      if (!freshData.game_state) return;
      const newGs = freshData.game_state;
      const changed =
        (newGs.points || 0) !== (gameState.points || 0) ||
        (newGs.unlockedCount || 1) !== (gameState.unlockedCount || 1) ||
        JSON.stringify(newGs.completed || []) !== JSON.stringify(gameState.completed || []) ||
        JSON.stringify(newGs.teacher_approved || []) !== JSON.stringify(gameState.teacher_approved || []) ||
        JSON.stringify(newGs.parent_approved || []) !== JSON.stringify(gameState.parent_approved || []);
      if (!changed) return;
      gameState = newGs;
      currentStudent.game_state = gameState;
      updateDashboardMetrics();
      if (typeof hydrateStudentHeader === 'function') hydrateStudentHeader();
      if (currentBookContext) {
        showChapters(currentBookContext.bookId, currentBookContext.bookTitle);
      } else {
        if (typeof renderBooks === 'function') renderBooks();
      }
      console.log('[Dashboard] game_state refreshed after returning from activity.');
    } catch (e) {
      console.warn('[Dashboard] Silent refresh failed:', e);
    }
  }

  // pageshow fires when bfcache restores the page (Android back button)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshGameStateFromFirestore();
  });

  // visibilitychange fires when app resumes from background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshGameStateFromFirestore();
  });

  // ── Back button handler (Capacitor) ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const isCap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      if (isCap && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        var lastBackPressStudent = 0;
        window.Capacitor.Plugins.App.removeAllListeners('backButton').then(() => {
          window.Capacitor.Plugins.App.addListener('backButton', () => {
            // If inside a book or sub-section — just navigate back
            if (currentBookContext) {
              currentBookContext = null;
              renderBooks();
              return;
            }
            if (currentStudentSection !== 'overview') {
              window.switchStudentSection('overview', false);
              return;
            }
            // On overview (main screen) — show warning toast first
            var now = new Date().getTime();
            if (now - lastBackPressStudent < 2000) {
              if (window.Capacitor.Plugins.App.minimizeApp) {
                window.Capacitor.Plugins.App.minimizeApp();
              } else {
                window.Capacitor.Plugins.App.exitApp();
              }
            } else {
              lastBackPressStudent = now;
              var toast = document.createElement('div');
              toast.innerText = 'Press back again to exit';
              toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:white;padding:12px 24px;border-radius:30px;z-index:999999;font-family:sans-serif;font-size:14px;font-weight:500;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);transition:opacity 0.2s ease;opacity:0;pointer-events:none;';
              document.body.appendChild(toast);
              setTimeout(function() { toast.style.opacity = '1'; }, 10);
              setTimeout(function() {
                toast.style.opacity = '0';
                setTimeout(function() { if(toast.parentNode) toast.remove(); }, 300);
              }, 2000);
            }
          });
        });
      }
    }, 1200);
  });

  // User's custom Book Accordion design
  (function(){
    if (window.__apkBookAccordionInit) return;
    window.__apkBookAccordionInit = true;
  
    function isBooksView(root){
      var items = root.querySelectorAll(':scope > .library-item');
      if (!items.length) return false;
      for (var i = 0; i < items.length; i++){
        var img = items[i].querySelector('.library-cover img');
        if (img && /\\/covers\\//.test(img.getAttribute('src') || '')) return true;
      }
      return false;
    }
  
    function shortLabel(text, idx){
      var t = (text || '').trim();
      var m = t.match(/Book\\s*\\d+/i);
      return m ? m[0] : 'Book ' + (idx + 1);
    }
  
    function transformBooks(root){
      var items = Array.prototype.slice.call(root.querySelectorAll(':scope > .library-item'));
      if (!items.length) return;
      root.dataset.apkAccordion = '1';
      root.classList.add('apk-book-accordion');
  
      var frag = document.createDocumentFragment();
      items.forEach(function(card, idx){
        var titleEl = card.querySelector('.library-title');
        var label = shortLabel(titleEl ? titleEl.textContent : '', idx);
  
        var wrap = document.createElement('div');
        wrap.className = 'apk-book-row';
  
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'apk-book-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<span class="apk-book-num">' + (idx + 1) + '</span>'
          + '<span class="apk-book-label">' + label + '</span>'
          + '<i class="fas fa-chevron-down apk-book-caret"></i>';
  
        var panel = document.createElement('div');
        panel.className = 'apk-book-panel';
        panel.appendChild(card);
  
        btn.addEventListener('click', function(){
          var open = wrap.classList.toggle('open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
  
        wrap.appendChild(btn);
        wrap.appendChild(panel);
        frag.appendChild(wrap);
      });
  
      // Clear leftover children (none expected since all items moved) and append
      while (root.firstChild) root.removeChild(root.firstChild);
      root.appendChild(frag);
    }
  
    // Put the cards back the way showBooks() rendered them, so growing the
    // window back past 1024px does not leave the desktop grid full of
    // collapsed accordion rows.
    function unwrapBooks(root){
      var rows = Array.prototype.slice.call(root.querySelectorAll(':scope > .apk-book-row'));
      if (!rows.length) return;
      rows.forEach(function(row){
        var card = row.querySelector('.library-item');
        if (card) root.insertBefore(card, row);
        root.removeChild(row);
      });
    }

    function check(){
      var root = document.getElementById('activitiesRoot');
      if (!root) return;

      var isMobileOrCap = false;
      try {
        isMobileOrCap = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) || (window.innerWidth <= 1024);
      } catch(e) {}

      if (!isMobileOrCap) {
        root.dataset.apkAccordion = '';
        root.classList.remove('apk-book-accordion');
        unwrapBooks(root);
        return;
      }

      var hasAccordion = root.querySelector(':scope > .apk-book-row') !== null;
      if (hasAccordion) return;
      root.dataset.apkAccordion = '';
      root.classList.remove('apk-book-accordion');
      if (isBooksView(root)) transformBooks(root);
    }
  
    function init(){
      check();
      var root = document.getElementById('activitiesRoot');
      if (!root) return;
      var pending = false;
      var obs = new MutationObserver(function(){
        if (pending) return;
        pending = true;
        setTimeout(function(){ pending = false; check(); }, 0);
      });
      obs.observe(root, { childList: true });

      // check() only ever ran when the cards were re-rendered, so a viewport
      // that crossed the 1024px line without a re-render kept the wrong layout.
      var resizeTimer = null;
      window.addEventListener('resize', function(){
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(check, 150);
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();

</script>

<style>
  @media (max-width: 1024px) {
    /* Summary strip -> compact 3-column row */
    .student-page .summary-strip {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.4rem !important;
      margin: 0 !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    .student-page .summary-card {
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
    .student-page .summary-card img { display: none !important; }
    .student-page .summary-copy { gap: 0.1rem !important; align-items: center !important; text-align: center !important; min-width: 0 !important; }
    .student-page .summary-label {
      font-size: 0.55rem !important;
      letter-spacing: 0.02em !important;
      white-space: normal !important;
      line-height: 1.1 !important;
      overflow-wrap: anywhere !important;
    }
    .student-page .summary-value { font-size: 1.35rem !important; line-height: 1 !important; }
    .student-page .summary-meta { display: none !important; }

    /* Card itself: full row (override 50% rule above for chapter list view) */
    .student-page .apk-book-row.open .apk-book-panel .library-item,
    .student-page .catalog-grid > .library-item {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      min-height: 0 !important;
    }

    /* Book accordion buttons (APK-only) */
    .student-page .apk-book-accordion {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.4rem !important;
    }
    .student-page .apk-book-row { display: block; }
    .student-page .apk-book-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem 0.8rem;
      border-radius: 12px;
      border: 1px solid rgba(30,45,90,0.12);
      background: linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%);
      color: #1E2D5A;
      font-weight: 800;
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(15,23,42,0.05);
      transition: all 0.18s ease;
    }
    .apk-book-btn:active { transform: translateY(1px); }
    .apk-book-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: linear-gradient(180deg, #d63678, #cf296d);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      flex: 0 0 26px;
    }
    .apk-book-label { flex: 1 1 auto; }
    .apk-book-caret {
      color: #94a3b8;
      transition: transform 0.2s ease;
      font-size: 0.8rem;
    }
    .apk-book-row.open .apk-book-caret {
      transform: rotate(180deg);
      color: #ffffff;
    }
    .apk-book-row.open .apk-book-btn {
      background: linear-gradient(180deg, #1E2D5A 0%, #2a3d75 100%);
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 8px 18px rgba(30,45,90,0.25);
    }
    .apk-book-row.open .apk-book-num {
      background: rgba(255,255,255,0.18);
    }
    .apk-book-panel {
      display: none;
      padding: 0.5rem 0.25rem 0.1rem;
    }
    .apk-book-row.open .apk-book-panel { display: block; }
    .apk-book-row.open .apk-book-panel .library-item {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    /* Open accordion: show full natural book cover, no aspect cropping */
    .apk-book-row.open .apk-book-panel .library-cover {
      aspect-ratio: auto !important;
      height: auto !important;
      max-height: none !important;
      border-radius: 14px !important;
      overflow: hidden !important;
    }
    .apk-book-row.open .apk-book-panel .library-cover img {
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      object-fit: contain !important;
      display: block !important;
    }
  }
</style>

<link rel="stylesheet" href="kidba_assets/css/apk-bottombar.css">
<script defer src="kidba_assets/js/apk-bottombar.js"></script>
`
