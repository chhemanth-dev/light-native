/**
 * Smart AI Router
 * Pure offline mode - works 100% without internet
 * Uses advanced pattern matching and templates
 */

import { offlineAI } from './offline-ai-engine';
import * as Network from 'expo-network';

export interface AIResponse {
  text: string;
  source: 'local_pattern' | 'offline_ai' | 'fallback';
  latency: number;
  offline: boolean;
}

export class SmartAIRouter {
  constructor() {
    console.log('[Router] Initializing pure offline AI router');
  }

  /**
   * Main routing logic - 100% offline
   */
  async chat(userMessage: string): Promise<AIResponse> {
    const startTime = Date.now();
    console.log('[Router] 💭 Processing offline:', userMessage);

    // Initialize offline AI if needed
    if (!offlineAI.isReady()) {
      await offlineAI.initialize();
    }

    // Use offline AI engine
    try {
      const response = await offlineAI.generate(userMessage);
      
      return {
        text: response.text,
        source: response.source === 'pattern' ? 'local_pattern' : 'offline_ai',
        latency: Date.now() - startTime,
        offline: true,
      };
    } catch (error) {
      console.error('[Router] Offline AI error:', error);
      
      return {
        text: "I'm having trouble processing that, sir. Could you try rephrasing?",
        source: 'fallback',
        latency: Date.now() - startTime,
        offline: true,
      };
    }
  }

  /**
   * Pre-load offline AI (call on app start)
   */
  async preloadModel(): Promise<void> {
    try {
      console.log('[Router] Pre-loading offline AI...');
      await offlineAI.initialize();
      console.log('[Router] ✅ Ready for 100% offline use');
    } catch (error) {
      console.error('[Router] Failed to preload:', error);
    }
  }

  /**
   * Check if online (for future cloud integration)
   */
  async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected ?? false;
    } catch {
      return false;
    }
  }
}

// Singleton
export const aiRouter = new SmartAIRouter();
