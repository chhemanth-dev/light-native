/**
 * Initialize API Keys at App Startup
 * 
 * HOW TO USE YOUR API KEYS:
 * 1. Copy this file to: init-api-keys.local.ts (gitignored)
 * 2. Add your real keys there (supports multiple keys per provider!)
 * 3. Import and call from app/_layout.tsx
 * 
 * OR use the AI Settings screen to add keys at runtime
 */

import { setAPIKey, addAPIKey } from '../lib/ai-providers';

export function initializeMyAPIKeys() {
  // OPTION 1: Set your PRIMARY key (first key = always tried first)
  // setAPIKey('deepseek', 'YOUR_PRIMARY_DEEPSEEK_KEY');
  
  // OPTION 2: Add BACKUP keys (used if primary fails)
  // addAPIKey('deepseek', 'YOUR_BACKUP_DEEPSEEK_KEY_1');
  // addAPIKey('deepseek', 'YOUR_BACKUP_DEEPSEEK_KEY_2');
  
  // Same for OpenAI
  // setAPIKey('openai', 'YOUR_PRIMARY_OPENAI_KEY');
  // addAPIKey('openai', 'YOUR_BACKUP_OPENAI_KEY');
  
  // Same for Gemini
  // setAPIKey('gemini', 'YOUR_PRIMARY_GEMINI_KEY');
  // addAPIKey('gemini', 'YOUR_BACKUP_GEMINI_KEY');
  
  console.log('[API Keys] Keys initialized from local file');
}

// For production, load from Expo SecureStore with multi-key support:
import { initializeAllAPIKeys } from './api-keys';

export async function loadSavedAPIKeys() {
  console.log('[API Keys] Loading saved keys from secure storage...');
  const keys = await initializeAllAPIKeys();
  
  // Load DeepSeek keys
  if (keys.deepseek.length > 0) {
    setAPIKey('deepseek', keys.deepseek[0]); // Primary key
    keys.deepseek.slice(1).forEach(key => addAPIKey('deepseek', key)); // Backup keys
    console.log(`[API Keys] Loaded ${keys.deepseek.length} DeepSeek key(s)`);
  }
  
  // Load OpenAI keys
  if (keys.openai.length > 0) {
    setAPIKey('openai', keys.openai[0]); // Primary key
    keys.openai.slice(1).forEach(key => addAPIKey('openai', key)); // Backup keys
    console.log(`[API Keys] Loaded ${keys.openai.length} OpenAI key(s)`);
  }
  
  // Load Gemini keys
  if (keys.gemini.length > 0) {
    setAPIKey('gemini', keys.gemini[0]); // Primary key
    keys.gemini.slice(1).forEach(key => addAPIKey('gemini', key)); // Backup keys
    console.log(`[API Keys] Loaded ${keys.gemini.length} Gemini key(s)`);
  }
  
  console.log('[API Keys] All saved keys loaded successfully');
}
