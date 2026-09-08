# ==============================================================================
# Yandex Music Desktop Patcher
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Модификатор Яндекс Музыки (Desktop)"

function Show-Banner {
    Clear-Host
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "             МОДИФИКАТОР ОРИГИНАЛЬНОЙ ЯНДЕКС МУЗЫКИ (DESKTOP)                 " -ForegroundColor Cyan
    Write-Host " [★] AMOLED Тема (#000000)          [★] Discord Rich Presence" -ForegroundColor Yellow
    Write-Host " [★] Скачивание (FLAC / 320 kbps)   [★] Быстрое скачивание (Ctrl + D)" -ForegroundColor Yellow
    Write-Host " [★] Перенос музыки (пачками по 50) [★] Экспорт списков (TXT, CSV, M3U8)" -ForegroundColor Yellow
    Write-Host " [★] Zero Telemetry (Анти-бан)      [★] Отключение рекламы и ограничений" -ForegroundColor Yellow
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

Show-Banner

# 1. Close active Yandex Music processes
$runningProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*Яндекс*Музыка*" -or 
    $_.ProcessName -like "*YandexMusic*" -or
    $_.ProcessName -like "*yamusic*"
}

if ($runningProcesses) {
    Write-Host "[!] Обнаружено запущенное приложение Яндекс Музыка." -ForegroundColor Yellow
    Write-Host "[...] Закрываем процессы для безопасной модификации..." -ForegroundColor DarkGray
    foreach ($proc in $runningProcesses) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    Start-Sleep -Seconds 1
    Write-Host "[✓] Процессы остановлены." -ForegroundColor Green
    Write-Host ""
}

# 2. Locate Yandex Music Installation Path
Write-Host "[1/4] Поиск установленного приложения Яндекс Музыка..." -ForegroundColor Cyan

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
    if ((Test-Path $path) -and (Test-Path (Join-Path $path "resources\app.asar"))) {
        $targetDir = $path
        break
    }
}

# If not found in standard paths, search Registry
if (-not $targetDir) {
    $regPaths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )
    foreach ($rp in $regPaths) {
        $installed = Get-ItemProperty $rp -ErrorAction SilentlyContinue | Where-Object {
            ($_.DisplayName -like "*Yandex*Music*" -or $_.DisplayName -like "*Яндекс*Музык*") -and $_.InstallLocation
        }
        if ($installed -and (Test-Path (Join-Path $installed.InstallLocation "resources\app.asar"))) {
            $targetDir = $installed.InstallLocation
            break
        }
    }
}

# If still not found, check Desktop Shortcuts
if (-not $targetDir) {
    try {
        $wsh = New-Object -ComObject WScript.Shell
        $desktopLnk = Get-ChildItem "$env:USERPROFILE\Desktop\*.lnk", "$env:PUBLIC\Desktop\*.lnk" -ErrorAction SilentlyContinue
        foreach ($lnk in $desktopLnk) {
            $target = $wsh.CreateShortcut($lnk.FullName).TargetPath
            if ($target -and (Test-Path $target) -and ($target -like "*YandexMusic*.exe" -or $target -like "*Музыка*.exe")) {
                $dir = Split-Path -Parent $target
                if (Test-Path (Join-Path $dir "resources\app.asar")) {
                    $targetDir = $dir
                    break
                }
            }
        }
    } catch {}
}

# Prompt user if auto-detection failed
while (-not $targetDir -or -not (Test-Path (Join-Path $targetDir "resources\app.asar"))) {
    Write-Host "[!] Не удалось автоматически определить путь установки." -ForegroundColor Yellow
    $userPath = Read-Host "Пожалуйста, введите путь к папке Яндекс Музыки (например C:\Users\<Имя>\AppData\Local\Programs\YandexMusic)"
    if ($userPath -and (Test-Path (Join-Path $userPath "resources\app.asar"))) {
        $targetDir = $userPath
    } else {
        Write-Host "[-] По указанному пути не найден resources\app.asar. Попробуйте снова." -ForegroundColor Red
    }
}

Write-Host "[✓] Приложение найдено: $targetDir" -ForegroundColor Green
Write-Host ""

# Find main executable
$exeFile = Get-ChildItem -Path $targetDir -Filter "*.exe" | Where-Object { $_.Name -notlike "*Uninstall*" -and $_.Name -notlike "*elevate*" } | Select-Object -First 1

if (-not $exeFile) {
    Write-Host "[-] Ошибка: Исполняемый файл .exe не найден в $targetDir!" -ForegroundColor Red
    Pause
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
$newAsarPath = Join-Path $scriptDir "data\app.asar"
$targetAsarPath = Join-Path $targetDir "resources\app.asar"

if (-not (Test-Path $newAsarPath)) {
    Write-Host "[-] Ошибка: Файл модификации data\app.asar не найден рядом со скриптом!" -ForegroundColor Red
    Pause
    exit 1
}

# 3. Create Backups
Write-Host "[2/4] Создание резервной копии оригинальных файлов..." -ForegroundColor Cyan

$asarBak = Join-Path $targetDir "resources\app.asar.original.bak"
$exeBak = Join-Path $targetDir "$($exeFile.Name).original.bak"

if (-not (Test-Path $asarBak)) {
    Copy-Item $targetAsarPath -Destination $asarBak -Force
    Write-Host "    [+] Создан бэкап: app.asar.original.bak" -ForegroundColor DarkGray
} else {
    Write-Host "    [i] Бэкап app.asar.original.bak уже существует." -ForegroundColor DarkGray
}

if (-not (Test-Path $exeBak)) {
    Copy-Item $exeFile.FullName -Destination $exeBak -Force
    Write-Host "    [+] Создан бэкап: $($exeFile.Name).original.bak" -ForegroundColor DarkGray
} else {
    Write-Host "    [i] Бэкап $($exeFile.Name).original.bak уже существует." -ForegroundColor DarkGray
}

Write-Host "[✓] Резервные копии сохранены." -ForegroundColor Green
Write-Host ""

# 4. Copy New Mod Asar
Write-Host "[3/4] Установка компонентов модификации..." -ForegroundColor Cyan
Copy-Item $newAsarPath -Destination $targetAsarPath -Force
Write-Host "[✓] Модифицированный модуль успешно установлен." -ForegroundColor Green
Write-Host ""

# 5. Patch ASAR Integrity Hash in Executable
Write-Host "[4/4] Патчинг цифровой подписи ASAR Integrity..." -ForegroundColor Cyan

$csharpCode = @"
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

public class AsarIntegrityPatcher {
    public static string ComputeHeaderHash(string asarPath) {
        using (FileStream fs = new FileStream(asarPath, FileMode.Open, FileAccess.Read, FileShare.Read)) {
            byte[] headerLenBytes = new byte[16];
            fs.Read(headerLenBytes, 0, 16);
            uint jsonSize = BitConverter.ToUInt32(headerLenBytes, 12);
            
            byte[] jsonBytes = new byte[jsonSize];
            fs.Read(jsonBytes, 0, (int)jsonSize);
            
            using (SHA256 sha256 = SHA256.Create()) {
                byte[] hashBytes = sha256.ComputeHash(jsonBytes);
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hashBytes) {
                    sb.Append(b.ToString("x2"));
                }
                return sb.ToString();
            }
        }
    }

    public static bool PatchExe(string exePath, string newHash) {
        byte[] exeBytes = File.ReadAllBytes(exePath);
        byte[] tagBytes = Encoding.UTF8.GetBytes("resources\\\\app.asar\",\"alg\":\"SHA256\",\"value\":\"");
        
        int matchIdx = -1;
        for (int i = 0; i <= exeBytes.Length - tagBytes.Length - 64; i++) {
            bool match = true;
            for (int j = 0; j < tagBytes.Length; j++) {
                if (exeBytes[i + j] != tagBytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matchIdx = i;
                break;
            }
        }
        
        if (matchIdx == -1) {
            return false;
        }
        
        int hashStart = matchIdx + tagBytes.Length;
        byte[] newHashBytes = Encoding.UTF8.GetBytes(newHash);
        Array.Copy(newHashBytes, 0, exeBytes, hashStart, 64);
        
        File.WriteAllBytes(exePath, exeBytes);
        return true;
    }
}
"@

try {
    Add-Type -TypeDefinition $csharpCode -Language CSharp
} catch {}

$newHash = [AsarIntegrityPatcher]::ComputeHeaderHash($targetAsarPath)
Write-Host "    [i] Новый хэш заголовка ASAR: $newHash" -ForegroundColor DarkGray

$isPatched = [AsarIntegrityPatcher]::PatchExe($exeFile.FullName, $newHash)

if ($isPatched) {
    Write-Host "[✓] Исполняемый файл успешно пропатчен." -ForegroundColor Green
} else {
    Write-Host "[!] Предупреждение: Тег подписи не найден (возможно, в этой версии отключен ASAR Integrity). Приложение должно работать штатно." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "          [✓] МОДИФИКАЦИЯ УСПЕШНО ЗАВЕРШЕНА! ВСЁ ГОТОВО!                      " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Теперь вы можете запускать Яндекс Музыку как обычно по иконке на рабочем столе!" -ForegroundColor White
Write-Host "Все ваши треки, плейлисты, Discord RPC, AMOLED тема и скачивание активны." -ForegroundColor White
Write-Host ""

$launch = Read-Host "Запустить Яндекс Музыку прямо сейчас? (Y/n)"
if ($launch -ne 'n' -and $launch -ne 'N') {
    Start-Process $exeFile.FullName
    Write-Host "[✓] Яндекс Музыка запущена." -ForegroundColor Green
}

Start-Sleep -Seconds 2
