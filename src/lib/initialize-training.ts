/**
 * Initialize Training Data
 * Load and process training data on first app launch
 */

import { patternLearner, TrainingExample } from './light-pattern-learner';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINING_INITIALIZED_KEY = '@light_training_initialized';

// Import training data (in React Native, you need to require JSON files)
// This will be bundled with the app
// Use ULTIMATE training data (44,000+ examples for maximum intelligence!)
// LAZY LOAD: Only load when actually needed to prevent startup crashes
let trainingData: any[] | null = null;

function loadTrainingData(): any[] {
  if (trainingData === null) {
    try {
      trainingData = require('../data/light_training_ultimate.json');
      console.log(`📚 Loaded ${trainingData.length} training examples`);
    } catch (error) {
      console.error('❌ Failed to load training data:', error);
      trainingData = []; // Empty array fallback
    }
  }
  return trainingData;
}

/**
 * Initialize training data on first launch
 */
export async function initializeTraining(): Promise<void> {
  try {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem(TRAINING_INITIALIZED_KEY);
    
    if (initialized === 'true') {
      console.log('✅ Training data already initialized');
      return;
    }

    console.log('🚀 First launch - initializing training data...');
    
    // Load training data
    const data = loadTrainingData();
    console.log(`📚 Processing ${data.length} training examples...`);

    // Process in batches to avoid blocking UI
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await patternLearner.learnFromExamples(batch);
      processed += batch.length;
      
      console.log(`📊 Processed ${processed}/${data.length} examples (${Math.round(processed / data.length * 100)}%)`);
      
      // Allow UI to breathe between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Mark as initialized
    await AsyncStorage.setItem(TRAINING_INITIALIZED_KEY, 'true');
    
    console.log('✅ Training initialization complete!');
    console.log(`🎓 Light AI is now trained with ${data.length} examples`);
  } catch (error) {
    console.error('❌ Failed to initialize training:', error);
    // Don't throw - app should still work, just with less knowledge
  }
}

/**
 * Reset training (for testing or updates)
 */
export async function resetTraining(): Promise<void> {
  await AsyncStorage.removeItem(TRAINING_INITIALIZED_KEY);
  await patternLearner.clearPatterns();
  console.log('🗑️ Training data reset');
}

/**
 * Get training status
 */
export async function getTrainingStatus(): Promise<{
  initialized: boolean;
  examplesCount: number;
  patternsCount: number;
}> {
  const initialized = await AsyncStorage.getItem(TRAINING_INITIALIZED_KEY);
  const patterns = patternLearner.getAllPatterns();
  const data = loadTrainingData();
  
  return {
    initialized: initialized === 'true',
    examplesCount: data.length,
    patternsCount: patterns.length,
  };
}
