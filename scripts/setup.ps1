$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $rootDir "frontend"
$backendDir = Join-Path $rootDir "backend"
$backendEnv = Join-Path $backendDir ".env"
$backendEnvExample = Join-Path $backendDir ".env.example"

function Write-DebugStep {
  param (
    [string]$Message
  )

  Write-Host "[debug][setup] $Message" -ForegroundColor DarkCyan
}

function Ensure-Npm {
  Write-DebugStep "Checking npm command"
  $npmCommand = Get-Command npm -ErrorAction SilentlyContinue

  if (-not $npmCommand) {
    throw "npm not found. Please install Node.js first."
  }

  Write-DebugStep "npm detected: $($npmCommand.Source)"
}

function Ensure-Dependencies {
  param (
    [string]$ProjectDir,
    [string]$ProjectName
  )

  $nodeModulesDir = Join-Path $ProjectDir "node_modules"
  $packageJsonPath = Join-Path $ProjectDir "package.json"
  $packageLockPath = Join-Path $ProjectDir "package-lock.json"
  Write-DebugStep "Checking node_modules: $nodeModulesDir"

  $shouldInstall = -not (Test-Path $nodeModulesDir)

  if (-not $shouldInstall -and (Test-Path $packageJsonPath)) {
    $nodeModulesTime = (Get-Item $nodeModulesDir).LastWriteTimeUtc
    $packageJsonTime = (Get-Item $packageJsonPath).LastWriteTimeUtc

    if ($packageJsonTime -gt $nodeModulesTime) {
      $shouldInstall = $true
      Write-DebugStep "package.json is newer than node_modules, install required"
    }
  }

  if (-not $shouldInstall -and (Test-Path $packageLockPath)) {
    $nodeModulesTime = (Get-Item $nodeModulesDir).LastWriteTimeUtc
    $packageLockTime = (Get-Item $packageLockPath).LastWriteTimeUtc

    if ($packageLockTime -gt $nodeModulesTime) {
      $shouldInstall = $true
      Write-DebugStep "package-lock.json is newer than node_modules, install required"
    }
  }

  if ($shouldInstall) {
    Write-Host "[$ProjectName] Installing dependencies..." -ForegroundColor Cyan
    Push-Location $ProjectDir
    try {
      Write-DebugStep "Running npm install in: $ProjectDir"
      npm install
      Write-DebugStep "npm install finished: $ProjectName"
    }
    finally {
      Pop-Location
      Write-DebugStep "Returned to root directory"
    }
  }
  else {
    Write-Host "[$ProjectName] node_modules already exists, skipping install." -ForegroundColor DarkGray
    Write-DebugStep "Skipped install because node_modules exists: $nodeModulesDir"
  }
}

function Ensure-BackendDatabase {
  param (
    [string]$BackendDir
  )

  $backendEnvPath = Join-Path $BackendDir ".env"

  if (-not (Test-Path $backendEnvPath)) {
    Write-DebugStep "Skip prisma db push because backend .env is missing"
    return
  }

  Write-Host "[backend] Syncing database schema..." -ForegroundColor Cyan
  Push-Location $BackendDir
  try {
    Write-DebugStep "Running prisma generate in: $BackendDir"
    npx prisma generate
    Write-DebugStep "prisma generate finished"
    Write-DebugStep "Running prisma db push in: $BackendDir"
    npx prisma db push --skip-generate
    Write-DebugStep "prisma db push finished"
  }
  finally {
    Pop-Location
    Write-DebugStep "Returned to root directory"
  }
}

Write-DebugStep "rootDir=$rootDir"
Write-DebugStep "frontendDir=$frontendDir"
Write-DebugStep "backendDir=$backendDir"

Ensure-Npm

if ((Test-Path $backendEnvExample) -and -not (Test-Path $backendEnv)) {
  Write-DebugStep ".env.example found and .env missing, copying file"
  Copy-Item $backendEnvExample $backendEnv
  Write-Host "[backend] .env file created automatically." -ForegroundColor Green
  Write-DebugStep ".env file created: $backendEnv"
}
else {
  Write-DebugStep ".env init skipped, file may already exist or .env.example is missing"
}

Ensure-Dependencies -ProjectDir $frontendDir -ProjectName "frontend"
Ensure-Dependencies -ProjectDir $backendDir -ProjectName "backend"
Ensure-BackendDatabase -BackendDir $backendDir

Write-Host "Dependency check completed." -ForegroundColor Green
Write-DebugStep "setup.ps1 finished"
