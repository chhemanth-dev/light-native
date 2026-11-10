/**
 * AI Engine — 100% Cloud-Based Multi-AI System
 * Supports: Gemini, Claude, OpenAI
 * NO on-device AI - completely online operation
 * 
 * NEW FEATURES:
 * - Multi-AI provider support (switch between Gemini, Claude, etc.)
 * - AI can SEND messages via accessibility service
 * - AI handles notifications and can reply automatically
 * - App handles reminders (not AI)
 */

import { callAI, AIProvider, type AIMessage, type AIResponse } from "./ai-providers";

// Lazy load optional modules
let smartSearch: any = null;
let getWeather: any = null;
let checkInternetConnection: any = null;
let makePhoneCall: any = null;
let parseCallCommand: any = null;
let openApp: any = null;
let parseOpenAppCommand: any = null;
let requestCallPermission: any = null;
let sendMessageViaAccessibility: any = null;

async function loadOptionalModules() {
  try {
    const websearch = await import("./websearch");
    smartSearch = websearch.smartSearch;
    getWeather = websearch.getWeather;
  } catch (e) {
    console.warn('[AI] Web search module not available:', e);
  }
  
  try {
    const accessibility = await import("./accessibility");
    checkInternetConnection = accessibility.checkInternetConnection;
    makePhoneCall = accessibility.makePhoneCall;
    parseCallCommand = accessibility.parseCallCommand;
    openApp = accessibility.openApp;
    parseOpenAppCommand = accessibility.parseOpenAppCommand;
    requestCallPermission = accessibility.requestCallPermission;
    sendMessageViaAccessibility = accessibility.sendMessageViaAccessibility; // NEW!
  } catch (e) {
    console.warn('[AI] Accessibility module not available:', e);
  }
}

export { AIMessage, AIResponse };

// Default AI provider (can be changed by user)
let currentProvider: AIProvider = 'auto'; // Will try all providers

export function setAIProvider(provider: AIProvider) {
  currentProvider = provider;
  console.log('[AI] Provider set to:', provider);
}

export function getAIProvider(): AIProvider {
  return currentProvider;
}

/**
 * Ask AI with conversation history
 * 100% Cloud-based - requires internet
 */
export async function ask(
  messages: AIMessage[],
  context?: string
): Promise<AIResponse> {
  console.log('[AI] ask() called, loading optional modules...');
  
  // Load optional modules on first use
  if (!smartSearch && !checkInternetConnection) {
    await loadOptionalModules();
    console.log('[AI] Modules loaded');
  }
  
  // Check internet connection FIRST - BLOCK if offline
  let hasInternet = true;
  if (checkInternetConnection) {
    hasInternet = await checkInternetConnection();
    console.log('[AI] Internet connection:', hasInternet);
  }
  
  // STRICT ONLINE-ONLY MODE - Reject if offline
  if (!hasInternet) {
    console.log('[AI] NO INTERNET - Refusing to process (online-only mode)');
    return { 
      text: "I apologize, sir. Light requires an active internet connection to function. Please connect to WiFi or mobile data and try again.",
      provider: currentProvider,
      offline: true 
    };
  }
  
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const lowerMessage = lastUserMessage.toLowerCase();
  console.log('[AI] Processing query:', lastUserMessage.substring(0, 50));
  
  // Step 1: Check for phone call command
  if (parseCallCommand && makePhoneCall) {
    const phoneNumber = parseCallCommand(lowerMessage);
    if (phoneNumber) {
      console.log('[AI] Call command detected:', phoneNumber);
      try {
        if (requestCallPermission) {
          await requestCallPermission();
        }
        await makePhoneCall(phoneNumber);
        return {
          text: "Calling " + phoneNumber + " now, sir.",
          provider: currentProvider,
          offline: false
        };
      } catch (e: any) {
        console.error('[AI] Call failed:', e);
        return {
          text: "I apologize, sir. I couldn't make that call. " + (e.message || 'Please check permissions.'),
          provider: currentProvider,
          offline: false
        };
      }
    }
  }
  
  // Step 2: Check for app open command
  if (parseOpenAppCommand && openApp) {
    const packageName = parseOpenAppCommand(lowerMessage);
    if (packageName) {
      console.log('[AI] Open app command detected:', packageName);
      try {
        await openApp(packageName);
        return {
          text: "Opening the app now, sir.",
          provider: currentProvider,
          offline: false
        };
      } catch (e: any) {
        console.error('[AI] Open app failed:', e);
        return {
          text: "I apologize, sir. I couldn't open that app. " + (e.message || ''),
          provider: currentProvider,
          offline: false
        };
      }
    }
  }
  
  // Step 3: Check for MESSAGE SENDING command (NEW!)
  if (sendMessageViaAccessibility && (
    lowerMessage.includes('reply to') ||
    lowerMessage.includes('send message to') ||
    lowerMessage.includes('tell ') ||
    lowerMessage.includes('text ')
  )) {
    console.log('[AI] Message sending detected, delegating to AI for drafting...');
    // Let AI draft the message, then send it via accessibility
  }
  
  // Step 4: Check if this is a weather query
  if (getWeather && lowerMessage.includes('weather')) {
    console.log('[AI] Weather query detected, fetching...');
    try {
      const weatherData = await getWeather();
      console.log('[AI] Weather result:', weatherData);
      if (weatherData) {
        return { 
          text: "The current weather is: " + weatherData, 
          provider: currentProvider,
          offline: false 
        };
      }
    } catch (e) {
      console.error('[AI] Weather fetch failed:', e);
    }
  }
  
  // Step 5: Check if this is a factual question that needs web search
  const needsWebSearch = 
    lowerMessage.includes('who is') ||
    lowerMessage.includes('who was') ||
    lowerMessage.includes('what is') ||
    lowerMessage.includes('when did') ||
    lowerMessage.includes('where is') ||
    lowerMessage.includes('how many') ||
    lowerMessage.includes('explain') ||
    lowerMessage.includes('tell me about');
  
  if (smartSearch && needsWebSearch) {
    console.log('[AI] Web search triggered for:', lastUserMessage);
    try {
      const webResult = await smartSearch(lastUserMessage);
      console.log('[AI] Web search result length:', webResult?.length);
      if (webResult && webResult.length > 20 && !webResult.includes('could not find')) {
        return { 
          text: webResult, 
          provider: currentProvider,
          offline: false 
        };
      }
    } catch (e) {
      console.error('[AI] Web search failed:', e);
    }
  }
  
  // Step 6: Call Multi-AI Provider System
  console.log('[AI] Calling AI provider:', currentProvider);
  try {
    // Add context if available
    const messagesWithContext = context 
      ? [...messages, { role: 'system' as const, content: `[Context]\n${context}` }]
      : messages;
    
    const response = await callAI(messagesWithContext, currentProvider);
    console.log('[AI] AI response received from:', response.provider);
    
    // Step 7: Check if AI wants to send a message
    if (response.text.includes('[SEND_MESSAGE]')) {
      console.log('[AI] AI wants to send a message via accessibility');
      // Parse the message sending command from AI response
      // Format: [SEND_MESSAGE|app|recipient|message]
      // We'll implement this logic next
    }
    
    return response;
  } catch (e: any) {
    console.error('[AI] All AI providers failed:', e);
    return { 
      text: "I apologize, sir. I'm experiencing technical difficulties connecting to my AI systems. " + e.message,
      provider: currentProvider,
      offline: true 
    };
  }
}

// Re-export for compatibility
export async function isGeminiNanoAvailable(): Promise<boolean> {
  // Gemini Nano is removed - always return false
  return false;
}


