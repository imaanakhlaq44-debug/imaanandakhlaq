const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const inputFile = 'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 2.pdf';
const outputFile = path.join(__dirname, 'book2_raw_text.txt');

(async () => {
    try {
        console.log('Reading PDF...', inputFile);
        const dataBuffer = fs.readFileSync(inputFile);
        
        console.log('Parsing PDF...');
        const data = await pdf(dataBuffer);
        
        console.log('Writing text to file...');
        fs.writeFileSync(outputFile, data.text);
        
        console.log('Done! Extracted', data.text.length, 'characters to', outputFile);
    } catch (err) {
        console.error('Error extracting PDF:', err);
    }
})();
