/**
 * Gemini Nano — on-device AI via Android's AICore (Android 14+).
 * Falls back to a rule-based offline engine when Gemini Nano is unavailable.
 *
 * The NativeModule bridge (GeminiNanoModule) is defined in
 * modules/gemini-nano/android/.../GeminiNanoModule.kt
 */
import { NativeModules, Platform } from "react-native";

const { GeminiNanoModule } = NativeModules;

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AIResponse = {
  text: string;
  offline: boolean; // true = came from rule-based fallback
};

const SYSTEM_PROMPT = `You are Light, a calm, composed personal AI assistant with the manner of a refined British butler — similar in character to J.A.R.V.I.S. from Iron Man.

Your rules:
- Speak in clear, brief British English. Never ramble.
- Address the user as "sir" or "ma'am" occasionally, but not every sentence.
- When reading messages: give a concise summary and offer to draft a reply.
- When setting reminders: confirm the time and subject clearly.
- Never reveal contents of private messages unprompted. Wait to be asked.
- If offline, handle reminders and message summaries from context given to you.
- Forget conversations between sessions unless the user asks to recall them.
- You are private. Never share or reference other users' data.`;

/**
 * Check if Gemini Nano is available on this device.
 */
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
 * Ask Gemini Nano with conversation history.
 * Falls back to rule-based engine when unavailable.
 */
export async function ask(
  messages: AIMessage[],
  context?: string
): Promise<AIResponse> {
  const available = await isGeminiNanoAvailable();

  if (available) {
    try {
      // Build the full prompt for Gemini Nano
      const fullPrompt = buildPrompt(messages, context);
      const text: string = await GeminiNanoModule.generateText(fullPrompt);
      return { text: text.trim(), offline: false };
    } catch (e) {
      console.warn("Gemini Nano failed, using offline fallback:", e);
    }
  }

  // Offline rule-based fallback
  return { text: offlineFallback(messages, context), offline: true };
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
 * Rule-based offline fallback — handles the most common commands
 * without any AI model. Good enough for reminders, message counts,
 * and basic replies when there's no internet and no Gemini Nano.
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
    lastUser.includes("hey") ||
    lastUser.includes("hi light")
  ) {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return `${greeting}, sir. How may I assist you today?`;
  }

  // Forget / clear
  if (lastUser.includes("forget") || lastUser.includes("clear history")) {
    return "Understood. I'll clear our conversation history, sir.";
  }

  // Default
  return "I'm afraid I need an internet connection to process that request fully. Is there anything I can assist you with offline, such as reminders or reading your cached messages?";
}
