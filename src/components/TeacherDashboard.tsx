import { html, raw } from 'hono/html'
import mockDB from '../data/mockDatabase.json'
import activitiesData from '../data/activities.json'

export const TeacherDashboard = () => html`
<style>
  .teacher-page {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
      0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  .main-header-card {
    grid-column: span 12;
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    color: white;
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
    padding: 15px;
    border-radius: 15px;
    margin-bottom: 10px;
    background: #f1f5f9;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #e2e8f0;
  }
  .student-rank-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
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
  .rank-1 { background: linear-gradient(135deg, #f59e0b, #d97706); transform: scale(1.1); }
  .rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
  .rank-3 { background: linear-gradient(135deg, #c2410c, #9a3412); }
  .rank-other { background: #cbd5e1; color: #475569; box-shadow: none; }
  
  .student-avatar {
    width: 40px;
    height: 40px;
    background: #e0f2fe;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    color: #0284c7;
    margin-right: 15px;
  }
  .student-name {
    flex-grow: 1;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .student-score {
    font-family: 'Fredoka One', cursive;
    color: #f59e0b;
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
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    position: relative;
    border-left: 5px solid #3b82f6;
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
    background: #10b981;
    color: white;
    font-family: 'Fredoka One', cursive;
    border: none;
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }
  .btn-approve:hover {
    background: #059669;
    transform: scale(1.05);
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
    border-color: #0ea5e9;
  }
</style>

<div class="teacher-page">
  <!-- LOGIN VIEW -->
  <div id="teacherLoginView" class="login-container bento-card d-none">
    <div style="font-size: 3rem; color: #0ea5e9; margin-bottom: 20px;"><i class="fas fa-chalkboard-teacher"></i></div>
    <h2 style="font-family: 'Fredoka One', cursive; color: #1e293b;">Teacher Portal</h2>
    <p class="text-muted mb-4">Enter your Class PIN to access your dashboard.</p>
    <p style="font-size: 0.8rem; background: #e0f2fe; padding: 5px; border-radius: 5px;">Demo PIN: 5678</p>
    
    <input type="password" id="pinInput" class="pin-input" maxlength="4" placeholder="••••">
    <button class="btn btn-primary btn-lg rounded-pill px-5 mt-3" style="font-family: 'Fredoka One', cursive; background: #0ea5e9; border:none;" onclick="attemptTeacherLogin()">Unlock Portal</button>
  </div>

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

<script>
  const MOCK_DB = ${raw(JSON.stringify(mockDB))};
  const ACTIVITIES_DATA = ${raw(JSON.stringify(activitiesData))};
  
  document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('teacherLoginView');
    const dashboardView = document.getElementById('teacherDashboardView');
    
    // Auth Check
    const session = sessionStorage.getItem('teacher_session');
    
    if (session) {
      showDashboard(JSON.parse(session));
    } else {
      loginView.classList.remove('d-none');
    }

    window.attemptTeacherLogin = () => {
      const pin = document.getElementById('pinInput').value;
      const teacherUser = MOCK_DB.teachers.find(t => t.pin === pin);
      
      if (teacherUser) {
        const school = MOCK_DB.schools.find(s => s.school_id === teacherUser.school_id);
        const students = MOCK_DB.students.filter(s => s.class_id === teacherUser.assigned_class && s.school_id === school.school_id);
        
        const sessionData = {
          teacherId: teacherUser.teacher_id,
          teacherName: teacherUser.name,
          schoolName: school.name,
          className: teacherUser.assigned_class,
          students: students
        };
        
        sessionStorage.setItem('teacher_session', JSON.stringify(sessionData));
        loginView.classList.add('d-none');
        showDashboard(sessionData);
      } else {
        alert("Invalid PIN. Please try 5678.");
      }
    };
    
    window.awardTeacherPoints = (studentId, chapterId) => {
      // In a real app we'd save this to the real DB. 
      // For the mock, we simulate it on local storage for "Ali Ahmed" (stu_101)
      if (studentId === 'stu_101') {
        let gameState = JSON.parse(localStorage.getItem('imaan_game_state')) || { points:0, unlockedCount:1, completed:[] };
        if (!gameState.teacher_approved) gameState.teacher_approved = [];
        
        if (!gameState.teacher_approved.includes(chapterId)) {
          gameState.teacher_approved.push(chapterId);
          gameState.points += 50; // Teacher Bonus
          localStorage.setItem('imaan_game_state', JSON.stringify(gameState));
        }
      } else {
        // Just mock updating the fake array
        let dummyState = JSON.parse(sessionStorage.getItem('dummy_approvals')) || [];
        dummyState.push(studentId + '_' + chapterId);
        sessionStorage.setItem('dummy_approvals', JSON.stringify(dummyState));
      }
      
      // Re-render
      const session = JSON.parse(sessionStorage.getItem('teacher_session'));
      showDashboard(session);
      alert("✅ Answer marked as Excellent! +50 ⭐ awarded to student.");
    };
    
    function getChapterTitle(chapId) {
      // Very naive search since we just want the string
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

    function showDashboard(sessionData) {
      dashboardView.classList.remove('d-none');
      
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-school"></i> ' + sessionData.schoolName;
      document.getElementById('welcomeName').textContent = sessionData.teacherName;
      document.getElementById('classInfo').textContent = 'Assigned: ' + sessionData.className + ' (' + sessionData.students.length + ' Students)';
      
      // 1. Build Leaderboard Data
      // For stu_101 (Ali), fetch live data from localStorage. For rest, use mock base_points.
      let gameState = JSON.parse(localStorage.getItem('imaan_game_state')) || { points: 0, completed: [] };
      if (!gameState.teacher_approved) gameState.teacher_approved = [];
      
      let leaderboardData = [];
      let pendingReviews = []; // Array of {student, chapId, text}
      
      sessionData.students.forEach(stu => {
        let stuPoints = stu.base_points;
        if (stu.student_id === 'stu_101') {
          stuPoints += gameState.points; // Add the livedata points
          
          // Check for pending discussion approvals for Ali
          gameState.completed.forEach(chap => {
            if (!gameState.teacher_approved.includes(chap)) {
              pendingReviews.push({
                student: stu,
                chapId: chap,
                answer: "I learned that staying patient brings peace, even when it is hard to wait for my turn. MashaAllah I will try my best."
              });
            }
          });
        } else {
          // Fake some pending reviews for the dummy students so the dashboard looks active
          let dummyApprovals = JSON.parse(sessionStorage.getItem('dummy_approvals')) || [];
          if (!dummyApprovals.includes(stu.student_id + '_b1_c2')) {
            pendingReviews.push({
              student: stu,
              chapId: 'b1_c2',
              answer: "I always make sure to speak the truth with my friends."
            });
          }
        }
        
        leaderboardData.push({
          ...stu,
          totalPoints: stuPoints
        });
      });
      
      // Sort Leaderboard
      leaderboardData.sort((a,b) => b.totalPoints - a.totalPoints);
      
      // Render Leaderboard
      let lbHtml = '';
      leaderboardData.forEach((s, idx) => {
        let rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'rank-other'));
        lbHtml += 
          '<div class="student-rank-item">' +
            '<div class="rank-badge ' + rankClass + '">' + (idx + 1) + '</div>' +
            '<div class="student-avatar"><i class="' + s.avatar + '"></i></div>' +
            '<div class="student-name">' + s.name + ' <div style="font-size:0.8rem; font-weight:normal; color:#64748b;">ID: ' + s.student_id + '</div></div>' +
            '<div class="student-score">' + s.totalPoints + ' ⭐</div>' +
          '</div>';
      });
      document.getElementById('leaderboardList').innerHTML = lbHtml;


      // Render Grading Queue
      document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
      let revHtml = '';
      if (pendingReviews.length === 0) {
        revHtml = '<div class="text-center p-5"><i class="fas fa-glass-cheers text-success fa-3x mb-3"></i><h4>All Caught Up!</h4><p class="text-muted">You have reviewed all student answers.</p></div>';
      } else {
        pendingReviews.forEach(rev => {
          let cTitle = getChapterTitle(rev.chapId);
          revHtml += 
            '<div class="review-item">' +
              '<div class="d-flex align-items-center mb-2">' +
                '<div class="student-avatar" style="width:30px; height:30px; font-size:1rem; margin-right:10px;"><i class="' + rev.student.avatar + '"></i></div>' +
                '<strong style="font-size: 1.1rem; color: #1e293b;">' + rev.student.name + '</strong>' +
                '<span class="ms-auto" style="font-size: 0.85rem; color: #64748b; background: white; padding: 2px 8px; border-radius: 10px; border: 1px solid #cbd5e1;">' + cTitle + '</span>' +
              '</div>' +
              '<div style="font-size:0.9rem; font-weight:bold; color:#0ea5e9;">Discussion Answer:</div>' +
              '<div class="student-discussion-text">"' + rev.answer + '"</div>' +
              '<div class="d-flex justify-content-between align-items-center mt-3">' +
                '<button class="btn btn-outline-danger btn-sm rounded-pill"><i class="fas fa-undo"></i> Request Rewrite</button>' +
                '<button class="btn-approve" onclick="awardTeacherPoints(\\'' + rev.student.student_id + '\\', \\'' + rev.chapId + '\\')"><i class="fas fa-star text-warning"></i> Mark Excellent (+50⭐)</button>' +
              '</div>' +
            '</div>';
        });
      }
      document.getElementById('reviewsList').innerHTML = revHtml;

    } // end showDashboard
    
  });
</script>
`
