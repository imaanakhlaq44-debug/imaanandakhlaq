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

data.book2.chapters.chapter4 = {
  id: "b2_c4",
  title: "Chapter 4",
  pageStart: 46,
  pageEnd: 60,
  discussionQuestion: "What is the main lesson from this chapter?",
  sections: genericSections
};

data.book2.chapters.chapter5 = {
  id: "b2_c5",
  title: "Chapter 5",
  pageStart: 61,
  pageEnd: 75,
  discussionQuestion: "How does this lesson improve our character?",
  sections: genericSections
};

data.book2.chapters.chapter6 = {
  id: "b2_c6",
  title: "Chapter 6",
  pageStart: 76,
  pageEnd: 90,
  discussionQuestion: "How does this lesson improve our character?",
  sections: genericSections
};

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated Book 2 chapters (4-6)');
