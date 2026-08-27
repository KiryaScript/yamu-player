# ==============================================================================
# Yandex Music Restore Original
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Восстановление оригинальной Яндекс Музыки"

Clear-Host
Write-Host "==============================================================================" -ForegroundColor DarkYellow
Write-Host "             ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОЙ ЯНДЕКС МУЗЫКИ                        " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor DarkYellow
Write-Host ""

# 1. Close active Yandex Music processes
$runningProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*Яндекс*Музыка*" -or 
    $_.ProcessName -like "*YandexMusic*" -or
    $_.ProcessName -like "*yamusic*"
}

if ($runningProcesses) {
    Write-Host "[!] Обнаружено запущенное приложение Яндекс Музыка. Закрываем..." -ForegroundColor Yellow
    foreach ($proc in $runningProcesses) {
        try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
    Start-Sleep -Seconds 1
}

# 2. Locate installation path
$searchPaths = @(
    "$env:LOCALAPPDATA\Programs\YandexMusic",
    "$env:LOCALAPPDATA\Programs\yandexmusic",
    "$env:LOCALAPPDATA\YandexMusic",
    "$env:APPDATA\YandexMusic",
    "$env:ProgramFiles\YandexMusic",
    "${env:ProgramFiles(x86)}\YandexMusic",
    "$env:LOCALAPPDATA\Programs\Yandex\YandexMusic"
)

$targetDir = $null
foreach ($path in $searchPaths) {
    if ((Test-Path $path) -and (Test-Path (Join-Path $path "resources\app.asar.original.bak"))) {
        $targetDir = $path
        break
    }
}

if (-not $targetDir) {
    foreach ($path in $searchPaths) {
        if ((Test-Path $path) -and (Test-Path (Join-Path $path "resources\app.asar"))) {
            $targetDir = $path
            break
        }
    }
}

while (-not $targetDir -or -not (Test-Path $targetDir)) {
    Write-Host "[!] Не удалось автоматически определить путь установки." -ForegroundColor Yellow
    $targetDir = Read-Host "Введите путь к папке Яндекс Музыки"
}

$asarBak = Join-Path $targetDir "resources\app.asar.original.bak"
$targetAsar = Join-Path $targetDir "resources\app.asar"

$exeFile = Get-ChildItem -Path $targetDir -Filter "*.exe" | Where-Object { $_.Name -notlike "*Uninstall*" -and $_.Name -notlike "*elevate*" } | Select-Object -First 1
$exeBak = Join-Path $targetDir "$($exeFile.Name).original.bak"

if (Test-Path $asarBak) {
    Copy-Item $asarBak -Destination $targetAsar -Force
    Write-Host "[✓] Оригинальный app.asar успешно восстановлен." -ForegroundColor Green
} else {
    Write-Host "[-] Резервная копия app.asar.original.bak не найдена!" -ForegroundColor Red
}

if (Test-Path $exeBak) {
    Copy-Item $exeBak -Destination $exeFile.FullName -Force
    Write-Host "[✓] Оригинальный исполняемый файл успешно восстановлен." -ForegroundColor Green
} else {
    Write-Host "[-] Резервная копия exe.original.bak не найдена!" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor DarkYellow
Write-Host "         [✓] ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОЙ ВЕРСИИ ЗАВЕРШЕНО!                    " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor DarkYellow
Write-Host ""
Pause
