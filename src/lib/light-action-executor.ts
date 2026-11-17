/**
 * Light Action Executor
 * This module ACTUALLY EXECUTES the tasks Light knows about
 * Connects Light AI's knowledge to real Android capabilities
 */

import { makePhoneCall, openApp, isAppInstalled } from './accessibility';
import { scheduleReminder, parseReminderFromSpeech } from './reminders';
import { lightBrain } from './light-brain';
import { speak } from './voice';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

export interface ExecutionResult {
  success: boolean;
  message: string;
  error?: string;
}

export class LightActionExecutor {
  /**
   * Main execution router - determines what action to take
   */
  async execute(intent: string, userInput: string, params: any = {}): Promise<ExecutionResult> {
    console.log('[Executor] Executing:', intent, 'with input:', userInput);

    try {
      switch (intent) {
        case 'make_call':
        case 'phone_call':
        case 'call_contact':
          return await this.executePhoneCall(userInput, params);

        case 'send_message':
        case 'send_sms':
        case 'text_message':
          return await this.executeSendMessage(userInput, params);

        case 'open_app':
        case 'launch_app':
        case 'start_app':
          return await this.executeOpenApp(userInput, params);

        case 'set_reminder':
        case 'create_reminder':
        case 'remind_me':
          return await this.executeSetReminder(userInput, params);

        case 'web_search':
        case 'search_web':
        case 'google_search':
          return await this.executeWebSearch(userInput, params);

        case 'open_url':
        case 'browse':
        case 'open_website':
          return await this.executeOpenURL(userInput, params);

        case 'enable_wifi':
        case 'disable_wifi':
        case 'enable_bluetooth':
        case 'disable_bluetooth':
          return await this.executeSystemSetting(intent, params);

        case 'take_photo':
        case 'open_camera':
          return await this.executeOpenCamera();

        case 'play_music':
        case 'open_spotify':
        case 'open_youtube':
          return await this.executeMediaApp(userInput);

        case 'read_messages':
        case 'check_messages':
          return await this.executeReadMessages();

        case 'get_time':
        case 'what_time':
          return await this.executeGetTime();

        case 'get_date':
        case 'what_date':
          return await this.executeGetDate();

        case 'get_weather':
        case 'check_weather':
          return await this.executeGetWeather(userInput);

        case 'calculate':
        case 'math':
          return await this.executeCalculation(userInput);

        default:
          // Try to find instructions from Light Brain
          return await this.executeFromKnowledge(intent, userInput);
      }
    } catch (error) {
      console.error('[Executor] Error:', error);
      return {
        success: false,
        message: 'Failed to execute task',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute phone call
   */
  private async executePhoneCall(input: string, params: any): Promise<ExecutionResult> {
    try {
      console.log('[Executor] Making phone call...');

      // Extract phone number from input or params
      const phoneNumber = params.phoneNumber || this.extractPhoneNumber(input);

      if (!phoneNumber) {
        return {
          success: false,
          message: "I couldn't find a phone number to call. Please specify the number.",
        };
      }

      // Request permission if needed
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return {
            success: false,
            message: 'Phone call permission denied',
          };
        }
      }

      await makePhoneCall(phoneNumber);

      return {
        success: true,
        message: `Calling ${phoneNumber}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to make call',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute send message (opens WhatsApp/Messages with text)
   */
  private async executeSendMessage(input: string, params: any): Promise<ExecutionResult> {
    try {
      console.log('[Executor] Sending message...');

      const message = params.message || this.extractMessage(input);
      const contact = params.contact || this.extractContact(input);

      if (!message) {
        return {
          success: false,
          message: "I couldn't extract the message content",
        };
      }

      // Determine which messaging app to use
      const app = this.determineMessagingApp(input);

      if (app === 'whatsapp') {
        // Open WhatsApp with message
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        await Linking.openURL(url);
      } else {
        // Open default messaging app
        const url = `sms:?body=${encodeURIComponent(message)}`;
        await Linking.openURL(url);
      }

      return {
        success: true,
        message: `Opening ${app} to send message`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to open messaging app',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute open app
   */
  private async executeOpenApp(input: string, params: any): Promise<ExecutionResult> {
    try {
      console.log('[Executor] Opening app...');

      const appName = params.appName || this.extractAppName(input);

      if (!appName) {
        return {
          success: false,
          message: "I couldn't determine which app to open",
        };
      }

      // Map app name to package
      const packageName = this.getPackageName(appName);

      if (!packageName) {
        return {
          success: false,
          message: `I don't know the package name for ${appName}`,
        };
      }

      // Check if installed
      const installed = await isAppInstalled(packageName);

      if (!installed) {
        return {
          success: false,
          message: `${appName} is not installed on your device`,
        };
      }

      await openApp(packageName);

      return {
        success: true,
        message: `Opening ${appName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to open app',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute set reminder
   */
  private async executeSetReminder(input: string, params: any): Promise<ExecutionResult> {
    try {
      console.log('[Executor] Setting reminder...');

      const parsed = parseReminderFromSpeech(input);

      if (!parsed) {
        return {
          success: false,
          message: "I couldn't understand the reminder time. Try saying 'remind me in 30 minutes to...' or 'remind me at 3pm to...'",
        };
      }

      await scheduleReminder(parsed);

      return {
        success: true,
        message: `Reminder set: ${parsed.title}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to set reminder',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute web search
   */
  private async executeWebSearch(input: string, params: any): Promise<ExecutionResult> {
    try {
      console.log('[Executor] Web search...');

      const query = params.query || this.extractSearchQuery(input);

      if (!query) {
        return {
          success: false,
          message: "I couldn't determine what to search for",
        };
      }

      // Search using Light Brain
      const results = await lightBrain.search(query);

      if (results && results.length > 0) {
        const topResult = results[0];
        const response = `I found: ${topResult.title}. ${topResult.snippet}`;

        // Speak the result
        await speak(response);

        return {
          success: true,
          message: response,
        };
      }

      return {
        success: false,
        message: `No results found for "${query}"`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Web search failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute open URL
   */
  private async executeOpenURL(input: string, params: any): Promise<ExecutionResult> {
    try {
      const url = params.url || this.extractURL(input);

      if (!url) {
        return {
          success: false,
          message: "I couldn't find a URL to open",
        };
      }

      await Linking.openURL(url);

      return {
        success: true,
        message: `Opening ${url}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to open URL',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute system setting change
   */
  private async executeSystemSetting(intent: string, params: any): Promise<ExecutionResult> {
    try {
      // Open relevant settings page
      if (intent.includes('wifi')) {
        await Linking.sendIntent('android.settings.WIFI_SETTINGS');
        return { success: true, message: 'Opening WiFi settings' };
      } else if (intent.includes('bluetooth')) {
        await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
        return { success: true, message: 'Opening Bluetooth settings' };
      }

      return {
        success: false,
        message: 'Unknown system setting',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to change system setting',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Open camera
   */
  private async executeOpenCamera(): Promise<ExecutionResult> {
    try {
      await openApp('com.android.camera');
      return { success: true, message: 'Opening camera' };
    } catch (error) {
      // Try alternative
      try {
        await Linking.sendIntent('android.media.action.IMAGE_CAPTURE');
        return { success: true, message: 'Opening camera' };
      } catch (e) {
        return {
          success: false,
          message: 'Failed to open camera',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  /**
   * Open media app
   */
  private async executeMediaApp(input: string): Promise<ExecutionResult> {
    try {
      if (input.toLowerCase().includes('spotify')) {
        await openApp('com.spotify.music');
        return { success: true, message: 'Opening Spotify' };
      } else if (input.toLowerCase().includes('youtube')) {
        await openApp('com.google.android.youtube');
        return { success: true, message: 'Opening YouTube' };
      } else {
        // Default music player
        await Linking.sendIntent('android.intent.action.MUSIC_PLAYER');
        return { success: true, message: 'Opening music player' };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to open media app',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Read messages
   */
  private async executeReadMessages(): Promise<ExecutionResult> {
    try {
      const { getUnreadMessages } = await import('./db');
      const unread = await getUnreadMessages();

      if (unread.length === 0) {
        await speak('You have no unread messages, sir.');
        return { success: true, message: 'No unread messages' };
      }

      const message = `You have ${unread.length} unread message${unread.length > 1 ? 's' : ''}, sir.`;
      await speak(message);

      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to read messages',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get current time
   */
  private async executeGetTime(): Promise<ExecutionResult> {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const message = `The time is ${timeStr}, sir.`;
    await speak(message);
    return { success: true, message };
  }

  /**
   * Get current date
   */
  private async executeGetDate(): Promise<ExecutionResult> {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const message = `Today is ${dateStr}, sir.`;
    await speak(message);
    return { success: true, message };
  }

  /**
   * Get weather
   */
  private async executeGetWeather(input: string): Promise<ExecutionResult> {
    try {
      // Search web for weather
      const location = this.extractLocation(input) || 'current location';
      const results = await lightBrain.search(`weather in ${location}`);

      if (results && results.length > 0) {
        const weatherInfo = results[0].snippet;
        await speak(weatherInfo);
        return { success: true, message: weatherInfo };
      }

      return {
        success: false,
        message: 'Could not get weather information',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get weather',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute calculation
   */
  private async executeCalculation(input: string): Promise<ExecutionResult> {
    try {
      const expression = this.extractMathExpression(input);
      if (!expression) {
        return { success: false, message: 'Could not parse calculation' };
      }

      // Use safe eval (in production, use a math library)
      const result = this.safeEval(expression);
      const message = `The answer is ${result}, sir.`;
      await speak(message);
      return { success: true, message };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to calculate',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute from Light Brain knowledge
   */
  private async executeFromKnowledge(intent: string, input: string): Promise<ExecutionResult> {
    console.log('[Executor] Trying to execute from knowledge...');

    const knowledge = await lightBrain.recall(input);

    if (knowledge.length > 0) {
      const info = knowledge[0];
      await speak(info.answer);
      return { success: true, message: info.answer };
    }

    return {
      success: false,
      message: `I don't know how to ${intent} yet. Would you like to teach me?`,
    };
  }

  // ============================================
  // HELPER METHODS - Extract information from text
  // ============================================

  private extractPhoneNumber(input: string): string | null {
    const match = input.match(/\b\d{10,}\b/);
    return match ? match[0] : null;
  }

  private extractMessage(input: string): string | null {
    const match = input.match(/(?:message|text|send)\s+["']?(.+?)["']?\s*(?:to|$)/i);
    return match ? match[1] : null;
  }

  private extractContact(input: string): string | null {
    const match = input.match(/(?:to|call)\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private extractAppName(input: string): string | null {
    const match = input.match(/(?:open|launch|start)\s+(\w+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  private extractSearchQuery(input: string): string | null {
    const match = input.match(/(?:search|google|find)\s+(?:for\s+)?(.+)/i);
    return match ? match[1] : input;
  }

  private extractURL(input: string): string | null {
    const match = input.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  private extractLocation(input: string): string | null {
    const match = input.match(/(?:in|for)\s+([A-Za-z\s]+)/i);
    return match ? match[1].trim() : null;
  }

  private extractMathExpression(input: string): string | null {
    // Extract numbers and operators
    const match = input.match(/[\d+\-*/().]+/);
    return match ? match[0] : null;
  }

  private determineMessagingApp(input: string): string {
    if (input.toLowerCase().includes('whatsapp')) return 'whatsapp';
    if (input.toLowerCase().includes('telegram')) return 'telegram';
    return 'sms';
  }

  private getPackageName(appName: string): string | null {
    const packages: Record<string, string> = {
      whatsapp: 'com.whatsapp',
      instagram: 'com.instagram.android',
      facebook: 'com.facebook.katana',
      messenger: 'com.facebook.orca',
      twitter: 'com.twitter.android',
      youtube: 'com.google.android.youtube',
      spotify: 'com.spotify.music',
      gmail: 'com.google.android.gm',
      chrome: 'com.android.chrome',
      maps: 'com.google.android.apps.maps',
      camera: 'com.android.camera',
      gallery: 'com.google.android.apps.photos',
      settings: 'com.android.settings',
      calculator: 'com.google.android.calculator',
      calendar: 'com.google.android.calendar',
      contacts: 'com.google.android.contacts',
      phone: 'com.google.android.dialer',
      messages: 'com.google.android.apps.messaging',
    };

    return packages[appName.toLowerCase()] || null;
  }

  private safeEval(expression: string): number {
    // Remove any non-math characters
    const safe = expression.replace(/[^0-9+\-*/().]/g, '');
    try {
      return eval(safe);
    } catch {
      throw new Error('Invalid expression');
    }
  }
}

export const actionExecutor = new LightActionExecutor();
