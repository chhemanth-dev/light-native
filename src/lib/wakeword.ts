/**
 * Wake word detection — listens for "Hey Light" using Android's
 * SpeechRecognizer in continuous mode. Fires a callback on match.
 *
 * IMPROVEMENTS:
 * - Prevents conflicts with main speech recognition
 * - Pauses during active sessions
 * - Auto-restarts after errors
 * - More reliable phrase matching
 */
import { NativeModules, NativeEventEmitter, Platform, AppState } from "react-native";

const WakeWordModule = Platform.OS === "android" ? NativeModules.WakeWordModule : null;

const WAKE_PHRASES = [
  "hey light",
  "hey, light",
  "hey lite",   // common mishear
  "a light",    // common mishear
  "hey light!",
  "heylight",   // no space
  "light",      // if very clear
];

export function matchesWakePhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  
  // Exact matches
  if (WAKE_PHRASES.some((p) => lower === p)) {
    return true;
  }
  
  // Contains "light" with "hey" nearby
  if (lower.includes("light") && lower.includes("hey")) {
    return true;
  }
  
  // Just "light" at the start (common when clear)
  if (lower.startsWith("light ") || lower === "light") {
    return true;
  }
  
  return false;
}

let _emitter: NativeEventEmitter | null = null;
let _partialListener: ReturnType<NativeEventEmitter["addListener"]> | null = null;
let _appStateListener: ReturnType<typeof AppState.addEventListener> | null = null;
let _running = false;
let _paused = false; // New: track if temporarily paused

/**
 * Start continuous wake-word listening.
 * onWake fires when "hey light" is detected.
 * onTranscript fires with every partial result (for debug / display).
 */
export function startWakeWord(
  onWake: () => void,
  onTranscript?: (text: string) => void
) {
  if (Platform.OS !== "android" || !WakeWordModule) {
    console.log("[WakeWord] Not available on this platform");
    return;
  }
  
  if (_running) {
    console.log("[WakeWord] Already running");
    return;
  }
  
  _running = true;
  _paused = false;
  
  console.log("[WakeWord] 🎤 Starting wake word detection...");

  if (!_emitter) _emitter = new NativeEventEmitter(WakeWordModule);

  // Listen to partial speech results from native
  _partialListener = _emitter.addListener(
    "onSpeechPartial",
    (data: { transcript: string }) => {
      if (_paused) return; // Don't process if paused
      
      const transcript = data.transcript || "";
      onTranscript?.(transcript);
      
      if (matchesWakePhrase(transcript)) {
        console.log("[WakeWord] ✅ Wake phrase detected:", transcript);
        onWake();
        // Briefly pause to prevent double-fire
        pauseTemporarily(1000);
      }
    }
  );

  // Restart when app comes back to foreground
  _appStateListener = AppState.addEventListener("change", (state) => {
    if (state === "active" && _running && !_paused) {
      console.log("[WakeWord] App active, restarting...");
      restartNative();
    }
  });

  try {
    WakeWordModule.start();
    console.log("[WakeWord] ✅ Started successfully");
  } catch (error) {
    console.error("[WakeWord] ❌ Failed to start:", error);
  }
}

/**
 * Temporarily pause wake word (e.g., during active session)
 */
export function pauseWakeWord() {
  if (!_running) return;
  console.log("[WakeWord] ⏸️ Paused");
  _paused = true;
  if (WakeWordModule) {
    try {
      WakeWordModule.stop();
    } catch (error) {
      console.error("[WakeWord] Error pausing:", error);
    }
  }
}

/**
 * Resume wake word after pause
 */
export function resumeWakeWord() {
  if (!_running) return;
  console.log("[WakeWord] ▶️ Resumed");
  _paused = false;
  if (WakeWordModule) {
    try {
      WakeWordModule.start();
    } catch (error) {
      console.error("[WakeWord] Error resuming:", error);
    }
  }
}

/**
 * Temporarily pause for a duration (prevents double-firing)
 */
function pauseTemporarily(ms: number) {
  _paused = true;
  setTimeout(() => {
    _paused = false;
    if (_running && WakeWordModule) {
      restartNative();
    }
  }, ms);
}

function restartNative() {
  if (!WakeWordModule || !_running || _paused) return;
  
  console.log("[WakeWord] 🔄 Restarting...");
  
  try {
    WakeWordModule.stop();
  } catch (error) {
    console.error("[WakeWord] Error stopping:", error);
  }
  
  setTimeout(() => {
    if (_running && !_paused) {
      try {
        WakeWordModule.start();
        console.log("[WakeWord] ✅ Restarted");
      } catch (error) {
        console.error("[WakeWord] Error restarting:", error);
      }
    }
  }, 600);
}

export function stopWakeWord() {
  if (!WakeWordModule) return;
  
  console.log("[WakeWord] 🛑 Stopping...");
  
  _running = false;
  _paused = false;
  
  _partialListener?.remove();
  _partialListener = null;
  
  _appStateListener?.remove();
  _appStateListener = null;
  
  try {
    WakeWordModule.stop();
    console.log("[WakeWord] ✅ Stopped");
  } catch (error) {
    console.error("[WakeWord] Error stopping:", error);
  }
}
