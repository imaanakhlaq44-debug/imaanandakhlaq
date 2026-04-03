const fs = require('fs');

const dataRaw = fs.readFileSync('../src/data/activities.json', 'utf8');
const data = JSON.parse(dataRaw);

data.book3 = {
  "title": "Imaan and Akhlaaq - Book 3",
  "chapters": {
    "chapter1": {
      "id": "b3_c1",
      "title": "The Meaning of Patience",
      "discussionQuestion": "Why is being patient important even when things are difficult?",
      "sections": [
        {
          "heading": "My Daily Actions:",
          "questions": [
            "I stayed calm when things didn't go my way ?",
            "I didn't rush or complain during a hard task ?",
            "I waited nicely for my turn ?"
          ]
        },
        {
          "heading": "Ethics in Class:",
          "questions": [
            "I listened quietly when the teacher was busy ?",
            "I was patient during challenging lessons ?",
            "I helped a classmate without getting frustrated ?"
          ]
        },
        {
          "heading": "With My Family:",
          "questions": [
            "I was patient when my parents asked me to wait ?",
            "I handled disagreement with my siblings calmly ?",
            "I remembered Allah helps the patient ?"
          ]
        }
      ]
    },
    "chapter2": {
      "id": "b3_c2",
      "title": "A Caring Heart",
      "discussionQuestion": "How does helping others make our own hearts feel better?",
      "sections": [
        {
          "heading": "My Daily Actions:",
          "questions": [
            "I offered a smile to someone who seemed sad ?",
            "I shared something I value with a friend ?",
            "I said a kind word to someone today ?"
          ]
        },
        {
          "heading": "Ethics in Class:",
          "questions": [
            "I noticed someone struggling and offered help ?",
            "I included everyone in the group activity ?",
            "I said 'please' and 'thank you' sincerely ?"
          ]
        },
        {
          "heading": "With My Family:",
          "questions": [
            "I asked my parents how their day was ?",
            "I comforted a sibling who was upset ?",
            "I made dua for my family's well-being ?"
          ]
        }
      ]
    },
    "chapter3": {
      "id": "b3_c3",
      "title": "Standing for Truth",
      "discussionQuestion": "Why does speaking the truth require courage?",
      "sections": [
        {
          "heading": "My Daily Actions:",
          "questions": [
            "I stood up for what is right today ?",
            "I didn't agree with a wrong action ?",
            "I admitted fault immediately ?"
          ]
        },
        {
          "heading": "Ethics in Class:",
          "questions": [
            "I was honest even when it could have gotten me in trouble ?",
            "I didn't let others cheat or copy ?",
            "I reported an incident fairly ?"
          ]
        },
        {
          "heading": "With My Family:",
          "questions": [
            "I told the complete truth to my parents ?",
            "I supported truth over taking sides ?",
            "I sought forgiveness from Allah for past lies ?"
          ]
        }
      ]
    }
  }
};

fs.writeFileSync('../src/data/activities.json', JSON.stringify(data, null, 2));
console.log('Book 3 added successfully!');
