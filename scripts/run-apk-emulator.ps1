param(
  [string]$PackageId = "com.imaanakhlaq.app",
  [string]$PreferredAvd = "copilot_api25",
  [string]$ApkPath = "android\app\build\outputs\apk\debug\app-debug.apk",
  [switch]$Install
)

$ErrorActionPreference = "Stop"

function Add-PathIfExists {
  param([string]$PathToAdd)
  if (Test-Path $PathToAdd) {
    $parts = $env:Path -split ";"
    if (-not ($parts -contains $PathToAdd)) {
      $env:Path = "$PathToAdd;$env:Path"
    }
    return $true
  }
  return $false
}

function Get-OnlineEmulatorSerial {
  $lines = adb devices
  foreach ($line in $lines) {
    if ($line -match "^(emulator-\d+)\s+device$") {
      return $Matches[1]
    }
  }
  return $null
}

$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$platformTools = Join-Path $sdkRoot "platform-tools"
$emulatorDir = Join-Path $sdkRoot "emulator"

if (-not (Test-Path $platformTools)) {
  throw "Android platform-tools not found at $platformTools"
}
if (-not (Test-Path $emulatorDir)) {
  throw "Android emulator not found at $emulatorDir"
}

$env:ANDROID_HOME = $sdkRoot
Add-PathIfExists -PathToAdd $platformTools | Out-Null
Add-PathIfExists -PathToAdd $emulatorDir | Out-Null

$serial = Get-OnlineEmulatorSerial
if (-not $serial) {
  $avds = @(emulator -list-avds)
  if ($avds.Count -eq 0) {
    throw "No Android AVD found. Create one in Android Studio first."
  }

  $selectedAvd = if ($avds -contains $PreferredAvd) { $PreferredAvd } else { $avds[0] }
  Write-Host "Starting AVD: $selectedAvd"
  Start-Process -FilePath (Join-Path $emulatorDir "emulator.exe") -ArgumentList "-avd", $selectedAvd, "-no-snapshot", "-gpu", "swiftshader_indirect" | Out-Null
  adb wait-for-device | Out-Null
  $serial = Get-OnlineEmulatorSerial
}

if (-not $serial) {
  throw "Emulator is not ready."
}

# Wait until Android system services are fully up (sys.boot_completed=1).
Write-Host "Waiting for system boot to complete..."
$bootDeadline = (Get-Date).AddMinutes(5)
while ($true) {
  $booted = (adb -s $serial shell getprop sys.boot_completed 2>$null)
  if ($booted) { $booted = $booted.Trim() }
  if ($booted -eq "1") { break }
  if ((Get-Date) -gt $bootDeadline) { throw "Timed out waiting for emulator boot." }
  Start-Sleep -Seconds 2
}
Write-Host "Boot complete."

try {
  $wshell = New-Object -ComObject WScript.Shell
  $null = $wshell.AppActivate("Android Emulator")
} catch {
  # If window activation is blocked by OS focus rules, launch still proceeds.
}

adb -s $serial shell input keyevent KEYCODE_WAKEUP | Out-Null
adb -s $serial shell wm dismiss-keyguard | Out-Null

# Auto-install APK if missing or if -Install was passed.
$installedLine = adb -s $serial shell pm list packages $PackageId
$isInstalled = ($installedLine -match [regex]::Escape($PackageId))
if ($Install -or -not $isInstalled) {
  if (-not (Test-Path $ApkPath)) { throw "APK not found at $ApkPath" }
  Write-Host "Installing $ApkPath ..."
  adb -s $serial install -r -t $ApkPath
}

adb -s $serial shell am start -n "$PackageId/.MainActivity" | Out-Null

$pidRaw = adb -s $serial shell pidof $PackageId
$appPid = if ($pidRaw) { ([string]$pidRaw).Trim() } else { "" }
$focusLines = adb -s $serial shell dumpsys window | Select-String -Pattern "mCurrentFocus|mFocusedApp|$PackageId"

Write-Host ""
Write-Host "APK launch completed"
Write-Host "Serial: $serial"
Write-Host "Package: $PackageId"
if ($appPid) {
  Write-Host "PID: $appPid"
} else {
  Write-Host "PID: not found"
}
Write-Host "Focus:"
$focusLines | ForEach-Object { Write-Host $_.Line }
