
  // Defensive shim: ensure legacy DOM IDs always exist so JS innerHTML
  // assignments don't crash when the matching element was removed/restyled.
  (function ensureLegacyDomIds() {
    var ids = ['welcomeName', 'schoolNameTag', 'teacherInfo', 'classInfo'];
    function ensure() {
      ids.forEach(function (id) {
        if (!document.getElementById(id)) {
          var s = document.createElement('span');
          s.id = id;
          s.style.display = 'none';
          (document.body || document.documentElement).appendChild(s);
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensure, { once: true });
    } else {
      ensure();
    }
  })();

  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = {};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  const ACTIVITIES_DATA = {};
  
  let currentParent = null;
  let linkedStudent = null;
  let currentParentSection = 'overview';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function isVisible(element) {
    return !!(element && !element.classList.contains('d-none'));
  }

  function getParentSectionTarget(section) {
    const topSection = document.getElementById('parentTopSection');
    const linkCard = document.getElementById('linkStudentCard');
    const statsCard = document.getElementById('statsCard');
    const approvalsCard = document.getElementById('actionQueueCard');
    const familyCard = document.getElementById('familyNotesCard');
    const childTarget = isVisible(statsCard) ? statsCard : linkCard;

    if (section === 'child') return childTarget || topSection;
    if (section === 'approvals') return isVisible(approvalsCard) ? approvalsCard : (childTarget || topSection);
    if (section === 'family') return familyCard || (childTarget || topSection);
    return topSection;
  }

  function bindParentSectionControls() {
    document.querySelectorAll('.sidebar-nav li[data-section], .stat-card[data-section]').forEach((control) => {
      if (control.dataset.sectionBound === 'true') return;

      control.dataset.sectionBound = 'true';
      control.addEventListener('click', () => window.switchParentSection(control.dataset.section));
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.switchParentSection(control.dataset.section);
        }
      });
    });
  }

  window.switchParentSection = (section, shouldScroll = true) => {
    const nextSection = ['overview', 'child', 'approvals', 'family'].includes(section) ? section : 'overview';
    currentParentSection = nextSection;

    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((item) => {
      item.classList.toggle('active', item.dataset.section === nextSection);
    });

    document.querySelectorAll('.stat-card[data-section]').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.section === nextSection);
    });

    const target = getParentSectionTarget(nextSection);
    if (shouldScroll && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  function renderFamilyNotesPanel(pendingReviews, submissionList, state) {
    const contentEl = document.getElementById('familyNotesContent');
    const countEl = document.getElementById('familyNotesCountChip');
    if (!contentEl || !countEl) return;

    if (!linkedStudent) {
      countEl.textContent = 'Link first';
      contentEl.innerHTML = '<div class="family-note-empty"><strong>No child linked yet.</strong><span>Connect a student account to see note history and any pending home reviews.</span></div>';
      return;
    }

    const recentParentNotes = submissionList
      .filter((submission) => Array.isArray(submission.parentNotes) && submission.parentNotes.length)
      .slice(-3)
      .reverse();
    const parentApprovedCount = state && Array.isArray(state.parent_approved) ? state.parent_approved.length : 0;

    if (pendingReviews.length) {
      countEl.textContent = pendingReviews.length + ' pending';
    } else if (recentParentNotes.length) {
      countEl.textContent = recentParentNotes.length + ' notes';
    } else {
      countEl.textContent = 'Up to date';
    }

    let familyHtml =
      '<div class="family-note-item">' +
        '<strong>' + escapeHtml(linkedStudent.name || 'My Child') + '</strong>' +
        '<span>Notes sent: ' + parentApprovedCount + ' | Waiting for home review: ' + pendingReviews.length + '</span>' +
      '</div>';

    if (recentParentNotes.length) {
      recentParentNotes.forEach((submission) => {
        const latestNote = submission.parentNotes[submission.parentNotes.length - 1];
        familyHtml +=
          '<div class="family-note-item">' +
            '<strong>' + escapeHtml(getChapterTitle(submission.chapter_id)) + '</strong>' +
            '<span>' + escapeHtml(latestNote) + '</span>' +
          '</div>';
      });
    } else if (pendingReviews.length) {
      familyHtml += '<div class="family-note-empty"><strong>Next step</strong><span>Open Actions Required and add one good sentence before sending the sheet to the teacher.</span></div>';
    } else {
      familyHtml += '<div class="family-note-empty"><strong>No pending home actions.</strong><span>Your child is up to date. New note history will appear here after your next approval.</span></div>';
    }

    contentEl.innerHTML = familyHtml;
  }

  bindParentSectionControls();

  // ─── WebView-safe auth guard ───────────────────────────────────────────────
  // On Android WebView, Firebase fires onAuthStateChanged(null) briefly when
  // the app resumes from background. We wait up to 12 s before redirecting.
  let hasInitializedDashboard = false;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (hasInitializedDashboard) return; // already loaded — ignore repeated calls
      hasInitializedDashboard = true;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'parent') {
          currentParent = { uid: user.uid, ...userDoc.data() };
          await initDashboard();
        } else {
          document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-lock" style="font-size:3rem; color:#E08020; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Parent Login Required</h3>
                 <p style="color:#64748b; margin-bottom:25px;">You cannot view this page with your current account.</p>
                 <button onclick="window.location.href='/auth'" style="width:100%; padding:12px; background:#E08020; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
              </div>
            </div>
          \`);
        }
      } catch (err) {
        console.error("Error fetching parent profile:", err);
      }
    } else {
      // null — might be a temporary WebView resume flicker; wait before redirecting
      if (hasInitializedDashboard) return; // dashboard is already open — ignore

      let waitAttempts = 0;
      const maxAttempts = 24; // 24 × 500ms = 12 seconds

      const checkInterval = setInterval(() => {
        waitAttempts++;
        const currentUser = auth.currentUser;

        if (currentUser) {
          clearInterval(checkInterval);
          // user came back — re-trigger
          onAuthStateChanged(auth, () => {}); // no-op unsubscribe trick
          if (hasInitializedDashboard) return;
          hasInitializedDashboard = true;
          getDoc(doc(db, "users", currentUser.uid)).then(userDoc => {
            if (userDoc.exists() && userDoc.data().role === 'parent') {
              currentParent = { uid: currentUser.uid, ...userDoc.data() };
              initDashboard();
            }
          }).catch(err => console.error(err));
          return;
        }

        if (waitAttempts >= maxAttempts) {
          clearInterval(checkInterval);
          // Truly not logged in — show lock screen
          document.body.insertAdjacentHTML('beforeend', \`
            <div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">
              <div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:400px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                 <i class="fas fa-lock" style="font-size:3rem; color:#E08020; margin-bottom:20px;"></i>
                 <h3 style="font-family:'Fredoka One', cursive; color:#1E2D5A;">Parent Login Required</h3>
                 <p style="color:#64748b; margin-bottom:25px;">You must be logged in as a Parent to track your child's progress.</p>
                 <button onclick="window.location.href='/auth'" style="width:100%; padding:12px; background:#E08020; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Go to Login</button>
              </div>
            </div>
          \`);
        }
      }, 500);
    }
  });

  async function initDashboard() {
    const dashboardView = document.getElementById('parentDashboardView');
    dashboardView.classList.remove('d-none');
    
    document.getElementById('welcomeName').textContent = 'Parent Dashboard';
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating Student...';
    document.getElementById('parentPendingApprovals').textContent = '0';

    if (!currentParent.linked_student_code) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> No Student Linked';
      document.getElementById('teacherInfo').textContent = 'Please link a student below.';
      
      document.getElementById('statsCard').classList.add('d-none');
      document.getElementById('actionQueueCard').classList.add('d-none');
      document.getElementById('linkStudentCard').classList.remove('d-none');
      renderFamilyNotesPanel([], [], null);
      window.switchParentSection(currentParentSection, false);
      return;
    } else {
      document.getElementById('statsCard').classList.remove('d-none');
      document.getElementById('actionQueueCard').classList.remove('d-none');
      if(document.getElementById('linkStudentCard')) document.getElementById('linkStudentCard').classList.add('d-none');
    }

    const stq = query(collection(db, "users"), where("invitation_code", "==", currentParent.linked_student_code));
    const sqSnap = await getDocs(stq);
    if (sqSnap.empty) {
      document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> Student Not Registered Yet';
      document.getElementById('teacherInfo').textContent = 'Waiting for student to use their invite code.';
      return;
    }

    linkedStudent = { uid: sqSnap.docs[0].id, ...sqSnap.docs[0].data() };

    // Fetch school name if available
    let schoolNameStr = 'Parent Dashboard';
    if (linkedStudent.school_id && !linkedStudent.school_name) {
      try {
        const schoolSnap = await getDoc(doc(db, "schools", linkedStudent.school_id));
        if (schoolSnap.exists()) {
          linkedStudent.school_name = schoolSnap.data().name;
        }
      } catch (e) { console.error(e); }
    }
    if (linkedStudent.school_name) {
      schoolNameStr = linkedStudent.school_name;
    }

    document.getElementById('welcomeName').textContent = schoolNameStr;
    document.getElementById('schoolNameTag').innerHTML = '<i class="fas fa-home"></i> Tracking: ' + linkedStudent.name;
    
    let classLabelStr = linkedStudent.class_name || linkedStudent.class_id || 'Unassigned';
    classLabelStr = classLabelStr.replace(/Class\s*(Class\s*)+/gi, 'Class ');
    if (!classLabelStr.toLowerCase().startsWith('class')) classLabelStr = 'Class ' + classLabelStr;
    document.getElementById('teacherInfo').textContent = classLabelStr;

    const gameState = linkedStudent.game_state || { points:0, unlockedCount:1, completed:[], parent_approved:[], teacher_approved:[] };
    if (!gameState.parent_approved) gameState.parent_approved = [];
    if (!gameState.completed) gameState.completed = [];

    document.getElementById('totalPointsVal').textContent = gameState.points || 0;
    document.getElementById('completedChapCount').textContent = gameState.completed.length;

    const subQ = query(collection(db, "activity_submissions"), where("student_uid", "==", linkedStudent.uid));
    const subSnap = await getDocs(subQ);
    
    let allSubmissions = {};
    let submissionList = [];
    subSnap.forEach(docSnap => {
      const submissionData = { id: docSnap.id, ...docSnap.data() };
      allSubmissions[submissionData.chapter_id] = submissionData;
      submissionList.push(submissionData);
    });

    const pendingChapters = gameState.completed.filter(id => !gameState.parent_approved.includes(id));
    let pendingReviews = [];

    pendingChapters.forEach(chap => {
       let sub = allSubmissions[chap];
       pendingReviews.push({
          studentName: linkedStudent.name, 
          chapId: chap,
         docId: sub ? sub.id : (linkedStudent.uid + '_' + chap),
         answer: sub ? sub.discussionText : "Submission details are missing for this chapter. Ask the student to reopen the activity if this remains blank.",
          grid: sub ? sub.gridState : null,
          status: 'Waiting for Parent'
       });
    });

    document.getElementById('pendingCountBadge').textContent = pendingReviews.length;
    document.getElementById('parentPendingApprovals').textContent = String(pendingReviews.length);
    renderFamilyNotesPanel(pendingReviews, submissionList, gameState);
    
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
            '<div class="approval-item-info">' +
              '<p class="approval-item-title"><i class="fas fa-clock" style="color:#f59e0b; font-size:0.65rem; margin-right:4px;"></i>' + escapeHtml(cTitle) + '</p>' +
              '<span class="approval-item-sub">From: ' + escapeHtml(rev.studentName) + ' &nbsp;&middot;&nbsp; Waiting for your review</span>' +
            '</div>' +
            '<div class="approval-item-action">' +
              '<button class="btn-open-sheet" onclick="openParentReviewModal(\'' + rawData + '\')\"><i class="fas fa-eye"></i> Review</button>' +
            '</div>' +
          '</div>';
      });
      listEl.innerHTML = htmlSnippet;
    }

    window.switchParentSection(currentParentSection, false);
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
      if(ACTIVITIES_DATA[b] && ACTIVITIES_DATA[b].chapters) {
        Object.values(ACTIVITIES_DATA[b].chapters).forEach(c => {
          if(c.id === chapId) {
             chapterData = c;
          }
        });
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
      '<button class="btn-approve px-5 py-2 fs-5" id="parentApproveBtn" onclick="approveFromModal(\\'' + rev.chapId + '\\', \\'' + rev.docId + '\\')"><i class="fas fa-check me-2"></i> Send to Teacher</button>';

    document.getElementById('parentReviewModalOverlay').style.display = 'flex';
    document.getElementById('parentReviewModal').classList.add('animate__animated', 'animate__zoomIn');
  };

  window.closeParentReviewModal = () => {
    document.getElementById('parentReviewModalOverlay').style.display = 'none';
    document.getElementById('parentReviewModal').classList.remove('animate__animated', 'animate__zoomIn');
  };

  window.linkStudentAction = async () => {
    const codeInput = document.getElementById('parentStudentCodeInput');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    if (!code) {
      alert("Please enter a student code!");
      return;
    }
    
    const btn = document.getElementById('linkStudentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Linking...';

    try {
      const stq = query(collection(db, "users"), where("invitation_code", "==", code));
      const sqSnap = await getDocs(stq);

      if (sqSnap.empty) {
        alert("Student code not found. Make sure the student has created their account first.");
        btn.disabled = false;
        btn.innerHTML = 'Link Student Account';
        return;
      }

      const parentRef = doc(db, "users", currentParent.uid);
      await updateDoc(parentRef, { linked_student_code: code });

      alert("Successfully linked to student profile!");
      currentParent.linked_student_code = code;
      
      await initDashboard();

    } catch (error) {
      console.error(error);
      alert("Error linking student: " + error.message);
      btn.disabled = false;
      btn.innerHTML = 'Link Student Account';
    }
  };

  window.approveFromModal = async (chapterId, docId) => {
    const sentenceInput = document.getElementById('modalSentenceInput');
    const approvalNote = sentenceInput.value.trim();
    if(approvalNote.split(' ').length < 2) {
      alert("Please write at least one meaningful sentence!");
      return;
    }
    
    const btn = document.getElementById('parentApproveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Approving...';

    try {
      const submissionId = docId && docId !== 'null'
        ? docId
        : (linkedStudent && linkedStudent.uid ? (linkedStudent.uid + '_' + chapterId) : '');

      if (!submissionId) {
        throw new Error('Student submission reference is missing.');
      }

      const subRef = doc(db, "activity_submissions", submissionId);
      const subSnap = await getDoc(subRef);
      if (!subSnap.exists()) {
        throw new Error('The student activity sheet was not found. Ask the student to submit this chapter again before approving it.');
      }

      const approvalTimestamp = new Date().toISOString();
      const submissionData = subSnap.data();
      const submissionUpdate = {
        parentNotes: [approvalNote],
        reviewStatus: 'pending_teacher',
        parentApprovedAt: approvalTimestamp,
        parentApprovedBy: currentParent ? currentParent.uid : '',
        updatedAt: approvalTimestamp
      };

      if (linkedStudent && linkedStudent.school_id) {
        submissionUpdate.school_id = linkedStudent.school_id;
      }

      if (!submissionData.student_uid && linkedStudent && linkedStudent.uid) {
        submissionUpdate.student_uid = linkedStudent.uid;
      }

      if (!submissionData.chapter_id && chapterId) {
        submissionUpdate.chapter_id = chapterId;
      }

      const batch = writeBatch(db);
      batch.update(subRef, submissionUpdate);

      if (linkedStudent && linkedStudent.uid) {
        const stuRef = doc(db, "users", linkedStudent.uid);
        batch.update(stuRef, {
          "game_state.parent_approved": arrayUnion(chapterId)
        });
      }

      await batch.commit();

      closeParentReviewModal();
      await initDashboard(); // Refresh
      alert("✅ Approved! This activity is now waiting for the Teacher's review.");
    } catch(err) {
      console.error(err);
      alert("Error approving activity: " + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check me-2"></i> Send to Teacher';
    }
  };

  window.logoutParent = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
      window.location.href = '/auth';
    }).catch(() => {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
      window.location.href = '/auth';
    });
  };
