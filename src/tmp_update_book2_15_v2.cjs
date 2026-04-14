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
  { start: 9, end: 12, title: "The Best Answer" },
  { start: 13, end: 16, title: "A Surprise Visit" }
];

for (let i = 0; i < 3; i++) {
  data.book2.chapters[`chapter${i + 1}`] = {
    id: `b2_c${i + 1}`,
    title: bounds[i].title,
    pageStart: bounds[i].start,
    pageEnd: bounds[i].end,
    discussionQuestion: "What is the main lesson from this chapter?",
    sections: genericSections
  };
}

let currentPage = 17;
// Distribute 74 pages across remaining 12 chapters (Chapter 4 to 15)
for (let i = 4; i <= 15; i++) {
  let pagesForThisChapter = (i <= 13) ? 6 : 7; // 10 chapters with 6 pages, 2 chapters with 7
  if (i === 15) {
     pagesForThisChapter = 90 - currentPage + 1;
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
console.log('Successfully updated Book 2 chapters with Ch 3 ending at 16');
