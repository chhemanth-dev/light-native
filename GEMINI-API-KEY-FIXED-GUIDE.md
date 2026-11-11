# 🔑 How to Get REAL Gemini API Key (Not OAuth Token)

## ❌ The Problem

You're getting tokens like: `AQ.Ab8RN6L1...`

These are **OAuth tokens**, not API keys. They won't work!

---

## ✅ Solution: Get the RIGHT Key

### Step 1: Go to the NEW Google AI Studio
**Visit:** https://aistudio.google.com/apikey

(Note the URL: `/apikey` not `/app/apikey`)

### Step 2: Look for THIS Button

On the page, look for:
```
┌────────────────────────────┐
│  Get API key               │
│  ▼ Select from existing    │
│     Google Cloud projects  │
│                            │
│  Or                        │
│  [ Create API key ]        │
└────────────────────────────┘
```

**Click:** "Create API key" (NOT the dropdown)

### Step 3: It Will Create the Key

After clicking, you'll see:
```
┌─────────────────────────────────────┐
│  ✓ API key created                  │
│                                     │
│  AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3t  │
│                                     │
│  [ Copy API key ]                   │
└─────────────────────────────────────┘
```

**This is the correct format!**

---

## 🎯 Alternative Method: Use Google Cloud Console

If AI Studio keeps giving you OAuth tokens:

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create a Project (if needed)
- Click "Select a project" at the top
- Click "New Project"
- Name it "LightNative" 
- Click "Create"

### Step 3: Enable Generative AI API
1. Go to: https://console.cloud.google.com/apis/library
2. Search for: **"Generative Language API"**
3. Click on it
4. Click **"Enable"**

### Step 4: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** at the top
3. Select **"API Key"**
4. A popup will show your key starting with `AIzaSy...`
5. **Copy it immediately!**

### Step 5: Restrict the Key (Optional but Recommended)
1. After creating, click "Restrict Key"
2. Under "API restrictions", select "Restrict key"
3. Search and select: **"Generative Language API"**
4. Click "Save"

---

## 🔍 How to Verify Your Key is Correct

### Test with Curl:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

**Expected Response (Key is VALID):**
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! How can I help you?"}]
    }
  }]
}
```

**Error Response (Key is INVALID):**
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key."
  }
}
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Still Getting AQ.* Keys
**Solution:** Try the Google Cloud Console method above

### Issue 2: Key Doesn't Work After Creating
**Possible causes:**
1. API not enabled → Enable "Generative Language API"
2. Wrong project → Make sure you're in the right project
3. Key restrictions → Remove restrictions or add the right API
4. Need to wait → Sometimes takes 1-2 minutes to activate

### Issue 3: Can't Find "Create API Key" Button
**Solution:** 
1. Make sure you're signed in to Google
2. Accept terms of service if prompted
3. Try different browser (Chrome works best)
4. Clear cookies and try again

---

## 💡 Quick Workaround: Use Claude for Now

Since you already have Claude configured:

**Your app is ALREADY SET to use Claude!**

Just rebuild:
```bash
npm run android
```

**It will work immediately!**

You can add Gemini later when you figure out the API key issue.

---

## 📋 Checklist: Correct API Key

Your Gemini API key should:
- [ ] Start with `AIzaSy`
- [ ] Be exactly 39 characters long
- [ ] Contain only letters, numbers, `-`, and `_`
- [ ] NOT start with `AQ.`
- [ ] NOT start with `ya29.`
- [ ] NOT be a long string with dots everywhere

**Example of CORRECT key:**
```
AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM
```

**Examples of WRONG keys:**
```
AQ.Ab8RN6L1Jq2Rwt7JH35bHeInPb3BGwYMQtY-CtJNHZpNTE29mg  ❌ OAuth token
ya29.a0AfB_byDYourAccessTokenHere                    ❌ Access token
1234567890                                           ❌ Too short
```

---

## 🎯 Recommended Path Forward

### Option A: Use Claude (Easiest - Works NOW)
```bash
npm run android
```
✅ Already configured
✅ Works immediately  
✅ Better AI responses
💰 $5 free credit

### Option B: Get Gemini via Cloud Console
1. https://console.cloud.google.com/apis/credentials
2. Create API Key
3. Add to app
4. Rebuild

### Option C: Skip Gemini Entirely
- Keep using Claude
- Add OpenAI if you want variety
- Gemini isn't necessary

---

## 🔗 Important URLs

**For API Key (Method 1):**
- https://aistudio.google.com/apikey

**For API Key (Method 2):**
- https://console.cloud.google.com/apis/credentials

**Enable API:**
- https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

**Documentation:**
- https://ai.google.dev/gemini-api/docs/api-key

---

## ✅ What to Do RIGHT NOW

### Immediate Solution:
Your app is **already configured to use Claude**. Just rebuild:

```bash
npm run android
```

**Test it:**
- Say "Hello Light"
- Should work perfectly! ✅

### Later (Optional):
Try getting Gemini key from Google Cloud Console if you want the free tier.

But **Claude is better anyway!** 🎉

---

## 📞 Still Having Issues?

If you really need Gemini:
1. Try **incognito mode** in Chrome
2. Try **different Google account**
3. Use **Cloud Console method** (more reliable)
4. Or just **stick with Claude** (recommended!)

**Your app works RIGHT NOW with Claude.** No need to fight with Gemini keys! 🚀
