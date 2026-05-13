const fs = require('fs');
const file = 'imaan_hostinger/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// Replace CSS
const cssStart = content.indexOf('<style>');
const cssEnd = content.indexOf('</style>') + 8;

const newCss = `<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --bg-main: #f3f4f6;
    --bg-card: #ffffff;
    --text-main: #111827;
    --text-muted: #6b7280;
    --border: #e5e7eb;
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --sidebar-bg: #111827;
    --sidebar-text: #9ca3af;
    --sidebar-text-hover: #ffffff;
    --sidebar-active: #1f2937;
  }

  * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { margin: 0; padding: 0; background-color: var(--bg-main); color: var(--text-main); }
  
  .d-none { display: none !important; }
  
  /* LOGIN PAGE */
  .login-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-main); }
  .login-card { background: var(--bg-card); padding: 3rem 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 440px; border: 1px solid var(--border); }
  .login-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main); text-align: center; }
  .login-subtitle { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 2rem; text-align: center; }
  .input-light, .form-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
  .input-light:focus, .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  .btn-primary-light, .btn-solid { width: 100%; padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .btn-primary-light:hover, .btn-solid:hover { background: var(--primary-hover); }
  .btn-outline-light { background: white; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .btn-outline-light:hover { background: #f9fafb; }

  /* DASHBOARD LAYOUT */
  .admin-page { padding: 0; min-height: 100vh; display: block; }
  .app-container { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; background: var(--bg-main); border: none; padding: 0; box-shadow: none; border-radius: 0; }
  .app-container::before { display: none; }
  
  /* SIDEBAR */
  .top-nav { background: var(--sidebar-bg); border-right: 1px solid #1f2937; padding: 1.5rem 1rem; display: flex; flex-direction: column; }
  .nav-brand { padding: 0 0.5rem 2rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #374151; margin-bottom: 1.5rem; }
  .brand-mark { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; background: white; display: flex; align-items: center; justify-content: center;}
  .brand-mark img { width: 100%; height: 100%; object-fit: cover; }
  .sidebar-cam-badge { display: none; }
  .brand-title { font-size: 1.1rem; font-weight: 600; color: white; }
  
  .nav-center { flex: 1 1 auto; }
  .nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .nav-links li { padding: 0.75rem 1rem; border-radius: 8px; color: var(--sidebar-text); font-weight: 500; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.75rem; border: none; background: transparent; }
  .nav-links li:hover { background: rgba(255,255,255,0.05); color: var(--sidebar-text-hover); transform: none; border: none;}
  .nav-links li.active { background: var(--sidebar-active); color: white; font-weight: 600; transform: none; box-shadow: none; border: none;}
  .nav-links li::before { display: none; }
  
  .nav-actions { margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid #374151; }
  .nav-profile { display: flex; align-items: center; gap: 0.75rem; color: white; margin-bottom: 0.5rem; background: transparent; border: none; padding: 0;}
  .nav-profile .avatar-mini { width: 36px; height: 36px; border-radius: 50%; }
  .nav-profile strong { font-size: 0.9rem; font-weight: 600; display: block; }
  .nav-profile span { font-size: 0.75rem; color: var(--sidebar-text); }
  .nav-actions button { background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; text-align: left; padding-left: 1rem; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s; box-shadow: none;}
  .nav-actions button:hover { background: rgba(255,255,255,0.15); transform: none; box-shadow: none;}
  .nav-actions button span { display: inline-block; }

  /* MAIN CONTENT */
  .main-content { background: var(--bg-main); overflow-y: auto; display: flex; flex-direction: column; padding: 0;}
  .workspace-topbar { background: white; border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; align-items: center; justify-content: flex-end; position: sticky; top: 0; z-index: 10; height: 65px; border-radius: 0; box-shadow: none;}
  .workspace-tools { display: flex; align-items: center; gap: 1rem; }
  .workspace-tool { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; position: relative; padding: 0; border-radius: 0;}
  .workspace-tool:hover { background: none; transform: none; border: none; color: var(--text-main); }
  .workspace-tool span { position: absolute; top: -5px; right: -8px; background: #ef4444; color: white; font-size: 0.65rem; padding: 2px 5px; border-radius: 10px; font-weight: bold; border: none; }
  .workspace-admin-chip { display: flex; align-items: center; gap: 0.5rem; border-left: 1px solid var(--border); padding-left: 1rem; background: transparent; border-top: none; border-bottom: none; border-right: none; border-radius: 0;}
  .workspace-admin-chip strong { font-size: 0.85rem; color: var(--text-main); }
  .workspace-admin-chip span { font-size: 0.75rem; color: var(--text-muted); }
  .workspace-admin-chip i { display: none; }

  .tab-panel { padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; background: transparent; border: none; box-shadow: none; border-radius: 0; }
  .tab-panel::before { display: none; }
  
  .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; border-bottom: none; padding-bottom: 0; }
  .section-shell { display: flex; align-items: center; gap: 1rem; }
  .section-asset { display: none; }
  .section-eyebrow { display: none; }
  .section-title { font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .section-subtitle { font-size: 0.95rem; color: var(--text-muted); margin: 0; max-width: 100%;}
  .section-actions { display: flex; gap: 0.75rem; align-items: center; background: transparent; border: none; padding: 0; }
  
  .class-filter-wrap { background: white; border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem; display: flex; align-items: center; flex-direction: row; gap: 0.5rem; min-width: auto; }
  .class-filter-label { display: none; }
  .class-filter-select { border: none; background: transparent; font-size: 0.9rem; font-weight: 600; padding: 0; box-shadow: none; outline: none; }
  .class-filter-select:focus { border: none; box-shadow: none; }
  .filter-summary { display: none; }
  .status-pill { display: none; }
  .layout-toggle { display: none; }

  /* STAT CARDS */
  .hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
  .metric-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; }
  .metric-card .metric-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .metric-card .tall-stat { font-size: 2.25rem; font-weight: 700; color: var(--text-main); margin: 0; line-height: 1; }
  .metric-card .metric-meta { font-size: 0.85rem; color: #10b981; font-weight: 500; margin-top: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }

  /* TABLES */
  .widget-panel { background: white; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; margin-bottom: 2rem;}
  .subsection-toolbar { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #f9fafb; margin-bottom: 0; }
  .subsection-toolbar h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; }
  
  .table-header-row { display: flex; padding: 0.75rem 1.5rem; background: #f9fafb; border-bottom: 1px solid var(--border); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
  
  #studentTableBody, #teacherTableBody, #studentDirectoryBody, #attendanceTableBody { display: flex; flex-direction: column; gap: 0;}
  .pill-row { display: flex; padding: 1rem 1.5rem; align-items: center; border-bottom: 1px solid var(--border); transition: background 0.15s; font-size: 0.9rem; color: var(--text-main); font-weight: 500; background: white; border-radius: 0; box-shadow: none; margin: 0;}
  .pill-row:hover { background: #f9fafb; transform: none; box-shadow: none; border-color: var(--border); }
  .pill-row:last-child { border-bottom: none; }
  
  .col-1 { flex: 2; display: flex; align-items: center; gap: 0.75rem; text-align: left; }
  .col-2 { flex: 1; display: flex; align-items: center; text-align: left; }
  .col-3 { flex: 2; display: flex; align-items: center; text-align: left; }
  .col-4 { flex: 1; display: flex; align-items: center; text-align: left; }
  .col-5 { flex: 1; display: flex; align-items: center; text-align: left; }
  .col-6 { flex: 1; display: flex; align-items: center; text-align: left; }
  .col-actions { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; text-align: right; }
  
  .action-btn { background: none; border: none; color: var(--text-muted); padding: 0.4rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 1rem; display: inline-flex; }
  .action-btn:hover { background: #f3f4f6; color: var(--primary); }
  .action-btn.text-danger:hover { color: #ef4444; background: #fee2e2; }

  /* BADGES & PILLS */
  .badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; }
  .badge-blue { background: #eff6ff; color: #2563eb; }
  .badge-green { background: #ecfdf5; color: #10b981; }
  .badge-yellow { background: #fffbeb; color: #d97706; }
  .copyable-code { font-family: monospace; background: #f3f4f6; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; font-size: 0.85rem; color: #374151; display: inline-block;}
  
  /* MODALS */
  .modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .modal-content { background: white; border-radius: 16px; padding: 2rem; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; }
  .modal-wide { max-width: 800px; }
  .modal-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 1.5rem; color: var(--text-main); }
  .modal-footer-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
  .btn-close-modal { position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; font-size: 1.25rem; color: var(--text-muted); cursor: pointer; }

  /* BULK SELECT */
  .bulk-select-bar { position: fixed; bottom: 0; left: 260px; right: 0; z-index: 99; background: var(--text-main); color: white; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; transform: translateY(100%); transition: transform 0.3s; border-radius: 12px 12px 0 0; margin: 0 2rem; box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1); }
  .bulk-select-bar.visible { transform: translateY(0); }
  .bulk-select-bar .bulk-count { font-size: 0.95rem; font-weight: 600; }
  .bulk-select-bar .bulk-actions { display: flex; gap: 0.75rem; }
  .bulk-btn { padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.85rem; transition: background 0.2s; }
  .bulk-btn-delete { background: #ef4444; color: white; }
  .bulk-btn-delete:hover { background: #dc2626; transform: none; }
  .bulk-btn-cancel { background: rgba(255,255,255,0.1); color: white; }
  .bulk-btn-cancel:hover { background: rgba(255,255,255,0.2); }
  
  .row-checkbox { width: 1.1rem; height: 1.1rem; border-radius: 4px; accent-color: var(--primary); cursor: pointer; margin-right: 0.75rem; margin-top: 0; }
  .pill-row.selected { background: #eff6ff; border-color: #bfdbfe !important; border: 1px solid #bfdbfe; }
  .select-all-wrap { display: flex; align-items: center; gap: 0.75rem; flex: 0 0 auto; margin-right: 1rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
  .select-all-wrap input { margin: 0; }

  .progress-bar-container { background: #f3f4f6; border-radius: 999px; height: 8px; width: 100px; position: relative; overflow: hidden; border: none; }
  .progress-bar-fill { height: 100%; background: var(--primary); border-radius: 999px; transition: width 0.3s; }
  .level-text { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-left: 0.5rem; }

  @media (max-width: 768px) {
    .app-container { grid-template-columns: 1fr; }
    .top-nav { display: none; } /* Add mobile menu toggle later */
    .bulk-select-bar { left: 0; margin: 0; border-radius: 0; }
  }
</style>`;
content = content.substring(0, cssStart) + newCss + content.substring(cssEnd);

// Rewrite the Overview tab HTML to be clean
const overviewStart = content.indexOf('<!-- OVERVIEW TAB -->');
const overviewEnd = content.indexOf('<!-- TEACHERS TAB -->');

const newOverviewHtml = `<!-- OVERVIEW TAB -->
      <div id="tab-overview" class="tab-panel">
        <div class="section-header">
          <div class="section-shell">
            <div class="section-copy">
              <h1 class="section-title">Overview</h1>
              <p class="section-subtitle">Monitor school operations, active teachers, and student enrollments.</p>
            </div>
          </div>
          <div class="section-actions">
            <label class="class-filter-wrap">
              <select id="classFilterSelect" class="class-filter-select" onchange="applyClassFilter(this.value)">
                <option value="all">All Classes</option>
              </select>
            </label>
          </div>
        </div>

        <div class="hero-grid">
          <div class="metric-card">
            <div class="metric-label"><i class="fas fa-chalkboard-teacher" style="color:var(--primary);"></i> Total Teachers</div>
            <div class="tall-stat" id="statTeachers">0</div>
            <div class="metric-meta"><i class="fas fa-arrow-up"></i> Active directory</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><i class="fas fa-user-graduate" style="color:#10b981;"></i> Enrolled Students</div>
            <div class="tall-stat" id="statStudents">0</div>
            <div class="metric-meta"><i class="fas fa-arrow-up"></i> In selected view</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><i class="fas fa-envelope-open-text" style="color:#f59e0b;"></i> Pending Invites</div>
            <div class="tall-stat" id="statPending">0</div>
            <div class="metric-meta" style="color:#d97706;"><i class="fas fa-clock"></i> Awaiting registration</div>
          </div>
          <div class="metric-card">
            <div class="metric-label"><i class="fas fa-layer-group" style="color:#6366f1;"></i> Classes Tracked</div>
            <div class="tall-stat" id="statClassesInScope">0</div>
            <div class="metric-meta" style="color:#6b7280;"><i class="fas fa-check-circle"></i> System wide</div>
          </div>
        </div>

        <div class="widget-panel">
          <div class="subsection-toolbar">
            <h2><i class="fas fa-users" style="color: var(--text-muted);"></i> Recent Students</h2>
            <button class="btn-outline-light" style="padding:0.4rem 1rem; font-size:0.85rem;" onclick="switchAdminTab('students')">View Directory</button>
          </div>
          <div class="table-header-row">
            <div class="col-1">Student Name</div>
            <div class="col-3">Class</div>
            <div class="col-2">Progress</div>
            <div class="col-2">XP</div>
            <div class="col-2">Level</div>
            <div class="col-actions"></div>
          </div>
          <div id="studentTableBody">
            <div style="padding:2rem; text-align:center; color:var(--text-muted);">Loading students...</div>
          </div>
        </div>
      </div>
      
      `;

content = content.substring(0, overviewStart) + newOverviewHtml + content.substring(overviewEnd);

// Fix nav icons to be inline html
content = content.replace(/<ul class=\"nav-links\">\s*<li class=\"active\" id=\"nav-overview\" onclick=\"switchAdminTab\('overview'\)\">Dashboard<\/li>\s*<li id=\"nav-teachers\" onclick=\"switchAdminTab\('teachers'\)\">Teachers<\/li>\s*<li id=\"nav-students\" onclick=\"switchAdminTab\('students'\)\">Students<\/li>\s*<li id=\"nav-attendance\" onclick=\"switchAdminTab\('attendance'\)\">Attendance<\/li>\s*<li id=\"nav-settings\" onclick=\"switchAdminTab\('settings'\)\">Settings<\/li>\s*<\/ul>/, 
`<ul class="nav-links">
  <li class="active" id="nav-overview" onclick="switchAdminTab('overview')"><i class="fas fa-chart-line"></i> Dashboard</li>
  <li id="nav-teachers" onclick="switchAdminTab('teachers')"><i class="fas fa-chalkboard-teacher"></i> Teachers</li>
  <li id="nav-students" onclick="switchAdminTab('students')"><i class="fas fa-user-graduate"></i> Students</li>
  <li id="nav-attendance" onclick="switchAdminTab('attendance')"><i class="fas fa-calendar-check"></i> Attendance</li>
  <li id="nav-settings" onclick="switchAdminTab('settings')"><i class="fas fa-cog"></i> Settings</li>
</ul>`);

// Fix progress bars output from JS
content = content.replace(/background: linear-gradient[^;]+;/g, function(match) {
  if (match.includes('row-peach') || match.includes('row-yellow')) return '';
  return match;
});

// Save file
fs.writeFileSync(file, content, 'utf8');
console.log('CSS and Overview updated!');
