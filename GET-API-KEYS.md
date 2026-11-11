# 🔑 How to Get API Keys for Light Native

Your app needs valid API keys to work. Follow these steps:

---

## 1. Get Gemini API Key (Required - FREE)

### Step 1: Go to Google AI Studio
Visit: **https://makersuite.google.com/app/apikey**

### Step 2: Sign in with Google
Use any Google account (Gmail)

### Step 3: Click "Create API Key"
- Click "Create API key in new project" or "Create API key"
- Copy the key (starts with `AIzaSy...`)

### Step 4: Add to your app
Open: `src/config/init-api-keys.local.ts`

Replace the Gemini key:
```typescript
setAPIKey('gemini', 'AIzaSy_YOUR_ACTUAL_KEY_HERE');
```

**Cost:** FREE - 60 requests per minute

---

## 2. Get Claude API Key (Optional - PAID)

### Step 1: Go to Anthropic Console
Visit: **https://console.anthropic.com/**

### Step 2: Sign up / Sign in
Create an account or log in

### Step 3: Go to API Keys
- Click "API Keys" in left sidebar
- Click "Create Key"
- Copy the key (starts with `sk-ant-...`)

### Step 4: Add to your app
Open: `src/config/init-api-keys.local.ts`

Update the Claude key:
```typescript
setAPIKey('claude', 'sk-ant-YOUR_ACTUAL_KEY_HERE');
```

**Cost:** $3 per million input tokens, $15 per million output tokens
**Free credits:** $5 credit when you sign up

---

## 3. Get OpenAI API Key (Optional - PAID)

### Step 1: Go to OpenAI Platform
Visit: **https://platform.openai.com/api-keys**

### Step 2: Sign up / Sign in
Create an account or log in

### Step 3: Create API Key
- Click "Create new secret key"
- Give it a name (e.g., "Light Native")
- Copy the key (starts with `sk-...`)

### Step 4: Add to your app
Open: `src/config/init-api-keys.local.ts`

Update the OpenAI key:
```typescript
setAPIKey('openai', 'sk-YOUR_ACTUAL_KEY_HERE');
```

**Cost:** $0.15 per million input tokens (GPT-4-turbo)
**Free credits:** $5 credit (expires after 3 months)

---

## 📝 Your init-api-keys.local.ts File Should Look Like:

```typescript
/**
 * YOUR LOCAL API KEYS
 * This file is git-ignored and safe to add keys
 */

import { setAPIKey } from '../lib/ai-providers';

export function initializeMyAPIKeys() {
  // Gemini API Key (REQUIRED - Get from https://makersuite.google.com/app/apikey)
  setAPIKey('gemini', 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  
  // Claude API Key (OPTIONAL - Get from https://console.anthropic.com/)
  setAPIKey('claude', 'sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  
  // OpenAI API Key (OPTIONAL - Get from https://platform.openai.com/api-keys)
  setAPIKey('openai', 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  
  console.log('[API Keys] ✅ All keys loaded from local file');
}
```

---

## 🎯 Quick Start (Minimum Required)

**To get the app working NOW:**

1. **Get Gemini key** (5 minutes, FREE)
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Update local file**
   - Open: `src/config/init-api-keys.local.ts`
   - Replace the Gemini key with your new key
   - Save the file

3. **Rebuild the app**
   ```bash
   npm run android
   ```

4. **Test it**
   - Say "Hello Light"
   - Should now respond!

---

## 🔍 Troubleshooting

### "API key not valid" error
- Your key is expired or incorrect
- Generate a new key from the provider
- Make sure you copied the entire key

### "Claude API key not configured"
- This is OK! The app will fall back to Gemini
- Only add Claude if you want better responses

### "All AI providers failed"
- Check internet connection
- Verify Gemini key is valid
- Check logs: `adb logcat | grep "\[AI\]"`

---

## 💰 Cost Comparison

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| **Gemini** | 60 req/min FREE | Daily use, testing |
| **Claude** | $5 credit | Complex tasks, reasoning |
| **OpenAI** | $5 credit (3 months) | General purpose |

**Recommendation:** Start with **Gemini only** (free forever)

---

## 🚀 Next Steps

1. Get your Gemini API key
2. Update `init-api-keys.local.ts`
3. Rebuild: `npm run android`
4. Test: Say "Hello Light"
5. If working, optionally add Claude/OpenAI for better responses

**Need help?** Check the logs:
```bash
adb logcat | grep -E "\[AI\]|\[Gemini\]|\[Claude\]"
```
