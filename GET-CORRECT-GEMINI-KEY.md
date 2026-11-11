# ✅ How to Get the CORRECT Gemini API Key

## ❌ Wrong Key Format
You provided: `AQ.Ab8RN6L1Jq2Rwt7JH35bHeInPb3BGwYMQtY-CtJNHZpNTE29mg`

This is NOT a Gemini API key. It might be:
- A Google OAuth token
- A different Google service key
- A session token

## ✅ Correct Gemini API Key Format
Should look like: `AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM`
- Starts with `AIzaSy`
- About 39 characters long
- Contains letters, numbers, and sometimes dashes/underscores

---

## 🎯 Step-by-Step: Get the RIGHT Key

### Step 1: Go to the Correct URL
**Visit:** https://aistudio.google.com/app/apikey

**NOT:**
- ❌ https://console.cloud.google.com (wrong - this is for other Google APIs)
- ❌ https://accounts.google.com (wrong - this is for OAuth)
- ❌ https://developers.google.com (wrong - general developer site)

**USE:**
- ✅ https://aistudio.google.com/app/apikey (CORRECT!)
- ✅ https://makersuite.google.com/app/apikey (CORRECT! - redirects to aistudio)

### Step 2: Sign In
- Use any Google account (Gmail)
- Accept terms of service if prompted

### Step 3: Create API Key
You'll see a page like this:

```
┌──────────────────────────────────────┐
│  Get API Key                         │
│                                      │
│  [ Create API key ]                  │
│                                      │
│  Or select existing project:         │
│  [ Create API key in new project ]   │
└──────────────────────────────────────┘
```

**Click:** "Create API key in new project" 
OR "Create API key" button

### Step 4: Copy the Key
After clicking, you'll see:

```
┌──────────────────────────────────────┐
│  Your API key                        │
│                                      │
│  AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDs │
│                                      │
│  [ Copy ]  [ Show key ]              │
│                                      │
│  ⚠️ Keep this key secure!           │
└──────────────────────────────────────┘
```

**Click "Copy"** to copy the entire key.

---

## 📱 Screenshot Guide

### 1. You should see this page:
![Gemini API Key Page](https://aistudio.google.com/app/apikey)

### 2. After creating, you'll see:
- Your project name (e.g., "My First Project")
- The API key (starts with AIzaSy...)
- Copy button

### 3. What you should copy:
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**Length:** ~39 characters
**Starts with:** AIzaSy
**Contains:** Letters, numbers, maybe `-` or `_`

---

## 🔧 Add to Your App

Once you have the CORRECT key:

### 1. Open file:
```
src/config/init-api-keys.local.ts
```

### 2. Update this line:
```typescript
setAPIKey('gemini', 'AIzaSy_GET_YOUR_OWN_KEY_FROM_makersuite.google.com');
```

### 3. Replace with YOUR key:
```typescript
setAPIKey('gemini', 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
```
(Use the actual key you copied)

### 4. Save the file

### 5. Rebuild:
```bash
npm run android
```

---

## 🚨 Common Mistakes

### Mistake #1: Using Google Cloud Console
**Wrong URL:** https://console.cloud.google.com
**Problem:** This gives you a different type of API key

**Solution:** Use https://aistudio.google.com/app/apikey instead

### Mistake #2: Using OAuth Token
**Wrong:** Authentication tokens (starts with `AQ.` or `ya29.`)
**Problem:** These are for signing in, not for API calls

**Solution:** Get API key from AI Studio

### Mistake #3: Wrong API Key Type
**Wrong:** Firebase key, YouTube API key, Maps API key
**Problem:** These won't work with Gemini

**Solution:** Must be specifically from AI Studio

---

## ✅ Verification Checklist

Before using your key, check:

- [ ] Key starts with `AIzaSy`
- [ ] Key is about 39 characters long
- [ ] Got it from https://aistudio.google.com/app/apikey
- [ ] Copied the entire key (no spaces)
- [ ] Not an OAuth token (doesn't start with `AQ.` or `ya29.`)
- [ ] Not a Firebase key (doesn't start with `AIza` without `Sy`)

---

## 🎯 Quick Test

After adding the correct key, test with curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Expected response:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! How can I help you today?"}]
    }
  }]
}
```

**If you get 400 error:**
- Key is still wrong
- Copy-paste error
- Need to create new key

---

## 🔗 Important Links

**Get API Key (CORRECT):**
- https://aistudio.google.com/app/apikey
- https://makersuite.google.com/app/apikey

**Documentation:**
- https://ai.google.dev/tutorials/rest_quickstart

**NOT these:**
- ❌ console.cloud.google.com (wrong)
- ❌ console.firebase.google.com (wrong)
- ❌ developers.google.com/maps (wrong)

---

## 💡 Still Having Issues?

If you're seeing the API key page but it looks different:

1. **Make sure you're signed in** to a Google account
2. **Accept the terms** if prompted
3. **Wait a few seconds** after creating the key
4. **Refresh the page** if the key doesn't appear
5. **Try a different browser** (Chrome works best)

---

## 📞 Alternative: Try Claude First

Since you already have a Claude API key configured, you can:

1. **Set Claude as default:**
   ```typescript
   // In src/lib/gemini.ts, line 54
   let currentProvider: AIProvider = 'claude'; // Change from 'auto' to 'claude'
   ```

2. **Rebuild:**
   ```bash
   npm run android
   ```

3. **Test:**
   - Say "Hello Light"
   - Will use Claude instead of Gemini

**Cost:** Claude gives you $5 free credit when you sign up
**After that:** ~$0.003 per request (very cheap)

---

## 🎉 Final Steps

1. Go to: **https://aistudio.google.com/app/apikey**
2. Click: **"Create API key in new project"**
3. Copy the key (starts with `AIzaSy`)
4. Paste in: `src/config/init-api-keys.local.ts`
5. Rebuild: `npm run android`
6. Test: Say "Hello Light"

**That's it!** 🚀
