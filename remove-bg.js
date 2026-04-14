const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log("Starting background removal...");
  try {
    const inputPath = path.resolve('public/static/img/akhlaq-front.jpg');
    console.log("Input:", inputPath);
    
    // The library expects file path directly in Node.js
    const bgBlob = await removeBackground(inputPath);
    
    const arrayBuffer = await bgBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync('public/static/img/akhlaq-front-nobg.png', buffer);
    console.log("Success! Transparent image saved.");
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
