/**
 * Global app state — Zustand store.
 * Manages lock state, session, notifications badge, assistant state.
 */
import { create } from "zustand";
import type { AssistantState } from "../lib/assistant";

type AppStore = {
  // Auth
  isLocked: boolean;
  isSetupDone: boolean;
  ownerName: string;

  // Assistant
  assistantState: AssistantState;
  currentTranscript: string;
  lastResponse: string;
  sessionId: string | null;
  isOffline: boolean;

  // Messages
  unreadCount: number;
  hasNewNotification: boolean;

  // Actions
  setLocked: (locked: boolean) => void;
  setSetupDone: (done: boolean) => void;
  setOwnerName: (name: string) => void;
  setAssistantState: (state: AssistantState) => void;
  setCurrentTranscript: (text: string) => void;
  setLastResponse: (text: string) => void;
  setSessionId: (id: string | null) => void;
  setIsOffline: (offline: boolean) => void;
  setUnreadCount: (count: number) => void;
  setHasNewNotification: (val: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isLocked: true,
  isSetupDone: false,
  ownerName: "there",
  assistantState: "idle",
  currentTranscript: "",
  lastResponse: "",
  sessionId: null,
  isOffline: false,
  unreadCount: 0,
  hasNewNotification: false,

  setLocked: (locked) => set({ isLocked: locked }),
  setSetupDone: (done) => set({ isSetupDone: done }),
  setOwnerName: (name) => set({ ownerName: name }),
  setAssistantState: (state) => set({ assistantState: state }),
  setCurrentTranscript: (text) => set({ currentTranscript: text }),
  setLastResponse: (text) => set({ lastResponse: text }),
  setSessionId: (id) => set({ sessionId: id }),
  setIsOffline: (offline) => set({ isOffline: offline }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setHasNewNotification: (val) => set({ hasNewNotification: val }),
}));
