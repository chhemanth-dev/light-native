/**
 * useAssistant — React hook that wires the LightAssistant to UI state.
 * Handles microphone input via Android's SpeechRecognizer (NativeModule).
 */
import { useEffect, useRef, useCallback } from "react";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { useAppStore } from "../store/appStore";
import { assistant } from "../lib/assistant";
import { startSession, endSession } from "../lib/db";
import * as Haptics from "expo-haptics";

const SpeechModule = Platform.OS === "android" ? NativeModules.SpeechModule : null;
let _speechEmitter: NativeEventEmitter | null = null;

export function useAssistant() {
  const {
    assistantState,
    currentTranscript,
    lastResponse,
    sessionId,
    isOffline,
    setAssistantState,
    setCurrentTranscript,
    setLastResponse,
    setSessionId,
    setIsOffline,
  } = useAppStore();

  const listeningRef    = useRef(false);
  const sessionActiveRef = useRef(false);

  // Wire assistant events → store
  useEffect(() => {
    const unsub = assistant.on((event) => {
      if (event.type === "state_change") setAssistantState(event.state);
      if (event.type === "transcript")   setCurrentTranscript(event.text);
      if (event.type === "response") {
        setLastResponse(event.text);
        setIsOffline(event.offline);
      }
    });
    return unsub;
  }, []);

  // Set up speech emitter once
  useEffect(() => {
    if (Platform.OS === "android" && SpeechModule && !_speechEmitter) {
      _speechEmitter = new NativeEventEmitter(SpeechModule);
    }
  }, []);

  /**
   * Begin a new session.
   * Does NOT speak a greeting automatically — avoids conflicting with
   * startListening() that the caller will invoke right after.
   */
  const beginSession = useCallback(async () => {
    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { /* haptics not available */ }

    const sid = await startSession();
    setSessionId(sid);
    assistant.startSession(sid);
  }, []);

  /**
   * Start listening for a single voice command.
   * Returns a promise that resolves once listening has started (or failed).
   */
  const startListening = useCallback(async () => {
    if (listeningRef.current) return;
    if (Platform.OS !== "android" || !SpeechModule) return;

    listeningRef.current = true;
    setAssistantState("listening");
    console.log("[useAssistant] startListening() called");

    if (!_speechEmitter) {
      _speechEmitter = new NativeEventEmitter(SpeechModule);
    }

    let resultSub: ReturnType<NativeEventEmitter["addListener"]> | null = null;
    let errorSub:  ReturnType<NativeEventEmitter["addListener"]> | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      console.log("[useAssistant] Cleaning up listeners");
      resultSub?.remove();
      errorSub?.remove();
      if (timeoutId) clearTimeout(timeoutId);
      listeningRef.current = false;
    };

    resultSub = _speechEmitter.addListener(
      "onSpeechResult",
      async (data: { transcript: string }) => {
        console.log("[useAssistant] onSpeechResult:", data.transcript);
        cleanup();
        if (data.transcript?.trim()) {
          await assistant.handleInput(data.transcript.trim());
        } else {
          console.log("[useAssistant] Empty transcript, going idle");
          setAssistantState("idle");
        }
      }
    );

    errorSub = _speechEmitter.addListener(
      "onSpeechError",
      (data: { error: string }) => {
        console.error("[useAssistant] onSpeechError:", data.error);
        cleanup();
        setAssistantState("idle");
      }
    );

    // Add 10-second timeout - if no result, assume speech recognition failed
    timeoutId = setTimeout(() => {
      console.warn("[useAssistant] Speech recognition timeout after 10s");
      cleanup();
      setAssistantState("idle");
      // Show a message to user that speech wasn't detected
      setLastResponse("I didn't hear anything, sir. Please try again and speak clearly.");
    }, 10000);

    try {
      console.log("[useAssistant] Calling SpeechModule.startListening");
      await SpeechModule.startListening("en-US");
      console.log("[useAssistant] SpeechModule.startListening called");
    } catch (error) {
      console.error("[useAssistant] SpeechModule.startListening error:", error);
      cleanup();
      setAssistantState("idle");
    }
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { SpeechModule?.stopListening?.(); } catch { /* ignore */ }
  }, []);

  const endCurrentSession = useCallback(async () => {
    const sid = sessionId;
    if (sid) {
      await endSession(sid);
      setSessionId(null);
    }
    sessionActiveRef.current = false;
    await assistant.endSession();
  }, [sessionId]);

  return {
    assistantState,
    currentTranscript,
    lastResponse,
    sessionId,
    isOffline,
    beginSession,
    startListening,
    stopListening,
    endCurrentSession,
    isListening: listeningRef.current,
    isSpeaking:  assistantState === "speaking",
    isThinking:  assistantState === "thinking",
  };
}
