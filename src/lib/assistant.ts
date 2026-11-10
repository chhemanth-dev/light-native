/**
 * Assistant orchestrator — ties together AI, voice, messages, reminders.
 */
import { ask, type AIMessage } from "./gemini";
import { speak, stopSpeaking, formatMessagesForSpeech, formatReminderConfirmation } from "./voice";
import { getUnreadMessages, markAllRead, saveTurn, forgetSession, getPendingReminders } from "./db";
import { parseReminderFromSpeech, scheduleReminder, formatRemindersForSpeech } from "./reminders";

export type AssistantState = "idle" | "listening" | "thinking" | "speaking" | "error";

export type AssistantEvent =
  | { type: "state_change"; state: AssistantState }
  | { type: "transcript"; text: string }
  | { type: "response"; text: string; offline: boolean }
  | { type: "error"; message: string };

type EventHandler = (event: AssistantEvent) => void;

export class LightAssistant {
  private sessionId: string | null = null;
  private history: AIMessage[] = [];
  private handlers: EventHandler[] = [];
  private state: AssistantState = "idle";

  on(handler: EventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private emit(event: AssistantEvent) {
    this.handlers.forEach((h) => h(event));
  }

  private setState(s: AssistantState) {
    this.state = s;
    this.emit({ type: "state_change", state: s });
  }

  getState() {
    return this.state;
  }

  startSession(sessionId: string) {
    this.sessionId = sessionId;
    this.history = [];
  }

  async endSession() {
    this.sessionId = null;
    this.history = [];
    await stopSpeaking();
    this.setState("idle");
  }

  async handleInput(userText: string) {
    if (!userText.trim()) return;

    console.log("=========================================");
    console.log("[Assistant] NEW INPUT:", userText);
    console.log("=========================================");
    this.setState("thinking");
    this.emit({ type: "transcript", text: userText });

    try {
      if (this.sessionId) {
        await saveTurn({
          session_id: this.sessionId,
          role: "user",
          content: userText,
          timestamp: Date.now(),
        });
      }

      console.log("[Assistant] Checking local intent...");
      const localResponse = await this.handleLocalIntent(userText);
      if (localResponse) {
        console.log("[Assistant] ✅ Using LOCAL response:", localResponse.substring(0, 80));
        await this.respond(localResponse, true);
        return;
      }

      console.log("[Assistant] Building context...");
      const context = await this.buildContext(userText);
      console.log("[Assistant] Context length:", context.length);
      if (context) {
        console.log("[Assistant] Context preview:", context.substring(0, 100));
      }
      
      this.history.push({ role: "user", content: userText });

      console.log("[Assistant] ⏳ Calling AI with", this.history.length, "messages in history...");
      const { text, offline } = await ask(this.history, context);
      console.log("[Assistant] ✅ AI response received!");
      console.log("[Assistant] Offline mode:", offline);
      console.log("[Assistant] Response:", text.substring(0, 100));
      
      this.history.push({ role: "assistant", content: text });

      if (this.history.length > 20) {
        this.history = this.history.slice(-20);
      }

      await this.respond(text, offline);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[Assistant] ❌ ERROR:", msg);
      console.error("[Assistant] Error details:", e);
      this.setState("error");
      this.emit({ type: "error", message: msg });
      setTimeout(() => this.setState("idle"), 2000);
    }
  }

  private async respond(text: string, offline: boolean) {
    console.log("[Assistant] respond() called with text:", text.substring(0, 100));
    console.log("[Assistant] offline:", offline);
    this.setState("speaking");
    this.emit({ type: "response", text, offline });

    try {
      if (this.sessionId) {
        await saveTurn({
          session_id: this.sessionId,
          role: "assistant",
          content: text,
          timestamp: Date.now(),
        });
      }
    } catch {
      // DB might not be ready — ignore
      console.warn("[Assistant] DB save failed (ignore)");
    }

    console.log("[Assistant] Calling speak()...");
    // speak() now has its own error handling that fires onDone on failure
    await new Promise<void>((resolve) => {
      speak(text, {
        onDone: () => {
          console.log("[Assistant] speak() onDone called");
          this.setState("idle");
          resolve();
        },
        onStopped: () => {
          console.log("[Assistant] speak() onStopped called");
          this.setState("idle");
          resolve();
        },
      });
    });
  }

  private async handleLocalIntent(text: string): Promise<string | null> {
    const lower = text.toLowerCase().trim();
    console.log("[Assistant] handleLocalIntent checking:", lower);

    // READ MESSAGES
    if (
      lower.match(/\b(messages?|notifications?|updates?|whatsapp|gmail|instagram|emails?)\b/) &&
      lower.match(/\b(read|show|tell|what|any|check|have i|do i)\b/)
    ) {
      console.log("[Assistant] 📬 Message intent detected!");
      try {
        console.log("[Assistant] Fetching unread messages from DB...");
        const unread = await getUnreadMessages();
        console.log("[Assistant] Found", unread.length, "unread messages");
        if (unread.length > 0) {
          console.log("[Assistant] First message:", JSON.stringify(unread[0]));
        }
        await markAllRead();
        const response = formatMessagesForSpeech(
          unread.map((m) => ({
            app_name: m.app_name,
            sender: m.sender,
            content: m.content,
          }))
        );
        console.log("[Assistant] Formatted response:", response.substring(0, 100));
        return response;
      } catch (error) {
        console.error("[Assistant] ❌ Error retrieving messages:", error);
        return "I couldn't retrieve your messages, sir.";
      }
    }

    // SET REMINDER
    if (lower.match(/\b(remind|reminder|alarm|alert)\b/)) {
      const parsed = parseReminderFromSpeech(text);
      if (parsed) {
        try {
          await scheduleReminder(parsed);
          return formatReminderConfirmation(parsed.title, parsed.time);
        } catch {
          return "I'm sorry, sir. I couldn't schedule that reminder.";
        }
      }
    }

    // LIST REMINDERS
    if (
      lower.match(/\b(reminders?|upcoming|schedule|what.*remind)\b/) &&
      lower.match(/\b(list|show|what|tell|any|have i)\b/)
    ) {
      try {
        const reminders = await getPendingReminders();
        return formatRemindersForSpeech(reminders);
      } catch {
        return "I couldn't retrieve your reminders, sir.";
      }
    }

    // TIME
    if (lower.match(/\bwhat(?:'s| is) the time\b/) || lower === "time") {
      const t = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `The time is ${t}, sir.`;
    }

    // DATE
    if (lower.match(/\bwhat(?:'s| is).*date\b/) || lower === "date" || lower === "what day is it") {
      const d = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `Today is ${d}, sir.`;
    }

    // FORGET HISTORY
    if (lower.match(/\b(forget|clear|wipe|delete).*(history|conversation|chat)\b/)) {
      if (this.sessionId) {
        try { await forgetSession(this.sessionId); } catch { /* ignore */ }
        this.history = [];
      }
      return "Done, sir. I've cleared our conversation history.";
    }

    // STOP
    if (lower === "stop" || lower === "cancel" || lower === "nevermind" || lower === "never mind") {
      await stopSpeaking();
      this.setState("idle");
      return null;
    }

    return null;
  }

  private async buildContext(userText: string): Promise<string> {
    const lower = userText.toLowerCase();
    const parts: string[] = [];

    try {
      if (lower.match(/\b(message|notification|email|whatsapp|instagram|gmail)\b/)) {
        const msgs = await getUnreadMessages();
        if (msgs.length > 0) {
          parts.push(
            "Unread messages:\n" +
              msgs
                .slice(0, 8)
                .map((m) => `[${m.app_name}] ${m.sender}: ${m.content.slice(0, 200)}`)
                .join("\n")
          );
        }
      }

      if (lower.match(/\b(remind|reminder|schedule|plan|todo)\b/)) {
        const reminders = await getPendingReminders();
        if (reminders.length > 0) {
          parts.push(
            "Upcoming reminders:\n" +
              reminders
                .slice(0, 5)
                .map((r) => `${r.title} at ${new Date(r.fire_at).toLocaleString("en-GB")}`)
                .join("\n")
          );
        }
      }
    } catch {
      // DB not ready — return empty context
    }

    return parts.join("\n\n");
  }
}

// Singleton
export const assistant = new LightAssistant();
