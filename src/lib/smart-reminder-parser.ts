/**
 * Smart Reminder Parser - Intelligent reminder parsing
 * Understands natural language like a genius human would
 */

export interface SmartReminderResult {
  title: string;
  minutes: number;
  actionType?: 'call' | 'text' | 'email' | 'generic';
  target?: string; // Person/contact name
  originalInput: string;
}

/**
 * Parse reminder with high intelligence
 * Examples that work:
 * - "remind me to call mom tomorrow at 5pm"
 * - "set reminder to text John in 2 hours"
 * - "remind me in 30 minutes to call doctor"
 * - "remind me to call Sarah at 3pm"
 * - "set a reminder for 9am tomorrow to email boss"
 */
export function parseSmartReminder(text: string): SmartReminderResult | null {
  const lower = text.toLowerCase().trim();
  
  // Remove common prefixes
  let cleanText = lower
    .replace(/^(hey light,?|light,?|please|can you|could you)\s+/i, '')
    .replace(/^(remind me to|set reminder to|set a reminder to|remind me|reminder to|set reminder for|create reminder)\s+/i, '')
    .trim();

  console.log('[SmartReminder] Parsing:', cleanText);

  // Extract action type and target
  let actionType: 'call' | 'text' | 'email' | 'generic' = 'generic';
  let target: string | undefined;
  let taskDescription = cleanText;

  // Pattern: "call|text|email [person]"
  const actionMatch = cleanText.match(/^(call|text|message|email|sms)\s+([a-z\s]+?)(?:\s+(?:in|at|tomorrow|today|tonight)|\s*$)/i);
  if (actionMatch) {
    const action = actionMatch[1].toLowerCase();
    target = actionMatch[2].trim();
    
    if (action === 'call') {
      actionType = 'call';
      taskDescription = `Call ${target}`;
    } else if (action === 'text' || action === 'message' || action === 'sms') {
      actionType = 'text';
      taskDescription = `Text ${target}`;
    } else if (action === 'email') {
      actionType = 'email';
      taskDescription = `Email ${target}`;
    }
  }

  // Extract time
  const timeResult = extractTime(cleanText);
  if (!timeResult) {
    console.log('[SmartReminder] Could not parse time from:', cleanText);
    return null;
  }

  // If we didn't find action/target yet, look for them in the description
  if (!target && actionType === 'generic') {
    // Pattern: "to call [person]", "to text [person]", etc.
    const toActionMatch = cleanText.match(/to\s+(call|text|message|email|sms)\s+([a-z\s]+?)(?:\s+(?:in|at|tomorrow|today|tonight)|\s*$)/i);
    if (toActionMatch) {
      const action = toActionMatch[1].toLowerCase();
      target = toActionMatch[2].trim();
      
      if (action === 'call') {
        actionType = 'call';
        taskDescription = `Call ${target}`;
      } else if (action === 'text' || action === 'message' || action === 'sms') {
        actionType = 'text';
        taskDescription = `Text ${target}`;
      } else if (action === 'email') {
        actionType = 'email';
        taskDescription = `Email ${target}`;
      }
    }
  }

  // If still no clear task, extract whatever's before the time indicator
  if (taskDescription === cleanText) {
    const beforeTime = extractTaskBeforeTime(cleanText);
    if (beforeTime) {
      taskDescription = beforeTime;
    }
  }

  // Clean up task description
  taskDescription = taskDescription
    .replace(/\s*(?:in|at|tomorrow|today|tonight)\s+.*$/i, '')
    .trim();

  if (!taskDescription) {
    taskDescription = 'Reminder';
  }

  // Capitalize first letter
  taskDescription = taskDescription.charAt(0).toUpperCase() + taskDescription.slice(1);

  console.log('[SmartReminder] Parsed:', {
    task: taskDescription,
    minutes: timeResult.minutes,
    actionType,
    target,
  });

  return {
    title: taskDescription,
    minutes: timeResult.minutes,
    actionType,
    target,
    originalInput: text,
  };
}

/**
 * Extract time from text
 */
function extractTime(text: string): { minutes: number } | null {
  const lower = text.toLowerCase();
  
  // Pattern 1: "in X minutes/hours/days"
  const inPattern = /in\s+(\d+)\s*(minute|min|hour|hr|day|second|sec)s?/i;
  const inMatch = lower.match(inPattern);
  if (inMatch) {
    const value = parseInt(inMatch[1]);
    const unit = inMatch[2];
    
    let minutes = 0;
    if (unit.startsWith('min')) {
      minutes = value;
    } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
      minutes = value * 60;
    } else if (unit.startsWith('day')) {
      minutes = value * 24 * 60;
    } else if (unit.startsWith('sec')) {
      minutes = Math.max(1, Math.round(value / 60));
    }
    
    return { minutes };
  }
  
  // Pattern 2: "at 3pm", "at 15:30", "at 9am"
  const atTimePattern = /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const atMatch = lower.match(atTimePattern);
  if (atMatch) {
    let hours = parseInt(atMatch[1]);
    const mins = atMatch[2] ? parseInt(atMatch[2]) : 0;
    const ampm = atMatch[3];
    
    // Convert to 24-hour format
    if (ampm) {
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
    
    // Calculate minutes from now
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
    
    // If time already passed today, schedule for tomorrow
    if (target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    
    const minutes = Math.round((target.getTime() - now.getTime()) / 60000);
    return { minutes };
  }
  
  // Pattern 3: "tomorrow at 9am"
  if (lower.includes('tomorrow')) {
    const tomorrowMatch = lower.match(/tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tomorrowMatch) {
      let hours = parseInt(tomorrowMatch[1]);
      const mins = tomorrowMatch[2] ? parseInt(tomorrowMatch[2]) : 0;
      const ampm = tomorrowMatch[3];
      
      if (ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, mins);
      const minutes = Math.round((tomorrow.getTime() - now.getTime()) / 60000);
      return { minutes };
    } else {
      // Just "tomorrow" with no specific time - default to 9am tomorrow
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
      const minutes = Math.round((tomorrow.getTime() - now.getTime()) / 60000);
      return { minutes };
    }
  }
  
  // Pattern 4: "today at 5pm"
  if (lower.includes('today')) {
    const todayMatch = lower.match(/today\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (todayMatch) {
      let hours = parseInt(todayMatch[1]);
      const mins = todayMatch[2] ? parseInt(todayMatch[2]) : 0;
      const ampm = todayMatch[3];
      
      if (ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
      
      // If already passed, schedule for tomorrow
      if (today.getTime() < now.getTime()) {
        today.setDate(today.getDate() + 1);
      }
      
      const minutes = Math.round((today.getTime() - now.getTime()) / 60000);
      return { minutes };
    }
  }
  
  // Pattern 5: "tonight at 8pm" or just "tonight"
  if (lower.includes('tonight')) {
    const tonightMatch = lower.match(/tonight\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (tonightMatch) {
      let hours = parseInt(tonightMatch[1]);
      const mins = tonightMatch[2] ? parseInt(tonightMatch[2]) : 0;
      const ampm = tonightMatch[3];
      
      if (ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      } else {
        // Default to PM for "tonight"
        if (hours < 12) hours += 12;
      }
      
      const now = new Date();
      const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
      
      if (tonight.getTime() < now.getTime()) {
        // If already passed, it's tomorrow night
        tonight.setDate(tonight.getDate() + 1);
      }
      
      const minutes = Math.round((tonight.getTime() - now.getTime()) / 60000);
      return { minutes };
    } else {
      // Just "tonight" - default to 8pm
      const now = new Date();
      const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0);
      
      if (tonight.getTime() < now.getTime()) {
        tonight.setDate(tonight.getDate() + 1);
      }
      
      const minutes = Math.round((tonight.getTime() - now.getTime()) / 60000);
      return { minutes };
    }
  }
  
  // Pattern 6: Just a time like "3pm" or "15:30"
  const justTimePattern = /^.*?(\d{1,2})(?::(\d{2}))?\s*(am|pm).*$/i;
  const justTimeMatch = lower.match(justTimePattern);
  if (justTimeMatch) {
    let hours = parseInt(justTimeMatch[1]);
    const mins = justTimeMatch[2] ? parseInt(justTimeMatch[2]) : 0;
    const ampm = justTimeMatch[3];
    
    if (ampm) {
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
    
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
    
    if (target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    
    const minutes = Math.round((target.getTime() - now.getTime()) / 60000);
    return { minutes };
  }
  
  // No time found - return null
  return null;
}

/**
 * Extract task description before time indicator
 */
function extractTaskBeforeTime(text: string): string {
  const timeIndicators = [
    /\s+in\s+\d+/i,
    /\s+at\s+\d+/i,
    /\s+tomorrow/i,
    /\s+today/i,
    /\s+tonight/i,
  ];
  
  for (const pattern of timeIndicators) {
    const match = text.match(pattern);
    if (match) {
      const task = text.substring(0, match.index).trim();
      if (task) {
        return task.replace(/^to\s+/i, '');
      }
    }
  }
  
  return text;
}
