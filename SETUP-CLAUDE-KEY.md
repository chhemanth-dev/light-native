# Quick Setup: Add Your Claude API Key

## 🎯 Easiest Method (For Local Development)

### 1. Create a Local File (Git-Ignored)

Create: `src/config/init-api-keys.local.ts`

```typescript
import { setAPIKey } from '../lib/ai-providers';

export function initializeMyAPIKeys() {
  // Add your Claude key here (this file is git-ignored)
  setAPIKey('claude', 'sk-ant-usr-YOUR_ACTUAL_KEY_HERE');
  
  console.log('[API Keys] Claude key loaded');
}
```

### 2. Load It in App Startup

Edit: `app/_layout.tsx`

Add at the top:
```typescript
import { initializeMyAPIKeys } from '../src/config/init-api-keys.local';
```

In the first `useEffect`:
```typescript
useEffect(() => {
  (async () => {
    try {
      // Initialize API keys FIRST
      initializeMyAPIKeys();
      
      // Initialize notifications
      await initializeNotifications();
      
      // ... rest of your code ...
    } catch (err) {
      console.error("Error during app initialization:", err);
      setInitialRoute("/setup");
    } finally {
      setReady(true);
    }
  })();
}, []);
```

### 3. Rebuild and Test

```powershell
npm run android
```

Say: **"Hello Light"**

It will use Claude! 🎉

---

## ✅ Done!

- Your key is in `*.local.ts` (git-ignored)
- Never gets committed to Git
- Works immediately
- Easy to update

---

## 🔄 To Switch Between AI Providers

```typescript
import { setAIProvider } from '../src/lib/gemini';

// Use Claude only
setAIProvider('claude');

// Use Gemini only  
setAIProvider('gemini');

// Try all (recommended)
setAIProvider('auto');
```

---

## 🚀 Your Key from .env File (Original)

```
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
```

Copy this into your `init-api-keys.local.ts` file!
