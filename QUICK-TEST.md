# Quick Test Guide - Light Native

## 🚀 Rebuild the App

```bash
cd light-native-main
npm run android
```

## 📱 Test AI Connection

### Test 1: Basic Conversation
**Say:** "Hello Light"

**Expected:** AI responds with a greeting (not an error message)

**If it fails, check logs:**
```bash
adb logcat | grep -E "\[AI\]|\[Gemini\]|\[Claude\]"
```

Look for:
- `[AI] API Keys status:` - Shows which keys are loaded (✓ or ✗)
- `[Gemini] API error response:` - Shows Gemini errors
- `[Claude] API error response:` - Shows Claude errors

### Test 2: Reminders
**Say:** "Remind me to call mom at 3pm"

**Expected:** "Certainly sir, I'll remind you to call mom at 3pm"

**Check logs:**
```bash
adb logcat | grep "\[Reminders\]"
```

Look for:
- `[Reminders] scheduleReminder called:`
- `[Reminders] Setting reminder:`
- `[Reminders] Success:`

### Test 3: Ask Questions
**Say:** "What's the weather?"

**Expected:** Gets real weather data (not error)

## 🔍 Troubleshooting

### Issue: Still says "trouble connecting"

**Step 1:** Check internet
- Make sure device has WiFi or mobile data
- Try opening a browser on the device

**Step 2:** Check API keys
Look in logs for:
```
[AI] API Keys status:
[AI]   - Gemini: ✓
[AI]   - Claude: ✓
```

If Claude shows ✗:
1. Check `src/config/init-api-keys.local.ts` exists
2. Verify Claude key is correct: `sk-ant-usr-15mE5sib4o...`

**Step 3:** Check detailed error
Look for:
```
[AI] ❌ ALL PROVIDERS FAILED!
[AI] Errors: [...]
```

This will tell you exactly what went wrong.

### Issue: Reminders don't work

**Check logs for:**
```
[Reminders] Module not available - not on Android or module not registered
```

**Fix:** Module needs to be registered in LightPackage.kt

**Or:**
```
[Reminders] setReminder method not found on module
```

**Fix:** ReminderModule.kt needs to export `setReminder` method

## 📊 Understanding the Logs

### Success Markers
- ✅ = Operation succeeded
- ✓ = Resource available/present

### Error Markers
- ❌ = Operation failed
- ✗ = Resource missing/unavailable

### Progress Markers
- 🔄 = Attempting operation

### Example Good Flow
```
[AI] ========================================
[AI] callAI() invoked
[AI] Provider: auto
[AI] API Keys status:
[AI]   - Gemini: ✓
[AI]   - Claude: ✓
[AI] 🔄 Trying provider: gemini
[Gemini] Starting API call...
[Gemini] API Key: ✓ Present
[Gemini] Calling API: https://generativelanguage.googleapis.com/...
[Gemini] Response status: 200
[Gemini] ✅ Success! Response length: 156
[AI] ✅ SUCCESS with provider: gemini
```

### Example Error Flow
```
[AI] 🔄 Trying provider: gemini
[Gemini] Starting API call...
[Gemini] Response status: 400
[Gemini] API error response: {"error": {"code": 400, "message": "API_KEY_INVALID"}}
[Gemini] ❌ Error: Gemini API error: 400 - ...
[AI] ❌ Provider gemini failed: Gemini API error: 400
[AI] 🔄 Trying provider: claude
[Claude] Starting API call...
[Claude] API Key: ✓ Present (sk-ant-usr-15m...)
[Claude] Response status: 200
[Claude] ✅ Success! Response length: 142
[AI] ✅ SUCCESS with provider: claude
```

## 🎯 Test All Features

1. **Basic AI:** "Hello Light" ✓
2. **Reminders:** "Remind me to buy milk at 5pm" ✓
3. **Weather:** "What's the weather?" ✓
4. **Calls:** "Call mom" ✓
5. **Apps:** "Open Instagram" ✓
6. **Messages:** "Reply to John on WhatsApp saying hello" ✓

## 📞 Get Detailed Logs

To see all logs in real-time:
```bash
adb logcat -c  # Clear old logs
adb logcat | grep -E "\[AI\]|\[Gemini\]|\[Claude\]|\[Reminders\]|\[Assistant\]"
```

Then use the app and watch the logs appear.

## ✅ What Changed

1. **AI providers now log everything** - You can see exactly what's happening
2. **Reminders have all required functions** - No more missing function errors
3. **Error messages are specific** - Shows exactly what failed (API key, network, etc.)
4. **Auto-fallback works** - If Gemini fails, tries Claude, then OpenAI
5. **API key checking** - Shows which keys are loaded before trying to use them

Your app should now work properly! If you still get errors, the logs will show exactly what's wrong.
