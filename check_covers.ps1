Add-Type -Assembly System.IO.Compression.FileSystem
$zipPath = "c:\Users\Almas\OneDrive - Pak Tech Wizards\Documents\almas_app\imaan\imaan_hostinger_v7.zip"
if (Test-Path $zipPath) {
    $z = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $found = $z.Entries | Where-Object { $_.FullName -like '*cover*' }
    if ($found) {
        foreach ($e in $found) {
            Write-Host "$($e.FullName)  $($e.Length)"
        }
    } else {
        Write-Host "NO cover files found in zip!"
    }
    $z.Dispose()
} else {
    Write-Host "v7 zip not found"
}
