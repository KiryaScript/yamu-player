@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\patcher.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    pause
)
