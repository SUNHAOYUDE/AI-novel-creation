@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\stop-dev.ps1"
pause
