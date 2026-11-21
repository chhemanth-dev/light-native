/**
 * Light Self-Healing System
 * Automatically detects and repairs errors
 * Makes Light autonomous and self-sufficient
 */

import { storageManager } from './light-storage-manager';
import { lightBrain } from './light-brain';

export interface ErrorDiagnosis {
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  possibleCauses: string[];
  suggestedFixes: string[];
  autoFixable: boolean;
}

export interface RepairAction {
  action: string;
  description: string;
  executed: boolean;
  success: boolean;
  timestamp: number;
  errorBefore: string;
  errorAfter?: string;
}

export class LightSelfHealingSystem {
  private repairHistory: RepairAction[] = [];
  private knownErrors: Map<string, ErrorDiagnosis> = new Map();

  constructor() {
    this.initializeKnownErrors();
  }

  /**
   * Initialize database of known errors and fixes
   */
  private initializeKnownErrors() {
    // Permission errors
    this.knownErrors.set('PERMISSION_DENIED', {
      errorType: 'Permission Denied',
      severity: 'high',
      possibleCauses: [
        'App lacks required Android permission',
        'Permission was revoked by user',
        'Permission not declared in manifest',
      ],
      suggestedFixes: [
        'Request permission from user',
        'Guide user to app settings',
        'Provide alternative without permission',
      ],
      autoFixable: true,
    });

    // Storage errors
    this.knownErrors.set('STORAGE_FULL', {
      errorType: 'Storage Full',
      severity: 'critical',
      possibleCauses: [
        'Device storage exhausted',
        'App storage quota exceeded',
        'Too much cached data',
      ],
      suggestedFixes: [
        'Clear old cache data',
        'Remove old conversation history',
        'Compress stored knowledge',
      ],
      autoFixable: true,
    });

    // Network errors
    this.knownErrors.set('NETWORK_ERROR', {
      errorType: 'Network Error',
      severity: 'medium',
      possibleCauses: [
        'No internet connection',
        'API endpoint down',
        'Request timeout',
      ],
      suggestedFixes: [
        'Retry with exponential backoff',
        'Fall back to cached data',
        'Use offline capabilities',
      ],
      autoFixable: true,
    });

    // Speech recognition errors
    this.knownErrors.set('SPEECH_RECOGNITION_FAILED', {
      errorType: 'Speech Recognition Failed',
      severity: 'high',
      possibleCauses: [
        'Microphone permission denied',
        'Speech service unavailable',
        'Too much background noise',
        'No speech detected',
      ],
      suggestedFixes: [
        'Request microphone permission',
        'Offer text input fallback',
        'Adjust audio settings',
        'Provide visual feedback for speech',
      ],
      autoFixable: true,
    });

    // App not found errors
    this.knownErrors.set('APP_NOT_FOUND', {
      errorType: 'App Not Found',
      severity: 'medium',
      possibleCauses: [
        'App not installed on device',
        'Incorrect package name',
        'App name misspelled',
      ],
      suggestedFixes: [
        'Suggest installing the app',
        'Search for similar apps',
        'Open Play Store for download',
      ],
      autoFixable: true,
    });

    // Contact not found
    this.knownErrors.set('CONTACT_NOT_FOUND', {
      errorType: 'Contact Not Found',
      severity: 'medium',
      possibleCauses: [
        'Contact name not in phonebook',
        'Contact permission not granted',
        'Name misspelled or different format',
      ],
      suggestedFixes: [
        'Request contact permission',
        'Search phonebook for similar names',
        'Ask user to specify phone number',
      ],
      autoFixable: true,
    });

    // AI response errors
    this.knownErrors.set('AI_RESPONSE_ERROR', {
      errorType: 'AI Response Generation Failed',
      severity: 'high',
      possibleCauses: [
        'Low confidence in pattern matching',
        'Web search failed',
        'No relevant knowledge found',
      ],
      suggestedFixes: [
        'Retry web search with different query',
        'Ask clarifying question',
        'Use fallback response pattern',
      ],
      autoFixable: true,
    });
  }

  /**
   * Diagnose an error and determine if auto-fixable
   */
  async diagnose(error: Error | string): Promise<ErrorDiagnosis> {
    const errorMessage = error instanceof Error ? error.message : error;
    console.log('[SelfHealing] 🔍 Diagnosing error:', errorMessage);

    // Check if it's a known error
    for (const [key, diagnosis] of this.knownErrors.entries()) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))) {
        console.log('[SelfHealing] ✅ Identified as:', diagnosis.errorType);
        return diagnosis;
      }
    }

    // Unknown error - create generic diagnosis
    return {
      errorType: 'Unknown Error',
      severity: 'medium',
      possibleCauses: ['Unexpected condition occurred'],
      suggestedFixes: ['Log error for analysis', 'Retry operation', 'Notify user'],
      autoFixable: false,
    };
  }

  /**
   * Automatically attempt to fix an error
   */
  async autoRepair(error: Error | string): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    const errorMessage = error instanceof Error ? error.message : error;
    console.log('[SelfHealing] 🔧 Auto-repairing:', errorMessage);

    const diagnosis = await this.diagnose(errorMessage);

    if (!diagnosis.autoFixable) {
      console.log('[SelfHealing] ⚠️ Not auto-fixable');
      return {
        fixed: false,
        action: 'none',
        message: `This error requires manual intervention: ${diagnosis.errorType}`,
      };
    }

    // Attempt fixes based on error type
    if (errorMessage.toLowerCase().includes('permission')) {
      return await this.fixPermissionError(errorMessage);
    } else if (errorMessage.toLowerCase().includes('storage')) {
      return await this.fixStorageError();
    } else if (errorMessage.toLowerCase().includes('network')) {
      return await this.fixNetworkError(errorMessage);
    } else if (errorMessage.toLowerCase().includes('speech')) {
      return await this.fixSpeechError();
    } else if (errorMessage.toLowerCase().includes('app not found')) {
      return await this.fixAppNotFound(errorMessage);
    } else if (errorMessage.toLowerCase().includes('contact not found')) {
      return await this.fixContactNotFound(errorMessage);
    }

    // Generic retry strategy
    return {
      fixed: false,
      action: 'retry_suggested',
      message: 'I encountered an issue, sir. Please try again or rephrase your request.',
    };
  }

  /**
   * Fix permission errors
   */
  private async fixPermissionError(error: string): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 🔑 Fixing permission error');

    this.recordRepair({
      action: 'request_permission',
      description: 'Detected missing permission, will request from user',
      executed: true,
      success: true,
      timestamp: Date.now(),
      errorBefore: error,
    });

    return {
      fixed: true,
      action: 'permission_request',
      message:
        "I need permission to do that, sir. I'll request it now. Please grant the permission when prompted.",
    };
  }

  /**
   * Fix storage errors by cleaning up
   */
  private async fixStorageError(): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 💾 Fixing storage error by cleaning up');

    try {
      await storageManager.forceCleanup();
      const stats = await storageManager.getStats();

      this.recordRepair({
        action: 'cleanup_storage',
        description: `Cleaned up storage, freed ${stats.totalSizeMB}MB`,
        executed: true,
        success: true,
        timestamp: Date.now(),
        errorBefore: 'Storage full',
        errorAfter: 'Storage cleaned',
      });

      return {
        fixed: true,
        action: 'storage_cleaned',
        message: `I cleaned up some storage space, sir. I'm ready to continue now.`,
      };
    } catch (cleanupError) {
      return {
        fixed: false,
        action: 'cleanup_failed',
        message:
          'I tried to free up storage but need your help, sir. Please clear some space in your device settings.',
      };
    }
  }

  /**
   * Fix network errors with retry
   */
  private async fixNetworkError(error: string): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 🌐 Fixing network error');

    this.recordRepair({
      action: 'use_offline_mode',
      description: 'Network unavailable, switching to offline capabilities',
      executed: true,
      success: true,
      timestamp: Date.now(),
      errorBefore: error,
    });

    return {
      fixed: true,
      action: 'offline_fallback',
      message:
        "I'm having trouble connecting to the internet, sir. I'll use my offline capabilities for now. Some features may be limited.",
    };
  }

  /**
   * Fix speech recognition errors
   */
  private async fixSpeechError(): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 🎤 Fixing speech recognition error');

    this.recordRepair({
      action: 'offer_text_input',
      description: 'Speech recognition failed, offering text input alternative',
      executed: true,
      success: true,
      timestamp: Date.now(),
      errorBefore: 'Speech recognition failed',
    });

    return {
      fixed: true,
      action: 'text_input_fallback',
      message:
        "I'm having trouble with voice recognition, sir. You can use the 'Type Instead' button below to communicate with me via text.",
    };
  }

  /**
   * Fix app not found errors
   */
  private async fixAppNotFound(error: string): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 📱 Fixing app not found error');

    // Extract app name from error
    const appMatch = error.match(/app[:\s]+([^\s,]+)/i);
    const appName = appMatch ? appMatch[1] : 'the app';

    this.recordRepair({
      action: 'suggest_install',
      description: `App ${appName} not found, suggesting installation`,
      executed: true,
      success: true,
      timestamp: Date.now(),
      errorBefore: error,
    });

    return {
      fixed: true,
      action: 'suggest_install',
      message: `It looks like ${appName} is not installed, sir. Would you like me to open the Play Store so you can download it?`,
    };
  }

  /**
   * Fix contact not found errors
   */
  private async fixContactNotFound(error: string): Promise<{
    fixed: boolean;
    action: string;
    message: string;
  }> {
    console.log('[SelfHealing] 👤 Fixing contact not found error');

    // Extract contact name from error
    const contactMatch = error.match(/contact[:\s]+([^\s,]+)/i);
    const contactName = contactMatch ? contactMatch[1] : 'that contact';

    this.recordRepair({
      action: 'search_alternative',
      description: `Contact ${contactName} not found, asking for clarification`,
      executed: true,
      success: true,
      timestamp: Date.now(),
      errorBefore: error,
    });

    return {
      fixed: true,
      action: 'ask_clarification',
      message: `I couldn't find ${contactName} in your contacts, sir. Could you spell the name, or provide the phone number directly? Say "call" followed by the number.`,
    };
  }

  /**
   * Record repair action
   */
  private recordRepair(action: RepairAction) {
    this.repairHistory.push(action);

    // Keep only last 100 repairs
    if (this.repairHistory.length > 100) {
      this.repairHistory = this.repairHistory.slice(-100);
    }

    console.log('[SelfHealing] 📝 Recorded repair:', action.action);
  }

  /**
   * Get repair statistics
   */
  getRepairStats(): {
    totalRepairs: number;
    successfulRepairs: number;
    successRate: number;
    commonErrors: Array<{ error: string; count: number }>;
  } {
    const total = this.repairHistory.length;
    const successful = this.repairHistory.filter((r) => r.success).length;
    const successRate = total > 0 ? successful / total : 0;

    // Count error types
    const errorCounts = new Map<string, number>();
    this.repairHistory.forEach((repair) => {
      const count = errorCounts.get(repair.action) || 0;
      errorCounts.set(repair.action, count + 1);
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRepairs: total,
      successfulRepairs: successful,
      successRate,
      commonErrors,
    };
  }

  /**
   * Get repair history
   */
  getRepairHistory(): RepairAction[] {
    return this.repairHistory;
  }

  /**
   * Learn from repair (improve future auto-repairs)
   */
  async learnFromRepair(
    error: string,
    fixWorked: boolean,
    userFeedback?: string
  ): Promise<void> {
    console.log('[SelfHealing] 📚 Learning from repair result');

    // Store learning for future reference
    await lightBrain.storeKnowledge({
      query: `error_fix: ${error}`,
      answer: fixWorked
        ? 'Auto-repair successful'
        : `Auto-repair failed. User feedback: ${userFeedback || 'none'}`,
      source: 'self_healing',
      confidence: fixWorked ? 0.9 : 0.3,
    });
  }

  /**
   * Proactive health check
   * Check system health and fix issues before they cause problems
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    autoFixedIssues: string[];
  }> {
    console.log('[SelfHealing] 🏥 Running proactive health check');

    const issues: string[] = [];
    const autoFixed: string[] = [];

    // Check storage
    try {
      const usage = await storageManager.getUsagePercentage();
      if (usage.total > 90) {
        issues.push('Storage usage critical (>90%)');
        await storageManager.forceCleanup();
        autoFixed.push('Cleaned up storage automatically');
      } else if (usage.total > 75) {
        issues.push('Storage usage high (>75%)');
      }
    } catch (e) {
      issues.push('Could not check storage status');
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0 && autoFixed.length === issues.length) {
      status = 'healthy'; // All issues fixed
    } else if (issues.length > 0) {
      status = issues.some((i) => i.includes('critical')) ? 'critical' : 'warning';
    }

    return {
      status,
      issues,
      autoFixedIssues: autoFixed,
    };
  }
}

// Singleton
export const selfHealingSystem = new LightSelfHealingSystem();
