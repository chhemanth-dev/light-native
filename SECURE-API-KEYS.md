# Secure API Key Management

## 🔒 Important: DO NOT Commit API Keys to Git!

GitHub blocked your push because it detected the Claude API key in the code. This is good - it's protecting your account!

---

## ✅ Secure Solution: Store Keys Locally

### Method 1: Using App Settings (Recommended)

**Create Settings Screen:**

```typescript
// app/(tabs)/settings.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { saveAPIKey, loadAPIKey } from '../../src/config/api-keys';
import { setAPIKey } from '../../src/lib/ai-providers';

export default function SettingsScreen() {
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (claudeKey) {
      await saveAPIKey('claude', claudeKey);
      setAPIKey('claude', claudeKey);
    }
    if (openaiKey) {
      await saveAPIKey('openai', openaiKey);
      setAPIKey('openai', openaiKey);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Keys</Text>
      
      <Text style={styles.label}>Claude API Key</Text>
      <TextInput
        style={styles.input}
        value={claudeKey}
        onChangeText={setClaudeKey}
        placeholder="sk-ant-..."
        placeholderTextColor="#64748B"
        secureTextEntry
      />

      <Text style={styles.label}>OpenAI API Key</Text>
      <TextInput
        style={styles.input}
        value={openaiKey}
        onChangeText={setOpenaiKey}
        placeholder="sk-..."
        placeholderTextColor="#64748B"
        secureTextEntry
      />

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>
          {saved ? '✓ Saved!' : 'Save Keys'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        Keys are stored securely on your device and never leave your phone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050810', padding: 20 },
  title: { color: '#E2E8F0', fontSize: 24, fontWeight: '600', marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 14, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  note: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
```

### Method 2: Load from Secure Storage at Startup

**Update app/_layout.tsx:**

```typescript
import { initializeAPIKeys } from '../src/config/api-keys';
import { setAPIKey } from '../src/lib/ai-providers';

useEffect(() => {
  (async () => {
    // ... existing code ...
    
    // Load API keys from secure storage
    const keys = await initializeAPIKeys();
    if (keys.claude) {
      setAPIKey('claude', keys.claude);
    }
    if (keys.openai) {
      setAPIKey('openai', keys.openai);
    }
  })();
}, []);
```

---

## 🔑 How to Add Your Claude Key (Safe Way)

### Option 1: Through App Settings (After Rebuild)

1. Rebuild app without the key in code
2. Open app → Settings
3. Paste your Claude API key
4. It's stored securely on device only

### Option 2: Set Programmatically (For Now)

**In your assistant.ts or wherever you initialize:**

```typescript
import { setAPIKey } from './lib/ai-providers';

// Set Claude key at runtime (not in committed code)
setAPIKey('claude', 'YOUR_CLAUDE_KEY_HERE');
```

---

## 🚫 What NOT to Do

❌ **DON'T** put API keys directly in code files  
❌ **DON'T** commit .env files with real keys  
❌ **DON'T** share keys in screenshots or docs  

## ✅ What TO Do

✅ **DO** store keys in Expo SecureStore  
✅ **DO** use .gitignore for .env files  
✅ **DO** load keys at runtime  
✅ **DO** provide UI for users to add their own keys  

---

## 📝 Current Setup

**Your key is safe locally!** The file `src/lib/ai-providers.ts` now has empty placeholders.

**To use your Claude key:**

1. **Quick Fix (For Testing):**
   ```typescript
   // In app/_layout.tsx, add after imports:
   import { setAPIKey } from '../src/lib/ai-providers';
   
   // In useEffect:
   setAPIKey('claude', 'YOUR_CLAUDE_KEY_HERE'); // Replace with your actual key
   ```

2. **Proper Fix (For Production):**
   - Implement settings screen above
   - Users enter their own keys
   - Keys stored in SecureStore

---

## 🛡️ Security Best Practices

1. **Never commit API keys to Git**
2. **Use environment variables for development**
3. **Use SecureStore for production**
4. **Rotate keys if exposed**
5. **Let users provide their own keys**

---

## 🔄 Next Steps

1. **Amend the commit to remove the key:**
   ```bash
   git reset HEAD~1
   git add .
   git commit -m "Secure API key storage setup"
   git push origin main
   ```

2. **Add the key at runtime (see Quick Fix above)**

3. **Rebuild and test:**
   ```powershell
   npm run android
   ```

4. **(Optional) Create settings UI for users to add keys**

---

**Your Claude key is safe on your local machine!** Just don't push it to Git. 🔒
