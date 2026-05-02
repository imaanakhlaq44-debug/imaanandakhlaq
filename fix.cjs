const fs = require('fs');
let file = 'src/components/TeacherDashboard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
for (let i = 2100; i < 2250; i++) {
  if (lines[i]) {
    lines[i] = lines[i].replace(/`/g, "'");
  }
}
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed backticks!');
