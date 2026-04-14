<?php
// Fix permissions script for Hostinger (Windows ZIP extraction bug)
function setPermissions($dir) {
    if (!file_exists($dir)) return;
    
    // Set directory to 0755
    chmod($dir, 0755);
    echo "Set 0755 for directory: $dir <br>";

    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                setPermissions($path);
            } else {
                // Set file to 0644
                chmod($path, 0644);
                // We wont echo every file to save screen space
            }
        }
    }
}

echo "<h2>Starting Permission Fix...</h2>";
setPermissions(__DIR__ . "/assets");
echo "<h2>Done!</h2>";
echo "<p>Please delete this file (fix-permissions.php) for security, and reload your site with Ctrl+F5.</p>";
?>