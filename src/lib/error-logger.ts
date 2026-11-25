/**
 * Error Logger - Captures all errors for debugging
 */

export interface ErrorLog {
  id: string;
  timestamp: number;
  source: string;
  message: string;
  details: string;
  stack?: string;
  feature?: string; // Which feature failed (e.g., "WebSearch", "ReminderCreation", "VoiceRecognition")
}

const MAX_LOGS = 50; // Keep only last 50 errors to prevent storage issues
let errorLogs: ErrorLog[] = [];
let listeners: Array<(logs: ErrorLog[]) => void> = [];

// Track feature failures
const featureFailures: Map<string, number> = new Map();

/**
 * Log an error with optional feature tag
 */
export function logError(source: string, error: any, context?: string, feature?: string): void {
  const log: ErrorLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    source,
    message: error?.message || String(error),
    details: context || '',
    stack: error?.stack,
    feature,
  };

  // Add to beginning (newest first)
  errorLogs.unshift(log);

  // Keep only last MAX_LOGS
  if (errorLogs.length > MAX_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_LOGS);
  }
  
  // Track feature failure
  if (feature) {
    featureFailures.set(feature, (featureFailures.get(feature) || 0) + 1);
  }

  // Notify listeners
  notifyListeners();

  // Also log to console for immediate debugging
  console.error(`[ErrorLogger][${source}]${feature ? `[${feature}]` : ''} ${log.message}`, {
    context,
    error,
  });
}

/**
 * Get all error logs
 */
export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs];
}

/**
 * Clear all error logs
 */
export function clearErrorLogs(): void {
  errorLogs = [];
  featureFailures.clear();
  notifyListeners();
}

/**
 * Subscribe to error log updates
 */
export function subscribeToErrors(listener: (logs: ErrorLog[]) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Notify all listeners
 */
function notifyListeners(): void {
  listeners.forEach(listener => listener([...errorLogs]));
}

/**
 * Export logs as text for sharing
 */
export function exportLogsAsText(): string {
  if (errorLogs.length === 0) {
    return 'No errors logged.';
  }

  let text = `Light Native - Error Logs (${errorLogs.length} errors)\n`;
  text += `Generated: ${new Date().toISOString()}\n`;
  text += '='.repeat(60) + '\n\n';
  
  // Feature failure summary
  if (featureFailures.size > 0) {
    text += 'FEATURE FAILURES:\n';
    featureFailures.forEach((count, feature) => {
      text += `  - ${feature}: ${count} failure${count !== 1 ? 's' : ''}\n`;
    });
    text += '\n' + '='.repeat(60) + '\n\n';
  }

  errorLogs.forEach((log, index) => {
    text += `[${index + 1}] ${log.source}`;
    if (log.feature) {
      text += ` - ${log.feature}`;
    }
    text += '\n';
    text += `Time: ${new Date(log.timestamp).toLocaleString()}\n`;
    text += `Error: ${log.message}\n`;
    if (log.details) {
      text += `Details: ${log.details}\n`;
    }
    if (log.stack) {
      text += `Stack:\n${log.stack}\n`;
    }
    text += '-'.repeat(60) + '\n\n';
  });

  return text;
}

/**
 * Get error statistics
 */
export function getErrorStats(): {
  total: number;
  bySource: Record<string, number>;
  byFeature: Record<string, number>;
  lastError: ErrorLog | null;
} {
  const bySource: Record<string, number> = {};
  const byFeature: Record<string, number> = {};
  
  errorLogs.forEach(log => {
    bySource[log.source] = (bySource[log.source] || 0) + 1;
    if (log.feature) {
      byFeature[log.feature] = (byFeature[log.feature] || 0) + 1;
    }
  });

  return {
    total: errorLogs.length,
    bySource,
    byFeature,
    lastError: errorLogs[0] || null,
  };
}

/**
 * Get failed features list
 */
export function getFailedFeatures(): string[] {
  return Array.from(featureFailures.keys());
}
