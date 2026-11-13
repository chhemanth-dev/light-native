# Multiple API Keys - User Guide

## Overview

Light Native now supports **multiple API keys per provider** with automatic failover! This means you can add backup keys that will be used automatically if your primary key runs out of balance or fails.

---

## 🎯 Key Features

### 1. **PRIMARY Key System**
- The **first key you add** is always your PRIMARY key
- Light will always try the PRIMARY key first
- Only if PRIMARY fails will backup keys be used

### 2. **BACKUP Keys**
- Add as many backup keys as you want
- They're tried in order if PRIMARY fails
- Perfect for multiple accounts or redundancy

### 3. **Auto-Rotation**
- When a key fails, Light automatically switches to the next one
- Rotation resets on success (always prefers PRIMARY)
- Stops after trying all keys once (no infinite loops)

### 4. **Real-Time Updates**
- Add or remove keys anytime - no app rebuild needed!
- Changes take effect immediately
- Works even while the app is running

---

## 📱 How to Use

### Adding Your First Key (PRIMARY)

1. Open Light Native app
2. Go to **Settings** tab (bottom right)
3. Tap **"AI Provider & API Keys"**
4. Scroll to the provider section (OpenAI, Claude, or Gemini)
5. Paste your API key in the input field
6. Tap **"+ Add"** button
7. You'll see: **"🎯 PRIMARY KEY"** with your masked key

### Adding Backup Keys

1. After adding PRIMARY key, the input field remains
2. Paste your second API key
3. Tap **"+ Add"** again
4. You'll see: **"⚙️ BACKUP KEY #1"**
5. Repeat for more backup keys

### Removing Keys

1. Find the key you want to remove
2. Tap the **red "✕" button** on the right
3. Confirm removal
4. If you remove PRIMARY key, the first BACKUP becomes new PRIMARY

---

## 🎨 Visual Guide

### Key Display Format

```
🚀 OpenAI API Keys                          [1 key]
┌─────────────────────────────────────────────────┐
│ 🎯 PRIMARY KEY                                  │
│ sk-proj-1234...abcd                          ✕  │
└─────────────────────────────────────────────────┘

[Input field: Add OpenAI API key...]  [+ Add]
```

With multiple keys:

```
🚀 OpenAI API Keys                         [3 keys]
┌─────────────────────────────────────────────────┐
│ 🎯 PRIMARY KEY                                  │
│ sk-proj-1234...abcd                          ✕  │
├─────────────────────────────────────────────────┤
│ ⚙️ BACKUP KEY #1                               │
│ sk-proj-5678...efgh                          ✕  │
├─────────────────────────────────────────────────┤
│ ⚙️ BACKUP KEY #2                               │
│ sk-proj-9012...ijkl                          ✕  │
└─────────────────────────────────────────────────┘

[Input field: Add OpenAI API key...]  [+ Add]
```

---

## 🔄 How Rotation Works

### Example Scenario:

**You have:**
- OpenAI PRIMARY: `sk-proj-AAA...` (expired)
- OpenAI BACKUP #1: `sk-proj-BBB...` (active)
- OpenAI BACKUP #2: `sk-proj-CCC...` (active)

**What happens when you talk to Light:**

1. ✗ Tries PRIMARY (`sk-proj-AAA...`) → Fails (expired)
2. 🔄 Auto-rotates to BACKUP #1
3. ✓ Tries BACKUP #1 (`sk-proj-BBB...`) → Success!
4. Response returned to you

**Next time you talk:**

1. ✓ Tries PRIMARY again (`sk-proj-AAA...`) → Still fails
2. 🔄 Rotates to BACKUP #1 again
3. ✓ Success!

**If PRIMARY is fixed:**

1. ✓ Tries PRIMARY (`sk-proj-AAA...`) → Success!
2. 🔄 Rotation resets (back to using PRIMARY first)

---

## 🛡️ Security Features

### Secure Storage
- All keys encrypted using Expo SecureStore
- On mobile: Hardware-backed encryption
- On web: Secure localStorage (browser encryption)

### Masked Display
- Keys shown as: `sk-proj-1234...abcd`
- Only first 12 + last 4 characters visible
- Full key never displayed in UI

### No Cloud Sync
- Keys stored **only on your device**
- Never sent to Light's servers
- Never committed to Git

---

## 💡 Best Practices

### 1. **Start with One Key**
Add your PRIMARY key first, test it works, then add backups.

### 2. **Label Your Keys** (in your provider's dashboard)
- Name them: "Light-Primary", "Light-Backup-1", etc.
- Makes it easy to track usage and billing

### 3. **Monitor Your Balance**
- Check your provider dashboard regularly
- Add backup keys before PRIMARY expires
- Light can't add keys for you automatically

### 4. **Remove Old Keys**
- When a key expires, remove it from Light
- Keeps the rotation fast and clean
- Prevents unnecessary API calls

### 5. **Use "Auto" Provider Mode**
- Set AI Provider to **"Auto (Recommended)"**
- Light tries OpenAI → Claude → Gemini
- Maximum reliability with multi-key rotation!

---

## 🔧 Troubleshooting

### "No API keys found" Error

**Cause:** All keys have been tried and failed.

**Solutions:**
1. Check your keys in provider dashboard (expired? valid?)
2. Add fresh keys via AI Settings
3. Check internet connection
4. Verify key format matches provider

### Keys Not Working After Adding

**Solutions:**
1. Wait 5 seconds (storage sync)
2. Close and reopen AI Settings screen
3. Restart the app if needed
4. Check provider status page (OpenAI/Claude outage?)

### Duplicate Key Warning

**Cause:** You're trying to add a key that already exists.

**Solution:** Check your existing keys list - it's probably already added!

---

## 📊 Provider Comparison

| Provider | Free Tier | Speed | Quality | Best For |
|----------|-----------|-------|---------|----------|
| **OpenAI** | No (paid only) | Fast | Excellent | Complex tasks, creativity |
| **Claude** | No (paid only) | Fast | Excellent | Reasoning, long context |
| **Gemini** | Yes! | Very Fast | Good | Quick tasks, free usage |

### Recommendation:
- **PRIMARY:** OpenAI (gpt-4o-mini is cheap and great)
- **BACKUP 1:** Claude (for when OpenAI fails)
- **BACKUP 2:** Gemini (free fallback!)

---

## 🎯 Quick Reference

### Commands in AI Settings:

| Action | Steps |
|--------|-------|
| Add key | Paste → Tap "+ Add" |
| Remove key | Tap "✕" button → Confirm |
| View count | See badge next to provider name |
| Check status | Scroll to "Provider Status" section |
| Change PRIMARY | Remove current PRIMARY (first backup becomes new PRIMARY) |

### Key Indicators:

- 🎯 = PRIMARY KEY (always tried first)
- ⚙️ = BACKUP KEY (used if PRIMARY fails)
- ✓ = Key configured and ready
- ○ = No keys added yet

---

## 🚀 Pro Tips

1. **Set up all three providers** for maximum reliability
2. **Add 2-3 keys per provider** for redundancy
3. **Keep PRIMARY key balance higher** than backups
4. **Use gpt-4o-mini** (OpenAI) for cost-effective AI
5. **Enable "Auto" mode** and forget about it!

---

## 📞 Need Help?

If you're stuck:
1. Check this guide again
2. Review the MULTI-KEY-GUIDE.md (technical details)
3. Open an issue on GitHub
4. Check provider documentation (OpenAI/Claude/Gemini)

---

## 🎉 Success Checklist

✅ Added PRIMARY key for at least one provider  
✅ Tested it works (ask Light a question)  
✅ Added at least one BACKUP key  
✅ Verified keys appear in Settings  
✅ Enabled "Auto" provider mode  
✅ Ready to use Light without worrying about balance!  

---

**Made with ❤️ for Light Native users**
