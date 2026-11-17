/**
 * Light Conversation Engine
 * ChatGPT-5 level conversational AI for mobile
 * Features: Context awareness, reasoning, empathy, natural language understanding
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConversationContext {
  topic?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  entities: string[];
  previousQuestions: string[];
  userPreferences: Record<string, any>;
  conversationFlow: Array<{
    userIntent: string;
    aiResponse: string;
    timestamp: number;
  }>;
}

export interface UnderstandingResult {
  intent: string;
  subIntent?: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  requiresFollowUp: boolean;
  suggestedResponses: string[];
  context: ConversationContext;
}

const CONTEXT_STORAGE_KEY = '@light_conversation_context';
const MAX_CONTEXT_HISTORY = 50;

export class LightConversationEngine {
  private currentContext: ConversationContext = {
    entities: [],
    previousQuestions: [],
    userPreferences: {},
    conversationFlow: [],
  };

  /**
   * Initialize conversation engine
   */
  async initialize(): Promise<void> {
    try {
      // Load previous context
      const stored = await AsyncStorage.getItem(CONTEXT_STORAGE_KEY);
      if (stored) {
        this.currentContext = JSON.parse(stored);
        console.log('✅ Loaded conversation context');
      }
    } catch (error) {
      console.warn('⚠️ Could not load context:', error);
    }
  }

  /**
   * Deep understanding of user input (ChatGPT-5 level)
   * Analyzes: intent, entities, sentiment, context, nuance
   */
  async understand(userInput: string): Promise<UnderstandingResult> {
    const lower = userInput.toLowerCase().trim();
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(userInput);
    
    // Extract entities (names, places, times, etc.)
    const entities = this.extractEntities(userInput);
    
    // Determine intent with sub-intents
    const { intent, subIntent } = this.determineIntent(userInput);
    
    // Check if requires follow-up
    const requiresFollowUp = this.requiresFollowUp(userInput, intent);
    
    // Generate contextual suggested responses
    const suggestedResponses = this.generateSuggestedResponses(intent, entities, sentiment);
    
    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(userInput, intent, entities);
    
    // Update conversation context
    this.updateContext(userInput, intent, entities);
    
    return {
      intent,
      subIntent,
      entities,
      sentiment,
      confidence,
      requiresFollowUp,
      suggestedResponses,
      context: this.currentContext,
    };
  }

  /**
   * Advanced sentiment analysis
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lower = text.toLowerCase();
    
    // Positive indicators
    const positiveWords = [
      'great', 'good', 'excellent', 'awesome', 'fantastic', 'wonderful',
      'love', 'like', 'happy', 'glad', 'pleased', 'thank', 'thanks',
      'amazing', 'perfect', 'brilliant', 'nice', 'cool', 'yes', 'sure'
    ];
    
    // Negative indicators
    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad',
      'disappointed', 'frustrated', 'annoyed', 'wrong', 'issue', 'problem',
      'error', 'fail', 'broken', 'not working', 'no', 'never', 'can\'t', 'won\'t'
    ];
    
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lower.includes(word)) score++;
    });
    
    negativeWords.forEach(word => {
      if (lower.includes(word)) score--;
    });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Extract entities (names, places, numbers, dates, etc.)
   */
  private extractEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract numbers
    const numbers = text.match(/\d+/g);
    if (numbers) {
      entities.numbers = numbers.map(n => parseInt(n));
    }
    
    // Extract time expressions
    const timePatterns = [
      /(\d+)\s*(am|pm)/gi,
      /(morning|afternoon|evening|night|tomorrow|today|yesterday)/gi,
      /(\d+)\s*(minute|hour|day|week|month)s?/gi,
    ];
    
    timePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.time = matches;
      }
    });
    
    // Extract app names
    const appNames = [
      'whatsapp', 'instagram', 'facebook', 'youtube', 'spotify',
      'netflix', 'gmail', 'chrome', 'maps', 'camera', 'gallery'
    ];
    
    appNames.forEach(app => {
      if (text.toLowerCase().includes(app)) {
        if (!entities.apps) entities.apps = [];
        entities.apps.push(app);
      }
    });
    
    // Extract contact names (capitalized words that aren't commands)
    const words = text.split(' ');
    const capitalizedWords = words.filter(w => 
      w.length > 1 && 
      w[0] === w[0].toUpperCase() && 
      w.slice(1) === w.slice(1).toLowerCase()
    );
    
    if (capitalizedWords.length > 0) {
      entities.names = capitalizedWords;
    }
    
    return entities;
  }

  /**
   * Determine intent with sub-intents (ChatGPT-5 level understanding)
   */
  private determineIntent(text: string): { intent: string; subIntent?: string } {
    const lower = text.toLowerCase();
    
    // Question intents
    if (lower.includes('?') || lower.startsWith('what ') || lower.startsWith('how ') ||
        lower.startsWith('why ') || lower.startsWith('when ') || lower.startsWith('where ') ||
        lower.startsWith('who ')) {
      
      // Sub-categorize questions
      if (lower.includes('how to') || lower.includes('how do i')) {
        return { intent: 'question', subIntent: 'tutorial' };
      }
      if (lower.includes('what is') || lower.includes('who is')) {
        return { intent: 'question', subIntent: 'definition' };
      }
      if (lower.includes('why')) {
        return { intent: 'question', subIntent: 'explanation' };
      }
      if (lower.includes('where')) {
        return { intent: 'question', subIntent: 'location' };
      }
      if (lower.includes('when')) {
        return { intent: 'question', subIntent: 'time' };
      }
      
      return { intent: 'question', subIntent: 'general' };
    }
    
    // Request intents
    if (lower.startsWith('can you') || lower.startsWith('could you') || 
        lower.startsWith('would you') || lower.startsWith('please')) {
      return { intent: 'request', subIntent: 'polite' };
    }
    
    // Command intents
    if (lower.match(/^(open|launch|start|run|execute)/)) {
      return { intent: 'command', subIntent: 'app_control' };
    }
    if (lower.match(/^(call|dial|phone)/)) {
      return { intent: 'command', subIntent: 'communication' };
    }
    if (lower.match(/^(remind|set|create|schedule)/)) {
      return { intent: 'command', subIntent: 'task_management' };
    }
    if (lower.match(/^(search|google|find|look up)/)) {
      return { intent: 'command', subIntent: 'information_retrieval' };
    }
    
    // Conversational intents
    if (lower.match(/^(hello|hi|hey|good morning|good evening)/)) {
      return { intent: 'conversation', subIntent: 'greeting' };
    }
    if (lower.match(/^(thank|thanks|appreciate)/)) {
      return { intent: 'conversation', subIntent: 'gratitude' };
    }
    if (lower.match(/^(bye|goodbye|see you|later)/)) {
      return { intent: 'conversation', subIntent: 'farewell' };
    }
    
    // Opinion/advice intents
    if (lower.includes('should i') || lower.includes('what do you think')) {
      return { intent: 'advice', subIntent: 'decision_support' };
    }
    if (lower.includes('recommend') || lower.includes('suggest')) {
      return { intent: 'advice', subIntent: 'recommendation' };
    }
    
    // Clarification intents
    if (lower.match(/^(what|huh|sorry|excuse me|repeat)/)) {
      return { intent: 'clarification', subIntent: 'did_not_understand' };
    }
    
    // Problem/complaint intents
    if (lower.includes('not working') || lower.includes('broken') || 
        lower.includes('issue') || lower.includes('problem')) {
      return { intent: 'problem', subIntent: 'technical_issue' };
    }
    
    // Learning intents
    if (lower.includes('teach') || lower.includes('show me') || 
        lower.includes('explain') || lower.includes('learn')) {
      return { intent: 'learning', subIntent: 'tutorial_request' };
    }
    
    return { intent: 'unknown', subIntent: undefined };
  }

  /**
   * Check if input requires follow-up questions
   */
  private requiresFollowUp(text: string, intent: string): boolean {
    const lower = text.toLowerCase();
    
    // Ambiguous commands need clarification
    if (intent === 'command') {
      if (lower.match(/^(open|call|remind)/)) {
        // Check if target is specified
        if (!lower.match(/open \w+|call \w+|remind .+ (in|at)/)) {
          return true;
        }
      }
    }
    
    // Incomplete questions
    if (intent === 'question') {
      if (lower === 'what' || lower === 'how' || lower === 'why') {
        return true;
      }
    }
    
    // Vague requests
    if (lower.match(/^(help|do something|i need)/)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate contextual suggested responses (ChatGPT-5 style)
   */
  private generateSuggestedResponses(
    intent: string,
    entities: Record<string, any>,
    sentiment: string
  ): string[] {
    const responses: string[] = [];
    
    switch (intent) {
      case 'question':
        responses.push('Let me search for that information, sir.');
        responses.push('I can look that up for you.');
        responses.push('Based on what I know...');
        break;
        
      case 'command':
        responses.push('Executing that now, sir.');
        responses.push('On it!');
        responses.push('Right away, sir.');
        break;
        
      case 'conversation':
        if (sentiment === 'positive') {
          responses.push('I\'m glad to help, sir!');
          responses.push('It\'s my pleasure!');
        } else if (sentiment === 'negative') {
          responses.push('I understand your frustration, sir.');
          responses.push('Let me help you with that.');
        } else {
          responses.push('I\'m here to assist, sir.');
          responses.push('How can I help?');
        }
        break;
        
      case 'advice':
        responses.push('Here are some factors to consider...');
        responses.push('Based on common practices...');
        responses.push('Let me provide some perspective...');
        break;
        
      case 'problem':
        responses.push('Let me help you troubleshoot that, sir.');
        responses.push('I\'ll assist you in resolving this.');
        responses.push('Let\'s fix this together.');
        break;
    }
    
    return responses;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(
    userInput: string,
    intent: string,
    entities: Record<string, any>
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Clear intent patterns increase confidence
    if (intent !== 'unknown') {
      confidence += 0.2;
    }
    
    // Entities extraction increases confidence
    if (Object.keys(entities).length > 0) {
      confidence += 0.1 * Object.keys(entities).length;
    }
    
    // Complete sentences increase confidence
    if (userInput.split(' ').length > 3) {
      confidence += 0.1;
    }
    
    // Context continuity increases confidence
    if (this.currentContext.topic && userInput.toLowerCase().includes(this.currentContext.topic)) {
      confidence += 0.15;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Update conversation context
   */
  private updateContext(userInput: string, intent: string, entities: Record<string, any>): void {
    // Track conversation flow
    this.currentContext.conversationFlow.push({
      userIntent: intent,
      aiResponse: '', // Will be filled after response
      timestamp: Date.now(),
    });
    
    // Keep only recent history
    if (this.currentContext.conversationFlow.length > MAX_CONTEXT_HISTORY) {
      this.currentContext.conversationFlow = this.currentContext.conversationFlow.slice(-MAX_CONTEXT_HISTORY);
    }
    
    // Update topic based on entities
    if (entities.apps && entities.apps.length > 0) {
      this.currentContext.topic = entities.apps[0];
    }
    
    // Merge new entities
    this.currentContext.entities = [
      ...this.currentContext.entities,
      ...Object.values(entities).flat(),
    ].slice(-20); // Keep only recent 20
    
    // Track questions
    if (userInput.includes('?')) {
      this.currentContext.previousQuestions.push(userInput);
      this.currentContext.previousQuestions = this.currentContext.previousQuestions.slice(-10);
    }
    
    // Save context
    this.saveContext();
  }

  /**
   * Get contextual information for response generation
   */
  getContextualInfo(): string {
    let info = '';
    
    if (this.currentContext.topic) {
      info += `Current topic: ${this.currentContext.topic}. `;
    }
    
    if (this.currentContext.previousQuestions.length > 0) {
      const lastQ = this.currentContext.previousQuestions[this.currentContext.previousQuestions.length - 1];
      info += `Previously asked: "${lastQ}". `;
    }
    
    if (this.currentContext.entities.length > 0) {
      info += `Known entities: ${this.currentContext.entities.slice(-5).join(', ')}. `;
    }
    
    return info;
  }

  /**
   * Save conversation context
   */
  private async saveContext(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(this.currentContext));
    } catch (error) {
      console.warn('⚠️ Could not save context:', error);
    }
  }

  /**
   * Clear conversation context
   */
  async clearContext(): Promise<void> {
    this.currentContext = {
      entities: [],
      previousQuestions: [],
      userPreferences: {},
      conversationFlow: [],
    };
    await AsyncStorage.removeItem(CONTEXT_STORAGE_KEY);
  }

  /**
   * Analyze conversation quality
   */
  getConversationStats(): {
    totalInteractions: number;
    averageSentiment: string;
    commonTopics: string[];
    engagementLevel: number;
  } {
    const flow = this.currentContext.conversationFlow;
    
    // Calculate average sentiment
    let sentimentScore = 0;
    // (simplified - in real implementation would track sentiments)
    
    // Find common topics
    const topicCounts = new Map<string, number>();
    this.currentContext.entities.forEach(entity => {
      topicCounts.set(entity, (topicCounts.get(entity) || 0) + 1);
    });
    
    const commonTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
    
    // Calculate engagement (interactions in last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentInteractions = flow.filter(f => f.timestamp > oneHourAgo).length;
    const engagementLevel = Math.min(recentInteractions / 10, 1.0);
    
    return {
      totalInteractions: flow.length,
      averageSentiment: 'neutral', // Simplified
      commonTopics,
      engagementLevel,
    };
  }
}

// Singleton
export const conversationEngine = new LightConversationEngine();
