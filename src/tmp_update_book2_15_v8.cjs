const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'activities.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const genericSections = [
  {
    "heading": "My Daily Actions:",
    "questions": [
      "I applied the core learning today ?",
      "I helped a friend understand this ?",
      "I practiced the sunnah associated with this ?"
    ]
  },
  {
    "heading": "Ethics in Class:",
    "questions": [
      "I listened when the teacher spoke about this ?",
      "I asked questions to clarify my doubts ?",
      "I didn't distract others during the lesson ?"
    ]
  },
  {
    "heading": "With My Family:",
    "questions": [
      "I shared this story with my parents ?",
      "I promised to improve my character ?",
      "I thanked Allah for the guidance ?"
    ]
  }
];

data.book2.chapters = {}; // Clear old chapters

// Defined bounds
const bounds = [
  { start: 1, end: 8, title: "The First Flight" },
  { start: 9, end: 14, title: "The Best Answer" },
  { start: 15, end: 19, title: "A Surprise Visit" },
  { start: 20, end: 25, title: "Chapter 4" },
  { start: 26, end: 30, title: "Chapter 5" },
  { start: 31, end: 37, title: "Chapter 6" },
  { start: 38, end: 43, title: "Chapter 7" },
  { start: 44, end: 49, title: "Chapter 8" },
  { start: 50, end: 54, title: "Chapter 9" },
  { start: 55, end: 59, title: "Chapter 10" },
  { start: 60, end: 63, title: "Chapter 11" }
];

for (let i = 0; i < 11; i++) {
  data.book2.chapters[`chapter${i + 1}`] = {
    id: `b2_c${i + 1}`,
    title: bounds[i].title,
    pageStart: bounds[i].start,
    pageEnd: bounds[i].end,
    discussionQuestion: "What is the main lesson from this chapter?",
    sections: genericSections
  };
}

let currentPage = 64;
// Distribute 27 pages across remaining 4 chapters (Chapter 12 to 15)
for (let i = 12; i <= 15; i++) {
  let pagesForThisChapter = (i <= 14) ? 7 : 6; // 3 chapters get 7, 1 gets 6
  if (i === 15) {
     pagesForThisChapter = 90 - currentPage + 1; // Remaining
  }

  let start = currentPage;
  let end = currentPage + pagesForThisChapter - 1;
  
  if (end > 90) end = 90;

  data.book2.chapters[`chapter${i}`] = {
    id: `b2_c${i}`,
    title: `Chapter ${i}`,
    pageStart: start,
    pageEnd: end,
    discussionQuestion: "What is the main lesson from this chapter?",
    sections: genericSections
  };

  currentPage = end + 1;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated Book 2 chapters with Ch 11 ending at 63');
