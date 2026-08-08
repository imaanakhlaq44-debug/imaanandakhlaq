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

# 2b. (REMOVED) Overlay of imaan_hostinger/*.html over the dist build.
#
# The step claimed those files were "hand-edited" and "Vite SSR doesn't
# regenerate the dashboards". Neither is true: step [0] above builds all 17 of
# them, and imaan_hostinger/ only ever held an old copy of that same build. So
# the overlay silently reverted the site to a stale snapshot on every package
# run, and nothing merged since that snapshot ever reached production —
# including the contact number (live still showed +92 333 5756028 while src had
# moved to +92 339 0106475), the Sora font fix, the retitle, and a dev-time
# "window.location.replace('https://localhost/auth')" that the newer build had
# already dropped. Diffing every overlay file against dist turned up no edit
# that existed only in imaan_hostinger/ and was worth keeping.
#
# dist/ is the source of truth. If a page ever does need a hand-edit, put it in
# src/ so the build carries it forward.

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
