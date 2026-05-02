$ErrorActionPreference = 'Stop'
$zipPath = Join-Path $PSScriptRoot '..\imaan_hostinger.zip'
$zipPath = (Resolve-Path $zipPath).Path

$info = Get-Item $zipPath
Write-Host ("ZIP: {0}  Size: {1} MB  Modified: {2}" -f $info.Name, [math]::Round($info.Length/1MB,2), $info.LastWriteTime)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Host ("ENTRIES: {0}" -f $zip.Entries.Count)

function Read-Entry($entry) {
  $sr = New-Object System.IO.StreamReader($entry.Open())
  $t = $sr.ReadToEnd(); $sr.Close(); return $t
}

# Auth checks
$au = $zip.Entries | Where-Object { $_.FullName -like '*auth.html' } | Select-Object -First 1
if ($au) {
  $a = Read-Entry $au
  Write-Host ("AUTH_LEN: {0}" -f $a.Length)
  $needle = 'type="button" class="pw-toggle"'
  $cnt = 0; $i = 0
  while (($i = $a.IndexOf($needle, $i)) -ge 0) { $cnt++; $i++ }
  Write-Host ("AUTH_TYPE_BUTTON_COUNT: {0}  (expect >= 6)" -f $cnt)
  $loginOk = [regex]::IsMatch($a, 'id="loginPw"[^>]*placeholder="Enter your password"')
  Write-Host ("LOGIN_PW_PLACEHOLDER_OK: {0}" -f $loginOk)
  Write-Host ("AUTH_HAS_APK_MARKER: {0}  (expect False)" -f $a.Contains('APK_AUTH_SUPER_ADMIN_REDIRECT'))
  Write-Host ("AUTH_HAS_super_admin_word: {0}" -f $a.Contains('super_admin'))
}

foreach ($name in @('admin-dashboard.html','teacher-dashboard.html','parent-dashboard.html','super-admin-dashboard.html','student-activities.html')) {
  $e = $zip.Entries | Where-Object { $_.FullName -like "*$name" } | Select-Object -First 1
  if ($e) {
    $cc = Read-Entry $e
    $hasMarker = [regex]::IsMatch($cc, 'APK_[A-Z_]+_(COMPACT|BRAND|SHIM|REDIRECT|ROUTES)')
    Write-Host ("{0} | len={1} | hasAPKMarker={2}" -f $name, $cc.Length, $hasMarker)
  } else { Write-Host ("{0} | MISSING_FROM_ZIP" -f $name) }
}
$zip.Dispose()
