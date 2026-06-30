$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $rootDir ".runtime"
$runtimeFile = Join-Path $runtimeDir "dev-processes.json"
$frontendLogFile = Join-Path $runtimeDir "frontend.log"
$backendLogFile = Join-Path $runtimeDir "backend.log"
$backendStdoutLogFile = Join-Path $runtimeDir "backend.stdout.log"
$backendStderrLogFile = Join-Path $runtimeDir "backend.stderr.log"
$statusLogFile = Join-Path $runtimeDir "startup-status.log"
$setupScript = Join-Path $PSScriptRoot "setup.ps1"
$stopScript = Join-Path $PSScriptRoot "stop-dev.ps1"
$frontendDir = Join-Path $rootDir "frontend"
$backendDir = Join-Path $rootDir "backend"

function Write-DebugStep {
  param (
    [string]$Message
  )

  Write-Host "[debug][start] $Message" -ForegroundColor DarkCyan
}

Write-DebugStep "rootDir=$rootDir"
Write-DebugStep "runtimeDir=$runtimeDir"
Write-DebugStep "runtimeFile=$runtimeFile"
Write-DebugStep "frontendLogFile=$frontendLogFile"
Write-DebugStep "backendLogFile=$backendLogFile"
Write-DebugStep "backendStdoutLogFile=$backendStdoutLogFile"
Write-DebugStep "backendStderrLogFile=$backendStderrLogFile"
Write-DebugStep "statusLogFile=$statusLogFile"
Write-DebugStep "frontendDir=$frontendDir"
Write-DebugStep "backendDir=$backendDir"

if (-not (Test-Path $runtimeDir)) {
  Write-DebugStep "Creating runtime directory"
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
}

Set-Content -Path $frontendLogFile -Value "=== frontend startup log $(Get-Date -Format s) ===" -Encoding UTF8
Set-Content -Path $backendLogFile -Value "=== backend startup log $(Get-Date -Format s) ===" -Encoding UTF8
Set-Content -Path $backendStdoutLogFile -Value "" -Encoding UTF8
Set-Content -Path $backendStderrLogFile -Value "" -Encoding UTF8
Set-Content -Path $statusLogFile -Value "=== startup status log $(Get-Date -Format s) ===" -Encoding UTF8

if (Test-Path $runtimeFile) {
  Write-Host "Previous runtime record found, stopping old processes first..." -ForegroundColor Yellow
  Write-DebugStep "Found previous runtimeFile, calling stop-dev.ps1"
  & $stopScript | Out-Null
  Write-DebugStep "stop-dev.ps1 finished"
}

Write-Host "Preparing startup environment..." -ForegroundColor Cyan
Write-DebugStep "Calling setup.ps1"
& $setupScript
Write-DebugStep "setup.ps1 finished"

$frontendCommand = "Set-Location -Path '$frontendDir'; npm run dev *>> '$frontendLogFile'"
$backendCommand = "Set-Location -Path '$backendDir'; npm run start:dev"
Write-DebugStep "frontendCommand=$frontendCommand"
Write-DebugStep "backendCommand=$backendCommand"

Write-Host "Starting backend service..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand -RedirectStandardOutput $backendStdoutLogFile -RedirectStandardError $backendStderrLogFile -PassThru
Write-DebugStep "Backend process started, PID=$($backendProcess.Id)"

Start-Sleep -Seconds 1

Write-Host "Starting frontend service..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand -PassThru
Write-DebugStep "Frontend process started, PID=$($frontendProcess.Id)"

Start-Sleep -Seconds 2

$backendAlive = $null -ne (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue)
$frontendAlive = $null -ne (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue)
$backendHttp = $false
$backendHttpMessage = ""
$backendProbeHistory = @()
$mysqlPortOpen = $false
$port3000OwnerPids = @()

try {
  $mysqlPortOpen = Test-NetConnection -ComputerName "localhost" -Port 3306 -InformationLevel Quiet
}
catch {
  $mysqlPortOpen = $false
}

try {
  $port3000OwnerPids = @(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
}
catch {
  $port3000OwnerPids = @()
}

for ($attempt = 1; $attempt -le 3; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/books" -UseBasicParsing -TimeoutSec 3
    $backendHttp = $true
    $backendHttpMessage = "HTTP $($response.StatusCode)"
    $backendProbeHistory += "attempt${attempt}=HTTP $($response.StatusCode)"
    break
  }
  catch {
    $backendHttpMessage = $_.Exception.Message
    $backendProbeHistory += "attempt${attempt}=$backendHttpMessage"
    Start-Sleep -Seconds 2
  }
}

Add-Content -Path $statusLogFile -Value "backendPid=$($backendProcess.Id)"
Add-Content -Path $statusLogFile -Value "frontendPid=$($frontendProcess.Id)"
Add-Content -Path $statusLogFile -Value "backendAlive=$backendAlive"
Add-Content -Path $statusLogFile -Value "frontendAlive=$frontendAlive"
Add-Content -Path $statusLogFile -Value "mysqlPortOpen=$mysqlPortOpen"
Add-Content -Path $statusLogFile -Value "port3000OwnerPids=$($port3000OwnerPids -join ',')"
Add-Content -Path $statusLogFile -Value "backendHttp=$backendHttp"
Add-Content -Path $statusLogFile -Value "backendHttpMessage=$backendHttpMessage"
Add-Content -Path $statusLogFile -Value "backendProbeHistory=$($backendProbeHistory -join ' | ')"

$processInfo = [ordered]@{
  frontend = [ordered]@{
    pid = $frontendProcess.Id
    path = $frontendDir
    url = "http://localhost:5173"
  }
  backend = [ordered]@{
    pid = $backendProcess.Id
    path = $backendDir
    url = "http://localhost:3000/api"
  }
  startedAt = (Get-Date).ToString("s")
}

$processInfo | ConvertTo-Json -Depth 4 | Set-Content -Path $runtimeFile -Encoding UTF8
Write-DebugStep "Runtime process info saved to: $runtimeFile"

Write-Host ""
Write-Host "Startup commands have been sent." -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend URL: http://localhost:3000/api" -ForegroundColor Green
Write-Host "Runtime file: $runtimeFile" -ForegroundColor DarkGray
Write-Host "Frontend log: $frontendLogFile" -ForegroundColor DarkGray
Write-Host "Backend log: $backendLogFile" -ForegroundColor DarkGray
Write-Host "Backend stdout log: $backendStdoutLogFile" -ForegroundColor DarkGray
Write-Host "Backend stderr log: $backendStderrLogFile" -ForegroundColor DarkGray
Write-Host "Status log: $statusLogFile" -ForegroundColor DarkGray
Write-Host ""
Write-Host "If this is the first launch, wait for dependency installation to finish." -ForegroundColor DarkGray
Write-DebugStep "start-dev.ps1 finished"
