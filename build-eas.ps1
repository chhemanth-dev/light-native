#!/usr/bin/env pwsh
# Build with EAS (Expo Application Services)
# Easier than local build, builds in the cloud

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Light Native - EAS Cloud Build" -ForegroundColor Cyan
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

Write-Host "🔑 Step 2: Checking EAS CLI..." -ForegroundColor Yellow
$easVersion = eas --version 2>$null
if (-not $easVersion) {
    Write-Host "⚠️  EAS CLI not installed. Installing now..." -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ EAS CLI ready (version: $easVersion)" -ForegroundColor Green
Write-Host ""

Write-Host "👤 Step 3: EAS Login..." -ForegroundColor Yellow
Write-Host "If not logged in, you'll be prompted for credentials" -ForegroundColor Cyan
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please log in to EAS..." -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Logged in to EAS" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 4: Starting cloud build..." -ForegroundColor Yellow
Write-Host "This will take 10-20 minutes (runs on Expo servers)" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Please wait for the build to complete..." -ForegroundColor Yellow
Write-Host "You'll get a download link when it's done!" -ForegroundColor Cyan
Write-Host ""

eas build --platform android --profile preview

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Network connection problems" -ForegroundColor White
    Write-Host "2. Expo account issues" -ForegroundColor White
    Write-Host "3. Configuration errors in eas.json" -ForegroundColor White
    Write-Host "4. Build quota exceeded (free tier has limits)" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   BUILD SUBMITTED! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Build is processing on Expo servers" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for build to complete (10-20 minutes)" -ForegroundColor White
Write-Host "2. Download APK from link provided above" -ForegroundColor White
Write-Host "3. Transfer APK to your Samsung A06 5G" -ForegroundColor White
Write-Host "4. Install and test!" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Check build status:" -ForegroundColor Cyan
Write-Host "   eas build:list" -ForegroundColor White
Write-Host ""
Write-Host "📚 Testing Guide: PHASE2_TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Build script complete!" -ForegroundColor Green
