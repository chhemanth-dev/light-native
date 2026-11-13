/**
 * Multi-AI Provider System
 * Supports: Gemini, Claude, OpenAI, and more
 * 100% Cloud-based - NO on-device AI
 */

export type AIProvider = 'gemini' | 'claude' | 'openai' | 'auto';

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AIResponse = {
  text: string;
  provider: AIProvider;
  offline: boolean;
};

// API Keys - MOVED TO SECURE STORAGE
// Now supports MULTIPLE keys per provider for auto-fallback
const API_KEYS: {
  gemini: string[];
  claude: string[];
  openai: string[];
} = {
  gemini: [],
  claude: [],
  openai: [],
};

// Track which key index is currently being used
const CURRENT_KEY_INDEX: {
  gemini: number;
  claude: number;
  openai: number;
} = {
  gemini: 0,
  claude: 0,
  openai: 0,
};

const API_URLS = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  claude: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
};

/**
 * System prompt for all AI providers
 */
const SYSTEM_PROMPT = `You are Light, a calm, composed personal AI assistant with the manner of a refined British butler — similar in character to J.A.R.V.I.S. from Iron Man.

Your capabilities:
- Read notifications from WhatsApp, Instagram, Gmail, etc.
- SEND MESSAGES via accessibility service (can type and click send)
- MAKE PHONE CALLS hands-free
- OPEN APPS hands-free
- REMIND users (acknowledge request, app handles setting)
- SEARCH THE WEB for current information
- Get REAL-TIME WEATHER
- Complex calculations and reasoning
- Draft and SEND replies automatically

Your rules:
- Speak in clear, brief British English
- Address user as "sir" or "ma'am" occasionally
- When user asks you to reply to a message: draft the reply and SEND it using accessibility
- For calls: system makes the call automatically
- For apps: system opens them automatically
- For reminders: acknowledge and let app handle it
- You REQUIRE internet - cannot work offline
- Be helpful, accurate, and productive

Message Sending:
When user says "reply to [name]" or "send message to [name]":
1. Draft an appropriate reply
2. Use accessibility service to open app
3. Type the message
4. Click send button
5. Confirm to user

Examples:
- "Reply to John's WhatsApp" → Draft reply, open WhatsApp, send message
- "Tell Sarah I'm running late" → Open messaging app, type and send
- "Call Mom" → Make phone call
- "Open Instagram" → Open app
- "Remind me to buy milk at 5pm" → Acknowledge reminder
- "What's the weather?" → Fetch real-time weather`;

/**
 * Call Gemini API (Google)
 */
async function callGeminiAPI(messages: AIMessage[]): Promise<string> {
  console.log('[Gemini] Starting API call...');
  console.log('[Gemini] API Key:', API_KEYS.gemini ? '✓ Present' : '✗ Missing');
  console.log('[Gemini] Messages count:', messages.length);
  
  const fullPrompt = buildPrompt(messages);
  console.log('[Gemini] Prompt length:', fullPrompt.length);
  
  const requestBody = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const apiUrl = API_URLS.gemini + '?key=' + getCurrentKey('gemini');
    console.log('[Gemini] Calling API:', API_URLS.gemini);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    console.log('[Gemini] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error response:', errorText);
      throw new Error('Gemini API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    console.log('[Gemini] Response data keys:', Object.keys(data));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gemini] No text in response:', JSON.stringify(data).substring(0, 200));
      throw new Error('No response from Gemini API');
    }

    console.log('[Gemini] ✅ Success! Response length:', text.length);
    return text.trim();
  } catch (error: any) {
    console.error('[Gemini] ❌ Error:', error.message || error);
    console.error('[Gemini] Error stack:', error.stack);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Claude API (Anthropic)
 */
async function callClaudeAPI(messages: AIMessage[]): Promise<string> {
  console.log('[Claude] Starting API call...');
  
  const apiKey = getCurrentKey('claude');
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }
  
  console.log('[Claude] Using key:', `${apiKey.substring(0, 15)}...`);
  console.log('[Claude] Messages count:', messages.length);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    };
    
    console.log('[Claude] Request body:', JSON.stringify(requestBody).substring(0, 200));
    console.log('[Claude] Calling API:', API_URLS.claude);
    
    const response = await fetch(API_URLS.claude, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    console.log('[Claude] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Claude] API error response:', errorText);
      throw new Error('Claude API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    console.log('[Claude] Response data keys:', Object.keys(data));
    
    const text = data.content?.[0]?.text;
    
    if (!text) {
      console.error('[Claude] No text in response:', JSON.stringify(data).substring(0, 200));
      throw new Error('No response from Claude API');
    }

    console.log('[Claude] ✅ Success! Response length:', text.length);
    return text.trim();
  } catch (error: any) {
    console.error('[Claude] ❌ Error:', error.message || error);
    console.error('[Claude] Error stack:', error.stack);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(messages: AIMessage[]): Promise<string> {
  console.log('[OpenAI] Starting API call...');
  
  const apiKey = getCurrentKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  console.log('[OpenAI] Using key:', `${apiKey.substring(0, 20)}...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(API_URLS.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('OpenAI API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error('No response from OpenAI API');
    }

    console.log('[OpenAI] Success!');
    return text.trim();
  } catch (error: any) {
    console.error('[OpenAI] Error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call AI with automatic provider selection or specific provider
 */
export async function callAI(
  messages: AIMessage[],
  provider: AIProvider = 'auto'
): Promise<AIResponse> {
  console.log('[AI] ========================================');
  console.log('[AI] callAI() invoked');
  console.log('[AI] Provider:', provider);
  console.log('[AI] Messages:', messages.length);
  console.log('[AI] API Keys status:');
  console.log('[AI]   - Gemini:', API_KEYS.gemini.length, 'key(s)');
  console.log('[AI]   - Claude:', API_KEYS.claude.length, 'key(s)');
  console.log('[AI]   - OpenAI:', API_KEYS.openai.length, 'key(s)');
  
  // Check if ANY key is configured
  if (API_KEYS.gemini.length === 0 && API_KEYS.claude.length === 0 && API_KEYS.openai.length === 0) {
    console.error('[AI] ❌ NO API KEYS CONFIGURED!');
    throw new Error('No API keys configured. Please set at least one API key in Settings → AI Settings');
  }
  
  console.log('[AI] ========================================');
  
  // Auto mode: try providers in order of preference
  if (provider === 'auto') {
    const providers: AIProvider[] = ['openai', 'claude', 'gemini'];
    const errors: string[] = [];
    
    for (const p of providers) {
      const typedProvider = p as Exclude<AIProvider, 'auto'>;
      
      // Skip if key not configured
      if (!isProviderConfigured(typedProvider)) {
        console.log('[AI] ⏭️  Skipping', p, '- no API key configured');
        continue;
      }
      
      // Try all keys for this provider
      const numKeys = API_KEYS[typedProvider].length;
      for (let attempt = 0; attempt < numKeys; attempt++) {
        try {
          console.log('[AI] 🔄 Trying provider:', p, '- Key', attempt + 1, 'of', numKeys);
          const text = await callProviderAPI(p, messages);
          console.log('[AI] ✅ SUCCESS with provider:', p);
          return { text, provider: p, offline: false };
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          console.error('[AI] ❌ Provider', p, 'key', attempt + 1, 'failed:', errorMsg);
          errors.push(`${p} key ${attempt + 1}: ${errorMsg}`);
          
          // Rotate to next key for this provider
          if (attempt < numKeys - 1) {
            rotateAPIKey(typedProvider);
          }
        }
      }
    }
    
    // All providers and all their keys failed
    console.error('[AI] ❌ ALL PROVIDERS AND ALL KEYS FAILED!');
    console.error('[AI] Errors:', errors);
    throw new Error('All AI providers failed:\n' + errors.join('\n'));
  }
  
  // Specific provider requested
  console.log('[AI] Using specific provider:', provider);
  
  // Check if provider is configured
  if (!isProviderConfigured(provider as Exclude<AIProvider, 'auto'>)) {
    throw new Error(`${provider} API key not configured. Please add it to init-api-keys.local.ts`);
  }
  
  try {
    const text = await callProviderAPI(provider, messages);
    console.log('[AI] ✅ SUCCESS with provider:', provider);
    return { text, provider, offline: false };
  } catch (error: any) {
    console.error('[AI] ❌ Provider failed:', error.message || error);
    throw new Error(`${provider} API failed: ${error.message}`);
  }
}

/**
 * Call specific provider
 */
async function callProviderAPI(provider: AIProvider, messages: AIMessage[]): Promise<string> {
  switch (provider) {
    case 'gemini':
      return await callGeminiAPI(messages);
    case 'claude':
      return await callClaudeAPI(messages);
    case 'openai':
      return await callOpenAIAPI(messages);
    default:
      throw new Error('Unknown provider: ' + provider);
  }
}

/**
 * Build prompt from messages
 */
function buildPrompt(messages: AIMessage[]): string {
  const parts: string[] = [SYSTEM_PROMPT, "\n[Conversation]"];
  for (const m of messages) {
    parts.push(
      m.role === "user"
        ? 'User: ' + m.content
        : m.role === "assistant"
        ? 'Light: ' + m.content
        : 'System: ' + m.content
    );
  }
  parts.push("Light:");
  return parts.join("\n");
}

/**
 * Update API key at runtime
 * Now supports adding multiple keys - they will be tried in order
 */
export function setAPIKey(provider: Exclude<AIProvider, 'auto'>, key: string | string[]) {
  if (Array.isArray(key)) {
    API_KEYS[provider] = key.filter(k => k && k.length > 10);
  } else {
    // Single key - replace all existing keys
    API_KEYS[provider] = key && key.length > 10 ? [key] : [];
  }
  console.log('[AI] Updated API keys for:', provider, '- Count:', API_KEYS[provider].length);
}

/**
 * Add an additional API key to existing ones
 */
export function addAPIKey(provider: Exclude<AIProvider, 'auto'>, key: string) {
  if (key && key.length > 10 && !API_KEYS[provider].includes(key)) {
    API_KEYS[provider].push(key);
    console.log('[AI] Added API key for:', provider, '- Total:', API_KEYS[provider].length);
  }
}

/**
 * Get current API key for provider (cycles through keys on failure)
 */
function getCurrentKey(provider: Exclude<AIProvider, 'auto'>): string | null {
  const keys = API_KEYS[provider];
  if (keys.length === 0) return null;
  
  const index = CURRENT_KEY_INDEX[provider] % keys.length;
  return keys[index];
}

/**
 * Move to next API key for provider (call this on failure)
 */
function rotateAPIKey(provider: Exclude<AIProvider, 'auto'>) {
  CURRENT_KEY_INDEX[provider]++;
  const newIndex = CURRENT_KEY_INDEX[provider] % API_KEYS[provider].length;
  console.log('[AI] Rotated to next key for:', provider, '- Index:', newIndex);
}

/**
 * Check if provider is configured
 */
export function isProviderConfigured(provider: Exclude<AIProvider, 'auto'>): boolean {
  return API_KEYS[provider].length > 0;
}
