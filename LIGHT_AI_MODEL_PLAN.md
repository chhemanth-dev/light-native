# Light AI Model - Custom Edge AI on Hugging Face

## Overview
Create a custom fine-tuned AI model optimized for Light Assistant's specific tasks, host it on Hugging Face, and use their free Inference API.

## Step 1: Model Selection & Fine-tuning

### Base Model Options (Recommended)
1. **Phi-2** (2.7B parameters) - Best balance
   - Size: ~5GB (2.5GB quantized)
   - Speed: Fast on CPU
   - Quality: Excellent for assistant tasks
   
2. **TinyLlama** (1.1B parameters) - Fastest
   - Size: ~2GB (1GB quantized)
   - Speed: Very fast
   - Quality: Good for simple tasks

3. **Mistral-7B** (7B parameters) - Most capable
   - Size: ~14GB (7GB quantized)
   - Speed: Moderate
   - Quality: Best

**Recommendation: Start with Phi-2**

## Step 2: Fine-tuning Dataset

Create a dataset specific to Light Assistant tasks:

```python
# light_dataset.json
{
  "conversations": [
    {
      "system": "You are Light, a helpful personal AI assistant.",
      "user": "Set a reminder for 3pm to call mom",
      "assistant": "I'll set a reminder for 3:00 PM to call mom. You'll get a notification at that time."
    },
    {
      "user": "What's on my calendar today?",
      "assistant": "Let me check your calendar for today..."
    },
    {
      "user": "Turn on WiFi",
      "assistant": "I'll turn on WiFi for you now."
    },
    {
      "user": "Read my latest message",
      "assistant": "You have a message from..."
    }
    // Add 1000-5000 examples
  ]
}
```

### Data Categories to Include:
1. Reminders & Calendar (500 examples)
2. System Controls (300 examples)
3. Messages & Communication (400 examples)
4. General Q&A (800 examples)
5. Voice Commands (500 examples)
6. App Navigation (300 examples)

## Step 3: Fine-tuning Script

```python
# train_light_model.py
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer
)
from datasets import load_dataset
import torch

# Load base model
model_name = "microsoft/phi-2"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)

# Load your custom dataset
dataset = load_dataset("json", data_files="light_dataset.json")

# Training configuration
training_args = TrainingArguments(
    output_dir="./light-ai-v1",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    warmup_steps=100,
    logging_steps=10,
    save_steps=500,
    evaluation_strategy="steps",
    eval_steps=500,
    save_total_limit=2,
    fp16=True,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
)

trainer.train()

# Save final model
model.save_pretrained("./light-ai-final")
tokenizer.save_pretrained("./light-ai-final")
```

## Step 4: Upload to Hugging Face

```python
# upload_to_huggingface.py
from huggingface_hub import HfApi, create_repo

# Create repository
repo_name = "your-username/light-ai"
create_repo(repo_name, private=False, repo_type="model")

# Upload model
api = HfApi()
api.upload_folder(
    folder_path="./light-ai-final",
    repo_id=repo_name,
    repo_type="model"
)

# Create model card
model_card = """
---
license: apache-2.0
language:
- en
tags:
- personal-assistant
- mobile-ai
- voice-assistant
---

# Light AI - Personal Assistant Model

Light AI is a fine-tuned language model optimized for personal assistant tasks on mobile devices.

## Features
- Reminder and calendar management
- System control commands
- Message handling
- Voice command processing
- Offline capability

## Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("your-username/light-ai")
tokenizer = AutoTokenizer.from_pretrained("your-username/light-ai")

prompt = "Set a reminder for 5pm to take medicine"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=100)
response = tokenizer.decode(outputs[0])
```

## Model Details
- Base: Phi-2
- Parameters: 2.7B
- Training: Custom dataset of 2500+ examples
- License: Apache 2.0
"""

with open("./light-ai-final/README.md", "w") as f:
    f.write(model_card)
```

## Step 5: Integrate with Light App

```typescript
// src/lib/light-ai-api.ts

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/your-username/light-ai";
const HF_API_KEY = "YOUR_HF_TOKEN"; // Free tier available!

export class LightAIAPI {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = HUGGINGFACE_API_URL;
    this.apiKey = HF_API_KEY;
  }

  async query(text: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<|system|>You are Light, a helpful personal assistant.<|user|>${text}<|assistant|>`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HF API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result[0].generated_text;
    } catch (error) {
      console.error('Light AI API Error:', error);
      throw error;
    }
  }

  async streamQuery(text: string, onToken: (token: string) => void): Promise<void> {
    // Streaming support for real-time responses
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
        },
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onToken(chunk);
    }
  }
}

// Usage in app
export const lightAI = new LightAIAPI();
```

## Step 6: Update Light App to Use Custom Model

```typescript
// src/lib/ai-providers.ts

import { lightAI } from './light-ai-api';

export async function processWithLightAI(userInput: string): Promise<string> {
  try {
    // Use our custom Light AI model hosted on HuggingFace
    const response = await lightAI.query(userInput);
    return response;
  } catch (error) {
    console.error('Error with Light AI:', error);
    // Fallback to other provider if needed
    return processFallback(userInput);
  }
}

// Add to existing AI router
export async function processAIQuery(input: string, provider: string = 'light') {
  switch (provider) {
    case 'light':
      return await processWithLightAI(input);
    case 'openai':
      return await processWithOpenAI(input);
    case 'gemini':
      return await processWithGemini(input);
    default:
      return await processWithLightAI(input); // Default to Light AI
  }
}
```

## Hugging Face Free Tier Benefits

✅ **Free Inference API**
- 1000 requests/day (increases with usage)
- Automatic model loading
- Serverless deployment
- No credit card required

✅ **Scalability**
- Shared GPU infrastructure
- Auto-scaling
- Global CDN

✅ **Features**
- Model versioning
- A/B testing
- Analytics dashboard
- Community support

## Cost Comparison

| Provider | Free Tier | After Free |
|----------|-----------|------------|
| OpenAI GPT-4 | $5 credit | $0.01/1K tokens |
| Claude | Limited | $0.008/1K tokens |
| Gemini | 15 req/min | Paid tiers |
| **Light AI (HF)** | **1000 req/day** | **Still FREE!** |

## Implementation Timeline

### Week 1: Dataset Creation
- [ ] Collect 500 reminder/calendar examples
- [ ] Collect 300 system control examples
- [ ] Collect 400 message examples
- [ ] Collect 800 general Q&A examples
- [ ] Collect 500 voice command examples

### Week 2: Model Training
- [ ] Set up training environment (Google Colab/Kaggle)
- [ ] Fine-tune base model
- [ ] Test and validate
- [ ] Quantize for efficiency

### Week 3: Deployment
- [ ] Upload to Hugging Face
- [ ] Create API integration
- [ ] Update Light app
- [ ] Test end-to-end

### Week 4: Optimization
- [ ] Gather usage data
- [ ] Retrain with real examples
- [ ] Improve response quality
- [ ] Add caching layer

## Quick Start (If you want to start NOW)

Use an existing similar model while we train Light AI:

```typescript
// Temporary: Use Phi-2 directly from HuggingFace
const TEMP_MODEL = "microsoft/phi-2";

// This gives you immediate functionality while Light AI is being trained
const response = await fetch(
  `https://api-inference.huggingface.co/models/${TEMP_MODEL}`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_HF_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: `You are Light, a personal assistant. User: ${userInput}\nAssistant:`,
    }),
  }
);
```

## Next Steps

Would you like me to:
1. **Create the integration code now** (use existing HF model as temporary solution)?
2. **Set up the training pipeline** (scripts to fine-tune Light AI)?
3. **Both** - integrate existing model now, prepare training for later?
