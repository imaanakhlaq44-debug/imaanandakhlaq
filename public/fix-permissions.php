<?php
function setPermissions($dir) {
    if (!file_exists($dir)) {
        echo "<h3 style='color:red;'>Folder NOT FOUND: $dir</h3>";
        return;
    }
    
    chmod($dir, 0755);
    echo "Set 0755 for directory: $dir <br>";

    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                setPermissions($path);
            } else {
                chmod($path, 0644);
            }
        }
    }
}

echo "<h2>Starting Permission Fix...</h2>";
setPermissions(__DIR__ . "/kidba_assets");
echo "<h2>Done!</h2>";
echo "<p>Please delete this file (fix-permissions.php) for security, and reload your site with Ctrl+F5.</p>";
?>