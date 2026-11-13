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
  GEMINI: 'light_gemini_api_key',
  DEEPSEEK: 'light_deepseek_api_key',
  OPENAI: 'light_openai_api_key',
};

/**
 * Save API keys securely (supports multiple keys as array)
 */
export async function saveAPIKey(provider: 'gemini' | 'deepseek' | 'openai', keys: string | string[]): Promise<void> {
  // Convert single key to array for consistency
  const keyArray = Array.isArray(keys) ? keys : [keys];
  const jsonKeys = JSON.stringify(keyArray);
  
  if (Platform.OS === 'web') {
    // For web, use localStorage (less secure but works)
    localStorage.setItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS], jsonKeys);
  } else {
    // For mobile, use SecureStore (encrypted)
    await SecureStore.setItemAsync(
      STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS],
      jsonKeys
    );
  }
  console.log(`[API Keys] Saved ${keyArray.length} ${provider} key(s) securely`);
}

/**
 * Load API keys from secure storage (returns array for multiple keys support)
 */
export async function loadAPIKey(provider: 'gemini' | 'deepseek' | 'openai'): Promise<string | null> {
  try {
    let stored: string | null;
    if (Platform.OS === 'web') {
      stored = localStorage.getItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]);
    } else {
      stored = await SecureStore.getItemAsync(
        STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]
      );
    }
    
    if (!stored) return null;
    
    // Try to parse as JSON array (new format)
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Return first key for backward compatibility with UI
        return parsed[0];
      }
    } catch {
      // If parsing fails, it's an old single key (backward compatibility)
      return stored;
    }
    
    return null;
  } catch (error) {
    console.error(`[API Keys] Error loading ${provider} key:`, error);
    return null;
  }
}

/**
 * Load all API keys as arrays (for rotation system)
 */
export async function loadAPIKeys(provider: 'gemini' | 'deepseek' | 'openai'): Promise<string[]> {
  try {
    let stored: string | null;
    if (Platform.OS === 'web') {
      stored = localStorage.getItem(STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]);
    } else {
      stored = await SecureStore.getItemAsync(
        STORAGE_KEYS[provider.toUpperCase() as keyof typeof STORAGE_KEYS]
      );
    }
    
    if (!stored) return [];
    
    // Try to parse as JSON array (new format)
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(k => k && k.trim().length > 10);
      }
    } catch {
      // If parsing fails, it's an old single key (backward compatibility)
      if (stored.trim().length > 10) {
        return [stored];
      }
    }
    
    return [];
  } catch (error) {
    console.error(`[API Keys] Error loading ${provider} keys:`, error);
    return [];
  }
}

/**
 * Delete API key from secure storage
 */
export async function deleteAPIKey(provider: 'gemini' | 'deepseek' | 'openai'): Promise<void> {
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
export async function initializeAPIKeys(): Promise<{gemini: string | null, deepseek: string | null, openai: string | null}> {
  const gemini = await loadAPIKey('gemini');
  const deepseek = await loadAPIKey('deepseek');
  const openai = await loadAPIKey('openai');
  
  console.log('[API Keys] Initialized:', {
    gemini: gemini ? '✓ Configured' : '✗ Not set',
    deepseek: deepseek ? '✓ Configured' : '✗ Not set',
    openai: openai ? '✓ Configured' : '✗ Not set',
  });
  
  return { gemini, deepseek, openai };
}

/**
 * Initialize all API keys as arrays (for rotation system)
 * Call this at app startup for multi-key support
 */
export async function initializeAllAPIKeys(): Promise<{gemini: string[], deepseek: string[], openai: string[]}> {
  const gemini = await loadAPIKeys('gemini');
  const deepseek = await loadAPIKeys('deepseek');
  const openai = await loadAPIKeys('openai');
  
  console.log('[API Keys] Initialized (multi-key):', {
    gemini: `${gemini.length} key(s)`,
    deepseek: `${deepseek.length} key(s)`,
    openai: `${openai.length} key(s)`,
  });
  
  return { gemini, deepseek, openai };
}
