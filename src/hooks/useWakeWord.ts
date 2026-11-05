import { useEffect, useRef } from "react";
import { startWakeWord, stopWakeWord } from "../lib/wakeword";
import { useAppStore } from "../store/appStore";

export function useWakeWord(onWake: () => void, micGranted = false) {
  const { isLocked } = useAppStore();
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  useEffect(() => {
    // Don't start wake-word if app is locked or mic permission not yet granted
    if (isLocked || !micGranted) return;

    startWakeWord(() => onWakeRef.current());

    return () => stopWakeWord();
  }, [isLocked, micGranted]);
}
