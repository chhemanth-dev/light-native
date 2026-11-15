# Light Edge AI - On-Device Intelligence Plan

## Problem Statement
1. **API Costs**: Most AI providers now charge for API access
2. **Device Limitation**: Samsung A06 5G doesn't support Gemini Nano (requires Android 14+)
3. **Need**: Offline, on-device AI that works on Android 13 and below

## Solution: Light Edge AI

### Option 1: TensorFlow Lite (Recommended for A06 5G)
**Pros:**
- ✅ Works on Android 5.0+ (your A06 5G is compatible)
- ✅ Small model size (10-100MB)
- ✅ Fast inference on mobile
- ✅ Completely offline

**Models to use:**
- **MobileBERT** - Question answering, text understanding (25MB)
- **DistilBERT** - General NLP tasks (65MB)
- **T5-Small** - Text generation (75MB)
- **Whisper Tiny** - Speech recognition (39MB)

**Implementation:**
```javascript
// React Native TensorFlow Lite
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
```

### Option 2: ONNX Runtime Mobile
**Pros:**
- ✅ Cross-platform
- ✅ Optimized for mobile
- ✅ Supports many model formats

**Models:**
- Phi-2 quantized (800MB) - Powerful but large
- TinyLlama quantized (400MB) - Good balance
- GPT-2 Small (500MB) - Classic option

### Option 3: Web-based LLM (Novel approach)
**Use WebAssembly + Transformers.js:**
```javascript
// Run small models in React Native WebView
import { pipeline } from '@xenova/transformers';
```

**Pros:**
- ✅ No native dependencies
- ✅ Easy to update models
- ✅ Works on any Android version

## Recommended Architecture for Light

### Phase 1: Hybrid Approach (Best for now)
```
┌─────────────────────────────────────┐
│         Light Assistant              │
├─────────────────────────────────────┤
│  1. Free API Tier (Primary)         │
│     - Groq (fast, free)              │
│     - Gemini Flash (generous free)   │
│                                      │
│  2. Edge AI (Fallback)               │
│     - TensorFlow Lite models         │
│     - For basic tasks when offline   │
│                                      │
│  3. Smart Routing                    │
│     - Complex → API                  │
│     - Simple → Edge                  │
│     - Offline → Edge only            │
└─────────────────────────────────────┘
```

### Phase 2: Full Edge AI
Once models are integrated:
- Wake word detection (Edge)
- Intent classification (Edge) 
- Simple responses (Edge)
- Complex reasoning (API fallback)

## Implementation Steps

### Step 1: Add TensorFlow Lite Dependencies
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install @react-native-community/async-storage
npm install react-native-fs
```

### Step 2: Download and Bundle Models
```javascript
// Models will be bundled in APK or downloaded on first run
const MODELS = {
  intent: 'mobilenet_v2.tflite',        // 10MB - Intent classification
  qa: 'mobilebert_qa.tflite',           // 25MB - Question answering
  text: 'gpt2_small_quantized.tflite'  // 50MB - Text generation
};
```

### Step 3: Create Light Edge Engine
```typescript
class LightEdgeAI {
  async initialize() {
    // Load models
    await this.loadIntentModel();
    await this.loadQAModel();
  }
  
  async processQuery(text: string) {
    // 1. Classify intent locally
    const intent = await this.classifyIntent(text);
    
    // 2. Route based on complexity
    if (this.isSimpleQuery(intent)) {
      return await this.processLocally(text, intent);
    } else if (this.isOnline()) {
      return await this.processWithAPI(text);
    } else {
      return await this.processBestEffort(text);
    }
  }
}
```

## Free API Alternatives (2026)

### 1. Groq (Recommended)
- **Model**: Llama 3 70B, Mixtral 8x7B
- **Free Tier**: Very generous
- **Speed**: Fastest inference available
- **API**: https://groq.com

### 2. Google Gemini Flash
- **Model**: Gemini 1.5 Flash
- **Free Tier**: 15 requests/min
- **Good for**: Quick responses
- **API**: https://ai.google.dev

### 3. Hugging Face
- **Models**: Thousands of open models
- **Free Tier**: Available for smaller models
- **API**: https://huggingface.co/inference-api

### 4. Together AI
- **Models**: Llama, Mistral, etc.
- **Free Credits**: $25/month
- **API**: https://together.ai

## Storage Requirements

### Minimal Setup (Recommended for A06 5G)
```
Intent Classifier:    10 MB
Wake Word:           5 MB
Basic Q&A:          25 MB
Total:              40 MB
```

### Full Setup (If storage permits)
```
Intent Classifier:    10 MB
Wake Word:           5 MB
Q&A Model:          25 MB
Text Generation:    50 MB
Speech Recognition: 39 MB
Total:             129 MB
```

## Performance on Samsung A06 5G

**Expected specs:**
- RAM: 4-6 GB
- Storage: 128 GB
- CPU: MediaTek or Snapdragon 4 Gen series
- Android: 13 or 14

**Performance estimates:**
- Intent classification: ~50ms
- Simple Q&A: ~200-500ms
- Text generation (50 tokens): ~2-5 seconds
- Wake word detection: <100ms

## Next Steps

1. **Immediate**: Add Groq API as free alternative
2. **Short term**: Implement basic TensorFlow Lite models
3. **Long term**: Build custom "Light" model optimized for your use case

Would you like me to:
1. Add Groq API integration now?
2. Start implementing TensorFlow Lite models?
3. Create a hybrid system that uses both?
