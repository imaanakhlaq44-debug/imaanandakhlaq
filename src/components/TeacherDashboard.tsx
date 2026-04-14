import { html, raw } from 'hono/html'
import mockDB from '../data/mockDatabase.json'
import activitiesData from '../data/activities.json'

export const TeacherDashboard = () => html`
<style>
  .teacher-page {
    background: linear-gradient(135deg, #FDF8F5 0%, #F5F1EE 100%);
    padding: 3rem 0;
    font-family: 'Nunito', sans-serif;
    color: #334155;
    min-height: 100vh;
  }
  .bento-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
  }
  .bento-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    box-shadow: 
      0 20px 40px -5px rgba(0, 0, 0, 0.08),
      0 10px 15px -5px rgba(0, 0, 0, 0.04),
      inset 0px 1px 1px rgba(255, 255, 255, 0.9);
    padding: 2rem;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.7);
  }
  .main-header-card {
    grid-column: span 12;
    background: linear-gradient(135deg, #1E2D5A, #D63678);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
  }
  
  /* Leaderboard Styling */
  .leaderboard-card {
    grid-column: span 5;
  }
  @media (max-width: 992px) {
    .leaderboard-card { grid-column: span 12; }
  }
  .student-rank-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-radius: 50px;
    margin-bottom: 18px;
    background: #ffffff;
    box-shadow: 0 4px 6px rgba(30, 45, 90, 0.05);
    border: 2px solid #F5F1EE;
    border-bottom: 6px solid #C99A6B;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .student-rank-item:hover {
    transform: translateY(4px);
    border-bottom: 2px solid #bae6fd;
    box-shadow: 0 2px 5px rgba(186, 230, 253, 0.4), inset 0 1px 2px rgba(255,255,255,0.9);
  }
  .rank-badge {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 900;
    color: white;
    font-size: 1.1rem;
    margin-right: 15px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .rank-1 { background: linear-gradient(135deg, #E08020, #C99A6B); transform: scale(1.1); }
  .rank-2 { background: linear-gradient(135deg, #1E2D5A, #D63678); }
  .rank-3 { background: linear-gradient(135deg, #D63678, #B02460); }
  .rank-other { background: #E2E8F0; color: #475569; box-shadow: none; }
  
  .student-avatar {
    width: 40px;
    height: 40px;
    background: #FDF8F5;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    color: #1E2D5A;
    margin-right: 15px;
  }
  .student-name {
    flex-grow: 1;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .student-score {
    font-family: 'Fredoka One', cursive;
    color: #E08020;
    font-size: 1.2rem;
  }

  /* Review Queue Styling */
  .review-queue-card {
    grid-column: span 7;
  }
  @media (max-width: 992px) {
    .review-queue-card { grid-column: span 12; }
  }
  
  .review-item {
    background: #ffffff;
    border: 2px solid #FDF0F6;
    border-bottom: 6px solid #D63678;
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;
    box-shadow: 0 8px 15px rgba(214, 54, 120, 0.1), inset 0 2px 5px rgba(255,255,255,0.8);
    transition: all 0.2s ease;
  }
  .review-item:hover {
    transform: translateY(4px);
    border-bottom: 2px solid #5eead4;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1), inset 0 1px 2px rgba(255,255,255,0.8);
  }
  .student-discussion-text {
    background: white;
    padding: 1rem;
    border-radius: 10px;
    font-style: italic;
    color: #475569;
    border: 1px dashed #cbd5e1;
    margin: 15px 0;
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

  /* Login Styling */
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
    border-color: #1E2D5A;
  }
</style>

<div class="teacher-page">

  <!-- DASHBOARD VIEW -->
  <div id="teacherDashboardView" class="bento-container d-none">
    
    <div class="bento-card main-header-card">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-light text-primary mb-2" id="schoolNameTag"><i class="fas fa-school"></i> Loading School...</span>
          <h1 style="font-family: 'Fredoka One', cursive; margin:0;" id="welcomeName">Welcome, Teacher</h1>
          <p class="mb-0 mt-1" style="opacity: 0.9;" id="classInfo">Class: Loading...</p>
        </div>
        <div class="text-end">
          <div style="font-size: 4rem; opacity: 0.8; margin-right: 20px;"><i class="fas fa-book-reader"></i></div>
        </div>
      </div>
    </div>

    <!-- LEADERBOARD -->
    <div class="bento-card leaderboard-card">
      <h3 style="font-family: 'Fredoka One', cursive; color: #1e293b; margin-bottom: 1.5rem;">
        <i class="fas fa-trophy text-warning me-2"></i> Class Leaderboard
      </h3>
      <div id="leaderboardList">
        <!-- Rendered via JS -->
      </div>
    </div>

    <!-- GRADING QUEUE -->
    <div class="bento-card review-queue-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 style="font-family: 'Fredoka One', cursive; color: #1e293b; margin:0;">
          <i class="fas fa-clipboard-list text-primary me-2"></i> Grading & Reviews
        </h3>
        <span class="badge bg-danger rounded-pill" id="pendingCountBadge">0</span>
      </div>
      
      <p class="text-muted">Review your students' discussion answers and award them points.</p>
      
      <div id="reviewsList">
        <!-- Injected via JS -->
      </div>
    </div>

  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
  
  let currentTeacher = null;
  let teacherSchoolId = null;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'teacher') {
          currentTeacher = { uid: user.uid, ...userDoc.data() };
          teacherSchoolId = currentTeacher.school_id;
          
          document.getElementById('teacherDashboardView').classList.remove('d-none');
          initDashboard();
        } else {
          window.location.href = '/auth'; // Not a teacher
        }
      } catch(e) { console.error(e); }
    } else {
      window.location.href = '/auth';
    }
  });

  async function initDashboard() {
    document.getElementById('welcomeName').textContent = "Welcome, " + currentTeacher.name;
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-school"></i> School Access Granted';
    document.getElementById('classInfo').textContent = 'Assigned: Imaan & Akhlaq Books';

    // 1. Fetch all students in the teacher's school
    const usersRef = collection(db, "users");
    const qStudents = query(usersRef, where("role", "==", "student"), where("school_id", "==", teacherSchoolId));
    let studentsSnap;
    try {
      studentsSnap = await getDocs(qStudents);
    } catch(e) { console.error(e); return; }
    
    let leaderboardData = [];
    let studentMap = {}; 

    studentsSnap.forEach(docSnap => {
      let stu = docSnap.data();
      stu.uid = docSnap.id;
      studentMap[stu.uid] = stu;
      
      let points = (stu.game_state && stu.game_state.points) ? stu.game_state.points : 50;
      leaderboardData.push({
        uid: stu.uid,
        name: stu.name,
        totalPoints: points,
        game_state: stu.game_state || { completed: [], teacher_approved: [] }
      });
    });

    // Sort and Render Leaderboard
    leaderboardData.sort((a,b) => b.totalPoints - a.totalPoints);
    let lbHtml = '';
    leaderboardData.forEach((s, idx) => {
      let rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'rank-other'));
      lbHtml += 
        '<div class="student-rank-item">' +
          '<div class="rank-badge ' + rankClass + '">' + (idx + 1) + '</div>' +
          '<div class="student-avatar"><i class="fas fa-user-graduate"></i></div>' +
          '<div class="student-name">' + s.name + '</div>' +
          '<div class="student-score">' + s.totalPoints + ' ⭐</div>' +
        '</div>';
    });
    document.getElementById('leaderboardList').innerHTML = lbHtml;

    // 2. Fetch specific submissions matching teacher's students
    const qSub = query(collection(db, "activity_submissions"), where("school_id", "==", teacherSchoolId));
    const subSnap = await getDocs(qSub);
    let pendingReviews = [];

    subSnap.forEach(subDoc => {
      let sub = subDoc.data();
      if (studentMap[sub.student_uid]) {
        let stuState = studentMap[sub.student_uid].game_state || { teacher_approved: [] };
        // Check if pending
        if (!stuState.teacher_approved || !stuState.teacher_approved.includes(sub.chapter_id)) {
            pendingReviews.push({
              subId: subDoc.id,
              studentUid: sub.student_uid,
              studentName: studentMap[sub.student_uid].name,
              chapId: sub.chapter_id,
              answer: sub.discussionText || "No written answer provided.",
              grid: sub.gridState || null,
              parents: sub.parentNotes || []
            });
        }
      }
    });

    // Render Review Queue
    document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
    let revHtml = '';
    if (pendingReviews.length === 0) {
      revHtml = '<div class="text-center p-5"><i class="fas fa-glass-cheers text-success fa-3x mb-3"></i><h4>All Caught Up!</h4><p class="text-muted">You have reviewed all student answers.</p></div>';
    } else {
      pendingReviews.forEach((rev) => {
        let cTitle = getChapterTitle(rev.chapId);
        let rawData = encodeURIComponent(JSON.stringify(rev));
        
        revHtml += 
          '<div class="review-item">' +
            '<div class="d-flex align-items-center mb-2">' +
              '<div class="student-avatar" style="width:30px; height:30px; font-size:1rem; margin-right:10px;"><i class="fas fa-user-graduate"></i></div>' +
              '<strong style="font-size: 1.1rem; color: #1e293b;">' + rev.studentName + '</strong>' +
              '<span class="ms-auto" style="font-size: 0.85rem; color: #64748b; background: white; padding: 2px 8px; border-radius: 10px; border: 1px solid #cbd5e1;">' + cTitle + '</span>' +
            '</div>' +
            '<div style="font-size:0.9rem; font-weight:bold; color:#D63678;">Status: <span class="badge bg-warning text-dark">Teacher Review Pending</span></div>' +
            '<div class="student-discussion-text" style="max-height:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"' + rev.answer + '"</div>' +
            '<div class="d-flex justify-content-end mt-3">' +
              '<button class="btn btn-primary rounded-pill me-2" onclick="openReviewModal(\\'' + rawData + '\\')"><i class="fas fa-search"></i> View Full Sheet</button>' +
              '<button class="btn-approve" onclick="awardTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\')"><i class="fas fa-check"></i> Quick Pass</button>' +
            '</div>' +
          '</div>';
      });
    }
    document.getElementById('reviewsList').innerHTML = revHtml;
  }

  window.awardTeacherPoints = async (studentUid, chapterId) => {
    try {
      const studentRef = doc(db, "users", studentUid);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        let state = studentDoc.data().game_state || { completed: [], teacher_approved: [], points: 0 };
        if (!state.teacher_approved) state.teacher_approved = [];
        
        if (!state.teacher_approved.includes(chapterId)) {
          state.teacher_approved.push(chapterId);
          state.points += 50;
          await updateDoc(studentRef, { game_state: state });
        }
      }
      
      closeReviewModal();
      initDashboard(); // Re-render
      alert("✅ Answer marked as Excellent! +50 ⭐ awarded to student.");
    } catch(err) {
      console.error(err);
      alert("Error saving approval.");
    }
  };

  window.rejectTeacherPoints = async (studentUid, chapterId) => {
    if (confirm("Are you sure you want to reject this answer? The student will have to fill it out again.")) {
      try {
        // Remove from student completed list so they can do it again
        const studentRef = doc(db, "users", studentUid);
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          let state = studentDoc.data().game_state;
          if (state && state.completed) {
            state.completed = state.completed.filter(id => id !== chapterId);
            await updateDoc(studentRef, { game_state: state });
          }
        }
        
        // Delete submission entirely
        const subId = \`\${studentUid}_\${chapterId}\`;
        await deleteDoc(doc(db, "activity_submissions", subId));
        
        closeReviewModal();
        initDashboard();
        alert("❌ Submission rejected. It has been sent back to the student.");
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

      document.getElementById('rmActionBtn').innerHTML = 
        '<button class="btn btn-outline-danger px-4 rounded-pill fw-bold mb-2 me-2" onclick="rejectTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\')"><i class="fas fa-undo"></i> Reject (Needs Changes)</button>' +
        '<button class="btn btn-success px-4 rounded-pill fw-bold mb-2 shadow-sm" onclick="awardTeacherPoints(\\'' + rev.studentUid + '\\', \\'' + rev.chapId + '\\')"><i class="fas fa-star text-warning"></i> Mark Excellent & Award 50 ⭐</button>';

      document.getElementById('reviewModalOverlay').style.display = 'flex';
      document.getElementById('reviewModal').classList.add('animate__animated', 'animate__zoomIn');
    };

    window.closeReviewModal = () => {
      document.getElementById('reviewModalOverlay').style.display = 'none';
      document.getElementById('reviewModal').classList.remove('animate__animated', 'animate__zoomIn');
    };
    
</script>
`
