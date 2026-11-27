# Get Crash Logs from Android Device

## Method 1: Using ADB (Recommended)

### Step 1: Connect your Samsung A06 5G to your computer via USB

### Step 2: Enable USB Debugging
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go back → Developer Options
4. Enable "USB Debugging"
5. Accept the prompt on your phone when connecting

### Step 3: Get the crash logs

Run this command:
```bash
adb logcat -d > crash-log.txt
```

Or to see it live while opening the app:
```bash
adb logcat | grep -i "light"
```

Or specifically for React Native crashes:
```bash
adb logcat *:E
```

### Step 4: Try to open the app and capture the crash

```bash
# Clear logs first
adb logcat -c

# Start capturing
adb logcat > crash-log.txt

# Now open the app on your phone (it will crash)
# Wait 10 seconds, then press Ctrl+C to stop capturing

# View the crash log
cat crash-log.txt
```

## Method 2: If ADB is not available

Share the crash log file with me - look for any of these:
1. The crash message on screen (take a screenshot)
2. Any error dialog that appears
3. What happens when you try to open the app

## Common Startup Crash Causes

Based on our recent changes, likely causes:
1. **Import errors** - Missing or incorrect module imports
2. **Storage initialization** - AsyncStorage or SQLite issues
3. **Permissions** - Missing Android permissions
4. **Native module crashes** - expo-speech, expo-notifications, etc.
5. **Syntax errors that passed bundler** - Runtime JavaScript errors

## Quick Check - Most Likely Issue

The app might be crashing because of:
1. **Error logger initialization** - We added error logging everywhere
2. **Smart reminder parser** - New import might be failing
3. **AsyncStorage access** - Trying to read before initialization
4. **Missing permissions** - New features need permissions

Send me the crash log and I'll fix it immediately!
