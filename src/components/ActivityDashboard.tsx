import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'

export const ActivityDashboard = () => html`
<style>
  .dashboard-page {
    background-color: #f8f9fa;
    padding: 3rem 0;
    font-family: 'Nunito', sans-serif;
    color: #4a4a4a;
    min-height: 100vh;
    background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
    background-size: 20px 20px;
  }
  .dashboard-container {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    padding: 2.5rem;
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    border: 1px solid rgba(255,255,255,0.5);
  }
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px dashed #e2b476;
    padding-bottom: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .points-badge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 12px 25px;
    border-radius: 15px;
    font-size: 1.6rem;
    font-family: 'Fredoka One', cursive;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 6px 0 #b45309, 0 10px 15px rgba(245, 158, 11, 0.3);
    border: 2px solid #fff;
    transition: transform 0.2s;
  }
  .points-badge:hover {
    transform: translateY(-2px);
  }
  .points-badge i {
    color: #fff;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
  }
  
  #chaptersContainer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
    padding-top: 1rem;
    padding-bottom: 2rem;
  }

  .chapter-card {
    border-radius: 35px;
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    color: white;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    aspect-ratio: 1 / 1;
    text-decoration: none;
    cursor: pointer;
  }
  
  .card-unlocked {
    background: #6a9c78;
    box-shadow: 
      inset 2px 2px 10px rgba(255,255,255,0.2), 
      inset -4px -4px 15px rgba(0,0,0,0.15),
      10px 15px 30px rgba(106,156,120,0.4);
  }
  .card-unlocked:hover {
    transform: translateY(-5px);
    box-shadow: 
      inset 2px 2px 10px rgba(255,255,255,0.2), 
      inset -4px -4px 15px rgba(0,0,0,0.15),
      10px 25px 40px rgba(106,156,120,0.5);
  }
  
  .card-locked {
    background: #5c4238;
    box-shadow: 
      inset 2px 2px 10px rgba(255,255,255,0.1), 
      inset -4px -4px 15px rgba(0,0,0,0.3),
      10px 15px 30px rgba(92,66,56,0.5);
    cursor: default;
    color: #e5e7eb;
  }
  
  .card-completed {
    background: #d4b595;
    box-shadow: 
      inset 2px 2px 10px rgba(255,255,255,0.3), 
      inset -4px -4px 15px rgba(0,0,0,0.15),
      10px 15px 30px rgba(212,181,149,0.5);
    color: #5c4238;
  }
  .card-completed:hover {
    transform: translateY(-5px);
    box-shadow: 
      inset 2px 2px 10px rgba(255,255,255,0.3), 
      inset -4px -4px 15px rgba(0,0,0,0.15),
      10px 25px 40px rgba(212,181,149,0.6);
  }

  .icon-container {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    background: inherit;
    box-shadow: 
      -5px -5px 12px rgba(255,255,255,0.15),
      5px 5px 15px rgba(0,0,0,0.25);
  }
  .card-unlocked .icon-container {
     box-shadow: -5px -5px 12px rgba(255,255,255,0.2), 5px 5px 15px rgba(0,0,0,0.2);
  }
  .card-completed .icon-container {
     box-shadow: -5px -5px 12px rgba(255,255,255,0.5), 5px 5px 15px rgba(0,0,0,0.15);
  }

  .icon-container i {
    font-size: 2rem;
    position: relative;
    z-index: 2;
    color: inherit;
    text-shadow: 
      1px 1px 0px rgba(0,0,0,0.1),
      2px 2px 0px rgba(0,0,0,0.08),
      3px 3px 0px rgba(0,0,0,0.06),
      4px 4px 0px rgba(0,0,0,0.04),
      5px 5px 0px rgba(0,0,0,0.02),
      10px 10px 15px rgba(0,0,0,0.3);
  }

  .chapter-info h3 {
    margin: 0;
    font-family: 'Fredoka One', cursive;
    color: #fffaf0; /* Soft creamy white */
    font-size: 1.3rem;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    letter-spacing: 0.5px;
  }
  
  .chapter-info p {
    margin: 0;
    font-size: 0.85rem;
    color: #e5e7eb;
    opacity: 0.9;
    font-weight: 600;
  }

  .chapter-action {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 15px;
  }

  .btn-action {
    background: rgba(255,255,255,0.2);
    color: inherit;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 8px 16px;
    border-radius: 20px;
    backdrop-filter: blur(5px);
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .btn-action:hover {
    background: rgba(255,255,255,0.4);
    transform: translateY(-2px);
  }
  
  .btn-unlock {
     background: rgba(255,255,255,0.05);
     border-color: rgba(255,255,255,0.1);
     color: #fbbf24;
  }
  .btn-unlock:hover {
     background: rgba(255,255,255,0.15);
  }
  .student-profile {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .student-avatar {
    width: 65px;
    height: 65px;
    background: linear-gradient(135deg, #ec4899, #be185d);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2.2rem;
    border: 4px solid #fff;
    box-shadow: 0 5px 15px rgba(236, 72, 153, 0.4);
  }
</style>

<div class="dashboard-page">
  <div class="dashboard-container">
    <div class="header-actions">
      <div class="student-profile">
        <div class="student-avatar"><i class="fas fa-child"></i></div>
        <div>
          <h2 style="margin: 0; font-family: 'Fredoka One', cursive; color: #333;" id="studentName">Student Area</h2>
          <p style="margin: 0; color: #666;">Book 1: Imaan and Akhlaaq</p>
        </div>
      </div>
      <div class="points-badge">
        <span id="userPoints">0</span> <i class="fas fa-star text-warning"></i>
      </div>
    </div>

    <!-- Chapter List dynamically rendered by JS -->
    <div id="chaptersContainer"></div>

  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    
    // Core Game State Setup using Local Storage
    const UNLOCK_COST = 50;
    
    // Load or initialize state
    let state = JSON.parse(localStorage.getItem('imaan_game_state'));
    if (!state) {
      state = {
        points: 0,
        unlockedCount: 1, // Chapter 1 starts unlocked
        completed: []
      };
      localStorage.setItem('imaan_game_state', JSON.stringify(state));
    }

    // Reference to DOM
    const pointsSpan = document.getElementById('userPoints');
    const container = document.getElementById('chaptersContainer');

    // Update UI Points
    function updatePointsUI() {
      pointsSpan.textContent = state.points;
    }
    updatePointsUI();

    const SERVER_DATA = ${raw(JSON.stringify(activitiesData))};
    let chaptersList = [];
    
    if (SERVER_DATA.book1 && SERVER_DATA.book1.chapters) {
      Object.keys(SERVER_DATA.book1.chapters).forEach((key, i) => {
        chaptersList.push({
          ...SERVER_DATA.book1.chapters[key],
          bookId: 'book1',
          bookChapterNum: key // 'chapter1'
        });
      });
    }

    if (SERVER_DATA.book2 && SERVER_DATA.book2.chapters) {
      Object.keys(SERVER_DATA.book2.chapters).forEach((key, i) => {
        chaptersList.push({
          ...SERVER_DATA.book2.chapters[key],
          bookId: 'book2',
          bookChapterNum: key // 'chapter1'
        });
      });
    }

    if (SERVER_DATA.book3 && SERVER_DATA.book3.chapters) {
      Object.keys(SERVER_DATA.book3.chapters).forEach((key, i) => {
        chaptersList.push({
          ...SERVER_DATA.book3.chapters[key],
          bookId: 'book3',
          bookChapterNum: key // 'chapter1'
        });
      });
    }

    renderChapters(chaptersList);

    function renderChapters(chapters) {
      container.innerHTML = '';
      
      chapters.forEach((chapter, index) => {
        const chapterNum = index + 1;
        const isUnlocked = chapterNum <= state.unlockedCount;
        const isCompleted = state.completed.includes(chapter.id);
        
        let card;
        if (isUnlocked && !isCompleted) {
          card = document.createElement('a');
          card.href = '/activity/' + chapter.bookId + '/' + chapter.bookChapterNum;
        } else {
          card = document.createElement('div');
        }
        
        // Use Antariksa color mapping
        let stateClass = 'card-locked';
        if (isCompleted) stateClass = 'card-completed';
        else if (isUnlocked) stateClass = 'card-unlocked';
        
        card.className = 'chapter-card ' + stateClass;

        let actionHtml = '';
        let iconHtml = '<div class="icon-container"><i class="fas fa-book-open"></i></div>';

        if (!isUnlocked) {
          iconHtml = '<div class="icon-container"><i class="fas fa-leaf"></i></div>'; // Earthy icon for locked
        }

        if (isUnlocked) {
          if (isCompleted) {
            actionHtml = '<a href="/activity/' + chapter.bookId + '/' + chapter.bookChapterNum + '" class="btn-action">' +
                         '<i class="fas fa-check"></i> Finished</a>';
            iconHtml = '<div class="icon-container"><i class="fas fa-star"></i></div>';
          } else {
            actionHtml = '<div class="btn-action">' +
                         '<i class="fas fa-play"></i> Start</div>';
          }
        } else if (chapterNum === state.unlockedCount + 1) {
          actionHtml = '<button class="btn-action btn-unlock" onclick="event.preventDefault(); event.stopPropagation(); unlockChapter(' + chapterNum + ')">' +
                       '<i class="fas fa-key"></i> Unlock (50⭐)</button>';
        } else {
          actionHtml = '';
        }

        card.innerHTML = iconHtml +
                          '<div class="chapter-info">' +
                         '<h3>' + chapter.title + '</h3>' +
                         '<p>' + (chapter.bookId === 'book3' ? 'Book 3: ' : chapter.bookId === 'book2' ? 'Book 2: ' : 'Book 1: ') + 'Chapter ' + chapter.bookChapterNum.replace('chapter', '') + '</p>' +
                         '</div>' + (actionHtml ? '<div class="chapter-action">' + actionHtml + '</div>' : '');
        
        container.appendChild(card);
      });
    }

    // Attach to window so onclick can see it
    window.unlockChapter = function(chapterNum) {
      if (state.points >= UNLOCK_COST) {
        state.points -= UNLOCK_COST;
        state.unlockedCount = chapterNum;
        localStorage.setItem('imaan_game_state', JSON.stringify(state));
        updatePointsUI();
        
        // Re-render (we fetch again for simplicity, ideally we keep chapters in memory)
        location.reload(); 
      } else {
        alert("Not enough points! You need " + UNLOCK_COST + " points to unlock this chapter. Complete the previous activities to earn points!");
      }
    };
  });
</script>
`
