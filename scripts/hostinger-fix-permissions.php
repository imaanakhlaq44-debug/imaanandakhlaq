<?php
/**
 * One-off Hostinger maintenance tool: resets kidba_assets/ to sane permissions
 * (0755 for directories, 0644 for files) when an upload leaves assets
 * unreadable and the site starts 403-ing its own CSS/images.
 *
 * THIS FILE LIVES IN scripts/ ON PURPOSE — DO NOT PUT IT BACK IN public/.
 *
 * Only public/ is copied into dist/, and dist/ is what the FTP workflow
 * uploads. While this sat in public/ it shipped with every deploy, which left
 * an unauthenticated PHP endpoint on the live site that any visitor could
 * trigger to walk the asset tree and chmod it.
 *
 * To use it: upload this file to public_html manually via hPanel's file
 * manager, open it once in a browser, then DELETE IT from the server
 * immediately. Never commit it back into public/.
 */

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
echo "<p>Please delete this file from the server now that it has run.</p>";
