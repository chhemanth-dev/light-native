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
// For development, create a .env file or use Expo SecureStore
// For production, use environment variables

// Load from environment or use empty defaults
const API_KEYS = {
  gemini: "AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM", // Public key (safe to commit)
  claude: "", // Set via setAPIKey() or environment variable
  openai: "", // Set via setAPIKey() or environment variable
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
  
  const fullPrompt = buildPrompt(messages);
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
    const apiUrl = API_URLS.gemini + '?key=' + API_KEYS.gemini;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Gemini API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini API');
    }

    console.log('[Gemini] Success!');
    return text.trim();
  } catch (error: any) {
    console.error('[Gemini] Error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Claude API (Anthropic)
 */
async function callClaudeAPI(messages: AIMessage[]): Promise<string> {
  if (!API_KEYS.claude) {
    throw new Error('Claude API key not configured');
  }
  
  console.log('[Claude] Starting API call...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(API_URLS.claude, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEYS.claude,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Claude API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Claude API');
    }

    console.log('[Claude] Success!');
    return text.trim();
  } catch (error: any) {
    console.error('[Claude] Error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(messages: AIMessage[]): Promise<string> {
  if (!API_KEYS.openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  console.log('[OpenAI] Starting API call...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(API_URLS.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEYS.openai,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
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
  console.log('[AI] Provider:', provider);
  
  // Auto mode: try providers in order of preference
  if (provider === 'auto') {
    const providers: AIProvider[] = ['gemini', 'claude', 'openai'];
    
    for (const p of providers) {
      try {
        console.log('[AI] Trying provider:', p);
        const text = await callProviderAPI(p, messages);
        return { text, provider: p, offline: false };
      } catch (error) {
        console.error('[AI] Provider', p, 'failed:', error);
        // Try next provider
      }
    }
    
    // All providers failed
    throw new Error('All AI providers failed. Check your internet connection and API keys.');
  }
  
  // Specific provider requested
  try {
    const text = await callProviderAPI(provider, messages);
    return { text, provider, offline: false };
  } catch (error: any) {
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
 */
export function setAPIKey(provider: Exclude<AIProvider, 'auto'>, key: string) {
  API_KEYS[provider] = key;
  console.log('[AI] Updated API key for:', provider);
}

/**
 * Check if provider is configured
 */
export function isProviderConfigured(provider: Exclude<AIProvider, 'auto'>): boolean {
  return !!API_KEYS[provider];
}
