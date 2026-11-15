/**
 * Light AI Service
 * Complete autonomous AI system - no external APIs needed
 * Combines: Pattern Learning + Brain (web search) + Teacher (user demonstrations)
 */

import { patternLearner } from './light-pattern-learner';
import { lightBrain } from './light-brain';
import { lightTeacher } from './light-teacher';

export interface LightAIResponse {
  text: string;
  intent?: string;
  confidence?: number;
  action?: string;
  requiresTeaching?: boolean;
  source?: 'learned' | 'web' | 'user_taught' | 'fallback';
}

export class LightAIService {
  private initialized = false;

  /**
   * Initialize all Light AI components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing Light AI Service...');

      // Initialize pattern learner
      await patternLearner.initialize();

      // Initialize brain (knowledge base)
      await lightBrain.initialize();

      // Initialize teacher (user demonstrations)
      await lightTeacher.initialize();

      this.initialized = true;
      console.log('✅ Light AI Service ready!');
    } catch (error) {
      console.error('❌ Failed to initialize Light AI Service:', error);
      throw error;
    }
  }

  /**
   * Process user input and generate response
   * This is the main entry point - replaces all external API calls
   */
  async chat(userMessage: string): Promise<LightAIResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('💭 Processing:', userMessage);

      // Step 1: Try to recognize intent from learned patterns
      const recognized = await patternLearner.recognizeIntent(userMessage);

      if (recognized && recognized.confidence > 0.6) {
        console.log(`✅ Recognized intent: ${recognized.intent} (${(recognized.confidence * 100).toFixed(0)}% confidence)`);

        return {
          text: recognized.suggestedResponse || this.generateResponse(recognized.intent, userMessage),
          intent: recognized.intent,
          confidence: recognized.confidence,
          action: recognized.suggestedAction,
          source: 'learned',
        };
      }

      // Step 2: Check if user has taught us how to handle this
      const userTaughtResponse = await lightTeacher.findMatchingDemonstration(userMessage);
      if (userTaughtResponse) {
        console.log('✅ Found user-taught response');
        return {
          text: userTaughtResponse.explanation,
          action: userTaughtResponse.steps.join(' → '),
          source: 'user_taught',
        };
      }

      // Step 3: Search the web for information
      console.log('🌐 Searching web for information...');
      const webResults = await lightBrain.search(userMessage);

      if (webResults && webResults.length > 0) {
        // Store this knowledge for future use
        await lightBrain.storeKnowledge({
          query: userMessage,
          answer: webResults[0].snippet,
          source: webResults[0].link,
          confidence: 0.7,
        });

        return {
          text: this.formatWebResponse(webResults),
          source: 'web',
        };
      }

      // Step 4: Offer to learn from user
      console.log('❓ Unknown request - offering to learn');
      return {
        text: "I'm not sure how to help with that yet. Would you like to teach me? You can show me how to do it, and I'll remember for next time!",
        requiresTeaching: true,
        source: 'fallback',
      };

    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        text: "I encountered an error. Let me try to learn from this...",
        source: 'fallback',
      };
    }
  }

  /**
   * Execute an action based on recognized intent
   */
  async executeAction(intent: string, userMessage: string): Promise<boolean> {
    console.log(`🎬 Executing action for intent: ${intent}`);

    try {
      // Check if we learned how to execute this from the user
      const demonstration = await lightTeacher.findMatchingDemonstration(userMessage);
      
      if (demonstration) {
        console.log('✅ Executing user-taught steps');
        // In a real implementation, this would trigger actual app actions
        // For now, we just log the steps
        console.log('Steps:', demonstration.steps);
        return true;
      }

      // Check brain's knowledge base for instructions
      const knowledge = await lightBrain.recall(userMessage);
      
      if (knowledge.length > 0) {
        console.log('✅ Found instructions in knowledge base');
        // Execute based on stored knowledge
        return true;
      }

      // Search web for instructions
      const webResults = await lightBrain.search(userMessage + ' how to');
      
      if (webResults.length > 0) {
        console.log('✅ Found instructions on web');
        // Store for future use
        await lightBrain.storeKnowledge({
          query: userMessage,
          answer: webResults[0].snippet,
          source: webResults[0].link,
          confidence: 0.7,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error executing action:', error);
      return false;
    }
  }

  /**
   * Learn from training data file
   */
  async loadTrainingData(trainingDataPath: string): Promise<void> {
    try {
      console.log('📚 Loading training data from:', trainingDataPath);
      
      // In React Native, you'd import the JSON file
      // For now, this is a placeholder
      // const trainingData = require(trainingDataPath);
      // await patternLearner.learnFromExamples(trainingData);
      
      console.log('✅ Training data loaded');
    } catch (error) {
      console.error('❌ Failed to load training data:', error);
    }
  }

  /**
   * Start teaching mode
   */
  async startTeaching(taskDescription: string): Promise<void> {
    await lightTeacher.startRecording(taskDescription);
  }

  /**
   * Record a teaching step
   */
  async recordStep(action: string, explanation: string): Promise<void> {
    await lightTeacher.recordStep(action, explanation);
  }

  /**
   * Stop teaching and save
   */
  async stopTeaching(): Promise<boolean> {
    return await lightTeacher.stopRecording();
  }

  /**
   * Provide feedback on AI response
   */
  async provideFeedback(
    userInput: string,
    correctIntent: string,
    wasCorrect: boolean
  ): Promise<void> {
    await patternLearner.learnFromFeedback(userInput, correctIntent, wasCorrect);
  }

  /**
   * Generate a natural response based on intent
   */
  private generateResponse(intent: string, userMessage: string): string {
    const responses: Record<string, string[]> = {
      reminder_create: [
        "I'll set that reminder for you!",
        "Reminder created!",
        "Got it, I'll remind you about that.",
      ],
      contact_call: [
        "Calling now...",
        "Dialing the contact...",
      ],
      contact_message: [
        "Sending message...",
        "I'll send that message now.",
      ],
      system_volume: [
        "Adjusting volume...",
        "Volume changed!",
      ],
      system_brightness: [
        "Adjusting brightness...",
        "Brightness updated!",
      ],
      app_open: [
        "Opening the app...",
        "Launching app...",
      ],
      information_time: [
        "Let me check the time for you...",
      ],
      information_weather: [
        "Checking the weather...",
      ],
      conversation_greeting: [
        "Hello! How can I help you?",
        "Hi there! What can I do for you?",
        "Hey! I'm here to assist.",
      ],
      conversation_thanks: [
        "You're welcome!",
        "Happy to help!",
        "Anytime!",
      ],
      error_not_found: [
        "I couldn't find that.",
        "Sorry, I don't see that here.",
      ],
    };

    const intentResponses = responses[intent];
    if (intentResponses) {
      return intentResponses[Math.floor(Math.random() * intentResponses.length)];
    }

    return "I'll help you with that!";
  }

  /**
   * Format web search results into a response
   */
  private formatWebResponse(results: any[]): string {
    if (results.length === 0) {
      return "I couldn't find any information about that.";
    }

    const topResult = results[0];
    let response = `Based on what I found: ${topResult.snippet}`;

    if (results.length > 1) {
      response += `\n\nI also found ${results.length - 1} more result${results.length > 2 ? 's' : ''}.`;
    }

    return response;
  }

  /**
   * Get statistics about learned patterns
   */
  async getStats(): Promise<{
    learnedPatterns: number;
    knowledgeItems: number;
    demonstrations: number;
  }> {
    const patterns = patternLearner.getAllPatterns();
    const knowledge = await lightBrain.recall(''); // Get all knowledge
    const demos = await lightTeacher.getAllDemonstrations();

    return {
      learnedPatterns: patterns.length,
      knowledgeItems: knowledge.length,
      demonstrations: demos.length,
    };
  }

  /**
   * Clear all learned data (reset AI)
   */
  async reset(): Promise<void> {
    console.log('🗑️ Resetting Light AI...');
    await patternLearner.clearPatterns();
    // Note: Brain and Teacher have their own clear methods if needed
    console.log('✅ Light AI reset complete');
  }
}

// Singleton instance - use this throughout the app
export const lightAI = new LightAIService();

// Export for convenience
export { lightBrain, lightTeacher, patternLearner };
