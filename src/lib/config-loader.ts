/**
 * Configuration loader - loads user preferences from storage
 * and updates LIGHT_CONFIG at app startup
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT_CONFIG } from "./light-config";

/**
 * Load user preferences and update LIGHT_CONFIG
 * Call this once at app startup
 */
export async function loadUserPreferences(): Promise<void> {
  try {
    // Load AI confidence threshold
    const savedConfidence = await AsyncStorage.getItem('ai_confidence_threshold');
    if (savedConfidence) {
      const confidence = parseFloat(savedConfidence);
      if (!isNaN(confidence) && confidence >= 0 && confidence <= 1) {
        (LIGHT_CONFIG.ai as any).confidenceThreshold = confidence;
        console.log('[Config] Loaded AI confidence:', confidence);
      }
    }
    
    // Future: Load other preferences here
    // - Theme
    // - Language
    // - Voice speed
    // - etc.
    
  } catch (error) {
    console.error('[Config] Failed to load user preferences:', error);
  }
}

/**
 * Save AI confidence threshold
 */
export async function saveAIConfidence(confidence: number): Promise<void> {
  if (confidence < 0 || confidence > 1) {
    throw new Error('Confidence must be between 0 and 1');
  }
  
  await AsyncStorage.setItem('ai_confidence_threshold', confidence.toString());
  (LIGHT_CONFIG.ai as any).confidenceThreshold = confidence;
  console.log('[Config] Saved AI confidence:', confidence);
}
