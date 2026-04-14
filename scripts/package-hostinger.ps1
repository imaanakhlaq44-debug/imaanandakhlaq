# ============================================================
# package-hostinger.ps1
# Imaan and Akhlaq — Hostinger ZIP Builder
# Temporarily hides PDFs before build to avoid OneDrive locks
# ============================================================

$projectRoot = Join-Path $PSScriptRoot ".."
$publicPath  = Join-Path $projectRoot "public"
$distPath    = Join-Path $projectRoot "dist"
$outputZip   = Join-Path $projectRoot "imaan_hostinger.zip"

Write-Host ""
Write-Host "=== Imaan and Akhlaq Hostinger Packager (Safe Mode) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Hide PDFs from public folder
Write-Host "[1] Temporarily moving PDFs out of public folder..." -ForegroundColor Yellow
$pdfs = Get-ChildItem -Path $publicPath -Filter "*.pdf"
foreach ($pdf in $pdfs) {
    Move-Item $pdf.FullName $projectRoot -Force
}

# 2. Run vite build
Write-Host "[2] Running Vite Build..." -ForegroundColor Yellow
Set-Location $projectRoot
npm run build 

# 3. Restore PDFs to public
Write-Host "[3] Restoring PDFs to public folder..." -ForegroundColor Yellow
$hiddenPdfs = Get-ChildItem -Path $projectRoot -Filter "*.pdf"
foreach ($pdf in $hiddenPdfs) {
    Move-Item $pdf.FullName $publicPath -Force
}

# 4. Remove old ZIP
Write-Host "[4] Removing old ZIP..." -ForegroundColor Yellow
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# 5. Compress dist
Write-Host "[5] Compressing dist folder into ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$distPath\*" -DestinationPath $outputZip -Force

# 6. Report
$zipSize = [math]::Round((Get-Item $outputZip).Length / 1MB, 2)
Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "ZIP Created : imaan_hostinger.zip" -ForegroundColor Green
Write-Host "ZIP Size    : $zipSize MB" -ForegroundColor Green
Write-Host ""
Write-Host "Please upload this zip to Hostinger public_html and extract!"

