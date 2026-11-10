/**
 * Reminder System - Sets Android alarms/reminders
 */
import { NativeModules, Platform } from "react-native";
import * as Notifications from "expo-notifications";

const ReminderModule = Platform.OS === "android" ? NativeModules.ReminderModule : null;

// Check if module is available
function isReminderModuleAvailable(): boolean {
  if (!ReminderModule) {
    console.warn('[Reminders] Module not available - not on Android or module not registered');
    return false;
  }
  if (typeof ReminderModule.setReminder !== 'function') {
    console.warn('[Reminders] setReminder method not found on module');
    return false;
  }
  return true;
}

/** Request notification permissions (for reminder notifications) */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === "granted";
  } catch (e) {
    console.warn('[Reminders] Permission request failed:', e);
    return false;
  }
}

export interface ReminderOptions {
  title: string;
  time: Date;
}

/**
 * Set a reminder/alarm
 */
export async function setReminder(options: ReminderOptions): Promise<string> {
  if (!isReminderModuleAvailable()) {
    throw new Error("Reminder module is not available");
  }

  const timestampMillis = options.time.getTime();
  
  console.log('[Reminders] Setting reminder:', options.title, 'at', options.time.toLocaleString());
  
  try {
    const result = await ReminderModule.setReminder(options.title, timestampMillis);
    console.log('[Reminders] Success:', result);
    return result;
  } catch (error) {
    console.error('[Reminders] Failed:', error);
    throw error;
  }
}

/**
 * Cancel a reminder
 */
export async function cancelReminder(time: Date): Promise<string> {
  if (!isReminderModuleAvailable()) {
    throw new Error("Reminder module is not available");
  }

  const timestampMillis = time.getTime();
  
  try {
    const result = await ReminderModule.cancelReminder(timestampMillis);
    console.log('[Reminders] Cancelled:', result);
    return result;
  } catch (error) {
    console.error('[Reminders] Cancel failed:', error);
    throw error;
  }
}

/**
 * Parse natural language time into a Date object
 * Examples:
 * - "3pm" -> today at 3pm
 * - "15:00" -> today at 3pm
 * - "in 30 minutes" -> 30 minutes from now
 * - "tomorrow at 9am" -> tomorrow at 9am
 */
export function parseTimeString(timeStr: string): Date | null {
  const now = new Date();
  const lowerStr = timeStr.toLowerCase().trim();
  
  // Handle "in X minutes/hours"
  const inMinutesMatch = lowerStr.match(/in (\d+) minutes?/);
  if (inMinutesMatch) {
    const minutes = parseInt(inMinutesMatch[1]);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }
  
  const inHoursMatch = lowerStr.match(/in (\d+) hours?/);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1]);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }
  
  // Handle "tomorrow"
  const isTomorrow = lowerStr.includes('tomorrow');
  const targetDate = isTomorrow ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : new Date();
  
  // Handle "3pm", "15:00", "3:30pm" format
  const timeMatch = lowerStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];
    
    // Convert to 24-hour format
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
    
    targetDate.setHours(hours, minutes, 0, 0);
    
    // If time is in the past today, assume tomorrow
    if (!isTomorrow && targetDate.getTime() < now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    return targetDate;
  }
  
  return null;
}

/**
 * Extract reminder details from natural language
 * Example: "Remind me to call John at 3pm"
 * Returns: { title: "call John", time: Date }
 */
export function parseReminderCommand(command: string): ReminderOptions | null {
  const lowerCommand = command.toLowerCase();
  
  // Match patterns like "remind me to X at Y"
  const match1 = lowerCommand.match(/remind me to (.+) at (.+)/);
  if (match1) {
    const title = match1[1].trim();
    const timeStr = match1[2].trim();
    const time = parseTimeString(timeStr);
    if (time) {
      return { title, time };
    }
  }
  
  // Match patterns like "set a reminder for X at Y"
  const match2 = lowerCommand.match(/set (?:a )?reminder for (.+) at (.+)/);
  if (match2) {
    const title = match2[1].trim();
    const timeStr = match2[2].trim();
    const time = parseTimeString(timeStr);
    if (time) {
      return { title, time };
    }
  }
  
  // Match patterns like "remind me in X minutes to Y"
  const match3 = lowerCommand.match(/remind me in (.+) to (.+)/);
  if (match3) {
    const timeStr = 'in ' + match3[1].trim();
    const title = match3[2].trim();
    const time = parseTimeString(timeStr);
    if (time) {
      return { title, time };
    }
  }
  
  return null;
}

/**
 * Alias for parseReminderCommand (used by assistant.ts)
 */
export function parseReminderFromSpeech(command: string): ReminderOptions | null {
  return parseReminderCommand(command);
}

/**
 * Schedule a reminder (wrapper around setReminder)
 */
export async function scheduleReminder(options: ReminderOptions): Promise<string> {
  console.log('[Reminders] scheduleReminder called:', options);
  return await setReminder(options);
}

/**
 * Format reminders for speech output
 */
export function formatRemindersForSpeech(reminders: any[]): string {
  if (reminders.length === 0) {
    return "You have no upcoming reminders, sir.";
  }
  
  if (reminders.length === 1) {
    const r = reminders[0];
    const time = new Date(r.fire_at).toLocaleString('en-GB', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
    return `You have one reminder: ${r.title} at ${time}.`;
  }
  
  const count = reminders.length;
  const first = reminders[0];
  const firstTime = new Date(first.fire_at).toLocaleString('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    month: 'short',
    day: 'numeric'
  });
  
  return `You have ${count} reminders. The next one is: ${first.title} at ${firstTime}.`;
}

/**
 * Cancel all reminders (for settings/reminders tabs)
 */
export async function cancelAllReminders(): Promise<void> {
  console.log('[Reminders] Cancelling all reminders...');
  // This would need to be implemented in the native module
  // For now, just log it
  console.warn('[Reminders] cancelAllReminders not yet implemented in native module');
}

