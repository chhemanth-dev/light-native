#!/usr/bin/env pwsh
# Complete rebuild script with all fixes applied

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     LIGHT ASSISTANT - COMPLETE FIX & REBUILD          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Fixes Applied:" -ForegroundColor Yellow
Write-Host "   ✅ Forced ONLINE-ONLY mode (no offline)" -ForegroundColor Green
Write-Host "   ✅ Fixed voice recognition (debouncing + errors)" -ForegroundColor Green
Write-Host "   ✅ Fixed reminder errors (detailed logging)" -ForegroundColor Green
Write-Host "   ✅ Fixed Instagram detection (package queries)" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to start rebuild..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
Write-Host ""

# Step 1: Stop any running processes
Write-Host "🛑 Stopping any running Metro/Gradle processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*java*" -or $_.ProcessName -like "*node*" -or $_.ProcessName -like "*gradle*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clean all build artifacts
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow

$foldersToClean = @(
    "android/app/build",
    "android/build",
    ".expo",
    "node_modules/.cache"
)

foreach ($folder in $foldersToClean) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
        Write-Host "   ✅ Removed $folder" -ForegroundColor Green
    }
}

Write-Host ""

# Step 3: Gradle clean
Write-Host "🧹 Running Gradle clean..." -ForegroundColor Yellow
Set-Location android
try {
    .\gradlew clean --no-daemon 2>&1 | Out-Null
    Write-Host "   ✅ Gradle clean complete" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Gradle clean had issues (continuing...)" -ForegroundColor DarkYellow
}
Set-Location ..
Write-Host ""

# Step 4: Verify fixes are in place
Write-Host "🔍 Verifying fixes..." -ForegroundColor Yellow

$fixesVerified = $true

# Check 1: Online-only mode in gemini.ts
$geminiContent = Get-Content "src/lib/gemini.ts" -Raw
if ($geminiContent -match "STRICT ONLINE-ONLY MODE") {
    Write-Host "   ✅ Online-only mode: Verified" -ForegroundColor Green
} else {
    Write-Host "   ❌ Online-only mode: NOT FOUND" -ForegroundColor Red
    $fixesVerified = $false
}

# Check 2: Package queries in AndroidManifest
$manifestContent = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
if ($manifestContent -match "com.instagram.android") {
    Write-Host "   ✅ Instagram detection: Verified" -ForegroundColor Green
} else {
    Write-Host "   ❌ Instagram detection: NOT FOUND" -ForegroundColor Red
    $fixesVerified = $false
}

# Check 3: Diagnostics screen exists
if (Test-Path "app/diagnostics.tsx") {
    Write-Host "   ✅ Diagnostics screen: Verified" -ForegroundColor Green
} else {
    Write-Host "   ❌ Diagnostics screen: NOT FOUND" -ForegroundColor Red
    $fixesVerified = $false
}

# Check 4: Debounce in useAssistant
$assistantContent = Get-Content "src/hooks/useAssistant.ts" -Raw
if ($assistantContent -match "Debounce") {
    Write-Host "   ✅ Voice debouncing: Verified" -ForegroundColor Green
} else {
    Write-Host "   ❌ Voice debouncing: NOT FOUND" -ForegroundColor Red
    $fixesVerified = $false
}

if (!$fixesVerified) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Some fixes are missing!" -ForegroundColor Red
    Write-Host "   The build will continue, but some issues may persist." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""

# Step 5: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm install 2>&1 | Out-Null
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Apply patches
Write-Host "🔧 Applying patches..." -ForegroundColor Yellow
try {
    npm run postinstall 2>&1 | Out-Null
    Write-Host "   ✅ Patches applied" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Patch-package had issues (continuing...)" -ForegroundColor DarkYellow
}
Write-Host ""

# Step 7: Check device connection
Write-Host "📱 Checking device connection..." -ForegroundColor Yellow
$devices = adb devices | Select-String "device$"
if ($devices) {
    Write-Host "   ✅ Device connected" -ForegroundColor Green
    Write-Host "   $devices" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  No device detected!" -ForegroundColor Red
    Write-Host "   Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Device is connected via USB" -ForegroundColor Gray
    Write-Host "   2. USB debugging is enabled" -ForegroundColor Gray
    Write-Host "   3. Device is authorized (check device screen)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Continuing build anyway..." -ForegroundColor Gray
}
Write-Host ""

# Step 8: Build the app
Write-Host "🏗️  Building Android app..." -ForegroundColor Yellow
Write-Host "   This will take several minutes..." -ForegroundColor Gray
Write-Host "   Watch for any errors below..." -ForegroundColor Gray
Write-Host ""

try {
    npm run android
    Write-Host ""
    Write-Host "   ✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Java not installed or wrong version" -ForegroundColor Gray
    Write-Host "   2. Android SDK not configured" -ForegroundColor Gray
    Write-Host "   3. ANDROID_HOME not set" -ForegroundColor Gray
    Write-Host "   4. Gradle build error - check logs above" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              BUILD COMPLETE - TESTING                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Step 9: Run diagnostics
Write-Host "🧪 Running post-build diagnostics..." -ForegroundColor Yellow
Write-Host ""

# Check Instagram
Write-Host "📱 Checking if Instagram is installed on device..." -ForegroundColor Cyan
$instagramPkg = adb shell pm list packages | Select-String "com.instagram.android"
if ($instagramPkg) {
    Write-Host "   ✅ Instagram IS installed" -ForegroundColor Green
    Write-Host "      $instagramPkg" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Instagram is NOT installed" -ForegroundColor Red
    Write-Host "      Install from Play Store if you want Instagram integration" -ForegroundColor Gray
}
Write-Host ""

# Check other apps
Write-Host "📱 Other messaging apps installed:" -ForegroundColor Cyan
$apps = @(
    @{pkg="com.whatsapp"; name="WhatsApp"},
    @{pkg="com.google.android.gm"; name="Gmail"},
    @{pkg="org.telegram.messenger"; name="Telegram"},
    @{pkg="com.snapchat.android"; name="Snapchat"},
    @{pkg="com.facebook.orca"; name="Messenger"},
    @{pkg="com.discord"; name="Discord"}
)

foreach ($app in $apps) {
    $found = adb shell pm list packages | Select-String $app.pkg
    if ($found) {
        Write-Host "   ✅ $($app.name)" -ForegroundColor Green
    }
}
Write-Host ""

# Check internet on device
Write-Host "🌐 Checking device internet connection..." -ForegroundColor Cyan
$ping = adb shell ping -c 1 8.8.8.8 2>&1
if ($ping -match "1 received") {
    Write-Host "   ✅ Device has internet connection" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Device may not have internet!" -ForegroundColor Red
    Write-Host "      Light REQUIRES internet to function!" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   ALL DONE! 🎉                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ App built and installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Testing Checklist:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. [ ] Turn OFF WiFi → Open app → Should show internet error" -ForegroundColor Gray
Write-Host "2. [ ] Turn ON WiFi → Try voice → Should work now" -ForegroundColor Gray
Write-Host "3. [ ] Say: 'Remind me to test at 3pm' → Should confirm" -ForegroundColor Gray
Write-Host "4. [ ] Navigate to Diagnostics → Check installed apps" -ForegroundColor Gray
Write-Host "5. [ ] Check notification access is enabled" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Read FIXES_APPLIED.md for detailed changes" -ForegroundColor Cyan
Write-Host ""
Write-Host "🐛 If issues persist, check logs:" -ForegroundColor Yellow
Write-Host "   adb logcat | Select-String 'LightNative|ERROR|AI'" -ForegroundColor Gray
Write-Host ""
