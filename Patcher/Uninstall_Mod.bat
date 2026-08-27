@echo off
chcp 65001 >nul
title Восстановление оригинала
color 0E
echo.
echo  ========================================================================
echo             ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОЙ ЯНДЕКС МУЗЫКИ                    
echo  ========================================================================
echo.
echo  Запуск процесса восстановления...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore.ps1"

exit /b
