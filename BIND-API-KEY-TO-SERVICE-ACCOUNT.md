# 🔑 NEW: Bind Gemini API Key to Service Account

## What Changed

Google recently updated Gemini API requirements. Now you need to:
1. Create an API key
2. **Bind it to a service account** (NEW STEP!)
3. This generates an "auth key" that works with Gemini

This is why you kept seeing service account prompts!

---

## ✅ Complete Step-by-Step Guide

### Step 1: Create API Key (You Already Did This)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → "API key"
3. Copy the key (starts with `AIzaSy`)
4. **Don't close the popup yet!**

### Step 2: Bind to Service Account (NEW!)

In the popup where you created the API key:

```
┌─────────────────────────────────────────┐
│  ✓ API key created                      │
│                                         │
│  AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3t...  │
│                                         │
│  APIs that can be accessed using this   │
│  key:                                   │
│                                         │
│  [ ] Agent Platform API                 │
│  [✓] Generative Language API            │  ← Check this!
│                                         │
│  Service account required:              │
│  [ Bind to service account ]            │  ← Click this!
│                                         │
│  [ COPY ]  [ RESTRICT KEY ]  [ CLOSE ]  │
└─────────────────────────────────────────┘
```

**Steps:**
1. Check **"Generative Language API"** (or it might say "Gemini API")
2. Click **"Bind to service account"**
3. Follow the binding wizard

### Step 3: Create Service Account for Binding

A new page will open asking you to create or select a service account:

```
┌─────────────────────────────────────────┐
│  Bind API key to service account        │
│                                         │
│  Select service account:                │
│  [ Create new service account ]         │  ← Choose this
│                                         │
│  Or select existing:                    │
│  [ Dropdown of existing accounts ]      │
└─────────────────────────────────────────┘
```

**Click "Create new service account"**

### Step 4: Fill in Service Account Details

```
┌─────────────────────────────────────────┐
│  Create service account                 │
│                                         │
│  Service account name:                  │
│  [ gemini-api-access ]                  │  ← Enter this
│                                         │
│  Service account ID:                    │
│  gemini-api-access@...                  │  ← Auto-filled
│                                         │
│  Description (optional):                │
│  [ For Gemini API access ]              │  ← Enter this
│                                         │
│  [ CREATE ]                             │
└─────────────────────────────────────────┘
```

**Fill in:**
- Name: `gemini-api-access`
- Description: `For Gemini API access`
- Click "CREATE"

### Step 5: Grant Permissions

After creating the service account, you'll be asked to grant permissions:

```
┌─────────────────────────────────────────┐
│  Grant this service account access      │
│                                         │
│  Select a role:                         │
│  [ Generative AI User ]                 │  ← Select this
│                                         │
│  Or search: "AI Platform"               │
│                                         │
│  [ CONTINUE ]                           │
└─────────────────────────────────────────┘
```

**Select role:** "Generative AI User" or "AI Platform User"

Click **"CONTINUE"**

### Step 6: Complete Binding

After granting permissions:

```
┌─────────────────────────────────────────┐
│  ✓ API key bound to service account     │
│                                         │
│  Your authorization key:                │
│  AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3t...  │
│                                         │
│  This key is now authorized for:        │
│  ✓ Generative Language API              │
│                                         │
│  [ COPY ]                               │  ← Copy this!
└─────────────────────────────────────────┘
```

**Copy the final key!** This is your working API key!

---

## 🎯 Alternative: Simpler Method via AI Studio

AI Studio might handle this automatically:

### 1. Go to AI Studio:
https://aistudio.google.com/app/apikey

### 2. Click "Get API key"

### 3. Select "Create API key in new project"

AI Studio **may automatically**:
- Create the project
- Create the service account
- Bind them together
- Give you the working key

**Try this first!** It's simpler!

---

## 🆘 If AI Studio Also Asks for Service Account

If even AI Studio requires binding:

### Quick Setup:
1. Go to AI Studio: https://aistudio.google.com/app/apikey
2. Click "Get API key"
3. If it asks for project → "Create new project"
4. If it asks for service account → "Create new"
5. Accept defaults
6. Copy the final key

AI Studio's wizard is **much simpler** than Cloud Console!

---

## 📋 Summary of New Process

### Old Way (Before):
1. Create API key
2. Copy key
3. Done

### New Way (Now):
1. Create API key
2. **Bind to service account**
3. **Grant permissions**
4. Copy authorization key
5. Done

---

## ✅ What the Final Key Looks Like

After all steps, you should have:

```
AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM
```

This key is **bound to your service account** and will work with Gemini API.

It still starts with `AIzaSy` (not `AQ.` or `@`)!

---

## 💡 Why Google Changed This

**Security improvement:**
- Prevents API key abuse
- Better tracking of usage
- Improved access control

**For you:**
- Just a few extra clicks
- Still free
- Same usage limits

---

## 🎯 Recommended Approach

### Try AI Studio First (Easiest):
1. https://aistudio.google.com/app/apikey
2. Follow the wizard
3. It handles service account binding automatically

### If AI Studio Doesn't Work, Use Cloud Console:
1. https://console.cloud.google.com/apis/credentials
2. Create API key
3. Check "Generative Language API"
4. Click "Bind to service account"
5. Create new service account
6. Grant "Generative AI User" role
7. Copy final key

---

## 🔍 How to Verify It Worked

### Test the key:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### ✅ Success:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Hello! How can I help you?"}]
    }
  }]
}
```

### ❌ Not Bound Yet:
```json
{
  "error": {
    "message": "Service account required",
    "code": 403
  }
}
```

---

## 📞 What to Do Next

### Option A: Try AI Studio (Recommended)
- Simpler wizard
- Handles binding automatically
- Less steps

### Option B: Use Cloud Console
- More control
- Manual binding
- More steps

### Option C: Skip Gemini, Use OpenAI
If this is too complicated:
1. Sign up for OpenAI: https://platform.openai.com/
2. Get $5 free credit
3. Create API key (simple, no service account!)
4. Use that instead

---

## ⚡ Quick Action

**Try AI Studio NOW:**

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Get API key" or "Create API key in new project"
3. Follow the simple wizard
4. Copy the key it gives you
5. Add to your app

**Should take 2-3 minutes!**

---

## 🎊 After You Get the Key

### 1. Add to your app:
```typescript
// In src/config/init-api-keys.local.ts
setAPIKey('gemini', 'AIzaSyYOUR_BOUND_KEY_HERE');
```

### 2. Change default provider:
```typescript
// In src/lib/gemini.ts, line 54
let currentProvider: AIProvider = 'auto';
```

### 3. Rebuild:
```bash
npm run android
```

### 4. Test:
Say "Hello Light" - should work! ✅

---

This new requirement is why you kept seeing service account prompts!

**Try AI Studio** - it should handle all this automatically! 🚀
