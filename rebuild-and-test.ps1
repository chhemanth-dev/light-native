#!/usr/bin/env pwsh
# Quick rebuild and test script for Light Native App

Write-Host "🔧 Light Native - Rebuild & Test Instagram Fix" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "android/app/build"
Write-Host "   ✅ Clean complete" -ForegroundColor Green
Write-Host ""

# Step 2: Rebuild
Write-Host "🏗️  Building app with new native code..." -ForegroundColor Yellow
Write-Host "   This will take a few minutes..." -ForegroundColor Gray
Write-Host ""

try {
    npm run android
    Write-Host ""
    Write-Host "   ✅ Build complete!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing Instagram detection..." -ForegroundColor Yellow
Write-Host ""

# Step 3: Test if Instagram is installed
Write-Host "📱 Checking if Instagram is installed on device..." -ForegroundColor Cyan
$instagramInstalled = adb shell pm list packages | Select-String "com.instagram.android"

if ($instagramInstalled) {
    Write-Host "   ✅ Instagram IS installed on device" -ForegroundColor Green
    Write-Host "   Package: $instagramInstalled" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Instagram is NOT installed on device" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 To fix this:" -ForegroundColor Yellow
    Write-Host "   1. Open Play Store on your device" -ForegroundColor Gray
    Write-Host "   2. Search for 'Instagram'" -ForegroundColor Gray
    Write-Host "   3. Install it" -ForegroundColor Gray
    Write-Host "   4. Run this script again" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Other installed messaging apps:" -ForegroundColor Cyan

$apps = @(
    "com.whatsapp|WhatsApp",
    "com.google.android.gm|Gmail",
    "org.telegram.messenger|Telegram",
    "com.snapchat.android|Snapchat",
    "com.facebook.orca|Messenger",
    "com.twitter.android|Twitter",
    "com.discord|Discord",
    "com.slack|Slack"
)

foreach ($app in $apps) {
    $parts = $app -split '\|'
    $package = $parts[0]
    $name = $parts[1]
    
    $installed = adb shell pm list packages | Select-String $package
    if ($installed) {
        Write-Host "   ✅ $name" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $name" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "🎉 Done! Your app should now detect installed apps correctly." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open the app on your device" -ForegroundColor Gray
Write-Host "   2. Navigate to Diagnostics screen to verify" -ForegroundColor Gray
Write-Host "   3. Test notification listener with Instagram" -ForegroundColor Gray
Write-Host ""
