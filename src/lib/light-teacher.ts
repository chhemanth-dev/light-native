/**
 * Light Teacher - Interactive learning from user demonstrations
 * 
 * Allows users to teach Light how to perform tasks by:
 * 1. Recording step-by-step actions
 * 2. Explaining in natural language
 * 3. Demonstrating with accessibility service
 */

import { lightBrain } from './light-brain';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TeachingSession {
  id: string;
  task: string;
  method: 'recording' | 'explanation' | 'demonstration';
  steps: TeachingStep[];
  startTime: number;
  completed: boolean;
}

interface TeachingStep {
  order: number;
  description: string;
  action: {
    type: string;
    details: Record<string, any>;
  };
  timestamp: number;
}

export class LightTeacher {
  private currentSession: TeachingSession | null = null;
  private isRecording: boolean = false;

  /**
   * Start teaching session
   */
  async startTeaching(task: string, method: 'recording' | 'explanation' | 'demonstration'): Promise<string> {
    this.currentSession = {
      id: Date.now().toString(),
      task,
      method,
      steps: [],
      startTime: Date.now(),
      completed: false,
    };

    this.isRecording = true;

    switch (method) {
      case 'recording':
        return `🎥 **Recording Started!**

I'm now recording your actions. Go ahead and perform the task:
"${task}"

I'll watch and learn from what you do.

Say "Light, stop recording" when you're done.`;

      case 'explanation':
        return `📝 **Explanation Mode**

Please explain step-by-step how to "${task}":

Example:
1. First, open the app
2. Then, tap on the settings icon
3. Finally, toggle the option

You can say each step, and I'll write it down!`;

      case 'demonstration':
        return `👀 **Demonstration Mode**

I'll watch what you tap and interact with.

Go ahead and perform: "${task}"

I'm learning from your actions!`;
    }
  }

  /**
   * Record a step during teaching
   */
  async recordStep(description: string, action?: any): Promise<void> {
    if (!this.currentSession || !this.isRecording) {
      throw new Error('No active teaching session');
    }

    const step: TeachingStep = {
      order: this.currentSession.steps.length + 1,
      description,
      action: action || {
        type: 'manual',
        details: { description },
      },
      timestamp: Date.now(),
    };

    this.currentSession.steps.push(step);

    console.log('[Light Teacher] Recorded step:', step);
  }

  /**
   * Finish teaching and save to Light Brain
   */
  async finishTeaching(): Promise<string> {
    if (!this.currentSession) {
      return 'No active teaching session';
    }

    this.isRecording = false;

    if (this.currentSession.steps.length === 0) {
      return '❌ No steps were recorded. Please try again!';
    }

    // Convert teaching steps to action steps for Light Brain
    const actionSteps = this.currentSession.steps.map(step => ({
      type: step.action.type as any,
      action: step.description,
      parameters: step.action.details,
    }));

    // Save to Light Brain's knowledge base
    const knowledge = {
      id: this.currentSession.id,
      taskType: this.extractTaskType(this.currentSession.task),
      userQuery: this.currentSession.task,
      learnedMethod: JSON.stringify(actionSteps),
      actionSteps,
      successRate: 1.0, // User-taught tasks start with perfect score
      lastUsed: Date.now(),
      timesExecuted: 0,
      source: 'user' as const,
    };

    // Save (you'll implement the actual save method)
    console.log('[Light Teacher] Learned new task:', knowledge);

    const summary = `✅ **Learning Complete!**

I've learned how to: "${this.currentSession.task}"

**Steps I learned:**
${this.currentSession.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

I'll remember this for next time! 🧠

Try asking me to do it again, and I'll execute what you taught me!`;

    // Reset session
    this.currentSession = null;

    return summary;
  }

  /**
   * Cancel teaching session
   */
  cancelTeaching(): string {
    this.currentSession = null;
    this.isRecording = false;
    return 'Teaching session cancelled. No worries, we can try again anytime!';
  }

  /**
   * Get current teaching progress
   */
  getProgress(): string {
    if (!this.currentSession) {
      return 'No active teaching session';
    }

    const steps = this.currentSession.steps.length;
    const duration = Math.floor((Date.now() - this.currentSession.startTime) / 1000);

    return `📊 **Teaching Progress**

Task: ${this.currentSession.task}
Steps recorded: ${steps}
Duration: ${duration} seconds

${this.currentSession.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}`;
  }

  /**
   * Extract task type from user query
   */
  private extractTaskType(task: string): string {
    const lower = task.toLowerCase();

    if (lower.includes('reminder') || lower.includes('alarm')) return 'set_reminder';
    if (lower.includes('call')) return 'make_call';
    if (lower.includes('message')) return 'send_message';
    if (lower.includes('open')) return 'open_app';
    if (lower.includes('search')) return 'search';
    if (lower.includes('wifi') || lower.includes('bluetooth')) return 'toggle_setting';

    // Generate task type from first verb
    const words = task.split(' ');
    const verb = words.find(w => this.isVerb(w));
    return verb ? `${verb}_task` : 'custom_task';
  }

  private isVerb(word: string): boolean {
    const verbs = ['set', 'make', 'send', 'open', 'search', 'find', 'create', 'delete', 'turn', 'enable', 'disable'];
    return verbs.includes(word.toLowerCase());
  }

  /**
   * Quick teach - User provides steps in one go
   */
  async quickTeach(task: string, steps: string[]): Promise<string> {
    await this.startTeaching(task, 'explanation');

    for (const step of steps) {
      await this.recordStep(step);
    }

    return await this.finishTeaching();
  }
}

export const lightTeacher = new LightTeacher();
