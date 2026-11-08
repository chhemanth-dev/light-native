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

Your rules:
- Speak in clear, brief British English. Never ramble.
- Address the user as "sir" or "ma'am" occasionally, but not every sentence.
- When reading messages: give a concise summary and offer to draft a reply.
- When setting reminders: confirm the time and subject clearly.
- Never reveal contents of private messages unprompted. Wait to be asked.
- Handle reminders and message summaries from context given to you.
- Forget conversations between sessions unless the user asks to recall them.
- You are private. Never share or reference other users' data.
- Answer all questions accurately and helpfully, including complex queries.`;

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
  const fullPrompt = buildPrompt(messages, context);
  
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from API');
  }

  return text.trim();
}

function buildPrompt(messages: AIMessage[], context?: string): string {
  const parts: string[] = [SYSTEM_PROMPT];
  if (context) parts.push(`\n[Context]\n${context}`);
  parts.push("\n[Conversation]");
  for (const m of messages) {
    parts.push(
      m.role === "user"
        ? `User: ${m.content}`
        : m.role === "assistant"
        ? `Light: ${m.content}`
        : `System: ${m.content}`
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
    lastUser.includes("gmail")
  ) {
    if (context) {
      return `Here is what I have, sir: ${context}`;
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
    return `The current time is ${now}, sir.`;
  }

  // Date
  if (lastUser.includes("date") || lastUser.includes("today")) {
    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Today is ${today}, sir.`;
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

  // Default - AI unavailable message
  return "I apologize, sir. I'm currently operating in offline mode with limited capabilities. I can help you with reminders, reading cached messages, or telling the time. For complex queries, please ensure you have an active internet connection.";
}
