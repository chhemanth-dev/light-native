/**
 * AI Engine — Gemini Nano (on-device) → Gemini API (cloud) → Web Search → Offline fallback
 * Handles complex questions by using cloud AI and real-time web data.
 */
import { NativeModules, Platform } from "react-native";

const GeminiNanoModule = Platform.OS === "android" ? NativeModules.GeminiNanoModule : null;

// Lazy load optional modules to prevent startup crashes
let smartSearch: any = null;
let getWeather: any = null;
let parseReminderCommand: any = null;
let setReminder: any = null;
let checkInternetConnection: any = null;
let makePhoneCall: any = null;
let parseCallCommand: any = null;
let openApp: any = null;
let parseOpenAppCommand: any = null;
let requestCallPermission: any = null;

async function loadOptionalModules() {
  try {
    const websearch = await import("./websearch");
    smartSearch = websearch.smartSearch;
    getWeather = websearch.getWeather;
  } catch (e) {
    console.warn('[AI] Web search module not available:', e);
  }
  
  try {
    const reminders = await import("./reminders");
    parseReminderCommand = reminders.parseReminderCommand;
    setReminder = reminders.setReminder;
  } catch (e) {
    console.warn('[AI] Reminders module not available:', e);
  }
  
  try {
    const accessibility = await import("./accessibility");
    checkInternetConnection = accessibility.checkInternetConnection;
    makePhoneCall = accessibility.makePhoneCall;
    parseCallCommand = accessibility.parseCallCommand;
    openApp = accessibility.openApp;
    parseOpenAppCommand = accessibility.parseOpenAppCommand;
    requestCallPermission = accessibility.requestCallPermission;
  } catch (e) {
    console.warn('[AI] Accessibility module not available:', e);
  }
}

// Google Gemini API - Free tier
const GEMINI_API_KEY = "AIzaSyBCH8vQ9X7hKqR2mFZJxGN4pL3tYwDsEuM";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AIResponse = {
  text: string;
  offline: boolean;
};

const SYSTEM_PROMPT = "You are Light, a calm, composed personal AI assistant with the manner of a refined British butler — similar in character to J.A.R.V.I.S. from Iron Man.\n\n" +
"Your capabilities:\n" +
"- Read and summarize notifications from WhatsApp, Instagram, Gmail, etc.\n" +
"- MAKE PHONE CALLS hands-free (user says 'call <number>')\n" +
"- OPEN APPS hands-free (WhatsApp, Instagram, Gmail, Maps, Chrome, YouTube, Camera, Settings)\n" +
"- SET REMINDERS with exact times (user will say 'remind me to X at Y')\n" +
"- SEARCH THE WEB for current facts, news, and information\n" +
"- Get REAL-TIME WEATHER data\n" +
"- Perform complex calculations and reasoning\n" +
"- Answer questions using both your knowledge AND live web data\n" +
"- Draft emails and messages (you cannot send them, only suggest)\n" +
"- Provide step-by-step guidance for complex tasks\n" +
"- Tell jokes, provide weather insights, and casual conversation\n\n" +
"Your rules:\n" +
"- Speak in clear, brief British English. Never ramble.\n" +
"- Address the user as \"sir\" or \"ma'am\" occasionally, but not every sentence.\n" +
"- When reading messages: give a concise summary and offer to draft a reply.\n" +
"- When user asks about current facts (who/what/when/where): the system will fetch live data from the web\n" +
"- For calls: system automatically makes the call\n" +
"- For app opening: system automatically opens the requested app\n" +
"- For reminders: system automatically handles setting Android alarms\n" +
"- For calculations: show the work and result clearly\n" +
"- Never reveal contents of private messages unprompted. Wait to be asked.\n" +
"- You are private. Never share or reference other users' data.\n" +
"- Be helpful, accurate, and productive. You're here to make the user's life easier.\n\n" +
"Examples:\n" +
"- \"What is 25 * 137?\" → \"The result is 3,425, sir.\"\n" +
"- \"Call 1234567890\" → System makes the call\n" +
"- \"Open WhatsApp\" → System opens WhatsApp\n" +
"- \"Remind me to call John at 3pm\" → System sets alarm automatically\n" +
"- \"Who is Elon Musk?\" → Fetches current info from web\n" +
"- \"What's the weather?\" → Gets real-time weather data\n" +
"- \"Read my messages\" → [summary of unread notifications]";

export async function isGeminiNanoAvailable(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if (!GeminiNanoModule?.isAvailable) return false;
  try {
    return await GeminiNanoModule.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Ask AI with conversation history.
 * ALWAYS tries online first, only uses offline if no internet connection
 */
export async function ask(
  messages: AIMessage[],
  context?: string
): Promise<AIResponse> {
  console.log('[AI] ask() called, loading optional modules...');
  
  // Load optional modules on first use
  if (!smartSearch && !parseReminderCommand && !checkInternetConnection) {
    await loadOptionalModules();
    console.log('[AI] Modules loaded. smartSearch:', !!smartSearch, 'checkInternet:', !!checkInternetConnection);
  }
  
  // Check internet connection FIRST
  let hasInternet = true;
  if (checkInternetConnection) {
    hasInternet = await checkInternetConnection();
    console.log('[AI] Internet connection:', hasInternet);
  }
  
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const lowerMessage = lastUserMessage.toLowerCase();
  console.log('[AI] Processing query:', lastUserMessage.substring(0, 50), '| Has Internet:', hasInternet);
  
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
          offline: false
        };
      } catch (e: any) {
        console.error('[AI] Call failed:', e);
        return {
          text: "I apologize, sir. I couldn't make that call. " + (e.message || 'Please check permissions.'),
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
          offline: false
        };
      } catch (e: any) {
        console.error('[AI] Open app failed:', e);
        return {
          text: "I apologize, sir. I couldn't open that app. " + (e.message || ''),
          offline: false
        };
      }
    }
  }
  
  // Step 3: Check if this is a reminder request
  if (parseReminderCommand && setReminder) {
    try {
      const reminderMatch = parseReminderCommand(lowerMessage);
      if (reminderMatch) {
        console.log('[AI] Reminder detected:', reminderMatch);
        try {
          await setReminder(reminderMatch);
          const timeStr = reminderMatch.time.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const dateStr = reminderMatch.time.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const isToday = reminderMatch.time.toDateString() === new Date().toDateString();
          const when = isToday ? "today at " + timeStr : "on " + dateStr + " at " + timeStr;
          return {
            text: "Very well, sir. I'll remind you to " + reminderMatch.title + " " + when + ".",
            offline: false
          };
        } catch (reminderError: any) {
          console.error('[AI] Reminder set failed:', reminderError);
          return {
            text: "I apologize, sir. I couldn't set that reminder. " + (reminderError.message || 'Please check alarm permissions.'),
            offline: false
          };
        }
      }
    } catch (e) {
      console.error('[AI] Reminder parsing failed:', e);
    }
  }
  
  // Only try online services if internet is available
  if (!hasInternet) {
    console.log('[AI] No internet - skipping online services');
    return { text: offlineFallback(messages, context), offline: true };
  }
  
  // Step 4: Check if this is a weather query
  if (getWeather && lowerMessage.includes('weather')) {
    console.log('[AI] Weather query detected, fetching...');
    try {
      const weatherData = await getWeather();
      console.log('[AI] Weather result:', weatherData);
      if (weatherData) {
        return { text: "The current weather is: " + weatherData, offline: false };
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
      console.log('[AI] Web search result length:', webResult?.length, 'content:', webResult?.substring(0, 100));
      if (webResult && webResult.length > 20 && !webResult.includes('could not find')) {
        return { text: webResult, offline: false };
      }
    } catch (e) {
      console.error('[AI] Web search failed:', e);
    }
  }
  
  // Step 6: Try Gemini Nano (on-device)
  console.log('[AI] Checking Gemini Nano...');
  const nanoAvailable = await isGeminiNanoAvailable();
  console.log('[AI] Gemini Nano available:', nanoAvailable);
  if (nanoAvailable) {
    try {
      const fullPrompt = buildPrompt(messages, context);
      const text: string = await GeminiNanoModule.generateText(fullPrompt);
      console.log('[AI] Gemini Nano success:', text.substring(0, 50));
      return { text: text.trim(), offline: false };
    } catch (e) {
      console.error('[AI] Gemini Nano failed:', e);
    }
  }

  // Step 7: Try Gemini API (cloud) - ALWAYS try if internet is available
  console.log('[AI] Trying Gemini API (cloud)...');
  try {
    const text = await callGeminiAPI(messages, context);
    console.log('[AI] Gemini API success:', text.substring(0, 50));
    return { text, offline: false };
  } catch (e) {
    console.error('[AI] Gemini API failed:', e);
  }

  // Step 8: Offline fallback (only if everything else failed)
  console.log('[AI] All online services failed, using offline fallback');
  return { text: offlineFallback(messages, context), offline: true };
}

/**
 * Call Google Gemini API (cloud-based AI)
 */
async function callGeminiAPI(messages: AIMessage[], context?: string): Promise<string> {
  console.log('[Gemini API] Starting API call...');
  const fullPrompt = buildPrompt(messages, context);
  console.log('[Gemini API] Prompt length:', fullPrompt.length);
  
  const requestBody = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048, // Increased for complex tasks and detailed responses
    }
  };
  
  console.log('[Gemini API] Calling:', GEMINI_API_URL);
  console.log('[Gemini API] Request body size:', JSON.stringify(requestBody).length);
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const apiUrl = GEMINI_API_URL + '?key=' + GEMINI_API_KEY;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[Gemini API] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini API] Error response:', errorText);
      throw new Error('API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    console.log('[Gemini API] Response received, parsing...');
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gemini API] No text in response:', JSON.stringify(data).substring(0, 200));
      throw new Error('No response from API');
    }

    console.log('[Gemini API] Success! Text length:', text.length);
    return text.trim();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[Gemini API] Request timeout after 30 seconds');
      throw new Error('API request timed out');
    }
    console.error('[Gemini API] Fetch error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPrompt(messages: AIMessage[], context?: string): string {
  const parts: string[] = [SYSTEM_PROMPT];
  if (context) parts.push('\n[Context]\n' + context);
  parts.push("\n[Conversation]");
  for (const m of messages) {
    parts.push(
      m.role === "user"
        ? 'User: ' + m.content
        : m.role === "assistant"
        ? 'Light: ' + m.content
        : 'System: ' + m.content
    );
  }
  parts.push("Light:");
  return parts.join("\n");
}

/**
 * Offline fallback for basic commands when no AI is available
 */
function offlineFallback(messages: AIMessage[], context?: string): string {
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === "user")
    ?.content.toLowerCase() ?? "";

  // Math/calculations
  if (lastUser.includes("+") || lastUser.includes("-") || lastUser.includes("*") || 
      lastUser.includes("/") || lastUser.includes("calculate") || lastUser.includes("what is")) {
    // Try to extract and calculate simple math
    try {
      const match = lastUser.match(/(\d+\.?\d*)\s*([+\-*/])\s*(\d+\.?\d*)/);
      if (match) {
        const [_, a, op, b] = match;
        const num1 = parseFloat(a);
        const num2 = parseFloat(b);
        let result = 0;
        switch(op) {
          case '+': result = num1 + num2; break;
          case '-': result = num1 - num2; break;
          case '*': result = num1 * num2; break;
          case '/': result = num1 / num2; break;
        }
        return 'The result is ' + result + ', sir.';
      }
    } catch (e) {
      // Fall through to default message
    }
  }

  // Reminder intent
  if (
    lastUser.includes("remind") ||
    lastUser.includes("alarm") ||
    lastUser.includes("alert")
  ) {
    return "I'll set that reminder for you, sir. Could you confirm the exact time?";
  }

  // Message reading intent
  if (
    lastUser.includes("message") ||
    lastUser.includes("notification") ||
    lastUser.includes("email") ||
    lastUser.includes("whatsapp") ||
    lastUser.includes("gmail") ||
    lastUser.includes("instagram")
  ) {
    if (context) {
      return 'Here is what I have, sir: ' + context;
    }
    return "I don't have any new messages to report at the moment, sir.";
  }

  // Reply drafting
  if (lastUser.includes("reply") || lastUser.includes("respond") || lastUser.includes("draft")) {
    return "Certainly, sir. Here is a suggested reply: 'Thank you for your message. I will get back to you shortly.'";
  }

  // Time
  if (lastUser.includes("time") || lastUser.includes("what time")) {
    const now = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return 'The current time is ' + now + ', sir.';
  }

  // Date
  if (lastUser.includes("date") || lastUser.includes("today")) {
    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return 'Today is ' + today + ', sir.';
  }

  // Weather (basic response)
  if (lastUser.includes("weather")) {
    return "I apologize, sir. Weather data requires an internet connection. Please ensure you're connected and try again.";
  }

  // Greetings
  if (
    lastUser.includes("hello") ||
    lastUser.includes("hi ") ||
    lastUser === "hi" ||
    lastUser.includes("hey")
  ) {
    return "Hello, sir. How may I assist you?";
  }

  // Complex queries
  if (
    lastUser.includes("explain") ||
    lastUser.includes("how does") ||
    lastUser.includes("what does") ||
    lastUser.includes("tell me about") ||
    lastUser.includes("why") ||
    lastUser.includes("who is") ||
    lastUser.includes("when did")
  ) {
    return "That's an excellent question, sir. However, I need an internet connection to provide a detailed answer. Please ensure you're connected and try again.";
  }

  // Default - AI unavailable message
  return "I apologize, sir. I'm currently operating in offline mode with limited capabilities. I can help you with basic calculations, reminders, reading cached messages, or telling the time. For complex queries, please ensure you have an active internet connection.";
}
