const fs = require('fs');
const pdfParse = require('pdf-parse');

const files = [
    'c:\\Users\\Almas\\Downloads\\Iman and Akhlaaq Book 1.pdf',
    'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 2.pdf',
    'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 3 (Print Ready).pdf'
];

(async () => {
    for (const file of files) {
        console.log(`\n============================`);
        console.log(`Checking: ${file}`);
        try {
            let dataBuffer = fs.readFileSync(file);
            const data = await pdfParse(dataBuffer);
            console.log(`Number of Pages: ${data.numpages}`);
            console.log(`Title/Info: ${JSON.stringify(data.info)}`);
            console.log(`Snippet: ${data.text.substring(0, 500).replace(/\n/g, ' ')}...`);
        } catch (err) {
            console.log(`Error reading PDF: ${err.message}`);
        }
    }
})();
