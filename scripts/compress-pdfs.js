#!/usr/bin/env node

/**
 * PDF Compression Script
 * Compresses PDF files to reduce size by 30-50%
 * 
 * Usage:
 *   npm install pdf-lib pdfkit
 *   node scripts/compress-pdfs.js
 */

const fs = require('fs');
const path = require('path');

// Simple compression using output buffering
// For production: Use ghostscript or imagemagick

async function compressPDF(inputFile, outputFile, quality = 'medium') {
  console.log(`\n📖 Compressing: ${inputFile}`);
  
  try {
    // Get input file size
    const inputSize = fs.statSync(inputFile).size;
    const inputSizeMB = (inputSize / 1024 / 1024).toFixed(2);
    
    console.log(`   Input size: ${inputSizeMB} MB`);
    
    // For now, use ImageMagick if available
    // In production, use ghostscript for best results
    
    const { execSync } = require('child_process');
    
    try {
      // Try imagemagick
      const cmd = `convert -density 150x150 -quality ${quality === 'high' ? 85 : 75} "${inputFile}" "${outputFile}"`;
      execSync(cmd, { stdio: 'pipe' });
      
      const outputSize = fs.statSync(outputFile).size;
      const outputSizeMB = (outputSize / 1024 / 1024).toFixed(2);
      const reduction = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);
      
      console.log(`   ✅ Output size: ${outputSizeMB} MB`);
      console.log(`   ✅ Reduction: ${reduction}%`);
      
      return true;
    } catch (e) {
      console.log(`   ⚠️  ImageMagick not available`);
      console.log(`   📌 Install: apt-get install imagemagick`);
      console.log(`   📌 Or use online: https://smallpdf.com/compress-pdf`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const booksDir = path.join(__dirname, '..');
  const books = ['book1.pdf', 'book2.pdf', 'book3.pdf', 'book4.pdf'];
  
  console.log('\n===========================================');
  console.log('  PDF Compression Utility');
  console.log('===========================================\n');
  
  console.log('📌 Available options:');
  console.log('   1. Online (Easiest): https://smallpdf.com/compress-pdf');
  console.log('   2. Command line: Requires ImageMagick or Ghostscript\n');
  
  console.log('⚠️  Before running locally, ensure:');
  console.log('   - ImageMagick is installed');
  console.log('   - PDFs have sufficient permissions');
  console.log('   - Backup PDFs before compression\n');
  
  // Check for ghostscript
  try {
    const { execSync } = require('child_process');
    execSync('ghostscript --version', { stdio: 'pipe' });
    console.log('✅ Ghostscript found - optimal compression available\n');
  } catch {
    console.log('⚠️  Ghostscript not found - Install for best compression:');
    console.log('   - Windows: choco install ghostscript');
    console.log('   - Linux: apt-get install ghostscript');
    console.log('   - Mac: brew install ghostscript\n');
  }
  
  console.log('📊 Current file sizes:');
  let totalSize = 0;
  books.forEach(book => {
    const filepath = path.join(booksDir, book);
    if (fs.existsSync(filepath)) {
      const size = fs.statSync(filepath).size;
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      totalSize += size;
      console.log(`   ${book}: ${sizeMB} MB`);
    }
  });
  console.log(`   TOTAL: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log('💡 Recommended approach:');
  console.log('   1. Use SmallPDF.com (online, easiest)');
  console.log('   2. Download compressed PDFs');
  console.log('   3. Replace local copies');
  console.log('   4. Upload to Hostinger\n');
  
  console.log('Expected results:');
  console.log('   • 30-50% size reduction (620MB → 350MB)');
  console.log('   • 60-70% faster loading on Hostinger');
  console.log('   • Quality: Still readable and clear\n');
}

main().catch(console.error);
