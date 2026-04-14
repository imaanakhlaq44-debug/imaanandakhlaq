const fs = require('fs');
const PDFParser = require("pdf2json");

async function extractText() {
    return new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1);
        parser.on("pdfParser_dataError", errData => {
            console.error(errData.parserError);
            reject(errData.parserError);
        });
        parser.on("pdfParser_dataReady", pdfData => {
            const textContent = parser.getRawTextContent();
            fs.writeFileSync('book2_full_text.txt', textContent);
            console.log("Extraction complete!");
            resolve();
        });
        parser.loadPDF('../public/book2.pdf');
    });
}
extractText();
