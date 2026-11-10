# AI Connection Test Guide

## Issue
The app says "I apologize sir. I am facing trouble connecting..." for every request.

## Diagnostic Steps

### 1. Check Logs
Open the app and say "Hello Light", then check logs for:

```
[AI] ========================================
[AI] callAI() invoked
[AI] Provider: auto
[AI] API Keys status:
[AI]   - Gemini: ✓
[AI]   - Claude: ✓
[AI]   - OpenAI: ✗
```

### 2. Look for Error Messages

**Gemini Errors:**
```
[Gemini] API error response: ...
```

**Claude Errors:**
```
[Claude] API error response: ...
```

### 3. Common Issues

#### Issue: Gemini API Key Invalid
**Symptom:** `[Gemini] API error response: 400 - API_KEY_INVALID`
**Fix:** Get a new Gemini API key from https://makersuite.google.com/app/apikey

#### Issue: Claude API Key Not Loaded
**Symptom:** `[Claude] API Key: ✗ Missing`
**Fix:** Check that `initializeMyAPIKeys()` is called in `app/_layout.tsx`

#### Issue: No Internet Connection
**Symptom:** `[AI] Internet connection: false`
**Fix:** Enable WiFi or mobile data

#### Issue: Network Request Failed
**Symptom:** `Network request failed` or `Failed to fetch`
**Fix:** 
- Check firewall settings
- Try disabling VPN
- Check if API endpoints are accessible

### 4. Test Each Provider

#### Test Gemini Only
1. Open `app/_layout.tsx`
2. Add after `initializeMyAPIKeys()`:
```typescript
import { setAIProvider } from '@/src/lib/gemini';
setAIProvider('gemini');
```

#### Test Claude Only
```typescript
import { setAIProvider } from '@/src/lib/gemini';
setAIProvider('claude');
```

### 5. Manual API Test

Test Gemini API directly:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Test Claude API directly:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

## Enhanced Logging

The following files now have extensive logging:
- `src/lib/ai-providers.ts` - All API calls
- `src/lib/gemini.ts` - Main AI logic
- `src/lib/assistant.ts` - Request flow

Look for these markers:
- ✅ = Success
- ❌ = Failure
- 🔄 = Attempting
- ✓ = Present/Available
- ✗ = Missing/Unavailable

## Reminders Fix

Added missing functions:
- `parseReminderFromSpeech()` - Parse "remind me..." commands
- `scheduleReminder()` - Schedule the reminder
- `formatRemindersForSpeech()` - Format list for voice

### Test Reminders
Say: "Remind me to call mom at 3pm"

Should see in logs:
```
[Reminders] scheduleReminder called: {title: "call mom", time: ...}
[Reminders] Setting reminder: call mom at ...
[Reminders] Success: ...
```

## Next Steps

1. Rebuild app: `npm run android`
2. Open the app
3. Say "Hello Light"
4. Check logs with `adb logcat | grep -E "\[AI\]|\[Gemini\]|\[Claude\]"`
5. Share the logs to identify the exact issue
