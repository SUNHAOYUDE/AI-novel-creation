$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start-dev.ps1"
$stopScript = Join-Path $PSScriptRoot "stop-dev.ps1"

Write-Host "Stopping previous development processes..." -ForegroundColor Yellow
& $stopScript

Start-Sleep -Seconds 1

Write-Host "Restarting development environment..." -ForegroundColor Cyan
& $startScript
