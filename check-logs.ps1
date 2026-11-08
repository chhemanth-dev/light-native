# PowerShell script to capture Android logs from the Light Native app
# Run this AFTER installing and launching the APK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Light Native App Log Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if adb is available
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "ERROR: adb (Android Debug Bridge) is not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Platform-Tools and add to PATH" -ForegroundColor Yellow
    Write-Host "Download: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ adb found at: $($adbPath.Source)" -ForegroundColor Green
Write-Host ""

# Check for connected devices
Write-Host "Checking for connected devices..." -ForegroundColor Cyan
$devices = adb devices | Select-String -Pattern "device$"
if ($devices.Count -eq 0) {
    Write-Host "ERROR: No Android devices found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please connect your Android device via USB and enable USB Debugging" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found $($devices.Count) device(s)" -ForegroundColor Green
Write-Host ""

# Clear previous logs
Write-Host "Clearing previous logs..." -ForegroundColor Cyan
adb logcat -c
Write-Host "✓ Logs cleared" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Please INSTALL and LAUNCH the app NOW" -ForegroundColor Yellow  
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting 5 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Capture logs
Write-Host ""
Write-Host "Capturing logs (Press Ctrl+C to stop)..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Filter for relevant logs
adb logcat | Select-String -Pattern "LightApp|ReactNative|ExoModules|TurboModule|FATAL|AndroidRuntime"
