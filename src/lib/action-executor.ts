/**
 * Action Executor - Parses AI responses and executes real actions
 * This makes Light actually DO things, not just talk about them!
 */

import { openApp } from './accessibility';
import { makePhoneCall } from './accessibility';
import { scheduleReminder } from './reminders';
import { parseAppCommandLocally, parsePhoneCallLocally, parseReminderLocally } from './local-parser';

export interface ExecutedAction {
  type: 'app_open' | 'phone_call' | 'reminder' | 'none';
  success: boolean;
  details?: string;
}

/**
 * Analyze AI response and execute any actions mentioned
 * Examples:
 * - "Opening WhatsApp for you" → Actually opens WhatsApp
 * - "Calling John at 555-1234" → Actually makes the call
 * - "I'll remind you in 5 minutes" → Actually sets reminder
 */
export async function executeActionsFromAIResponse(
  userInput: string,
  aiResponse: string
): Promise<ExecutedAction[]> {
  const actions: ExecutedAction[] = [];
  const lowerResponse = aiResponse.toLowerCase();
  const lowerInput = userInput.toLowerCase();

  console.log('[ActionExecutor] Analyzing AI response for actions...');
  console.log('[ActionExecutor] User input:', userInput);
  console.log('[ActionExecutor] AI response:', aiResponse);

  // ==========================================
  // ACTION 1: APP OPENING
  // ==========================================
  // Detect phrases like "opening", "launching", "I'll open"
  if (
    lowerResponse.includes('opening') ||
    lowerResponse.includes('launching') ||
    lowerResponse.includes("i'll open") ||
    lowerResponse.includes('let me open')
  ) {
    console.log('[ActionExecutor] 🎯 Detected APP OPENING intent in AI response');
    
    // Try to parse from original user input
    const appCmd = await parseAppCommandLocally(userInput);
    if (appCmd?.packageName) {
      try {
        console.log('[ActionExecutor] Executing: Open app', appCmd.packageName);
        await openApp(appCmd.packageName);
        actions.push({
          type: 'app_open',
          success: true,
          details: appCmd.appName,
        });
        console.log('[ActionExecutor] ✅ App opened successfully:', appCmd.appName);
      } catch (error) {
        console.error('[ActionExecutor] ❌ Failed to open app:', error);
        actions.push({
          type: 'app_open',
          success: false,
          details: appCmd.appName,
        });
      }
    } else {
      // Try to extract app name from AI response
      // Example: "Opening WhatsApp for you"
      const appNames = [
        'whatsapp', 'instagram', 'threads', 'facebook', 'twitter', 'x',
        'youtube', 'spotify', 'netflix', 'gmail', 'chrome', 'maps',
        'camera', 'gallery', 'settings', 'telegram', 'tiktok'
      ];
      
      for (const appName of appNames) {
        if (lowerResponse.includes(appName) || lowerInput.includes(appName)) {
          const appCmd = await parseAppCommandLocally(`open ${appName}`);
          if (appCmd?.packageName) {
            try {
              await openApp(appCmd.packageName);
              actions.push({
                type: 'app_open',
                success: true,
                details: appName,
              });
              console.log('[ActionExecutor] ✅ App opened:', appName);
              break;
            } catch (error) {
              console.error('[ActionExecutor] Failed to open', appName, error);
            }
          }
        }
      }
    }
  }

  // ==========================================
  // ACTION 2: PHONE CALLING
  // ==========================================
  // Detect phrases like "calling", "dialing", "I'll call"
  if (
    lowerResponse.includes('calling') ||
    lowerResponse.includes('dialing') ||
    lowerResponse.includes("i'll call") ||
    lowerResponse.includes('let me call')
  ) {
    console.log('[ActionExecutor] 🎯 Detected PHONE CALL intent in AI response');
    
    // Try to extract phone number from AI response
    // Example: "Calling 555-1234 for you" or "I'll call John at 555-1234"
    const phonePattern = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,})/;
    const phoneMatch = (aiResponse + ' ' + userInput).match(phonePattern);
    
    if (phoneMatch) {
      const phoneNumber = phoneMatch[1].replace(/[-.\s]/g, '');
      try {
        console.log('[ActionExecutor] Executing: Call', phoneNumber);
        await makePhoneCall(phoneNumber);
        actions.push({
          type: 'phone_call',
          success: true,
          details: phoneNumber,
        });
        console.log('[ActionExecutor] ✅ Call initiated:', phoneNumber);
      } catch (error) {
        console.error('[ActionExecutor] ❌ Failed to make call:', error);
        actions.push({
          type: 'phone_call',
          success: false,
          details: phoneNumber,
        });
      }
    } else {
      // Try parsing from user input
      const callCmd = parsePhoneCallLocally(userInput);
      if (callCmd?.phoneNumber) {
        try {
          await makePhoneCall(callCmd.phoneNumber);
          actions.push({
            type: 'phone_call',
            success: true,
            details: callCmd.phoneNumber,
          });
          console.log('[ActionExecutor] ✅ Call initiated from input');
        } catch (error) {
          console.error('[ActionExecutor] ❌ Call failed:', error);
        }
      }
    }
  }

  // ==========================================
  // ACTION 3: REMINDERS
  // ==========================================
  // Detect phrases like "I'll remind", "reminder set", "I've set a reminder"
  if (
    lowerResponse.includes('remind') ||
    lowerResponse.includes('reminder set') ||
    lowerResponse.includes("i'll remind") ||
    lowerResponse.includes("i've set")
  ) {
    console.log('[ActionExecutor] 🎯 Detected REMINDER intent in AI response');
    
    // Try to parse from user input
    const reminderCmd = parseReminderLocally(userInput);
    if (reminderCmd) {
      try {
        const fireAt = Date.now() + (reminderCmd.minutes * 60 * 1000);
        console.log('[ActionExecutor] Executing: Set reminder', reminderCmd.title);
        await scheduleReminder({
          id: Date.now().toString(),
          title: reminderCmd.title,
          time: fireAt,
          repeatInterval: null,
        });
        actions.push({
          type: 'reminder',
          success: true,
          details: `${reminderCmd.title} in ${reminderCmd.minutes}m`,
        });
        console.log('[ActionExecutor] ✅ Reminder set:', reminderCmd.title);
      } catch (error) {
        console.error('[ActionExecutor] ❌ Failed to set reminder:', error);
        actions.push({
          type: 'reminder',
          success: false,
          details: reminderCmd.title,
        });
      }
    }
  }

  if (actions.length === 0) {
    console.log('[ActionExecutor] No actions detected in AI response');
    actions.push({ type: 'none', success: true });
  } else {
    console.log('[ActionExecutor] Executed', actions.length, 'action(s)');
  }

  return actions;
}

/**
 * Check if AI response indicates it WILL do something
 * vs just talking about it
 */
export function shouldExecuteActions(aiResponse: string): boolean {
  const lowerResponse = aiResponse.toLowerCase();
  
  // Action indicators
  const actionPhrases = [
    'opening',
    'launching',
    "i'll open",
    'let me open',
    'calling',
    'dialing',
    "i'll call",
    "i'll remind",
    'reminder set',
    "i've set",
    'starting',
  ];
  
  return actionPhrases.some(phrase => lowerResponse.includes(phrase));
}
