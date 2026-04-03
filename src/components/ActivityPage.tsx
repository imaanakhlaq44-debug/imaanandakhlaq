import { html, raw } from 'hono/html'
import activitiesData from '../data/activities.json'

export const ActivityPage = (book: string, chapter: string) => html`
<style>
  .activity-page {
    background-color: #fcf6ee;
    padding: 3rem 0;
    font-family: 'Nunito', sans-serif;
    color: #4a4a4a;
    min-height: 100vh;
  }
  .activity-container {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    padding: 2rem;
    position: relative;
    overflow: hidden;
    max-width: 900px;
    margin: 0 auto;
  }
  .chapter-ribbon {
    background: #f1a23a;
    color: #fff;
    display: inline-block;
    padding: 8px 30px;
    border-radius: 0 20px 20px 0;
    font-family: 'Fredoka One', cursive;
    font-size: 1.2rem;
    position: absolute;
    top: 30px;
    left: 0;
    text-transform: uppercase;
  }
  .discussion-header {
    margin-top: 60px;
    display: flex;
    align-items: center;
    gap: 15px;
    background: #db2777;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    width: fit-content;
    font-family: 'Fredoka One', cursive;
    font-size: 1.5rem;
  }
  .question-text {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 20px 0;
    color: #333;
  }
  .activity-table-wrapper {
    overflow-x: auto;
    margin-bottom: 30px;
    background: #fdf5e6;
    border: 2px dashed #e2b476;
    border-radius: 15px;
    padding: 15px;
  }
  .activity-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  .activity-table th {
    font-family: 'Fredoka One', cursive;
    color: #555;
    text-align: center;
    padding: 10px;
    border-bottom: 2px solid #e2b476;
  }
  .activity-table th.col-question {
    text-align: left;
    width: 30%;
  }
  .activity-table td {
    padding: 10px;
    border-bottom: 1px solid #e2b476;
    border-right: 1px solid #e2b476;
    text-align: center;
  }
  .activity-table td:last-child {
    border-right: none;
  }
  .group-header td {
    font-weight: 800;
    font-size: 1.1rem;
    text-align: left !important;
    background: rgba(241, 162, 58, 0.1);
    color: #333;
  }
  .question-cell {
    text-align: left !important;
    font-weight: 600;
    color: #555;
  }
  .interactive-cell {
    cursor: pointer;
    font-size: 1.4rem;
    transition: all 0.2s;
    user-select: none;
    height: 40px;
  }
  .interactive-cell:hover {
    background: rgba(255,255,255,0.8);
    transform: scale(1.1);
  }
  .parents-section {
    background: #3b82f6;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.4rem;
    margin-top: 40px;
    margin-bottom: 20px;
  }
  .parent-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }
  .parent-day {
    font-weight: 700;
    width: 50px;
    color: #555;
  }
  .parent-input {
    flex: 1;
    border: none;
    border-bottom: 2px solid #ccc;
    background: transparent;
    padding: 5px 10px;
    font-size: 1rem;
    font-family: 'Nunito', sans-serif;
    color: #333;
    transition: border-color 0.3s;
  }
  .parent-input:focus {
    outline: none;
    border-color: #3b82f6;
  }
  .save-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 1.2rem;
    border-radius: 30px;
    font-family: 'Fredoka One', cursive;
    margin-top: 30px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
  }
</style>

<div class="activity-page">
  <div class="container pb-3">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <a href="/student/activities" class="btn btn-outline-secondary rounded-pill"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
      <h2 style="font-family: 'Fredoka One', cursive; color: #ff6b6b; margin: 0;" id="pageTitleLoading">Loading...</h2>
      <div style="width: 150px;"></div> <!-- Spacer -->
    </div>

    <div class="activity-container">
      <div class="chapter-ribbon" id="chapRibbon">Loading...</div>

      <div class="discussion-header">
        DISCUSSION QUESTION <i class="fas fa-question-circle text-warning"></i>
      </div>
      
      <p class="question-text" id="discussionQuestionText">Loading question...</p>
      <textarea class="form-control mb-4" rows="3" placeholder="Type your answer here for the teacher to review..." style="font-size: 1.1rem; border-radius: 12px; border: 2px solid #e0e0e0;"></textarea>

      <p class="text-center text-muted fw-bold mb-2">(Click to answer Yes <span class="text-success">✔</span> or No <span class="text-danger">✖</span>)</p>
      
      <div class="activity-table-wrapper">
        <table class="activity-table">
          <thead>
            <tr>
              <th class="col-question"></th>
              <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
            </tr>
          </thead>
          <tbody id="interactive-grid">
            <!-- Dynamic Rows Generated via JS -->
          </tbody>
        </table>
      </div>

      <div class="parents-section d-inline-block">
        ONE GOOD SENTENCE FROM PARENTS <i class="fas fa-pencil-alt text-warning"></i>
      </div>

      <div class="parents-inputs mt-3">
        <div class="parent-row"><div class="parent-day">Mon</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Tue</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Wed</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Thu</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Fri</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Sat</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
        <div class="parent-row"><div class="parent-day">Sun</div><input type="text" class="parent-input" placeholder="Needs parent PIN to approve..."></div>
      </div>

      <div class="text-center">
        <button class="save-btn" id="saveProgressBtn"><i class="fas fa-save"></i> Save My Progress</button>
      </div>
      <div id="saveAlert" class="alert alert-success mt-3 text-center" style="display:none; font-family: 'Fredoka One', cursive;">
        <i class="fas fa-star text-warning"></i> Chapter Completed! You earned 50 points! <i class="fas fa-star text-warning"></i><br>
        <a href="/student/activities" class="btn btn-sm btn-success mt-2">Go to Dashboard</a>
      </div>

    </div>
  </div>
</div>

<script>
  // Hydrate Data on Client Side based on params injected safely
  const currentBook = "${book}";
  const currentChap = "${chapter}";
  
  document.addEventListener('DOMContentLoaded', () => {
    
    // Core Game State Setup
    let state = JSON.parse(localStorage.getItem('imaan_game_state'));
    if (!state) state = { points: 0, unlockedCount: 1, completed: [] };

    const gridEl = document.getElementById('interactive-grid');
    const titleEl = document.getElementById('pageTitleLoading');
    const ribbonEl = document.getElementById('chapRibbon');
    const discEl = document.getElementById('discussionQuestionText');
    let chapterId = '';

    const SERVER_DATA = ${raw(JSON.stringify(activitiesData))};
    const bookData = SERVER_DATA[currentBook];
    if(!bookData) return alert("Book not found!");
    
    const chapData = bookData.chapters[currentChap];
    if(!chapData) return alert("Chapter not found!");

    chapterId = chapData.id;
    
    // Populate Header
    titleEl.textContent = chapData.title;
    ribbonEl.textContent = "Activities for " + currentChap.replace('chapter', 'Chapter ');
    discEl.textContent = chapData.discussionQuestion;

    // Populate Table
    let htmlContent = '';
    let rowIndex = 0;
    chapData.sections.forEach(section => {
      htmlContent += '<tr class="group-header"><td colspan="8">' + section.heading + '</td></tr>';
      section.questions.forEach(q => {
        htmlContent += '<tr>' +
          '<td class="question-cell">' + q + '</td>' +
          [0,1,2,3,4,5,6].map(dayIdx => '<td class="interactive-cell" data-row="' + rowIndex + '" data-day="' + dayIdx + '"></td>').join('') +
        '</tr>';
        rowIndex++;
      });
    });
    gridEl.innerHTML = htmlContent;

    setupInteractiveCells();


    function setupInteractiveCells() {
      const states = ['', 'yes', 'no'];
      const icons = {
        '': '',
        'yes': '<i class="fas fa-check-circle text-success animate__animated animate__bounceIn"></i>',
        'no': '<i class="fas fa-times-circle text-danger animate__animated animate__bounceIn"></i>'
      };

      document.querySelectorAll('.interactive-cell').forEach(cell => {
        cell.dataset.stateIndex = "0";
        cell.addEventListener('click', function() {
          let currentIdx = parseInt(this.dataset.stateIndex);
          let nextIdx = (currentIdx + 1) % 3;
          this.dataset.stateIndex = nextIdx.toString();
          let newState = states[nextIdx];
          this.innerHTML = icons[newState];
          
          if(newState !== '') {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => this.style.transform = '', 200);
          }
        });
      });
    }

    // Save Button Logic (Gamification)
    document.getElementById('saveProgressBtn').addEventListener('click', () => {
      const alertBox = document.getElementById('saveAlert');
      
      // If not already completed, give them points
      if (!state.completed.includes(chapterId)) {
        state.completed.push(chapterId);
        state.points += 50;
        localStorage.setItem('imaan_game_state', JSON.stringify(state));
      }

      alertBox.style.display = 'block';
      alertBox.classList.add('animate__animated', 'animate__tada');
      document.getElementById('saveProgressBtn').style.display = 'none';
      
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });

  });
</script>
`
