/**
 * Light Interactive Teacher
 * Enhanced teaching mode with pause/resume and step-by-step control
 * You demonstrate, Light watches and learns - with full control!
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from './db';

export type TeachingState = 'idle' | 'recording' | 'paused' | 'completed';

export interface TeachingSession {
  id: string;
  taskName: string;
  taskDescription: string;
  state: TeachingState;
  steps: TeachingStep[];
  startTime: number;
  pausedAt?: number;
  completedAt?: number;
}

export interface TeachingStep {
  stepNumber: number;
  action: string;
  description: string;
  timestamp: number;
  userPerformed: boolean; // true = user did it, false = Light will do it
  screenshot?: string;    // Optional screenshot for reference
  voiceNote?: string;     // Optional voice explanation
}

const STORAGE_KEY = '@light_teaching_session';

export class LightInteractiveTeacher {
  private currentSession: TeachingSession | null = null;

  /**
   * Start new teaching session
   * Light will WATCH while YOU perform the task
   */
  async startTeaching(taskName: string, taskDescription: string): Promise<string> {
    this.currentSession = {
      id: `teach_${Date.now()}`,
      taskName,
      taskDescription,
      state: 'recording',
      steps: [],
      startTime: Date.now(),
    };

    await this.saveSession();

    return `🎓 **Teaching Mode Started!**

Task: "${taskName}"

📹 I'm watching and learning...
👉 You perform the steps
🛑 Say "Light, pause" to pause anytime
✅ Say "Light, done" when finished

Go ahead and start! I'm ready to learn.`;
  }

  /**
   * Record a step (user tells Light what they just did)
   */
  async recordStep(description: string, action?: string): Promise<string> {
    if (!this.currentSession || this.currentSession.state !== 'recording') {
      throw new Error('No active teaching session');
    }

    const step: TeachingStep = {
      stepNumber: this.currentSession.steps.length + 1,
      action: action || 'manual_action',
      description,
      timestamp: Date.now(),
      userPerformed: true,
    };

    this.currentSession.steps.push(step);
    await this.saveSession();

    return `✅ Step ${step.stepNumber} recorded: "${description}"

Continue with the next step, or say "Light, done" if finished.`;
  }

  /**
   * Pause teaching (so you can do sensitive steps manually)
   */
  async pause(): Promise<string> {
    if (!this.currentSession || this.currentSession.state !== 'recording') {
      throw new Error('No active teaching session to pause');
    }

    this.currentSession.state = 'paused';
    this.currentSession.pausedAt = Date.now();
    await this.saveSession();

    return `⏸️ **Teaching Paused**

I've stopped watching. You can now:
- Do sensitive steps (passwords, payments, etc.)
- Take a break
- Do manual actions

Say "Light, resume" when you're ready to continue teaching.`;
  }

  /**
   * Resume teaching
   */
  async resume(): Promise<string> {
    if (!this.currentSession || this.currentSession.state !== 'paused') {
      throw new Error('No paused teaching session to resume');
    }

    this.currentSession.state = 'recording';
    await this.saveSession();

    const pausedDuration = Date.now() - (this.currentSession.pausedAt || 0);
    const pausedMinutes = Math.round(pausedDuration / 60000);

    return `▶️ **Teaching Resumed**

I'm watching again! Continue with your demonstration.

(Was paused for ${pausedMinutes} minute${pausedMinutes !== 1 ? 's' : ''})`;
  }

  /**
   * Add a manual step (for actions done during pause)
   */
  async addManualStep(description: string): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active teaching session');
    }

    const step: TeachingStep = {
      stepNumber: this.currentSession.steps.length + 1,
      action: 'manual_step',
      description: `[Manual] ${description}`,
      timestamp: Date.now(),
      userPerformed: true,
    };

    this.currentSession.steps.push(step);
    await this.saveSession();

    return `📝 Manual step added: "${description}"

This step will be marked as "user must do manually" when Light performs this task.`;
  }

  /**
   * Complete teaching session
   */
  async completeTeaching(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active teaching session to complete');
    }

    this.currentSession.state = 'completed';
    this.currentSession.completedAt = Date.now();

    // Save to database
    await this.saveToDemonstrations();
    await this.saveSession();

    const summary = this.generateSummary();
    
    // Clear current session
    const sessionName = this.currentSession.taskName;
    this.currentSession = null;
    await AsyncStorage.removeItem(STORAGE_KEY);

    return `🎉 **Teaching Complete!**

Task: "${sessionName}"
${summary}

I've learned this task and can now help you with it!

Next time you ask me to "${sessionName}", I'll guide you through the steps or do what I can automatically.`;
  }

  /**
   * Cancel teaching session
   */
  async cancelTeaching(): Promise<string> {
    if (!this.currentSession) {
      return 'No active teaching session to cancel.';
    }

    const taskName = this.currentSession.taskName;
    this.currentSession = null;
    await AsyncStorage.removeItem(STORAGE_KEY);

    return `❌ Teaching session cancelled: "${taskName}"

No worries! You can start teaching again anytime.`;
  }

  /**
   * Get current teaching status
   */
  getStatus(): {
    active: boolean;
    state?: TeachingState;
    taskName?: string;
    stepsRecorded?: number;
  } | null {
    if (!this.currentSession) {
      return null;
    }

    return {
      active: true,
      state: this.currentSession.state,
      taskName: this.currentSession.taskName,
      stepsRecorded: this.currentSession.steps.length,
    };
  }

  /**
   * Generate summary of teaching session
   */
  private generateSummary(): string {
    if (!this.currentSession) return '';

    const totalSteps = this.currentSession.steps.length;
    const manualSteps = this.currentSession.steps.filter(s => s.description.startsWith('[Manual]')).length;
    const autoSteps = totalSteps - manualSteps;
    const duration = Math.round((Date.now() - this.currentSession.startTime) / 60000);

    return `
📊 Summary:
  • Total steps: ${totalSteps}
  • Automated steps: ${autoSteps}
  • Manual steps: ${manualSteps}
  • Duration: ${duration} minute${duration !== 1 ? 's' : ''}
  
When you ask me to perform this task:
  ✅ I'll do ${autoSteps} steps automatically
  👤 You'll need to do ${manualSteps} step${manualSteps !== 1 ? 's' : ''} manually`;
  }

  /**
   * Save session to storage (for recovery)
   */
  private async saveSession(): Promise<void> {
    if (this.currentSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSession));
    }
  }

  /**
   * Load session from storage (recovery after crash)
   */
  async loadSession(): Promise<TeachingSession | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      }
    } catch (error) {
      console.error('Failed to load teaching session:', error);
    }
    return null;
  }

  /**
   * Save completed demonstration to database
   */
  private async saveToDemonstrations(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const db = await getDb();
      
      await db.runAsync(
        `INSERT INTO light_demonstrations (
          task, description, steps, created_at, use_count, last_used
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          this.currentSession.taskName,
          this.currentSession.taskDescription,
          JSON.stringify(this.currentSession.steps),
          this.currentSession.startTime,
          0,
          0,
        ]
      );

      console.log('✅ Demonstration saved to database');
    } catch (error) {
      console.error('❌ Failed to save demonstration:', error);
    }
  }

  /**
   * Replay a learned task (guide user through steps)
   */
  async replayTask(taskName: string): Promise<{
    success: boolean;
    message: string;
    steps?: TeachingStep[];
  }> {
    try {
      const db = await getDb();
      const results = await db.getAllAsync(
        'SELECT * FROM light_demonstrations WHERE task LIKE ? LIMIT 1',
        [`%${taskName}%`]
      );

      if (results.length === 0) {
        return {
          success: false,
          message: `I haven't learned how to "${taskName}" yet. Would you like to teach me?`,
        };
      }

      const demo = results[0] as any;
      const steps = JSON.parse(demo.steps) as TeachingStep[];

      // Update use count
      await db.runAsync(
        'UPDATE light_demonstrations SET use_count = use_count + 1, last_used = ? WHERE id = ?',
        [Date.now(), demo.id]
      );

      return {
        success: true,
        message: this.formatReplayInstructions(taskName, steps),
        steps,
      };
    } catch (error) {
      console.error('Error replaying task:', error);
      return {
        success: false,
        message: 'Failed to retrieve task instructions.',
      };
    }
  }

  /**
   * Format replay instructions for user
   */
  private formatReplayInstructions(taskName: string, steps: TeachingStep[]): string {
    let instructions = `🎯 **Performing: ${taskName}**\n\n`;
    instructions += `I'll guide you through ${steps.length} step${steps.length !== 1 ? 's' : ''}:\n\n`;

    steps.forEach((step, index) => {
      const icon = step.description.startsWith('[Manual]') ? '👤' : '🤖';
      const action = step.description.startsWith('[Manual]') 
        ? step.description.replace('[Manual] ', '')
        : step.description;
      
      instructions += `${icon} Step ${index + 1}: ${action}\n`;
    });

    instructions += `\n✅ Say "Light, next" for each step\n`;
    instructions += `⏸️ Say "Light, pause" if you need to stop\n`;
    
    return instructions;
  }
}

// Singleton
export const interactiveTeacher = new LightInteractiveTeacher();
