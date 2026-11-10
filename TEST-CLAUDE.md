# Testing Claude AI Integration

## ✅ Your Claude API Key is Configured!

**API Key:** `sk-ant-usr-15mE5sib4o8CEjqu6OO48Kw498...` ✅

---

## 🚀 How to Use Claude

### Method 1: Set Claude as Default (Recommended)

**File:** `src/lib/gemini.ts`

Find this line (around line 50):
```typescript
let currentProvider: AIProvider = 'auto'; // Will try all providers
```

Change to:
```typescript
let currentProvider: AIProvider = 'claude'; // Use Claude by default
```

### Method 2: Create AI Settings UI

Add a settings screen where users can choose:
- Gemini (Fast, Free)
- Claude (Smart, Anthropic)
- OpenAI (GPT-4)
- Auto (Try all until one works)

---

## 🧪 Testing Claude

### 1. Rebuild the App
```powershell
cd light-native-main
npm run android
```

### 2. Test Basic Conversation
```
Say: "Hello Light, can you hear me?"

Expected Response (from Claude):
"Good day, sir. Yes, I can hear you perfectly. How may I assist you today?"
```

### 3. Test Complex Query
```
Say: "Explain quantum computing in simple terms"

Expected: Detailed, well-structured explanation (Claude excels at this)
```

### 4. Test Message Drafting
```
Say: "Draft a reply to Sarah saying I'll be late"

Expected: Professional, context-aware message draft
```

### 5. Compare Providers

**Test with Auto mode:**
```typescript
// In src/lib/gemini.ts
let currentProvider: AIProvider = 'auto';
```

Say the same question multiple times - it will try:
1. Gemini first (fastest)
2. Claude if Gemini fails
3. OpenAI if both fail

---

## 🎯 Claude vs Gemini

| Feature | Gemini | Claude |
|---------|--------|--------|
| **Speed** | Very Fast ⚡ | Fast |
| **Cost** | Free | Paid |
| **Quality** | Good | Excellent 🌟 |
| **Context** | 2K tokens | 200K tokens |
| **Best For** | Quick answers | Complex reasoning |
| **Tone** | Direct | More thoughtful |

**Recommendation:** Use **Auto mode** - gets best of both worlds!

---

## 🔧 Advanced Configuration

### Set Provider Programmatically

Create a new file: `src/store/aiStore.ts`

```typescript
import { create } from 'zustand';
import { setAIProvider, AIProvider } from '../lib/ai-providers';

interface AIStore {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  provider: 'auto',
  setProvider: (provider) => {
    setAIProvider(provider);
    set({ provider });
  },
}));
```

### Add Settings Screen

Create: `app/(tabs)/settings.tsx`

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAIStore } from '../../src/store/aiStore';

export default function SettingsScreen() {
  const { provider, setProvider } = useAIStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Provider</Text>
      
      <Pressable 
        style={[styles.option, provider === 'auto' && styles.selected]}
        onPress={() => setProvider('auto')}
      >
        <Text style={styles.optionText}>
          🤖 Auto (Recommended)
        </Text>
        <Text style={styles.description}>
          Tries all providers for best reliability
        </Text>
      </Pressable>

      <Pressable 
        style={[styles.option, provider === 'gemini' && styles.selected]}
        onPress={() => setProvider('gemini')}
      >
        <Text style={styles.optionText}>
          ⚡ Gemini (Google)
        </Text>
        <Text style={styles.description}>
          Fast responses, free
        </Text>
      </Pressable>

      <Pressable 
        style={[styles.option, provider === 'claude' && styles.selected]}
        onPress={() => setProvider('claude')}
      >
        <Text style={styles.optionText}>
          🧠 Claude (Anthropic)
        </Text>
        <Text style={styles.description}>
          Best for complex reasoning
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050810', padding: 20 },
  title: { color: '#E2E8F0', fontSize: 24, fontWeight: '600', marginBottom: 20 },
  option: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  selected: { borderColor: '#3B82F6' },
  optionText: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  description: { color: '#64748B', fontSize: 14 },
});
```

---

## 📊 Monitor Which Provider is Used

Add logging to see which AI responds:

**In your assistant response handler:**
```typescript
// After getting AI response
console.log(`[AI] Response from: ${response.provider}`);

// Show to user (optional)
if (response.provider === 'claude') {
  console.log('[AI] Using Claude (Anthropic)');
} else if (response.provider === 'gemini') {
  console.log('[AI] Using Gemini (Google)');
}
```

---

## 🎭 Personality Differences

### Gemini Style:
```
User: "What's the weather?"
Gemini: "The current weather is 72°F and sunny, sir."
```

### Claude Style:
```
User: "What's the weather?"
Claude: "Good afternoon, sir. The current weather conditions show a pleasant 72°F with clear, sunny skies. Quite agreeable for any outdoor activities you might have planned."
```

**Claude tends to be more elaborate and thoughtful.**

---

## 🐛 Troubleshooting

### Claude Not Responding?

1. **Check API Key:**
   ```typescript
   console.log('[AI] Claude key configured:', !!API_KEYS.claude);
   ```

2. **Check Response:**
   ```typescript
   try {
     const response = await callAI(messages, 'claude');
     console.log('[AI] Claude response:', response);
   } catch (error) {
     console.error('[AI] Claude error:', error);
   }
   ```

3. **Verify API Credits:**
   - Go to: https://console.anthropic.com/
   - Check your credits/billing

4. **Test API Key:**
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","messages":[{"role":"user","content":"Hello"}],"max_tokens":1024}'
   ```

---

## ✅ Checklist

- [x] Claude API key added
- [ ] Rebuild app (`npm run android`)
- [ ] Test basic conversation
- [ ] Test complex reasoning
- [ ] Compare with Gemini
- [ ] Choose preferred provider
- [ ] (Optional) Add settings UI

---

## 🎉 Next Steps

1. **Rebuild app now:**
   ```powershell
   npm run android
   ```

2. **Test Claude:**
   - Say: "Hello Light"
   - Watch logs to see which provider responds
   - Compare quality with Gemini

3. **Choose your favorite:**
   - **Auto**: Best reliability (tries all)
   - **Gemini**: Fastest, free
   - **Claude**: Best quality

4. **Push to Git:**
   ```bash
   git add src/lib/ai-providers.ts
   git commit -m "Added Claude API key"
   git push origin main
   ```

---

**Your app now has TWO AI brains!** 🧠🧠

Claude will provide more thoughtful, detailed responses while Gemini keeps things fast and efficient. With Auto mode, you get the best of both! 🚀
