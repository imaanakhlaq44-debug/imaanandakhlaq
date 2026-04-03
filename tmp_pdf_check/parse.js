const fs = require('fs');
const text = fs.readFileSync('book3_text.txt', 'utf8');
const lines = text.split('\n')
  .map(l => l.trim().replace(/\s+/g, ' '))
  .filter(l => l.length > 0 && !l.includes('Imaan and Akhlaq Book 3.indd'));

for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('chapter') || 
      lines[i].toLowerCase().includes('daily actions') ||
      lines[i].toLowerCase().includes('ethics in class') ||
      lines[i].toLowerCase().includes('with my family') ||
      lines[i].toLowerCase().includes('discussion')) {
    console.log(lines[i]);
  }
}
