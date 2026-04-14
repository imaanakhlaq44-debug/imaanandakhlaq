import { html } from 'hono/html'

export const DemoSwitcher = () => html`
<style>
  .demo-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
    border-radius: 30px;
    padding: 8px 15px;
    z-index: 9999;
    display: flex;
    gap: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
  }
  .demo-btn {
    background: transparent;
    border: none;
    color: white;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 20px;
    transition: all 0.2s;
  }
  .demo-btn:hover {
    background: rgba(255,255,255,0.2);
  }
  .demo-btn.active {
    background: #0ea5e9;
  }
</style>
<div class="demo-switcher">
  <span style="color: #cbd5e1; font-size: 0.8rem; display: flex; align-items: center; margin-right: 5px; font-family: 'Nunito', sans-serif;">Demo:</span>
  <a href="./student-activities.html" class="demo-btn" id="demoStudentBtn"><i class="fas fa-user-graduate"></i> Student</a>
  <a href="./teacher-dashboard.html" class="demo-btn" id="demoTeacherBtn"><i class="fas fa-chalkboard-teacher"></i> Teacher</a>
  <a href="./parent-dashboard.html" class="demo-btn" id="demoParentBtn"><i class="fas fa-user-friends"></i> Parent</a>
  <a href="./admin-dashboard.html" class="demo-btn" id="demoAdminBtn"><i class="fas fa-school"></i> School</a>
</div>
<script>
    if(window.location.pathname.includes('/student/') || window.location.pathname.includes('/activity/')) {
      document.getElementById('demoStudentBtn').classList.add('active');
    } else if (window.location.pathname.includes('/teacher/')) {
      document.getElementById('demoTeacherBtn').classList.add('active');
    } else if (window.location.pathname.includes('/parent/')) {
      document.getElementById('demoParentBtn').classList.add('active');
    } else if (window.location.pathname.includes('/admin/')) {
      document.getElementById('demoAdminBtn').classList.add('active');
    }
</script>
`
