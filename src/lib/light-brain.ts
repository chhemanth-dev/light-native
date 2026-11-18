/**
 * Light Brain - Autonomous Learning AI Agent
 * 
 * This AI agent:
 * 1. Searches the web for how to perform tasks (ENHANCED MULTI-SOURCE)
 * 2. Learns from successful executions
 * 3. Builds a knowledge base in the app
 * 4. Executes tasks without API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { webSearchEngine } from './light-web-search-engine';

interface TaskKnowledge {
  id: string;
  taskType: string;
  userQuery: string;
  learnedMethod: string;
  actionSteps: ActionStep[];
  successRate: number;
  lastUsed: number;
  timesExecuted: number;
  source: 'web' | 'user' | 'hybrid';
}

interface ActionStep {
  type: 'system' | 'ui' | 'api' | 'conditional';
  action: string;
  parameters: Record<string, any>;
  fallback?: ActionStep;
}

interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  link?: string;
  instructions?: string[];
}

interface StoredKnowledge {
  query: string;
  answer: string;
  source: string;
  confidence: number;
  timestamp?: number;
}

export class LightBrain {
  private db: SQLite.SQLiteDatabase | null = null;
  private knowledgeBase: Map<string, TaskKnowledge>;
  private learningMode: boolean;
  private initialized: boolean = false;
  private knowledgeCache: Map<string, StoredKnowledge> = new Map();

  constructor() {
    this.knowledgeBase = new Map();
    this.learningMode = true;
  }

  /**
   * Initialize Light Brain
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.initializeDatabase();
      await this.loadKnowledgeCache();
      this.initialized = true;
      console.log('✅ Light Brain initialized');
    } catch (error) {
      console.error('❌ Light Brain initialization error:', error);
      this.initialized = true; // Continue anyway with limited functionality
    }
  }

  private async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('light_brain.db');
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS task_knowledge (
          id TEXT PRIMARY KEY,
          task_type TEXT,
          user_query TEXT,
          learned_method TEXT,
          action_steps TEXT,
          success_rate REAL,
          last_used INTEGER,
          times_executed INTEGER,
          source TEXT
        );

        CREATE TABLE IF NOT EXISTS execution_history (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          timestamp INTEGER,
          success INTEGER,
          user_feedback TEXT,
          execution_time INTEGER
        );

        CREATE TABLE IF NOT EXISTS learning_queue (
          id TEXT PRIMARY KEY,
          query TEXT,
          priority INTEGER,
          status TEXT,
          created_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS stored_knowledge (
          id TEXT PRIMARY KEY,
          query TEXT,
          answer TEXT,
          source TEXT,
          confidence REAL,
          timestamp INTEGER
        );
      `);

      await this.loadKnowledgeBase();
    } catch (error) {
      console.error('[Light Brain] Database initialization error:', error);
      // Continue without database - will use in-memory only
    }
  }

  /**
   * ENHANCED WEB SEARCH - Uses multi-source search engine
   * This is what Light AI calls for web searches
   */
  async search(query: string): Promise<WebSearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('[Light Brain] Searching web for:', query);

    try {
      // Use enhanced multi-source search
      const enhancedResults = await webSearchEngine.enhancedSearch(query);

      // Convert to WebSearchResult format
      const results: WebSearchResult[] = enhancedResults.sources.map(source => ({
        title: source.title,
        snippet: source.snippet,
        url: source.link,
        link: source.link,
        instructions: [],
      }));

      // Add synthesized answer as first result if no direct results
      if (results.length === 0 && enhancedResults.mainAnswer) {
        results.push({
          title: query,
          snippet: enhancedResults.mainAnswer,
          url: enhancedResults.sources[0]?.link || '',
          link: enhancedResults.sources[0]?.link || '',
          instructions: enhancedResults.synthesizedInfo.keyPoints,
        });
      }

      console.log('[Light Brain] Found', results.length, 'results');
      return results;
    } catch (error) {
      console.error('[Light Brain] Search error:', error);
      return [];
    }
  }

  /**
   * Store knowledge for future recall
   */
  async storeKnowledge(knowledge: StoredKnowledge): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const id = Date.now().toString();
      const timestamp = Date.now();

      // Store in cache
      this.knowledgeCache.set(knowledge.query.toLowerCase(), {
        ...knowledge,
        timestamp,
      });

      // Store in database if available
      if (this.db) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO stored_knowledge (id, query, answer, source, confidence, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, knowledge.query, knowledge.answer, knowledge.source, knowledge.confidence, timestamp]
        );
      }

      console.log('[Light Brain] Stored knowledge:', knowledge.query.substring(0, 50));
    } catch (error) {
      console.error('[Light Brain] Error storing knowledge:', error);
    }
  }

  /**
   * Recall stored knowledge
   */
  async recall(query: string): Promise<StoredKnowledge[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const lowerQuery = query.toLowerCase();
      const results: StoredKnowledge[] = [];

      // Check cache first
      for (const [key, value] of this.knowledgeCache.entries()) {
        if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
          results.push(value);
        }
      }

      // If cache has results, return them
      if (results.length > 0) {
        return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      }

      // Otherwise check database
      if (this.db) {
        const rows = await this.db.getAllAsync<any>(
          `SELECT * FROM stored_knowledge 
           WHERE query LIKE ? OR answer LIKE ?
           ORDER BY confidence DESC, timestamp DESC
           LIMIT 5`,
          [`%${query}%`, `%${query}%`]
        );

        for (const row of rows) {
          const knowledge: StoredKnowledge = {
            query: row.query,
            answer: row.answer,
            source: row.source,
            confidence: row.confidence,
            timestamp: row.timestamp,
          };
          results.push(knowledge);
          
          // Add to cache
          this.knowledgeCache.set(row.query.toLowerCase(), knowledge);
        }
      }

      return results;
    } catch (error) {
      console.error('[Light Brain] Error recalling knowledge:', error);
      return [];
    }
  }

  /**
   * Load knowledge cache from database
   */
  private async loadKnowledgeCache(): Promise<void> {
    if (!this.db) return;

    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM stored_knowledge 
         WHERE timestamp > ?
         ORDER BY timestamp DESC
         LIMIT 100`,
        [Date.now() - 7 * 24 * 60 * 60 * 1000] // Last 7 days
      );

      for (const row of rows) {
        this.knowledgeCache.set(row.query.toLowerCase(), {
          query: row.query,
          answer: row.answer,
          source: row.source,
          confidence: row.confidence,
          timestamp: row.timestamp,
        });
      }

      console.log('[Light Brain] Loaded', this.knowledgeCache.size, 'cached items');
    } catch (error) {
      console.warn('[Light Brain] Could not load cache:', error);
    }
  }

  /**
   * Main entry point - Process user request
   */
  async processRequest(userInput: string): Promise<string> {
    console.log('[Light Brain] Processing:', userInput);

    // Step 1: Understand the intent
    const intent = this.parseIntent(userInput);
    console.log('[Light Brain] Intent:', intent);

    // Step 2: Check if we know how to do this
    const existingKnowledge = await this.findKnowledge(intent);

    if (existingKnowledge) {
      // We know how to do this!
      console.log('[Light Brain] Found existing knowledge');
      return await this.executeTask(existingKnowledge, userInput);
    }

    // Step 3: We don't know how - Learn from the web
    console.log('[Light Brain] Learning new task from web...');
    const learned = await this.learnFromWeb(intent, userInput);

    if (learned) {
      return await this.executeTask(learned, userInput);
    }

    // Step 4: Ask user to teach us
    return await this.requestUserGuidance(userInput);
  }

  /**
   * Parse user intent from natural language
   */
  private parseIntent(input: string): {
    action: string;
    entity: string;
    parameters: Record<string, any>;
  } {
    const lower = input.toLowerCase();

    // Action detection
    let action = 'unknown';
    if (lower.includes('set') && (lower.includes('reminder') || lower.includes('alarm'))) {
      action = 'set_reminder';
    } else if (lower.includes('call') || lower.includes('phone')) {
      action = 'make_call';
    } else if (lower.includes('send') && lower.includes('message')) {
      action = 'send_message';
    } else if (lower.includes('open') || lower.includes('launch')) {
      action = 'open_app';
    } else if (lower.includes('search') || lower.includes('find')) {
      action = 'search';
    } else if (lower.includes('turn on') || lower.includes('enable')) {
      action = 'enable_feature';
    } else if (lower.includes('turn off') || lower.includes('disable')) {
      action = 'disable_feature';
    }

    // Entity extraction
    const entity = this.extractEntity(input, action);

    // Parameter extraction (time, contact, etc.)
    const parameters = this.extractParameters(input, action);

    return { action, entity, parameters };
  }

  private extractEntity(input: string, action: string): string {
    // Extract the main subject of the action
    // This is a simple version - can be enhanced with NLP
    const words = input.split(' ');
    
    if (action === 'open_app') {
      // Look for app name after "open"
      const openIndex = words.findIndex(w => w.toLowerCase() === 'open');
      if (openIndex >= 0 && openIndex < words.length - 1) {
        return words[openIndex + 1];
      }
    }

    if (action === 'make_call') {
      // Look for name or number
      const callIndex = words.findIndex(w => w.toLowerCase() === 'call');
      if (callIndex >= 0 && callIndex < words.length - 1) {
        return words.slice(callIndex + 1).join(' ');
      }
    }

    return '';
  }

  private extractParameters(input: string, action: string): Record<string, any> {
    const params: Record<string, any> = {};

    // Time extraction for reminders
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      params.time = timeMatch[0];
    }

    // Date extraction
    const dateMatch = input.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dateMatch) {
      params.date = dateMatch[0];
    }

    return params;
  }

  /**
   * Search knowledge base for existing solution
   */
  private async findKnowledge(intent: any): Promise<TaskKnowledge | null> {
    const cached = this.knowledgeBase.get(intent.action);
    if (cached && cached.successRate > 0.7) {
      return cached;
    }

    // Search database
    const result = await this.db.getFirstAsync<TaskKnowledge>(
      `SELECT * FROM task_knowledge 
       WHERE task_type = ? AND success_rate > 0.7 
       ORDER BY success_rate DESC, times_executed DESC LIMIT 1`,
      [intent.action]
    );

    if (result) {
      const knowledge: TaskKnowledge = {
        ...result,
        actionSteps: JSON.parse(result.learned_method as any),
      };
      this.knowledgeBase.set(intent.action, knowledge);
      return knowledge;
    }

    return null;
  }

  /**
   * Learn how to perform task from web search
   */
  private async learnFromWeb(
    intent: any,
    originalQuery: string
  ): Promise<TaskKnowledge | null> {
    try {
      // Search query optimization
      const searchQuery = `how to ${intent.action.replace('_', ' ')} on android app programmatically`;
      
      console.log('[Light Brain] Searching web for:', searchQuery);

      // Perform web search
      const searchResults = await this.searchWeb(searchQuery);

      if (searchResults.length === 0) {
        console.log('[Light Brain] No results found');
        return null;
      }

      // Extract actionable steps from search results
      const actionSteps = this.extractActionSteps(searchResults, intent);

      if (actionSteps.length === 0) {
        console.log('[Light Brain] Could not extract action steps');
        return null;
      }

      // Create new knowledge entry
      const knowledge: TaskKnowledge = {
        id: Date.now().toString(),
        taskType: intent.action,
        userQuery: originalQuery,
        learnedMethod: JSON.stringify(actionSteps),
        actionSteps,
        successRate: 0.5, // Start with neutral rating
        lastUsed: Date.now(),
        timesExecuted: 0,
        source: 'web',
      };

      // Save to database
      await this.saveKnowledge(knowledge);

      console.log('[Light Brain] Learned new task:', knowledge);

      return knowledge;
    } catch (error) {
      console.error('[Light Brain] Error learning from web:', error);
      return null;
    }
  }

  /**
   * Search the web using DuckDuckGo (no API key needed)
   */
  private async searchWeb(query: string): Promise<WebSearchResult[]> {
    try {
      // Use DuckDuckGo's instant answer API (free, no key)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
      );

      const data = await response.json();

      const results: WebSearchResult[] = [];

      // Extract abstract
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'DuckDuckGo Result',
          snippet: data.Abstract,
          url: data.AbstractURL,
          instructions: this.parseInstructions(data.Abstract),
        });
      }

      // Extract related topics
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.Text) {
            results.push({
              title: topic.Text.substring(0, 50),
              snippet: topic.Text,
              url: topic.FirstURL,
              instructions: this.parseInstructions(topic.Text),
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('[Light Brain] Web search error:', error);
      return [];
    }
  }

  /**
   * Parse instructions from text
   */
  private parseInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    // Look for numbered steps
    const numberedSteps = text.match(/\d+\.\s*[^\n]+/g);
    if (numberedSteps) {
      instructions.push(...numberedSteps);
    }

    // Look for bullet points
    const bulletPoints = text.match(/[•\-\*]\s*[^\n]+/g);
    if (bulletPoints) {
      instructions.push(...bulletPoints);
    }

    // Look for "first", "then", "next" patterns
    const stepWords = ['first', 'then', 'next', 'finally', 'lastly'];
    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase().trim();
      if (stepWords.some(word => lower.startsWith(word))) {
        instructions.push(sentence.trim());
      }
    }

    return instructions;
  }

  /**
   * Convert web instructions to executable action steps
   */
  private extractActionSteps(
    searchResults: WebSearchResult[],
    intent: any
  ): ActionStep[] {
    const steps: ActionStep[] = [];

    // Combine all instructions
    const allInstructions = searchResults
      .flatMap(r => r.instructions || [])
      .filter(i => i.length > 10);

    console.log('[Light Brain] Found instructions:', allInstructions);

    // Convert to action steps based on task type
    for (const instruction of allInstructions.slice(0, 5)) {
      const step = this.instructionToAction(instruction, intent);
      if (step) {
        steps.push(step);
      }
    }

    return steps;
  }

  /**
   * Convert natural language instruction to action step
   */
  private instructionToAction(instruction: string, intent: any): ActionStep | null {
    const lower = instruction.toLowerCase();

    // System actions
    if (lower.includes('notification') || lower.includes('schedule')) {
      return {
        type: 'system',
        action: 'create_notification',
        parameters: {
          title: intent.entity,
          time: intent.parameters.time,
        },
      };
    }

    // UI actions
    if (lower.includes('tap') || lower.includes('click') || lower.includes('press')) {
      return {
        type: 'ui',
        action: 'tap_element',
        parameters: {
          element: this.extractElementFromInstruction(instruction),
        },
      };
    }

    // API calls
    if (lower.includes('request') || lower.includes('api') || lower.includes('call')) {
      return {
        type: 'api',
        action: 'http_request',
        parameters: {
          method: 'GET',
          endpoint: intent.entity,
        },
      };
    }

    return null;
  }

  private extractElementFromInstruction(instruction: string): string {
    // Extract UI element names from instruction
    const quoted = instruction.match(/"([^"]+)"/);
    if (quoted) return quoted[1];

    const afterTap = instruction.match(/tap\s+(?:on\s+)?(?:the\s+)?([a-z]+)/i);
    if (afterTap) return afterTap[1];

    return 'button';
  }

  /**
   * Execute learned task
   */
  private async executeTask(
    knowledge: TaskKnowledge,
    userInput: string
  ): Promise<string> {
    console.log('[Light Brain] Executing task:', knowledge.taskType);

    const startTime = Date.now();
    let success = true;
    let result = '';

    try {
      for (const step of knowledge.actionSteps) {
        await this.executeStep(step);
      }

      result = `✅ Task completed successfully!\n\n${knowledge.taskType.replace('_', ' ')}`;
      
      // Update success rate
      knowledge.successRate = (knowledge.successRate * knowledge.timesExecuted + 1) / (knowledge.timesExecuted + 1);
      knowledge.timesExecuted++;
      knowledge.lastUsed = Date.now();

    } catch (error) {
      console.error('[Light Brain] Execution error:', error);
      success = false;
      result = `❌ I encountered an error: ${error.message}\n\nLet me try to learn a better way...`;
      
      // Decrease success rate
      knowledge.successRate = (knowledge.successRate * knowledge.timesExecuted) / (knowledge.timesExecuted + 1);
    }

    // Log execution
    await this.logExecution(knowledge.id, success, Date.now() - startTime);

    // Update knowledge base
    await this.saveKnowledge(knowledge);

    return result;
  }

  /**
   * Execute individual action step
   */
  private async executeStep(step: ActionStep): Promise<void> {
    console.log('[Light Brain] Executing step:', step.type, step.action);

    switch (step.type) {
      case 'system':
        await this.executeSystemAction(step);
        break;
      case 'ui':
        await this.executeUIAction(step);
        break;
      case 'api':
        await this.executeAPIAction(step);
        break;
      case 'conditional':
        await this.executeConditionalAction(step);
        break;
    }
  }

  private async executeSystemAction(step: ActionStep): Promise<void> {
    // Will integrate with existing system modules
    console.log('[System Action]', step.action, step.parameters);
    
    // Example: Create notification/reminder
    if (step.action === 'create_notification') {
      // Call notification module
      // await createReminder(step.parameters);
    }
  }

  private async executeUIAction(step: ActionStep): Promise<void> {
    // Will integrate with accessibility service for UI automation
    console.log('[UI Action]', step.action, step.parameters);
  }

  private async executeAPIAction(step: ActionStep): Promise<void> {
    // Execute API calls
    console.log('[API Action]', step.action, step.parameters);
  }

  private async executeConditionalAction(step: ActionStep): Promise<void> {
    // Execute conditional logic
    console.log('[Conditional Action]', step.action, step.parameters);
  }

  /**
   * Request user to teach Light how to do something
   */
  private async requestUserGuidance(userInput: string): Promise<string> {
    console.log('[Light Brain] Requesting user guidance');

    // Add to learning queue
    await this.db.runAsync(
      `INSERT INTO learning_queue (id, query, priority, status, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [Date.now().toString(), userInput, 1, 'pending', Date.now()]
    );

    return `🤔 I haven't learned how to do that yet!

I searched the web but couldn't find clear instructions.

**Would you like to teach me?**

Just show me once how to do it, and I'll remember for next time! You can:
1. Walk me through the steps
2. Let me watch you do it
3. Skip and I'll keep learning from the web

What would you prefer?`;
  }

  /**
   * Save knowledge to database
   */
  private async saveKnowledge(knowledge: TaskKnowledge): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO task_knowledge 
       (id, task_type, user_query, learned_method, action_steps, success_rate, last_used, times_executed, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        knowledge.id,
        knowledge.taskType,
        knowledge.userQuery,
        knowledge.learnedMethod,
        JSON.stringify(knowledge.actionSteps),
        knowledge.successRate,
        knowledge.lastUsed,
        knowledge.timesExecuted,
        knowledge.source,
      ]
    );

    // Update cache
    this.knowledgeBase.set(knowledge.taskType, knowledge);
  }

  /**
   * Log execution for learning
   */
  private async logExecution(
    taskId: string,
    success: boolean,
    executionTime: number
  ): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO execution_history (id, task_id, timestamp, success, execution_time)
       VALUES (?, ?, ?, ?, ?)`,
      [Date.now().toString(), taskId, Date.now(), success ? 1 : 0, executionTime]
    );
  }

  /**
   * Load knowledge base from database
   */
  private async loadKnowledgeBase(): Promise<void> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM task_knowledge WHERE success_rate > 0.5 ORDER BY success_rate DESC`
    );

    for (const row of rows) {
      const knowledge: TaskKnowledge = {
        id: row.id,
        taskType: row.task_type,
        userQuery: row.user_query,
        learnedMethod: row.learned_method,
        actionSteps: JSON.parse(row.action_steps),
        successRate: row.success_rate,
        lastUsed: row.last_used,
        timesExecuted: row.times_executed,
        source: row.source,
      };

      this.knowledgeBase.set(knowledge.taskType, knowledge);
    }

    console.log('[Light Brain] Loaded knowledge base:', this.knowledgeBase.size, 'tasks');
  }

  /**
   * Get statistics about Light's knowledge
   */
  async getStats(): Promise<{
    totalTasks: number;
    successfulTasks: number;
    learningQueue: number;
    avgSuccessRate: number;
  }> {
    const totalTasks = this.knowledgeBase.size;
    const successfulTasks = Array.from(this.knowledgeBase.values()).filter(
      k => k.successRate > 0.7
    ).length;

    const queueCount = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM learning_queue WHERE status = 'pending'`
    );

    const avgRate = await this.db.getFirstAsync<{ avg: number }>(
      `SELECT AVG(success_rate) as avg FROM task_knowledge`
    );

    return {
      totalTasks,
      successfulTasks,
      learningQueue: queueCount?.count || 0,
      avgSuccessRate: avgRate?.avg || 0,
    };
  }
}

// Singleton instance
export const lightBrain = new LightBrain();
