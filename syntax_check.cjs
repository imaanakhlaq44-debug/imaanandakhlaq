const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFile(file) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Look for <script> or <script type="module"> blocks
    const regex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    let found = false;
    let blockNum = 1;
    
    while ((match = regex.exec(content)) !== null) {
        found = true;
        let s = match[1];
        
        // Remove ${...} interpolations so Node doesn't choke on them
        s = s.replace(/\$\{[\s\S]*?\}/g, '0');
        // Handle escaped template literals used in our .tsx files
        s = s.replace(/\\`/g, '`');
        
        const tempName = 'temp_test_' + blockNum + '.js';
        fs.writeFileSync(tempName, s);
        
        try {
            execSync(`node -c ${tempName}`, { stdio: 'pipe' });
            // console.log(`[OK] ${file} (Script Block ${blockNum})`);
        } catch (e) {
            console.error(`\n[ERROR] ${file} (Script Block ${blockNum}) has a syntax error!`);
            console.error(e.stderr ? e.stderr.toString() : e.message);
        }
        
        try { fs.unlinkSync(tempName); } catch(e){}
        blockNum++;
    }
    
    if (!found) {
        // console.log(`[SKIP] ${file} - No script tags found`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            checkFile(fullPath);
        }
    }
}

console.log("Starting full syntax check...");
scanDir('src');
console.log("Check complete.");
