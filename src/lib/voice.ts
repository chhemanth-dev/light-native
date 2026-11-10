/**
 * Light's voice — Jarvis-style deep British male TTS.
 * Uses expo-speech with tuned pitch/rate and the best available UK English voice.
 */
import * as Speech from "expo-speech";

export type SpeakOptions = {
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
};

const JARVIS_VOICE_PREFERENCES = [
  "en-gb-x-rjs-network",      // Male UK voice (Rishi - deep)
  "en-gb-x-gbm-network",      // Male UK voice (George)
  "en-us-x-iom-network",      // Male US voice (Iron Man style)
  "en-us-x-tpd-network",      // Male US deep
  "en-gb-x-gbd-network",      // Male UK Daniel (deeper)
  "en-gb-x-gbc-network",      // Male UK Christopher
  "en-gb-x-rjs-local",        // Male UK local
  "en-gb-x-gbd-local",
  "en_GB",
  "en-GB",
  "en-US",
];

let _voice: string | null = null;
let _voiceInitAttempted = false;

export async function initVoice() {
  if (_voice || _voiceInitAttempted) return _voice;
  _voiceInitAttempted = true;
  try {
    const available = await Speech.getAvailableVoicesAsync();
    console.log("[Voice] Available voices:", available.map(v => `${v.identifier} (${v.name}, ${v.language})`).join(", "));
    
    // First try: exact preference matches
    for (const pref of JARVIS_VOICE_PREFERENCES) {
      const match = available.find(
        (v) =>
          v.identifier?.toLowerCase().includes(pref.toLowerCase()) ||
          v.language?.toLowerCase().startsWith(pref.toLowerCase().slice(0, 5))
      );
      if (match) {
        _voice = match.identifier;
        console.log("[Voice] Matched preference:", pref, "→", _voice);
        break;
      }
    }
    
    // Second try: any male voice (name contains "male" or known male names)
    if (!_voice) {
      const maleNames = ["male", "man", "daniel", "george", "james", "rishi", "iron"];
      const maleVoice = available.find(v => 
        maleNames.some(name => 
          v.name?.toLowerCase().includes(name) || 
          v.identifier?.toLowerCase().includes(name)
        )
      );
      if (maleVoice) {
        _voice = maleVoice.identifier;
        console.log("[Voice] Found male voice by name:", _voice);
      }
    }
    
    console.log("[Voice] Final selected voice:", _voice || "system default");
  } catch (e) {
    console.error("[Voice] initVoice error:", e);
    // ignore — will use system default
  }
  return _voice;
}

export async function speak(text: string, options: SpeakOptions = {}) {
  try {
    console.log("[Voice] Attempting to speak:", text.substring(0, 50));
    const selectedVoice = await initVoice();
    console.log("[Voice] Selected voice identifier:", selectedVoice);
    await Speech.stop();
    
    // DEEP MALE VOICE SETTINGS - Balanced for natural sound
    const wrappedOptions = {
      voice: selectedVoice ?? undefined,
      language: "en-GB",
      rate: 0.70,      // Natural speaking pace
      pitch: 0.75,     // Deep male voice, still natural sounding
      onStart: () => {
        console.log("[Voice] Speech started");
        options.onStart?.();
      },
      onDone: () => {
        console.log("[Voice] Speech done");
        options.onDone?.();
      },
      onStopped: () => {
        console.log("[Voice] Speech stopped");
        options.onStopped?.();
      },
      onError: (error: any) => {
        console.error("[Voice] Speech error:", error);
        // Fire onDone on error so we don't hang
        options.onDone?.();
      },
    };
    
    Speech.speak(text, wrappedOptions);
    console.log("[Voice] Speech.speak() called successfully");
  } catch (e) {
    // TTS might not be available — fire onDone so the assistant doesn't hang
    console.error("[Voice] Speech exception:", e);
    options.onDone?.();
  }
}

export async function stopSpeaking() {
  try {
    await Speech.stop();
  } catch {
    // ignore
  }
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync().catch(() => false);
}

/**
 * Formats a message list into what Light will read aloud.
 */
export function formatMessagesForSpeech(
  messages: Array<{ app_name: string; sender: string; content: string }>
): string {
  if (messages.length === 0) {
    return "You have no unread messages at the moment, sir.";
  }
  const count = messages.length;
  const intro =
    count === 1
      ? "You have one unread message."
      : `You have ${count} unread messages.`;

  const items = messages
    .slice(0, 5)
    .map(
      (m) =>
        `From ${m.app_name}, ${m.sender} says — ${m.content.slice(0, 120)}${m.content.length > 120 ? "..." : ""}`
    )
    .join(". ");

  const suffix =
    count > 5 ? ` There are ${count - 5} more messages I haven't read.` : "";

  return `${intro} ${items}.${suffix}`;
}

/**
 * Formats a reminder confirmation for speech.
 */
export function formatReminderConfirmation(
  title: string,
  time: Date
): string {
  const timeStr = time.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = time.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const isToday = time.toDateString() === new Date().toDateString();
  return isToday
    ? `Very well, sir. I'll remind you about "${title}" at ${timeStr} today.`
    : `Understood. I'll remind you about "${title}" on ${date} at ${timeStr}.`;
}
