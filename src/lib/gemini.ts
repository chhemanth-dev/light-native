/**
 * AI Engine — Gemini Nano (on-device) → Gemini API (cloud) → Offline fallback
 * Handles complex questions by using cloud AI when on-device isn't available.
 */
import { NativeModules, Platform } from "react-native";

const GeminiNanoModule = Platform.OS === "android" ? NativeModules.GeminiNanoModule : null;

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

const SYSTEM_PROMPT = `You are Light, a calm, composed personal AI assistant with the manner of a refined British butler — similar in character to J.A.R.V.I.S. from Iron Man.

Your capabilities:
- Read and summarize notifications from WhatsApp, Instagram, Gmail, etc.
- Set reminders and schedule tasks
- Perform complex calculations and reasoning
- Answer questions on any topic using your knowledge
- Draft emails and messages (you cannot send them, only suggest)
- Provide step-by-step guidance for complex tasks
- Tell jokes, provide weather insights, and casual conversation

Your rules:
- Speak in clear, brief British English. Never ramble.
- Address the user as "sir" or "ma'am" occasionally, but not every sentence.
- When reading messages: give a concise summary and offer to draft a reply.
- When setting reminders: respond with exact format "REMINDER: [task] at [time]" for parsing
- For complex questions (science, math, programming, trivia): provide detailed, accurate answers
- For calculations: show the work and result clearly
- Never reveal contents of private messages unprompted. Wait to be asked.
- Handle reminders and message summaries from context given to you.
- You are private. Never share or reference other users' data.
- Be helpful, accurate, and productive. You're here to make the user's life easier.

Examples:
- "What is 25 * 137?" → "The result is 3,425, sir."
- "Remind me to call John at 3pm" → "REMINDER: call John at 15:00"
- "Explain quantum entanglement" → [detailed explanation]
- "Read my messages" → [summary of unread notifications];

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
 * Tries: 1) Gemini Nano, 2) Gemini API (cloud), 3) Offline fallback
 */
export async function ask(
  messages: AIMessage[],
  context?: string
): Promise<AIResponse> {
  // Try 1: Gemini Nano (on-device)
  const nanoAvailable = await isGeminiNanoAvailable();
  if (nanoAvailable) {
    try {
      const fullPrompt = buildPrompt(messages, context);
      const text: string = await GeminiNanoModule.generateText(fullPrompt);
      return { text: text.trim(), offline: false };
    } catch (e) {
      console.warn("Gemini Nano failed:", e);
    }
  }

  // Try 2: Gemini API (cloud)
  try {
    const text = await callGeminiAPI(messages, context);
    return { text, offline: false };
  } catch (e) {
    console.warn("Gemini API failed:", e);
  }

  // Try 3: Offline fallback
  return { text: offlineFallback(messages, context), offline: true };
}

/**
 * Call Google Gemini API (cloud-based AI)
 */
async function callGeminiAPI(messages: AIMessage[], context?: string): Promise<string> {
  console.log('[Gemini API] Starting API call...');
  const fullPrompt = buildPrompt(messages, context);
  console.log('[Gemini API] Prompt:', fullPrompt.substring(0, 100) + '...');
  
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
  
  const apiUrl = GEMINI_API_URL + '?key=' + GEMINI_API_KEY;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('[Gemini API] Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini API] Error response:', errorText);
    throw new Error('API error: ' + response.status + ' - ' + errorText);
  }

  const data = await response.json();
  console.log('[Gemini API] Response data:', JSON.stringify(data).substring(0, 200));
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    console.error('[Gemini API] No text in response:', JSON.stringify(data));
    throw new Error('No response from API');
  }

  console.log('[Gemini API] Success! Text:', text.substring(0, 100));
  return text.trim();
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
