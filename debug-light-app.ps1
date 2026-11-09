# Light Native - Debug Helper Script
# This script helps capture ADB logs from your Android device

Write-Host "=== Light Native Debug Helper ===" -ForegroundColor Cyan
Write-Host ""

# Function 1: Check if ADB is installed and working
function Test-ADB {
    Write-Host "Checking ADB installation..." -ForegroundColor Yellow
    try {
        $adbVersion = adb version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ ADB is installed and working" -ForegroundColor Green
            Write-Host $adbVersion[0]
            return $true
        }
    } catch {
        Write-Host "✗ ADB is not installed or not in PATH" -ForegroundColor Red
        Write-Host ""
        Write-Host "To install ADB:" -ForegroundColor Yellow
        Write-Host "1. Download Android Platform Tools from:"
        Write-Host "   https://developer.android.com/studio/releases/platform-tools"
        Write-Host "2. Extract and add to PATH, or run from the extracted folder"
        Write-Host ""
        return $false
    }
}

# Function 2: Check if device is connected
function Test-DeviceConnected {
    Write-Host "Checking for connected devices..." -ForegroundColor Yellow
    $devices = adb devices
    $deviceLines = $devices | Select-String -Pattern "device$" | Measure-Object
    
    if ($deviceLines.Count -gt 0) {
        Write-Host "✓ Device connected!" -ForegroundColor Green
        adb devices
        return $true
    } else {
        Write-Host "✗ No device connected" -ForegroundColor Red
        Write-Host ""
        Write-Host "To connect your device:" -ForegroundColor Yellow
        Write-Host "1. Enable Developer Options on your phone:"
        Write-Host "   - Go to Settings → About Phone"
        Write-Host "   - Tap 'Build Number' 7 times"
        Write-Host "2. Enable USB Debugging:"
        Write-Host "   - Go to Settings → Developer Options"
        Write-Host "   - Turn ON 'USB Debugging'"
        Write-Host "3. Connect your phone via USB cable"
        Write-Host "4. Allow USB debugging when prompted on phone"
        Write-Host ""
        return $false
    }
}

# Function 3: Capture real-time logs (filtered)
function Start-LogCapture {
    param(
        [int]$Duration = 60,
        [string]$OutputFile = "light-logs-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
    )
    
    Write-Host "Starting log capture for $Duration seconds..." -ForegroundColor Yellow
    Write-Host "Now use your app and speak commands!" -ForegroundColor Cyan
    Write-Host "Logs will be saved to: $OutputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Filtering for:" -ForegroundColor White
    Write-Host "  - [AI] - AI processing" -ForegroundColor Gray
    Write-Host "  - [Gemini] - Gemini API calls" -ForegroundColor Gray
    Write-Host "  - [WebSearch] - Web searches" -ForegroundColor Gray
    Write-Host "  - [Weather] - Weather API" -ForegroundColor Gray
    Write-Host "  - [Accessibility] - Phone calls, app opening" -ForegroundColor Gray
    Write-Host "  - [Reminders] - Reminder setting" -ForegroundColor Gray
    Write-Host "  - [Assistant] - Speech recognition" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop early" -ForegroundColor Yellow
    Write-Host ""
    
    # Clear old logs first
    adb logcat -c
    
    # Start capturing with timeout
    $job = Start-Job -ScriptBlock {
        param($dur, $out)
        adb logcat -v time | Select-String -Pattern "\[AI\]|\[Gemini\]|\[WebSearch\]|\[Weather\]|\[Accessibility\]|\[Reminders\]|\[Assistant\]|\[Voice\]|ERROR|Exception" | Tee-Object -FilePath $out
    } -ArgumentList $Duration, $OutputFile
    
    # Wait for specified duration or Ctrl+C
    Wait-Job -Job $job -Timeout $Duration | Out-Null
    Stop-Job -Job $job
    Remove-Job -Job $job
    
    Write-Host ""
    Write-Host "✓ Logs captured to: $OutputFile" -ForegroundColor Green
    Write-Host ""
    
    # Show summary
    if (Test-Path $OutputFile) {
        $logContent = Get-Content $OutputFile -Raw
        $lineCount = (Get-Content $OutputFile).Count
        
        Write-Host "=== LOG SUMMARY ===" -ForegroundColor Cyan
        Write-Host "Total filtered lines: $lineCount" -ForegroundColor White
        
        # Count specific patterns
        $aiCalls = ($logContent | Select-String -Pattern "\[AI\]" -AllMatches).Matches.Count
        $geminiCalls = ($logContent | Select-String -Pattern "\[Gemini\]" -AllMatches).Matches.Count
        $webSearches = ($logContent | Select-String -Pattern "\[WebSearch\]" -AllMatches).Matches.Count
        $errors = ($logContent | Select-String -Pattern "ERROR|Exception|failed" -AllMatches).Matches.Count
        
        Write-Host "AI calls: $aiCalls" -ForegroundColor Yellow
        Write-Host "Gemini API calls: $geminiCalls" -ForegroundColor Yellow
        Write-Host "Web searches: $webSearches" -ForegroundColor Yellow
        Write-Host "Errors/Exceptions: $errors" -ForegroundColor $(if($errors -gt 0) { "Red" } else { "Green" })
        Write-Host ""
        
        return $OutputFile
    }
}

# Function 4: Capture errors only
function Get-ErrorLogs {
    param(
        [int]$Lines = 100,
        [string]$OutputFile = "light-errors-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
    )
    
    Write-Host "Capturing last $Lines lines with errors..." -ForegroundColor Yellow
    
    adb logcat -d -v time | Select-String -Pattern "ERROR|Exception|FATAL|crash|failed.*:" | Select-Object -Last $Lines | Out-File $OutputFile
    
    Write-Host "✓ Error logs saved to: $OutputFile" -ForegroundColor Green
    
    if (Test-Path $OutputFile) {
        $errorCount = (Get-Content $OutputFile).Count
        Write-Host "Found $errorCount error lines" -ForegroundColor $(if($errorCount -gt 0) { "Red" } else { "Green" })
        Write-Host ""
        Write-Host "Recent errors:" -ForegroundColor Yellow
        Get-Content $OutputFile | Select-Object -Last 10 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
    
    return $OutputFile
}

# Function 5: Get app-specific logs
function Get-LightAppLogs {
    param(
        [int]$Lines = 200,
        [string]$OutputFile = "light-app-logs-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
    )
    
    Write-Host "Capturing Light app logs..." -ForegroundColor Yellow
    
    # Get logs for Light Native app specifically
    adb logcat -d -v time | Select-String -Pattern "com.lightnative|ReactNativeJS|\[AI\]|\[Gemini\]|\[WebSearch\]|\[Accessibility\]|\[Reminders\]" | Select-Object -Last $Lines | Out-File $OutputFile
    
    Write-Host "✓ App logs saved to: $OutputFile" -ForegroundColor Green
    
    if (Test-Path $OutputFile) {
        Write-Host ""
        Write-Host "Last 20 log lines:" -ForegroundColor Yellow
        Get-Content $OutputFile | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor White }
    }
    
    return $OutputFile
}

# Function 6: Complete diagnostic
function Start-CompleteDiagnostic {
    Write-Host ""
    Write-Host "=== COMPLETE DIAGNOSTIC ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Check everything
    $adbOk = Test-ADB
    if (-not $adbOk) { return }
    
    Write-Host ""
    $deviceOk = Test-DeviceConnected
    if (-not $deviceOk) { return }
    
    Write-Host ""
    Write-Host "Ready to capture logs!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What would you like to do?" -ForegroundColor Cyan
    Write-Host "1. Capture live logs while testing (60 seconds)" -ForegroundColor White
    Write-Host "2. Get recent error logs only" -ForegroundColor White
    Write-Host "3. Get all Light app logs" -ForegroundColor White
    Write-Host "4. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-4)"
    
    switch ($choice) {
        "1" { 
            Write-Host ""
            Start-LogCapture -Duration 60
        }
        "2" { 
            Write-Host ""
            Get-ErrorLogs -Lines 100
        }
        "3" { 
            Write-Host ""
            Get-LightAppLogs -Lines 200
        }
        "4" { 
            Write-Host "Exiting..." -ForegroundColor Yellow
            return
        }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
    Write-Host "Share the generated .txt file to help diagnose issues" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
Write-Host "Available functions:" -ForegroundColor White
Write-Host "  Test-ADB                   - Check if ADB is working" -ForegroundColor Gray
Write-Host "  Test-DeviceConnected       - Check if device is connected" -ForegroundColor Gray
Write-Host "  Start-LogCapture           - Capture filtered logs (default 60s)" -ForegroundColor Gray
Write-Host "  Get-ErrorLogs              - Get recent errors only" -ForegroundColor Gray
Write-Host "  Get-LightAppLogs           - Get all Light app logs" -ForegroundColor Gray
Write-Host "  Start-CompleteDiagnostic   - Run full diagnostic (recommended)" -ForegroundColor Gray
Write-Host ""

# Auto-run diagnostic
Start-CompleteDiagnostic
