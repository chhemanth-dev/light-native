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
  "en-gb-x-gbd-network",
  "en-gb-x-gbc-network",
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
    for (const pref of JARVIS_VOICE_PREFERENCES) {
      const match = available.find(
        (v) =>
          v.identifier?.toLowerCase().includes(pref.toLowerCase()) ||
          v.language?.toLowerCase().startsWith(pref.toLowerCase().slice(0, 5))
      );
      if (match) {
        _voice = match.identifier;
        break;
      }
    }
  } catch {
    // ignore — will use system default
  }
  return _voice;
}

export async function speak(text: string, options: SpeakOptions = {}) {
  try {
    await initVoice();
    await Speech.stop();
    Speech.speak(text, {
      voice: _voice ?? undefined,
      language: "en-GB",
      rate: 0.88,
      pitch: 0.85,
      onStart: options.onStart,
      onDone: options.onDone,
      onStopped: options.onStopped,
    });
  } catch (e) {
    // TTS might not be available — fire onDone so the assistant doesn't hang
    console.warn("Speech failed:", e);
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
  fireAt: Date
): string {
  const time = fireAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = fireAt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const isToday = fireAt.toDateString() === new Date().toDateString();
  return isToday
    ? `Very well, sir. I'll remind you about "${title}" at ${time} today.`
    : `Understood. I'll remind you about "${title}" on ${date} at ${time}.`;
}
