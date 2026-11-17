/**
 * Floating Assistant Manager
 * Manages the floating overlay that stays on top of ALL apps
 * No more switching back to Light app!
 */

import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform, DeviceEventEmitter } from 'react-native';
import { assistant } from './assistant';

const { FloatingAssistantModule } = NativeModules;

class FloatingAssistantManager {
  private active = false;
  private listener: any = null;

  /**
   * Request overlay permission and start floating assistant
   */
  async start(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('[FloatingAssistant] Only available on Android');
      return false;
    }

    // Request overlay permission
    const hasPermission = await this.requestOverlayPermission();
    if (!hasPermission) {
      console.log('[FloatingAssistant] Overlay permission denied');
      return false;
    }

    // Start the floating service
    try {
      await FloatingAssistantModule.startFloating();
      this.active = true;
      console.log('[FloatingAssistant] ✅ Started floating overlay');

      // Listen for tap events
      this.listener = DeviceEventEmitter.addListener('FLOATING_ORB_TAPPED', async () => {
        console.log('[FloatingAssistant] 🎤 Floating orb tapped!');
        await this.onOrbTapped();
      });

      return true;
    } catch (error) {
      console.error('[FloatingAssistant] Failed to start:', error);
      return false;
    }
  }

  /**
   * Stop floating assistant
   */
  async stop(): Promise<void> {
    if (!this.active) return;

    try {
      await FloatingAssistantModule.stopFloating();
      this.active = false;
      
      if (this.listener) {
        this.listener.remove();
        this.listener = null;
      }
      
      console.log('[FloatingAssistant] ✅ Stopped floating overlay');
    } catch (error) {
      console.error('[FloatingAssistant] Failed to stop:', error);
    }
  }

  /**
   * Show/hide the floating overlay
   */
  async setVisible(visible: boolean): Promise<void> {
    if (!this.active) return;

    try {
      if (visible) {
        await FloatingAssistantModule.showFloating();
      } else {
        await FloatingAssistantModule.hideFloating();
      }
    } catch (error) {
      console.error('[FloatingAssistant] Failed to set visibility:', error);
    }
  }

  /**
   * Update status text on floating overlay
   */
  async updateStatus(status: string): Promise<void> {
    if (!this.active) return;

    try {
      await FloatingAssistantModule.updateStatus(status);
    } catch (error) {
      console.error('[FloatingAssistant] Failed to update status:', error);
    }
  }

  /**
   * Handle orb tap - start listening and execute commands
   */
  private async onOrbTapped(): Promise<void> {
    try {
      await this.updateStatus('Listening...');
      
      console.log('[FloatingAssistant] 🎤 Orb tapped - starting voice recognition');
      
      // Import speech recognition
      const { startListening, stopListening } = await import('./speech');
      
      // Start listening for voice input
      const transcript = await new Promise<string>((resolve, reject) => {
        let timeout: NodeJS.Timeout;
        
        const cleanup = startListening({
          onResult: (text) => {
            console.log('[FloatingAssistant] Got transcript:', text);
            clearTimeout(timeout);
            stopListening();
            resolve(text);
          },
          onError: (error) => {
            console.error('[FloatingAssistant] Speech error:', error);
            clearTimeout(timeout);
            reject(error);
          },
          onTimeout: () => {
            console.log('[FloatingAssistant] Speech timeout');
            clearTimeout(timeout);
            reject(new Error('Timeout'));
          }
        });
        
        // 10 second timeout
        timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Timeout'));
        }, 10000);
      });
      
      if (transcript && transcript.trim()) {
        console.log('[FloatingAssistant] Processing command:', transcript);
        await this.updateStatus('Processing...');
        
        // Execute the command through the assistant
        await assistant.handleInput(transcript);
        
        await this.updateStatus('Done!');
        setTimeout(() => this.updateStatus('Tap to speak'), 2000);
      } else {
        await this.updateStatus('No speech detected');
        setTimeout(() => this.updateStatus('Tap to speak'), 2000);
      }
      
    } catch (error) {
      console.error('[FloatingAssistant] Error handling tap:', error);
      await this.updateStatus('Error');
      setTimeout(() => this.updateStatus('Tap to speak'), 2000);
    }
  }

  /**
   * Request overlay permission (Android 6+)
   */
  private async requestOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      // Check if already granted
      const hasPermission = await FloatingAssistantModule.checkOverlayPermission();
      if (hasPermission) return true;

      // Request permission (opens settings)
      await FloatingAssistantModule.requestOverlayPermission();
      
      // Check again after user comes back
      return await FloatingAssistantModule.checkOverlayPermission();
    } catch (error) {
      console.error('[FloatingAssistant] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if floating assistant is active
   */
  isActive(): boolean {
    return this.active;
  }
}

export const floatingAssistant = new FloatingAssistantManager();
