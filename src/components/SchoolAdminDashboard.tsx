import { html } from 'hono/html'

export const SchoolAdminDashboard = () => html`
<style>
  .admin-page {
    background: #0c0f1a;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
  }

  /* Login Styling */
  .login-wrapper {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #030712 0%, #1a0a2e 50%, #0c1631 100%);
    position: relative;
    overflow: hidden;
  }
  .login-wrapper::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
    top: -150px;
    right: -100px;
    border-radius: 50%;
  }
  .login-wrapper::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
    border-radius: 50%;
  }
  .login-card {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    padding: 3rem;
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.08);
    text-align: center;
    width: 100%;
    max-width: 450px;
    position: relative;
    z-index: 1;
  }
  .saas-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 10px;
    font-size: 1.5rem;
    letter-spacing: 1rem;
    text-align: center;
    font-family: monospace;
    transition: all 0.3s;
    outline: none;
    background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0;
  }
  .saas-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25), 0 0 20px rgba(99, 102, 241, 0.15);
  }
  .saas-btn {
    width: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    padding: 12px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  }
  .saas-btn:hover { 
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  /* Dashboard Layout */
  .sidebar {
    width: 270px;
    background: linear-gradient(180deg, #0a0e1a 0%, #111827 100%);
    color: #f8fafc;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(99, 102, 241, 0.1);
  }
  .sidebar-header {
    padding: 24px;
    font-size: 1.25rem;
    font-weight: 700;
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent);
  }
  .nav-menu { list-style: none; padding: 15px; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .nav-item { 
    padding: 12px 20px; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    color: #cbd5e1; 
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(145deg, #1e293b, #0f172a);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 
      0 4px 6px -1px rgba(0, 0, 0, 0.2), 
      0 2px 4px -1px rgba(0, 0, 0, 0.1),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }
  .nav-item:hover { 
    transform: translateY(-2px);
    box-shadow: 
      0 8px 12px -2px rgba(0, 0, 0, 0.3), 
      inset 0 1px 1px rgba(255, 255, 255, 0.15);
    color: white;
    background: linear-gradient(145deg, #334155, #1e293b);
  }
  .nav-item.active { 
    background: linear-gradient(145deg, #4f46e5, #3730a3);
    color: white; 
    border-color: #6366f1;
    box-shadow: 
      0 6px 15px rgba(79, 70, 229, 0.4),
      inset 0 2px 2px rgba(255, 255, 255, 0.2),
      inset 0 -2px 5px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }
  .nav-item i {
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
  }
  
  .main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: #0c0f1a;
  }
  .topbar {
    height: 70px;
    background: rgba(17, 24, 39, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
  }

  .content-pad {
    padding: 30px;
    background: linear-gradient(180deg, #0c0f1a 0%, #111827 100%);
    min-height: calc(100vh - 70px);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  .stat-card {
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .stat-card:hover {
    transform: translateY(-3px);
  }
  .stat-card-teachers {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.2);
  }
  .stat-card-teachers:hover { box-shadow: 0 8px 30px rgba(79, 70, 229, 0.35); }
  .stat-card-students {
    background: linear-gradient(135deg, #042f2e 0%, #115e59 100%);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
  }
  .stat-card-students:hover { box-shadow: 0 8px 30px rgba(16, 185, 129, 0.3); }
  .stat-card-score {
    background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
  }
  .stat-card-score:hover { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.3); }
  .stat-card::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .stat-title { color: rgba(255, 255, 255, 0.7); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .stat-value { font-size: 2.5rem; font-weight: 800; color: #ffffff; }

  /* SaaS Table */
  .table-card {
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    margin-bottom: 30px;
  }
  .table-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .table-header h3 { margin: 0; font-size: 1.1rem; color: #f1f5f9; }
  
  .saas-table {
    width: 100%;
    border-collapse: collapse;
  }
  .saas-table th {
    background: rgba(99, 102, 241, 0.06);
    text-align: left;
    padding: 12px 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #818cf8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .saas-table td {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 0.875rem;
    color: #cbd5e1;
  }
  .saas-table tr:last-child td { border-bottom: none; }
  .saas-table tr:hover td { background: rgba(99, 102, 241, 0.04); }
  
  .badge-class {
    background: rgba(99, 102, 241, 0.15); color: #a5b4fc; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .btn-outline {
    background: transparent; border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; transition: all 0.2s;
  }
  .btn-outline:hover { background: rgba(99, 102, 241, 0.15); border-color: #818cf8; }

  /* Modal */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(3, 7, 18, 0.85);
    backdrop-filter: blur(8px);
    display: flex; justify-content: center; align-items: center;
    z-index: 999;
  }
  .modal-content {
    background: #1e293b; padding: 30px; border-radius: 16px; width: 420px; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 25px 50px rgba(0,0,0,0.5); color: #e2e8f0;
  }
  .modal-content h3 { color: #f1f5f9; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 5px; color: #94a3b8; }
  .form-input { width: 100%; padding: 10px; border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; background: rgba(15, 23, 42, 0.8); color: #e2e8f0; }
  .form-input:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
</style>

<!-- LOGIN VIEW -->
<div id="adminLoginView" class="login-wrapper">
  <div class="login-card">
    <div style="font-size: 2.5rem; color: #818cf8; margin-bottom: 1rem; filter: drop-shadow(0 0 15px rgba(129, 140, 248, 0.4));"><i class="fas fa-shield-alt"></i></div>
    <h2 style="font-weight: 800; color: #f1f5f9; margin-bottom: 5px;">School Admin Portal</h2>
    <p style="color: #94a3b8; margin-bottom: 30px;">Manage Imaan & Akhlaq curriculum access.</p>
    
    <div style="background: rgba(99, 102, 241, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.2);">
      Demo Admin PIN: <strong>9999</strong>
    </div>

    <input type="password" id="adminPinInput" class="saas-input mb-4" maxlength="4" placeholder="••••">
    <button class="saas-btn" onclick="attemptAdminLogin()">Authenticate System</button>
  </div>
</div>

<!-- DASHBOARD VIEW -->
<div id="adminDashboardView" class="admin-page d-none">
  
  <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="sidebar-header">
      <i class="fas fa-building" style="color:#6366f1;"></i> <span id="schoolBrandName">School Name</span>
    </div>
    <ul class="nav-menu">
      <li class="nav-item active"><i class="fas fa-chart-pie" style="width:20px;"></i> Overview</li>
      <li class="nav-item" onclick="alert('Feature under development')"><i class="fas fa-chalkboard-teacher" style="width:20px;"></i> Teachers</li>
      <li class="nav-item" onclick="alert('Feature under development')"><i class="fas fa-user-graduate" style="width:20px;"></i> Students</li>
      <li class="nav-item" onclick="alert('Feature under development')"><i class="fas fa-cogs" style="width:20px;"></i> Settings</li>
    </ul>
    <div style="margin-top: auto; padding: 20px;">
      <button class="btn-outline w-100 text-start" style="background:rgba(239, 68, 68, 0.1); color:#f87171; border-color:rgba(239, 68, 68, 0.25);" onclick="location.reload()">
        <i class="fas fa-sign-out-alt me-2"></i> Log Out
      </button>
    </div>
  </div>

  <!-- MAIN AREA -->
  <div class="main-content">
    <div class="topbar">
      <div>
        <h2 style="margin:0; font-size:1.25rem; font-weight:700; color:#f1f5f9;" id="welcomeAdmin">Dashboard Overview</h2>
      </div>
      <div style="display:flex; align-items:center; gap:15px;">
        <span style="font-size:0.8rem; color:#64748b; background:rgba(16, 185, 129, 0.1); padding:4px 12px; border-radius:20px; border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399;"><i class="fas fa-circle" style="font-size:6px; vertical-align:middle; margin-right:5px;"></i> Live Prototype</span>
        <div style="width:35px; height:35px; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);">
          A
        </div>
      </div>
    </div>

    <div class="content-pad">
      
      <!-- STATS -->
      <div class="stats-grid">
        <div class="stat-card stat-card-teachers">
          <div class="d-flex justify-content-between">
            <div class="stat-title">Total Teachers</div>
            <i class="fas fa-chalkboard-teacher" style="color:rgba(165, 180, 252, 0.6); font-size:1.3rem;"></i>
          </div>
          <div class="stat-value" id="statTeachers">0</div>
        </div>
        <div class="stat-card stat-card-students">
          <div class="d-flex justify-content-between">
            <div class="stat-title">Enrolled Students</div>
            <i class="fas fa-users" style="color:rgba(110, 231, 183, 0.6); font-size:1.3rem;"></i>
          </div>
          <div class="stat-value" id="statStudents">0</div>
        </div>
        <div class="stat-card stat-card-score">
          <div class="d-flex justify-content-between">
            <div class="stat-title">School Score</div>
            <i class="fas fa-star" style="color:rgba(251, 191, 36, 0.6); font-size:1.3rem;"></i>
          </div>
          <div class="stat-value" id="statPoints">0</div>
        </div>
      </div>

      <!-- TEACHERS DIRECTORY -->
      <div class="table-card">
        <div class="table-header">
          <h3>Staff Directory</h3>
          <button class="saas-btn" style="width:auto; padding:8px 16px; font-size:0.875rem;" onclick="openModal('teacherModal')">
            <i class="fas fa-plus me-1"></i> Add Teacher
          </button>
        </div>
        <table class="saas-table">
          <thead>
            <tr><th>Teacher Name</th><th>Invitation Code</th><th>Assigned Class</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody id="teacherTableBody">
            <!-- Loaded via JS -->
          </tbody>
        </table>
      </div>

      <!-- STUDENTS DIRECTORY -->
      <div class="table-card">
        <div class="table-header">
          <h3>Student Roster</h3>
          <button class="saas-btn" style="width:auto; padding:8px 16px; font-size:0.875rem; background:#10b981;" onclick="openModal('studentModal')">
            <i class="fas fa-user-plus me-1"></i> Enroll Student
          </button>
        </div>
        <table class="saas-table">
          <thead>
            <tr><th>Student Name</th><th>Student Code</th><th>Parent Code</th><th>Class</th><th>Status</th></tr>
          </thead>
          <tbody id="studentTableBody">
            <!-- Loaded via JS -->
          </tbody>
        </table>
      </div>

    </div>
  </div>
</div>

<!-- MODALS -->
<div id="teacherModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0;">Add New Teacher</h3>
    <div class="form-group">
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
      <button class="btn-outline" onclick="closeModal('teacherModal')">Cancel</button>
      <button class="saas-btn" style="width:auto;" onclick="mockAddTeacher()">Create Profile</button>
    </div>
  </div>
</div>

<div id="studentModal" class="modal-overlay d-none">
  <div class="modal-content">
    <h3 style="margin-top:0;">Enroll Student</h3>
    <div class="form-group">
      <label>Student Name</label>
      <input type="text" id="newStuName" class="form-input" placeholder="e.g. Umar">
    </div>
    <div class="form-group">
      <label>Assign Class</label>
      <select id="newStuClass" class="form-input">
        <option value="Class 3">Class 3</option>
      </select>
    </div>
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button class="btn-outline" onclick="closeModal('studentModal')">Cancel</button>
      <button class="saas-btn" style="width:auto; background:#10b981;" onclick="mockAddStudent()">Generate PIN & Enroll</button>
    </div>
  </div>
</div>

<!-- Code Success Modal -->
<div id="codeSuccessModal" class="modal-overlay d-none">
  <div class="modal-content" style="max-width:500px;">
    <div style="text-align:center;">
      <div style="font-size:2.5rem; color:#34d399; margin-bottom:12px;"><i class="fas fa-check-circle"></i></div>
      <h3 id="codeSuccessTitle" style="margin-top:0;">Codes Generated!</h3>
      <p id="codeSuccessDesc" style="color:#94a3b8; font-size:0.9rem;"></p>
      <div id="codeSuccessBody"></div>
      <button class="saas-btn mt-3" onclick="closeModal('codeSuccessModal')">Done</button>
    </div>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Use shared auth DB from localStorage
    let DB = JSON.parse(localStorage.getItem('imaan_auth_db') || 'null');
    if (!DB) {
      DB = { schools:[], school_admins:[], teachers:[], parents:[], students:[], users:[], invitation_codes:[] };
    }
    function saveDB() { localStorage.setItem('imaan_auth_db', JSON.stringify(DB)); }
    function genCode(prefix) { return prefix + '-' + Math.random().toString(36).substr(2,5).toUpperCase(); }

    const loginView = document.getElementById('adminLoginView');
    const dashboardView = document.getElementById('adminDashboardView');
    const session = sessionStorage.getItem('admin_session');
    
    if (session) {
      loginView.classList.add('d-none');
      showDashboard(JSON.parse(session));
    } else {
      // Redirect to auth page if not logged in
      window.location.href = '/auth';
      return;
    }
    
    function showDashboard(sessionData) {
      dashboardView.classList.remove('d-none');
      document.body.style.margin = '0';
      
      document.getElementById('schoolBrandName').textContent = sessionData.schoolName;
      document.getElementById('welcomeAdmin').textContent = sessionData.adminName + ' Overview';
      
      // Re-read DB for latest data
      DB = JSON.parse(localStorage.getItem('imaan_auth_db') || '{}');
      const teachers = (DB.teachers||[]).filter(t => t.school_id === sessionData.schoolId);
      const students = (DB.students||[]).filter(s => s.school_id === sessionData.schoolId);
      
      let totalSchoolPoints = 0;
      students.forEach(s => totalSchoolPoints += (s.base_points||0));
      let gameState = JSON.parse(localStorage.getItem('imaan_game_state') || '{"points":0}');
      totalSchoolPoints += gameState.points;
      
      document.getElementById('statTeachers').textContent = teachers.length;
      document.getElementById('statStudents').textContent = students.length;
      document.getElementById('statPoints').textContent = totalSchoolPoints.toLocaleString();

      // Render Teacher Table with invitation codes
      let tchHtml = '';
      teachers.forEach(t => {
        const code = t.invitation_code || 'N/A';
        const inv = (DB.invitation_codes||[]).find(c => c.code === code);
        const status = inv ? (inv.status === 'used' ? '<span style="color:#34d399;">✅ Registered</span>' : '<span style="color:#fbbf24;">⏳ Pending</span>') : '<span style="color:#64748b;">—</span>';
        tchHtml += '<tr>' +
          '<td>' + t.name + '</td>' +
          '<td><code style="background:rgba(99,102,241,0.1); color:#a5b4fc; padding:3px 8px; border-radius:4px; font-size:0.8rem;">' + code + '</code> <button class="btn-outline" style="padding:2px 8px; font-size:0.7rem; margin-left:4px;" onclick="copyCode(\'' + code + '\')" title="Copy"><i class="fas fa-copy"></i></button></td>' +
          '<td><span class="badge-class">' + t.assigned_class + '</span></td>' +
          '<td>' + status + '</td>' +
          '<td><button class="btn-outline">Edit</button></td>' +
        '</tr>';
      });
      document.getElementById('teacherTableBody').innerHTML = tchHtml || '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:30px;">No teachers added yet. Click "Add Teacher" to generate an invitation code.</td></tr>';

      // Render Student Table with student & parent codes
      let stuHtml = '';
      students.forEach(s => {
        const stuCode = s.invitation_code || 'N/A';
        // Find matching parent code
        const parInv = (DB.invitation_codes||[]).find(c => c.type === 'parent' && c.linked_student_code === stuCode);
        const parCode = parInv ? parInv.code : 'N/A';
        const stuInv = (DB.invitation_codes||[]).find(c => c.code === stuCode);
        const stuStatus = stuInv ? (stuInv.status === 'used' ? '✅' : '⏳') : '—';
        const parStatus = parInv ? (parInv.status === 'used' ? '✅' : '⏳') : '—';
        stuHtml += '<tr>' +
          '<td><i class="' + (s.avatar||'fas fa-user') + ' me-2 text-primary"></i> ' + s.name + '</td>' +
          '<td><code style="background:rgba(245,158,11,0.1); color:#fbbf24; padding:3px 8px; border-radius:4px; font-size:0.8rem;">' + stuCode + '</code> ' + stuStatus + ' <button class="btn-outline" style="padding:2px 8px; font-size:0.7rem;" onclick="copyCode(\'' + stuCode + '\')" title="Copy"><i class="fas fa-copy"></i></button></td>' +
          '<td><code style="background:rgba(236,72,153,0.1); color:#f472b6; padding:3px 8px; border-radius:4px; font-size:0.8rem;">' + parCode + '</code> ' + parStatus + ' <button class="btn-outline" style="padding:2px 8px; font-size:0.7rem;" onclick="copyCode(\'' + parCode + '\')" title="Copy"><i class="fas fa-copy"></i></button></td>' +
          '<td><span class="badge-class">' + s.class_id + '</span></td>' +
          '<td>' + stuStatus + ' Student / ' + parStatus + ' Parent</td>' +
        '</tr>';
      });
      document.getElementById('studentTableBody').innerHTML = stuHtml || '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:30px;">No students enrolled yet. Click "Enroll Student" to generate codes.</td></tr>';
    }

    // Modal logic
    window.openModal = (id) => { document.getElementById(id).classList.remove('d-none'); }
    window.closeModal = (id) => { document.getElementById(id).classList.add('d-none'); }
    window.copyCode = (code) => { navigator.clipboard.writeText(code); }
    
    window.mockAddTeacher = () => {
      const name = document.getElementById('newTchName').value.trim();
      const cls = document.getElementById('newTchClass').value;
      if(!name) return;
      
      DB = JSON.parse(localStorage.getItem('imaan_auth_db') || '{}');
      const session = JSON.parse(sessionStorage.getItem('admin_session'));
      const tchCode = genCode('TCH');
      const tId = 'tch_' + Math.floor(Math.random()*1000);
      
      DB.teachers.push({ teacher_id:tId, school_id:session.schoolId, name:name, assigned_class:cls, email:'', phone:'', password:'', invitation_code:tchCode });
      DB.invitation_codes.push({ code:tchCode, type:'teacher', school_id:session.schoolId, status:'unused', used_by:'', name:name, assigned_class:cls });
      saveDB();
      
      closeModal('teacherModal');
      document.getElementById('newTchName').value = '';
      
      // Show code success modal
      document.getElementById('codeSuccessTitle').textContent = 'Teacher Slot Created!';
      document.getElementById('codeSuccessDesc').textContent = 'Share this code with ' + name + ' to complete their registration.';
      document.getElementById('codeSuccessBody').innerHTML =
        '<div style="background:rgba(16,185,129,0.08); border:2px dashed rgba(16,185,129,0.3); border-radius:12px; padding:16px; margin:16px 0;">' +
        '<div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Teacher Invitation Code</div>' +
        '<div style="font-family:monospace; font-size:1.5rem; font-weight:800; color:#34d399; letter-spacing:3px; margin:8px 0;">' + tchCode + '</div>' +
        '<button class="btn-outline" onclick="navigator.clipboard.writeText(\'' + tchCode + '\');this.textContent=\'Copied!\'"><i class="fas fa-copy me-1"></i> Copy Code</button></div>';
      openModal('codeSuccessModal');
      showDashboard(session);
    };

    window.mockAddStudent = () => {
      const name = document.getElementById('newStuName').value.trim();
      const cls = document.getElementById('newStuClass').value;
      if(!name) return;
      
      DB = JSON.parse(localStorage.getItem('imaan_auth_db') || '{}');
      const session = JSON.parse(sessionStorage.getItem('admin_session'));
      const stuCode = genCode('STU');
      const parCode = genCode('PAR');
      const sId = 'stu_' + Math.floor(Math.random()*1000);
      
      DB.students.push({ student_id:sId, school_id:session.schoolId, class_id:cls, parent_id:'unassigned', name:name, age:8, avatar:'fas fa-user', base_points:0, email:'', phone:'', password:'', invitation_code:stuCode });
      DB.invitation_codes.push({ code:stuCode, type:'student', school_id:session.schoolId, status:'unused', used_by:'', name:name, class_id:cls });
      DB.invitation_codes.push({ code:parCode, type:'parent', school_id:session.schoolId, status:'unused', used_by:'', linked_student_code:stuCode });
      saveDB();
      
      closeModal('studentModal');
      document.getElementById('newStuName').value = '';
      
      // Show code success modal with BOTH codes
      document.getElementById('codeSuccessTitle').textContent = 'Student Enrolled!';
      document.getElementById('codeSuccessDesc').textContent = 'Two codes generated for ' + name + '. Share them with the student and their parent.';
      document.getElementById('codeSuccessBody').innerHTML =
        '<div style="background:rgba(245,158,11,0.08); border:2px dashed rgba(245,158,11,0.3); border-radius:12px; padding:16px; margin:12px 0;">' +
        '<div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Student Code</div>' +
        '<div style="font-family:monospace; font-size:1.4rem; font-weight:800; color:#fbbf24; letter-spacing:3px; margin:6px 0;">' + stuCode + '</div>' +
        '<button class="btn-outline" onclick="navigator.clipboard.writeText(\'' + stuCode + '\');this.textContent=\'Copied!\'"><i class="fas fa-copy me-1"></i> Copy</button></div>' +
        '<div style="background:rgba(236,72,153,0.08); border:2px dashed rgba(236,72,153,0.3); border-radius:12px; padding:16px; margin:12px 0;">' +
        '<div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Parent Code</div>' +
        '<div style="font-family:monospace; font-size:1.4rem; font-weight:800; color:#f472b6; letter-spacing:3px; margin:6px 0;">' + parCode + '</div>' +
        '<button class="btn-outline" onclick="navigator.clipboard.writeText(\'' + parCode + '\');this.textContent=\'Copied!\'"><i class="fas fa-copy me-1"></i> Copy</button></div>';
      openModal('codeSuccessModal');
      showDashboard(session);
    };

  });
</script>
`
