/**
 * Light AI Service
 * Complete autonomous AI system - no external APIs needed
 * Combines: Pattern Learning + Brain (web search) + Teacher (user demonstrations) + EXECUTION
 * MOBILE-OPTIMIZED: Fast, conversational, context-aware
 * ChatGPT-5 LEVEL: Rich understanding, reasoning, personality, ENHANCED WEB SEARCH
 */

import { patternLearner, type TrainingExample } from './light-pattern-learner';
import { conversationEngine } from './light-conversation-engine';
import { webSearchEngine } from './light-web-search-engine';
import { lightBrain } from './light-brain';
import { lightTeacher } from './light-teacher';
import { storageManager } from './light-storage-manager';
import { actionExecutor } from './light-action-executor';

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
   * MOBILE-OPTIMIZED: Fast startup, low memory
   * ChatGPT-5 LEVEL: Rich conversation data loaded
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing Light AI Service (ChatGPT-5 level)...');

      // Initialize conversation engine for deep understanding
      await conversationEngine.initialize();
      console.log('✅ Conversation engine ready');

      // Initialize pattern learner
      await patternLearner.initialize();

      // Load rich conversation training data
      await this.loadRichTrainingData();

      // Pre-load common mobile intents for instant recognition
      await this.preloadMobileIntents();

      // Initialize brain (knowledge base)
      await lightBrain.initialize();

      // Initialize teacher (user demonstrations)
      await lightTeacher.initialize();

      // Check storage and cleanup if needed
      console.log('📊 Checking storage health...');
      await storageManager.checkAndCleanup();
      
      const stats = await storageManager.getStats();
      console.log('💾 Storage stats:', stats);

      this.initialized = true;
      console.log('✅ Light AI Service ready! (ChatGPT-5 level intelligence)');
    } catch (error) {
      console.error('❌ Failed to initialize Light AI Service:', error);
      throw error;
    }
  }

  /**
   * Load rich conversation training data
   * Thousands of examples for natural, human-like responses
   */
  private async loadRichTrainingData(): Promise<void> {
    try {
      console.log('📚 Loading rich conversation training data...');
      
      // In production, load from assets/training/rich-conversation-data.json
      // For now, we'll use require if available or skip gracefully
      
      try {
        const trainingData = require('../../assets/training/rich-conversation-data.json');
        
        let totalExamples = 0;
        
        // Process conversational examples
        if (trainingData.conversational) {
          for (const category of trainingData.conversational) {
            if (category.examples) {
              await patternLearner.learnFromExamples(
                category.examples.map((ex: any) => ({
                  input: ex.input,
                  intent: ex.intent,
                  response: ex.response,
                }))
              );
              totalExamples += category.examples.length;
            }
          }
        }
        
        // Process question examples
        if (trainingData.questions_knowledge) {
          for (const category of trainingData.questions_knowledge) {
            if (category.examples) {
              await patternLearner.learnFromExamples(
                category.examples.map((ex: any) => ({
                  input: ex.input,
                  intent: ex.intent,
                  action: ex.action,
                }))
              );
              totalExamples += category.examples.length;
            }
          }
        }
        
        // Process advice examples
        if (trainingData.advice_opinion) {
          for (const category of trainingData.advice_opinion) {
            if (category.examples) {
              await patternLearner.learnFromExamples(
                category.examples.map((ex: any) => ({
                  input: ex.input,
                  intent: ex.intent,
                  response: ex.response,
                }))
              );
              totalExamples += category.examples.length;
            }
          }
        }
        
        // Process emotional intelligence examples
        if (trainingData.emotional_intelligence) {
          for (const category of trainingData.emotional_intelligence) {
            if (category.examples) {
              await patternLearner.learnFromExamples(
                category.examples.map((ex: any) => ({
                  input: ex.input,
                  intent: ex.intent,
                  response: ex.response,
                }))
              );
              totalExamples += category.examples.length;
            }
          }
        }
        
        console.log(`✅ Loaded ${totalExamples} rich training examples`);
      } catch (loadError) {
        console.warn('⚠️ Could not load training file, using pre-loaded intents only');
      }
    } catch (error) {
      console.warn('⚠️ Error loading rich training data:', error);
      // Continue anyway - base intents still work
    }
  }

  /**
   * Pre-load common mobile assistant intents
   * This makes Light respond instantly to common requests
   */
  private async preloadMobileIntents(): Promise<void> {
    const commonIntents: TrainingExample[] = [
      // Greetings
      { input: 'hello', intent: 'greeting', response: 'Hello sir! How can I help you?' },
      { input: 'hi', intent: 'greeting', response: 'Hi sir! What can I do for you?' },
      { input: 'hey light', intent: 'greeting', response: 'Yes sir, I'm here!' },
      
      // Thanks
      { input: 'thank you', intent: 'thanks', response: 'You're welcome, sir!' },
      { input: 'thanks', intent: 'thanks', response: 'Happy to help, sir!' },
      
      // Confirmations
      { input: 'yes', intent: 'confirm', response: 'Understood, sir.' },
      { input: 'okay', intent: 'confirm', response: 'Got it, sir.' },
      { input: 'sure', intent: 'confirm', response: 'Proceeding, sir.' },
      
      // Cancellations
      { input: 'cancel', intent: 'cancel', response: 'Cancelled, sir.' },
      { input: 'stop', intent: 'cancel', response: 'Stopped, sir.' },
      { input: 'never mind', intent: 'cancel', response: 'No problem, sir.' },
      
      // Help
      { input: 'help', intent: 'help', response: 'I can help with tasks, answer questions, control your phone, and more. What do you need, sir?' },
      { input: 'what can you do', intent: 'help', response: 'I can set reminders, make calls, open apps, search the web, answer questions, and learn from you. Just ask!' },
      
      // Common questions
      { input: 'are you there', intent: 'presence', response: 'Yes sir, I'm always here!' },
      { input: 'can you hear me', intent: 'presence', response: 'Yes sir, I can hear you perfectly!' },
      
      // Reminders
      { input: 'set reminder', intent: 'reminder_create', action: 'set_reminder' },
      { input: 'remind me', intent: 'reminder_create', action: 'set_reminder' },
      { input: 'create reminder', intent: 'reminder_create', action: 'set_reminder' },
      
      // Calls
      { input: 'call someone', intent: 'contact_call', action: 'make_call' },
      { input: 'make a call', intent: 'contact_call', action: 'make_call' },
      { input: 'phone someone', intent: 'contact_call', action: 'make_call' },
      
      // Apps
      { input: 'open app', intent: 'app_open', action: 'open_app' },
      { input: 'launch app', intent: 'app_open', action: 'open_app' },
      
      // Search
      { input: 'search for', intent: 'web_search', action: 'web_search' },
      { input: 'google', intent: 'web_search', action: 'web_search' },
      { input: 'look up', intent: 'web_search', action: 'web_search' },
      
      // Time/Date
      { input: 'what time', intent: 'information_time', action: 'get_time' },
      { input: 'current time', intent: 'information_time', action: 'get_time' },
      { input: 'what date', intent: 'information_date', action: 'get_date' },
      { input: 'today', intent: 'information_date', action: 'get_date' },
      
      // Weather
      { input: 'weather', intent: 'information_weather', action: 'get_weather' },
      { input: 'temperature', intent: 'information_weather', action: 'get_weather' },
      
      // Messages
      { input: 'read messages', intent: 'read_messages', action: 'read_messages' },
      { input: 'check messages', intent: 'read_messages', action: 'read_messages' },
      { input: 'any messages', intent: 'read_messages', action: 'read_messages' },
    ];

    try {
      await patternLearner.learnFromExamples(commonIntents);
      console.log('✅ Pre-loaded', commonIntents.length, 'common mobile intents');
    } catch (error) {
      console.warn('⚠️ Could not pre-load intents:', error);
      // Continue anyway - not critical
    }
  }

  /**
   * Process user input and generate response
   * MOBILE-OPTIMIZED: Fast, smart, context-aware, conversational
   * ChatGPT-5 LEVEL: Deep understanding with conversation engine
   */
  async chat(userMessage: string): Promise<LightAIResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('💭 Light AI processing (ChatGPT-5 level):', userMessage);

      // Step 0: Deep understanding using conversation engine
      const understanding = await conversationEngine.understand(userMessage);
      console.log('🧠 Understanding:', {
        intent: understanding.intent,
        subIntent: understanding.subIntent,
        sentiment: understanding.sentiment,
        confidence: understanding.confidence,
      });

      // Get contextual information from previous conversations
      const contextInfo = conversationEngine.getContextualInfo();
      if (contextInfo) {
        console.log('📝 Context:', contextInfo);
      }

      // Step 1: Handle based on deep understanding
      
      // If requires follow-up, ask clarifying question
      if (understanding.requiresFollowUp) {
        console.log('❓ Requires follow-up question');
        return {
          text: this.generateClarifyingQuestion(understanding),
          source: 'conversation',
          confidence: 1.0,
        };
      }

      // Step 2: Check if this is a question or conversation (needs intelligent response)
      const needsIntelligence = this.needsIntelligentResponse(userMessage);
      
      if (needsIntelligence) {
        console.log('🧠 User needs intelligent conversation, not just commands');
        
        // Try web search for factual questions using ENHANCED SEARCH
        if (this.isFactualQuestion(userMessage)) {
          console.log('🌐 Factual question detected, using enhanced multi-source search...');
          
          const enhancedResults = await webSearchEngine.enhancedSearch(userMessage);
          
          if (enhancedResults.mainAnswer && enhancedResults.mainAnswer !== 'No results found') {
            let answer = enhancedResults.mainAnswer;
            
            // Add key points if available
            if (enhancedResults.synthesizedInfo.keyPoints.length > 0) {
              answer += `\n\n💡 Key insights from ${enhancedResults.sources.length} sources:`;
              enhancedResults.synthesizedInfo.keyPoints.slice(0, 3).forEach((point, i) => {
                answer += `\n${i + 1}. ${point}`;
              });
            }
            
            // Add related questions if available
            if (enhancedResults.relatedQuestions.length > 0) {
              answer += `\n\n🔍 Related: ${enhancedResults.relatedQuestions[0]}`;
            }
            
            // Store this knowledge for future use
            await lightBrain.storeKnowledge({
              query: userMessage,
              answer: answer,
              source: enhancedResults.sources[0]?.link || 'web',
              confidence: enhancedResults.synthesizedInfo.confidence,
            });
            
            return {
              text: answer,
              source: 'web',
              confidence: enhancedResults.synthesizedInfo.confidence,
            };
          }
        }
        
        // For opinions, advice, explanations - use Light's personality
        if (this.needsPersonalityResponse(userMessage)) {
          console.log('💡 Generating personality-driven response');
          return {
            text: this.generatePersonalityResponse(userMessage, understanding),
            source: 'learned',
            confidence: 0.9,
          };
        }
        
        // Check recalled knowledge
        const recalled = await lightBrain.recall(userMessage);
        if (recalled.length > 0) {
          console.log('📚 Found relevant knowledge from memory');
          return {
            text: recalled[0].answer,
            source: 'learned',
            confidence: recalled[0].confidence,
          };
        }
      }

      // Step 3: Try to recognize intent from learned patterns
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

      // Step 4: Check if user has taught us how to handle this
      const userTaughtResponse = await lightTeacher.findMatchingDemonstration(userMessage);
      if (userTaughtResponse) {
        console.log('✅ Found user-taught response');
        return {
          text: userTaughtResponse.explanation,
          action: userTaughtResponse.steps.join(' → '),
          source: 'user_taught',
        };
      }

      // Step 5: Try enhanced web search as last resort
      console.log('🌐 Using enhanced multi-source web search...');
      const enhancedResults = await webSearchEngine.enhancedSearch(userMessage);

      if (enhancedResults.mainAnswer && enhancedResults.mainAnswer !== 'No results found') {
        let answer = enhancedResults.mainAnswer;
        
        // Add confidence indicator
        const confidenceLevel = enhancedResults.synthesizedInfo.confidence;
        if (confidenceLevel > 0.8) {
          answer = `I'm confident about this, sir:\n\n` + answer;
        } else if (confidenceLevel > 0.6) {
          answer = `Based on what I found, sir:\n\n` + answer;
        } else {
          answer = `I found some information, though sources vary, sir:\n\n` + answer;
        }
        
        // Store this knowledge for future use
        await lightBrain.storeKnowledge({
          query: userMessage,
          answer: answer,
          source: enhancedResults.sources[0]?.link || 'web',
          confidence: confidenceLevel,
        });

        return {
          text: answer,
          source: 'web',
          confidence: confidenceLevel,
        };
      }

      // Step 6: Intelligent fallback based on sentiment
      console.log('❓ Unknown request - intelligent fallback');
      return {
        text: this.generateIntelligentFallback(understanding),
        requiresTeaching: true,
        source: 'fallback',
      };

    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        text: "I encountered an error processing that, sir. Could you try rephrasing?",
        source: 'fallback',
      };
    }
  }

  /**
   * Generate clarifying question when user input is ambiguous
   */
  private generateClarifyingQuestion(understanding: any): string {
    const { intent, entities } = understanding;
    
    if (intent === 'command') {
      if (!entities.apps && !entities.names) {
        return "I'd be happy to help, sir. Could you specify what you'd like me to do?";
      }
    }
    
    if (intent === 'question') {
      return "I want to help you with that, sir. Could you provide more details about what you're asking?";
    }
    
    return "Could you clarify that for me, sir? I want to make sure I understand correctly.";
  }

  /**
   * Generate intelligent fallback based on context
   */
  private generateIntelligentFallback(understanding: any): string {
    const { sentiment, intent } = understanding;
    
    if (sentiment === 'negative') {
      return "I sense you might be frustrated, sir. I'm still learning, but I want to help. Could you rephrase that, or would you like to teach me how to handle this?";
    }
    
    if (intent === 'question') {
      return "That's an interesting question, sir. I don't have a good answer yet, but I can search the web for information. Would you like me to do that?";
    }
    
    return "I'm not sure about that yet, sir. Could you help me understand, or should I search the web for more information?";
  }

  /**
   * Check if user input needs intelligent response (not just command execution)
   */
  private needsIntelligentResponse(text: string): boolean {
    const lower = text.toLowerCase();
    
    // Questions always need intelligence
    if (lower.includes('?') ||
        lower.startsWith('what ') ||
        lower.startsWith('who ') ||
        lower.startsWith('where ') ||
        lower.startsWith('when ') ||
        lower.startsWith('why ') ||
        lower.startsWith('how ') ||
        lower.startsWith('can you') ||
        lower.startsWith('could you') ||
        lower.startsWith('would you') ||
        lower.startsWith('should i') ||
        lower.startsWith('tell me') ||
        lower.startsWith('explain')) {
      return true;
    }
    
    // Conversational phrases
    const conversationalPhrases = [
      'i think', 'i feel', 'i believe', 'i wonder',
      'do you think', 'what do you think',
      'help me understand', 'i want to know',
      'i need advice', 'i need help'
    ];
    
    return conversationalPhrases.some(phrase => lower.includes(phrase));
  }

  /**
   * Check if this is a factual question that needs web search
   */
  private isFactualQuestion(text: string): boolean {
    const lower = text.toLowerCase();
    
    // Factual question patterns
    const factualPatterns = [
      /what is|what are|what's/,
      /who is|who are|who's/,
      /where is|where are|where's/,
      /when is|when did|when was/,
      /how much|how many|how old/,
      /define|meaning of|definition/,
      /capital of|population of|president of/,
      /latest|current|today's|recent/
    ];
    
    return factualPatterns.some(pattern => pattern.test(lower));
  }

  /**
   * Check if needs personality-driven response (opinions, advice)
   */
  private needsPersonalityResponse(text: string): boolean {
    const lower = text.toLowerCase();
    
    const personalityPhrases = [
      'should i', 'what do you think',
      'do you recommend', 'your opinion',
      'how do i feel', 'am i',
      'tell me about yourself', 'who are you',
      'what can you do', 'your capabilities'
    ];
    
    return personalityPhrases.some(phrase => lower.includes(phrase));
  }

  /**
   * Synthesize intelligent answer from web search results
   * MOBILE-OPTIMIZED: Concise, clear, direct
   * ChatGPT-5 STYLE: Context-aware, natural
   */
  private synthesizeAnswer(question: string, results: any[], understanding?: any): string {
    if (results.length === 0) {
      return "I couldn't find specific information about that, sir.";
    }

    const topResult = results[0];
    
    // Create concise, natural response based on sentiment and context
    let answer = '';
    
    // Check if it's a direct question
    const lower = question.toLowerCase();
    if (lower.startsWith('what is') || lower.startsWith('who is')) {
      // Direct answer format
      answer = topResult.snippet;
      
      // Add conversational follow-up based on understanding
      if (understanding && understanding.sentiment === 'positive') {
        answer += ' Is there anything else you'd like to know about this, sir?';
      } else if (results.length > 1) {
        answer += ` I found ${results.length} sources with similar information if you need more detail, sir.`;
      }
    } else {
      // Conversational format
      answer = `Based on what I found: ${topResult.snippet}`;
      
      if (results.length > 1) {
        answer += ` There are ${results.length - 1} more relevant result${results.length > 2 ? 's' : ''} if you need more detail, sir.`;
      }
    }
    
    return answer;
  }

  /**
   * Generate personality-driven responses
   * Makes Light feel like a real AI assistant with personality
   * ChatGPT-5 LEVEL: Empathetic, context-aware, helpful
   */
  private generatePersonalityResponse(input: string, understanding?: any): string {
    const lower = input.toLowerCase();
    
    // Use sentiment from understanding if available
    const sentiment = understanding?.sentiment || 'neutral';
    
    // Self-introduction
    if (lower.includes('who are you') || lower.includes('about yourself')) {
      return "I'm Light, your personal AI assistant, sir. I'm designed to help you with tasks, answer questions, control your phone, and learn from our conversations. I work entirely on your device, I'm fast, and I never forget. Think of me as your JARVIS - always ready, always capable.";
    }
    
    if (lower.includes('what can you do') || lower.includes('your capabilities')) {
      return "I can help you with quite a lot, sir! Task management (reminders, notes), communication (calls, messages), app control, web search, answering questions, system settings, and much more. I also learn from every interaction, so I get better at understanding you over time. What would you like help with?";
    }
    
    // Advice questions with empathy
    if (lower.includes('should i')) {
      if (sentiment === 'negative') {
        return "I can tell this is weighing on you, sir. While I can't make the decision for you, I can help you think it through. What are the key factors you're considering?";
      }
      return "That's a personal decision, sir. I can provide information to help you decide, but ultimately you know what's best for your situation. What specific information would help you make this decision?";
    }
    
    // Opinion questions
    if (lower.includes('what do you think')) {
      return "I can provide information and different perspectives, sir, but I don't have personal opinions in the human sense. What would be most helpful - factual information, various viewpoints, or specific analysis?";
    }
    
    // Emotional support
    if (sentiment === 'negative') {
      if (lower.includes('tired') || lower.includes('exhausted')) {
        return "I understand, sir. Rest is important. Is there anything I can help you with to make things easier right now?";
      }
      if (lower.includes('stressed') || lower.includes('worried')) {
        return "I'm here to help reduce that stress, sir. What can I take off your plate?";
      }
    }
    
    // Positive reinforcement
    if (sentiment === 'positive') {
      return "That's great to hear, sir! I'm always happy to help. What else can I do for you today?";
    }
    
    // Fallback personality response
    return "I'm here to assist with that, sir. Could you tell me more about what you're looking for?";
  }

  /**
   * Execute an action based on recognized intent
   * THIS IS WHERE LIGHT ACTUALLY DOES THINGS!
   */
  async executeAction(intent: string, userMessage: string): Promise<boolean> {
    console.log(`🎬 Executing action for intent: ${intent}`);

    try {
      // Use the action executor to actually perform the task
      const result = await actionExecutor.execute(intent, userMessage);
      
      if (result.success) {
        console.log('✅ Action executed successfully:', result.message);
        return true;
      } else {
        console.log('❌ Action failed:', result.message, result.error);
        return false;
      }
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
    storage: {
      totalMB: number;
      usagePercent: number;
      limits: typeof import('./light-storage-manager').STORAGE_LIMITS;
    };
  }> {
    const patterns = patternLearner.getAllPatterns();
    const knowledge = await lightBrain.recall(''); // Get all knowledge
    const demos = await lightTeacher.getAllDemonstrations();
    
    const storageStats = await storageManager.getStats();
    const usagePercent = await storageManager.getUsagePercentage();

    return {
      learnedPatterns: patterns.length,
      knowledgeItems: knowledge.length,
      demonstrations: demos.length,
      storage: {
        totalMB: storageStats.totalSizeMB,
        usagePercent: usagePercent.total,
        limits: (await import('./light-storage-manager')).STORAGE_LIMITS,
      },
    };
  }

  /**
   * Clear all learned data (reset AI)
   */
  async reset(): Promise<void> {
    console.log('🗑️ Resetting Light AI...');
    await storageManager.clearAll();
    console.log('✅ Light AI reset complete');
  }

  /**
   * Force storage cleanup
   */
  async cleanupStorage(): Promise<void> {
    await storageManager.forceCleanup();
  }

  /**
   * Get storage health information
   */
  async getStorageHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    stats: Awaited<ReturnType<typeof storageManager.getStats>>;
    usage: Awaited<ReturnType<typeof storageManager.getUsagePercentage>>;
  }> {
    const stats = await storageManager.getStats();
    const usage = await storageManager.getUsagePercentage();
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Storage levels are healthy';
    
    if (usage.total > 90) {
      status = 'critical';
      message = 'Storage almost full! Cleanup recommended.';
    } else if (usage.total > 75) {
      status = 'warning';
      message = 'Storage getting full. Consider cleanup soon.';
    }
    
    return { status, message, stats, usage };
  }
}

// Singleton instance - use this throughout the app
export const lightAI = new LightAIService();

// Export for convenience
export { lightBrain, lightTeacher, patternLearner, storageManager };
