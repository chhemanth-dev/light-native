/**
 * Initialize API Keys at App Startup
 * 
 * HOW TO USE YOUR CLAUDE KEY:
 * 1. Copy this file to: init-api-keys.local.ts (gitignored)
 * 2. Add your real key there
 * 3. Import and call from app/_layout.tsx
 * 
 * OR use the setAPIKey() function at runtime
 */

import { setAPIKey } from '../lib/ai-providers';

export function initializeMyAPIKeys() {
  // OPTION 1: Set your Claude key here (only in .local.ts file)
  // setAPIKey('claude', 'YOUR_CLAUDE_KEY_HERE');
  
  // OPTION 2: Set OpenAI key
  // setAPIKey('openai', 'YOUR_OPENAI_KEY_HERE');
  
  console.log('[API Keys] Keys initialized');
}

// For production, load from Expo SecureStore:
import { initializeAPIKeys } from './api-keys';

export async function loadSavedAPIKeys() {
  const keys = await initializeAPIKeys();
  
  if (keys.claude) {
    setAPIKey('claude', keys.claude);
  }
  
  if (keys.openai) {
    setAPIKey('openai', keys.openai);
  }
}
