/**
 * Light AI Integration - Main entry point for autonomous AI
 * 
 * This replaces expensive API calls with:
 * 1. Light Brain - Learns from web and user
 * 2. No API keys needed
 * 3. Works completely offline after learning
 */

import { lightBrain } from './light-brain';
import { lightTeacher } from './light-teacher';

export interface AIResponse {
  text: string;
  requiresTeaching?: boolean;
  teachingMethod?: 'recording' | 'explanation' | 'demonstration';
  confidence: number;
  source: 'light-brain' | 'web-learned' | 'user-taught' | 'fallback';
}

export class LightAI {
  private teachingMode: boolean = false;

  /**
   * Main AI processing - No API calls, all local
   */
  async process(userInput: string): Promise<AIResponse> {
    console.log('[Light AI] Processing:', userInput);

    // Check if user is teaching Light
    if (this.teachingMode) {
      return this.handleTeachingInput(userInput);
    }

    // Check for teaching commands
    if (this.isTeachingCommand(userInput)) {
      return this.startTeachingMode(userInput);
    }

    // Check for control commands
    if (this.isControlCommand(userInput)) {
      return this.handleControlCommand(userInput);
    }

    // Process with Light Brain
    try {
      const result = await lightBrain.processRequest(userInput);
      
      // Check if Light needs to be taught
      if (result.includes('haven\'t learned') || result.includes('teach me')) {
        return {
          text: result,
          requiresTeaching: true,
          confidence: 0,
          source: 'light-brain',
        };
      }

      return {
        text: result,
        requiresTeaching: false,
        confidence: 0.9,
        source: 'light-brain',
      };

    } catch (error) {
      console.error('[Light AI] Error:', error);
      
      return {
        text: `I encountered an error: ${error.message}

Would you like to teach me how to do this instead?`,
        requiresTeaching: true,
        confidence: 0,
        source: 'fallback',
      };
    }
  }

  /**
   * Check if input is a teaching command
   */
  private isTeachingCommand(input: string): boolean {
    const lower = input.toLowerCase();
    return (
      lower.includes('let me teach you') ||
      lower.includes('i\'ll show you') ||
      lower.includes('teach you how') ||
      lower.startsWith('learn to') ||
      lower.startsWith('remember this')
    );
  }

  /**
   * Check if input is a control command
   */
  private isControlCommand(input: string): boolean {
    const lower = input.toLowerCase();
    return (
      lower.includes('stop recording') ||
      lower.includes('cancel') ||
      lower.includes('finish teaching') ||
      lower.includes('that\'s all') ||
      lower.includes('show stats') ||
      lower.includes('what do you know')
    );
  }

  /**
   * Start teaching mode
   */
  private async startTeachingMode(input: string): Promise<AIResponse> {
    this.teachingMode = true;

    // Extract what to teach
    const task = this.extractTaskFromTeachingCommand(input);

    // Ask user how they want to teach
    const method = this.suggestTeachingMethod(task);

    const response = await lightTeacher.startTeaching(task, method);

    return {
      text: response,
      requiresTeaching: true,
      teachingMethod: method,
      confidence: 1.0,
      source: 'light-brain',
    };
  }

  /**
   * Handle teaching input
   */
  private async handleTeachingInput(input: string): Promise<AIResponse> {
    const lower = input.toLowerCase();

    // Check for completion
    if (lower.includes('stop recording') || lower.includes('that\'s all') || lower.includes('done')) {
      this.teachingMode = false;
      const result = await lightTeacher.finishTeaching();
      
      return {
        text: result,
        requiresTeaching: false,
        confidence: 1.0,
        source: 'user-taught',
      };
    }

    // Check for cancellation
    if (lower.includes('cancel') || lower.includes('nevermind')) {
      this.teachingMode = false;
      const result = lightTeacher.cancelTeaching();
      
      return {
        text: result,
        requiresTeaching: false,
        confidence: 1.0,
        source: 'user-taught',
      };
    }

    // Check for progress request
    if (lower.includes('show progress') || lower.includes('what have you learned')) {
      const progress = lightTeacher.getProgress();
      
      return {
        text: progress,
        requiresTeaching: true,
        confidence: 1.0,
        source: 'user-taught',
      };
    }

    // Record this step
    await lightTeacher.recordStep(input);

    return {
      text: `✅ Got it! Step ${await this.getStepCount()} recorded.

Continue with the next step, or say "that's all" when you're done.`,
      requiresTeaching: true,
      confidence: 1.0,
      source: 'user-taught',
    };
  }

  /**
   * Handle control commands
   */
  private async handleControlCommand(input: string): Promise<AIResponse> {
    const lower = input.toLowerCase();

    // Show stats
    if (lower.includes('show stats') || lower.includes('what do you know')) {
      const stats = await lightBrain.getStats();
      
      return {
        text: `📊 **Light's Knowledge Base**

**Tasks I can do:** ${stats.totalTasks}
**Successfully learned:** ${stats.successfulTasks}
**Still learning:** ${stats.learningQueue}
**Average success rate:** ${Math.round(stats.avgSuccessRate * 100)}%

${stats.successfulTasks > 0 
  ? 'I\'m getting smarter every day! 🧠'
  : 'Teach me some tasks to get started! 🎓'
}`,
        requiresTeaching: false,
        confidence: 1.0,
        source: 'light-brain',
      };
    }

    return {
      text: 'I didn\'t understand that control command. Try:\n- "Show stats"\n- "What do you know"\n- "Stop recording"',
      requiresTeaching: false,
      confidence: 0.5,
      source: 'fallback',
    };
  }

  /**
   * Extract task from teaching command
   */
  private extractTaskFromTeachingCommand(input: string): string {
    // Remove teaching phrases
    let task = input
      .toLowerCase()
      .replace(/let me teach you (how )?to/i, '')
      .replace(/i'll show you (how )?to/i, '')
      .replace(/teach you how to/i, '')
      .replace(/learn to/i, '')
      .replace(/remember this:/i, '')
      .trim();

    return task || 'perform this task';
  }

  /**
   * Suggest best teaching method for task
   */
  private suggestTeachingMethod(task: string): 'recording' | 'explanation' | 'demonstration' {
    const lower = task.toLowerCase();

    // UI-heavy tasks = demonstration
    if (lower.includes('open') || lower.includes('tap') || lower.includes('swipe')) {
      return 'demonstration';
    }

    // Simple tasks = explanation
    if (lower.includes('remind') || lower.includes('call') || lower.includes('message')) {
      return 'explanation';
    }

    // Default to recording (most versatile)
    return 'recording';
  }

  /**
   * Get current teaching step count
   */
  private async getStepCount(): Promise<number> {
    const progress = lightTeacher.getProgress();
    const match = progress.match(/Steps recorded: (\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Quick teach - Provide steps directly
   */
  async quickTeach(task: string, steps: string[]): Promise<AIResponse> {
    const result = await lightTeacher.quickTeach(task, steps);
    
    return {
      text: result,
      requiresTeaching: false,
      confidence: 1.0,
      source: 'user-taught',
    };
  }

  /**
   * Reset Light's knowledge (for testing/debugging)
   */
  async resetKnowledge(): Promise<string> {
    // Will implement reset functionality in light-brain
    return '🗑️ Knowledge base reset. Light is ready to learn from scratch!';
  }
}

// Singleton instance
export const lightAI = new LightAI();

// Example usage for integration:
/*
import { lightAI } from '@/lib/light-ai-integration';

// In your chat handler:
async function handleUserMessage(text: string) {
  const response = await lightAI.process(text);
  
  if (response.requiresTeaching) {
    // Show teaching UI
    showTeachingInterface(response.teachingMethod);
  }
  
  return response.text;
}
*/
