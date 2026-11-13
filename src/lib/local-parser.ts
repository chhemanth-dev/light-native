/**
 * Local Command Parser - Works WITHOUT AI
 * Parses voice commands locally for reminders and app opening
 */

import { getInstalledApps, isAppInstalled } from './accessibility';

export interface ParsedReminder {
  title: string;
  minutes: number;
}

export interface ParsedAppCommand {
  appName: string;
  packageName?: string;
}

// Cache for installed apps (refreshed periodically)
let installedAppsCache: Array<{packageName: string, appName: string}> = [];
let lastAppCacheRefresh = 0;

/**
 * Refresh installed apps cache
 */
export async function refreshInstalledAppsCache(): Promise<void> {
  try {
    installedAppsCache = await getInstalledApps();
    lastAppCacheRefresh = Date.now();
    console.log('[LocalParser] Cached', installedAppsCache.length, 'installed apps');
  } catch (error) {
    console.error('[LocalParser] Failed to refresh app cache:', error);
  }
}

/**
 * Get installed apps (with caching)
 */
async function getCachedInstalledApps(): Promise<Array<{packageName: string, appName: string}>> {
  // Refresh cache if older than 5 minutes
  if (Date.now() - lastAppCacheRefresh > 5 * 60 * 1000) {
    await refreshInstalledAppsCache();
  }
  return installedAppsCache;
}

/**
 * Parse reminder from voice command (no AI needed)
 * Examples:
 * - "remind me to call mom in 5 minutes"
 * - "set a reminder for 2 hours to buy milk"
 * - "reminder at 3pm to check email"
 */
export function parseReminderLocally(text: string): ParsedReminder | null {
  const lower = text.toLowerCase();
  
  // Extract time
  let minutes = 0;
  let title = '';
  
  // Pattern 1: "in X minutes/hours"
  const inPattern = /in (\d+)\s*(minute|min|hour|hr|second|sec)s?/i;
  const inMatch = lower.match(inPattern);
  if (inMatch) {
    const value = parseInt(inMatch[1]);
    const unit = inMatch[2];
    
    if (unit.startsWith('min')) {
      minutes = value;
    } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
      minutes = value * 60;
    } else if (unit.startsWith('sec')) {
      minutes = Math.max(1, Math.round(value / 60)); // Convert seconds to minutes, minimum 1
    }
    
    // Extract title (text before "in X")
    const beforeIn = text.substring(0, text.toLowerCase().indexOf('in ' + inMatch[1]));
    title = beforeIn.replace(/remind me to|reminder to|remind to|set reminder to|set a reminder to/gi, '').trim();
  }
  
  // Pattern 2: "at 3pm", "at 15:30", "at 9am"
  const atTimePattern = /at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const atMatch = lower.match(atTimePattern);
  if (atMatch && !minutes) {
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
    
    minutes = Math.round((target.getTime() - now.getTime()) / 60000);
    
    // Extract title
    const beforeAt = text.substring(0, text.toLowerCase().indexOf('at ' + atMatch[1]));
    title = beforeAt.replace(/remind me to|reminder to|remind to|set reminder to|set a reminder to/gi, '').trim();
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
      minutes = Math.round((tomorrow.getTime() - now.getTime()) / 60000);
      
      const beforeTomorrow = text.substring(0, text.toLowerCase().indexOf('tomorrow'));
      title = beforeTomorrow.replace(/remind me to|reminder to|remind to|set reminder to|set a reminder to/gi, '').trim();
    }
  }
  
  if (!title) {
    // Try to extract anything after "to"
    const toMatch = text.match(/(?:remind me to|reminder to|remind to)\s+(.+)/i);
    if (toMatch) {
      title = toMatch[1].replace(/in \d+.*/i, '').replace(/at \d+.*/i, '').trim();
    }
  }
  
  // Default to 1 hour if no time specified
  if (!minutes && title) {
    minutes = 60;
  }
  
  if (minutes > 0 && title) {
    return { title, minutes };
  }
  
  return null;
}

/**
 * Parse app opening command (no AI needed)
 * Examples:
 * - "open whatsapp"
 * - "launch instagram"
 * - "start youtube"
 */
export async function parseAppCommandLocally(text: string): Promise<ParsedAppCommand | null> {
  const lower = text.toLowerCase();
  
  // Check if it's an app opening command
  const openPattern = /(?:open|launch|start|run)\s+(.+)/i;
  const match = lower.match(openPattern);
  
  if (match) {
    const appName = match[1].trim();
    
    // First try static map
    const staticPackage = APP_NAME_MAP[appName.toLowerCase()];
    if (staticPackage) {
      return { appName, packageName: staticPackage };
    }
    
    // Then search installed apps dynamically
    const installedApps = await getCachedInstalledApps();
    const foundApp = installedApps.find(app => 
      app.appName.toLowerCase().includes(appName.toLowerCase()) ||
      appName.toLowerCase().includes(app.appName.toLowerCase())
    );
    
    if (foundApp) {
      console.log('[LocalParser] Found installed app:', foundApp.appName, foundApp.packageName);
      return { appName: foundApp.appName, packageName: foundApp.packageName };
    }
    
    return { appName };
  }
  
  return null;
}

/**
 * Map common app names to package names
 */
export const APP_NAME_MAP: Record<string, string> = {
  // Social Media
  'whatsapp': 'com.whatsapp',
  'instagram': 'com.instagram.android',
  'threads': 'com.instagram.barcelona',
  'facebook': 'com.facebook.katana',
  'twitter': 'com.twitter.android',
  'x': 'com.twitter.android',
  'snapchat': 'com.snapchat.android',
  'telegram': 'org.telegram.messenger',
  'tiktok': 'com.zhiliaoapp.musically',
  'linkedin': 'com.linkedin.android',
  
  // Messaging
  'messenger': 'com.facebook.orca',
  'signal': 'org.thoughtcrime.securesms',
  'discord': 'com.discord',
  'slack': 'com.slack',
  
  // Media
  'youtube': 'com.google.android.youtube',
  'spotify': 'com.spotify.music',
  'netflix': 'com.netflix.mediaclient',
  'amazon prime': 'com.amazon.avod.thirdpartyclient',
  'prime video': 'com.amazon.avod.thirdpartyclient',
  'hotstar': 'in.startv.hotstar',
  'disney': 'com.disney.disneyplus',
  
  // Utilities
  'chrome': 'com.android.chrome',
  'gmail': 'com.google.android.gm',
  'maps': 'com.google.android.apps.maps',
  'google maps': 'com.google.android.apps.maps',
  'camera': 'com.android.camera',
  'gallery': 'com.google.android.apps.photos',
  'photos': 'com.google.android.apps.photos',
  'calendar': 'com.google.android.calendar',
  'clock': 'com.google.android.deskclock',
  'calculator': 'com.google.android.calculator',
  'settings': 'com.android.settings',
  
  // Shopping
  'amazon': 'in.amazon.mShop.android.shopping',
  'flipkart': 'com.flipkart.android',
  'myntra': 'com.myntra.android',
  
  // Food
  'zomato': 'com.application.zomato',
  'swiggy': 'in.swiggy.android',
  'uber eats': 'com.ubercab.eats',
  
  // Transport
  'uber': 'com.ubercab',
  'ola': 'com.olacabs.customer',
  
  // Others
  'play store': 'com.android.vending',
  'google': 'com.google.android.googlequicksearchbox',
};

/**
 * Banking/Payment apps to exclude from voice control (safety)
 */
export const EXCLUDED_PAYMENT_APPS = [
  'com.phonepe.app',
  'com.google.android.apps.nbu.paisa.user',
  'in.org.npci.upiapp',
  'net.one97.paytm',
  'com.paytm',
  'com.paypal.android.p2pmobile',
  'com.coinbase.android',
  'com.robinhood.android',
  'in.amazon.mShop.android.shopping', // Has payment
];

/**
 * Check if app should be excluded from voice control
 */
export function isAppExcluded(packageName: string): boolean {
  // Check exact match
  if (EXCLUDED_PAYMENT_APPS.includes(packageName)) {
    return true;
  }
  
  // Check if package name contains banking/payment keywords
  const lowerPackage = packageName.toLowerCase();
  const paymentKeywords = ['bank', 'wallet', 'pay', 'finance', 'invest', 'crypto', 'trading'];
  
  return paymentKeywords.some(keyword => lowerPackage.includes(keyword));
}

/**
 * Detect if text is a reminder command
 */
export function isReminderCommand(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('remind') || lower.includes('reminder');
}

/**
 * Detect if text is an app opening command
 */
export function isAppOpenCommand(text: string): boolean {
  const lower = text.toLowerCase();
  return /(?:open|launch|start|run)\s+/i.test(lower);
}

/**
 * Phone call command interface
 */
export interface ParsedPhoneCall {
  phoneNumber?: string;
  contactName?: string;
}

/**
 * Parse phone call command (no AI needed)
 * Examples:
 * - "call mom"
 * - "call 1234567890"
 * - "phone john"
 * - "dial 555-1234"
 */
export function parsePhoneCallLocally(text: string): ParsedPhoneCall | null {
  const lower = text.toLowerCase();
  
  // Pattern 1: "call/phone/dial <number>"
  const numberPattern = /(?:call|phone|dial)\s+([\d\s\-\(\)\+]+)/i;
  const numberMatch = text.match(numberPattern);
  if (numberMatch) {
    const phoneNumber = numberMatch[1].replace(/[\s\-\(\)]/g, ''); // Remove formatting
    if (phoneNumber.length >= 7) { // Valid phone number
      return { phoneNumber };
    }
  }
  
  // Pattern 2: "call/phone <name>"
  const namePattern = /(?:call|phone)\s+([a-z\s]+)/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    const contactName = nameMatch[1].trim();
    // Exclude common false positives
    if (!['me', 'back', 'you', 'home', 'emergency'].includes(contactName.toLowerCase())) {
      return { contactName };
    }
  }
  
  return null;
}

/**
 * Detect if text is a phone call command
 */
export function isPhoneCallCommand(text: string): boolean {
  const lower = text.toLowerCase();
  return /(?:call|phone|dial)\s+/i.test(lower);
}
