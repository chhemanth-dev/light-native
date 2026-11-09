#!/usr/bin/env pwsh
# Comprehensive fix and build script for Light Native App
# This script cleans, fixes, and rebuilds the Android app

Write-Host "🔧 Light Native - Fix and Build Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous builds
Write-Host "🧹 Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
    Write-Host "   ✅ Removed android/app/build" -ForegroundColor Green
}
if (Test-Path "android/build") {
    Remove-Item -Recurse -Force "android/build"
    Write-Host "   ✅ Removed android/build" -ForegroundColor Green
}
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "   ✅ Removed .expo cache" -ForegroundColor Green
}

Write-Host ""

# Step 2: Clean Gradle cache
Write-Host "🧹 Step 2: Cleaning Gradle..." -ForegroundColor Yellow
Set-Location android
try {
    .\gradlew clean --no-daemon
    Write-Host "   ✅ Gradle clean completed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Gradle clean failed (may not be critical)" -ForegroundColor DarkYellow
}
Set-Location ..

Write-Host ""

# Step 3: Clear npm cache (optional but recommended)
Write-Host "🧹 Step 3: Clearing package caches..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "   ✅ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  npm cache clean failed" -ForegroundColor DarkYellow
}

Write-Host ""

# Step 4: Reinstall dependencies
Write-Host "📦 Step 4: Reinstalling dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Run postinstall (patch-package)
Write-Host "🔧 Step 5: Applying patches..." -ForegroundColor Yellow
try {
    npm run postinstall
    Write-Host "   ✅ Patches applied" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Patch application failed (may not be critical)" -ForegroundColor DarkYellow
}

Write-Host ""

# Step 6: Pre-build expo
Write-Host "🏗️  Step 6: Running Expo prebuild..." -ForegroundColor Yellow
try {
    npx expo prebuild --clean
    Write-Host "   ✅ Expo prebuild completed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Expo prebuild had issues (continuing...)" -ForegroundColor DarkYellow
}

Write-Host ""

# Step 7: Build the app
Write-Host "🏗️  Step 7: Building Android app..." -ForegroundColor Yellow
Write-Host "   This may take several minutes..." -ForegroundColor Gray

try {
    npm run android
    Write-Host ""
    Write-Host "   ✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Try these steps:" -ForegroundColor Yellow
    Write-Host "   1. Check the error messages above" -ForegroundColor Gray
    Write-Host "   2. Make sure Android SDK is properly installed" -ForegroundColor Gray
    Write-Host "   3. Check that ANDROID_HOME environment variable is set" -ForegroundColor Gray
    Write-Host "   4. Try running: cd android && .\gradlew assembleDebug" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "🎉 All done! Your app should be building/running now." -ForegroundColor Green
Write-Host ""
Write-Host "📱 If the app doesn't install automatically, run:" -ForegroundColor Cyan
Write-Host "   adb install android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Gray
Write-Host ""
