/**
 * Assistant orchestrator — ties together AI, voice, messages, reminders.
 * This is the brain that decides what to do when Light hears a command.
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

  /**
   * Main entry point — process voice input text.
   */
  async handleInput(userText: string) {
    if (!userText.trim()) return;

    this.setState("thinking");
    this.emit({ type: "transcript", text: userText });

    try {
      // Save user turn
      if (this.sessionId) {
        await saveTurn({
          session_id: this.sessionId,
          role: "user",
          content: userText,
          timestamp: Date.now(),
        });
      }

      // Intercept known intents locally first (faster + works offline)
      const localResponse = await this.handleLocalIntent(userText);
      if (localResponse) {
        await this.respond(localResponse, true);
        return;
      }

      // Build context from messages for AI
      const context = await this.buildContext(userText);

      // Add to history
      this.history.push({ role: "user", content: userText });

      // Ask AI (Gemini Nano or offline fallback)
      const { text, offline } = await ask(this.history, context);
      this.history.push({ role: "assistant", content: text });

      // Trim history to last 10 turns to avoid prompt overflow
      if (this.history.length > 20) {
        this.history = this.history.slice(-20);
      }

      await this.respond(text, offline);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      this.setState("error");
      this.emit({ type: "error", message: msg });
      await this.respond("I encountered an error, sir. Please try again.", true);
    }
  }

  private async respond(text: string, offline: boolean) {
    this.setState("speaking");
    this.emit({ type: "response", text, offline });

    if (this.sessionId) {
      await saveTurn({
        session_id: this.sessionId,
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      });
    }

    await new Promise<void>((resolve) => {
      speak(text, {
        onDone: () => {
          this.setState("idle");
          resolve();
        },
        onStopped: () => {
          this.setState("idle");
          resolve();
        },
      });
    });
  }

  /**
   * Handle known intents without calling AI — instant + offline.
   */
  private async handleLocalIntent(text: string): Promise<string | null> {
    const lower = text.toLowerCase().trim();

    // --- READ MESSAGES ---
    if (
      lower.match(/\b(messages?|notifications?|updates?|whatsapp|gmail|instagram|emails?)\b/) &&
      lower.match(/\b(read|show|tell|what|any|check|have i|do i)\b/)
    ) {
      const unread = await getUnreadMessages();
      await markAllRead();
      return formatMessagesForSpeech(
        unread.map((m) => ({
          app_name: m.app_name,
          sender: m.sender,
          content: m.content,
        }))
      );
    }

    // --- SET REMINDER ---
    if (
      lower.match(/\b(remind|reminder|alarm|alert)\b/)
    ) {
      const parsed = parseReminderFromSpeech(text);
      if (parsed) {
        try {
          await scheduleReminder(parsed);
          return formatReminderConfirmation(parsed.title, parsed.fireAt);
        } catch {
          return "I'm sorry, sir. I couldn't schedule that reminder. Please check notification permissions.";
        }
      }
    }

    // --- LIST REMINDERS ---
    if (
      lower.match(/\b(reminders?|upcoming|schedule|what.*remind)\b/) &&
      lower.match(/\b(list|show|what|tell|any|have i)\b/)
    ) {
      const reminders = await getPendingReminders();
      return formatRemindersForSpeech(reminders);
    }

    // --- TIME ---
    if (lower.match(/\bwhat(?:'s| is) the time\b/) || lower === "time") {
      const t = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `The time is ${t}, sir.`;
    }

    // --- DATE ---
    if (lower.match(/\bwhat(?:'s| is).*date\b/) || lower === "date" || lower === "what day is it") {
      const d = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `Today is ${d}, sir.`;
    }

    // --- FORGET / CLEAR HISTORY ---
    if (lower.match(/\b(forget|clear|wipe|delete).*(history|conversation|chat)\b/)) {
      if (this.sessionId) {
        await forgetSession(this.sessionId);
        this.history = [];
      }
      return "Done, sir. I've cleared our conversation history.";
    }

    // --- STOP / CANCEL ---
    if (lower === "stop" || lower === "cancel" || lower === "nevermind" || lower === "never mind") {
      await stopSpeaking();
      this.setState("idle");
      return null; // Handled silently
    }

    return null; // Not a local intent — pass to AI
  }

  /**
   * Build relevant context string for the AI from local data.
   */
  private async buildContext(userText: string): Promise<string> {
    const lower = userText.toLowerCase();
    const parts: string[] = [];

    // Include unread messages if user is asking about them
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

    // Include reminders if user is asking about schedule
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

    return parts.join("\n\n");
  }
}

// Singleton
export const assistant = new LightAssistant();
