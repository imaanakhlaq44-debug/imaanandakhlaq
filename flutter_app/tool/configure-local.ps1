$ErrorActionPreference = 'Stop'
$flutterRoot = Split-Path $PSScriptRoot -Parent
$projectRoot = Split-Path $flutterRoot -Parent
$envValues = @{}
Get-Content -LiteralPath (Join-Path $projectRoot '.env') | ForEach-Object {
  if ($_ -match '^\s*(VITE_FIREBASE_[A-Z_]+)\s*=\s*(.*)\s*$') { $envValues[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") }
}
$android = Get-Content -LiteralPath (Join-Path $projectRoot 'android/app/google-services.json') -Raw | ConvertFrom-Json
$client = $android.client | Where-Object { $_.client_info.android_client_info.package_name -eq 'com.imaanakhlaq' } | Select-Object -First 1
$config = @{
  FIREBASE_API_KEY = $envValues['VITE_FIREBASE_API_KEY']
  FIREBASE_PROJECT_ID = $android.project_info.project_id
  FIREBASE_MESSAGING_SENDER_ID = $android.project_info.project_number
  FIREBASE_STORAGE_BUCKET = $android.project_info.storage_bucket
  FIREBASE_AUTH_DOMAIN = $envValues['VITE_FIREBASE_AUTH_DOMAIN']
  FIREBASE_WEB_APP_ID = $envValues['VITE_FIREBASE_APP_ID']
  FIREBASE_ANDROID_APP_ID = $client.client_info.mobilesdk_app_id
}
foreach ($key in @('FIREBASE_API_KEY','FIREBASE_PROJECT_ID','FIREBASE_WEB_APP_ID','FIREBASE_ANDROID_APP_ID')) { if (-not $config[$key]) { throw "Missing Firebase client configuration: $key" } }
$configDir = Join-Path $flutterRoot 'config'
New-Item -ItemType Directory -Path $configDir -Force | Out-Null
$config | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $configDir 'firebase.local.json') -Encoding utf8
Write-Output 'Local Firebase client configuration prepared.'
