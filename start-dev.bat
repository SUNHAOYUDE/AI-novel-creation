@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\scripts\start-dev.ps1"
pause
