@echo off
chcp 65001 >nul
title Патчер Яндекс Музыки
color 0B
echo.
echo  ========================================================================
echo             МОДИФИКАТОР ОРИГИНАЛЬНОЙ ЯНДЕКС МУЗЫКИ (DESKTOP)             
echo  ========================================================================
echo.
echo  Запуск процесса модификации...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0patcher.ps1"

exit /b
