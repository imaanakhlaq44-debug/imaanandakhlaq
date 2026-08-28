import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'
import { activeChildHelpersJS } from '../lib/activeChild'
import { emulatorConnectJS } from '../lib/devEmulators'

export const ActivityPage = () => html`
<style>
  .activity-page {
    background-color: #fcf6ee;
    padding: 3rem 0;
    font-family: 'Nunito', sans-serif;
    color: #4a4a4a;
    min-height: 100vh;
  }
  .activity-container {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    padding: 2rem;
    position: relative;
    overflow: hidden;
    max-width: 900px;
    margin: 0 auto;
  }
  .reading-container {
    position: fixed;
    inset: 0;
    background: #111;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .immersive-ui {
    position: absolute;
    top: 0; left: 0; width: 100%;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    z-index: 100;
    transition: opacity 0.3s ease;
  }
  .immersive-footer {
    position: absolute;
    bottom: 0; left: 0; width: 100%;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    z-index: 100;
    transition: opacity 0.3s ease;
  }
  .immersive-hidden {
    opacity: 0 !important;
    pointer-events: none;
  }
  .pdf-viewer-container {
    width: 100%;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }

  /* ─── Flip Book Styles ─── */
  .flipbook-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0;
    perspective: 2000px;
    touch-action: pan-y;
    overflow: visible;
  }
  .flipbook-wrapper.zoom-active {
    overflow: hidden;
  }
  .flipbook-zoom-shell {
    transform-origin: center center;
    will-change: transform;
    transform: translate3d(0px, 0px, 0px) scale(1);
  }
  .flipbook-wrapper.zoom-active .pdf-reader-stage {
    cursor: grab;
  }
  .flipbook-wrapper.zoom-active .pdf-reader-stage:active {
    cursor: grabbing;
  }
  .flipbook-container {
    background: transparent;
    margin: 0 auto;
    position: relative;
    min-height: 260px;
    /* The container fills the reader, and the book StPageFlip builds inside it
       is a normal block — so it sat at the container's top edge with the rest
       of a tall phone screen empty underneath. Centring the container's own
       content is what actually places the book. */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flipbook-container .stf__parent {
    margin: 0 auto;
  }
  .pdf-reader-stage {
    width: 100%;
    max-width: 820px;
    min-height: 260px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 2200px;
    perspective-origin: center center;
  }
  .pdf-reader-page {
    position: relative;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 18px 40px rgba(30, 58, 95, 0.12);
    overflow: hidden;
    padding: 14px;
    transform-origin: center center;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform, opacity, filter;
    isolation: isolate;
    --page-turn-gloss: 0;
    --page-turn-shadow: 0;
    --page-turn-direction: to right;
  }
  .pdf-reader-page::before {
    content: '';
    position: absolute;
    inset: 12px;
    border-radius: 14px;
    pointer-events: none;
    background: linear-gradient(var(--page-turn-direction), rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 18%, rgba(18,33,57,0.2) 52%, rgba(18,33,57,0.36) 100%);
    opacity: var(--page-turn-gloss);
    transition: opacity 120ms ease;
  }
  .pdf-reader-page::after {
    content: '';
    position: absolute;
    inset: 16px 14px;
    border-radius: 16px;
    pointer-events: none;
    background: linear-gradient(var(--page-turn-direction), rgba(15,23,42,0.34) 0%, rgba(15,23,42,0.12) 24%, rgba(15,23,42,0) 56%);
    opacity: var(--page-turn-shadow);
    filter: blur(16px);
    transition: opacity 120ms ease;
    transform: translateZ(-1px);
  }
  .pdf-reader-page canvas {
    position: relative;
    z-index: 1;
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    border-radius: 12px;
    backface-visibility: hidden;
  }
  .pdf-reader-loading,
  .pdf-reader-empty {
    background: rgba(14, 165, 233, 0.08);
    border: 1px dashed rgba(14, 165, 233, 0.35);
    border-radius: 18px;
    color: #1e3a5f;
    padding: 28px 20px;
    text-align: center;
    max-width: 520px;
    margin: 0 auto;
  }
  .pdf-reader-empty strong,
  .pdf-reader-loading strong {
    display: block;
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    margin-bottom: 10px;
  }
  .pdf-reader-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .pdf-reader-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #1e3a5f;
    color: #fff;
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 10px 22px rgba(30, 58, 95, 0.2);
  }
  .pdf-reader-link:hover {
    color: #fff;
    transform: translateY(-1px);
  }
  .pdf-reader-cover, .pdf-reader-end {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
    color: white;
    text-align: center;
    padding: 30px;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.3);
  }
  .pf-cover-icon {
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 20px;
  }
  .pf-cover-kicker {
    font-size: 0.85rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #ffd700;
    margin-bottom: 8px;
    font-weight: 800;
  }
  .pdf-reader-cover h2, .pdf-reader-end h2 {
    font-family: 'Fredoka One', cursive;
    font-size: 2rem;
    margin-bottom: 15px;
    line-height: 1.2;
    /* Bootstrap sets h2 { color: var(--bs-heading-color) }, and a rule on the
       element beats the white this inherits from .pdf-reader-cover — so the
       chapter title came out dark navy on a dark blue cover, all but
       unreadable. Saying it here settles it whatever that variable holds. */
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .pdf-reader-cover p, .pdf-reader-end p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    max-width: 80%;
  }
  .start-activities-btn {
    margin-top: 25px;
    background: #10b981;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 999px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4);
    transition: all 0.2s;
  }
  .start-activities-btn:hover {
    transform: scale(1.05);
    background: #059669;
  }
  .flipbook-page {
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: inset 0 0 30px rgba(0,0,0,0.05);
  }
  .flipbook-page canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .flipbook-page.cover-page {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    padding: 30px;
  }
  .flipbook-page.cover-page h2 {
    font-family: 'Fredoka One', cursive;
    font-size: 1.5rem;
    margin-bottom: 10px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .flipbook-page.cover-page p {
    font-size: 1rem;
    opacity: 0.8;
  }
  .flipbook-page.end-page {
    background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    padding: 30px;
    cursor: pointer;
  }
  .flipbook-page.end-page h2 {
    font-family: 'Fredoka One', cursive;
    font-size: 1.4rem;
    margin-bottom: 10px;
  }
  .flipbook-page.end-page .start-activities-btn {
    background: #fff;
    color: #0ea5e9;
    border: none;
    padding: 14px 40px;
    border-radius: 30px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    cursor: pointer;
    margin-top: 15px;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .flipbook-page.end-page .start-activities-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  }
  .flipbook-nav {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 20px;
  }
  .flipbook-nav button {
    background: #1e3a5f;
    color: white;
    border: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  }
  .flipbook-nav button:hover {
    transform: scale(1.1);
    background: #2d5a8e;
  }
  .flipbook-nav button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
  .flipbook-nav .zoom-reset-btn {
    width: auto;
    min-width: 48px;
    padding: 0 14px;
    border-radius: 999px;
  }
  .flipbook-page-indicator {
    font-family: 'Fredoka One', cursive;
    color: #555;
    font-size: 1rem;
    min-width: 100px;
    text-align: center;
  }
  .flipbook-hint {
    color: #888;
    font-size: 0.85rem;
    margin-top: 8px;
    animation: pulse-hint 2s ease-in-out infinite;
  }
  @keyframes pulse-hint {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  @media (max-width: 600px) {
    .flipbook-nav button { width: 40px; height: 40px; font-size: 1rem; }
    .flipbook-page-indicator { font-size: 0.85rem; min-width: 80px; }
  }
  .hidden { display: none !important; }
  .chapter-ribbon {
    background: #f1a23a;
    color: #fff;
    display: inline-block;
    padding: 8px 30px;
    border-radius: 0 20px 20px 0;
    font-family: 'Fredoka One', cursive;
    font-size: 1.2rem;
    position: absolute;
    top: 30px;
    left: 0;
    text-transform: uppercase;
  }
  .discussion-header {
    margin-top: 60px;
    display: flex;
    align-items: center;
    gap: 15px;
    background: #db2777;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    width: fit-content;
    font-family: 'Fredoka One', cursive;
    font-size: 1.5rem;
  }
  .question-text {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 20px 0;
    color: #333;
  }
  .activity-table-wrapper {
    overflow-x: auto;
    margin-bottom: 30px;
    background: #fdf5e6;
    border: 2px dashed #e2b476;
    border-radius: 15px;
    padding: 15px;
  }
  .activity-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  .activity-table th {
    font-family: 'Fredoka One', cursive;
    color: #555;
    text-align: center;
    padding: 10px;
    border-bottom: 2px solid #e2b476;
  }
  .activity-table th.col-question {
    text-align: left;
    width: 30%;
  }
  .activity-table td {
    padding: 10px;
    border-bottom: 1px solid #e2b476;
    border-right: 1px solid #e2b476;
    text-align: center;
  }
  .activity-table td:last-child {
    border-right: none;
  }
  .group-header td {
    font-weight: 800;
    font-size: 1.1rem;
    text-align: left !important;
    background: rgba(241, 162, 58, 0.1);
    color: #333;
  }
  .question-cell {
    text-align: left !important;
    font-weight: 600;
    color: #555;
  }
  .interactive-cell {
    cursor: pointer;
    font-size: 1.4rem;
    transition: all 0.2s;
    user-select: none;
    height: 40px;
  }
  .interactive-cell.today-cell {
    background: rgba(214,54,120,0.05);
  }
  .interactive-cell:hover {
    background: rgba(255,255,255,0.8);
    transform: scale(1.1);
  }
  /* Day header row */
  .day-header-row th {
    text-align: center;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 6px 4px;
    color: #888;
    border-bottom: 2px solid #f0e8dc;
    position: sticky;
    top: 0;
    background: #fff9f2;
    z-index: 2;
  }
  .day-col-header.today-col {
    color: #D63678;
    background: rgba(214,54,120,0.08) !important;
    border-radius: 8px 8px 0 0;
  }
  .today-dot {
    width: 6px; height: 6px;
    background: #D63678;
    border-radius: 50%;
    margin: 3px auto 0;
  }
  /* Submit button locked style */
  #saveProgressBtn:disabled {
    background: #cbd5e1 !important;
    color: #64748b !important;
    cursor: not-allowed;
  }
  .parents-section {
    background: #3b82f6;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.4rem;
    margin-top: 40px;
    margin-bottom: 20px;
  }
  .parent-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }
  .parent-day {
    font-weight: 700;
    width: 50px;
    color: #555;
  }
  .parent-input {
    flex: 1;
    border: none;
    border-bottom: 2px solid #ccc;
    background: transparent;
    padding: 5px 10px;
    font-size: 1rem;
    font-family: 'Nunito', sans-serif;
    color: #333;
    transition: border-color 0.3s;
  }
  .parent-input:focus {
    outline: none;
    border-color: #3b82f6;
  }
  .save-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 1.2rem;
    border-radius: 30px;
    font-family: 'Fredoka One', cursive;
    margin-top: 30px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
  }
  
  /* Parent Gate Modal Styles */
  .parent-gate-overlay {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); z-index: 99999;
    display: flex; justify-content: center; align-items: center;
    backdrop-filter: blur(8px);
  }
  .parent-gate-modal {
    background: #fff; width: 95%; max-width: 900px; height: 85vh;
    border-radius: 24px; display: flex; flex-direction: column;
    overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .pg-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
    color: white; padding: 25px; text-align: center;
  }
  .pg-header h2 { margin: 0; font-family: 'Fredoka One', cursive; letter-spacing: 1px; font-size: 2rem; }
  .pg-header p { margin: 8px 0 0; opacity: 0.9; font-size: 1.1rem; }
  .pg-body {
    display: flex; flex: 1; overflow: hidden;
  }
  .pg-sidebar {
    width: 140px; background: #f8fafc; border-right: 1px solid #e2e8f0;
    overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;
  }
  .pg-day-tab {
    padding: 15px 10px; border-radius: 12px; border: 2px solid transparent;
    background: white; text-align: center; cursor: pointer; font-weight: bold;
    color: #64748b; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    font-size: 1.1rem;
  }
  .pg-day-tab:hover { border-color: #cbd5e1; }
  .pg-day-tab.active {
    border-color: #3b82f6; color: #3b82f6; background: #eff6ff;
  }
  .pg-day-tab.read {
    border-color: #10b981; color: #10b981; background: #ecfdf5;
  }
  .pg-day-tab.read::after {
    content: ' ✓';
  }
  .pg-content {
    flex: 1; padding: 30px; overflow-y: auto; background: #fff; position: relative;
  }
  .pg-footer {
    padding: 20px 30px; border-top: 1px solid #e2e8f0; background: #f8fafc;
    display: flex; justify-content: space-between; align-items: center;
  }
  .pg-status { font-size: 1.2rem; color: #475569; }
  .pg-btn {
    padding: 14px 28px; border-radius: 99px; font-weight: bold; cursor: pointer;
    border: none; transition: transform 0.2s; font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
  }
  .pg-btn-read { background: #3b82f6; color: white; box-shadow: 0 4px 15px rgba(59,130,246,0.3); }
  .pg-btn-read:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.4); }
  .pg-btn-submit { background: #10b981; color: white; display: none; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
  .pg-btn-submit.show { display: inline-block; animation: pulse 2s infinite; }
  
  .pg-topic { color: #cf296d; font-family: 'Fredoka One', cursive; margin-bottom: 20px; font-size: 1.8rem; }
  .pg-section { margin-bottom: 20px; padding: 20px; border-radius: 16px; border-left: 5px solid #ea8300; }
  .pg-section h4 { margin-top: 0; color: #1e293b; font-family: 'Fredoka One', cursive; font-size: 1.3rem; margin-bottom: 12px; }
  .pg-section p { margin-bottom: 0; color: #334155; }
  
  @media (max-width: 768px) {
    .pg-body { flex-direction: column; }
    .pg-sidebar { width: 100%; flex-direction: row; overflow-x: auto; padding: 10px; border-right: none; border-bottom: 1px solid #e2e8f0; }
    .pg-day-tab { padding: 10px 15px; flex-shrink: 0; font-size: 1rem; }
    .pg-header h2 { font-size: 1.5rem; }
    .pg-header p { font-size: 0.9rem; }
    .pg-content { padding: 15px; }
    .pg-footer { flex-direction: column; gap: 15px; text-align: center; }
    .pg-btn { width: 100%; }
  }
</style>

<script src="/kidba_assets/js/pdf.min.js"></script>
<div class="activity-page">
  <div class="container pb-3">
    <div class="mb-4 text-center position-relative hidden" id="mainHeader">
      <div class="text-start mb-3">
        <a href="./student-activities" class="btn btn-outline-secondary rounded-pill"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
      </div>
      <h2 style="font-family: 'Fredoka One', cursive; color: #ff6b6b; margin: 0;" id="pageTitleLoading">Loading...</h2>
    </div>

    <!-- Phase 1: Reading Phase (Immersive) -->
    <div class="reading-container" id="readingContainer">
      <div class="immersive-ui" id="immersiveUi" style="justify-content: space-between;">
        <button class="btn btn-dark bg-opacity-75 rounded-circle border-0" onclick="window.location.href='student-activities.html'" style="width: 45px; height: 45px; color:white; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"><i class="fas fa-arrow-left"></i></button>
        <div id="immersiveTitle" style="color: #fff; font-family: 'Fredoka One', cursive; font-size: 1.2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); text-align: center;">Loading...</div>
        <div style="width:45px;"></div>
      </div>

      <div class="flipbook-wrapper" id="flipbook-wrapper" style="width:100%; height:100%; margin:0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
        <div class="flipbook-zoom-shell" id="flipbook-zoom-shell" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
          <div class="flipbook-container" id="flipbook-container" style="width:100%; height:100%;"></div>
        </div>
      </div>
      
      <div class="immersive-footer" id="immersiveFooter" style="flex-direction:column; gap:8px; padding-bottom: calc(12px + env(safe-area-inset-bottom));">
        <button id="finishReadingBtn" style="display:none; background:rgba(255,255,255,0.18); color:#fff; border:1.5px solid rgba(255,255,255,0.5); border-radius:999px; padding:7px 22px; font-size:0.85rem; font-weight:700; cursor:pointer; backdrop-filter:blur(8px); letter-spacing:0.3px; transition:all 0.2s;">
          <i class="fas fa-check-circle" style="margin-right:6px; color:#4ade80;"></i>Done Reading — Start Activities
        </button>
        <div style="display:flex; align-items:center; gap:0;">
          <button class="btn btn-dark bg-opacity-75 rounded-circle border-0 me-2" id="flipbookPrevBtn" style="width: 45px; height: 45px; color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-chevron-left"></i></button>
          <div id="flipPageIndicator" style="color:white; font-weight:bold; font-size:1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); min-width: 80px; text-align: center;">Page 1</div>
          <button class="btn btn-dark bg-opacity-75 rounded-circle border-0 ms-2" id="flipbookNextBtn" style="width: 45px; height: 45px; color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <!-- Phase 2: Activity Phase -->
    <div class="activity-container hidden" id="activityContainer">
      <div class="chapter-ribbon" id="chapRibbon">Loading...</div>

      <div class="text-center mb-4">
        <div class="discussion-header mx-auto" style="margin-top: 50px;">
          DISCUSSION QUESTION <i class="fas fa-question-circle text-warning"></i>
        </div>
      </div>
      
      <p class="question-text" id="discussionQuestionText">Loading question...</p>
      <textarea id="discussionAnswer" class="form-control mb-4" rows="3" placeholder="Type your answer here for the teacher to review..." style="font-size: 1.1rem; border-radius: 12px; border: 2px solid #e0e0e0;"></textarea>

      <p class="text-center text-muted fw-bold mb-2">(Click to answer Yes <span class="text-success">✔</span> or No <span class="text-danger">✖</span>)</p>
      
      <div class="activity-table-wrapper">
        <table class="activity-table">
          <thead>
            <tr>
              <th class="col-question"></th>
              <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
            </tr>
          </thead>
          <tbody id="interactive-grid">
            <!-- Dynamic Rows Generated via JS -->
          </tbody>
        </table>
      </div>

      <div class="parents-section d-inline-block">
        ONE GOOD SENTENCE FROM PARENTS <i class="fas fa-pencil-alt text-warning"></i>
      </div>

      <div class="parents-inputs mt-3">
        <div class="parent-row"><div class="parent-day">Mon</div><input type="text" id="parentNote_0" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Tue</div><input type="text" id="parentNote_1" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Wed</div><input type="text" id="parentNote_2" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Thu</div><input type="text" id="parentNote_3" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Fri</div><input type="text" id="parentNote_4" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Sat</div><input type="text" id="parentNote_5" class="parent-input" placeholder="Parent's note for the day..."></div>
        <div class="parent-row"><div class="parent-day">Sun</div><input type="text" id="parentNote_6" class="parent-input" placeholder="Parent's note for the day..."></div>
      </div>

      <div class="text-center">
        <button class="save-btn" id="saveProgressBtn"><i class="fas fa-save"></i> Submit for Review</button>
      </div>
      <div id="saveAlert" class="alert alert-success mt-3 text-center" style="display:none; font-family: 'Fredoka One', cursive;">
        <!-- Filled by JS -->
      </div>

    </div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, connectAuthEmulator, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // Local development only. USE_EMULATORS is a build-time constant, so a
  // production build emits this block with the connect calls already dead.
  ${raw(emulatorConnectJS)}
  connectEmulators({ auth, db,
    connectAuthEmulator, connectFirestoreEmulator });


  const urlParams = new URLSearchParams(window.location.search);
  const currentBook = urlParams.get('book') || 'book1';
  const currentChap = urlParams.get('chapter') || 'chapter1';
  const pageOpenedAtMs = Date.now();
  const attendanceSessionSeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  
  // acResolveIdentity / acOwnership come from activeChild.ts.
  ${raw(activeChildHelpersJS)}

  let currentUser = null;
  // Who owns the work on this page. Distinct from currentUser: on a family
  // account the signed-in uid is the parent and owns no submissions, so every
  // read and write below keys off identity.studentUid, never currentUser.uid.
  let identity = null;

  // True once we know which learner we are writing for. On a family account
  // that stays false until a child card has been opened — a save must bail
  // rather than fall back to the parent's uid and forge a submission.
  function hasLearner() { return !!(currentUser && identity && identity.studentUid); }
  function learnerUid() { return identity ? identity.studentUid : ''; }

  let state = { points: 50, unlockedCount: 1, completed: [], parent_approved: [], teacher_approved: [] };
  let attendanceSessionId = null;
  let attendanceStartedAt = new Date(pageOpenedAtMs).toISOString();
  let hasInitializedPage = false;

  function showAuthRequiredOverlay() {
    if (document.getElementById('demoOverlay')) return;
    document.body.insertAdjacentHTML('beforeend',
      '<div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">' +
        '<div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">' +
           '<i class="fas fa-lock" style="font-size:3rem; color:#D63678; margin-bottom:20px;"></i>' +
           '<h3 style="font-family:&quot;Fredoka One&quot;, cursive; color:#1E2D5A;">Authentication Required</h3>' +
           '<p style="color:#64748b; margin-bottom:25px;">You must log in to submit your activity.</p>' +
           '<button onclick="window.location.href=&quot;/auth&quot;" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>' +
        '</div>' +
      '</div>'
    );
  }

  // In Capacitor APK, Firebase auth session can be lost on page navigation.
  // Always try localStorage first as fallback so saves don't fail.
  function loadUserFromStorage() {
    try {
      var raw = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.uid) return d;
      }
    } catch(e) {}
    return null;
  }

  onAuthStateChanged(auth, async (user) => {
    if (hasInitializedPage) return;

    if (user) {
      currentUser = user;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const uData = userSnap.data();
          currentUser.school_id = uData.school_id;
          currentUser.name = uData.name || user.displayName || 'Student';
          currentUser.role = uData.role || 'student';
          if (uData.game_state) state = uData.game_state;
          identity = acResolveIdentity(user.uid, uData);
        }
      } catch(e) {
        console.error(e);
      }
    } else {
      // Firebase auth null — try localStorage fallback (common in Capacitor WebView)
      var storedUser = loadUserFromStorage();
      if (storedUser && storedUser.uid) {
        currentUser = storedUser;
        try {
          const userDocRef = doc(db, "users", storedUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            currentUser.school_id = uData.school_id || storedUser.school_id;
            currentUser.name = uData.name || storedUser.name || 'Student';
            currentUser.role = uData.role || storedUser.role || 'student';
            if (uData.game_state) state = uData.game_state;
            identity = acResolveIdentity(storedUser.uid, uData);
          }
        } catch(e) {
          // Use stored data as-is
          currentUser.school_id = storedUser.school_id || '';
          currentUser.name = storedUser.name || 'Student';
          currentUser.role = storedUser.role || 'student';
        }
      }
    }

    // On a family login the account doc belongs to the parent. Their name and
    // school must never be stamped onto a child's sheet, so everything the
    // submission carries is reloaded from the child instead.
    if (identity && identity.isFamilyAccount) {
      let child = null;
      if (identity.studentUid) {
        try {
          const childSnap = await getDoc(doc(db, "users", identity.studentUid));
          // Ownership is re-checked rather than trusted: the remembered child
          // id outlives a logout, so a second family on a shared device would
          // otherwise write into the previous family's child.
          if (childSnap.exists() && childSnap.data().family_uid === identity.familyUid) {
            child = childSnap.data();
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (!child) {
        // No child chosen, or the remembered one is not ours. Send them back
        // to pick, rather than leaving a page that silently refuses to save.
        window.location.replace('/family');
        return;
      }

      currentUser.school_id = child.school_id || '';
      currentUser.name = child.name || 'Student';
      if (child.game_state) state = child.game_state;
    }

    // The /users doc was missing or unreachable — offline, or a fresh
    // Capacitor session that fell back to localStorage. Treat it as a legacy
    // account: the signed-in uid is the learner, which is what every account
    // is until the family rollout reaches its school.
    if (currentUser && !identity) identity = acResolveIdentity(currentUser.uid, null);

    if (!state.parent_approved) state.parent_approved = [];
    if (!state.teacher_approved) state.teacher_approved = [];
    if (!state.completed) state.completed = [];

    hasInitializedPage = true;
    initActivityPage();
  });

  async function initActivityPage() {
    const gridEl = document.getElementById('interactive-grid');
    const titleEl = document.getElementById('pageTitleLoading');
    const ribbonEl = document.getElementById('chapRibbon');
    const discEl = document.getElementById('discussionQuestionText');
    let chapterId = '';

    const SERVER_DATA = ${raw(JSON.stringify(activitiesData))};
    const bookData = SERVER_DATA[currentBook];
    if(!bookData) return alert("Book not found!");
    
    const chapData = bookData.chapters[currentChap];
    if(!chapData) return alert("Chapter not found!");

    chapterId = chapData.id;
    attendanceSessionId = hasLearner() ? (learnerUid() + '_' + chapterId + '_' + attendanceSessionSeed) : null;
    attendanceStartedAt = new Date(pageOpenedAtMs).toISOString();

    async function recordAttendance(status, extraData = {}) {
      if (!hasLearner() || !attendanceSessionId) return;

      const attendancePayload = Object.assign(acOwnership(identity), {
        student_name: currentUser.name || 'Student',
        school_id: currentUser.school_id || '',
        book_id: currentBook,
        chapter_id: chapterId,
        chapter_title: chapData.title,
        sessionDate: attendanceStartedAt.slice(0, 10),
        activityStartedAt: attendanceStartedAt,
        lastUpdatedAt: new Date().toISOString(),
        status: status,
        activityCompletedAt: extraData.activityCompletedAt || null,
        activityDurationSeconds: typeof extraData.activityDurationSeconds === 'number' ? extraData.activityDurationSeconds : null,
        existingSubmission: !!extraData.existingSubmission
      });

      try {
        await setDoc(doc(db, "activity_attendance", attendanceSessionId), attendancePayload, { merge: true });
      } catch (attendanceErr) {
        console.error("Attendance tracking error:", attendanceErr);
      }
    }
    
    // Populate Header
    titleEl.textContent = chapData.title;
    const immTitle = document.getElementById('immersiveTitle');
    if (immTitle) immTitle.textContent = chapData.title;
    ribbonEl.textContent = "Activities for " + currentChap.replace('chapter', 'Chapter ');
    discEl.textContent = chapData.discussionQuestion;

    // Load specific PDF pages using pdf.js
    const pageInstructions = document.getElementById('pageRangeInstructions');
    if (pageInstructions && chapData.pageStart && chapData.pageEnd) {
       pageInstructions.innerHTML = \`<strong>Required Reading: Page \${chapData.pageStart} to \${chapData.pageEnd}.</strong><br> Flip through the pages below. When you're done, click the button to start your activities.\`;
    }

    const pdfFileUrl = bookData.pdfUrl && bookData.pdfUrl.includes('firebasestorage') 
                       ? bookData.pdfUrl 
                       : '/' + currentBook + '.pdf';
    const backupPdfUrl = bookData.pdfUrl || pdfFileUrl;
    const flipbookContainer = document.getElementById('flipbook-container');
    const flipbookNav = document.getElementById('flipbook-nav');
    const flipbookHint = document.getElementById('flipbook-hint');
    const readerGestureState = {
      zoomScale: 1
    };

    function buildReaderFallback(message) {
      let linksHtml = '<div class="pdf-reader-actions">' +
        '<a class="pdf-reader-link" href="' + pdfFileUrl + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> Open Book PDF</a>';
      if (backupPdfUrl && backupPdfUrl !== pdfFileUrl) {
        linksHtml += '<a class="pdf-reader-link" href="' + backupPdfUrl + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Open Backup Viewer</a>';
      }
      linksHtml += '</div>';
      return '<div class="pdf-reader-empty"><strong>Chapter pages could not render here.</strong><div>' + message + '</div>' + linksHtml + '</div>';
    }

    async function createPdfCanvas(pdf, pageNumber, targetWidth, targetHeight) {
      const pdfPage = await pdf.getPage(pageNumber);
      const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
      const pixelRatio = window.devicePixelRatio || 1;
      const scaleX = targetWidth / unscaledViewport.width;
      const scaleY = targetHeight / unscaledViewport.height;
      const scale = Math.min(scaleX, scaleY) * pixelRatio * 0.98;
      const viewport = pdfPage.getViewport({ scale: scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = (viewport.width / pixelRatio) + 'px';
      canvas.style.height = (viewport.height / pixelRatio) + 'px';

      await pdfPage.render({ canvasContext: context, viewport: viewport }).promise;
      return canvas;
    }

    async function mountPdfReader(pdf, start, end) {
      // ── Professional book reader powered by StPageFlip ─────────
      const wrapperWidth = document.getElementById('flipbook-wrapper').clientWidth || 800;
      const wrapperHeight = document.getElementById('flipbook-wrapper').clientHeight || 600;
      const isMobile = window.innerWidth < 768;
      // Single-page on phones, two-page spread on tablets/desktop
      const usePortrait = isMobile;
      
      // Calculate max width based on available screen space
      const maxWidthByWidth = usePortrait ? (wrapperWidth - 36) : Math.floor((wrapperWidth - 60) / 2);
      // Calculate max width based on available height (aspect ratio is ~1:1.4)
      const maxWidthByHeight = (wrapperHeight - 40) / 1.4;
      
      // Take the largest size that fits both constraints (but cap at reasonable extreme max so it doesn't get absurdly huge on 4K)
      const pageWidth = Math.min(maxWidthByWidth, maxWidthByHeight, 800);
      const pageHeight = Math.round(pageWidth * 1.4);
      const totalPages = end - start + 1;

      const prevBtn = document.getElementById('flipbookPrevBtn');
      const nextBtn = document.getElementById('flipbookNextBtn');
      const pageIndicator = document.getElementById('flipPageIndicator');
      const progressEl = document.getElementById('flipbook-progress');
      const progressFill = document.getElementById('flipbook-progress-fill');
      
      // Wait for PageFlip library
      let attempts = 0;
      while (typeof window.St === 'undefined' && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      
      // Fallback: if not loaded, try dynamically loading from CDN
      if (typeof window.St === 'undefined') {
        const tryLoad = (src) => new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = () => resolve(true);
          s.onerror = () => reject(new Error('script load failed'));
          document.head.appendChild(s);
        });
        try {
          await tryLoad('/kidba_assets/js/page-flip.browser.min.js');
        } catch(_) {
          try { await tryLoad('https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.min.js'); } catch(__) {}
        }
      }

      if (typeof window.St === 'undefined' || typeof window.St.PageFlip !== 'function') {
        flipbookContainer.innerHTML = buildReaderFallback('Page-flip engine could not load.');
        flipbookContainer.style.visibility = 'visible';
        flipbookContainer.style.position = 'relative';
        return;
      }

      // Build page DOM elements (cover + content + end)
      flipbookContainer.innerHTML = '';
      flipbookContainer.style.visibility = 'visible';
      flipbookContainer.style.position = 'relative';

      const bookEl = document.createElement('div');
      bookEl.className = 'flipbook-book';
      flipbookContainer.appendChild(bookEl);

      function makePageEl(extraClass, density) {
        const el = document.createElement('div');
        el.className = 'pdf-reader-page-host ' + (extraClass || '');
        if (density) el.dataset.density = density;
        return el;
      }

      // Cover page (hard)
      const coverEl = makePageEl('pf-cover', 'hard');
      coverEl.innerHTML =
        '<div class="pdf-reader-cover">' +
          '<div class="pf-cover-icon"><i class="fas fa-book-open"></i></div>' +
          '<div class="pf-cover-kicker">Imaan & Akhlaaq</div>' +
          '<h2>' + (chapData.title || 'Chapter') + '</h2>' +
          '<p>Pages ' + start + '–' + end + '. Drag a corner or swipe to flip.</p>' +
        '</div>';
      bookEl.appendChild(coverEl);

      // Content pages (soft) — rendered async, placeholders first
      const contentEls = [];
      for (let i = 0; i < totalPages; i++) {
        const el = makePageEl('pf-content');
        el.innerHTML =
          '<div class="pdf-reader-page">' +
            '<div class="pdf-reader-loading"><strong>Loading page ' + (i + 1) + '…</strong></div>' +
            '<span class="pf-page-num">' + (i + 1) + ' / ' + totalPages + '</span>' +
          '</div>';
        contentEls.push(el);
        bookEl.appendChild(el);
      }

      // End page (hard) — Start Activities CTA
      const endEl = makePageEl('pf-end', 'hard');
      endEl.innerHTML =
        '<div class="pdf-reader-end">' +
          '<div class="pf-cover-kicker">Reading Complete</div>' +
          '<h2>Mashallah!</h2>' +
          '<p>You finished the chapter. Ready to do your activities?</p>' +
          '<button type="button" class="start-activities-btn" id="endPageStartBtn"><i class="fas fa-play"></i> Start Activities</button>' +
        '</div>';
      bookEl.appendChild(endEl);

      // Initialize PageFlip
      const pageFlip = new window.St.PageFlip(bookEl, {
        width: pageWidth,
        height: pageHeight,
        size: 'stretch',
        minWidth: 240,
        maxWidth: pageWidth,
        minHeight: 320,
        maxHeight: pageHeight,
        maxShadowOpacity: 0.6,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: false,
        flippingTime: 750,
        drawShadow: true,
        autoSize: true,
        clickEventForward: true,
        useMouseEvents: true,
        showPageCorners: true,
        swipeDistance: 24
      });

      pageFlip.loadFromHTML(bookEl.querySelectorAll('.pdf-reader-page-host'));

      const flipbookNav = document.getElementById('flipbook-nav');
      if (flipbookNav) flipbookNav.style.display = 'flex';
      if (progressEl) progressEl.style.display = 'block';

      function updateNav() {
        const idx = pageFlip.getCurrentPageIndex();
        const total = pageFlip.getPageCount();
        // Display: cover=0, pages 1..N, end=N+1 → show "Page i / N" only on content pages
        if (idx === 0) {
          if (pageIndicator) pageIndicator.textContent = 'Cover';
        } else if (idx >= total - 1) {
          if (pageIndicator) pageIndicator.textContent = 'Finish';
        } else {
          if (pageIndicator) pageIndicator.textContent = 'Page ' + idx + ' / ' + (total - 2);
        }
        if (prevBtn) prevBtn.disabled = idx <= 0;
        if (nextBtn) nextBtn.disabled = idx >= total - 1;
        if (progressFill) {
          const pct = total > 1 ? Math.round((idx / (total - 1)) * 100) : 0;
          progressFill.style.width = pct + '%';
        }
        
        // Show "Start Activities" main button at the bottom if on the last page
        const finishBtn = document.getElementById('finishReadingBtn');
        if (finishBtn) {
          finishBtn.style.display = (idx >= total - 1) ? 'block' : 'none';
        }
      }

      pageFlip.on('flip', updateNav);
      pageFlip.on('changeOrientation', updateNav);
      updateNav();

      if (prevBtn) prevBtn.onclick = function() { pageFlip.flipPrev(); };
      if (nextBtn) nextBtn.onclick = function() { pageFlip.flipNext(); };

      // End page button → finish reading
      const endBtn = document.getElementById('endPageStartBtn');
      if (endBtn) {
        endBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const finishBtn = document.getElementById('finishReadingBtn');
          if (finishBtn) finishBtn.click();
        });
      }

      // Render PDF pages into placeholders progressively
      (async function renderAllPages() {
        for (let i = 0; i < totalPages; i++) {
          try {
            const canvas = await createPdfCanvas(pdf, start + i, pageWidth, pageHeight);
            const host = contentEls[i];
            if (!host) continue;
            host.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'pdf-reader-page';
            wrap.appendChild(canvas);
            const num = document.createElement('span');
            num.className = 'pf-page-num';
            num.textContent = (i + 1) + ' / ' + totalPages;
            wrap.appendChild(num);
            host.appendChild(wrap);
          } catch (e) {
            console.warn('Page ' + (start + i) + ' render failed', e);
          }
        }
      })();
    }
    
    // Show loading state
    const flipbookWrapper = document.getElementById('flipbook-wrapper');
    const flipbookLoadingHost = flipbookContainer.parentElement || flipbookWrapper;
    flipbookContainer.innerHTML = '';
    flipbookContainer.style.visibility = 'hidden';
    flipbookContainer.style.position = 'absolute';
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'flipbook-loading';
    loadingDiv.style.cssText = 'text-align:center; padding:60px 20px; font-weight:bold; color:#d63678;';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading your chapter...';
    flipbookLoadingHost.insertBefore(loadingDiv, flipbookContainer);
    
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
        try { await tryLoad('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'); } catch(__) {}
      }
    }

    if (typeof window.pdfjsLib !== 'undefined') {
      try {
        const workerProbe = await fetch('/kidba_assets/js/pdf.worker.min.js', { method: 'HEAD' });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerProbe.ok
          ? '/kidba_assets/js/pdf.worker.min.js'
          : 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      } catch(_) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      }
      
      try {
        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfFileUrl,
          disableStream: false,
          disableRange: false,
          disableAutoFetch: true,
          rangeChunkSize: 131072
        });
        loadingTask.onProgress = function(p) {
          if (!p || !p.total) return;
          const pct = Math.min(100, Math.round((p.loaded / p.total) * 100));
          const loadingEl = document.getElementById('flipbook-loading');
          if (loadingEl) {
            loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading your chapter... ' + pct + '%<div style="width:240px;height:6px;background:rgba(0,0,0,0.08);border-radius:3px;margin:14px auto 0;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#cf296d,#ea8300);transition:width 0.2s;"></div></div>';
          }
        };
        const pdf = await loadingTask.promise;
        const start = parseInt(chapData.pageStart) || 1;
        const end = parseInt(chapData.pageEnd) || 1;
        // Remove loading spinner and mount the PDF reader
        const loadingEl = document.getElementById('flipbook-loading');
        if (loadingEl) loadingEl.remove();
        await mountPdfReader(pdf, start, end);

        // ── Pinch-to-zoom ──────────────────────────────────────────
        const zoomShell = document.getElementById('flipbook-zoom-shell');
        const flipWrapper = document.getElementById('flipbook-wrapper');
        const resetZoomBtn = document.getElementById('flipResetZoomBtn');
        let pinchStartDist = 0;
        let pinchStartScale = 1;
        let currentZoom = 1;
        let panX = 0;
        let panY = 0;
        let panAnchorX = 0;
        let panAnchorY = 0;
        let isPinching = false;
        let isPanning = false;
        const MIN_ZOOM = 1;
        const MAX_ZOOM = 3;

        function clampZoom(value) {
          return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
        }

        function clampPan() {
          const wrapWidth = flipWrapper.clientWidth || 1;
          const wrapHeight = flipWrapper.clientHeight || 1;
          const maxPanX = ((currentZoom - 1) * wrapWidth) / 2;
          const maxPanY = ((currentZoom - 1) * wrapHeight) / 2;

          panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
          panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        }

        function updateZoomUi() {
          const isZoomed = currentZoom > 1.01;
          readerGestureState.zoomScale = currentZoom;
          flipWrapper.classList.toggle('zoom-active', isZoomed);

          if (flipbookHint) {
            flipbookHint.innerHTML = isZoomed
              ? '<i class="fas fa-hand-paper"></i> Drag to pan • Tap zoom icon to reset'
              : '<i class="fas fa-hand-pointer"></i> Swipe to turn page • Pinch to zoom';
          }

          if (resetZoomBtn) {
            resetZoomBtn.disabled = !isZoomed && Math.abs(panX) < 1 && Math.abs(panY) < 1;
          }
        }

        function applyZoomTransform(animated) {
          zoomShell.style.transition = animated ? 'transform 180ms ease-out' : 'none';
          zoomShell.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + currentZoom + ')';
          updateZoomUi();
        }

        function resetZoom(animated) {
          currentZoom = 1;
          panX = 0;
          panY = 0;
          applyZoomTransform(animated);
        }

        function pinchDistance(touches) {
          return Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        }

        flipWrapper.addEventListener('touchstart', function(e) {
          if (e.touches.length === 2) {
            isPinching = true;
            isPanning = false;
            pinchStartDist = pinchDistance(e.touches);
            pinchStartScale = currentZoom;
            if (e.cancelable) e.preventDefault();
            return;
          }

          if (e.touches.length === 1 && currentZoom > 1.01) {
            isPanning = true;
            panAnchorX = e.touches[0].clientX - panX;
            panAnchorY = e.touches[0].clientY - panY;
            if (e.cancelable) e.preventDefault();
          }
        }, { passive: false });

        flipWrapper.addEventListener('touchmove', function(e) {
          if (e.touches.length === 2 && isPinching) {
            const dist = pinchDistance(e.touches);
            if (pinchStartDist > 0) {
              currentZoom = clampZoom(pinchStartScale * (dist / pinchStartDist));
              clampPan();
              applyZoomTransform(false);
            }
            if (e.cancelable) e.preventDefault();
            return;
          }

          if (e.touches.length === 1 && isPanning && currentZoom > 1.01) {
            panX = e.touches[0].clientX - panAnchorX;
            panY = e.touches[0].clientY - panAnchorY;
            clampPan();
            applyZoomTransform(false);
            if (e.cancelable) e.preventDefault();
          }
        }, { passive: false });

        flipWrapper.addEventListener('touchend', function(e) {
          if (e.touches.length < 2) {
            isPinching = false;
            pinchStartDist = 0;
          }

          if (e.touches.length === 1 && currentZoom > 1.01) {
            isPanning = true;
            panAnchorX = e.touches[0].clientX - panX;
            panAnchorY = e.touches[0].clientY - panY;
          } else {
            isPanning = false;
          }

          if (e.touches.length === 0 && currentZoom < 1.02) {
            resetZoom(true);
          } else {
            clampPan();
            applyZoomTransform(false);
          }
        }, { passive: false });

        flipWrapper.addEventListener('touchcancel', function() {
          isPinching = false;
          isPanning = false;
          clampPan();
          applyZoomTransform(false);
        }, { passive: true });

        flipWrapper.addEventListener('wheel', function(e) {
          if (!e.ctrlKey) return;
          const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
          currentZoom = clampZoom(currentZoom + zoomStep);
          if (currentZoom === 1) {
            panX = 0;
            panY = 0;
          }
          clampPan();
          applyZoomTransform(false);
          if (e.cancelable) e.preventDefault();
        }, { passive: false });

        if (resetZoomBtn) {
          resetZoomBtn.addEventListener('click', function() {
            resetZoom(true);
          });
        }

        resetZoom(false);
        // ────────────────────────────────────────────────────────────
        
      } catch(err) {
        console.error('Flip book error:', err);
        const ld = document.getElementById('flipbook-loading');
        if (ld) ld.remove();
        flipbookContainer.style.visibility = 'visible';
        flipbookContainer.style.position = 'relative';
        flipbookContainer.innerHTML = buildReaderFallback('Failed to load the chapter PDF in the in-app reader.');
      }
    } else {
      const ld = document.getElementById('flipbook-loading');
      if (ld) ld.remove();
      flipbookContainer.style.visibility = 'visible';
      flipbookContainer.style.position = 'relative';
      flipbookContainer.innerHTML = buildReaderFallback('The PDF engine did not load correctly. Please refresh or open the PDF directly.');
    }

    // ── Day labels & header highlight ──────────────────────────────
    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const nowPkt = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5));
    const jsDay = nowPkt.getDay();
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon...6=Sun

    // Populate Table with styled headers
    let htmlContent = '<tr class="day-header-row"><th class="question-cell"></th>' +
      DAY_NAMES.map((d, i) =>
        '<th class="day-col-header' + (i === todayIdx ? ' today-col' : '') + '" data-day-col="' + i + '">' + d + (i === todayIdx ? '<div class="today-dot"></div>' : '') + '</th>'
      ).join('') + '</tr>';

    let rowIndex = 0;
    chapData.sections.forEach(section => {
      htmlContent += '<tr class="group-header"><td colspan="8">' + section.heading + '</td></tr>';
      section.questions.forEach(q => {
        htmlContent += '<tr>' +
          '<td class="question-cell">' + q + '</td>' +
          [0,1,2,3,4,5,6].map(dayIdx =>
            '<td class="interactive-cell' + (dayIdx === todayIdx ? ' today-cell' : '') + '" data-row="' + rowIndex + '" data-day="' + dayIdx + '"></td>'
          ).join('') +
        '</tr>';
        rowIndex++;
      });
    });
    gridEl.innerHTML = htmlContent;

    setupInteractiveCells();


    function setupInteractiveCells() {
      const states = ['', 'yes', 'no'];
      const icons = {
        '': '',
        'yes': '<i class="fas fa-check-circle text-success animate__animated animate__bounceIn"></i>',
        'no':  '<i class="fas fa-times-circle text-danger animate__animated animate__bounceIn"></i>'
      };
      const iconsStatic = {
        '': '', 'yes': '<i class="fas fa-check-circle text-success"></i>', 'no': '<i class="fas fa-times-circle text-danger"></i>'
      };

      // ── Auto-day-save: draft key per chapter+day ──
      const draftKey = (uid, chapId, dayIdx) => 'draft_' + uid + '_' + chapId + '_d' + dayIdx;

      function checkAllDaysFilled() {
        // For each of the 7 days, check if at least 1 cell has yes/no
        let filledDays = 0;
        for (let d = 0; d < 7; d++) {
          const dayCells = document.querySelectorAll('.interactive-cell[data-day="' + d + '"]');
          let dayHasAnswer = false;
          dayCells.forEach(c => { if (parseInt(c.dataset.stateIndex) > 0) dayHasAnswer = true; });
          if (dayHasAnswer) filledDays++;
        }
        const saveBtn = document.getElementById('saveProgressBtn');
        if (saveBtn) {
          if (filledDays >= 7) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.pointerEvents = '';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Submit for Review (All 7 Days Done ✓)';
          } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.45';
            saveBtn.style.pointerEvents = 'none';
            saveBtn.innerHTML = '<i class="fas fa-lock"></i> Fill All 7 Days to Submit (' + filledDays + '/7)';
          }
        }
      }

      async function autosaveDraft(dayIdx) {
        if (!hasLearner()) return;
        const dayCells = document.querySelectorAll('.interactive-cell[data-day="' + dayIdx + '"]');
        const dayData = [];
        dayCells.forEach(c => dayData.push(parseInt(c.dataset.stateIndex) || 0));
        const parentNote = document.getElementById('parentNote_' + dayIdx);
        const noteVal = parentNote ? parentNote.value : '';
        const key = draftKey(learnerUid(), chapterId, dayIdx);
        try {
          await setDoc(doc(db, 'activity_drafts', key), Object.assign(acOwnership(identity), {
            chapter_id: chapterId,
            book_id: currentBook,
            day_index: dayIdx,
            cells: dayData,
            parentNote: noteVal,
            savedAt: new Date().toISOString()
          }), { merge: true });
        } catch(e) { console.warn('Draft save failed', e); }
      }

      async function autosaveMeta() {
        if (!hasLearner()) return;
        const discAns = document.getElementById('discussionAnswer').value;
        const key = 'draft_' + learnerUid() + '_' + chapterId + '_meta';
        try {
          await setDoc(doc(db, 'activity_drafts', key), Object.assign(acOwnership(identity), {
            chapter_id: chapterId,
            discussionAnswer: discAns,
            savedAt: new Date().toISOString()
          }), { merge: true });
        } catch(e) { console.warn('Meta draft save failed', e); }
      }

      const discInput = document.getElementById('discussionAnswer');
      if (discInput) {
         discInput.addEventListener('input', () => {
            clearTimeout(discInput._saveTimer);
            discInput._saveTimer = setTimeout(() => autosaveMeta(), 1500);
         });
      }

      // ── Style: today column bright, past columns tinted, future locked ──
      const isIndividual = currentUser && currentUser.role === 'individual';

      document.querySelectorAll('.interactive-cell').forEach(cell => {
        cell.dataset.stateIndex = '0';
        const cellDay = parseInt(cell.dataset.day);

        if (isIndividual || cellDay === todayIdx) {
          // INDIVIDUAL or TODAY — fully interactive
          cell.style.background = (cellDay === todayIdx) ? 'rgba(214,54,120,0.06)' : 'rgba(240,240,240,0.3)';
          cell.style.opacity = '1';
          cell.style.pointerEvents = 'auto';
          if (isIndividual && cellDay !== todayIdx) cell.title = 'Available (Independent Learner)';
        } else if (cellDay < todayIdx) {
          // PAST — show saved data but lock new input
          cell.style.background = '#f8f9fa';
          cell.style.opacity = '0.7';
          cell.style.pointerEvents = 'none';
          cell.title = 'Already saved';
        } else {
          // FUTURE — fully locked
          cell.style.opacity = '0.25';
          cell.style.pointerEvents = 'none';
          cell.title = 'Available on ' + ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][cellDay];
        }

        if (isIndividual || cellDay === todayIdx) {
          cell.addEventListener('click', function() {
            let currentIdx = parseInt(this.dataset.stateIndex);
            let nextIdx = (currentIdx + 1) % 3;
            this.dataset.stateIndex = nextIdx.toString();
            this.innerHTML = icons[states[nextIdx]];
            if (nextIdx !== 0) {
              this.style.transform = 'scale(1.2)';
              setTimeout(() => this.style.transform = '', 200);
            }
            checkAllDaysFilled();
            // Debounced autosave
            clearTimeout(cell._saveTimer);
            cell._saveTimer = setTimeout(() => autosaveDraft(cellDay), 1200);
          });
        }
      });

      // ── Parent notes: lock non-today rows ──
      document.querySelectorAll('.parent-input').forEach((input, idx) => {
        if (!isIndividual && idx !== todayIdx) {
          if (idx < todayIdx) {
            input.disabled = true;
            input.style.background = '#f8f9fa';
          } else {
            input.disabled = true;
            input.style.opacity = '0.3';
            input.placeholder = 'Locked';
          }
        } else {
          input.disabled = false;
          input.style.opacity = '1';
          input.addEventListener('input', () => {
            clearTimeout(input._saveTimer);
            input._saveTimer = setTimeout(() => autosaveDraft(idx), 1500);
          });
        }
      });

      // ── Auto-scroll table to today's column ──
      window.scrollToTodayColumn = () => {
        const todayHeader = document.querySelector('.day-col-header[data-day-col="' + todayIdx + '"]');
        const tableWrapper = document.querySelector('.activity-table-wrapper');
        if (todayHeader && tableWrapper) {
          const headerLeft = todayHeader.offsetLeft;
          const wrapperWidth = tableWrapper.clientWidth;
          tableWrapper.scrollLeft = Math.max(0, headerLeft - (wrapperWidth * 0.3));
        }
        // Also scroll page to table
        const tableEl = document.querySelector('.activity-table-wrapper');
        if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      setTimeout(() => {
        window.scrollToTodayColumn();
      }, 400);

      checkAllDaysFilled();
    }

    // Drops the teacher's written feedback in above the activity, so a student
    // reopening a sent-back sheet sees what to fix before touching anything.
    function showTeacherNote(note, isRedo) {
      const host = document.getElementById('activityContainer') || document.body;
      const box = document.createElement('div');
      box.className = 'alert ' + (isRedo ? 'alert-danger' : 'alert-success') + ' shadow-sm';
      box.style.borderRadius = '14px';
      box.innerHTML =
        '<strong><i class="fas fa-' + (isRedo ? 'redo' : 'star') + '"></i> ' +
        (isRedo ? 'Your teacher asked you to fix this:' : 'Note from your teacher:') +
        '</strong><div style="margin-top:0.4rem;"></div>';
      box.lastChild.textContent = note;
      host.insertBefore(box, host.firstChild);
    }

    // CHECK FOR EXISTING SUBMISSION from Firebase
    const submissionId = hasLearner() ? (learnerUid() + '_' + chapterId) : null;
    let existingSub = null;

    if (submissionId) {
      try {
        const subSnap = await getDoc(doc(db, "activity_submissions", submissionId));
        if (subSnap.exists()) {
          existingSub = subSnap.data();
        }
      } catch(e) { console.error("Error fetching submission", e); }
    }

    // ── Load existing day drafts (if no final submission yet) ──
    if (!existingSub && hasLearner()) {
      try {
        const iconListD = {
          0: '', 1: '<i class="fas fa-check-circle text-success"></i>', 2: '<i class="fas fa-times-circle text-danger"></i>'
        };
        for (let d = 0; d < 7; d++) {
          const dKey = 'draft_' + learnerUid() + '_' + chapterId + '_d' + d;
          const dSnap = await getDoc(doc(db, 'activity_drafts', dKey));
          if (dSnap.exists()) {
            const dData = dSnap.data();
            if (dData.cells) {
              const dayCells = document.querySelectorAll('.interactive-cell[data-day="' + d + '"]');
              dData.cells.forEach((stIdx, ci) => {
                if (dayCells[ci]) {
                  dayCells[ci].dataset.stateIndex = String(stIdx);
                  dayCells[ci].innerHTML = iconListD[stIdx] || '';
                }
              });
            }
            if (dData.parentNote !== undefined) {
              const pInput = document.getElementById('parentNote_' + d);
              if (pInput) pInput.value = dData.parentNote;
            }
          }
        }

        // Load meta draft (discussion answer)
        const metaKey = 'draft_' + learnerUid() + '_' + chapterId + '_meta';
        const metaSnap = await getDoc(doc(db, 'activity_drafts', metaKey));
        if (metaSnap.exists()) {
           const mData = metaSnap.data();
           if (mData.discussionAnswer) {
              const discEl = document.getElementById('discussionAnswer');
              if (discEl && !discEl.value) discEl.value = mData.discussionAnswer;
           }
        }

        // Re-check submit button after loading drafts
        const allCells7 = document.querySelectorAll('.interactive-cell');
        const checkFilled = () => {
          let filled = 0;
          for (let d = 0; d < 7; d++) {
            const dc = document.querySelectorAll('.interactive-cell[data-day="' + d + '"]');
            let has = false;
            dc.forEach(c => { if (parseInt(c.dataset.stateIndex) > 0) has = true; });
            if (has) filled++;
          }
          const sb = document.getElementById('saveProgressBtn');
          if (sb) {
            sb.disabled = filled < 7;
            sb.style.opacity = filled < 7 ? '0.45' : '1';
            sb.style.pointerEvents = filled < 7 ? 'none' : '';
            sb.innerHTML = filled < 7
              ? '<i class="fas fa-lock"></i> Fill All 7 Days to Submit (' + filled + '/7)'
              : '<i class="fas fa-save"></i> Submit for Review (All 7 Days Done \u2713)';
          }
        };
        checkFilled();
      } catch(e) { console.warn('Draft load error', e); }
    }

    await recordAttendance(existingSub ? 'revisit' : 'started', {
      existingSubmission: !!existingSub
    });

    
    // A sheet the teacher sent back is the one case where a saved submission
    // must NOT lock the page — the whole point is that the student edits it and
    // submits again. Everything below reads this instead of a bare truthy
    // check on existingSub.
    const needsRedo = !!existingSub && existingSub.reviewStatus === 'needs_redo';
    const isLocked = !!existingSub && !needsRedo;

    if (existingSub && existingSub.teacherNotes) {
      showTeacherNote(existingSub.teacherNotes, needsRedo);
    }

    if (existingSub) {
      // Pre-fill text
      document.getElementById('discussionAnswer').value = existingSub.discussionText || '';
      document.getElementById('discussionAnswer').disabled = isLocked;
      document.getElementById('discussionAnswer').style.background = isLocked ? '#f8fafc' : '';

      // Pre-fill parents
      for(let i=0; i<7; i++) {
        let pInput = document.getElementById('parentNote_' + i);
        pInput.value = (existingSub.parentNotes && existingSub.parentNotes[i]) ? existingSub.parentNotes[i] : '';
        pInput.disabled = isLocked;
        pInput.style.background = isLocked ? '#f8fafc' : '';
      }
      
      // Pre-fill grid cells
      if(existingSub.gridState && existingSub.gridState.cells) {
        const statesList = ['', 'yes', 'no'];
        const iconList = {
          '': '',
          'yes': '<i class="fas fa-check-circle text-success"></i>',
          'no': '<i class="fas fa-times-circle text-danger"></i>'
        };
        let cells = document.querySelectorAll('.interactive-cell');
        existingSub.gridState.cells.forEach((stIdx, idx) => {
           if(cells[idx]) {
              cells[idx].dataset.stateIndex = stIdx;
              cells[idx].innerHTML = iconList[statesList[stIdx]];
              if (isLocked) cells[idx].style.pointerEvents = 'none';
           }
        });
      }

      // Update Save Button Visuals
      const saveBtn = document.getElementById('saveProgressBtn');
      const approvedList = state.teacher_approved || [];
      if (needsRedo) {
         saveBtn.className = 'btn btn-danger fw-bold p-3 w-100 rounded-pill fs-5 shadow-sm';
         saveBtn.innerHTML = '<i class="fas fa-redo"></i> Fix &amp; Submit Again';
      } else if(approvedList.includes(chapterId)) {
         saveBtn.className = 'btn btn-success fw-bold p-3 w-100 rounded-pill fs-5 shadow-sm';
         saveBtn.innerHTML = '<i class="fas fa-check-double"></i> Task Completed & Approved (50 ⭐)';
      } else {
         saveBtn.className = 'btn btn-warning fw-bold p-3 w-100 rounded-pill fs-5 shadow-sm bg-warning text-dark border-0';
         saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Currently Pending Review...';
      }
      if (!needsRedo) {
        saveBtn.style.pointerEvents = 'none';
        document.getElementById('saveAlert').style.display = 'none';
      }
    }

    // Phase Transition Logic
    document.getElementById('finishReadingBtn').addEventListener('click', () => {
      document.getElementById('readingContainer').classList.add('animate__animated', 'animate__fadeOut');
      setTimeout(() => {
        document.getElementById('readingContainer').classList.add('hidden');
        document.getElementById('readingContainer').classList.remove('reading-container');
        document.getElementById('mainHeader').classList.remove('hidden');
        document.getElementById('mainHeader').classList.add('animate__animated', 'animate__fadeIn');
        document.getElementById('activityContainer').classList.remove('hidden');
        document.getElementById('activityContainer').classList.add('animate__animated', 'animate__fadeInUp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(window.scrollToTodayColumn) {
          setTimeout(window.scrollToTodayColumn, 300);
        }
      }, 500);
    });

    // Parent Gate UI and Logic
    let parentGateData = [];
    let parentGateCurrentDay = 0;
    let parentGateReadDays = new Set();
    let parentGateStartIndex = 0;

    async function showParentGateModal(onComplete) {
      try {
        const res = await fetch('/kidba_assets/data/chapters_data.json');
        if (!res.ok) throw new Error('Failed to fetch chapters');
        const allDays = await res.json();
        
        parentGateStartIndex = state.parent_content_index || 0;
        parentGateData = allDays.slice(parentGateStartIndex, parentGateStartIndex + 7);
        
        if (parentGateData.length === 0) {
          onComplete(); // No more content
          return;
        }
        
        parentGateCurrentDay = 0;
        parentGateReadDays.clear();
        renderParentGate(onComplete);
        
      } catch (err) {
        console.error("Failed to load parent content", err);
        onComplete();
      }
    }

    function renderParentGate(onComplete) {
      if (document.getElementById('parentGateOverlay')) return;

      const overlay = document.createElement('div');
      overlay.className = 'parent-gate-overlay animate__animated animate__fadeIn';
      overlay.id = 'parentGateOverlay';
      
      let tabsHtml = '';
      parentGateData.forEach((d, i) => {
        tabsHtml += '<div class="pg-day-tab ' + (i===0?'active':'') + '" data-idx="' + i + '">Day ' + (i+1) + '</div>';
      });
      
      overlay.innerHTML = 
        '<div class="parent-gate-modal animate__animated animate__zoomIn">' +
          '<div class="pg-header">' +
            '<h2><i class="fas fa-users"></i> Family Sync Time</h2>' +
            '<p>Parents: Please review these ' + parentGateData.length + ' daily lessons with your child to unlock submission.</p>' +
          '</div>' +
          '<div class="pg-body">' +
            '<div class="pg-sidebar">' +
              tabsHtml +
            '</div>' +
            '<div class="pg-content" id="pgContentPane">' +
            '</div>' +
          '</div>' +
          '<div class="pg-footer">' +
            '<div class="pg-status" id="pgStatusText"><strong>0</strong> of ' + parentGateData.length + ' read</div>' +
            '<div>' +
              '<button class="pg-btn pg-btn-read" id="pgMarkReadBtn">Mark as Read <i class="fas fa-check"></i></button>' +
              '<button class="pg-btn pg-btn-submit" id="pgSubmitBtn">Complete & Submit Activity <i class="fas fa-rocket"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      document.body.appendChild(overlay);
      updateParentGateContent();
      
      document.querySelectorAll('.pg-day-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          document.querySelectorAll('.pg-day-tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          parentGateCurrentDay = parseInt(e.target.dataset.idx);
          updateParentGateContent();
        });
      });
      
      document.getElementById('pgMarkReadBtn').addEventListener('click', () => {
        parentGateReadDays.add(parentGateCurrentDay);
        const activeTab = document.querySelector('.pg-day-tab.active');
        activeTab.classList.add('read');
        
        document.getElementById('pgStatusText').innerHTML = '<strong>' + parentGateReadDays.size + '</strong> of ' + parentGateData.length + ' read';
        
        if (parentGateReadDays.size === parentGateData.length) {
          document.getElementById('pgMarkReadBtn').style.display = 'none';
          document.getElementById('pgSubmitBtn').classList.add('show');
        } else {
          for (let i = 0; i < parentGateData.length; i++) {
            if (!parentGateReadDays.has(i)) {
              parentGateCurrentDay = i;
              document.querySelectorAll('.pg-day-tab').forEach(t => t.classList.remove('active'));
              document.querySelector('.pg-day-tab[data-idx="' + i + '"]').classList.add('active');
              updateParentGateContent();
              break;
            }
          }
        }
      });
      
      document.getElementById('pgSubmitBtn').addEventListener('click', () => {
        state.parent_content_index = parentGateStartIndex + parentGateData.length;
        
        overlay.classList.replace('animate__fadeIn', 'animate__fadeOut');
        const modal = overlay.querySelector('.parent-gate-modal');
        modal.classList.replace('animate__zoomIn', 'animate__zoomOut');
        
        setTimeout(() => {
          overlay.remove();
          onComplete();
        }, 500);
      });
    }

    function updateParentGateContent() {
      const ch = parentGateData[parentGateCurrentDay];
      const pane = document.getElementById('pgContentPane');
      
      let htmlStr = '<h3 class="pg-topic">' + (ch.valueEmoji || '') + ' ' + ch.title + '</h3>';
      if (ch.intro) htmlStr += '<p style="font-size:1.1rem; color:#475569; margin-bottom:20px; line-height:1.6;">' + ch.intro + '</p>';
      
      if (ch.quranText || ch.hadithText) {
        htmlStr += '<div style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;">';
        if (ch.quranText) {
          htmlStr += '<div class="pg-section" style="flex:1; min-width:250px; border-left-color:#10b981; background:#ecfdf5; margin-bottom:0;">' +
            "<h4>📖 Qur'an " + (ch.quranSurah ? '(' + ch.quranSurah + ')' : '') + '</h4>' +
            '<p>' + ch.quranText + '</p>' +
          '</div>';
        }
        if (ch.hadithText) {
          htmlStr += '<div class="pg-section" style="flex:1; min-width:250px; border-left-color:#3b82f6; background:#eff6ff; margin-bottom:0;">' +
            '<h4>🕌 Hadith</h4>' +
            '<p>' + ch.hadithText + '</p>' +
          '</div>';
        }
        htmlStr += '</div>';
      }
      
      if (ch.story && ch.story.length > 0) {
        htmlStr += '<div class="pg-section" style="border-left-color:#cf296d; background:#fdf2f8;">' +
          '<h4>📚 ' + (ch.storyTitle || 'Story Time') + '</h4>' +
          ch.story.map(p => '<p style="margin-bottom:10px; line-height:1.6;">' + p + '</p>').join('') +
        '</div>';
      }
      
      if (ch.reflection) {
        htmlStr += '<div class="pg-section" style="border-left-color:#8b5cf6; background:#f5f3ff;">' +
          '<h4>💡 Reflection</h4>' +
          '<p style="line-height:1.6;">' + ch.reflection + '</p>' +
        '</div>';
      }
      
      if (ch.parentTip) {
        htmlStr += '<div class="pg-section" style="border-left-color:#f59e0b; background:#fffbeb;">' +
          '<h4>👨‍👩‍👧 Parenting Tip</h4>' +
          '<p style="line-height:1.6; font-weight:600; color:#92400e;">' + ch.parentTip + '</p>' +
        '</div>';
      }
      
      pane.innerHTML = htmlStr;
      pane.scrollTop = 0;
      
      const markBtn = document.getElementById('pgMarkReadBtn');
      if (parentGateReadDays.has(parentGateCurrentDay)) {
        markBtn.style.display = 'none';
      } else {
        markBtn.style.display = 'inline-block';
      }
    }

    async function performActivitySave() {
      const alertBox = document.getElementById('saveAlert');
      const saveBtn = document.getElementById('saveProgressBtn');

      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveBtn.style.pointerEvents = 'none';
      
      // Extract Submission Data
      const discussionText = document.getElementById('discussionAnswer').value;
      const parentNotes = [];
      for(let i=0; i<7; i++) {
        parentNotes.push(document.getElementById('parentNote_' + i).value);
      }
      
      const gridState = { yes: 0, no: 0, total: 0, cells: [] };
      const states = ['', 'yes', 'no'];
      document.querySelectorAll('.interactive-cell').forEach(cell => {
        gridState.total++;
        let stateIdx = parseInt(cell.dataset.stateIndex);
        gridState.cells.push(stateIdx);
        if(states[stateIdx] === 'yes') gridState.yes++;
        if(states[stateIdx] === 'no') gridState.no++;
      });
      
      const submissionData = Object.assign(acOwnership(identity), {
        student_name: currentUser.name || 'Student',
        school_id: currentUser.school_id || '',
        chapter_id: chapterId,
        chapter_title: chapData.title,
        book_id: currentBook,
        discussionText: discussionText,
        gridState: gridState,
        parentNotes: parentNotes,
        activityStartedAt: attendanceStartedAt,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Straight to the teacher. This used to be 'waiting_parent', and that
        // one word was the entire parent-approval stage: the teacher's queue
        // skipped anything a parent had not signed off, so work sat invisible
        // until someone logged into a second account. Parents now read the
        // outcome instead of standing in the way of it.
        reviewStatus: currentUser.role === 'individual' ? 'teacher_approved' : 'pending_teacher',
        teacherApprovedAt: currentUser.role === 'individual' ? new Date().toISOString() : null
      });

      const activityCompletedAt = new Date().toISOString();
      const activityDurationSeconds = Math.max(1, Math.round((Date.now() - pageOpenedAtMs) / 1000));
      submissionData.activityCompletedAt = activityCompletedAt;
      submissionData.activityDurationSeconds = activityDurationSeconds;
      
      try {
        // Save to Firebase activity_submissions
        await setDoc(doc(db, "activity_submissions", submissionId), submissionData);
        await recordAttendance('completed', {
          activityCompletedAt: activityCompletedAt,
          activityDurationSeconds: activityDurationSeconds,
          existingSubmission: !!existingSub
        });

        if (currentUser.role === 'individual') {
           if (!state.completed.includes(chapterId)) state.completed.push(chapterId);
           if (!state.parent_approved) state.parent_approved = [];
           if (!state.teacher_approved) state.teacher_approved = [];
           
           if (!state.parent_approved.includes(chapterId)) state.parent_approved.push(chapterId);
           if (!state.teacher_approved.includes(chapterId)) {
               state.teacher_approved.push(chapterId);
               state.points = (state.points || 0) + 50;
               state.unlockedCount = (state.unlockedCount || 1) + 1;
           }
           await updateDoc(doc(db, "users", learnerUid()), { game_state: state });
           
           alertBox.innerHTML = '<i class="fas fa-star text-warning"></i> Task Completed! You earned 50 points!<br><a href="/student-activities" class="btn btn-sm btn-success mt-3">Back to Dashboard</a>';
        } else {
           // Add to completed (Pending Review) in game state
           if (!state.completed.includes(chapterId)) {
             state.completed.push(chapterId);
             await updateDoc(doc(db, "users", learnerUid()), { game_state: state });
           }
           alertBox.innerHTML = '<i class="fas fa-clock text-warning"></i> Chapter task submitted! Waiting for <b>Review</b>.<br><a href="/student-activities" class="btn btn-sm btn-success mt-3">Back to Dashboard</a>';
        }

        alertBox.style.display = 'block';
        alertBox.classList.add('animate__animated', 'animate__tada');
        saveBtn.style.display = 'none';
        
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      } catch (err) {
        console.error("Save Error:", err);
        alert("There was an error saving your progress. Please try again.");
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Submit for Review';
        saveBtn.style.pointerEvents = 'auto';
      }
    }

    // Save Button Logic (Gamification)
    document.getElementById('saveProgressBtn').addEventListener('click', async () => {
      // submissionId is already null without a learner, but say so directly:
      // everything below stamps ownership onto the sheet and must never run
      // against an unresolved identity.
      if (!hasLearner() || !submissionId) {
        showAuthRequiredOverlay();
        return;
      }

      // If Individual and NOT revisiting an already submitted one, show the Parent Gate!
      if (currentUser.role === 'individual' && !existingSub) {
        showParentGateModal(() => {
          performActivitySave();
        });
      } else {
        performActivitySave();
      }
    });

  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const isCap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      if (isCap && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.removeAllListeners('backButton');
        window.Capacitor.Plugins.App.addListener('backButton', () => {
          window.location.href = 'student-activities.html';
        });
      }
    }, 1000);
  });
</script>
`
