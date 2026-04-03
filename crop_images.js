import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgDir = path.join(__dirname, 'public', 'static', 'img');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

// Ensure the paths map accurately to the brain directory artifacts
const imaanSource = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'bc5d4bcd-a0da-4222-8b45-9f34709668fc', 'media__1774830236431.jpg');
const akhlaqSource = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'bc5d4bcd-a0da-4222-8b45-9f34709668fc', 'media__1774830236436.jpg');

async function processImage(sourcePath, namePrefix) {
    if (!fs.existsSync(sourcePath)) {
        console.error("Missing source file:", sourcePath);
        return;
    }

    const metadata = await sharp(sourcePath).metadata();
    console.log(`Processing ${namePrefix}... Dimensions: ${metadata.width}x${metadata.height}`);
    
    // There are 4 characters horizontally, so width of one is total / 4
    const poseWidth = Math.floor(metadata.width / 4);
    const height = metadata.height;
    
    // Front pose is usually the left most OR the very last one. 
    // Looking at the standard character sheet prompt, Girl: [front, back, side, front-diagonal].
    // So pose 0 is the front facing one. Boy: [front-diagonal, back, side, front-diagonal], usually index 0 or 3.
    // We'll crop index 0 (the leftmost 25% of the image) as "front".
    // And let's crop index 3 (the rightmost 25%) as "pose2".
    
    await sharp(sourcePath)
        .extract({ left: 0, top: 0, width: poseWidth, height: height })
        .toFile(path.join(imgDir, `${namePrefix}-front.jpg`));
        
    await sharp(sourcePath)
        .extract({ left: poseWidth * 3, top: 0, width: poseWidth, height: height })
        .toFile(path.join(imgDir, `${namePrefix}-pose.jpg`));
        
    console.log(`Successfully generated crops for ${namePrefix}!`);
}

async function run() {
    await processImage(imaanSource, 'imaan');
    await processImage(akhlaqSource, 'akhlaq');
}

run().catch(console.error);
