/**
 * Light Pattern Learner
 * Learns from training examples to recognize user intents and generate responses
 * No external APIs - fully local pattern matching and learning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrainingExample {
  input: string;
  intent: string;
  entities?: Record<string, any>;
  response?: string;
  action?: string;
}

export interface LearnedPattern {
  intent: string;
  keywords: string[];
  patterns: string[];
  examples: string[];
  confidence: number;
  actionTemplate?: string;
  responseTemplate?: string;
  usageCount?: number;      // Track how often used
  lastUsed?: number;        // Track when last used
}

const PATTERNS_STORAGE_KEY = '@light_learned_patterns';
const TRAINING_DATA_PATH = 'light_training_data.json';

export class LightPatternLearner {
  private patterns: Map<string, LearnedPattern> = new Map();
  private initialized = false;

  /**
   * Initialize the pattern learner by loading training data and learned patterns
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load previously learned patterns
      await this.loadLearnedPatterns();

      // Load training data and learn from it
      await this.learnFromTrainingData();

      this.initialized = true;
      console.log('✅ Light Pattern Learner initialized with', this.patterns.size, 'patterns');
    } catch (error) {
      console.error('❌ Failed to initialize pattern learner:', error);
      throw error;
    }
  }

  /**
   * Load training data and extract patterns
   */
  private async learnFromTrainingData(): Promise<void> {
    try {
      // In React Native, we'll need to import the JSON file
      // For now, check if patterns are already loaded
      const existingPatterns = await AsyncStorage.getItem(PATTERNS_STORAGE_KEY);
      
      if (!existingPatterns) {
        // First time - need to process training data
        // This would typically be done during app installation or first run
        console.log('ℹ️ No existing patterns found. Will learn from user interactions.');
      } else {
        console.log('✅ Loaded existing learned patterns');
      }
    } catch (error) {
      console.error('❌ Error loading training data:', error);
    }
  }

  /**
   * Learn patterns from an array of training examples
   */
  async learnFromExamples(examples: TrainingExample[]): Promise<void> {
    console.log(`📚 Learning from ${examples.length} examples...`);

    for (const example of examples) {
      await this.learnPattern(example);
    }

    await this.saveLearnedPatterns();
    console.log(`✅ Learned patterns from ${examples.length} examples`);
  }

  /**
   * Learn a pattern from a single training example
   */
  private async learnPattern(example: TrainingExample): Promise<void> {
    const { intent, input, response, action } = example;

    // Get or create pattern for this intent
    let pattern = this.patterns.get(intent);
    if (!pattern) {
      pattern = {
        intent,
        keywords: [],
        patterns: [],
        examples: [],
        confidence: 0,
      };
      this.patterns.set(intent, pattern);
    }

    // Extract keywords from input
    const keywords = this.extractKeywords(input);
    pattern.keywords.push(...keywords);
    pattern.keywords = [...new Set(pattern.keywords)]; // Remove duplicates

    // Store example
    if (!pattern.examples.includes(input)) {
      pattern.examples.push(input);
    }

    // Store patterns (simplified regex-like patterns)
    const simplePattern = this.createSimplePattern(input);
    if (!pattern.patterns.includes(simplePattern)) {
      pattern.patterns.push(simplePattern);
    }

    // Increase confidence as we see more examples
    pattern.confidence = Math.min(1.0, pattern.examples.length / 10);

    // Store action and response templates
    if (action) pattern.actionTemplate = action;
    if (response) pattern.responseTemplate = response;
  }

  /**
   * Extract meaningful keywords from input text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on',
      'at', 'by', 'with', 'from', 'about', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
      'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
      'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'me',
      'my', 'i', 'you', 'your'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Create a simple pattern from input text for matching
   */
  private createSimplePattern(text: string): string {
    const keywords = this.extractKeywords(text);
    return keywords.slice(0, 3).join('|'); // Use top 3 keywords
  }

  /**
   * Recognize intent from user input
   */
  async recognizeIntent(userInput: string): Promise<{
    intent: string;
    confidence: number;
    suggestedAction?: string;
    suggestedResponse?: string;
  } | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const userKeywords = this.extractKeywords(userInput);
    let bestMatch: { intent: string; score: number; pattern: LearnedPattern } | null = null;

    // Find best matching pattern
    for (const [intent, pattern] of this.patterns.entries()) {
      let score = 0;

      // Match keywords
      const matchingKeywords = userKeywords.filter(k => 
        pattern.keywords.some(pk => pk.includes(k) || k.includes(pk))
      );
      score += matchingKeywords.length * 2;

      // Check similarity with examples
      for (const example of pattern.examples) {
        const similarity = this.calculateSimilarity(userInput.toLowerCase(), example.toLowerCase());
        score += similarity * 3;
      }

      // Apply pattern confidence
      score *= pattern.confidence;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { intent, score, pattern };
      }
    }

    // Require minimum confidence threshold
    if (bestMatch && bestMatch.score > 2) {
      // Update usage stats
      bestMatch.pattern.usageCount = (bestMatch.pattern.usageCount || 0) + 1;
      bestMatch.pattern.lastUsed = Date.now();
      await this.saveLearnedPatterns(); // Save updated usage stats
      
      return {
        intent: bestMatch.intent,
        confidence: Math.min(1.0, bestMatch.score / 10),
        suggestedAction: bestMatch.pattern.actionTemplate,
        suggestedResponse: bestMatch.pattern.responseTemplate,
      };
    }

    return null;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }

    const union = words1.size + words2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Learn from user feedback (reinforcement learning)
   */
  async learnFromFeedback(
    userInput: string,
    correctIntent: string,
    wasCorrect: boolean
  ): Promise<void> {
    if (wasCorrect) {
      // Reinforce the pattern
      const pattern = this.patterns.get(correctIntent);
      if (pattern) {
        if (!pattern.examples.includes(userInput)) {
          pattern.examples.push(userInput);
        }
        pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
      }
    } else {
      // Create or strengthen the correct pattern
      await this.learnPattern({
        input: userInput,
        intent: correctIntent,
      });
    }

    await this.saveLearnedPatterns();
  }

  /**
   * Save learned patterns to storage
   */
  private async saveLearnedPatterns(): Promise<void> {
    try {
      const patternsData = Array.from(this.patterns.entries()).map(([intent, pattern]) => ({
        intent,
        ...pattern,
      }));
      await AsyncStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patternsData));
    } catch (error) {
      console.error('❌ Failed to save learned patterns:', error);
    }
  }

  /**
   * Load learned patterns from storage
   */
  private async loadLearnedPatterns(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PATTERNS_STORAGE_KEY);
      if (stored) {
        const patternsData = JSON.parse(stored);
        this.patterns.clear();
        for (const patternData of patternsData) {
          const { intent, ...pattern } = patternData;
          this.patterns.set(intent, pattern);
        }
        console.log('✅ Loaded', this.patterns.size, 'learned patterns');
      }
    } catch (error) {
      console.error('❌ Failed to load learned patterns:', error);
    }
  }

  /**
   * Get all learned patterns (for debugging)
   */
  getAllPatterns(): LearnedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Clear all learned patterns
   */
  async clearPatterns(): Promise<void> {
    this.patterns.clear();
    await AsyncStorage.removeItem(PATTERNS_STORAGE_KEY);
    console.log('🗑️ Cleared all learned patterns');
  }
}

// Singleton instance
export const patternLearner = new LightPatternLearner();
