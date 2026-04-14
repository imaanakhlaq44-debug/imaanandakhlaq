import { html, raw } from 'hono/html'
import mockDB from '../data/mockDatabase.json'
import activitiesData from '../data/activities.json'

export const ParentDashboard = () => html`
<style>
  .parent-page {
    background: linear-gradient(135deg, #FDF8F5 0%, #FDF0F6 100%);
    padding: 3rem 0;
    font-family: 'Nunito', sans-serif;
    color: #334155;
    min-height: 100vh;
  }
  .bento-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
  }
  .bento-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 10px 15px -3px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .main-header-card {
    grid-column: span 12;
    background: linear-gradient(135deg, #1E2D5A, #D63678);
    color: white;
  }
  .stats-card {
    grid-column: span 4;
    text-align: center;
    background: white;
  }
  @media (max-width: 768px) {
    .stats-card { grid-column: span 12; }
  }
  .action-queue-card {
    grid-column: span 8;
  }
  @media (max-width: 768px) {
    .action-queue-card { grid-column: span 12; }
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
    border-color: #D63678;
  }
  .approval-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: transform 0.2s;
  }
  .approval-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .parent-text-input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    margin: 10px 0;
    font-family: 'Nunito', sans-serif;
  }
  .parent-text-input:focus {
    outline: none;
    border-color: #E08020;
    box-shadow: 0 0 0 3px rgba(224, 128, 32, 0.2);
  }
  .btn-approve {
    background: #D63678;
    color: white;
    font-family: 'Fredoka One', cursive;
    border: none;
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    box-shadow: 0 4px 0 #B02460;
  }
  .btn-approve:hover {
    background: #B02460;
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #B02460;
  }
  .school-tag {
    background: rgba(255,255,255,0.2);
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .stat-value {
    font-family: 'Fredoka One', cursive;
    font-size: 3rem;
    color: #E08020;
    margin: 10px 0 0 0;
    line-height: 1;
  }
  .stat-label {
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 1px;
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
</style>

<div class="parent-page">
  <!-- DASHBOARD VIEW -->
  <div id="parentDashboardView" class="bento-container d-none">
    
    <div class="bento-card main-header-card">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <span class="school-tag mb-2" id="schoolNameTag"><i class="fas fa-spinner fa-spin"></i> Loading Info...</span>
          <h1 style="font-family: 'Fredoka One', cursive; margin:0;" id="welcomeName">Welcome, Parent</h1>
          <p class="mb-0 mt-1" style="opacity: 0.9;" id="teacherInfo">Loading...</p>
        </div>
        <div class="text-end">
          <div style="font-size: 4rem; opacity: 0.8; margin-right: 20px;"><i class="fas fa-child"></i></div>
        </div>
      </div>
    </div>

    <div class="bento-card stats-card">
      <i class="fas fa-star" style="color: #f59e0b; font-size: 2rem;"></i>
      <h3 class="stat-value" id="totalPointsVal">0</h3>
      <p class="stat-label">Child's Total Points</p>
      
      <div class="mt-4 pt-4" style="border-top: 1px dashed #e2e8f0;">
        <i class="fas fa-book-open mb-2" style="font-size: 1.5rem; color: #D63678;"></i>
        <h3 style="font-family: 'Fredoka One', cursive; font-size: 2rem; margin:0; color: #D63678;" id="completedChapCount">0</h3>
        <p class="stat-label">Chapters Finished</p>
      </div>
    </div>

    <div class="bento-card action-queue-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 style="font-family: 'Fredoka One', cursive; color: #1e293b; margin:0;">
          <i class="fas fa-clipboard-check text-success me-2"></i> Pending Approvals
        </h3>
        <span class="badge bg-danger rounded-pill" id="pendingCountBadge">0</span>
      </div>
      
      <p class="text-muted">Review your child's completed activities and write "One Good Sentence" to approve them for the Teacher!</p>
      
      <div id="approvalsList">
        <!-- Injected via JS -->
      </div>
    </div>

  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
  
  const ACTIVITIES_DATA = ${raw(JSON.stringify(activitiesData))};
  
  let currentParent = null;
  let linkedStudent = null;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'parent') {
          currentParent = { uid: user.uid, ...userDoc.data() };
          await initDashboard();
        } else {
          window.location.href = '/auth';
        }
      } catch (err) {
        console.error("Error fetching parent profile:", err);
      }
    } else {
      window.location.href = '/auth';
    }
  });

  async function initDashboard() {
    const dashboardView = document.getElementById('parentDashboardView');
    dashboardView.classList.remove('d-none');
    
    document.getElementById('welcomeName').textContent = 'Salam, ' + currentParent.name;
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating Student...';

    if (!currentParent.linked_student_code) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> No Student Linked';
      document.getElementById('teacherInfo').textContent = 'Please contact school admin.';
      return;
    }

    const stq = query(collection(db, "users"), where("invitation_code", "==", currentParent.linked_student_code), where("role", "==", "student"));
    const sqSnap = await getDocs(stq);
    if (sqSnap.empty) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> Student Not Registered Yet';
      document.getElementById('teacherInfo').textContent = 'Waiting for student to use their invite code.';
      return;
    }

    linkedStudent = { uid: sqSnap.docs[0].id, ...sqSnap.docs[0].data() };
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-child"></i> Tracking: ' + linkedStudent.name;
    document.getElementById('teacherInfo').textContent = 'Class: ' + (linkedStudent.class_id || 'Unassigned');

    const gameState = linkedStudent.game_state || { points:0, unlockedCount:1, completed:[], parent_approved:[], teacher_approved:[] };
    if (!gameState.parent_approved) gameState.parent_approved = [];
    if (!gameState.completed) gameState.completed = [];

    document.getElementById('totalPointsVal').textContent = gameState.points || 0;
    document.getElementById('completedChapCount').textContent = gameState.completed.length;

    const subQ = query(collection(db, "activity_submissions"), where("student_uid", "==", linkedStudent.uid));
    const subSnap = await getDocs(subQ);
    
    let allSubmissions = {};
    subSnap.forEach(docSnap => {
      allSubmissions[docSnap.data().chapter_id] = { id: docSnap.id, ...docSnap.data() };
    });

    const pendingChapters = gameState.completed.filter(id => !gameState.parent_approved.includes(id));
    let pendingReviews = [];

    pendingChapters.forEach(chap => {
       let sub = allSubmissions[chap];
       pendingReviews.push({
          studentName: linkedStudent.name, 
          chapId: chap,
          docId: sub ? sub.id : null,
          answer: sub ? sub.discussionText : "No written answer provided.",
          grid: sub ? sub.gridState : null,
          status: 'Waiting for Parent'
       });
    });

    document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
    
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
            '<div class="d-flex justify-content-between align-items-start mb-2">' +
              '<div><h5 style="margin:0; font-family:\\'Fredoka One\\', cursive; color:#1E2D5A;">New Activity from ' + rev.studentName + '</h5>' +
              '<p style="font-size:0.85rem; color:#64748b; margin:0;">Chapter: <b>' + cTitle + '</b></p></div>' +
              '<i class="fas fa-clock text-warning fs-4"></i>' +
            '</div>' +
            '<div class="text-end mt-3">' +
              '<button class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onclick="openParentReviewModal(\\'' + rawData + '\\')"><i class="fas fa-search"></i> Review Full Sheet</button>' +
            '</div>' +
          '</div>';
      });
      listEl.innerHTML = htmlSnippet;
    }
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
      if(ACTIVITIES_DATA[b] && ACTIVITIES_DATA[b].chapters && ACTIVITIES_DATA[b].chapters[chapId]) {
         chapterData = ACTIVITIES_DATA[b].chapters[chapId];
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

  const modalHTML = 
    '<div class="custom-modal-overlay" id="parentReviewModalOverlay">' +
      '<div class="custom-modal" id="parentReviewModal">' +
        '<button class="modal-close-btn" onclick="closeParentReviewModal()"><i class="fas fa-times"></i></button>' +
        '<h3 style="font-family: \\'Fredoka One\\', cursive; color:#1e293b;"><i class="fas fa-clipboard-check text-primary"></i> Activity Sheet Review</h3>' +
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
      '<button class="btn-approve px-5 py-2 fs-5" id="parentApproveBtn" onclick="approveFromModal(\\'' + rev.chapId + '\\', \\'' + rev.docId + '\\')"><i class="fas fa-check me-2"></i> Approve for Teacher</button>';

    document.getElementById('parentReviewModalOverlay').style.display = 'flex';
    document.getElementById('parentReviewModal').classList.add('animate__animated', 'animate__zoomIn');
  };

  window.closeParentReviewModal = () => {
    document.getElementById('parentReviewModalOverlay').style.display = 'none';
    document.getElementById('parentReviewModal').classList.remove('animate__animated', 'animate__zoomIn');
  };

  window.approveFromModal = async (chapterId, docId) => {
    const sentenceInput = document.getElementById('modalSentenceInput');
    if(sentenceInput.value.trim().split(' ').length < 2) {
      alert("Please write at least one meaningful sentence!");
      return;
    }
    
    const btn = document.getElementById('parentApproveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Approving...';

    try {
      if (docId && docId !== 'null') {
        const subRef = doc(db, "activity_submissions", docId);
        await updateDoc(subRef, {
          parentNotes: [sentenceInput.value.trim()]
        });
      }

      if (linkedStudent && linkedStudent.uid) {
        const stuRef = doc(db, "users", linkedStudent.uid);
        await updateDoc(stuRef, {
          "game_state.parent_approved": arrayUnion(chapterId)
        });
      }

      closeParentReviewModal();
      await initDashboard(); // Refresh
      alert("✅ Approved! This activity is now waiting for the Teacher's review.");
    } catch(err) {
      console.error(err);
      alert("Error approving activity: " + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check me-2"></i> Approve for Teacher';
    }
  };
</script>
`
