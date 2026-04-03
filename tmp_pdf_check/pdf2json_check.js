const fs = require('fs');
const PDFParser = require("pdf2json");

const files = [
    'c:\\Users\\Almas\\Downloads\\Iman and Akhlaaq Book 1.pdf',
    'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 2.pdf',
    'c:\\Users\\Almas\\Downloads\\Imaan and Akhlaq Book 3 (Print Ready).pdf'
];

async function checkPdfs() {
    for (const file of files) {
        console.log(`\n============================`);
        console.log(`Checking: ${file}`);
        await new Promise((resolve, reject) => {
            const parser = new PDFParser(null, 1); // Use text extraction mode
            parser.on("pdfParser_dataError", errData => {
                console.error(errData.parserError);
                resolve();
            });
            parser.on("pdfParser_dataReady", pdfData => {
                const text = parser.getRawTextContent();
                console.log(`Number of Pages: ${pdfData.Pages.length || Object.keys(pdfData.Pages).length}`);
                // Print a larger snippet and clean up whitespace
                const cleanText = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
                console.log(`Snippet:\n${cleanText.substring(0, 2000)}\n...`);
                resolve();
            });
            parser.loadPDF(file);
        });
    }
}

checkPdfs();
