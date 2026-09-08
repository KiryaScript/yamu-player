@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\restore.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    pause
)
