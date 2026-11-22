/**
 * Light screen control - JS wrapper around the native LightScreen module
 * (AccessibilityService: read screen tree, tap, scroll, type, global actions).
 */

import { NativeModules, Linking, Platform } from 'react-native';
import { LIGHT_CONFIG } from './light-config';

const Native = NativeModules.LightScreen;

function ensureNative(): any {
  if (!Native) {
    throw new Error('Light screen control is not available in this build.');
  }
  return Native;
}

export async function isServiceEnabled(): Promise<boolean> {
  return !!(await ensureNative().isServiceEnabled());
}

export async function getScreenText(): Promise<string[]> {
  const result = await ensureNative().getScreenText();
  return Array.isArray(result) ? result.map(String) : [];
}

export async function tapText(text: string): Promise<boolean> {
  return !!(await ensureNative().tapText(text));
}

export async function tapAt(x: number, y: number): Promise<boolean> {
  return !!(await ensureNative().tapAt(x, y));
}

export async function scroll(direction: 'up' | 'down'): Promise<boolean> {
  return !!(await ensureNative().scroll(direction));
}

export async function typeText(text: string): Promise<boolean> {
  return !!(await ensureNative().typeText(text));
}

export async function globalAction(
  name: 'back' | 'home' | 'recents' | 'notifications'
): Promise<boolean> {
  return !!(await ensureNative().globalAction(name));
}

// Screen access is only allowed during a session started by the user; the native service enforces this.
export async function beginScreenSession(durationMs: number = LIGHT_CONFIG.screenSessionMs): Promise<boolean> {
  return !!(await ensureNative().beginSession(durationMs));
}

export async function endScreenSession(): Promise<boolean> {
  try {
    return !!(await ensureNative().endSession());
  } catch {
    return false;
  }
}

/**
 * Android does not allow silent installs of arbitrary apps; this only opens the
 * store page, the user must tap Install.
 */
export async function openPlayStore(packageName: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Play Store is only available on Android.');
  }
  try {
    await Linking.openURL(`market://details?id=${packageName}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
  }
}
