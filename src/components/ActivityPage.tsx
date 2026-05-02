import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'
import { firebaseConfigJS } from '../lib/firebaseConfig'

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
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    padding: 2rem;
    position: relative;
    max-width: 900px;
    margin: 0 auto 2rem auto;
    text-align: center;
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
    transform-origin: top center;
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
  .interactive-cell:hover {
    background: rgba(255,255,255,0.8);
    transform: scale(1.1);
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
    <div class="d-flex justify-content-between align-items-center mb-4">
      <a href="./student-activities" class="btn btn-outline-secondary rounded-pill"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
      <h2 style="font-family: 'Fredoka One', cursive; color: #ff6b6b; margin: 0;" id="pageTitleLoading">Loading...</h2>
      <div style="width: 150px;"></div> <!-- Spacer -->
    </div>

    <!-- Phase 1: Reading Phase -->
    <div class="reading-container" id="readingContainer">
      <div class="chapter-ribbon" style="background:#0ea5e9;">Reading Phase</div>
      <h3 style="font-family: 'Fredoka One', cursive; color: #333; margin-top:30px;">Read the Chapter</h3>
      <p class="text-muted mb-4 fs-5" id="pageRangeInstructions">Please read the pages below to complete this chapter. When you're done, click the button to start your activities.</p>
      
      <div class="flipbook-wrapper" id="flipbook-wrapper">
        <div class="flipbook-zoom-shell" id="flipbook-zoom-shell">
          <div class="flipbook-container" id="flipbook-container"></div>
        </div>
        <div class="flipbook-nav" id="flipbook-nav" style="display:none;">
          <button id="flipPrevBtn" title="Previous Page"><i class="fas fa-chevron-left"></i></button>
          <span class="flipbook-page-indicator" id="flipPageIndicator">Page 1</span>
          <button id="flipNextBtn" title="Next Page"><i class="fas fa-chevron-right"></i></button>
          <button id="flipResetZoomBtn" class="zoom-reset-btn" title="Reset Zoom" disabled><i class="fas fa-search-minus"></i></button>
        </div>
        <div class="flipbook-hint" id="flipbook-hint"><i class="fas fa-hand-pointer"></i> Swipe to turn page • Pinch to zoom</div>
      </div>
      
      <button class="save-btn" id="finishReadingBtn" style="background: #0ea5e9;">
        I finished reading <i class="fas fa-arrow-right"></i>
      </button>
    </div>

    <!-- Phase 2: Activity Phase -->
    <div class="activity-container hidden" id="activityContainer">
      <div class="chapter-ribbon" id="chapRibbon">Loading...</div>

      <div class="discussion-header">
        DISCUSSION QUESTION <i class="fas fa-question-circle text-warning"></i>
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
        <div class="parent-row"><div class="parent-day">Mon</div><input type="text" id="parentNote_0" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Tue</div><input type="text" id="parentNote_1" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Wed</div><input type="text" id="parentNote_2" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Thu</div><input type="text" id="parentNote_3" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Fri</div><input type="text" id="parentNote_4" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Sat</div><input type="text" id="parentNote_5" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Sun</div><input type="text" id="parentNote_6" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
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
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = ${raw(firebaseConfigJS)};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const urlParams = new URLSearchParams(window.location.search);
  const currentBook = urlParams.get('book') || 'book1';
  const currentChap = urlParams.get('chapter') || 'chapter1';
  const pageOpenedAtMs = Date.now();
  const attendanceSessionSeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  
  let currentUser = null;
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
        }
      } catch(e) {
        console.error(e);
      }
    }

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
    attendanceSessionId = currentUser ? (currentUser.uid + '_' + chapterId + '_' + attendanceSessionSeed) : null;
    attendanceStartedAt = new Date(pageOpenedAtMs).toISOString();

    async function recordAttendance(status, extraData = {}) {
      if (!currentUser || !attendanceSessionId) return;

      const attendancePayload = {
        student_uid: currentUser.uid,
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
      };

      try {
        await setDoc(doc(db, "activity_attendance", attendanceSessionId), attendancePayload, { merge: true });
      } catch (attendanceErr) {
        console.error("Attendance tracking error:", attendanceErr);
      }
    }
    
    // Populate Header
    titleEl.textContent = chapData.title;
    ribbonEl.textContent = "Activities for " + currentChap.replace('chapter', 'Chapter ');
    discEl.textContent = chapData.discussionQuestion;

    // Load specific PDF pages using pdf.js
    const pageInstructions = document.getElementById('pageRangeInstructions');
    if (pageInstructions && chapData.pageStart && chapData.pageEnd) {
       pageInstructions.innerHTML = \`<strong>Required Reading: Page \${chapData.pageStart} to \${chapData.pageEnd}.</strong><br> Flip through the pages below. When you're done, click the button to start your activities.\`;
    }

    const pdfFileUrl = '/' + currentBook + '.pdf';
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
      const wrapperWidth = document.getElementById('flipbook-wrapper').clientWidth || 800;
      const isMobile = window.innerWidth < 768;
      const pageWidth = isMobile ? Math.min(wrapperWidth - 28, 380) : Math.min(wrapperWidth - 70, 760);
      const pageHeight = Math.round(pageWidth * 1.33);
      const totalPages = end - start + 1;
      const swipeThreshold = isMobile ? 42 : 56;
      const renderedPages = new Map();
      const readerStage = document.createElement('div');
      const readerPage = document.createElement('div');
      const prevBtn = document.getElementById('flipPrevBtn');
      const nextBtn = document.getElementById('flipNextBtn');
      const pageIndicator = document.getElementById('flipPageIndicator');
      let activePage = start;
      let renderingPage = false;
      let transitioningPage = false;
      let swipeStartX = null;
      let swipeStartY = null;
      let swipeDeltaX = 0;
      let swipeAxis = '';

      readerStage.className = 'pdf-reader-stage';
      readerPage.className = 'pdf-reader-page';
      readerPage.style.width = pageWidth + 'px';
      readerPage.style.minHeight = pageHeight + 'px';
      readerStage.appendChild(readerPage);

      flipbookContainer.innerHTML = '';
      flipbookContainer.style.width = '100%';
      flipbookContainer.style.height = 'auto';
      flipbookContainer.style.visibility = 'visible';
      flipbookContainer.style.position = 'relative';
      flipbookContainer.appendChild(readerStage);
      flipbookNav.style.display = 'flex';
      if (flipbookHint) {
        flipbookHint.innerHTML = '<i class="fas fa-hand-pointer"></i> Swipe or tap the arrows to turn the page';
      }

      function updateNav() {
        const pageIndex = activePage - start + 1;
        pageIndicator.textContent = 'Page ' + pageIndex + ' / ' + totalPages;
        prevBtn.disabled = activePage <= start;
        nextBtn.disabled = activePage >= end;
      }

      function resetSwipePreview(animateBack) {
        swipeDeltaX = 0;
        if (animateBack) {
          readerPage.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
          readerPage.style.transform = 'rotateY(0deg) scale(1)';
          readerPage.style.opacity = '1';
          window.setTimeout(function() {
            readerPage.style.transition = '';
            readerStage.style.perspective = '';
          }, 210);
          return;
        }

        readerPage.style.transition = '';
        readerPage.style.transform = '';
        readerPage.style.opacity = '';
        readerStage.style.perspective = '';
      }

      function applySwipeTurnPreview(deltaX) {
        const progress = Math.max(-1, Math.min(1, deltaX / 250));
        readerStage.style.perspective = '1500px';
        readerPage.style.transition = '';
        readerPage.style.transformOrigin = 'center';
        readerPage.style.transform = 'rotateY(' + (progress * 60) + 'deg) scale(' + (1 - Math.abs(progress) * 0.05) + ')';
        readerPage.style.opacity = String(1 - Math.abs(progress) * 0.2);
      }

      function animatePageTurnOut(direction) {
        if (!direction || !readerPage.firstChild) return Promise.resolve();

        return new Promise(function(resolve) {
          readerStage.style.perspective = '1500px';
          readerPage.style.transition = 'transform 250ms ease-in, opacity 250ms ease-in';
          
          requestAnimationFrame(function() {
            readerPage.style.transformOrigin = 'center';
            readerPage.style.transform = 'rotateY(' + (direction > 0 ? -90 : 90) + 'deg) scale(0.95)';
            readerPage.style.opacity = '0';
          });

          window.setTimeout(function() {
            resolve();
          }, 250);
        });
      }

      function animatePageEntry(direction) {
        if (!direction) {
          resetSwipePreview(false);
          return Promise.resolve();
        }

        return new Promise(function(resolve) {
          readerPage.style.transition = 'none';
          readerPage.style.transformOrigin = 'center';
          readerPage.style.transform = 'rotateY(' + (direction > 0 ? 90 : -90) + 'deg) scale(0.95)';
          readerPage.style.opacity = '0';

          requestAnimationFrame(function() {
            readerPage.style.transition = 'transform 300ms ease-out, opacity 300ms ease-out';
            readerPage.style.transform = 'rotateY(0deg) scale(1)';
            readerPage.style.opacity = '1';
          });

          window.setTimeout(function() {
            readerPage.style.transition = '';
            readerStage.style.perspective = '';
            resolve();
          }, 300);
        });
      }

      async function showPage(pageNumber, direction) {
        if (renderingPage || transitioningPage || pageNumber < start || pageNumber > end) return false;
        renderingPage = true;
        transitioningPage = !!direction;

        if (!readerPage.firstChild) {
          readerPage.innerHTML = '<div class="pdf-reader-loading"><strong>Loading page ' + (pageNumber - start + 1) + '...</strong><div>Please wait while your chapter is rendered.</div></div>';
        }

        try {
          let canvas = renderedPages.get(pageNumber);
          if (!canvas) {
            canvas = await createPdfCanvas(pdf, pageNumber, pageWidth, pageHeight);
            renderedPages.set(pageNumber, canvas);
          }

          if (direction && readerPage.firstChild) {
            await animatePageTurnOut(direction);
          }

          readerPage.innerHTML = '';
          readerPage.appendChild(canvas);
          activePage = pageNumber;
          updateNav();
          await animatePageEntry(direction || 0);
        } catch (pageErr) {
          console.error('PDF page render error:', pageErr);
          readerPage.innerHTML = buildReaderFallback('Page ' + pageNumber + ' could not be rendered.');
        } finally {
          renderingPage = false;
          transitioningPage = false;
          resetSwipePreview(false);
        }

        return true;
      }

      prevBtn.onclick = function() { showPage(activePage - 1, -1); };
      nextBtn.onclick = function() { showPage(activePage + 1, 1); };

      readerStage.addEventListener('touchstart', function(e) {
        if (readerGestureState.zoomScale > 1.01 || renderingPage || transitioningPage || e.touches.length !== 1) return;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeDeltaX = 0;
        swipeAxis = '';
      }, { passive: true });

      readerStage.addEventListener('touchmove', function(e) {
        if (swipeStartX === null || renderingPage || transitioningPage || e.touches.length !== 1) return;
        const moveX = e.touches[0].clientX;
        const moveY = e.touches[0].clientY;
        const deltaX = moveX - swipeStartX;
        const deltaY = moveY - swipeStartY;

        if (!swipeAxis && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
          swipeAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
        }

        if (swipeAxis === 'x') {
          swipeDeltaX = deltaX;
          applySwipeTurnPreview(swipeDeltaX);
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });

      readerStage.addEventListener('touchend', function(e) {
        if (swipeStartX === null || renderingPage || transitioningPage) return;

        const endTouch = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null;
        const deltaX = swipeDeltaX || (endTouch ? (endTouch.clientX - swipeStartX) : 0);
        const finalAxis = swipeAxis;
        swipeStartX = null;
        swipeStartY = null;
        swipeAxis = '';

        if (finalAxis !== 'x' || Math.abs(deltaX) < swipeThreshold) {
          resetSwipePreview(true);
          return;
        }

        if (deltaX < 0) {
          if (activePage >= end) {
            resetSwipePreview(true);
            return;
          }
          showPage(activePage + 1, 1);
        } else {
          if (activePage <= start) {
            resetSwipePreview(true);
            return;
          }
          showPage(activePage - 1, -1);
        }
      }, { passive: true });

      readerStage.addEventListener('touchcancel', function() {
        swipeStartX = null;
        swipeStartY = null;
        swipeAxis = '';
        resetSwipePreview(true);
      }, { passive: true });

      updateNav();
      await showPage(start, 0);
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

    // Populate Table
    let htmlContent = '';
    let rowIndex = 0;
    chapData.sections.forEach(section => {
      htmlContent += '<tr class="group-header"><td colspan="8">' + section.heading + '</td></tr>';
      section.questions.forEach(q => {
        htmlContent += '<tr>' +
          '<td class="question-cell">' + q + '</td>' +
          [0,1,2,3,4,5,6].map(dayIdx => '<td class="interactive-cell" data-row="' + rowIndex + '" data-day="' + dayIdx + '"></td>').join('') +
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
        'no': '<i class="fas fa-times-circle text-danger animate__animated animate__bounceIn"></i>'
      };

      // Get PKT Day (0=Mon...6=Sun)
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pktDate = new Date(utc + (3600000 * 5));
      const jsDay = pktDate.getDay();
      const currentPktDayIndex = jsDay === 0 ? 6 : jsDay - 1;

      document.querySelectorAll('.interactive-cell').forEach(cell => {
        cell.dataset.stateIndex = "0";
        
        const cellDay = parseInt(cell.dataset.day);
        if (cellDay !== currentPktDayIndex) {
          cell.style.opacity = '0.35';
          cell.style.pointerEvents = 'none';
          cell.title = 'Available only on the designated day.';
        }

        cell.addEventListener('click', function() {
          let currentIdx = parseInt(this.dataset.stateIndex);
          let nextIdx = (currentIdx + 1) % 3;
          this.dataset.stateIndex = nextIdx.toString();
          let newState = states[nextIdx];
          this.innerHTML = icons[newState];
          
          if(newState !== '') {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => this.style.transform = '', 200);
          }
        });
      });

        // Disable parent inputs for inactive days
        document.querySelectorAll('.parent-input').forEach((input, idx) => {
          if (idx !== currentPktDayIndex) {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.placeholder = 'Locked for today';
          }
        });
      }

    // CHECK FOR EXISTING SUBMISSION from Firebase
    const submissionId = currentUser ? (currentUser.uid + '_' + chapterId) : null;
    let existingSub = null;
    
    if (currentUser && submissionId) {
      try {
        const subSnap = await getDoc(doc(db, "activity_submissions", submissionId));
        if (subSnap.exists()) {
          existingSub = subSnap.data();
        }
      } catch(e) { console.error("Error fetching submission", e); }
    }

    await recordAttendance(existingSub ? 'revisit' : 'started', {
      existingSubmission: !!existingSub
    });
    
    if (existingSub) {
      // Pre-fill text
      document.getElementById('discussionAnswer').value = existingSub.discussionText || '';
      document.getElementById('discussionAnswer').disabled = true;
      document.getElementById('discussionAnswer').style.background = '#f8fafc';
      
      // Pre-fill parents
      for(let i=0; i<7; i++) {
        let pInput = document.getElementById('parentNote_' + i);
        pInput.value = (existingSub.parentNotes && existingSub.parentNotes[i]) ? existingSub.parentNotes[i] : '';
        pInput.disabled = true;
        pInput.style.background = '#f8fafc';
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
              cells[idx].style.pointerEvents = 'none'; // Lock clicks
           }
        });
      }
      
      // Update Save Button Visuals
      const saveBtn = document.getElementById('saveProgressBtn');
      const approvedList = state.teacher_approved || [];
      if(approvedList.includes(chapterId)) {
         saveBtn.className = 'btn btn-success fw-bold p-3 w-100 rounded-pill fs-5 shadow-sm';
         saveBtn.innerHTML = '<i class="fas fa-check-double"></i> Task Completed & Approved (50 ⭐)';
      } else {
         saveBtn.className = 'btn btn-warning fw-bold p-3 w-100 rounded-pill fs-5 shadow-sm bg-warning text-dark border-0';
         saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Currently Pending Review...';
      }
      saveBtn.style.pointerEvents = 'none';
      document.getElementById('saveAlert').style.display = 'none';
    }

    // Phase Transition Logic
    document.getElementById('finishReadingBtn').addEventListener('click', () => {
      document.getElementById('readingContainer').classList.add('animate__animated', 'animate__fadeOutUp');
      setTimeout(() => {
        document.getElementById('readingContainer').classList.add('hidden');
        document.getElementById('activityContainer').classList.remove('hidden');
        document.getElementById('activityContainer').classList.add('animate__animated', 'animate__fadeInUp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
      
      const submissionData = {
        student_uid: currentUser.uid,
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
        reviewStatus: currentUser.role === 'individual' ? 'teacher_approved' : 'waiting_parent',
        parentApprovedAt: currentUser.role === 'individual' ? new Date().toISOString() : null,
        teacherApprovedAt: currentUser.role === 'individual' ? new Date().toISOString() : null
      };

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
           await updateDoc(doc(db, "users", currentUser.uid), { game_state: state });
           
           alertBox.innerHTML = '<i class="fas fa-star text-warning"></i> Task Completed! You earned 50 points!<br><a href="/student-activities" class="btn btn-sm btn-success mt-3">Back to Dashboard</a>';
        } else {
           // Add to completed (Pending Review) in game state
           if (!state.completed.includes(chapterId)) {
             state.completed.push(chapterId);
             await updateDoc(doc(db, "users", currentUser.uid), { game_state: state });
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
      if (!currentUser || !submissionId) {
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
</script>
`
