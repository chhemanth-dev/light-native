/**
 * Accessibility Module - Hands-free phone control
 * Make calls, send SMS, open apps, etc.
 */
import { NativeModules, Platform, PermissionsAndroid } from "react-native";

const AccessibilityModule = Platform.OS === "android" ? NativeModules.AccessibilityModule : null;

/**
 * Request phone call permission
 */
export async function requestCallPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      {
        title: 'Phone Call Permission',
        message: 'Light needs permission to make phone calls on your behalf.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Accessibility] Call permission error:', err);
    return false;
  }
}

/**
 * Make a phone call
 */
export async function makePhoneCall(phoneNumber: string): Promise<string> {
  if (!AccessibilityModule) {
    throw new Error("Accessibility module not available");
  }

  console.log('[Accessibility] Making call to:', phoneNumber);
  
  try {
    const result = await AccessibilityModule.makePhoneCall(phoneNumber);
    console.log('[Accessibility] Call result:', result);
    return result;
  } catch (error) {
    console.error('[Accessibility] Call failed:', error);
    throw error;
  }
}

/**
 * Open an app by package name
 */
export async function openApp(packageName: string): Promise<string> {
  if (!AccessibilityModule) {
    throw new Error("Accessibility module not available");
  }

  console.log('[Accessibility] Opening app:', packageName);
  
  try {
    const result = await AccessibilityModule.openApp(packageName);
    console.log('[Accessibility] Open result:', result);
    return result;
  } catch (error) {
    console.error('[Accessibility] Open app failed:', error);
    throw error;
  }
}

/**
 * Check if an app is installed
 */
export async function isAppInstalled(packageName: string): Promise<boolean> {
  if (!AccessibilityModule?.isAppInstalled) {
    console.warn('[Accessibility] isAppInstalled not available');
    return false;
  }

  try {
    const installed = await AccessibilityModule.isAppInstalled(packageName);
    console.log('[Accessibility] App installed check:', packageName, installed);
    return installed;
  } catch (error) {
    console.error('[Accessibility] Install check failed:', error);
    return false;
  }
}

/**
 * Get list of installed popular apps
 */
export async function getInstalledApps(): Promise<Array<{packageName: string, appName: string}>> {
  if (!AccessibilityModule?.getInstalledApps) {
    console.warn('[Accessibility] getInstalledApps not available');
    return [];
  }

  try {
    const apps = await AccessibilityModule.getInstalledApps();
    console.log('[Accessibility] Installed apps:', apps.length);
    return apps;
  } catch (error) {
    console.error('[Accessibility] Get installed apps failed:', error);
    return [];
  }
}

/**
 * Send SMS
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<string> {
  if (!AccessibilityModule) {
    throw new Error("Accessibility module not available");
  }

  console.log('[Accessibility] Sending SMS to:', phoneNumber);
  
  try {
    const result = await AccessibilityModule.sendSMS(phoneNumber, message);
    console.log('[Accessibility] SMS result:', result);
    return result;
  } catch (error) {
    console.error('[Accessibility] SMS failed:', error);
    throw error;
  }
}

/**
 * Check if device has internet connection
 */
export async function checkInternetConnection(): Promise<boolean> {
  if (!AccessibilityModule) {
    console.warn('[Accessibility] Module not available, assuming online');
    return true;
  }

  try {
    const isConnected = await AccessibilityModule.checkInternetConnection();
    console.log('[Accessibility] Internet connected:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('[Accessibility] Connectivity check failed:', error);
    return false;
  }
}

/**
 * Common app package names
 */
export const APP_PACKAGES = {
  whatsapp: 'com.whatsapp',
  instagram: 'com.instagram.android',
  gmail: 'com.google.android.gm',
  maps: 'com.google.android.apps.maps',
  chrome: 'com.android.chrome',
  youtube: 'com.google.android.youtube',
  camera: 'com.android.camera2',
  settings: 'com.android.settings',
};

/**
 * Parse phone call command
 * "Call John" or "Call 1234567890"
 */
export function parseCallCommand(command: string): string | null {
  const lowerCommand = command.toLowerCase();
  
  // Match "call <number>"
  const numberMatch = lowerCommand.match(/call\s+([\d\s\-\(\)]+)/);
  if (numberMatch) {
    return numberMatch[1].replace(/\s/g, ''); // Remove spaces
  }
  
  return null;
}

/**
 * Parse app open command
 * "Open WhatsApp" or "Launch Instagram"
 */
export function parseOpenAppCommand(command: string): string | null {
  const lowerCommand = command.toLowerCase();
  
  // Check for known apps
  if (lowerCommand.includes('whatsapp')) return APP_PACKAGES.whatsapp;
  if (lowerCommand.includes('instagram')) return APP_PACKAGES.instagram;
  if (lowerCommand.includes('gmail')) return APP_PACKAGES.gmail;
  if (lowerCommand.includes('maps')) return APP_PACKAGES.maps;
  if (lowerCommand.includes('chrome')) return APP_PACKAGES.chrome;
  if (lowerCommand.includes('youtube')) return APP_PACKAGES.youtube;
  if (lowerCommand.includes('camera')) return APP_PACKAGES.camera;
  if (lowerCommand.includes('settings')) return APP_PACKAGES.settings;
  
  return null;
}
