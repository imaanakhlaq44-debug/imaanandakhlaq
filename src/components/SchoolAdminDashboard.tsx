import { html } from 'hono/html'

export const SchoolAdminDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  .admin-page {
    background: #F5F1EE; /* Light Tan background */
    font-family: 'Nunito', sans-serif;
    color: #334155;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  /* Login Styling (Keeping simple light theme) */
  .login-wrapper {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #F5F1EE;
  }
  .login-card {
    background: #ffffff;
    padding: 3rem;
    border-radius: 30px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
    text-align: center;
    width: 100%;
    max-width: 450px;
  }
  .input-light {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    text-align: center;
    font-family: monospace;
    transition: all 0.3s;
    outline: none;
    background: #f8fafc;
    color: #334155;
    margin-bottom: 20px;
  }
  .btn-primary-light {
    width: 100%;
    background: #D63678;
    color: white;
    border: none;
    padding: 14px;
    border-radius: 15px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary-light:hover { background: #E08010; transform: translateY(-2px); }

  /* App Container */
  .app-container {
    background: #ffffff;
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    border-radius: 30px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Top Navigation */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
  }
  .nav-brand {
    display: flex;
    gap: 4px;
    font-size: 1.2rem;
  }
  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-links li {
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1rem;
    transition: color 0.2s;
  }
  .nav-links li:hover { color: #334155; }
  .nav-links li.active { color: #1e293b; font-weight: 800; }
  
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    color: #64748b;
  }
  .avatar-mini {
    width: 35px; height: 35px; border-radius: 50%; object-fit: cover; background: #e2e8f0;
  }

  /* Main Content Area */
  .main-content {
    padding: 2rem 3rem;
    overflow-y: auto;
    flex-grow: 1;
    background: #f8fafc;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  .section-title {
    font-size: 2.2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .dropdown-btn {
    border: none; background: transparent; color: #64748b; font-weight: 600; font-size: 0.9rem; cursor: pointer;
  }
  
  /* Hero Cards Grid */
  .hero-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 15px;
    margin-bottom: 3rem;
  }
  
  .hero-card {
    border-radius: 24px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  
  .card-white {
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(0,0,0,0.03);
    border: 1px solid #f1f5f9;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
  }
  
  .stat-block { text-align: center; }
  .stat-title { font-size: 0.9rem; font-weight: 700; color: #64748b; margin-bottom: 5px; }
  .stat-value-large { font-size: 3rem; font-weight: 800; color: #1e293b; line-height: 1; }
  
  .card-green { background: linear-gradient(135deg, #1E2D5A, #D63678); color: #ffffff; }
  .card-yellow { background: linear-gradient(135deg, #E08020, #C99A6B); color: #ffffff; }
  .card-orange { background: linear-gradient(135deg, #D63678, #E08020); color: #ffffff; }
  
  .tall-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .tall-stat { font-size: 3.5rem; font-weight: 800; margin: 0; line-height: 1; }
  .tall-label { font-size: 0.85rem; font-weight: 600; opacity: 0.9; margin-top: 10px; }

  /* Pill Table */
  .table-header-row {
    display: flex;
    padding: 0 2rem 10px 2rem;
    color: #64748b;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
  }
  .col-1 { flex: 2; }
  .col-2 { flex: 1; text-align: center; }
  .col-3 { flex: 2; text-align: center; }
  .col-4 { flex: 1; text-align: center; }
  .col-5 { flex: 1; text-align: center; }
  .col-6 { flex: 1; text-align: center; }
  .col-actions { flex: 1; text-align: right; }

  .pill-row {
    display: flex;
    align-items: center;
    padding: 1rem 2rem;
    border-radius: 20px;
    margin-bottom: 15px;
    background: #ffffff;
    font-weight: 700;
    color: #334155;
    transition: transform 0.2s;
  }
  .pill-row:hover { transform: scale(1.01); }

  .row-peach { background: #FDF0F6; }
  .row-yellow { background: #FDF8F5; }
  .row-green { background: #F5F1EE; }

  .progress-bar-container {
    background: #ffffff;
    border-radius: 20px;
    height: 35px;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
  }
  .progress-fill {
    height: 100%;
    position: absolute; left: 0; top: 0; z-index: 1;
    border-radius: 20px;
  }
  .progress-text {
    position: relative; z-index: 2; margin-left: 15px; font-weight: 800;
  }

  .circle-badge {
    width: 30px; height: 30px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; color: white; font-size: 0.85rem; font-weight: 800; margin: 0 5px;
  }
  .bg-orange { background: #E08020; }
  .bg-yellow { background: #C99A6B; }
  .bg-green { background: #D63678; }

  .action-btn {
    background: transparent; border: none; cursor: pointer; font-size: 1rem; color: #94a3b8; padding: 5px; transition: color 0.2s;
  }
  .action-btn:hover { color: #334155; }
  .action-btn.delete:hover { color: #ef4444; }

  /* Modals */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999;
  }
  .modal-content {
    background: #ffffff; padding: 30px; border-radius: 24px; width: 450px; box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  }
  .form-group { margin-bottom: 15px; text-align: left; }
  .form-group label { display: block; font-weight: 700; margin-bottom: 5px; color: #64748b; font-size: 0.9rem; }
  .form-input { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; background: #f8fafc; color: #334155; font-weight: 600; outline: none; }
  .form-input:focus { border-color: #3b82f6; }
  
  .btn-outline-light { background: transparent; border: 2px solid #e2e8f0; color: #64748b; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }
  .btn-solid { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }

  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
</style>

<!-- LOGIN VIEW -->
<div id="adminLoginView" class="login-wrapper">
  <div class="login-card">
    <div style="font-size: 3rem; color: #D63678; margin-bottom: 1rem;"><i class="fas fa-school"></i></div>
    <h2 style="font-weight: 800; color: #1e293b; margin-bottom: 5px; font-size: 2rem;">School Admin</h2>
    <p style="color: #64748b; margin-bottom: 30px; font-weight: 600;">Manage Your Classes Safely.</p>
    
    <div style="background: #FDF0F6; padding: 10px; border-radius: 12px; margin-bottom: 20px; font-size: 0.85rem; color: #D63678; border: 2px dashed #D63678; font-weight: 700;">
      Demo PIN: 9999
    </div>

    <input type="password" id="adminPinInput" class="input-light mb-4" maxlength="4" placeholder="••••">
    <button class="btn-primary-light" onclick="attemptAdminLogin()">Log In</button>
  </div>
</div>

<!-- DASHBOARD VIEW -->
<div id="adminDashboardView" class="admin-page d-none">
  
  <div class="app-container">
    <!-- TOP NAV -->
    <div class="top-nav">
      <div class="nav-brand">
        <i class="fas fa-plus" style="color:#ef4444;"></i>
        <i class="fas fa-minus" style="color:#fbbf24;"></i>
        <i class="fas fa-times" style="color:#84cc16;"></i>
        <i class="fas fa-divide" style="color:#3b82f6;"></i>
      </div>
      <ul class="nav-links">
        <li class="active" id="nav-overview" onclick="switchAdminTab('overview')">Dashboard</li>
        <li id="nav-teachers" onclick="switchAdminTab('teachers')">Teachers</li>
        <li id="nav-students" onclick="switchAdminTab('students')">Students</li>
        <li id="nav-attendance" onclick="switchAdminTab('attendance')">Attendance</li>
        <li id="nav-settings" onclick="switchAdminTab('settings')">Settings</li>
      </ul>
      <div class="nav-actions">
        <i class="far fa-heart" style="cursor:pointer;"></i>
        <div style="position:relative; cursor:pointer;">
          <i class="far fa-bell"></i>
          <span style="position:absolute; top:-5px; right:-8px; background:#ef4444; color:white; font-size:0.6rem; font-weight:800; width:15px; height:15px; display:flex; justify-content:center; align-items:center; border-radius:50%; border:2px solid white;">3</span>
        </div>
        <img src="https://ui-avatars.com/api/?name=Admin&background=8b5cf6&color=fff" class="avatar-mini ms-3">
        <button class="btn-outline-light ms-2" style="padding:4px 8px; font-size:0.8rem;" onclick="location.reload()"><i class="fas fa-sign-out-alt"></i></button>
      </div>
    </div>

    <!-- MAIN AREA -->
    <div class="main-content">
      
      <!-- OVERVIEW TAB -->
      <div id="tab-overview" class="fade-in">
        <div class="section-header">
          <h1 class="section-title">Dashboard <button class="dropdown-btn">All Classes <i class="fas fa-chevron-down ms-1"></i></button></h1>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:0.85rem; font-weight:700; color:#64748b;"><i class="fas fa-bolt text-warning"></i> Alerts <span style="background:#ef4444; color:white; padding:2px 8px; border-radius:10px; margin-left:5px;">0</span></span>
            <i class="fas fa-th ms-2 text-muted" style="cursor:pointer;"></i>
          </div>
        </div>

        <div class="hero-grid">
          <div class="hero-card card-white">
            <div class="stat-block" style="text-align:left;">
              <div class="stat-title">Overall Class Score</div>
              <div class="stat-value-large" id="statPoints">68%</div>
              <div style="font-size:0.8rem; font-weight:700; color:#94a3b8; margin-top:5px;">Grade average 71%</div>
            </div>
            <div>
               <i class="fas fa-trophy" style="font-size: 6rem; color: #a3e635; filter: drop-shadow(0 10px 10px rgba(132, 204, 22, 0.2));"></i>
            </div>
            <div class="stat-block ms-4" style="text-align:left;">
              <div class="stat-title">Work Assigned</div>
              <div class="stat-value-large" id="statTotalPop">36</div>
              <div style="font-size:0.8rem; font-weight:700; color:#94a3b8; margin-top:5px;">Grade average 38%</div>
            </div>
          </div>
          
          <div class="hero-card card-green tall-card" style="border-radius: 20px 0 0 20px; margin-right: -15px;">
            <img src="https://ui-avatars.com/api/?name=Teachers&background=fff&color=84cc16" style="width:30px; border-radius:50%; position:absolute; top:15px; left:15px;">
            <div class="tall-stat" id="statTeachers">5</div>
            <div class="tall-label">20%<br>of class<br><span style="opacity:0.7; font-size:0.7rem;">grade avg: 23%</span></div>
          </div>
          
          <div class="hero-card card-yellow tall-card" style="border-radius: 20px; position:relative; z-index:2; box-shadow:0 0 20px rgba(0,0,0,0.1);">
            <img src="https://ui-avatars.com/api/?name=Students&background=fff&color=fbbf24" style="width:30px; border-radius:50%; position:absolute; top:15px; left:15px;">
            <div class="tall-stat" id="statStudents" style="color:#1e293b;">10</div>
            <div class="tall-label" style="color:#1e293b;">40%<br>of class<br><span style="opacity:0.7; font-size:0.7rem;">grade avg: 50%</span></div>
          </div>
          
          <div class="hero-card card-orange tall-card" style="border-radius: 0 20px 20px 0; margin-left: -15px;">
            <img src="https://ui-avatars.com/api/?name=St&background=fff&color=fb923c" style="width:30px; border-radius:50%; position:absolute; top:15px; right:15px;">
            <div class="tall-stat">5</div>
            <div class="tall-label">20%<br>of class<br><span style="opacity:0.7; font-size:0.7rem;">grade avg: 15%</span></div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 style="font-size:1.2rem; font-weight:800; margin:0; color:#1e293b;">Students Proficiency</h2>
          <div style="font-size:0.85rem; font-weight:700; color:#94a3b8; display:flex; gap:20px;">
            <span style="color:#334155;"><i class="far fa-clock"></i> Learning Objectives</span>
            <span>All Strands</span>
          </div>
        </div>
        
        <div class="table-header-row mb-2">
          <div class="col-1">Full Name <i class="fas fa-chevron-up ms-1"></i></div>
          <div class="col-2">Work Completed</div>
          <div class="col-3">Average Score <i class="fas fa-chevron-down ms-1"></i></div>
          <div class="col-4">Needing Attention</div>
          <div class="col-5">Working Towards</div>
          <div class="col-6">Mastered</div>
        </div>
        <div id="studentTableBody">
          <!-- Loaded via JS -->
        </div>

      </div>

      <!-- TEACHERS TAB -->
      <div id="tab-teachers" class="fade-in d-none">
        <div class="section-header">
          <h1 class="section-title">Teachers Hub</h1>
          <button class="btn-solid" onclick="openModal('teacherModal')"><i class="fas fa-plus me-2"></i> Add Teacher</button>
        </div>
        
        <div class="table-header-row">
          <div class="col-1">Full Name</div>
          <div class="col-3">Assigned Class</div>
          <div class="col-2">Invitation Code</div>
          <div class="col-2">Status</div>
          <div class="col-actions"></div>
        </div>
        <div id="teacherTableBody">
          <!-- Loaded via JS -->
        </div>
      </div>

      <!-- STUDENTS TAB (Main Student Directory) -->
      <div id="tab-students" class="fade-in d-none">
        <div class="section-header">
          <h1 class="section-title">Students Directory</h1>
          <button class="btn-solid" style="background:#84cc16;" onclick="openModal('studentModal')"><i class="fas fa-user-plus me-2"></i> Enroll Student</button>
        </div>
        
        <div class="table-header-row mb-2">
          <div class="col-1">Full Name</div>
          <div class="col-2">Class</div>
          <div class="col-2">Student Code</div>
          <div class="col-2">Parent Code</div>
          <div class="col-actions"></div>
        </div>
        <div id="studentDirectoryBody">
          <!-- Loaded via JS -->
        </div>
      </div>

      <!-- ATTENDANCE TAB -->
      <div id="tab-attendance" class="fade-in d-none">
        <div class="section-header">
          <h1 class="section-title">Automated Attendance</h1>
          <div style="background:white; padding:10px 20px; border-radius:15px; box-shadow:0 10px 25px rgba(0,0,0,0.03); font-weight:800; color:#3b82f6;">
            <i class="far fa-calendar-alt"></i> <span id="currentDateDisplay">Date Here</span>
          </div>
        </div>
        
        <div class="hero-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:2rem;">
          <div class="hero-card card-green" style="display:flex; justify-content:space-between; align-items:center;">
             <div>
                <div class="tall-stat" id="attPresent">0</div>
                <div class="tall-label">Total Present Today</div>
             </div>
             <i class="fas fa-check-circle" style="font-size:4rem; opacity:0.3;"></i>
          </div>
          <div class="hero-card card-green" style="display:flex; justify-content:space-between; align-items:center;">
             <div>
                <div class="tall-stat" id="attAbsent">0</div>
                <div class="tall-label">Total Absent</div>
             </div>
             <i class="fas fa-times-circle" style="font-size:4rem; opacity:0.3;"></i>
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
      <div id="tab-settings" class="fade-in d-none">
        <div class="section-header">
          <h1 class="section-title">Platform Settings</h1>
        </div>
        <div style="background:white; border-radius:24px; padding:2rem; max-width:500px; box-shadow:0 10px 25px rgba(0,0,0,0.03);">
          <div class="form-group mb-4">
            <label>School Name</label>
            <input type="text" class="form-input" id="setSchoolName" disabled value="SEERAHT Demo School">
          </div>
          <div class="form-group mb-4">
            <label>Admin Email</label>
            <input type="email" class="form-input" disabled value="admin@seeraht.demo">
          </div>
          <button class="btn-solid" style="opacity:0.6; cursor:not-allowed;">Save Settings</button>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- MODALS -->
<div id="teacherModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0; font-weight:800;">Add New Teacher</h3>
    <div class="form-group mt-3">
      <label>Full Name</label>
      <input type="text" id="newTchName" class="form-input" placeholder="e.g. Muallima Fatima">
    </div>
    <div class="form-group">
      <label>Assign Class</label>
      <select id="newTchClass" class="form-input">
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
      </select>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn-outline-light" onclick="closeModal('teacherModal')">Cancel</button>
      <button class="btn-solid" onclick="mockAddTeacher()">Create Profile</button>
    </div>
  </div>
</div>

<div id="studentModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0; font-weight:800;">Enroll Student</h3>
    <div class="form-group mt-3">
      <label>Student Name</label>
      <input type="text" id="newStuName" class="form-input" placeholder="e.g. Umar">
    </div>
    <div class="form-group">
      <label>Assign Class</label>
      <select id="newStuClass" class="form-input">
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
      </select>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn-outline-light" onclick="closeModal('studentModal')">Cancel</button>
      <button class="btn-solid" style="background:#D63678;" onclick="mockAddStudent()">Enroll & Codes</button>
    </div>
  </div>
</div>

<!-- Edit Teacher Modal -->
<div id="editTeacherModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0; font-weight:800;">Edit Teacher</h3>
    <input type="hidden" id="editTchId">
    <div class="form-group mt-3">
      <label>Full Name</label>
      <input type="text" id="editTchName" class="form-input">
    </div>
    <div class="form-group">
      <label>Assign Class</label>
      <select id="editTchClass" class="form-input">
        <option value="Class 1">Class 1</option>
        <option value="Class 2">Class 2</option>
        <option value="Class 3">Class 3</option>
      </select>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn-outline-light" onclick="closeModal('editTeacherModal')">Cancel</button>
      <button class="btn-solid" onclick="saveEditTeacher()">Save Changes</button>
    </div>
  </div>
</div>

<!-- Edit Student Modal -->
<div id="editStudentModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0; font-weight:800;">Edit Student</h3>
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
      </select>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn-outline-light" onclick="closeModal('editStudentModal')">Cancel</button>
      <button class="btn-solid" style="background:#84cc16;" onclick="saveEditStudent()">Save Changes</button>
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

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

  function genCode(prefix) { return prefix + '-' + Math.random().toString(36).substr(2,5).toUpperCase(); }

  const loginView = document.getElementById('adminLoginView');
  const dashboardView = document.getElementById('adminDashboardView');
  
  let currentAdminSession = null;
  let teachersList = [];
  let studentsList = [];
  let invitesList = [];

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === 'school_admin') {
         currentAdminSession = { ...userDoc.data(), uid: user.uid };
         loginView.classList.add('d-none');
         
         document.getElementById('setSchoolName').value = currentAdminSession.name || "School";
         
         await loadDashboardData();
      } else {
         alert("Unauthorized. This portal is for School Admins only.");
         signOut(auth);
         loginView.classList.remove('d-none');
         dashboardView.classList.add('d-none');
      }
    } else {
      loginView.classList.remove('d-none');
      dashboardView.classList.add('d-none');
    }
  });

  window.attemptAdminLogin = () => {
    alert('Please use the central login page (Auth) to access your account.');
    window.location.href = '/auth';
  };

  window.logoutAdmin = () => {
    signOut(auth).then(() => {
      sessionStorage.removeItem('auth_user');
      window.location.href = '/auth';
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

  function renderUI() {
    const teachers = teachersList;
    const students = studentsList;
    
    let totalSchoolPoints = 68; // Mock overall score
    
    document.getElementById('statTeachers').textContent = Math.max(1, teachers.length);
    document.getElementById('statStudents').textContent = Math.max(1, students.length);
    document.getElementById('statPoints').textContent = totalSchoolPoints + '%';
    document.getElementById('statTotalPop').textContent = (teachers.length + students.length > 0) ? (teachers.length + students.length) : 36;

    const themeColors = ['row-peach', 'row-yellow', 'row-green'];
    const bgColors = ['#fb923c', '#fbbf24', '#4ade80'];

    // Teachers
    let tchHtml = '';
    teachers.forEach((t, i) => {
      const motif = themeColors[i % 3];
      const color = bgColors[i % 3];
      const code = t.invitation_code || 'Accepted';
      tchHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="https://ui-avatars.com/api/?name=' + t.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#','') + '" style="border-radius:50%; width:40px;">' + t.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (t.class_id||t.assigned_class||'All Classes') + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + code + '</code></div>' +
        '<div class="col-2"><span style="color:#22c55e;font-weight:800;"><i class="fas fa-check-circle"></i> Active</span></div>' +
        '<div class="col-actions"><button class="action-btn" onclick="editTeacher(\\'' + t.uid + '\\')"><i class="fas fa-edit"></i></button></div></div>';
    });
    
    // Pending Teachers
    invitesList.filter(inv => inv.role === 'teacher' && inv.status === 'pending').forEach((inv, i) => {
      tchHtml += '<div class="pill-row row-peach" style="opacity:0.6;">' +
        '<div class="col-1 d-flex align-items-center gap-3"><div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-user-clock"></i></div>' + inv.name + '</div>' +
        '<div class="col-3"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + inv.class_id + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + inv.code + '</code></div>' +
        '<div class="col-2"><span style="color:#f59e0b;font-weight:800;"><i class="fas fa-clock"></i> Pending</span></div>' +
        '<div class="col-actions"></div></div>';
    });
    document.getElementById('teacherTableBody').innerHTML = tchHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No teachers added yet.</div>';

    // Students Directory
    let stuDirHtml = '';
    students.forEach((s, i) => {
      const motif = themeColors[(i+1) % 3];
      const color = bgColors[(i+1) % 3];
      const stuCode = s.invitation_code || 'Accepted';

      stuDirHtml += '<div class="pill-row ' + motif + '">' +
        '<div class="col-1 d-flex align-items-center gap-3"><img src="https://ui-avatars.com/api/?name=' + s.name.replace(' ', '+') + '&background=fff&color=' + color.replace('#','') + '" style="border-radius:50%; width:40px;">' + s.name + '</div>' +
        '<div class="col-2"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + (s.class_id || 'Unknown') + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + stuCode + '</code></div>' +
        '<div class="col-2"><span style="color:#22c55e;"><i class="fas fa-check-circle"></i> Active</span></div>' +
        '<div class="col-actions"><button class="action-btn" onclick="editStudent(\\'' + s.uid + '\\')"><i class="fas fa-edit"></i></button></div></div>';
    });
    
    // Pending Students
    invitesList.filter(inv => inv.role === 'student' && inv.status === 'pending').forEach((inv, i) => {
      // Find matching parent invite
      const parInv = invitesList.find(pi => pi.role === 'parent' && pi.linked_student_code === inv.code);
      const parCode = parInv ? parInv.code : 'N/A';
      
      stuDirHtml += '<div class="pill-row row-yellow" style="opacity:0.6;">' +
        '<div class="col-1 d-flex align-items-center gap-3"><div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><i class="fas fa-user-clock"></i></div>' + inv.name + '</div>' +
        '<div class="col-2"><span style="background:rgba(255,255,255,0.7); padding:5px 12px; border-radius:20px; font-weight:800;">' + inv.class_id + '</span></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + inv.code + '</code></div>' +
        '<div class="col-2"><code style="background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:8px; font-size:0.8rem;">' + parCode + '</code></div>' +
        '<div class="col-actions"></div></div>';
    });
    document.getElementById('studentDirectoryBody').innerHTML = stuDirHtml || '<div style="text-align:center; padding:2rem; color:#94a3b8; font-weight:700;">No students enrolled yet.</div>';

    document.getElementById('studentTableBody').innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">Proficiency Analytics will pull from Firebase Activities soon.</div>';
    document.getElementById('attendanceTableBody').innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">Automated Attendance features coming soon.</div>';
  }

  window.openModal = (id) => { document.getElementById(id).classList.remove('d-none'); }
  window.closeModal = (id) => { document.getElementById(id).classList.add('d-none'); }
  window.copyCode = (code) => { navigator.clipboard.writeText(code); }

  window.switchAdminTab = (tab) => {
    ['overview', 'teachers', 'students', 'attendance', 'settings'].forEach(t => {
      document.getElementById('tab-' + t).classList.add('d-none');
      document.getElementById('nav-' + t).classList.remove('active');
    });
    document.getElementById('tab-' + tab).classList.remove('d-none');
    document.getElementById('nav-' + tab).classList.add('active');
  };

  window.mockAddTeacher = async () => {
    const name = document.getElementById('newTchName').value.trim();
    const cls = document.getElementById('newTchClass').value;
    if(!name) return;
    
    const tchCode = genCode('TCH');
    const btn = event.target; btn.disabled = true; btn.textContent = 'Generating...';

    try {
      await setDoc(doc(db, "invites", tchCode), {
        code: tchCode,
        role: 'teacher',
        school_id: currentAdminSession.school_id,
        class_id: cls,
        name: name,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      closeModal('teacherModal');
      document.getElementById('newTchName').value = '';
      
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
      btn.disabled = false; btn.textContent = 'Create Profile';
    }
  };

  window.mockAddStudent = async () => {
    const name = document.getElementById('newStuName').value.trim();
    const cls = document.getElementById('newStuClass').value;
    if(!name) return;
    
    const stuCode = genCode('STU');
    const parCode = genCode('PAR');
    const btn = event.target; btn.disabled = true; btn.textContent = 'Generating...';

    try {
      await setDoc(doc(db, "invites", stuCode), {
        code: stuCode,
        role: 'student',
        school_id: currentAdminSession.school_id,
        class_id: cls,
        name: name,
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
      btn.disabled = false; btn.textContent = 'Enroll & Codes';
    }
  };

  window.editTeacher = (uid) => { alert('Edit feature via Firebase coming soon.'); };
  window.deleteTeacher = (uid) => { alert('Delete feature via Firebase coming soon.'); };
  window.editStudent = (uid) => { alert('Edit feature via Firebase coming soon.'); };
  window.deleteStudent = (uid) => { alert('Delete feature via Firebase coming soon.'); };

</script>

`
