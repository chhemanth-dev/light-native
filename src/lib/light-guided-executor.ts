/**
 * Light Guided Executor
 * YOU command → LIGHT executes → LIGHT asks if confused → YOU clarify → LIGHT continues
 * Uses Light AI for understanding (NO EXTERNAL APIs!)
 * 
 * Example flow:
 * You: "Download TikTok app"
 * Light: *opens Play Store* "I'm in the Play Store. What should I do?"
 * You: "Search for TikTok"
 * Light: *searches* "I found several results. Which one?"
 * You: "The first one"
 * Light: *clicks first result* "I'm on the TikTok page. Should I download?"
 * You: "Yes, click download"
 * Light: *clicks download* "Downloading TikTok... Done!"
 */

import { NativeModules } from 'react-native';
import { openApp } from './accessibility';
import { patternLearner } from './light-pattern-learner';
import { lightBrain } from './light-brain';

const { AccessibilityActionModule } = NativeModules;

export type ExecutorState = 
  | 'idle' 
  | 'waiting_for_command'
  | 'executing' 
  | 'confused'
  | 'asking_for_clarification'
  | 'completed';

export interface ExecutionContext {
  taskGoal: string;              // "Download TikTok"
  currentStep: string;           // "Searching Play Store"
  currentScreen: string;         // "Google Play Store"
  availableActions: string[];    // ["scroll down", "tap item 1", "tap item 2"]
  history: ExecutionStep[];      // What we've done so far
  state: ExecutorState;
}

export interface ExecutionStep {
  stepNumber: number;
  command: string;               // What you said
  action: string;                // What Light did
  result: string;                // What happened
  timestamp: number;
  screenshot?: string;           // Optional: what Light saw
}

export class LightGuidedExecutor {
  private context: ExecutionContext | null = null;
  private autoExplore = true; // Light can try things automatically

  /**
   * Start a guided execution task
   */
  async startTask(goal: string): Promise<string> {
    this.context = {
      taskGoal: goal,
      currentStep: 'Starting',
      currentScreen: 'Unknown',
      availableActions: [],
      history: [],
      state: 'executing',
    };

    // Try to understand the goal and take first action
    const firstAction = await this.analyzeGoalAndStart(goal);
    
    return firstAction;
  }

  /**
   * Execute a command from user
   */
  async executeCommand(command: string): Promise<string> {
    if (!this.context) {
      return "No active task. Say 'Light, [do something]' to start.";
    }

    this.context.state = 'executing';
    const lowerCommand = command.toLowerCase().trim();

    try {
      // Parse and execute the command
      const result = await this.parseAndExecute(lowerCommand);
      
      // Record the step
      this.recordStep(command, result.action, result.message);

      // Check if task is complete
      if (this.isTaskComplete()) {
        this.context.state = 'completed';
        return `✅ Task completed: ${this.context.taskGoal}\n\n${result.message}`;
      }

      // Continue or ask for next instruction
      return result.message;
    } catch (error) {
      this.context.state = 'confused';
      return await this.handleConfusion(command, error);
    }
  }

  /**
   * Analyze goal and take first action
   * Uses Light AI to understand intent (NO external APIs!)
   */
  private async analyzeGoalAndStart(goal: string): Promise<string> {
    const lower = goal.toLowerCase();

    // Try to recognize intent using Light AI's pattern learner
    console.log('🧠 Using Light AI to understand goal:', goal);
    const recognized = await patternLearner.recognizeIntent(goal);

    if (recognized && recognized.confidence > 0.5) {
      console.log(`✅ Light AI recognized: ${recognized.intent} (${(recognized.confidence * 100).toFixed(0)}%)`);
      
      // Handle based on recognized intent
      switch (recognized.intent) {
        case 'app_open':
          const appName = this.extractAppName(goal);
          return await this.openAppAndWait(appName);
        
        case 'app_download':
        case 'app_install':
          const downloadApp = this.extractAppName(goal);
          return await this.startAppDownload(downloadApp);
        
        case 'contact_message':
        case 'contact_call':
          return await this.startSendMessage(goal);
        
        case 'information_search':
        case 'information_weather':
        case 'information_news':
          return await this.startWebSearch(goal);
        
        default:
          // Let Light AI's suggested action guide us
          if (recognized.suggestedAction) {
            return `🎯 Goal: ${goal}\n\nI think I should: ${recognized.suggestedAction}\n\nShould I proceed?`;
          }
      }
    }

    // If Light AI doesn't recognize, try to search web for instructions
    console.log('🌐 Light AI unsure, searching web for how to do this...');
    const webResults = await lightBrain.search(`how to ${goal} on android`);
    
    if (webResults && webResults.length > 0) {
      // Store the knowledge
      await lightBrain.storeKnowledge({
        query: goal,
        answer: webResults[0].snippet,
        source: webResults[0].link,
        confidence: 0.6,
      });
      
      return `🎯 Goal: ${goal}

🌐 I searched the web and found: "${webResults[0].snippet}"

Let me try... What should I do first?`;
    }

    // PATTERN: Download app (fallback if Light AI didn't catch it)
    if (lower.includes('download') && (lower.includes('app') || this.looksLikeAppName(goal))) {
      const appName = this.extractAppName(goal);
      return await this.startAppDownload(appName);
    }

    // PATTERN: Open app (fallback)
    if (lower.includes('open') && (lower.includes('app') || this.looksLikeAppName(goal))) {
      const appName = this.extractAppName(goal);
      return await this.openAppAndWait(appName);
    }

    // PATTERN: Send message (fallback)
    if ((lower.includes('send') || lower.includes('message')) && lower.includes('to')) {
      return await this.startSendMessage(goal);
    }

    // PATTERN: Search for something (fallback)
    if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
      return await this.startWebSearch(goal);
    }

    // Generic start - wait for instruction
    this.context!.state = 'waiting_for_command';
    return `🎯 Goal: ${goal}

I'm not sure how to do this yet, but I'm ready to learn!

What should I do first?

Examples:
- "Open Play Store"
- "Search for [app name]"
- "Scroll down"
- "Tap the first item"`;
  }

  /**
   * Parse command and execute action
   */
  private async parseAndExecute(command: string): Promise<{ action: string; message: string }> {
    // SCROLL COMMANDS
    if (command.includes('scroll down')) {
      await this.scrollDown();
      return {
        action: 'scrolled down',
        message: '📜 Scrolled down. What should I look for?',
      };
    }

    if (command.includes('scroll up')) {
      await this.scrollUp();
      return {
        action: 'scrolled up',
        message: '📜 Scrolled up. What next?',
      };
    }

    // TAP/CLICK COMMANDS
    if (command.match(/tap|click|press|select/)) {
      return await this.handleTapCommand(command);
    }

    // TYPE/ENTER TEXT
    if (command.match(/type|enter|write|input/)) {
      return await this.handleTypeCommand(command);
    }

    // SEARCH COMMAND
    if (command.includes('search for')) {
      const query = command.replace(/search for/i, '').trim();
      return await this.performSearch(query);
    }

    // OPEN APP
    if (command.includes('open')) {
      const appName = command.replace(/open/i, '').trim();
      await openApp(this.guessPackageName(appName));
      return {
        action: `opened ${appName}`,
        message: `📱 Opened ${appName}. What should I do here?`,
      };
    }

    // BACK/GO BACK
    if (command.match(/back|go back|previous/)) {
      await this.pressBack();
      return {
        action: 'went back',
        message: '◀️ Went back. What next?',
      };
    }

    // DOWNLOAD/INSTALL
    if (command.match(/download|install|get it/)) {
      return await this.clickDownloadButton();
    }

    // CONFUSED - ask for clarification
    this.context!.state = 'asking_for_clarification';
    return {
      action: 'waiting',
      message: `🤔 I'm not sure what "${command}" means.

Can you be more specific? Try:
- "Tap [item name or number]"
- "Scroll down"
- "Type [text]"
- "Search for [query]"
- "Open [app name]"`,
    };
  }

  /**
   * Handle tap/click commands
   */
  private async handleTapCommand(command: string): Promise<{ action: string; message: string }> {
    // Pattern: "tap the 3rd item", "click item 3", "select the first one"
    const numberMatch = command.match(/(\d+)(st|nd|rd|th)?|first|second|third|fourth|fifth/i);
    
    if (numberMatch) {
      const num = this.parseOrdinal(numberMatch[0]);
      await this.tapItemByIndex(num - 1); // 0-indexed
      return {
        action: `tapped item ${num}`,
        message: `✅ Tapped item ${num}. What should I do now?`,
      };
    }

    // Pattern: "tap [text]", "click on download", "press the search button"
    const textMatch = command.match(/(?:tap|click|press|select)(?:\s+(?:the|on))?\s+(.+)/i);
    
    if (textMatch) {
      const text = textMatch[1].trim();
      await this.tapByText(text);
      return {
        action: `tapped "${text}"`,
        message: `✅ Tapped "${text}". What's next?`,
      };
    }

    // Pattern: "tap download", "click search"
    const singleWord = command.replace(/tap|click|press|select/gi, '').trim();
    if (singleWord) {
      await this.tapByText(singleWord);
      return {
        action: `tapped "${singleWord}"`,
        message: `✅ Tapped "${singleWord}". What now?`,
      };
    }

    return {
      action: 'waiting',
      message: '🤔 Which item should I tap? Try saying "tap item 1" or "tap [button name]"',
    };
  }

  /**
   * Handle type/input commands
   */
  private async handleTypeCommand(command: string): Promise<{ action: string; message: string }> {
    // Pattern: "type TikTok", "enter my password", "write hello"
    const textMatch = command.match(/(?:type|enter|write|input)(?:\s+the)?\s+(.+)/i);
    
    if (textMatch) {
      const text = textMatch[1].trim();
      await this.inputText(text);
      return {
        action: `typed "${text}"`,
        message: `⌨️ Typed "${text}". What should I do next?`,
      };
    }

    return {
      action: 'waiting',
      message: '🤔 What should I type? Try "type [your text]"',
    };
  }

  /**
   * Start app download flow
   */
  private async startAppDownload(appName: string): Promise<string> {
    this.context!.currentStep = 'Opening Play Store';
    
    try {
      // Open Play Store
      await openApp('com.android.vending');
      await this.wait(2000);

      this.context!.currentStep = `Searching for ${appName}`;
      
      // Try to search automatically
      await this.tapByText('search');
      await this.wait(500);
      await this.inputText(appName);
      await this.wait(1000);
      await this.pressEnter();
      await this.wait(2000);

      return `📱 I opened Play Store and searched for "${appName}".

I can see the results. What should I do?
- Say "tap the first one" to select the top result
- Say "scroll down" if you don't see it
- Say "tap item 2" for a specific result`;
    } catch (error) {
      return `📱 I opened Play Store but couldn't search automatically.

Please guide me:
- Say "tap the search box"
- Say "type ${appName}"
- Say "tap the first result"`;
    }
  }

  /**
   * Open app and wait for instruction
   */
  private async openAppAndWait(appName: string): Promise<string> {
    try {
      await openApp(this.guessPackageName(appName));
      await this.wait(2000);
      
      return `📱 Opened ${appName}. What should I do here?`;
    } catch (error) {
      return `❌ Couldn't open ${appName}. It might not be installed.

Should I download it first?`;
    }
  }

  // ============================================
  // LOW-LEVEL ACTIONS (calls AccessibilityService)
  // ============================================

  private async scrollDown(): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.performGlobalAction('scroll_down');
    }
    await this.wait(500);
  }

  private async scrollUp(): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.performGlobalAction('scroll_up');
    }
    await this.wait(500);
  }

  private async tapByText(text: string): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.clickByText(text);
    }
    await this.wait(300);
  }

  private async tapItemByIndex(index: number): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.clickByIndex(index);
    }
    await this.wait(300);
  }

  private async inputText(text: string): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.inputText(text);
    }
    await this.wait(300);
  }

  private async pressBack(): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.performGlobalAction('back');
    }
    await this.wait(300);
  }

  private async pressEnter(): Promise<void> {
    if (AccessibilityActionModule) {
      await AccessibilityActionModule.performGlobalAction('enter');
    }
    await this.wait(300);
  }

  private async clickDownloadButton(): Promise<{ action: string; message: string }> {
    // Try common download button texts
    const downloadTexts = ['install', 'download', 'get', 'free'];
    
    for (const text of downloadTexts) {
      try {
        await this.tapByText(text);
        return {
          action: 'clicked download',
          message: '⬇️ Started download! Waiting for it to complete...',
        };
      } catch {
        continue;
      }
    }

    return {
      action: 'waiting',
      message: '🤔 I can\'t find the download button. Can you tell me exactly what to tap?',
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async performSearch(query: string): Promise<{ action: string; message: string }> {
    await this.inputText(query);
    await this.pressEnter();
    await this.wait(2000);
    
    return {
      action: `searched for "${query}"`,
      message: `🔍 Searched for "${query}". What should I do with the results?`,
    };
  }

  private async startSendMessage(goal: string): Promise<string> {
    // Extract recipient and message
    // TODO: Implement message sending flow
    return `💬 I'll help you send a message. Which app should I use?
- WhatsApp
- Messages
- Telegram`;
  }

  private async startWebSearch(goal: string): Promise<string> {
    // Extract search query
    // TODO: Implement web search flow
    return `🔍 What should I search for?`;
  }

  private recordStep(command: string, action: string, result: string): void {
    if (!this.context) return;

    this.context.history.push({
      stepNumber: this.context.history.length + 1,
      command,
      action,
      result,
      timestamp: Date.now(),
    });
  }

  private async handleConfusion(command: string, error: any): Promise<string> {
    return `🤔 I'm confused. I tried to "${command}" but something went wrong.

Can you help me? Try being more specific:
- Instead of "click there", say "tap the download button"
- Instead of "do it", say "scroll down" or "tap item 1"
- Tell me exactly what to tap or where to look

What should I do?`;
  }

  private isTaskComplete(): boolean {
    if (!this.context) return false;
    
    // Check if goal keywords match last action
    const goal = this.context.taskGoal.toLowerCase();
    const lastStep = this.context.history[this.context.history.length - 1];
    
    if (!lastStep) return false;

    // Downloaded app = complete
    if (goal.includes('download') && lastStep.action.includes('download')) {
      return true;
    }

    return false;
  }

  private looksLikeAppName(text: string): boolean {
    // Check if text contains app name patterns
    const appPatterns = ['tiktok', 'instagram', 'facebook', 'whatsapp', 'youtube', 'twitter'];
    return appPatterns.some(app => text.toLowerCase().includes(app));
  }

  private extractAppName(text: string): string {
    // Remove action words and extract app name
    return text
      .toLowerCase()
      .replace(/download|install|open|get|the|app/gi, '')
      .trim();
  }

  private guessPackageName(appName: string): string {
    const packageMap: Record<string, string> = {
      'whatsapp': 'com.whatsapp',
      'instagram': 'com.instagram.android',
      'facebook': 'com.facebook.katana',
      'tiktok': 'com.zhiliaoapp.musically',
      'youtube': 'com.google.android.youtube',
      'chrome': 'com.android.chrome',
      'gmail': 'com.google.android.gm',
      'play store': 'com.android.vending',
    };

    return packageMap[appName.toLowerCase()] || appName;
  }

  private parseOrdinal(text: string): number {
    const ordinalMap: Record<string, number> = {
      'first': 1, '1st': 1,
      'second': 2, '2nd': 2,
      'third': 3, '3rd': 3,
      'fourth': 4, '4th': 4,
      'fifth': 5, '5th': 5,
    };

    const lower = text.toLowerCase();
    if (ordinalMap[lower]) return ordinalMap[lower];

    // Parse number directly
    const num = parseInt(text.match(/\d+/)?.[0] || '1');
    return num;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current context
   */
  getContext(): ExecutionContext | null {
    return this.context;
  }

  /**
   * Cancel current task
   */
  async cancel(): Promise<string> {
    if (!this.context) {
      return 'No active task to cancel.';
    }

    const goal = this.context.taskGoal;
    this.context = null;

    return `❌ Cancelled: ${goal}

Ready for a new task!`;
  }
}

// Singleton
export const guidedExecutor = new LightGuidedExecutor();
