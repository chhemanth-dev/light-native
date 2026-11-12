# 🎯 SIMPLE: Get OpenAI Key (No Service Accounts!)

## Why OpenAI Instead of Gemini?

**Gemini:** Complicated OAuth tokens, service accounts, binding, etc. 😫
**OpenAI:** Simple API key, no service accounts, just works! 😊

---

## ✅ Get OpenAI Key in 3 Minutes

### Step 1: Sign Up
**Go to:** https://platform.openai.com/signup

**Sign up with:**
- Email + password
- OR Google account
- OR Microsoft account

**Free:** $5 credit automatically added! 🎉

---

### Step 2: Verify Email
Check your email and click the verification link.

---

### Step 3: Go to API Keys
**Direct link:** https://platform.openai.com/api-keys

Or:
1. Click your profile icon (top right)
2. Click "API keys"

---

### Step 4: Create API Key

**You'll see:**
```
┌─────────────────────────────────────┐
│  API keys                           │
│                                     │
│  [ + Create new secret key ]        │  ← Click this
└─────────────────────────────────────┘
```

**Click:** "+ Create new secret key"

---

### Step 5: Name Your Key (Optional)

```
┌─────────────────────────────────────┐
│  Create new secret key              │
│                                     │
│  Name (optional):                   │
│  [ Light Native App ]               │  ← Enter this
│                                     │
│  [ Create secret key ]              │
└─────────────────────────────────────┘
```

**Name:** "Light Native App" (or anything)
**Click:** "Create secret key"

---

### Step 6: COPY THE KEY

**IMPORTANT:** The key is shown **only once**!

```
┌─────────────────────────────────────────┐
│  ✓ Secret key created                   │
│                                         │
│  sk-proj-abc123def456...                │  ← Your key
│                                         │
│  ⚠️ Save this key now!                  │
│  You won't be able to see it again.    │
│                                         │
│  [ Copy ]  [ Done ]                     │
└─────────────────────────────────────────┘
```

**Click "Copy"** and save it somewhere safe!

**Key format:** `sk-proj-XXXXX...` or `sk-XXXXX...`

---

## ✅ What You Should Get

Your OpenAI key should look like:
```
sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Starts with:** `sk-proj-` or `sk-`
**Length:** ~50-60 characters
**Contains:** Letters, numbers, maybe dashes

---

## 🔧 Add to Your App

### 1. Open this file:
```
src/config/init-api-keys.local.ts
```

### 2. Replace this line:
```typescript
setAPIKey('openai', 'sk-GET_YOUR_FREE_OPENAI_KEY_FROM_platform.openai.com');
```

### With your actual key:
```typescript
setAPIKey('openai', 'sk-proj-abc123def456...');
```

### 3. Save the file

---

## 🚀 Rebuild and Test

### 1. Rebuild:
```bash
npm run android
```

### 2. Test:
- Open the app
- Say "Hello Light"
- **Should work!** ✅

---

## 💰 Cost & Limits

**What you get:**
- $5 free credit (automatically added)
- Expires in 3 months
- ~5,000 AI requests with your credit

**After $5:**
- Pay as you go
- ~$0.001 per request (very cheap)
- GPT-3.5: $0.0015 per 1K tokens
- GPT-4-turbo: $0.01 per 1K tokens

**Tip:** Your app uses GPT-4-turbo by default (better quality)

---

## ✅ Advantages Over Gemini

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| **Setup** | 3 minutes | Complex |
| **Service account** | Not needed | Required |
| **OAuth issues** | No | Yes |
| **Key format** | Simple `sk-` | Complex `AIzaSy` |
| **Free credit** | $5 | Free forever |
| **Quality** | Excellent | Good |

---

## 🔍 Verify Your Key Works

### Quick test (optional):
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hi"}],
    "max_tokens": 10
  }'
```

**Expected response:** JSON with AI message

---

## 📋 Summary

### Steps:
1. Sign up: https://platform.openai.com/signup
2. Verify email
3. Go to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy key (starts with `sk-`)
6. Add to `src/config/init-api-keys.local.ts`
7. Rebuild: `npm run android`
8. Test: Say "Hello Light"

**Time:** 3 minutes
**Cost:** FREE ($5 credit)
**Difficulty:** Easy! 😊

---

## 🎉 After Setup

Your app will use:
1. **OpenAI** (primary) - Works great!
2. **Claude** (backup) - If you add credits
3. **Gemini** (skip) - Too complicated

**OpenAI is perfect for your app!** 🚀

---

## 📞 Troubleshooting

### "Invalid API key"
- Make sure you copied the ENTIRE key
- Should start with `sk-proj-` or `sk-`
- No spaces before/after

### "Insufficient quota"
- Your $5 credit might be used up
- Add $5-$10 to your account
- Go to: https://platform.openai.com/account/billing

### "Rate limit exceeded"
- Free tier has rate limits
- Wait a few minutes and try again
- Or upgrade to paid plan

---

## 💡 Pro Tip

After you get $5 credit:
- **Monitor usage:** https://platform.openai.com/usage
- **Set spending limit:** https://platform.openai.com/account/billing/limits
- **Check balance:** Shown in billing section

---

**Just sign up and get your key!** 

**No service accounts, no OAuth, no confusion!** 

**Works in 3 minutes!** 🎊
