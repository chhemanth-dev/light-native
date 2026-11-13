/**
 * Wake Word Detection - Always-on listening for "Hey Light"
 * Works even when app is closed!
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const WakeWordModule = Platform.OS === 'android' ? NativeModules.WakeWordModule : null;

let eventEmitter: NativeEventEmitter | null = null;
let partialListener: any = null;

if (WakeWordModule) {
  eventEmitter = new NativeEventEmitter(WakeWordModule);
}

export interface WakeWordConfig {
  onWakeWord?: (transcript: string) => void;
  onPartialResult?: (transcript: string) => void;
}

let currentConfig: WakeWordConfig | null = null;

/**
 * Start always-on wake word detection
 * Listens for "Hey Light" or "Hey Google" even when app is closed
 */
export async function startWakeWordDetection(config?: WakeWordConfig): Promise<void> {
  if (!WakeWordModule) {
    console.warn('[WakeWord] Not available on this platform');
    return;
  }

  try {
    console.log('[WakeWord] Starting always-on detection...');
    
    currentConfig = config || {};

    // Listen for partial results
    if (eventEmitter) {
      // Remove old listener
      if (partialListener) {
        partialListener.remove();
      }

      // Add new listener
      partialListener = eventEmitter.addListener('onSpeechPartial', (event: { transcript: string }) => {
        const transcript = event.transcript.toLowerCase();
        console.log('[WakeWord] Heard:', transcript);

        // Check for wake words
        if (
          transcript.includes('hey light') ||
          transcript.includes('ok light') ||
          transcript.includes('hey google') ||
          transcript.includes('ok google')
        ) {
          console.log('[WakeWord] ✓ Wake word detected!');
          if (currentConfig?.onWakeWord) {
            currentConfig.onWakeWord(transcript);
          }
        }

        // Forward partial results
        if (currentConfig?.onPartialResult) {
          currentConfig.onPartialResult(transcript);
        }
      });
    }

    // Start the wake word service
    await WakeWordModule.start();
    console.log('[WakeWord] ✓ Always-on detection started');
  } catch (error) {
    console.error('[WakeWord] Failed to start:', error);
    throw error;
  }
}

/**
 * Stop wake word detection
 */
export async function stopWakeWordDetection(): Promise<void> {
  if (!WakeWordModule) {
    return;
  }

  try {
    console.log('[WakeWord] Stopping detection...');
    
    // Remove listener
    if (partialListener) {
      partialListener.remove();
      partialListener = null;
    }

    currentConfig = null;

    // Stop the service
    await WakeWordModule.stop();
    console.log('[WakeWord] ✓ Detection stopped');
  } catch (error) {
    console.error('[WakeWord] Failed to stop:', error);
  }
}

/**
 * Check if wake word detection is supported
 */
export function isWakeWordSupported(): boolean {
  return Platform.OS === 'android' && WakeWordModule !== null;
}
