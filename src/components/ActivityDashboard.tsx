import { html } from 'hono/html'

export const ActivityDashboard = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');

  .dashboard-page {
    background-color: #FDF1ED; /* Balanced Tan/Peach */
    padding: 0;
    font-family: 'Nunito', sans-serif;
    color: #1E2D5A;
    min-height: 100vh;
  }
  
  .dash-header {
    background: linear-gradient(135deg, #1E2D5A, #D63678);
    color: white;
    padding: 60px 20px;
    border-radius: 0 0 50px 50px;
    text-align: center;
    position: relative;
    box-shadow: 0 15px 35px rgba(30, 45, 90, 0.2);
    overflow: hidden;
  }
  
  .dash-header::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    animation: rotate 20s linear infinite;
  }
  
  @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .points-badge {
    background: #E08020;
    color: white;
    padding: 12px 30px;
    border-radius: 50px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.8rem;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    border: 4px solid rgba(255,255,255,0.3);
    box-shadow: 0 10px 20px rgba(224, 128, 32, 0.4);
    z-index: 2;
    position: relative;
  }

  .content-container {
    max-width: 1200px;
    margin: -40px auto 100px auto;
    padding: 0 20px;
    position: relative;
    z-index: 10;
  }

  .book-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
  }

  .chapter-card {
    width: 240px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 40px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(30, 45, 90, 0.08);
    border: 3px solid white;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .chapter-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 20px 45px rgba(214, 54, 120, 0.15);
    border-color: #D63678;
  }

  .chapter-card.locked {
    opacity: 0.85;
    background: #f8fafc;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }
  
  .chapter-card.locked .icon-circle {
    background: #e2e8f0;
    color: #94a3b8;
    border-color: #cbd5e1;
  }

  .icon-circle {
    width: 90px; height: 90px;
    background: #FDF0F6;
    border-radius: 50%;
    margin-bottom: 2rem;
    display: flex; justify-content: center; align-items: center;
    font-size: 2.5rem;
    color: #D63678;
    border: 3px dashed #D63678;
    transition: 0.3s;
  }

  .chapter-card:hover .icon-circle {
    transform: rotate(10deg);
    background: #D63678;
    color: white;
  }

  .chapter-title {
    font-family: 'Fredoka One', cursive;
    font-size: 1.6rem;
    margin-bottom: 0.8rem;
    color: #1E2D5A;
    line-height: 1.2;
  }

  .chapter-sub {
    font-weight: 800;
    color: #C99A6B;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 25px;
  }

  .status-tag {
    font-weight: 800;
    font-size: 0.85rem;
    padding: 8px 20px;
    border-radius: 50px;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
  }

  .tag-unlocked { background: #fee2e2; color: #D63678; }
  .tag-completed { background: #dcfce7; color: #15803d; }
  .tag-locked { background: #f1f5f9; color: #64748b; }
  
  .btn-unlock {
    background: #E08020;
    color: white;
    border: none;
    border-radius: 15px;
    padding: 12px 24px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 6px 0 #A07844;
    transition: 0.2s;
    margin-top: 15px;
  }

  .btn-unlock:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #A07844; }
  .btn-unlock:active { transform: translateY(2px); box-shadow: 0 2px 0 #A07844; }
  
  .loading-shimmer {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  #errorState {
    display: none;
    text-align: center;
    padding: 50px;
    background: white;
    border-radius: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }

  .book-cover-card {
    padding: 1.5rem;
  }
  .book-cover-card:hover {
    border-color: #E08020;
    box-shadow: 0 20px 45px rgba(224, 128, 32, 0.2);
  }
  @media (max-width: 768px) {
    #viewHeader {
      flex-direction: column;
      gap: 15px;
    }
  }
</style>

<div class="dashboard-page">
  <div class="dash-header">
    <h1 style="font-family: 'Fredoka One', cursive; font-size: 3.5rem; margin:0; text-shadow: 0 4px 10px rgba(0,0,0,0.2);">My Learning Path</h1>
    <p style="opacity: 0.9; font-size: 1.3rem; font-weight: 600;">Welcome back, explorer! Ready for a new activity?</p>
    <div class="points-badge">
       <i class="fas fa-star" style="color: #FFD700;"></i> <span id="starsValue">0</span>
    </div>
  </div>

  <div class="content-container">
    <div id="viewHeader" style="display: none; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
      <h2 id="currentBookTitle" style="font-family: 'Fredoka One', cursive; color: #1E2D5A; margin: 0; font-size: 2.2rem; text-shadow: 0 2px 5px rgba(0,0,0,0.05);">Book Chapters</h2>
      <button class="btn-unlock" id="backToBooksBtn" style="margin-top: 0; background: #D63678; box-shadow: 0 6px 0 #A91E54; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-arrow-left"></i> Back to Books
      </button>
    </div>

    <div id="errorState">
       <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
       <h3>Oops! We couldn't load your activities.</h3>
       <p>Please try refreshing the page or check your connection.</p>
       <button class="btn-unlock" onclick="location.reload()">Try Again</button>
    </div>

    <div id="activitiesRoot" class="book-grid">
       <!-- Dynamic Activity Cards -->
       <div class="chapter-card loading-shimmer" style="height: 350px;"></div>
       <div class="chapter-card loading-shimmer" style="height: 350px;"></div>
       <div class="chapter-card loading-shimmer" style="height: 350px;"></div>
    </div>
  </div>
</div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

  const root = document.getElementById('activitiesRoot');
  const stars = document.getElementById('starsValue');
  const errorS = document.getElementById('errorState');
  const viewHeader = document.getElementById('viewHeader');
  const currentBookTitle = document.getElementById('currentBookTitle');
  const backToBooksBtn = document.getElementById('backToBooksBtn');
  
  let apiData = {};
  let currentUser = null;
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

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.game_state) {
            gameState = uData.game_state;
          } else {
            // First time student logs in, initialize with 50 points
            await updateDoc(userDocRef, { game_state: gameState });
          }
        }
        
        // Safety Fallbacks
        if (!gameState.parent_approved) gameState.parent_approved = [];
        if (!gameState.teacher_approved) gameState.teacher_approved = [];
        if (!gameState.completed) gameState.completed = [];
        
        stars.textContent = gameState.points;
        await fetchActivitiesData();
      } catch(err) {
        console.error("Firebase Game State Error:", err);
      }
    } else {
      window.location.href = '/auth'; // Require login
    }
  });

  async function fetchActivitiesData() {
    try {
      const res = await fetch('/api-activities');
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      apiData = data.default || data;
      
      renderBooks();
    } catch (err) {
      console.error(err);
      root.style.display = 'none';
      errorS.style.display = 'block';
    }
  }

  function renderBooks() {
    if (!root) return;
    viewHeader.style.display = 'none';
    root.innerHTML = '';
    
    ALL_BOOKS.forEach(book => {
      const card = document.createElement('div');
      card.className = 'chapter-card book-cover-card';
      card.onclick = () => showChapters(book.id, book.title);
      
      card.innerHTML = \`
        <img src="\${book.cover}" alt="\${book.title}" style="width: 100%; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); margin-bottom: 20px; aspect-ratio: 2/3; object-fit: cover;">
        <div class="chapter-title" style="font-size: 1.4rem;">\${book.title}</div>
        <div class="status-tag tag-unlocked" style="margin-top: 15px; background: #D63678; color: white;"><i class="fas fa-book-open"></i> View Chapters</div>
      \`;
      root.appendChild(card);
    });
  }

  window.showChapters = (bookId, bookTitle) => {
    viewHeader.style.display = 'flex';
    currentBookTitle.textContent = bookTitle;
    
    let allBooksOrder = ALL_BOOKS.map(b => b.id);
    let absoluteOrderCounter = 1;
    let myChapters = [];
    
    allBooksOrder.forEach(bId => {
      if (apiData[bId] && apiData[bId].chapters) {
        Object.keys(apiData[bId].chapters).forEach(cid => {
           const chap = { ...apiData[bId].chapters[cid], bId: bId, cId: cid, globalOrder: absoluteOrderCounter, id: cid };
           absoluteOrderCounter++;
           if (bId === bookId) {
              myChapters.push(chap);
           }
        });
      }
    });
    
    renderChapters(myChapters);
  };

  if (backToBooksBtn) {
    backToBooksBtn.onclick = () => renderBooks();
  }

  function getIcon(title) {
    const lower = title.toLowerCase();
    if (lower.includes('farm') || lower.includes('sister')) return 'fa-tractor';
    if (lower.includes('burger')) return 'fa-hamburger';
    if (lower.includes('goodbye') || lower.includes('begin')) return 'fa-door-open';
    if (lower.includes('truthful') || lower.includes('honest')) return 'fa-shield-alt';
    if (lower.includes('patience')) return 'fa-hourglass-start';
    if (lower.includes('caring') || lower.includes('heart')) return 'fa-heart';
    if (lower.includes('truth')) return 'fa-balance-scale';
    if (lower.includes('safe') || lower.includes('people')) return 'fa-user-shield';
    return 'fa-book-reader';
  }

  function renderChapters(chapters) {
    if (!root) return;
    root.innerHTML = '';
    
    if (chapters.length === 0) {
      root.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 50px; background: white; border-radius: 30px; border: 3px dashed #cbd5e1;"><h3>Coming Soon!</h3><p style="color: #64748b;">Chapters for this book are being uploaded.</p></div>';
      return;
    }
    
    chapters.forEach((item) => {
      const order = item.globalOrder;
      const completedList = gameState.completed || [];
      const approvedList = gameState.teacher_approved || [];

      // Logic for unlocked: Book 2 special rule or unlockedCount
      const isUnlocked = item.bId === 'book2' || order <= (gameState.unlockedCount || 1);
      const isCompleted = completedList.includes(item.id);
      const isApproved = approvedList.includes(item.id);
      
      const card = document.createElement('div');
      card.className = 'chapter-card' + (!isUnlocked ? ' locked' : '');
      
      let statusHtml = '';
      if (isUnlocked) {
        const isParApproved = (gameState.parent_approved || []).includes(item.id);
        
        if (isApproved) {
          statusHtml = '<div class="status-tag tag-completed"><i class="fas fa-check-circle"></i> Approved</div>';
        } else if (isParApproved) {
          statusHtml = '<div class="status-tag tag-unlocked" style="background:#e0f2fe; color:#0369a1;"><i class="fas fa-hourglass-half fa-spin"></i> Pending Teacher</div>';
        } else if (isCompleted) {
          statusHtml = '<div class="status-tag tag-unlocked" style="background:#fff3cd; color:#856404;"><i class="fas fa-spinner fa-spin"></i> Pending Parent</div>';
        } else {
          statusHtml = '<div class="status-tag tag-unlocked"><i class="fas fa-play-circle"></i> Start</div>';
        }
        card.onclick = () => window.location.href = '/activity?book=' + item.bId + '&chapter=' + item.cId;
      } else if (order === gameState.unlockedCount + 1) {
        statusHtml = '<button class="btn-unlock" onclick="event.stopPropagation(); unlockNext(' + order + ')">Unlock (50 <i class="fas fa-star"></i>)</button>';
      } else {
        statusHtml = '<div class="status-tag tag-locked"><i class="fas fa-lock"></i> Locked</div>';
      }

      const chapterIcon = isUnlocked ? getIcon(item.title) : 'fa-lock';
      
      card.innerHTML = \`
        <div class="icon-circle" style="background: \${isUnlocked ? 'linear-gradient(135deg, #D63678, #E08020)' : '#e2e8f0'}; color: \${isUnlocked ? 'white' : '#94a3b8'}; border: 3px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
          <i class="fas \${chapterIcon}"></i>
        </div>
        <div class="chapter-title">\${item.title}</div>
        <div class="chapter-sub">Chapter \${item.cName || item.title.split(' ')[0]}</div>
        \${statusHtml}
      \`;
      
      root.appendChild(card);
    });
  }

  window.unlockNext = async (num) => {
    if (!currentUser) return;
    
    if (gameState.points >= 50) {
      gameState.points -= 50;
      gameState.unlockedCount = num;
      
      try {
        await updateDoc(doc(db, "users", currentUser.uid), { game_state: gameState });
        window.location.reload();
      } catch(err) {
        alert("Wait, there was an issue unlocking your chapter!");
      }
    } else {
      alert('You need more stars! Complete activities to earn more.');
    }
  };

</script>
`
