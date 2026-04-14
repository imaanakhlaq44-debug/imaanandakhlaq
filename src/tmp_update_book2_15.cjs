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

let currentPage = 9;

// Chapter 1 is explicitly 1 to 8
data.book2.chapters[`chapter1`] = {
  id: `b2_c1`,
  title: `The First Flight`,
  pageStart: 1,
  pageEnd: 8,
  discussionQuestion: "What is the main lesson from this chapter?",
  sections: genericSections
};

const knownTitles = {
  2: "The Best Answer",
  3: "A Surprise Visit"
};

for (let i = 2; i <= 15; i++) {
  // We have 14 chapters remaining. Total pages remaining = 90 - 8 = 82
  // We distribute them approximately 6 pages each. The last chapter gets whatever is left to 90.
  let pagesForThisChapter = (i <= 13) ? 6 : 5; // 12 chapters with 6 pages, 2 with 5
  if (i === 15) {
     pagesForThisChapter = 90 - currentPage + 1;
  }

  let start = currentPage;
  let end = currentPage + pagesForThisChapter - 1;
  
  if (end > 90) end = 90;

  data.book2.chapters[`chapter${i}`] = {
    id: `b2_c${i}`,
    title: knownTitles[i] || `Chapter ${i}`,
    pageStart: start,
    pageEnd: end,
    discussionQuestion: "What is the main lesson from this chapter?",
    sections: genericSections
  };

  currentPage = end + 1;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated Book 2 to 15 chapters');
