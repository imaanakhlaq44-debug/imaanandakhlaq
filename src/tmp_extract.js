import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

(async () => {
    try {
        const dataBuffer = fs.readFileSync('public/book2.pdf');
        const data = await pdf(dataBuffer);
        const lines = data.text.split('\n');
        for (let i = 0; i < Math.min(200, lines.length); i++) {
            console.log(lines[i]);
        }
    } catch (err) {
        console.error(err);
    }
})();
