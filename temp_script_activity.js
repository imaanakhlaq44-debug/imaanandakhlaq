
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, updateDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
  import { getDoc as _getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = {};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Enable Firestore offline persistence for faster initial loading
  enableIndexedDbPersistence(db).catch(function(err) {
    if (err.code == 'failed-precondition') {
      console.warn('[Student Dashboard] Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('[Student Dashboard] The current browser does not support all of the features required to enable persistence');
    }
  });

  // Force persistent login (survives browser idle, refresh, tab close).
  // Try IndexedDB first (more reliable in some browsers), fallback to localStorage.
  setPersistence(auth, indexedDBLocalPersistence).catch(function () {
    return setPersistence(auth, browserLocalPersistence);
  }).catch(function (e) {
    console.warn('[Student Dashboard] Could not set auth persistence:', e && e.message);
  });

  const root = document.getElementById('activitiesRoot');
  const errorS = document.getElementById('errorState');
  const errorDetailsText = document.getElementById('errorDetailsText');
  const studentDashboardView = document.getElementById('studentDashboardView');
  const stars = document.getElementById('starsValue');
  const studentCompletedCount = document.getElementById('studentCompletedCount');
  const studentPendingReviewCount = document.getElementById('studentPendingReviewCount');
  const studentUnlockedCount = document.getElementById('studentUnlockedCount');
  const studentApprovedCount = document.getElementById('studentApprovedCount');
  const studentPendingParentCount = document.getElementById('studentPendingParentCount');
  const studentPendingTeacherCount = document.getElementById('studentPendingTeacherCount');
  const studentJourneyStatus = document.getElementById('studentJourneyStatus');
  const studentSchoolTag = document.getElementById('studentSchoolTag');
  const studentWelcomeName = document.getElementById('studentWelcomeName');
  const studentJourneyNote = document.getElementById('studentJourneyNote');
  const studentProfilePreview = document.getElementById('studentProfilePreview');
  const studentProfileLabel = document.getElementById('studentProfileLabel');
  const studentProfileMeta = document.getElementById('studentProfileMeta');
  const studentProfileAvatarTrigger = document.getElementById('studentAvatarClickArea');
  const sidebarAvatarTrigger = document.getElementById('sidebarAvatarClickArea');
  const schoolLogoClickArea = document.getElementById('schoolLogoClickArea');
  const schoolLogoImg = document.getElementById('schoolLogoImg');
  const studentProfileUploadBtn = document.getElementById('studentProfileManageBtn');
  const studentProfileFileInput = document.getElementById('studentProfileFileInput');
  const studentPendingParentRow = document.getElementById('studentPendingParentRow');
  const studentPendingTeacherRow = document.getElementById('studentPendingTeacherRow');
  const currentBookTitle = document.getElementById('currentBookTitle');
  const currentBookSubtitle = document.getElementById('currentBookSubtitle');

  const backToBooksBtn = document.getElementById('backToBooksBtn');

  // School logo file input
  const schoolLogoFileInput = document.createElement('input');
  schoolLogoFileInput.type = 'file';
  schoolLogoFileInput.accept = 'image/*';
  schoolLogoFileInput.hidden = true;
  document.body.appendChild(schoolLogoFileInput);

  let apiData = {};
  let currentStudent = null;
  let currentBookContext = null;
  let currentStudentSection = 'overview';
  let gameState = { points: 50, unlockedCount: 1, completed: [], parent_approved: [], teacher_approved: [] };

  const ALL_BOOKS = [
    { id: 'book1', title: 'Imaan & Akhlaaq - Book 1', cover: '/assets/covers/book1.jpg' },
    { id: 'book2', title: 'Imaan & Akhlaaq - Book 2', cover: '/assets/covers/book2.jpg' },
    { id: 'book3', title: 'Imaan & Akhlaaq - Book 3', cover: '/assets/covers/book3.jpg' },
    { id: 'book4', title: 'Imaan & Akhlaaq - Book 4', cover: '/assets/covers/book4.jpg' },
    { id: 'book5', title: 'Imaan & Akhlaaq - Book 5', cover: '/assets/covers/book5.jpg' },
    { id: 'book6', title: 'Imaan & Akhlaaq - Book 6', cover: '/assets/covers/book6.jpg' },
    { id: 'book7', title: 'Imaan & Akhlaaq - Book 7', cover: '/assets/covers/book7.jpg' }
  ];

  function showAccessOverlay(title, message) {
    if (document.getElementById('demoOverlay')) return;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="demoOverlay" style="position:fixed; inset:0; background:rgba(30, 45, 90, 0.85); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999;">' +
        '<div style="background:white; padding:40px; border-radius:24px; text-align:center; max-width:420px; box-shadow:0 20px 40px rgba(0,0,0,0.3);">' +
          '<i class="fas fa-lock" style="font-size:3rem; color:#D63678; margin-bottom:20px;"></i>' +
          '<h3 style="font-family:Sora,sans-serif; color:#1E2D5A; margin:0 0 12px;">' + title + '</h3>' +
          '<p style="color:#64748b; margin-bottom:25px; font-weight:700; line-height:1.5;">' + message + '</p>' +
          '<button onclick="window.location.href=&quot;/auth&quot;" style="width:100%; padding:12px; background:#1E2D5A; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">Go to Login</button>' +
        '</div>' +
      '</div>'
    );
  }

  function buildAvatarUrl(name) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'Student') + '&background=243d6b&color=fff';
  }

  function getLearnerTrackText() {
    if (!currentStudent) return 'Student dashboard';
    if (currentStudent.role === 'individual') return 'Independent learner';
    if (currentStudent.class_id) return 'Class ' + currentStudent.class_id + ' learner';
    return 'School learner';
  }

  function getProfileMetaText() {
    if (!currentStudent) return 'Tap the camera to update your dashboard photo.';
    return getLearnerTrackText() + ' - tap the camera to update your dashboard photo.';
  }

  function getCurrentPhotoUrl() {
    if (currentStudent && currentStudent.photoURL) return currentStudent.photoURL;
    return buildAvatarUrl(currentStudent && currentStudent.name ? currentStudent.name : 'Student');
  }

  function hydrateStudentHeader() {
    if (!currentStudent) return;

    const studentName = currentStudent.name || 'Student';
    const isIndividual = currentStudent.role === 'individual';
    const photoUrl = getCurrentPhotoUrl();

    // Class name logic
    let classLabel = '';
    if (isIndividual) {
      classLabel = 'Independent Learner';
    } else {
      let rawClass = String(currentStudent.class_name || currentStudent.class_id || '').trim();
      if (rawClass) {
        // Remove repeated "Class " words (e.g., "Class Class 2" -> "2")
        rawClass = rawClass.replace(/^(class\s*)+/ig, '').trim();
        // If it was just "Class", default to "Student"
        if (!rawClass) {
          classLabel = 'Student';
        } else {
          // Prepend "Class " unless it already has a rank word
          if (!/^(grade|year|level)\b/i.test(rawClass)) {
            classLabel = 'Class ' + rawClass;
          } else {
            classLabel = rawClass;
          }
        }
      } else {
        classLabel = 'Student';
      }
    }

    const schoolNameText = currentStudent.school_name || (isIndividual ? 'Imaan & Akhlaq Academy' : 'Your School');
    studentWelcomeName.textContent = schoolNameText;
    
    if (studentProfileLabel) studentProfileLabel.textContent = studentName;
    if (studentProfileMeta) studentProfileMeta.textContent = classLabel;
    if (studentProfilePreview) {
      studentProfilePreview.src = photoUrl;
      studentProfilePreview.alt = studentName + ' profile photo';
    }

    // Update sidebar with student name and class
    const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
    const sidebarName = document.getElementById('sidebarProfileName');
    const sidebarMeta = document.getElementById('sidebarProfileMeta');
    if (sidebarPhoto) { sidebarPhoto.src = photoUrl; sidebarPhoto.alt = studentName; }
    if (sidebarName) sidebarName.textContent = studentName;
    if (sidebarMeta) sidebarMeta.textContent = classLabel;

    if (studentSchoolTag) {
      studentSchoolTag.innerHTML = isIndividual
        ? '<i class="fas fa-house"></i> Individual Learning Track'
        : '<i class="fas fa-graduation-cap"></i> Student Dashboard';
    }
    if (studentJourneyNote) {
      studentJourneyNote.textContent = isIndividual
        ? 'Independent learner mode is active. Complete tasks to unlock your next chapter.'
        : 'Track your books, unlock chapters and keep your progress moving.';
    }

    // Load saved school logo if any
    const savedSchoolLogo = currentStudent.school_logo_url || (currentStudent.school_id ? null : null);
    if (savedSchoolLogo && schoolLogoImg) {
      schoolLogoImg.src = savedSchoolLogo;
    }
  }

  function getAllChaptersInOrder() {
    const chapters = [];
    let absoluteOrderCounter = 1;

    ALL_BOOKS.forEach((book) => {
      if (apiData[book.id] && apiData[book.id].chapters) {
        let localOrder = 1;
        Object.keys(apiData[book.id].chapters).forEach((chapterKey) => {
          const chapterData = apiData[book.id].chapters[chapterKey];
          chapters.push({
            bId: book.id,
            cId: chapterKey,
            title: chapterData.title,
            stateId: chapterData.id || chapterKey,
            globalOrder: absoluteOrderCounter,
            bookOrder: localOrder
          });
          absoluteOrderCounter++;
          localOrder++;
        });
      }
    });

    return chapters;
  }

  function updateDashboardMetrics() {
    const allChapters = getAllChaptersInOrder();
    const totalChapters = allChapters.length;
    const completedCount = (gameState.completed || []).length;
    const parentApprovedCount = (gameState.parent_approved || []).length;
    const teacherApprovedCount = (gameState.teacher_approved || []).length;
    const pendingParentCount = Math.max(completedCount - parentApprovedCount, 0);
    const pendingTeacherCount = Math.max(parentApprovedCount - teacherApprovedCount, 0);
    const pendingReviewCount = Math.max(completedCount - teacherApprovedCount, 0);
    const unlockedCount = totalChapters > 0 ? Math.min(gameState.unlockedCount || 1, totalChapters) : 0;
    const availablePoints = gameState.points || 0;

    stars.textContent = String(availablePoints);
    studentCompletedCount.textContent = String(completedCount);
    studentPendingReviewCount.textContent = String(pendingReviewCount);
    studentUnlockedCount.textContent = String(unlockedCount);
    studentApprovedCount.textContent = String(teacherApprovedCount);
    studentPendingParentCount.textContent = String(pendingParentCount);
    studentPendingTeacherCount.textContent = String(pendingTeacherCount);

    if (studentPendingParentRow) {
      studentPendingParentRow.classList.toggle('d-none', pendingParentCount === 0);
    }

    if (studentPendingTeacherRow) {
      studentPendingTeacherRow.classList.toggle('d-none', pendingTeacherCount === 0);
    }

    if (totalChapters === 0) {
      studentJourneyStatus.textContent = 'Books are loading. Your next chapter path will appear here shortly.';
      return;
    }

    if (unlockedCount >= totalChapters) {
      studentJourneyStatus.textContent = teacherApprovedCount >= totalChapters
        ? 'All current chapters are completed and approved. Great work keeping your journey clean.'
        : 'All currently available chapters are unlocked. Keep clearing reviews to stay ahead.';
      return;
    }

    if (availablePoints >= 50) {
      studentJourneyStatus.textContent = 'You already have enough points to unlock the next chapter in sequence.';
      return;
    }

    studentJourneyStatus.textContent = 'Earn ' + (50 - availablePoints) + ' more points to unlock your next chapter.';
  }

  function getStudentSectionTarget(section) {
    const topSection = document.getElementById('studentTopSection');
    const overviewSection = document.getElementById('studentOverviewSection');
    const booksSection = document.getElementById('studentBooksSection');
    const progressSection = document.getElementById('studentProgressSection');

    const studentRankingsSection = document.getElementById('studentRankingsSection');

    if (section === 'books') return booksSection || topSection;
    if (section === 'progress') return progressSection || topSection;
    if (section === 'rankings') return studentRankingsSection || topSection;
    return overviewSection || topSection;
  }

  function bindStudentSectionControls() {
    document.querySelectorAll('.sidebar-nav li[data-section], .summary-card[data-section]').forEach((control) => {
      if (control.dataset.sectionBound === 'true') return;

      control.dataset.sectionBound = 'true';
      control.addEventListener('click', () => window.switchStudentSection(control.dataset.section));
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.switchStudentSection(control.dataset.section);
        }
      });
    });
  }

  // Define global ranking function
  let leaderboardLoaded = false;
  // Shared cache so Champions + Leaderboard don't duplicate Firebase queries
  let _rankingCache = null;
  async function fetchRankingData() {
    if (_rankingCache) return _rankingCache;
    const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const qS = query(usersRef, where('role', '==', 'student'), orderBy('game_state.points', 'desc'), limit(30));
    const qI = query(usersRef, where('role', '==', 'individual'), orderBy('game_state.points', 'desc'), limit(30));
    const [snapS, snapI] = await Promise.all([getDocs(qS), getDocs(qI)]);
    let all = [];
    snapS.forEach(d => all.push({ id: d.id, ...d.data() }));
    snapI.forEach(d => all.push({ id: d.id, ...d.data() }));
    all.sort((a, b) => {
      const pa = a.game_state && a.game_state.points ? a.game_state.points : 0;
      const pb = b.game_state && b.game_state.points ? b.game_state.points : 0;
      return pb - pa;
    });
    _rankingCache = all.slice(0, 30);
    return _rankingCache;
  }

  async function loadChampionsBoard() {
    const board = document.getElementById('championsBoard');
    const podium = document.getElementById('championsPodium');
    if (!board || !podium) return;
    try {
      const all = (await fetchRankingData()).slice(0, 3);
      if (all.length === 0) { board.style.display = 'none'; return; }
      const crowns = ['👑', '', ''];
      let html = '';
      all.forEach((u, i) => {
        const rank = i + 1;
        const pts = u.game_state && u.game_state.points ? u.game_state.points : 0;
        const avatar = u.photoURL || buildAvatarUrl(u.name);
        const name = u.name || 'Learner';
        const isMe = currentStudent && u.id === currentStudent.uid;
        html += '<div class="podium-slot rank-' + rank + '">' +
          '<div class="podium-avatar-wrap">' +
            (rank === 1 ? '<span class="podium-crown">' + crowns[0] + '</span>' : '') +
            '<img class="podium-avatar" src="' + escapeHtml(avatar) + '" alt="">' +
            '<span class="podium-badge">' + rank + '</span>' +
          '</div>' +
          '<div class="podium-name">' + escapeHtml(name) + (isMe ? ' (You)' : '') + '</div>' +
          '<div class="podium-xp">' + pts + ' XP</div>' +
          '<div class="podium-bar"></div>' +
        '</div>';
      });
      podium.innerHTML = html;
      board.style.display = 'block';
    } catch(e) {
      console.error('Champions board error:', e);
      board.style.display = 'none';
    }
  }

  async function loadGlobalRankings() {
    if (leaderboardLoaded) return;
    const listEl = document.getElementById('globalLeaderboardList');
    if (!listEl) return;
    try {
      const combined = await fetchRankingData();

      let lbHtml = '';
      let myRankHTML = '';
      let meInTop30 = false;

      combined.forEach((user, idx) => {
        const rank = idx + 1;
        let rankClass = '';
        let rankIcon = rank;
        if (rank === 1) { rankClass = 'gold'; rankIcon = '<i class="fas fa-crown"></i>'; }
        else if (rank === 2) { rankClass = 'silver'; rankIcon = '<i class="fas fa-medal"></i>'; }
        else if (rank === 3) { rankClass = 'bronze'; rankIcon = '<i class="fas fa-award"></i>'; }

        const isMe = user.id === currentStudent?.uid;
        if (isMe) meInTop30 = true;
        
        const avatar = user.photoURL || buildAvatarUrl(user.name);
        // Show full name
        const displayName = user.name || 'Anonymous Learner';
        const schoolName = user.role === 'individual' ? 'Independent Learner' : (user.school_name || 'School Learner');
        const userPoints = user.game_state && user.game_state.points ? user.game_state.points : 0;

        lbHtml += \`
          <div class="lb-item \{}">
            <div class="lb-rank \{}">\{}</div>
            <img class="lb-avatar" src="\{}" alt="Avatar">
            <div class="lb-info">
              <p class="lb-name">\{}\{}</p>
              <p class="lb-school">\{}</p>
            </div>
            <div class="lb-points">\{} XP</div>
          </div>
        \`;
      });
      
      if (!meInTop30 && currentStudent) {
        myRankHTML = \`
          <div style="border-top: 2px dashed #e2e8f0; margin-top: 1rem; padding-top: 1rem;">
            <div class="lb-item is-me">
              <div class="lb-rank" style="font-size:0.9rem;">--</div>
              <img class="lb-avatar" src="\{}" alt="Avatar">
              <div class="lb-info">
                <p class="lb-name">\{} (You)</p>
                <p class="lb-school">\{}</p>
              </div>
              <div class="lb-points">\{} XP</div>
            </div>
          </div>
        \`;
      }

      if (combined.length === 0) {
        lbHtml = '<div style="text-align:center; color:#64748b; padding:2rem;">No rankings available yet.</div>';
      }

      listEl.innerHTML = lbHtml + myRankHTML;
      leaderboardLoaded = true;
    } catch (e) {
      console.error('Error loading leaderboard:', e);
      listEl.innerHTML = '<div style="text-align:center; color:#ef4444; padding:2rem;">Failed to load rankings.</div>';
    }
  }

  window.switchStudentSection = (section, shouldScroll = true) => {
    const nextSection = ['overview', 'books', 'progress', 'rankings'].includes(section) ? section : 'overview';
    currentStudentSection = nextSection;

    document.querySelectorAll('.sidebar-nav li[data-section]').forEach((item) => {
      item.classList.toggle('active', item.dataset.section === nextSection);
    });

    document.querySelectorAll('.summary-card[data-section]').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.section === nextSection);
    });

    if (nextSection === 'rankings') loadGlobalRankings();

    const target = getStudentSectionTarget(nextSection);
    if (shouldScroll && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  bindStudentSectionControls();

  function makeInteractiveCard(element, handler) {
    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    element.addEventListener('click', handler);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    });
  }

  function getIcon(title) {
    const lower = title.toLowerCase();
    if (lower.includes('farm') || lower.includes('sister')) return 'fa-seedling';
    if (lower.includes('burger') || lower.includes('food')) return 'fa-utensils';
    if (lower.includes('goodbye') || lower.includes('begin')) return 'fa-door-open';
    if (lower.includes('truthful') || lower.includes('honest')) return 'fa-shield-halved';
    if (lower.includes('patience') || lower.includes('sabr')) return 'fa-hourglass-half';
    if (lower.includes('caring') || lower.includes('heart') || lower.includes('love')) return 'fa-heart';
    if (lower.includes('truth') || lower.includes('trust')) return 'fa-scale-balanced';
    if (lower.includes('safe') || lower.includes('people') || lower.includes('protect')) return 'fa-user-shield';
    if (lower.includes('prayer') || lower.includes('salah') || lower.includes('dua')) return 'fa-hands-praying';
    if (lower.includes('quran') || lower.includes('read')) return 'fa-book-quran';
    if (lower.includes('mosque') || lower.includes('masjid')) return 'fa-mosque';
    if (lower.includes('family') || lower.includes('parent')) return 'fa-people-roof';
    if (lower.includes('friend') || lower.includes('kind')) return 'fa-hand-holding-heart';
    if (lower.includes('clean') || lower.includes('wudu')) return 'fa-droplet';
    if (lower.includes('share') || lower.includes('give') || lower.includes('charity')) return 'fa-hand-holding-dollar';
    if (lower.includes('respect') || lower.includes('elder')) return 'fa-handshake';
    if (lower.includes('whisper') || lower.includes('shadow')) return 'fa-moon';
    if (lower.includes('giant') || lower.includes('brave') || lower.includes('courage')) return 'fa-star';
    return 'fa-book-open-reader';
  }

  function getIconGradient(order) {
    const gradients = [
      'linear-gradient(135deg, #243d6b 0%, #cf296d 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
      'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
      'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
    ];
    return gradients[(order - 1) % gradients.length];
  }

  function getAccentColor(order) {
    const colors = ['#cf296d','#6366f1','#ef4444','#10b981','#ec4899','#3b82f6','#f43f5e','#22c55e','#a855f7','#f97316'];
    return colors[(order - 1) % colors.length];
  }

  function renderBooks() {
    if (!root) return;

    currentBookContext = null;
    updateDashboardMetrics();
    errorS.classList.add('d-none');
    backToBooksBtn.classList.add('d-none');

    currentBookTitle.textContent = 'Choose a Book';
    currentBookSubtitle.textContent = 'Select a title to open its chapters and continue your learning journey.';
    root.innerHTML = '';

    const allChapters = getAllChaptersInOrder();
    const unlockedLimit = gameState.unlockedCount || 1;
    const fragment = document.createDocumentFragment();

    ALL_BOOKS.forEach((book) => {
      const bookChapters = allChapters.filter((chapter) => chapter.bId === book.id);
      const unlockedInBook = bookChapters.filter((chapter) => chapter.globalOrder <= unlockedLimit).length;

      const card = document.createElement('div');
      card.className = 'library-item';
      makeInteractiveCard(card, () => showChapters(book.id, book.title));
      card.innerHTML =
        '<div class="library-cover"><img src="' + book.cover + '" alt="' + book.title + '"></div>' +
        '<div class="library-topline">' +
          '<span class="book-chip"><i class="fas fa-book"></i> ' + bookChapters.length + ' chapters</span>' +
          '<span class="book-chip muted"><i class="fas fa-unlock"></i> ' + unlockedInBook + ' open</span>' +
        '</div>' +
        '<div class="library-title">' + book.title + '</div>' +
        '<div class="library-subtitle">Open this book to browse chapters available in your learning sequence.</div>' +
        '<div class="library-meta"><span class="status-pill ready"><i class="fas fa-book-open"></i> View Chapters</span></div>';
      fragment.appendChild(card);
    });
    
    root.appendChild(fragment);
  }

  function showChapters(bookId, bookTitle) {
    currentBookContext = { bookId, bookTitle };
    updateDashboardMetrics();
    backToBooksBtn.classList.remove('d-none');

    currentBookTitle.textContent = bookTitle;
    currentBookSubtitle.textContent = 'Choose the next chapter to start, unlock or review.';
    root.innerHTML = '';

    const chapters = getAllChaptersInOrder().filter((chapter) => chapter.bId === bookId);

    if (chapters.length === 0) {
      root.innerHTML =
        '<div class="empty-state">' +
          '<i class="fas fa-book-medical fa-2x" style="color:#cf296d;"></i>' +
          '<h4>Coming Soon</h4>' +
          '<p>Chapters for this book are still being uploaded.</p>' +
        '</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    chapters.forEach((item) => {
      const order = item.globalOrder;
      const stateId = item.stateId;
      const isUnlocked = order <= (gameState.unlockedCount || 1);
      const isCompleted = (gameState.completed || []).includes(stateId);
      const isParentApproved = (gameState.parent_approved || []).includes(stateId);
      const isTeacherApproved = (gameState.teacher_approved || []).includes(stateId);
      const chapterIcon = isUnlocked ? getIcon(item.title) : 'fa-lock';

      const card = document.createElement('div');
      card.className = 'library-item' + (!isUnlocked ? ' locked' : '');

      let subtitle = 'Open this chapter and continue the next step in your learning track.';
      let statusHtml = '';

      if (isUnlocked) {
        makeInteractiveCard(card, () => {
          window.location.href = '/activity?book=' + item.bId + '&chapter=' + item.cId;
        });

        if (isTeacherApproved) {
          statusHtml = '<span class="status-pill completed"><i class="fas fa-check-circle"></i> ' + (currentStudent.role === 'individual' ? 'Completed' : 'Approved') + '</span>';
          subtitle = 'This chapter is fully approved and locked into your completed progress.';
        } else if (isParentApproved) {
          statusHtml = '<span class="status-pill teacher"><i class="fas fa-user-check"></i> Pending Teacher</span>';
          subtitle = 'Your family review is done. This chapter is now waiting for teacher approval.';
        } else if (isCompleted) {
          statusHtml = '<span class="status-pill pending"><i class="fas fa-spinner fa-spin"></i> Pending Review</span>';
          subtitle = 'You have submitted this task. It is still moving through the approval flow.';
        } else {
          statusHtml = '<span class="status-pill ready"><i class="fas fa-play-circle"></i> Start Chapter</span>';
        }
      } else if (order === (gameState.unlockedCount || 1) + 1) {
        statusHtml = '<button class="unlock-btn" type="button" onclick="event.stopPropagation(); unlockNext(' + order + ')"><i class="fas fa-unlock"></i><span>Unlock for 50 Points</span></button>';
        subtitle = 'Use 50 points to unlock this chapter and move your sequence forward.';
      } else {
        statusHtml = '<span class="status-pill locked"><i class="fas fa-lock"></i> Locked</span>';
        subtitle = 'Complete earlier chapters first to make this chapter available.';
      }

      const iconBg = isUnlocked ? getIconGradient(order) : 'linear-gradient(135deg, #cbd5e1, #94a3b8)';
      const accentColor = isUnlocked ? getAccentColor(order) : '#94a3b8';

      card.style.position = 'relative';
      card.innerHTML =
        '<div class="chapter-accent" style="background:' + accentColor + '"></div>' +
        '<div class="chapter-card-row">' +
          '<div class="chapter-icon' + (isUnlocked ? '' : ' locked') + '" style="background:' + iconBg + '"><i class="fas ' + chapterIcon + '"></i></div>' +
          '<div class="chapter-text">' +
            '<span class="ch-kicker">Chapter ' + item.bookOrder + '</span>' +
            '<div class="ch-title">' + item.title + '</div>' +
          '</div>' +
          '<div class="chapter-action">' + statusHtml + '</div>' +
        '</div>';
      fragment.appendChild(card);
    });
    
    root.appendChild(fragment);
  }

  async function fetchActivitiesData() {
    try {
      // Use the imported JSON directly; no templating needed.
      const data = {};
      apiData = data.default || data;
      renderBooks();
    } catch (err) {
      console.error('Failed to load activities data:', err);
      if (root) root.innerHTML = '';
      if (errorDetailsText) errorDetailsText.textContent = err && err.message ? err.message : 'Unknown loading error';
      if (errorS) errorS.classList.remove('d-none');
    }
  }

  async function uploadStudentProfile(file) {
    if (!currentStudent) return;

    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      return;
    }

    if (studentProfileUploadBtn) {
      studentProfileUploadBtn.disabled = true;
      studentProfileUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Uploading...</span>';
    }
    if (studentProfileMeta) studentProfileMeta.textContent = 'Uploading your profile photo...';

    try {
      const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const scope = currentStudent.school_id ? 'schools/' + currentStudent.school_id : 'independent';
      const storageRef = ref(storage, scope + '/users/' + currentStudent.uid + '/profile-' + Date.now() + '.' + extension);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentStudent.uid), { photoURL: downloadURL });
      currentStudent.photoURL = downloadURL;
      if (studentProfilePreview) studentProfilePreview.src = downloadURL;
      const sidebarPhotoEl = document.getElementById('sidebarProfilePhoto');
      if (sidebarPhotoEl) sidebarPhotoEl.src = downloadURL;
      if (studentProfileMeta) studentProfileMeta.textContent = getLearnerTrackText() + ' - profile photo updated successfully.';

      try {
        const cachedUser = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
        if (cachedUser && cachedUser.uid === currentStudent.uid) {
          cachedUser.photoURL = downloadURL;
          sessionStorage.setItem('auth_user', JSON.stringify(cachedUser));
        }
      } catch (sessionError) {
        console.error('Session cache update failed:', sessionError);
      }
    } catch (uploadError) {
      console.error('Profile upload error:', uploadError);
      if (studentProfileMeta) studentProfileMeta.textContent = 'Upload failed. Please try again.';
      alert('There was an issue uploading the profile photo.');
    }

    if (studentProfileUploadBtn) {
      studentProfileUploadBtn.disabled = false;
      studentProfileUploadBtn.innerHTML = '<i class="fas fa-camera"></i><span>Change Photo</span>';
    }
  }

  if (backToBooksBtn) {
    backToBooksBtn.addEventListener('click', () => renderBooks());
  }

  const openStudentProfilePicker = () => {
    if (studentProfileFileInput) studentProfileFileInput.click();
  };

  // Profile avatar click (top bar)
  if (studentProfileAvatarTrigger) {
    studentProfileAvatarTrigger.addEventListener('click', openStudentProfilePicker);
    studentProfileAvatarTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStudentProfilePicker();
      }
    });
  }

  // Sidebar avatar click
  if (sidebarAvatarTrigger) {
    sidebarAvatarTrigger.addEventListener('click', openStudentProfilePicker);
    sidebarAvatarTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStudentProfilePicker();
      }
    });
  }

  if (studentProfileUploadBtn) {
    studentProfileUploadBtn.addEventListener('click', openStudentProfilePicker);
  }

  if (studentProfileFileInput) {
    studentProfileFileInput.addEventListener('change', async (event) => {
      const input = event.target;
      if (input.files && input.files[0]) {
        await uploadStudentProfile(input.files[0]);
        // Also update sidebar photo
        const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
        if (sidebarPhoto && currentStudent && currentStudent.photoURL) {
          sidebarPhoto.src = currentStudent.photoURL;
        }
        input.value = '';
      }
    });
  }

  // School logo click to change
  if (schoolLogoClickArea) {
    schoolLogoClickArea.addEventListener('click', () => schoolLogoFileInput.click());
    schoolLogoClickArea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        schoolLogoFileInput.click();
      }
    });
  }

  schoolLogoFileInput.addEventListener('change', async (event) => {
    const input = event.target;
    if (!input.files || !input.files[0] || !currentStudent) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Please choose an image smaller than 5 MB.'); return; }

    try {
      const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const scope = currentStudent.school_id ? 'schools/' + currentStudent.school_id : 'independent/' + currentStudent.uid;
      const storageRef = ref(storage, scope + '/school-logo-' + Date.now() + '.' + extension);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      if (schoolLogoImg) schoolLogoImg.src = downloadURL;
      // Save to user doc
      await updateDoc(doc(db, 'users', currentStudent.uid), { school_logo_url: downloadURL });
      currentStudent.school_logo_url = downloadURL;
    } catch (err) {
      console.error('School logo upload error:', err);
      alert('There was an issue uploading the school logo.');
    }
    input.value = '';
  });

  window.unlockNext = async (num) => {
    if (!currentStudent) return;

    if ((gameState.points || 0) < 50) {
      alert('You need more points to unlock the next chapter.');
      return;
    }

    gameState.points -= 50;
    gameState.unlockedCount = num;

    try {
      await updateDoc(doc(db, 'users', currentStudent.uid), { game_state: gameState });
      updateDashboardMetrics();
      if (currentBookContext) {
        showChapters(currentBookContext.bookId, currentBookContext.bookTitle);
      } else {
        renderBooks();
      }
    } catch (err) {
      console.error(err);
      alert('There was an issue unlocking your chapter.');
    }
  };

  let hasInitializedDashboard = false;

  onAuthStateChanged(auth, async (user) => {
    // CRITICAL: never re-run on back-navigation. Firebase re-emits on every
    // WebView resume — we must ignore all calls after the first successful init.
    if (hasInitializedDashboard) return;

    if (!user) {
      // Don't show "login required" instantly — Firebase can briefly emit
      // null during token refresh, WebView resume, or back-navigation.
      // On Capacitor/Android wait up to 12s (WebView needs more time).
      const stored = (function () {
        try { return localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user'); } catch (e) { return null; }
      })();
      const isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
      const maxAttempts = isCap ? 12 : 6;
      if (stored) {
        let restored = false;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(function (r) { setTimeout(r, 1000); });
          if (auth.currentUser) { restored = true; break; }
        }
        if (restored) return; // a fresh onAuthStateChanged with the user will fire
      }
      showAccessOverlay('Authentication Required', 'You must be logged in as a Student to view this page with real data.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        showAccessOverlay('Student Profile Missing', 'We could not find your student record. Please log in again or contact support.');
        return;
      }

      const userData = userSnap.data();
      if (userData.role !== 'student' && userData.role !== 'individual') {
        showAccessOverlay('Student Login Required', 'You cannot view this page with your current account. Please use a student or individual learner profile.');
        return;
      }

      currentStudent = { uid: user.uid, ...userData };

      if (currentStudent.school_id && !currentStudent.school_name) {
        try {
          const schoolSnap = await getDoc(doc(db, 'schools', currentStudent.school_id));
          if (schoolSnap.exists()) {
             currentStudent.school_name = schoolSnap.data().name || currentStudent.school_id;
             if (!currentStudent.school_logo_url && schoolSnap.data().logo_url) {
                 currentStudent.school_logo_url = schoolSnap.data().logo_url;
             }
          }
        } catch (e) {
          console.error("Could not load school data", e);
        }
      }

      if (currentStudent.game_state) {
        gameState = currentStudent.game_state;
      } else {
        await updateDoc(userDocRef, { game_state: gameState });
      }

      if (!gameState.completed) gameState.completed = [];
      if (!gameState.parent_approved) gameState.parent_approved = [];
      if (!gameState.teacher_approved) gameState.teacher_approved = [];
      
      if (typeof gameState.unlockedCount !== 'number' || gameState.unlockedCount < 1) gameState.unlockedCount = 1;
      if (typeof gameState.points !== 'number') gameState.points = 0;

      // === Auto-migration: fix points from old totalPoints field or recalculate ===
      let needsSave = false;

      // If old 'totalPoints' field exists, merge it into 'points'
      if (typeof gameState.totalPoints === 'number' && gameState.totalPoints > 0 && gameState.points === 0) {
        gameState.points = gameState.totalPoints;
        delete gameState.totalPoints;
        needsSave = true;
      }

      // Safety net: recalculate points from teacher_approved if points are missing
      const expectedPoints = gameState.teacher_approved.length * 50;
      if (gameState.points < expectedPoints) {
        gameState.points = expectedPoints;
        needsSave = true;
      }

      // Ensure unlockedCount matches progress (1 base + teacher_approved chapters)
      const expectedUnlocked = 1 + gameState.teacher_approved.length;
      if (gameState.unlockedCount < expectedUnlocked) {
        gameState.unlockedCount = expectedUnlocked;
        needsSave = true;
      }

      if (needsSave) {
        console.log('[Student Dashboard] Auto-migrating game_state:', gameState);
        await updateDoc(userDocRef, { game_state: gameState });
      }

      currentStudent.game_state = gameState;
      loadChampionsBoard();
      hydrateStudentHeader();
      studentDashboardView.classList.remove('d-none');
      hasInitializedDashboard = true;
      await fetchActivitiesData();
      window.switchStudentSection(currentStudentSection, false);
    } catch (err) {
      console.error('Firebase student dashboard error:', err);
      showAccessOverlay('Unable to Load Dashboard', 'There was a problem loading your dashboard. Please try again shortly.');
    }
  });

  window.logoutStudent = () => {
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

  // ── Refresh game_state silently when student returns from /activity ─────────
  // hasInitializedDashboard stays true so onAuthStateChanged won't re-run.
  // We manually re-fetch so chapters/points reflect the just-completed activity.
  async function refreshGameStateFromFirestore() {
    if (!currentStudent || !auth.currentUser) return;
    try {
      const freshSnap = await getDoc(doc(db, 'users', currentStudent.uid));
      if (!freshSnap.exists()) return;
      const freshData = freshSnap.data();
      if (!freshData.game_state) return;
      const newGs = freshData.game_state;
      const changed =
        (newGs.points || 0) !== (gameState.points || 0) ||
        (newGs.unlockedCount || 1) !== (gameState.unlockedCount || 1) ||
        JSON.stringify(newGs.completed || []) !== JSON.stringify(gameState.completed || []) ||
        JSON.stringify(newGs.teacher_approved || []) !== JSON.stringify(gameState.teacher_approved || []) ||
        JSON.stringify(newGs.parent_approved || []) !== JSON.stringify(gameState.parent_approved || []);
      if (!changed) return;
      gameState = newGs;
      currentStudent.game_state = gameState;
      updateDashboardMetrics();
      if (typeof hydrateStudentHeader === 'function') hydrateStudentHeader();
      if (currentBookContext) {
        showChapters(currentBookContext.bookId, currentBookContext.bookTitle);
      } else {
        if (typeof renderBooks === 'function') renderBooks();
      }
      console.log('[Dashboard] game_state refreshed after returning from activity.');
    } catch (e) {
      console.warn('[Dashboard] Silent refresh failed:', e);
    }
  }

  // pageshow fires when bfcache restores the page (Android back button)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshGameStateFromFirestore();
  });

  // visibilitychange fires when app resumes from background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshGameStateFromFirestore();
  });

  // ── Back button handler (Capacitor) ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const isCap = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      if (isCap && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.removeAllListeners('backButton').then(() => {
          window.Capacitor.Plugins.App.addListener('backButton', () => {
            if (currentBookContext) {
              currentBookContext = null;
              renderBooks();
            } else if (currentStudentSection !== 'overview') {
              window.switchStudentSection('overview', false);
            } else {
              if (window.Capacitor.Plugins.App.minimizeApp) {
                window.Capacitor.Plugins.App.minimizeApp();
              } else {
                window.Capacitor.Plugins.App.exitApp();
              }
            }
          });
        });
      }
    }, 1200);
  });

