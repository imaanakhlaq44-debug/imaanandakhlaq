
  (() => {
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
      // Don't auto-redirect, show the login mock view
      loginView.classList.remove('d-none');
      dashboardView.classList.add('d-none');
    }
    
    window.attemptAdminLogin = () => {
      const input = document.getElementById('adminPinInput').value;
      if (input === '9999') {
         const dummySession = {
           schoolId: 'sch_demo_01',
           schoolName: 'SEERAHT Demo School',
           adminName: 'Principal Administrator'
         };
         sessionStorage.setItem('admin_session', JSON.stringify(dummySession));
         loginView.classList.add('d-none');
         showDashboard(dummySession);
      } else {
         alert('Invalid Demo PIN. Use 9999');
      }
    };
    
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
      let gameState = JSON.parse(localStorage.getItem('imaan_game_state') || '{"coins":0}');
      totalSchoolPoints += (gameState.coins || 0);

      
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

  })();
