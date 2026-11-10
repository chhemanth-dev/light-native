/**
 * Message Sender via Accessibility Service
 * Uses Android Accessibility Service to:
 * 1. Open messaging app
 * 2. Find and click on contact/chat
 * 3. Type message
 * 4. Click send button
 * 
 * Works for: WhatsApp, Instagram, Messenger, Telegram, SMS, etc.
 */

import { NativeModules, Platform } from 'react-native';

const AccessibilityAutoClickModule = Platform.OS === 'android' ? NativeModules.AccessibilityAutoClickModule : null;

export interface MessageSendRequest {
  app: 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'sms';
  recipient: string; // Name or phone number
  message: string;
}

/**
 * Send a message using accessibility service
 * This simulates user actions: open app → find chat → type → send
 */
export async function sendMessageViaAccessibility(request: MessageSendRequest): Promise<string> {
  if (!AccessibilityAutoClickModule) {
    throw new Error('Accessibility auto-click module not available');
  }
  
  console.log('[MessageSender] Sending message:', request);
  
  try {
    // Call native module to perform the automation
    const result = await AccessibilityAutoClickModule.sendMessage(
      request.app,
      request.recipient,
      request.message
    );
    
    console.log('[MessageSender] Success:', result);
    return result;
  } catch (error: any) {
    console.error('[MessageSender] Failed:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

/**
 * Check if accessibility service is enabled
 */
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (!AccessibilityAutoClickModule?.isEnabled) {
    return false;
  }
  
  try {
    return await AccessibilityAutoClickModule.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Open accessibility settings
 */
export function openAccessibilitySettings(): void {
  if (!AccessibilityAutoClickModule?.openSettings) {
    return;
  }
  
  AccessibilityAutoClickModule.openSettings();
}

/**
 * Parse "send message" command
 * Examples:
 * - "Reply to John on WhatsApp saying I'm on my way"
 * - "Tell Sarah on Instagram that I'll be late"
 * - "Send message to Mom: I'm coming home"
 */
export function parseMessageCommand(command: string): MessageSendRequest | null {
  const lowerCommand = command.toLowerCase();
  
  // Pattern 1: "reply to [name] on [app] saying [message]"
  const pattern1 = lowerCommand.match(/reply to (.+?) on (whatsapp|instagram|messenger|telegram|sms) saying (.+)/);
  if (pattern1) {
    return {
      app: pattern1[2] as any,
      recipient: pattern1[1].trim(),
      message: pattern1[3].trim(),
    };
  }
  
  // Pattern 2: "tell [name] on [app] that [message]"
  const pattern2 = lowerCommand.match(/tell (.+?) on (whatsapp|instagram|messenger|telegram|sms) that (.+)/);
  if (pattern2) {
    return {
      app: pattern2[2] as any,
      recipient: pattern2[1].trim(),
      message: pattern2[3].trim(),
    };
  }
  
  // Pattern 3: "send message to [name]: [message]" (defaults to WhatsApp)
  const pattern3 = lowerCommand.match(/send message to (.+?): (.+)/);
  if (pattern3) {
    return {
      app: 'whatsapp',
      recipient: pattern3[1].trim(),
      message: pattern3[2].trim(),
    };
  }
  
  // Pattern 4: "text [name] [message]" (defaults to SMS)
  const pattern4 = lowerCommand.match(/text (.+?) (.+)/);
  if (pattern4) {
    return {
      app: 'sms',
      recipient: pattern4[1].trim(),
      message: pattern4[2].trim(),
    };
  }
  
  return null;
}
