/**
 * Smart Action Executor - Makes Light actually DO things
 * Combines AccessibilityModule + Smart logic to execute complex tasks
 */
import { NativeModules, Platform } from 'react-native';
import { LIGHT_CONFIG } from './light-config';
import * as Contacts from './contacts-bridge';

const AccessibilityModule = Platform.OS === 'android' ? NativeModules.AccessibilityModule : null;

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Open an app by name or package
 */
export async function openApp(appNameOrPackage: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available', error: 'MODULE_MISSING' };
  }

  try {
    // Check if it's a known app name
    const packageName = getPackageNameFromAppName(appNameOrPackage) || appNameOrPackage;
    
    console.log('[SmartAction] Opening app:', packageName);
    const result = await AccessibilityModule.openApp(packageName);
    
    return {
      success: true,
      message: `Opened ${appNameOrPackage}`,
    };
  } catch (error: any) {
    console.error('[SmartAction] Failed to open app:', error);
    
    if (error.code === 'APP_NOT_FOUND') {
      return {
        success: false,
        message: `I couldn't find ${appNameOrPackage} on your phone`,
        error: error.code,
      };
    }
    
    return {
      success: false,
      message: `Failed to open ${appNameOrPackage}`,
      error: error.message,
    };
  }
}

/**
 * Open a URL in browser
 */
export async function openURL(url: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    console.log('[SmartAction] Opening URL:', url);
    await AccessibilityModule.openURL(url);
    
    return {
      success: true,
      message: `Opened ${url}`,
    };
  } catch (error: any) {
    console.error('[SmartAction] Failed to open URL:', error);
    return {
      success: false,
      message: `Failed to open ${url}`,
      error: error.message,
    };
  }
}

/**
 * Search on Google
 */
export async function googleSearch(query: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    console.log('[SmartAction] Searching Google for:', query);
    await AccessibilityModule.googleSearch(query);
    
    return {
      success: true,
      message: `Searching for ${query}`,
    };
  } catch (error: any) {
    console.error('[SmartAction] Search failed:', error);
    return {
      success: false,
      message: `Failed to search for ${query}`,
      error: error.message,
    };
  }
}

/**
 * Play video on YouTube
 * Opens YouTube and searches for the video
 */
export async function playYouTubeVideo(query: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    console.log('[SmartAction] Playing on YouTube:', query);
    
    // Open YouTube search URL
    const searchUrl = LIGHT_CONFIG.search.youtube.replace('{query}', encodeURIComponent(query));
    await AccessibilityModule.openURL(searchUrl);
    
    return {
      success: true,
      message: `Searching ${query} on YouTube`,
    };
  } catch (error: any) {
    console.error('[SmartAction] YouTube failed:', error);
    return {
      success: false,
      message: `Failed to play ${query} on YouTube`,
      error: error.message,
    };
  }
}

/**
 * Play song on Spotify
 */
export async function playSpotifySong(query: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    console.log('[SmartAction] Playing on Spotify:', query);
    
    // Open Spotify search URL
    const searchUrl = LIGHT_CONFIG.search.spotify.replace('{query}', encodeURIComponent(query));
    await AccessibilityModule.openURL(searchUrl);
    
    return {
      success: true,
      message: `Searching ${query} on Spotify`,
    };
  } catch (error: any) {
    console.error('[SmartAction] Spotify failed:', error);
    return {
      success: false,
      message: `Failed to play ${query} on Spotify`,
      error: error.message,
    };
  }
}

/**
 * Make a phone call (supports contact names and numbers)
 */
export async function makePhoneCall(phoneNumberOrName: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    let phoneNumber = phoneNumberOrName;
    let contactName = '';
    
    // Check if it's a name (not a number)
    if (!/^\+?[\d\s()-]+$/.test(phoneNumberOrName)) {
      // It's a name - look up in contacts
      console.log('[SmartAction] Looking up contact:', phoneNumberOrName);
      
      const contact = await Contacts.smartContactLookup(phoneNumberOrName);
      if (!contact) {
        return {
          success: false,
          message: `I couldn't find "${phoneNumberOrName}" in your contacts`,
          error: 'CONTACT_NOT_FOUND',
        };
      }
      
      phoneNumber = contact.phoneNumber;
      contactName = contact.name;
      console.log('[SmartAction] Found contact:', contactName, phoneNumber);
    }
    
    console.log('[SmartAction] Calling:', phoneNumber);
    await AccessibilityModule.makePhoneCall(phoneNumber);
    
    const displayName = contactName || phoneNumber;
    return {
      success: true,
      message: `Calling ${displayName}`,
    };
  } catch (error: any) {
    console.error('[SmartAction] Call failed:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      return {
        success: false,
        message: `I need phone permission to make calls`,
        error: error.code,
      };
    }
    
    return {
      success: false,
      message: `Failed to call ${phoneNumberOrName}`,
      error: error.message,
    };
  }
}

/**
 * Send SMS
 */
export async function sendSMS(phoneNumber?: string, message?: string): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    console.log('[SmartAction] Opening SMS');
    await AccessibilityModule.sendSMS(phoneNumber, message);
    
    return {
      success: true,
      message: phoneNumber ? `Opened SMS to ${phoneNumber}` : 'Opened SMS',
    };
  } catch (error: any) {
    console.error('[SmartAction] SMS failed:', error);
    return {
      success: false,
      message: 'Failed to open SMS',
      error: error.message,
    };
  }
}

/**
 * Check if app is installed
 */
export async function isAppInstalled(packageName: string): Promise<boolean> {
  if (!AccessibilityModule) return false;

  try {
    return await AccessibilityModule.isAppInstalled(packageName);
  } catch (error) {
    console.error('[SmartAction] Failed to check app:', error);
    return false;
  }
}

/**
 * Get list of installed apps
 */
export async function getInstalledApps(): Promise<Array<{packageName: string, appName: string}>> {
  if (!AccessibilityModule) return [];

  try {
    return await AccessibilityModule.getInstalledApps();
  } catch (error) {
    console.error('[SmartAction] Failed to get apps:', error);
    return [];
  }
}

/**
 * Request accessibility permission
 */
export async function requestAccessibilityPermission(): Promise<ActionResult> {
  if (!AccessibilityModule) {
    return { success: false, message: 'Accessibility module not available' };
  }

  try {
    await AccessibilityModule.requestAccessibilityPermission();
    return {
      success: true,
      message: 'Please enable Light in accessibility settings',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to open settings',
      error: error.message,
    };
  }
}

/**
 * Check if accessibility is enabled
 */
export async function isAccessibilityEnabled(): Promise<boolean> {
  if (!AccessibilityModule) return false;

  try {
    return await AccessibilityModule.isAccessibilityEnabled();
  } catch (error) {
    console.error('[SmartAction] Failed to check accessibility:', error);
    return false;
  }
}

/**
 * Helper: Map app names to package names
 */
function getPackageNameFromAppName(appName: string): string | null {
  const lower = appName.toLowerCase();
  
  const appMap: Record<string, string> = {
    'youtube': 'com.google.android.youtube',
    'spotify': 'com.spotify.music',
    'whatsapp': 'com.whatsapp',
    'instagram': 'com.instagram.android',
    'facebook': 'com.facebook.katana',
    'messenger': 'com.facebook.orca',
    'twitter': 'com.twitter.android',
    'gmail': 'com.google.android.gm',
    'maps': 'com.google.android.apps.maps',
    'chrome': 'com.android.chrome',
    'photos': 'com.google.android.apps.photos',
    'amazon': 'com.amazon.mShop.android.shopping',
    'netflix': 'com.netflix.mediaclient',
    'camera': 'com.android.camera2',
    'gallery': 'com.google.android.apps.photos',
    'settings': 'com.android.settings',
    'phone': 'com.android.dialer',
    'contacts': 'com.android.contacts',
    'messages': 'com.google.android.apps.messaging',
    'calculator': 'com.google.android.calculator',
    'clock': 'com.google.android.deskclock',
  };
  
  return appMap[lower] || null;
}

/**
 * Execute a smart action based on intent
 */
export async function executeSmartAction(intent: string, params: any): Promise<ActionResult> {
  console.log('[SmartAction] Executing:', intent, params);
  
  switch (intent) {
    case 'open_app':
      return openApp(params.app || params.name);
      
    case 'open_url':
      return openURL(params.url);
      
    case 'search':
    case 'google_search':
      return googleSearch(params.query);
      
    case 'play_youtube':
    case 'youtube_video':
      return playYouTubeVideo(params.query);
      
    case 'play_spotify':
    case 'spotify_song':
      return playSpotifySong(params.query);
      
    case 'make_call':
    case 'phone_call':
      return makePhoneCall(params.phoneNumber || params.number);
      
    case 'send_sms':
    case 'send_message':
      return sendSMS(params.phoneNumber, params.message);
      
    default:
      return {
        success: false,
        message: `Unknown action: ${intent}`,
        error: 'UNKNOWN_ACTION',
      };
  }
}
