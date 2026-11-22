#!/usr/bin/env pwsh
# Build Release APK for Light Native
# Run this script to build the production-ready APK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Light Native - Release Build" -ForegroundColor Cyan
Write-Host "   Phase 2 Complete Edition" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🧹 Step 2: Cleaning previous builds..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Clean failed, continuing anyway..." -ForegroundColor Yellow
}
Write-Host "✅ Clean complete" -ForegroundColor Green
Write-Host ""

Write-Host "🔨 Step 3: Building release APK..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Cyan
.\gradlew.bat assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Check Android SDK is installed" -ForegroundColor White
    Write-Host "2. Check ANDROID_HOME environment variable" -ForegroundColor White
    Write-Host "3. Check Java JDK is installed (version 17)" -ForegroundColor White
    Write-Host "4. Try running: .\gradlew.bat --stacktrace assembleRelease" -ForegroundColor White
    cd ..
    exit 1
}
cd ..
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "   BUILD COMPLETE! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "📱 APK Location:" -ForegroundColor Cyan
    Write-Host "   $apkPath" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 APK Size: $($apkSize.ToString('0.00')) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Connect your Samsung A06 5G via USB" -ForegroundColor White
    Write-Host "2. Enable USB debugging on phone" -ForegroundColor White
    Write-Host "3. Run: adb install $apkPath" -ForegroundColor White
    Write-Host "   OR copy APK to phone and install manually" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Testing Guide: PHASE2_TESTING_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  APK file not found at expected location!" -ForegroundColor Yellow
    Write-Host "Check android\app\build\outputs\apk\ for APK files" -ForegroundColor White
}

Write-Host "✨ Build script complete!" -ForegroundColor Green
