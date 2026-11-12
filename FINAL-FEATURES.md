# Light Native - Complete Feature List

## 🎯 Core Features That Work WITHOUT AI

### ⏰ Voice Reminders (No Internet/API Needed)
**Examples:**
- "Remind me in 1 minute to check oven"
- "Remind me in 2 minutes"
- "Remind me in 30 seconds"
- "Remind me in 5 hours to call mom"
- "Remind me at 3pm to take medicine"
- "Remind me tomorrow at 9am for meeting"

**How it works:**
- ✅ Parses voice commands locally (NO AI)
- ✅ Works offline
- ✅ Zero API costs
- ✅ Instant response
- ✅ Supports: seconds, minutes, hours, specific times, tomorrow

---

### 📱 Voice App Opening (No Internet/API Needed)
**Examples:**
- "Open WhatsApp"
- "Launch Instagram"
- "Start YouTube"
- "Open Camera"
- "Launch any installed app"

**How it works:**
- ✅ Discovers ALL installed apps automatically
- ✅ Updates app list every 5 minutes
- ✅ Works offline
- ✅ Zero API costs
- ✅ Instant response
- ✅ Smart matching (finds apps even with partial names)

**Safety:**
- 🔒 Payment apps blocked (PhonePe, Paytm, Google Pay)
- 🔒 Banking apps blocked automatically
- 🔒 Detects payment keywords in package names
- 🔒 Cannot be bypassed via voice

---

## 🤖 Features That Use AI (When Available)

### 💬 Smart Conversations
- Ask questions
- Get explanations
- Have natural conversations
- Context-aware responses

### 🔍 Web Search
- Current information
- Weather updates
- Facts and data

### ✉️ Message Drafting
- AI suggests replies to notifications
- Draft messages via voice
- Smart auto-replies

---

## 🎛️ Settings & Customization

### 🔑 API Key Management (In-App)
**No rebuild needed when keys expire!**

**Location:** Settings → AI Provider & API Keys

**Supported Providers:**
- OpenAI (GPT-4) - Recommended, $5 free credit
- Claude (Anthropic) - Best reasoning
- Gemini (Google) - Fast responses

**How to change keys:**
1. Go to Settings tab
2. Tap "AI Provider & API Keys"
3. Paste your new key
4. Tap "Save Keys"
5. Works immediately!

**Keys are:**
- 🔒 Encrypted and stored locally
- 🔒 Never leave your device
- ♻️ Can be updated anytime
- ⚡ Activate instantly when saved

---

### 📍 Tab Bar Position
- Increased height (90px with 28px bottom padding)
- Won't accidentally hit home/back buttons
- Comfortable tap targets

---

## 📋 Manual Features (UI Forms)

### ➕ Create Reminders Manually
**Location:** Reminders tab → + Add button

**Options:**
- Quick times: 30min, 1hr, 2hrs, Tomorrow 9am
- Custom date picker
- Custom time picker
- Enter any title

**No AI or voice needed!**

---

## 🔐 Privacy & Security

### API Keys
- Stored with SecureStore (encrypted)
- Never committed to Git
- Only on your device

### Payment App Protection
- Cannot open via voice commands
- Includes: PhonePe, Paytm, GPay, all banks
- Auto-detects by package name keywords
- Manual opening always works

### Data Storage
- Local SQLite database
- Conversation history on device
- No cloud sync
- You control your data

---

## 🎤 Voice Commands Reference

### Reminders (Works Offline)
```
"Remind me in 1 minute to..."
"Remind me in 30 seconds"
"Remind me in 2 hours"
"Remind me at 5pm to..."
"Remind me tomorrow at 9am"
```

### Apps (Works Offline)
```
"Open WhatsApp"
"Launch Instagram"
"Start YouTube"
"Open Camera"
"Launch Chrome"
```

### Messages (Needs AI)
```
"Read my messages"
"What notifications do I have?"
"Show me my WhatsApp messages"
```

### Calls (Works Offline)
```
"Call Mom"
"Call 9876543210"
```

### Time & Date (Works Offline)
```
"What time is it?"
"What's the date?"
"What day is it?"
```

### Conversation (Needs AI)
```
"What's the weather?"
"Tell me about..."
"How do I..."
"Explain..."
```

---

## ⚙️ Technical Details

### Requirements
- Android 8.0+ (API 26+)
- Microphone permission (voice)
- Notification access (read notifications)
- Accessibility service (auto-send messages)
- Phone permission (make calls)

### AI Providers
- OpenAI GPT-4 (Recommended)
- Claude 3.5 Sonnet
- Gemini 1.5 Flash
- Auto-fallback if one fails

### Storage
- SecureStore for API keys (encrypted)
- SQLite for messages/reminders
- AsyncStorage for preferences

---

## 📖 Documentation Files

- `HOW-TO-CHANGE-API-KEYS.md` - Update API keys in-app
- `GET-OPENAI-KEY-SIMPLE.md` - Get OpenAI key ($5 free)
- `WHATS-NEW.md` - Feature list and updates
- `QUICK-TEST.md` - Testing guide
- This file - Complete feature reference

---

## 🚀 What Makes Light Special

### 1. Offline Core Features
Unlike other AI assistants, Light's core features work WITHOUT internet:
- Set reminders via voice
- Open any app via voice
- Make calls
- Check time/date

### 2. No Rebuild for API Changes
When your API key runs out:
- Just update it in Settings
- No need to rebuild app
- Works immediately
- Zero downtime

### 3. Smart App Discovery
- Auto-detects ALL installed apps
- Works with any app on your phone
- Updates automatically
- No manual configuration

### 4. Safety First
- Payment apps protected
- Can't accidentally voice-trigger banking
- Security by default

### 5. Multi-AI Support
- Try 3 providers automatically
- If one fails, tries next
- Best reliability
- No single point of failure

---

## 💡 Pro Tips

1. **Use voice for quick tasks** - Reminders and app opening work offline
2. **Update API keys in Settings** - No rebuild needed when balance runs out
3. **Enable Accessibility** - For auto-sending messages without confirmation
4. **Say "Hey Light"** - Wake word detection (when enabled)
5. **1-2 minute reminders** - Great for cooking timers!

---

## 🐛 Troubleshooting

**"No API keys configured"**
→ Go to Settings → AI Provider & API Keys → Add a key

**Reminders not working via voice**
→ They should work! Check logs. Reminders work offline.

**App won't open via voice**
→ Make sure app is installed. Payment apps are blocked for safety.

**"Credit balance too low"**
→ Update API key in Settings (no rebuild needed!)

**AI not responding**
→ Check internet. But reminders/apps work offline!

---

**Version:** 1.0.0  
**Last Updated:** 2026-11-12  
**Platform:** Android 8.0+  
**Framework:** React Native + Expo
