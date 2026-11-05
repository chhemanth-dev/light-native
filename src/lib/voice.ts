/**
 * Light's voice — Jarvis-style deep British male TTS.
 * Uses expo-speech with tuned pitch/rate and the best available UK English voice.
 * No external API needed — fully on-device.
 */
import * as Speech from "expo-speech";

export type SpeakOptions = {
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
};

const JARVIS_VOICE_PREFERENCES = [
  // Android Google TTS UK voices (best quality first)
  "en-gb-x-gbd-network",  // Google UK English Male (neural)
  "en-gb-x-gbc-network",  // Google UK English Male (neural alt)
  "en-gb-x-gbd-local",
  "en_GB",
  "en-GB",
  "en-US",                // fallback
];

let _voice: string | null = null;

export async function initVoice() {
  if (_voice) return _voice;
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
  await initVoice();
  // Stop anything currently playing
  await Speech.stop();

  Speech.speak(text, {
    voice: _voice ?? undefined,
    language: "en-GB",
    // Jarvis characteristics: measured pace, slightly lower pitch, calm
    rate: 0.88,   // slightly slower than default (1.0)
    pitch: 0.85,  // slightly deeper
    onStart: options.onStart,
    onDone: options.onDone,
    onStopped: options.onStopped,
  });
}

export async function stopSpeaking() {
  await Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/**
 * Formats a message list into what Light will read aloud.
 * E.g. "You have 3 unread messages. From WhatsApp: John says, are you coming tonight?
 *       From Gmail: Sarah says, your invoice is ready."
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
    .slice(0, 5) // cap at 5 for speech length
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
  const isToday =
    fireAt.toDateString() === new Date().toDateString();
  return isToday
    ? `Very well, sir. I'll remind you about "${title}" at ${time} today.`
    : `Understood. I'll remind you about "${title}" on ${date} at ${time}.`;
}
