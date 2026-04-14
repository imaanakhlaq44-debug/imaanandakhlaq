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

for (let i = 1; i <= 18; i++) {
  let start = ((i - 1) * 5) + 1;
  let end = i * 5;
  
  data.book2.chapters[`chapter${i}`] = {
    id: `b2_c${i}`,
    title: `Chapter ${i}`,
    pageStart: start,
    pageEnd: end,
    discussionQuestion: "What is the main lesson from this chapter?",
    sections: genericSections
  };
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated Book 2 to 18 chapters');
