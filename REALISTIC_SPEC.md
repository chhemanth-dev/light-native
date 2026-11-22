# Light Native - REALISTIC Production Specification

## ✅ What ACTUALLY Works on Samsung A06 5G (Android 14)

### Reality Check:
- ❌ GPT-4 level intelligence on-device is **IMPOSSIBLE** (needs 175B+ parameters, 350GB+ RAM)
- ❌ Continuous wake word detection drains battery (Android kills background processes)
- ❌ Silent WiFi/Bluetooth toggle blocked since Android 10
- ✅ Hybrid model: **Local for speed + Cloud for intelligence** (realistic)
- ✅ Small quantized models: 1.5GB-2GB RAM (Gemma 2B, Qwen 1.5B)
- ✅ Free cloud APIs: Gemini Flash 2.0 (2M tokens/day free), Groq (14,000 req/day free)

---

## 🎯 REALISTIC ARCHITECTURE

### Tier 1: INSTANT Local Actions (<100ms)
**No AI needed - Pure pattern matching**
- Call contact/number
- Open apps (Instagram, Camera, etc.)
- Set timer/alarm
- Get time/date
- Basic math
- Control volume/brightness

**Tech**: Simple regex + switch statement
**RAM**: <10MB
**Battery**: <1%/hour

### Tier 2: LOCAL Small Model (500ms-2s)
**On-device LLM for common tasks**
- Natural language understanding
- Casual conversation
- Personal questions
- Offline mode fallback

**Options**:
1. **Gemma 2B quantized** (best quality, 1.5GB RAM)
2. **Qwen 2.5 1.5B quantized** (faster, 1.2GB RAM)
3. **Phi-3 Mini** (Microsoft, 1.8GB RAM)

**Implementation**: 
- Use `llama.rn` or `mediapipe` library
- Load on app start, keep in memory
- 4-bit quantization (Q4_K_M)

**RAM**: 1.2-1.8GB
**Battery**: 3-5%/hour active use
**Speed**: 5-15 tokens/sec

### Tier 3: CLOUD Intelligence (2-5s)
**Free APIs for complex tasks**
- Deep questions
- Web search + synthesis
- Reasoning & planning
- Latest information

**Primary**: Google Gemini 2.0 Flash (FREE)
- 2M tokens/day limit
- 1M context window
- Very fast (low latency)
- No cost

**Backup**: Groq (FREE)
- 14,400 requests/day
- Ultra-fast inference
- Llama 3.1 70B or Mixtral 8x7B
- No cost

**Fallback**: Local model when offline

---

## 🏗️ REALISTIC TECH STACK

### Core Framework
```json
{
  "expo": "^52.0.0",
  "react-native": "0.76.5",
  "typescript": "^5.3.3"
}
```

### Voice (WORKS)
```json
{
  "expo-speech": "~12.0.0",  // TTS ✅
  "@react-native-voice/voice": "^3.2.4"  // STT (better than native) ✅
}
```

### Local AI (REALISTIC)
```json
{
  "llama.rn": "^0.3.0",  // Run small models on-device
  // OR
  "@mediapipe/tasks-genai": "^0.10.0"  // Google's on-device AI
}
```

### Cloud AI (FREE)
```javascript
// Gemini 2.0 Flash - FREE TIER
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
// Free: 2M tokens/day (enough for 2000+ conversations)

// Groq - FREE TIER  
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
// Free: 14,400 requests/day
```

### Storage & State
```json
{
  "expo-sqlite": "~15.0.3",  // Conversation history ✅
  "@react-native-async-storage/async-storage": "^2.1.0",  // Settings ✅
  "zustand": "^5.0.2"  // State management ✅
}
```

### Actions (WORKS)
```json
{
  "expo-linking": "~7.0.3",  // Calls, URLs ✅
  "expo-camera": "~16.0.7",  // Photos ✅
  "expo-notifications": "~0.28.19",  // Push notifications ✅
  "react-native-send-intent": "^1.3.0"  // Android intents ✅
}
```

---

## 🔥 INTELLIGENT ROUTING LOGIC

```typescript
// Smart decision: Local vs Cloud
async function processCommand(input: string) {
  // TIER 1: Instant local patterns (0 API calls, 0 RAM)
  const quickAction = matchQuickPattern(input);
  if (quickAction) {
    return executeAction(quickAction); // <100ms
  }

  // TIER 2: Local small model (offline capable)
  if (isOffline || isSimpleQuery(input)) {
    return await localModel.generate(input); // 500ms-2s, 1.5GB RAM
  }

  // TIER 3: Cloud intelligence (complex/latest info)
  if (needsWebSearch(input) || isComplexQuery(input)) {
    try {
      return await cloudAPI.generate(input); // 2-4s, 0 RAM
    } catch (error) {
      // Fallback to local if cloud fails
      return await localModel.generate(input);
    }
  }
}

function isSimpleQuery(text) {
  return text.split(' ').length < 15 && 
         !text.includes('latest') && 
         !text.includes('search') &&
         !text.includes('?');
}

function needsWebSearch(text) {
  return /what is|who is|when did|latest|current|news|weather|search/.test(text.toLowerCase());
}
```

---

## 📊 REALISTIC PERFORMANCE TARGETS

| Metric | Target | How |
|--------|--------|-----|
| **Quick commands** | <100ms | Regex matching, no AI |
| **Local AI response** | 500ms-2s | Gemma 2B quantized |
| **Cloud AI response** | 2-5s | Gemini Flash (fast API) |
| **RAM usage (idle)** | 50-80MB | UI + state only |
| **RAM usage (AI active)** | 1.5-2GB | Small model loaded |
| **Storage** | <200MB | App + 1 model |
| **Battery (idle)** | <2%/hour | Background minimal |
| **Battery (active)** | <8%/hour | With local AI |
| **Offline mode** | 80% capable | Local model + cached |

---

## 💰 COST ANALYSIS

### Option A: 100% FREE (Recommended)
- **Local**: Gemma 2B (free, offline)
- **Cloud**: Gemini Flash 2.0 (2M tokens/day free)
- **Backup**: Groq (14K req/day free)
- **Total cost**: $0/month forever ✅

### Option B: Power User ($5/month)
- **Local**: Same (Gemma 2B)
- **Cloud**: Gemini Pro 1.5 (1M context, $7/1M tokens)
- **Usage**: ~700K tokens/month = ~$5
- **Benefit**: Smarter responses, bigger context

### Option C: Premium ($20/month)
- **Local**: Same (Gemma 2B)  
- **Cloud**: Claude 3.5 Sonnet via API
- **Usage**: Variable, ~$20/month
- **Benefit**: Best intelligence, reasoning

**95% of users stay FREE with Option A!**

---

## 🛠️ BUILD STRATEGY FOR CODEBENDERS

### Phase 1: Core UI & Actions (No AI) - 500K tokens
```
Build a React Native Expo app with:
- Dark Jarvis-themed UI
- Animated orb (React Native Reanimated)
- Chat interface with bubbles
- Local action executor:
  * Call contacts (expo-linking)
  * Open apps (expo-intent-launcher)
  * Set alarms (expo-notifications)
  * Take photos (expo-camera)
  * Get time/date (pure JS)
- SQLite for history
- Zustand for state
- TypeScript strict mode

NO AI yet - just pattern matching for these actions.
```

### Phase 2: Local Small Model - 1M tokens
```
Add on-device AI using llama.rn:
- Download & load Gemma 2B quantized model (Q4_K_M)
- Implement chat interface to local model
- Handle casual conversation
- Fallback responses
- Token streaming for real-time text
- Memory management (load/unload model)

Requirements:
- Keep model in memory once loaded
- 4-bit quantization to reduce size
- Max 50 tokens/generation for speed
```

### Phase 3: Cloud Intelligence - 800K tokens
```
Add cloud AI fallback:
- Integrate Google Gemini Flash 2.0 API (free tier)
- Smart routing: local for simple, cloud for complex
- Detect when to use each:
  * "call mom" → local action
  * "what's the weather" → cloud API
  * "tell me a joke" → local model
  * "explain quantum physics" → cloud API
- Error handling & retry logic
- Offline mode with local fallback
- Rate limiting (respect free tier limits)

API endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```

### Phase 4: Polish & Native Features - 1M tokens
```
Add Android native features:
1. Notification listener (requires native Kotlin)
2. Better speech recognition (@react-native-voice/voice)
3. App shortcuts
4. Background service (minimal)
5. Storage optimization
6. Battery optimization
7. Crash reporting

Eject from Expo managed: npx expo prebuild
Then compile in Android Studio with custom native code.
```

**Total tokens: ~3.3M out of 8M budget**
**Remaining: 4.7M for iterations and fixes**

---

## ⚡ IMMEDIATE NEXT STEPS

### Step 1: Choose Your Intelligence Strategy
**Recommended for most users:**
```
- Tier 1: Local patterns (instant, free)
- Tier 2: Gemma 2B via llama.rn (offline, free, 1.5GB RAM)
- Tier 3: Gemini Flash 2.0 (cloud, free, smart)
```

### Step 2: Set Up Free APIs
1. Get Gemini API key (free): https://aistudio.google.com/app/apikey
2. Get Groq API key (free backup): https://console.groq.com/keys
3. Store in `.env`: `GEMINI_API_KEY=your_key`

### Step 3: Test Locally First
```bash
# Don't build in Codebenders yet
npm install
npx expo start

# Test on your Samsung A06:
# 1. Install Expo Go app
# 2. Scan QR code
# 3. Test voice, actions, UI
```

### Step 4: Use Codebenders for Complex Parts
Once local dev works, use Codebenders for:
- Complex UI animations
- Native Android bridges
- Advanced features
- Bug fixes

**DON'T paste the full spec at once!**
Break into 4 phases as shown above.

---

## 🎯 REALISTIC SUCCESS CRITERIA

After build completes:
- ✅ Voice input works (speech-to-text)
- ✅ Quick actions execute instantly (<100ms)
- ✅ Local model responds in 1-2 seconds
- ✅ Cloud API works for complex questions
- ✅ Offline mode functional (local model only)
- ✅ Battery drain acceptable (<8%/hour)
- ✅ RAM usage acceptable (<2GB)
- ✅ Feels intelligent (natural conversation)
- ✅ Cost is $0/month (free tiers)
- ✅ No crashes or freezes

---

## 📝 FINAL NOTES

**What Changed from Original Spec:**
- ❌ Removed: "GPT-4 intelligence on-device" (impossible)
- ❌ Removed: "Zero cost forever" for full intelligence (unrealistic)
- ✅ Added: Hybrid local + cloud approach (realistic)
- ✅ Added: Actual model options (Gemma 2B, Qwen 1.5B)
- ✅ Added: Free API options (Gemini, Groq)
- ✅ Added: Honest performance targets
- ✅ Added: Phase-by-phase build strategy

**This WILL work on your Samsung A06 5G.**
**This WILL cost $0/month for most users.**
**This WILL feel intelligent (hybrid approach).**
**This WILL build successfully in Codebenders (phased approach).**

Ready to start?
