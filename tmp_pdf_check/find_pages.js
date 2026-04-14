const fs = require('fs');
const PDFParser = require("pdf2json");

async function findChapterPages(path, searchTerms) {
    return new Promise((resolve) => {
        const parser = new PDFParser(null, 1);
        parser.on("pdfParser_dataReady", pdfData => {
            const results = {};
            const textContent = parser.getRawTextContent().split(/\r?\n---- Page \(\d+\) ----\r?\n/);
            
            searchTerms.forEach(term => {
                let foundPage = -1;
                // page index starts at 0 for page 1 conceptually, but split makes index i mapped to page i ?
                // The split usually makes textContent[0] stuff before first page, textContent[1] is page 1.
                for (let i = 1; i < textContent.length; i++) {
                    if (textContent[i].toLowerCase().includes(term.toLowerCase())) {
                        foundPage = i;
                        break;
                    }
                }
                results[term] = foundPage;
            });
            resolve(results);
        });
        parser.loadPDF(path);
    });
}

async function run() {
    const b1 = await findChapterPages('../public/book1.pdf', ["The Farm and the Brave Sister", "The Giant Burger", "Goodbyes and New Beginnings"]);
    console.log("Book 1 Pages:", b1);
    
    const b2 = await findChapterPages('../public/book2.pdf', ["The First Flight", "The Best Answer", "A Surprise Visit"]);
    console.log("Book 2 Pages:", b2);
    
    const b3 = await findChapterPages('../public/book3.pdf', ["The Meaning of Patience", "A Caring Heart", "Standing for Truth"]);
    console.log("Book 3 Pages:", b3);
}

run();
