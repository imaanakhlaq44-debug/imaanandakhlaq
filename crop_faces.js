import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgDir = path.join(__dirname, 'public', 'static', 'img');

async function processAvatar(namePrefix, topOffset, zoomScale) {
    const sourcePath = path.join(imgDir, `${namePrefix}-front.jpg`);
    if (!fs.existsSync(sourcePath)) {
        console.error("Missing front file:", sourcePath);
        return;
    }

    const metadata = await sharp(sourcePath).metadata();
    console.log(`Extracting avatar for ${namePrefix}... Dimensions: ${metadata.width}x${metadata.height}`);
    
    // Original is 256 wide x 672 tall.
    // Face is located near the top. We want a perfectly square 256x256 crop of just the face.
    // We can extract a height of 256.
    // To make sure chin isn't cut off and hair isn't grazing, let's crop from Y = 20 (or something) to Y = 276.
    
    await sharp(sourcePath)
        .extract({ left: 0, top: topOffset, width: metadata.width, height: metadata.width })
        .toFile(path.join(imgDir, `${namePrefix}-avatar.jpg`));
        
    console.log(`Successfully generated avatar for ${namePrefix}!`);
}

async function run() {
    // Top offset 20px means we skip the top 20 pixels (leaves hair breathing room).
    // The width is 256, so the extract box is 256x256 from Y=30 to Y=286.
    await processAvatar('imaan', 30);
    // Akhlaq might have a lower or higher face. Let's use 30px for him too.
    await processAvatar('akhlaq', 30);
}

run().catch(console.error);
