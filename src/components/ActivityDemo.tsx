import { html } from 'hono/html'

export const ActivityDemo = () => html`
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
  .character-img {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 120px;
  }
</style>

<div class="activity-page">
  <div class="container">
    
    <div class="text-center mb-4">
      <h2 style="font-family: 'Fredoka One', cursive; color: #ff6b6b;">Live Digital Activity Demo</h2>
      <p>Try clicking the boxes in the table and typing in the lines!</p>
      <a href="/" class="btn btn-outline-secondary rounded-pill"><i class="fas fa-arrow-left"></i> Back to Home</a>
    </div>

    <div class="activity-container">
      <div class="chapter-ribbon">Activities for Chapter 4</div>
      
      <!-- Avatar placeholder for the Grandpa -->
      <div class="character-img text-center">
        <div style="background: #eef2f3; border-radius: 50%; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin: 0 auto; border: 3px solid #ccc;">
          <i class="fas fa-user-tie fa-3x" style="color: #6c757d;"></i>
        </div>
        <div style="background: white; border: 2px solid #333; border-radius: 20px; padding: 5px 10px; font-weight: bold; position: relative; top: -10px; font-family: 'Fredoka One', cursive;">Diary Time</div>
      </div>

      <div class="discussion-header">
        DISCUSSION QUESTION <i class="fas fa-question-circle text-warning"></i>
      </div>
      
      <p class="question-text">How does patience help us heal after hardship?</p>
      <textarea class="form-control mb-4" rows="3" placeholder="Type your answer here..." style="font-size: 1.1rem; border-radius: 12px; border: 2px solid #e0e0e0;"></textarea>

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
        <div class="parent-row"><div class="parent-day">Mon</div><input type="text" class="parent-input" placeholder="Type a good sentence for Monday..."></div>
        <div class="parent-row"><div class="parent-day">Tue</div><input type="text" class="parent-input" placeholder="Type a good sentence for Tuesday..."></div>
        <div class="parent-row"><div class="parent-day">Wed</div><input type="text" class="parent-input" placeholder="Type a good sentence for Wednesday..."></div>
        <div class="parent-row"><div class="parent-day">Thu</div><input type="text" class="parent-input" placeholder="Type a good sentence for Thursday..."></div>
        <div class="parent-row"><div class="parent-day">Fri</div><input type="text" class="parent-input" placeholder="Type a good sentence for Friday..."></div>
        <div class="parent-row"><div class="parent-day">Sat</div><input type="text" class="parent-input" placeholder="Type a good sentence for Saturday..."></div>
        <div class="parent-row"><div class="parent-day">Sun</div><input type="text" class="parent-input" placeholder="Type a good sentence for Sunday..."></div>
      </div>

      <div class="text-center">
        <button class="save-btn" id="saveProgressBtn"><i class="fas fa-save"></i> Save My Progress</button>
      </div>
      <div id="saveAlert" class="alert alert-success mt-3 text-center" style="display:none; font-family: 'Fredoka One', cursive;">
        <i class="fas fa-star text-warning"></i> Progress Saved! You earned 50 points! <i class="fas fa-star text-warning"></i>
      </div>

    </div>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('interactive-grid');
    
    // Activity Data Structure
    const activityData = [
      { group: 'My Daily Actions:' },
      { question: 'I stayed hopeful ?' },
      { question: 'I controlled emotions ?' },
      { question: 'I practiced patience ?' },
      { group: 'Ethics in Class:' },
      { question: 'I encouraged others ?' },
      { question: 'I avoided blame ?' },
      { question: 'I followed discipline ?' },
      { group: 'With My Family:' },
      { question: 'I showed kindness ?' },
      { question: 'I obeyed parents ?' },
      { question: 'I thanked Allah for peace ?' },
    ];

    // Build the table dynamically
    let htmlContent = '';
    activityData.forEach((item, rowIndex) => {
      if(item.group) {
        htmlContent += '<tr class="group-header"><td colspan="8">' + item.group + '</td></tr>';
      } else {
        htmlContent += '<tr>' +
          '<td class="question-cell">' + item.question + '</td>' +
          [0,1,2,3,4,5,6].map(dayIdx => '<td class="interactive-cell" data-row="' + rowIndex + '" data-day="' + dayIdx + '"></td>').join('') +
        '</tr>';
      }
    });
    gridEl.innerHTML = htmlContent;

    // Add interactivty
    const states = ['', 'yes', 'no'];
    const icons = {
      '': '',
      'yes': '<i class="fas fa-check-circle text-success animate__animated animate__bounceIn"></i>',
      'no': '<i class="fas fa-times-circle text-danger animate__animated animate__bounceIn"></i>'
    };

    document.querySelectorAll('.interactive-cell').forEach(cell => {
      // Intialize state
      cell.dataset.stateIndex = "0";
      
      cell.addEventListener('click', function() {
        let currentIdx = parseInt(this.dataset.stateIndex);
        let nextIdx = (currentIdx + 1) % 3;
        this.dataset.stateIndex = nextIdx.toString();
        let newState = states[nextIdx];
        this.innerHTML = icons[newState];
        
        // Add a tiny haptic feel / pop
        if(newState !== '') {
          this.style.transform = 'scale(1.2)';
          setTimeout(() => this.style.transform = '', 200);
        }
      });
    });

    // Save Button Logic
    document.getElementById('saveProgressBtn').addEventListener('click', () => {
      const alertBox = document.getElementById('saveAlert');
      alertBox.style.display = 'block';
      alertBox.classList.add('animate__animated', 'animate__tada');
      setTimeout(() => alertBox.classList.remove('animate__tada'), 1000);
    });

  });
</script>
`
