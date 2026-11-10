/**
 * API Key Configuration
 * SECURE: Keys stored locally, not committed to Git
 * 
 * Setup:
 * 1. Create .env file in project root (see .env.example)
 * 2. Add your API keys there
 * 3. Or set them programmatically using setAPIKey()
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secure key storage keys
const STORAGE_KEYS = {
  CLAUDE: 'light_claude_api_key',
  OPENAI: 'light_openai_api_key',
};

/**
 * Save API key securely
 */
export async function saveAPIKey(provider: 'claude' | 'openai', key: string): Promise<void> {
  if (Platform.OS === 'web') {
    // For web, use localStorage (less secure but works)
    localStorage.setItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS], key);
  } else {
    // For mobile, use SecureStore (encrypted)
    await SecureStore.setItemAsync(
      STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS],
      key
    );
  }
  console.log(`[API Keys] Saved ${provider} key securely`);
}

/**
 * Load API key from secure storage
 */
export async function loadAPIKey(provider: 'claude' | 'openai'): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]);
    } else {
      return await SecureStore.getItemAsync(
        STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]
      );
    }
  } catch (error) {
    console.error(`[API Keys] Error loading ${provider} key:`, error);
    return null;
  }
}

/**
 * Delete API key from secure storage
 */
export async function deleteAPIKey(provider: 'claude' | 'openai'): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]);
    } else {
      await SecureStore.deleteItemAsync(
        STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]
      );
    }
    console.log(`[API Keys] Deleted ${provider} key`);
  } catch (error) {
    console.error(`[API Keys] Error deleting ${provider} key:`, error);
  }
}

/**
 * Initialize API keys from secure storage
 * Call this at app startup
 */
export async function initializeAPIKeys(): Promise<{claude: string | null, openai: string | null}> {
  const claude = await loadAPIKey('claude');
  const openai = await loadAPIKey('openai');
  
  console.log('[API Keys] Initialized:', {
    claude: claude ? '✓ Configured' : '✗ Not set',
    openai: openai ? '✓ Configured' : '✗ Not set',
  });
  
  return { claude, openai };
}
