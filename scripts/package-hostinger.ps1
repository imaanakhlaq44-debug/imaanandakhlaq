# ============================================================
# package-hostinger.ps1
# Imaan and Akhlaq — Hostinger ZIP Builder
# Excludes large PDF books to keep upload size small
# ============================================================

$distPath   = Join-Path $PSScriptRoot "..\dist"
$outputZip  = Join-Path $PSScriptRoot "..\imaan_hostinger.zip"
$tempDir    = Join-Path $PSScriptRoot "..\tmp_pkg_hostinger"
$stagingZip = Join-Path $PSScriptRoot "..\imaan_hostinger_build.zip"

Write-Host ""
Write-Host "=== Imaan and Akhlaq Hostinger Packager ===" -ForegroundColor Cyan
Write-Host ""

# 0. CLEAN WEB BUILD (vite only — no APK patches like compact dashboards or
#    super-admin brand overrides). Hostinger gets the original website design.
Write-Host "[0] Running clean web build (npm run build)..." -ForegroundColor Yellow
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        throw "vite build failed (exit code $LASTEXITCODE). Hostinger zip aborted."
    }
} finally {
    Pop-Location
}

# 1. Prepare clean staging paths
if (-not (Test-Path $distPath)) {
    throw "Dist folder not found at $distPath. Run the build before packaging."
}

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
if (Test-Path $stagingZip) {
    Remove-Item $stagingZip -Force
}
Write-Host "[1] Staging area ready." -ForegroundColor Yellow

# 2. Copy dist to temp, EXCLUDING large PDF books (uploaded separately to keep zip small)
Write-Host "[2] Copying dist folder (excluding PDF books)..." -ForegroundColor Yellow
$excludePatterns = @("book1.pdf", "book2.pdf", "book3.pdf")

Copy-Item -Path $distPath -Destination $tempDir -Recurse -Force

# Remove excluded PDFs from temp
foreach ($pattern in $excludePatterns) {
    Get-ChildItem -Path $tempDir -Recurse -Filter $pattern | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -ErrorAction Stop
            Write-Host "   Excluded: $($_.Name)" -ForegroundColor DarkGray
        } catch {
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "   Excluded (retry): $($_.Name)" -ForegroundColor DarkGray
        }
    }
}

# 2b. OVERLAY hand-edited static files from imaan_hostinger/ over the dist build.
# These files (auth.html, teacher-dashboard.html, admin-dashboard.html, etc.) are
# directly maintained in imaan_hostinger/ and are the source of truth for those
# pages — Vite SSR doesn't regenerate the dashboards, so we must overwrite them.
# 2b. OVERLAY hand-edited static files from imaan_hostinger/ over the dist build.
# These files (auth.html, teacher-dashboard.html, admin-dashboard.html, etc.) are
# directly maintained in imaan_hostinger/ and are the source of truth for those
# pages — Vite SSR doesn't regenerate the dashboards, so we must overwrite them.
Write-Host "[2b] Overlaying hand-edited static files from imaan_hostinger/..." -ForegroundColor Yellow
$hostingerSrc = Join-Path $PSScriptRoot "..\imaan_hostinger"
$overlayFiles = @(
    "auth.html",
    "teacher-dashboard.html",
    "admin-dashboard.html",
    "parent-dashboard.html",
    "student-activities.html",
    "super-admin-dashboard.html",
    "activity.html",
    "club.html",
    "delete-account.html",
    "privacy.html",
    "terms.html",
    "contact.html",
    "blog.html",
    "blog-article-1.html",
    "blog-article-2.html",
    "blog-article-3.html",
    "index.html"
)
foreach ($f in $overlayFiles) {
    $srcFile = Join-Path $hostingerSrc $f
    $dstFile = Join-Path $tempDir $f
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination $dstFile -Force
        Write-Host "   Overlaid: $f" -ForegroundColor DarkGray
    }
}

# 3. Compress temp folder contents into a staging ZIP first
Write-Host "[3] Creating ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $stagingZip -Force

# 4. Publish the ZIP safely
$publishedZip = $outputZip
if (Test-Path $outputZip) {
    try {
        Remove-Item $outputZip -Force -ErrorAction Stop
        Write-Host "[4] Replacing previous imaan_hostinger.zip" -ForegroundColor Yellow
    } catch {
        $publishedZip = Join-Path $PSScriptRoot ("..\imaan_hostinger_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".zip")
        Write-Host "[4] Existing imaan_hostinger.zip is locked. Saving new package as $([System.IO.Path]::GetFileName($publishedZip))" -ForegroundColor Yellow
    }
} else {
    Write-Host "[4] Publishing new ZIP." -ForegroundColor Yellow
}

Move-Item -Path $stagingZip -Destination $publishedZip -Force

# 5. Cleanup temp
Remove-Item $tempDir -Recurse -Force

# 6. Report
$zipFile = Get-Item $publishedZip
$zipSize = [math]::Round($zipFile.Length / 1MB, 2)
Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "ZIP Created : $($zipFile.Name)" -ForegroundColor Green
Write-Host "ZIP Size    : $zipSize MB" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Go to Hostinger File Manager, open public_html"
Write-Host "  2. Upload: $($zipFile.Name)"
Write-Host "  3. Right-click and Extract"
Write-Host "  4. Done! Your site is live."
Write-Host ""
