/**
 * Assistant orchestrator — ties together AI, voice, messages, reminders.
 * 
 * PRIMARY AI SYSTEM: Light AI (FREE, no API costs!)
 * - Pattern recognition from 6000 examples
 * - Web search for unknown queries
 * - User-taught demonstrations
 * - Guided execution (you command, Light executes)
 * 
 * EXTERNAL APIs: Legacy fallback only (NOT USED BY DEFAULT)
 * - Kept for backwards compatibility
 * - User can optionally configure if they want
 * - Light AI handles everything by default
 * 
 * FLOW:
 * 1. Local intents (reminders, calls, etc.) - instant, no AI needed
 * 2. Guided execution (download app, etc.) - Light AI understands, you guide
 * 3. Light AI chat - pattern recognition + web search
 * 4. No external API calls by default!
 */
import { ask, type AIMessage } from "./gemini";
import { lightAI } from "./light-ai-service";
import { actionExecutor } from "./light-action-executor";
import { guidedExecutor } from "./light-guided-executor";
import { speak, stopSpeaking, formatMessagesForSpeech, formatReminderConfirmation } from "./voice";
import { getUnreadMessages, markAllRead, saveTurn, forgetSession, getPendingReminders } from "./db";
import { parseReminderFromSpeech, scheduleReminder, formatRemindersForSpeech } from "./reminders";
import { 
  parseReminderLocally, 
  parseAppCommandLocally, 
  parsePhoneCallLocally,
  isReminderCommand, 
  isAppOpenCommand,
  isPhoneCallCommand,
  APP_NAME_MAP,
  isAppExcluded,
  refreshInstalledAppsCache
} from "./local-parser";
import { openApp, makePhoneCall } from "./accessibility";
import { executeActionsFromAIResponse, shouldExecuteActions } from "./action-executor";

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
  private lightAIReady = false;
  private conversationContext: string[] = []; // Remember conversation context
  private currentApp: string | null = null; // NEW: Remember what app is open
  private lastAction: string | null = null; // NEW: Remember last action

  constructor() {
    // Initialize Light AI in background
    this.initializeLightAI();
  }

  private async initializeLightAI() {
    try {
      console.log("[Assistant] 🚀 Initializing Light AI...");
      await lightAI.initialize();
      this.lightAIReady = true;
      console.log("[Assistant] ✅ Light AI ready!");
    } catch (error) {
      console.error("[Assistant] ❌ Light AI initialization failed:", error);
      console.log("[Assistant] ⚠️ Will fall back to external APIs");
    }
  }

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
    // NEVER clear history! Keep conversation context FOREVER
    // Device impact: Negligible - text history is tiny (few KB per day)
    // Each message ~100 bytes, 1000 messages = 100KB (less than 1 photo!)
    console.log("[Assistant] Continuing conversation with", this.history.length, "messages in memory");
    
    // Refresh installed apps cache when session starts
    refreshInstalledAppsCache().catch(err => 
      console.warn('[Assistant] Failed to refresh app cache:', err)
    );
  }

  async endSession() {
    // DON'T clear everything - keep conversation context!
    // this.sessionId = null;  // REMOVED - don't clear session
    // this.history = []; // REMOVED - keep history for next interaction
    await stopSpeaking();
    this.setState("idle");
    console.log("[Assistant] Session ended, keeping context for next interaction");
  }

  async handleInput(userText: string) {
    if (!userText.trim()) return;

    console.log("=========================================");
    console.log("[Assistant] NEW INPUT:", userText);
    console.log("[Assistant] Current App:", this.currentApp);
    console.log("[Assistant] Last Action:", this.lastAction);
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

      // Add app context to the command if we're in an app
      let contextualInput = userText;
      if (this.currentApp) {
        contextualInput = `[In ${this.currentApp}] ${userText}`;
        console.log("[Assistant] Added app context:", contextualInput);
      }

      console.log("[Assistant] Checking local intent...");
      const localResponse = await this.handleLocalIntent(contextualInput);
      if (localResponse) {
        console.log("[Assistant] ✅ Using LOCAL response:", localResponse.substring(0, 80));
        await this.respond(localResponse, true);
        return;
      }

      // ========================================
      // SMART EXECUTION - Only for OBVIOUS commands
      // Let Light AI think for everything else!
      // ========================================
      if (this.isObviousCommand(userText)) {
        console.log("[Assistant] 🎯 Obvious command detected, executing directly...");
        const directExecution = await this.tryDirectExecution(userText);
        if (directExecution) {
          console.log("[Assistant] ✅ Direct execution succeeded!");
          await this.respond(directExecution, true);
          return;
        }
      } else {
        console.log("[Assistant] 🧠 Not an obvious command - letting Light AI think...");
      }

      console.log("[Assistant] Building context...");
      const context = await this.buildContext(userText);
      console.log("[Assistant] Context length:", context.length);
      if (context) {
        console.log("[Assistant] Context preview:", context.substring(0, 100));
      }
      
      this.history.push({ role: "user", content: userText });

      // ========================================
      // LIGHT AI - SMART, CONVERSATIONAL, CAPABLE
      // ========================================
      console.log("[Assistant] 💡 Consulting Light AI...");
      
      try {
        const lightResponse = await lightAI.chat(userText);
        console.log("[Assistant] ✅ Light AI response received!");
        console.log("[Assistant] Source:", lightResponse.source);
        console.log("[Assistant] Confidence:", lightResponse.confidence);
        console.log("[Assistant] Response:", lightResponse.text.substring(0, 100));
        
        this.history.push({ role: "assistant", content: lightResponse.text });
        
        // Execute action if Light AI recognized one
        if (lightResponse.intent || lightResponse.action) {
          console.log("[Assistant] 🎯 Light AI identified action:", lightResponse.intent || lightResponse.action);
          
          // Only execute if confidence is high enough
          if ((lightResponse.confidence || 0) > 0.7) {
            console.log("[Assistant] ✅ High confidence - executing action");
            const executed = await lightAI.executeAction(
              lightResponse.intent || 'unknown',
              userText
            );
            
            if (executed) {
              console.log("[Assistant] ✅ Action executed successfully!");
            } else {
              console.log("[Assistant] ⚠️ Action execution failed");
            }
          } else {
            console.log("[Assistant] ⚠️ Confidence too low - not executing action");
          }
        }
        
        // If Light AI suggests teaching mode
        if (lightResponse.requiresTeaching) {
          console.log("[Assistant] 📚 Light AI suggests learning from user");
        }
        
        await this.respond(lightResponse.text, false);
        return;
      } catch (lightError) {
        console.warn("[Assistant] ⚠️ Light AI failed:", lightError);
        await this.respond(
          "I'm having trouble with that, sir. Could you try asking in a different way?",
          true
        );
        return;
      }

      // NOTE: We removed the fallback to external APIs
      // Light AI handles everything now!
      console.log("[Assistant] Offline mode:", offline);
      console.log("[Assistant] Response:", text.substring(0, 100));
      
      this.history.push({ role: "assistant", content: text });

      if (this.history.length > 20) {
        this.history = this.history.slice(-20);
      }

      // Execute any actions mentioned in AI response (REMOVED - Light AI handles actions)

      await this.respond(text, offline);
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Something went wrong.";
      console.error("[Assistant] ❌ ERROR:", msg);
      console.error("[Assistant] Error details:", e);
      
      // Note: External API error handling is kept for legacy support only
      // Light AI is now the primary system and should handle everything
      
      this.setState("error");
      this.emit({ type: "error", message: "I had trouble with that. Could you try rephrasing?" });
      setTimeout(() => this.setState("idle"), 3000);
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

  /**
   * Check if this is an obvious command (not a question or conversation)
   * Only execute directly for CLEAR commands, let AI think for everything else
   */
  private isObviousCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();
    
    // Questions and conversations should go to AI, not direct execution
    if (lower.includes('?') || 
        lower.startsWith('what ') || 
        lower.startsWith('who ') || 
        lower.startsWith('where ') || 
        lower.startsWith('when ') || 
        lower.startsWith('why ') || 
        lower.startsWith('how ') ||
        lower.startsWith('can you') ||
        lower.startsWith('could you') ||
        lower.startsWith('would you') ||
        lower.startsWith('should i') ||
        lower.startsWith('tell me') ||
        lower.startsWith('explain') ||
        lower.startsWith('i want to') ||
        lower.startsWith('i need to') ||
        lower.startsWith('help me')) {
      return false; // Let AI think about these
    }
    
    // Only these are "obvious" commands that skip AI:
    // 1. Explicit action verbs with clear targets
    const obviousPatterns = [
      /^(call|dial|phone)\s+\d+/, // "call 123456" (with number)
      /^(open|launch|start)\s+(instagram|youtube|spotify|camera|settings)/, // "open instagram"
      /^remind me (in|at|to)/, // "remind me in 5 minutes"
      /^(turn on|turn off|enable|disable)\s+(wifi|bluetooth)/, // "turn on wifi"
      /^take (a |)photo/, // "take photo"
      /^play music/, // "play music"
    ];
    
    return obviousPatterns.some(pattern => pattern.test(lower));
  }

  /**
   * UNIVERSAL DIRECT EXECUTION
   * Try to execute command immediately without relying on intent detection
   * This gives Light INFINITE capabilities - just pattern match and execute!
   */
  private async tryDirectExecution(text: string): Promise<string | null> {
    const lower = text.toLowerCase().trim();
    console.log("[Assistant] 🎯 Trying direct execution for:", lower);

    // ========================================
    // REMINDER - Any time-based command
    // ========================================
    if (lower.match(/remind|reminder|in \d+|at \d+|tomorrow|later|tonight/)) {
      console.log("[Assistant] 🎯 Detected: REMINDER");
      const result = await actionExecutor.execute('set_reminder', text);
      if (result.success) return result.message;
    }

    // ========================================
    // CALL - Any call command
    // ========================================
    if (lower.match(/call|dial|phone|ring/)) {
      console.log("[Assistant] 🎯 Detected: CALL");
      const result = await actionExecutor.execute('make_call', text);
      if (result.success) return result.message;
    }

    // ========================================
    // MESSAGE - Send message via WhatsApp/SMS
    // ========================================
    if (lower.match(/message|text|whatsapp|send|sms/)) {
      console.log("[Assistant] 🎯 Detected: MESSAGE");
      const result = await actionExecutor.execute('send_message', text);
      if (result.success) return result.message;
    }

    // ========================================
    // OPEN APP - Launch any application
    // ========================================
    if (lower.match(/open|launch|start|go to/) && lower.match(/app|instagram|youtube|spotify|facebook|twitter|tiktok|netflix|gmail|maps|chrome|camera|gallery|settings|calculator|calendar/)) {
      console.log("[Assistant] 🎯 Detected: OPEN APP");
      const result = await actionExecutor.execute('open_app', text);
      if (result.success) return result.message;
    }

    // ========================================
    // WEB SEARCH - Search online
    // ========================================
    if (lower.match(/search|google|look up|find out|what is|who is|how to|tell me about/) || lower.includes('?')) {
      console.log("[Assistant] 🎯 Detected: WEB SEARCH");
      const result = await actionExecutor.execute('web_search', text);
      if (result.success) return result.message;
    }

    // ========================================
    // CAMERA/PHOTO
    // ========================================
    if (lower.match(/camera|photo|picture|take|selfie|snap/)) {
      console.log("[Assistant] 🎯 Detected: CAMERA");
      const result = await actionExecutor.execute('take_photo', text);
      if (result.success) return result.message;
    }

    // ========================================
    // MUSIC
    // ========================================
    if (lower.match(/music|song|play|spotify|youtube music/)) {
      console.log("[Assistant] 🎯 Detected: MUSIC");
      const result = await actionExecutor.execute('play_music', text);
      if (result.success) return result.message;
    }

    // ========================================
    // WIFI/BLUETOOTH
    // ========================================
    if (lower.match(/wifi|wi-fi|wireless|internet/)) {
      console.log("[Assistant] 🎯 Detected: WIFI");
      const intent = lower.match(/turn on|enable|on/) ? 'enable_wifi' : 'disable_wifi';
      const result = await actionExecutor.execute(intent, text);
      if (result.success) return result.message;
    }

    if (lower.match(/bluetooth|bt/)) {
      console.log("[Assistant] 🎯 Detected: BLUETOOTH");
      const intent = lower.match(/turn on|enable|on/) ? 'enable_bluetooth' : 'disable_bluetooth';
      const result = await actionExecutor.execute(intent, text);
      if (result.success) return result.message;
    }

    // ========================================
    // TIME/DATE/WEATHER
    // ========================================
    if (lower.match(/what.*time|current time/)) {
      console.log("[Assistant] 🎯 Detected: TIME");
      const result = await actionExecutor.execute('get_time', text);
      if (result.success) return result.message;
    }

    if (lower.match(/what.*date|today|day is it/)) {
      console.log("[Assistant] 🎯 Detected: DATE");
      const result = await actionExecutor.execute('get_date', text);
      if (result.success) return result.message;
    }

    if (lower.match(/weather|temperature|forecast|rain|sunny|cold|hot/)) {
      console.log("[Assistant] 🎯 Detected: WEATHER");
      const result = await actionExecutor.execute('get_weather', text);
      if (result.success) return result.message;
    }

    // ========================================
    // CALCULATOR
    // ========================================
    if (lower.match(/calculate|what is \d+|how much is|\+|\-|\*|\/|times|plus|minus|divided/)) {
      console.log("[Assistant] 🎯 Detected: CALCULATE");
      const result = await actionExecutor.execute('calculate', text);
      if (result.success) return result.message;
    }

    // ========================================
    // READ MESSAGES
    // ========================================
    if (lower.match(/read.*message|check.*message|any message|show message/)) {
      console.log("[Assistant] 🎯 Detected: READ MESSAGES");
      const result = await actionExecutor.execute('read_messages', text);
      if (result.success) return result.message;
    }

    // ========================================
    // URLS
    // ========================================
    if (lower.match(/http|www\.|\.com|\.org|\.net/) || lower.includes('://')) {
      console.log("[Assistant] 🎯 Detected: URL");
      const result = await actionExecutor.execute('open_url', text);
      if (result.success) return result.message;
    }

    console.log("[Assistant] ⚠️ No direct execution match found");
    return null;
  }

  private async handleLocalIntent(text: string): Promise<string | null> {
    const lower = text.toLowerCase().trim();
    console.log("[Assistant] handleLocalIntent checking:", lower);

    // ========================================
    // PRIORITY 0: GUIDED EXECUTION COMMANDS
    // ========================================
    const executorContext = guidedExecutor.getContext();
    
    // If there's an active execution task, route commands to it
    if (executorContext && executorContext.state !== 'completed') {
      console.log("[Assistant] 🎯 Routing to guided executor");
      
      // Cancel command
      if (lower.match(/\b(cancel|stop|abort|nevermind)\b/)) {
        return await guidedExecutor.cancel();
      }
      
      // Otherwise, treat as execution command
      return await guidedExecutor.executeCommand(text);
    }

    // Start new guided execution task
    // Pattern: "download app", "open app and do X", "send message to X"
    if (this.isGuidedTaskCommand(lower)) {
      console.log("[Assistant] 🎯 Starting guided execution");
      return await guidedExecutor.startTask(text);
    }

    // ========================================
    // PRIORITY 1: PHONE CALLS (NO AI NEEDED)
    // ========================================
    if (isPhoneCallCommand(text)) {
      console.log("[Assistant] 📞 Phone call command detected!");
      const callCmd = await parsePhoneCallLocally(text);
      if (callCmd) {
        try {
          if (callCmd.phoneNumber) {
            // Direct number call OR contact found
            console.log("[Assistant] Calling number:", callCmd.phoneNumber);
            await makePhoneCall(callCmd.phoneNumber);
            
            if (callCmd.contactName) {
              return `Calling ${callCmd.contactName} at ${callCmd.phoneNumber}, sir.`;
            } else {
              return `Calling ${callCmd.phoneNumber}, sir.`;
            }
          } else if (callCmd.contactName) {
            // Contact name but no number found
            return `I couldn't find ${callCmd.contactName} in your contacts, sir. Please add them in Settings → Contacts, or say "call" followed by the number.`;
          }
        } catch (error) {
          console.error("[Assistant] ❌ Error making call:", error);
          return `I had trouble making that call, sir. Please check permissions.`;
        }
      }
    }

    // ========================================
    // PRIORITY 2: APP OPENING (NO AI NEEDED)
    // ========================================
    if (isAppOpenCommand(text)) {
      console.log("[Assistant] 📱 App open command detected!");
      const appCmd = await parseAppCommandLocally(text);
      if (appCmd) {
        try {
          // Get package name
          const packageName = appCmd.packageName;
          
          if (!packageName) {
            return `I couldn't find "${appCmd.appName}" on your device, sir. Make sure it's installed.`;
          }
          
          // Check if app is excluded (payment/banking)
          if (isAppExcluded(packageName)) {
            return `For security, I cannot open payment or banking apps via voice, sir. Please open ${appCmd.appName} manually.`;
          }
          
          console.log("[Assistant] Opening app:", packageName);
          await openApp(packageName);
          return `Opening ${appCmd.appName}, sir.`;
        } catch (error) {
          console.error("[Assistant] ❌ Error opening app:", error);
          return `I had trouble opening ${appCmd.appName}, sir. It may not be installed or I don't have permission.`;
        }
      }
    }

    // ========================================
    // PRIORITY 3: REMINDERS (NO AI NEEDED)
    // ========================================
    if (isReminderCommand(text)) {
      console.log("[Assistant] ⏰ Reminder command detected!");
      console.log("[Assistant] Raw input:", text);
      const parsed = parseReminderLocally(text);
      console.log("[Assistant] Parsed result:", JSON.stringify(parsed));
      
      if (parsed) {
        try {
          const fireAt = Date.now() + (parsed.minutes * 60 * 1000);
          console.log("[Assistant] Scheduling reminder:");
          console.log("[Assistant]  - Title:", parsed.title);
          console.log("[Assistant]  - Minutes:", parsed.minutes);
          console.log("[Assistant]  - Fire at:", new Date(fireAt).toLocaleString());
          
          const result = await scheduleReminder({
            id: Date.now().toString(),
            title: parsed.title,
            time: fireAt,
            repeatInterval: null,
          });
          
          console.log("[Assistant] ✅ Reminder scheduled successfully:", result);
          
          let timeDesc = '';
          if (parsed.minutes < 60) {
            timeDesc = `in ${parsed.minutes} minute${parsed.minutes !== 1 ? 's' : ''}`;
          } else {
            const hours = Math.floor(parsed.minutes / 60);
            const mins = parsed.minutes % 60;
            timeDesc = `in ${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` and ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
          }
          
          return `Reminder set ${timeDesc}: "${parsed.title}", sir.`;
        } catch (error) {
          console.error("[Assistant] ❌ Error setting reminder:", error);
          console.error("[Assistant] Error details:", JSON.stringify(error, null, 2));
          return `I had trouble setting that reminder, sir. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if I have alarm permissions.`;
        }
      } else {
        console.log("[Assistant] ⚠️ Could not parse reminder from:", text);
        return "I'm sorry, sir. I didn't understand the reminder time. Please try formats like 'remind me to call mom in 30 minutes' or 'remind me at 3pm to check email'.";
      }
    }

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

  /**
   * Check if command should start guided execution
   */
  private isGuidedTaskCommand(lower: string): boolean {
    // Download patterns
    if (lower.match(/\bdownload\b/) && (lower.match(/\bapp\b/) || lower.match(/tiktok|instagram|facebook|whatsapp|youtube/i))) {
      return true;
    }

    // Complex multi-step tasks
    if (lower.match(/\b(open|go to)\b.*(and|then)\b/)) {
      return true; // "open settings and turn on WiFi"
    }

    // Explicit guidance request
    if (lower.match(/\b(guide me|help me|show me how)\b/)) {
      return true;
    }

    return false;
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
