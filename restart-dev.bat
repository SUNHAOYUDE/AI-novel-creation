@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\restart-dev.ps1"
pause
