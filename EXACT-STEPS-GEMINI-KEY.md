# 🎯 EXACT Steps to Get Gemini API Key

## What You're Seeing vs What You Need

### ❌ What You Keep Getting:
```
AQ.Ab8RN6L1Jq2Rwt7JH35b...                                    (OAuth token)
ais-gemini-key-2ed7a5a0@1091500101571.iam.gserviceaccount.com (Service account email)
```

### ✅ What You NEED:
```
AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM                        (API Key)
```

---

## 📍 METHOD 1: Google Cloud Console (MOST RELIABLE)

### Step 1: Open Google Cloud Console
**Direct Link:** https://console.cloud.google.com/apis/credentials

### Step 2: Select or Create a Project
At the very top of the page, you'll see:
```
┌────────────────────────────────────┐
│ My First Project ▼                 │  ← Click this dropdown
└────────────────────────────────────┘
```

**If you don't have a project:**
1. Click the dropdown
2. Click "NEW PROJECT" 
3. Enter name: "LightNative"
4. Click "CREATE"
5. Wait 10 seconds
6. Select your new project from dropdown

### Step 3: Enable the API
**Direct Link:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

You'll see:
```
┌────────────────────────────────────┐
│ Generative Language API             │
│                                    │
│ [ ENABLE ]                         │  ← Click this button
└────────────────────────────────────┘
```

**Click "ENABLE"** and wait for it to finish.

### Step 4: Create the API Key
**Go back to:** https://console.cloud.google.com/apis/credentials

At the top, you'll see:
```
┌────────────────────────────────────┐
│ + CREATE CREDENTIALS ▼             │  ← Click this
└────────────────────────────────────┘
```

**Click it**, then select **"API key"** from the dropdown.

### Step 5: COPY THE KEY
A popup will appear:
```
┌─────────────────────────────────────────┐
│ API key created                         │
│                                         │
│ Your API key                            │
│ AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDs  │  ← This is what you want!
│                                         │
│ [ COPY ]  [ RESTRICT KEY ]              │
└─────────────────────────────────────────┘
```

**Click "COPY"** to copy the key!

**IMPORTANT:** The key should:
- Start with `AIzaSy`
- Be about 39 characters
- Be a single string (no spaces, no @, no .com)

---

## 📍 METHOD 2: AI Studio (Simpler but Sometimes Buggy)

### Step 1: Go to AI Studio
**Direct Link:** https://aistudio.google.com/app/apikey

### Step 2: Look for "Get API key" Button
You'll see one of these:

**Option A:**
```
┌────────────────────────────────────┐
│ Get API key                        │
│                                    │
│ [ Get API key ]                    │  ← Click this
└────────────────────────────────────┘
```

**Option B:**
```
┌────────────────────────────────────┐
│ Create API key in new project      │  ← Click this
└────────────────────────────────────┘
```

### Step 3: Copy the Key
After clicking, you should see:
```
┌─────────────────────────────────────────┐
│ ✓ API key created                       │
│                                         │
│ AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDs  │
│                                         │
│ [ Copy API key ]                        │
└─────────────────────────────────────────┘
```

---

## 🚨 IMPORTANT: What NOT to Click

### DON'T Click These:
- ❌ "Configure OAuth consent screen"
- ❌ "Create OAuth client ID"
- ❌ "Create service account"
- ❌ "Get access token"
- ❌ "Sign in with Google"

### DO Click These:
- ✅ "Create credentials" → "API key"
- ✅ "Get API key"
- ✅ "Create API key in new project"

---

## 🔍 How to Tell if You Got the Right Thing

### ✅ CORRECT (API Key):
```
AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM
```
- Starts with: `AIzaSy`
- Length: ~39 characters
- Format: One continuous string
- No special chars except `-` or `_`

### ❌ WRONG (OAuth Token):
```
AQ.Ab8RN6L1Jq2Rwt7JH35bHeInPb3BGwYMQtY-CtJNHZpNTE29mg
```
- Starts with: `AQ.`
- Has dots in it
- Much longer

### ❌ WRONG (Service Account):
```
ais-gemini-key-2ed7a5a0@1091500101571.iam.gserviceaccount.com
```
- Has `@` symbol
- Has `.com` or `.iam`
- Looks like an email address

### ❌ WRONG (Access Token):
```
ya29.a0AfB_byDYourAccessTokenHere
```
- Starts with: `ya29.`
- Very long
- Has dots

---

## 🎬 Visual Guide: What Your Screen Should Look Like

### At console.cloud.google.com/apis/credentials:

**You should see this page:**
```
APIs & Services > Credentials

┌─────────────────────────────────────────────┐
│  + CREATE CREDENTIALS  ▼   MANAGE...        │  ← Top buttons
├─────────────────────────────────────────────┤
│                                             │
│  Credentials in project                     │
│                                             │
│  [ No credentials yet ]                     │
│  or                                         │
│  [ List of existing credentials ]           │
│                                             │
└─────────────────────────────────────────────┘
```

**After clicking "+ CREATE CREDENTIALS":**
```
Dropdown menu appears:
┌──────────────────────────┐
│  API key                 │  ← Choose THIS one!
│  OAuth client ID         │
│  Service account         │
└──────────────────────────┘
```

**After creating API key:**
```
┌─────────────────────────────────────────┐
│  ✓ API key created                      │
│                                         │
│  AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3t...  │  ← YOUR KEY!
│                                         │
│  This key can be used in API requests   │
│  that don't involve user data.          │
│                                         │
│  [ COPY ]  [ RESTRICT KEY ]  [ CLOSE ]  │
└─────────────────────────────────────────┘
```

---

## ✅ After You Get the CORRECT Key

### Step 1: Add to Your App
Open: `src/config/init-api-keys.local.ts`

```typescript
export function initializeMyAPIKeys() {
  // Replace this with YOUR actual key:
  setAPIKey('gemini', 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX');
  
  setAPIKey('claude', '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');
  
  console.log('[API Keys] ✅ All keys loaded');
}
```

### Step 2: Test the Key (Optional)
```bash
# Test with curl (replace YOUR_KEY):
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Should return:** JSON with AI response

### Step 3: Set Gemini as Default
Open: `src/lib/gemini.ts` (line 54)

Change from:
```typescript
let currentProvider: AIProvider = 'claude';
```

To:
```typescript
let currentProvider: AIProvider = 'auto';
```

### Step 4: Rebuild Your App
```bash
npm run android
```

### Step 5: Test
Open app, say "Hello Light"

Should work! ✅

---

## 💡 Quick Test Commands

### Test Gemini Key:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyYOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hi"}]}]}'
```

**Expected:** `{"candidates":[{"content":{"parts":[{"text":"Hi!"}]}}]}`

**If error:** Key is wrong, try again

---

## 🔗 Direct Links (Open These)

**Create API Key (Method 1 - BEST):**
https://console.cloud.google.com/apis/credentials

**Enable API (Do this FIRST):**
https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

**AI Studio (Method 2):**
https://aistudio.google.com/app/apikey

---

## 📞 Still Getting Wrong Format?

If you're STILL getting tokens that start with `AQ.` or service account emails:

### Solution: Try Incognito Mode
1. Open Chrome in Incognito (Ctrl+Shift+N)
2. Go to: https://console.cloud.google.com/apis/credentials
3. Sign in
4. Create API key
5. Should work properly

### Or: Try Different Browser
- Use Edge or Firefox
- Clear cookies first
- Go directly to credentials page

### Or: Check API is Enabled
Sometimes the key looks wrong because API isn't enabled:
1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Make sure it says "API Enabled" in green
3. If not, click "Enable"
4. Then create new API key

---

## ✅ Success Checklist

After getting your key, verify:
- [ ] Starts with `AIzaSy`
- [ ] About 39 characters long
- [ ] No spaces
- [ ] No `@` symbol
- [ ] No `.com` or `.iam`
- [ ] No dots except maybe one or two
- [ ] Is a single continuous string

If YES to all above → YOU GOT IT! 🎉

---

## 🎯 Final Words

**You're looking for:**
```
AIzaSy + 33 more random characters
```

**NOT:**
```
AQ. + stuff                      (OAuth token)
something@something.com          (Email)
ya29. + stuff                    (Access token)
```

**Go to:**
https://console.cloud.google.com/apis/credentials

**Click:**
"CREATE CREDENTIALS" → "API key"

**Copy:**
The string that starts with `AIzaSy`

**That's it!** 🚀
