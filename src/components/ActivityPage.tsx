import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'

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
</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
<div class="activity-page">
  <div class="container pb-3">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <a href="./student-activities.html" class="btn btn-outline-secondary rounded-pill"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
      <h2 style="font-family: 'Fredoka One', cursive; color: #ff6b6b; margin: 0;" id="pageTitleLoading">Loading...</h2>
      <div style="width: 150px;"></div> <!-- Spacer -->
    </div>

    <!-- Phase 1: Reading Phase -->
    <div class="reading-container" id="readingContainer">
      <div class="chapter-ribbon" style="background:#0ea5e9;">Reading Phase</div>
      <h3 style="font-family: 'Fredoka One', cursive; color: #333; margin-top:30px;">Read the Chapter</h3>
      <p class="text-muted mb-4 fs-5" id="pageRangeInstructions">Please read the pages below to complete this chapter. When you're done, click the button to start your activities.</p>
      
      <div id="pdf-container">
        <iframe id="pdf-viewer" class="pdf-viewer-container" src="about:blank"></iframe>
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

  const urlParams = new URLSearchParams(window.location.search);
  const currentBook = urlParams.get('book') || 'book1';
  const currentChap = urlParams.get('chapter') || 'chapter1';
  
  let currentUser = null;
  let state = { points: 50, unlockedCount: 1, completed: [], parent_approved: [], teacher_approved: [] };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.game_state) state = uData.game_state;
        }

        if (!state.parent_approved) state.parent_approved = [];
        if (!state.teacher_approved) state.teacher_approved = [];
        if (!state.completed) state.completed = [];
        
        initActivityPage();
      } catch(e) { console.error(e); }
    } else {
      window.location.href = '/auth'; // Require login
    }
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
    
    // Populate Header
    titleEl.textContent = chapData.title;
    ribbonEl.textContent = "Activities for " + currentChap.replace('chapter', 'Chapter ');
    discEl.textContent = chapData.discussionQuestion;

    // Load specific PDF pages using pdf.js
    const pageInstructions = document.getElementById('pageRangeInstructions');
    if (pageInstructions && chapData.pageStart && chapData.pageEnd) {
       pageInstructions.innerHTML = \`<strong>Required Reading: Page \${chapData.pageStart} to \${chapData.pageEnd}.</strong><br> Scroll down to read your chapter. When you're done, click the button below.\`;
    }

    const pdfFileUrl = '/' + currentBook + '.pdf';
    const pdfContainer = document.getElementById('pdf-container');
    
    // Add loading text
    pdfContainer.innerHTML = '<div style="text-align:center; padding: 40px; font-weight:bold; color: #d63678;"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Loading your chapter...</div>';
    
    if (typeof window.pdfjsLib !== 'undefined') {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      
      window.pdfjsLib.getDocument(pdfFileUrl).promise.then(async function(pdf) {
        pdfContainer.innerHTML = '';
        const start = parseInt(chapData.pageStart) || 1;
        const end = parseInt(chapData.pageEnd) || 1;
        
        const containerWidth = pdfContainer.clientWidth || 800;
        const pixelRatio = window.devicePixelRatio || 1;

        for (let i = start; i <= end; i++) {
          try {
            const page = await pdf.getPage(i);
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min((containerWidth - 40) / unscaledViewport.width, 1.5) * pixelRatio;
            const viewport = page.getViewport({ scale: scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            canvas.style.width = (viewport.width / pixelRatio) + 'px';
            canvas.style.height = (viewport.height / pixelRatio) + 'px';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto 20px auto';
            canvas.style.borderRadius = '12px';
            canvas.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
            canvas.style.maxWidth = '100%';
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pdfContainer.appendChild(canvas);
          } catch(e) {
            console.error("Error rendering page " + i, e);
          }
        }
      }).catch(err => {
        pdfContainer.innerHTML = '<p class="text-danger text-center"><i class="fas fa-exclamation-triangle"></i> Failed to load PDF file. Please ensure it exists on the server.</p>';
      });
    } else {
      pdfContainer.innerHTML = '<p class="text-danger">PDF script failed to load.</p>';
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

      document.querySelectorAll('.interactive-cell').forEach(cell => {
        cell.dataset.stateIndex = "0";
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
    }

    // CHECK FOR EXISTING SUBMISSION from Firebase
    const submissionId = \`\${currentUser.uid}_\${chapterId}\`;
    let existingSub = null;
    
    try {
      const subSnap = await getDoc(doc(db, "activity_submissions", submissionId));
      if (subSnap.exists()) {
        existingSub = subSnap.data();
      }
    } catch(e) { console.error("Error fetching submission", e); }
    
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

    // Save Button Logic (Gamification)
    document.getElementById('saveProgressBtn').addEventListener('click', async () => {
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
        school_id: currentUser.school_id || '',
        chapter_id: chapterId,
        book_id: currentBook,
        discussionText: discussionText,
        gridState: gridState,
        parentNotes: parentNotes,
        submittedAt: new Date().toISOString()
      };
      
      try {
        // Save to Firebase activity_submissions
        await setDoc(doc(db, "activity_submissions", submissionId), submissionData);

        // Add to completed (Pending Review) in game state
        if (!state.completed.includes(chapterId)) {
          state.completed.push(chapterId);
          await updateDoc(doc(db, "users", currentUser.uid), { game_state: state });
        }

        alertBox.innerHTML = '<i class="fas fa-clock text-warning"></i> Chapter task submitted! Waiting for **Teacher approval**.<br><a href="/student-activities" class="btn btn-sm btn-success mt-3">Back to Dashboard</a>';
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
    });

  }
</script>
`
