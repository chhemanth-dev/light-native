/**
 * Wake word detection — listens for "Hey Light" using Android's
 * SpeechRecognizer in continuous mode. Fires a callback on match.
 *
 * The native module (WakeWordModule.kt) wraps Android SpeechRecognizer
 * so it can run while the screen is on/off without needing an internet connection
 * for simple keyword spotting.
 */
import { NativeModules, NativeEventEmitter, Platform, AppState } from "react-native";

const { WakeWordModule } = NativeModules;

const WAKE_PHRASES = [
  "hey light",
  "hey, light",
  "hey lite",   // common mishear
  "a light",    // common mishear
  "hey light!",
];

export function matchesWakePhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return WAKE_PHRASES.some((p) => lower.includes(p));
}

let _emitter: NativeEventEmitter | null = null;
let _partialListener: ReturnType<NativeEventEmitter["addListener"]> | null = null;
let _appStateListener: ReturnType<typeof AppState.addEventListener> | null = null;
let _running = false;

/**
 * Start continuous wake-word listening.
 * onWake fires when "hey light" is detected.
 * onTranscript fires with every partial result (for debug / display).
 */
export function startWakeWord(
  onWake: () => void,
  onTranscript?: (text: string) => void
) {
  if (Platform.OS !== "android" || !WakeWordModule) return;
  if (_running) return;
  _running = true;

  if (!_emitter) _emitter = new NativeEventEmitter(WakeWordModule);

  // Listen to partial speech results from native
  _partialListener = _emitter.addListener(
    "onSpeechPartial",
    (data: { transcript: string }) => {
      onTranscript?.(data.transcript);
      if (matchesWakePhrase(data.transcript)) {
        onWake();
        // Briefly pause and restart so it doesn't double-fire
        restartNative();
      }
    }
  );

  // Restart when app comes back to foreground
  _appStateListener = AppState.addEventListener("change", (state) => {
    if (state === "active" && _running) {
      restartNative();
    }
  });

  WakeWordModule.start();
}

function restartNative() {
  if (!WakeWordModule || !_running) return;
  try {
    WakeWordModule.stop();
  } catch { /* ignore */ }
  setTimeout(() => {
    if (_running) {
      try {
        WakeWordModule.start();
      } catch { /* ignore */ }
    }
  }, 600);
}

export function stopWakeWord() {
  if (!WakeWordModule) return;
  _running = false;
  _partialListener?.remove();
  _partialListener = null;
  _appStateListener?.remove();
  _appStateListener = null;
  try {
    WakeWordModule.stop();
  } catch { /* ignore */ }
}
