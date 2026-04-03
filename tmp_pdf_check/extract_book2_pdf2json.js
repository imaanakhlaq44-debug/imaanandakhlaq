const fs = require('fs');
const PDFParser = require("pdf2json");

const file = 'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 3 (Print Ready).pdf';
const outFile = 'book3_text.txt';

async function extractText() {
    console.log(`Checking: ${file}`);
    await new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1); // text extraction mode
        parser.on("pdfParser_dataError", errData => {
            console.error(errData.parserError);
            resolve();
        });
        parser.on("pdfParser_dataReady", pdfData => {
            const text = parser.getRawTextContent();
            fs.writeFileSync(outFile, text);
            console.log(`Saved text to ${outFile}`);
            resolve();
        });
        parser.loadPDF(file);
    });
}

extractText();
