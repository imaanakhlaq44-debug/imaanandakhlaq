<?php
/**
 * Hostinger Safe Unzip Script
 * Extracts imaan_hostinger.zip to the current directory
 * FIXED: Handles Windows backslashes (\) correctly on Linux servers
 */

$zipFile = 'imaan_hostinger.zip';
$extractPath = __DIR__ . '/'; // Extract to current directory

echo "<div style='font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>";
echo "<h2 style='color: #1E2D5A; text-align: center; margin-bottom: 20px;'>Imaan & Akhlaq - Deployment Unzipper</h2>";

if (!file_exists($zipFile)) {
    die("<div style='background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px;'><h3 style='color: #b91c1c; margin:0;'>Error: Target ZIP not found!</h3><p style='color: #7f1d1d; margin-top:10px;'>Please upload <strong>{$zipFile}</strong> to this folder first, then reload this page.</p></div></div>");
}

echo "<p style='color: #475569;'>Found <strong>{$zipFile}</strong>. Starting extraction...</p>";
ob_flush(); flush();

$zip = new ZipArchive;
$res = $zip->open($zipFile);

if ($res === TRUE) {
    $count = 0;
    // Iterate through all files in the zip to fix Windows backslashes for Linux server
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $filename = $zip->getNameIndex($i);
        // Replace backslashes with forward slashes for Linux compatibility
        $fixedFilename = str_replace('\\', '/', $filename);
        
        $fullPath = $extractPath . $fixedFilename;
        $dir = dirname($fullPath);
        
        // Create directory structure if it doesn't exist
        if ($dir != '.' && !is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Extract the file content if it's not a directory
        if (substr($fixedFilename, -1) !== '/') {
            $content = $zip->getFromIndex($i);
            if ($content !== false) {
                file_put_contents($fullPath, $content);
                $count++;
            }
        }
    }
    
    $zip->close();
    
    echo "<div style='background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin-top: 20px;'>";
    echo "<h3 style='color: #15803d; margin:0;'>Success! $count Files Extracted.</h3>";
    echo "<p style='color: #166534; margin-top:10px;'>The zip file has been fully extracted and Windows folder paths were fixed for Hostinger.</p>";
    echo "</div>";
    
    echo "<p style='color: #b91c1c; font-weight: bold; margin-top: 20px;'>⚠️ SECURITY WARNING:</p>";
    echo "<p style='color: #475569;'>Please delete <strong>{$zipFile}</strong> and <strong>unzip.php</strong> immediately to secure your server.</p>";
    
    echo "<div style='text-align: center; margin-top: 30px;'>";
    echo "<a href='/' style='background: #1E2D5A; color: white; padding: 10px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Visit Website →</a>";
    echo "</div>";
} else {
    echo "<div style='background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin-top: 20px;'>";
    echo "<h3 style='color: #b91c1c; margin:0;'>Extraction Failed!</h3>";
    echo "<p style='color: #7f1d1d; margin-top:10px;'>ZipArchive Error Code: $res</p>";
    echo "</div>";
}

echo "</div>";
?>
