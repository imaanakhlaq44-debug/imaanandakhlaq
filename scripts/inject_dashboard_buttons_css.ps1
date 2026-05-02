# Injects /kidba_assets/css/dashboard-buttons.css into the 5 dashboard HTML
# files in imaan_hostinger/, right after the existing custom style.css link.
# Idempotent: skips files that already reference dashboard-buttons.css.

$files = @(
  'imaan_hostinger\parent-dashboard.html',
  'imaan_hostinger\teacher-dashboard.html',
  'imaan_hostinger\admin-dashboard.html',
  'imaan_hostinger\super-admin-dashboard.html',
  'imaan_hostinger\student-activities.html'
)

$marker  = 'kidba_assets/css/dashboard-buttons.css'
$linkTag = '<link rel="stylesheet" href="/kidba_assets/css/dashboard-buttons.css">'
$anchor  = '<link rel="stylesheet" href="/kidba_assets/css/style.css">'

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "MISSING: $f"; continue }
  $content = Get-Content $f -Raw
  if ($content.Contains($marker)) { Write-Host "SKIP (already patched): $f"; continue }
  if (-not $content.Contains($anchor)) {
    Write-Host "ANCHOR not found in: $f (no style.css link); injecting before </head>"
    $content = $content -replace '</head>', "  $linkTag`n</head>"
  } else {
    $content = $content.Replace($anchor, "$anchor`n  $linkTag")
  }
  Set-Content -Path $f -Value $content -NoNewline -Encoding UTF8
  Write-Host "PATCHED: $f"
}
