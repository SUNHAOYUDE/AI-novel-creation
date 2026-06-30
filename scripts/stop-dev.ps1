$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $rootDir ".runtime"
$runtimeFile = Join-Path $runtimeDir "dev-processes.json"

if (-not (Test-Path $runtimeFile)) {
  Write-Host "No running development process record found." -ForegroundColor Yellow
  exit 0
}

$processInfo = Get-Content -Path $runtimeFile -Raw | ConvertFrom-Json
$pidList = @()

if ($processInfo.frontend.pid) {
  $pidList += [int]$processInfo.frontend.pid
}

if ($processInfo.backend.pid) {
  $pidList += [int]$processInfo.backend.pid
}

foreach ($processId in $pidList) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

  if ($process) {
    Stop-Process -Id $processId -Force
    Write-Host "Stopped process PID=$processId" -ForegroundColor Green
  }
  else {
    Write-Host "Process PID=$processId does not exist, skipped." -ForegroundColor DarkGray
  }
}

Remove-Item -Path $runtimeFile -Force -ErrorAction SilentlyContinue
Write-Host "Development runtime record cleaned." -ForegroundColor Green
