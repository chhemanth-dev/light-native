# Light — Personal AI Assistant for Android

A fully offline-capable Android assistant that reads your notifications hands-free,
manages reminders with voice, and responds in a Jarvis-style British voice.
All data stays on your device. Nobody else can read it.

---

## Get the APK in 30 minutes

### Step 1 — Install tools (one time only)

1. **Node.js 18+** → https://nodejs.org  (download and install)
2. **EAS CLI** — open Command Prompt and run:
   ```
   npm install -g eas-cli
   ```
3. **Expo account** (free) → https://expo.dev/signup

### Step 2 — Build

Open Command Prompt, paste these commands one by one:

```cmd
cd C:\Users\HP\Downloads\light-native

npm install

eas login

eas build --platform android --profile preview
```

- `eas login` → enter your Expo username/password
- `eas build` → takes 10–15 minutes on Expo's servers (free tier included)
- When done, Expo prints a **download link** for the APK

### Step 3 — Install on your phone

1. Open the download link on your phone (or scan the QR code Expo shows)
2. Download the APK
3. Open it — Android will ask "Install from unknown sources" → tap **Settings → Allow**
4. Install and open **Light**

### Step 4 — First run

1. Enter your name
2. Set a 4-digit PIN (locks your messages from other users)
3. Grant permissions:
   - **Microphone** → for wake word + voice commands
   - **Notification Access** → Light opens Android settings, find "Light" and enable it
   - **Post Notifications** → for reminders

That's it. Say **"Hey Light"** and it responds.

---

## What it does

| Say this | Light does |
|---|---|
| "Hey Light" | Wakes up, greets you |
| "Do I have any messages?" | Reads all unread notifications aloud |
| "Any WhatsApp messages?" | Reads WhatsApp notifications specifically |
| "Remind me to call mum at 6pm" | Sets a reminder, confirms it |
| "What are my reminders?" | Lists upcoming reminders aloud |
| "Draft a reply" | Suggests a reply, opens a sheet to copy/share it |
| "What time is it?" | Tells you the time |
| "Forget our conversation" | Wipes chat history |

---

## Works offline?

| Feature | Online needed? |
|---|---|
| Wake word "Hey Light" | ❌ Never |
| Reading notifications | ❌ Never |
| Setting/firing reminders | ❌ Never |
| Jarvis TTS voice | ❌ Never |
| Gemini Nano AI responses | ❌ Never (Android 14+) |
| Rule-based fallback AI | ❌ Never (all Android 8+ devices) |

The app works **entirely offline**. Internet is only used if you choose to
add cloud features later.

---

## Privacy

- All messages stored in **encrypted SQLite** on your device
- PIN + biometric lock — nobody else using your phone can read your messages
- Conversation history is **cleared between sessions** unless you ask Light to recall it
- Light **never sends** any message — it only suggests drafts

---

## Permissions explained

| Permission | Why |
|---|---|
| Microphone | Wake word + voice command recognition |
| Notification Access | Reads notifications from WhatsApp, Gmail, Instagram etc. |
| Post Notifications | Fires reminder pop-ups |
| Biometric/Fingerprint | Unlocks the app |
| Record Audio | Required for continuous speech recognition |
| Receive Boot Completed | Restarts wake word listener after reboot |

---

## Project structure

```
android/                    Full Android project (Kotlin + Gradle)
  app/src/main/
    AndroidManifest.xml     All permissions + service declarations
    java/com/lightnative/
      MainApplication.kt    Registers all native modules
      MainActivity.kt       React Native activity
      LightPackage.kt       Registers all custom modules
      LightNotificationService.kt  Reads all app notifications
      WakeWordForegroundService.kt Keeps wake word alive in background
      BootReceiver.kt       Restarts service after reboot

modules/
  notification-listener/   NotificationListenerModule.kt + expo plugin
  gemini-nano/             GeminiNanoModule.kt (AICore) + expo plugin
  wake-word/               WakeWordModule.kt + SpeechModule.kt + expo plugin

src/
  lib/
    db.ts          SQLite — messages, reminders, conversation history
    vault.ts       Encrypted PIN + biometric auth
    voice.ts       Jarvis TTS — British male, tuned pitch/rate
    gemini.ts      Gemini Nano AI + offline rule-engine fallback
    reminders.ts   Natural language parsing + scheduling
    notifications.ts  Notification listener bridge
    wakeword.ts    Continuous wake-word detection
    assistant.ts   Main orchestrator
  hooks/
    useAssistant.ts    Wires assistant to React state
    useWakeWord.ts     Wake word hook
    useNotifications.ts Notification listener hook
  store/
    appStore.ts    Zustand global state
  components/
    OrbAnimation.tsx      Animated orb (idle/listening/thinking/speaking)
    TranscriptBubble.tsx  Conversation display
    StatusBar.tsx         State indicator bar
    DraftReplySheet.tsx   Copy/share draft replies

app/
  _layout.tsx          Root routing (setup → lock → tabs)
  setup.tsx            First-run setup
  lock.tsx             Biometric/PIN lock screen
  (tabs)/
    index.tsx          Main orb screen
    messages.tsx       All collected messages
    reminders.tsx      Upcoming reminders
    settings.tsx       Privacy & preferences
```
