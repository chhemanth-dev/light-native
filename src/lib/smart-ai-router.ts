/**
 * Smart AI Router
 * Decides: Local pattern → Gemma 2B → Cloud API (if online)
 * Optimized for Samsung A06 5G - works offline!
 */

import { gemmaModel } from './gemma-local-model-simple';
import * as Network from 'expo-network';

export interface AIResponse {
  text: string;
  source: 'local_pattern' | 'gemma_local' | 'gemini_cloud' | 'fallback';
  latency: number;
  offline: boolean;
}

export class SmartAIRouter {
  private geminiApiKey: string | null = null;

  constructor() {
    // Load Gemini API key if available (for online mode)
    // Can be set via settings screen
    this.loadGeminiApiKey();
  }

  /**
   * Load Gemini API key from storage
   */
  private async loadGeminiApiKey() {
    try {
      const { getItem } = await import('@react-native-async-storage/async-storage');
      this.geminiApiKey = await getItem('gemini_api_key');
    } catch (e) {
      console.log('[Router] No Gemini API key configured (offline mode only)');
    }
  }

  /**
   * Main routing logic
   */
  async chat(userMessage: string): Promise<AIResponse> {
    const startTime = Date.now();
    console.log('[Router] 💭 Processing:', userMessage);

    // Check if online
    const isOnline = await this.checkOnline();
    console.log('[Router] Network status:', isOnline ? 'Online ✅' : 'Offline 📴');

    // TIER 1: Quick local patterns (instant, no AI needed)
    const quickResponse = this.matchQuickPattern(userMessage);
    if (quickResponse) {
      console.log('[Router] ⚡ Quick pattern match');
      return {
        text: quickResponse,
        source: 'local_pattern',
        latency: Date.now() - startTime,
        offline: true,
      };
    }

    // TIER 2: Gemma 2B local model (always available offline)
    try {
      if (!gemmaModel.isReady()) {
        console.log('[Router] Initializing Gemma model...');
        await gemmaModel.initialize();
      }

      console.log('[Router] 🧠 Using Gemma 2B local model');
      const gemmaResponse = await gemmaModel.generate(userMessage, {
        temperature: 0.7,
        maxTokens: 150,
      });

      return {
        text: gemmaResponse,
        source: 'gemma_local',
        latency: Date.now() - startTime,
        offline: true,
      };
    } catch (gemmaError) {
      console.error('[Router] Gemma model error:', gemmaError);
      
      // TIER 3: Cloud API (if online and API key available)
      if (isOnline && this.geminiApiKey) {
        try {
          console.log('[Router] ☁️ Falling back to Gemini Cloud API');
          const cloudResponse = await this.callGeminiCloud(userMessage);
          return {
            text: cloudResponse,
            source: 'gemini_cloud',
            latency: Date.now() - startTime,
            offline: false,
          };
        } catch (cloudError) {
          console.error('[Router] Cloud API error:', cloudError);
        }
      }

      // TIER 4: Simple fallback
      return {
        text: 'I\'m having trouble processing that right now, sir. Please try again.',
        source: 'fallback',
        latency: Date.now() - startTime,
        offline: !isOnline,
      };
    }
  }

  /**
   * Quick pattern matching for instant responses
   */
  private matchQuickPattern(text: string): string | null {
    const lower = text.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey)(\s|$)/i.test(lower)) {
      return 'Hello sir, how can I assist you today?';
    }

    // Thanks
    if (/^(thanks|thank you)(\s|$)/i.test(lower)) {
      return 'You\'re welcome, sir!';
    }

    // Time
    if (/what.*time|current time/i.test(lower)) {
      const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `The time is ${time}, sir.`;
    }

    // Date
    if (/what.*date|today|what day/i.test(lower)) {
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return `Today is ${date}, sir.`;
    }

    return null;
  }

  /**
   * Call Gemini Cloud API (free tier)
   */
  private async callGeminiCloud(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('No Gemini API key configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Light, a helpful AI assistant. Address the user as "sir" naturally and professionally.\n\nUser: ${prompt}\n\nLight:`,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          topP: 0.9,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    return text.trim();
  }

  /**
   * Check if device is online
   */
  private async checkOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Set Gemini API key for cloud mode
   */
  setGeminiApiKey(apiKey: string | null) {
    this.geminiApiKey = apiKey;
    // Save to storage
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      if (apiKey) {
        AsyncStorage.setItem('gemini_api_key', apiKey);
      } else {
        AsyncStorage.removeItem('gemini_api_key');
      }
    });
  }

  /**
   * Pre-load Gemma model (call on app start)
   */
  async preloadModel(): Promise<void> {
    try {
      console.log('[Router] Pre-loading Gemma model...');
      await gemmaModel.initialize();
      console.log('[Router] ✅ Model ready for offline use');
    } catch (error) {
      console.error('[Router] Failed to preload model:', error);
    }
  }
}

// Singleton
export const aiRouter = new SmartAIRouter();
