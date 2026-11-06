/**
 * Main screen — the orb, wake-word trigger, conversation display, draft reply sheet.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  SafeAreaView, AppState, PermissionsAndroid, Platform,
} from "react-native";
import * as Network from "expo-network";
import { useAssistant } from "../../src/hooks/useAssistant";
import { useWakeWord } from "../../src/hooks/useWakeWord";
import { useNotificationListener } from "../../src/hooks/useNotifications";
import { useAppStore } from "../../src/store/appStore";
import { OrbAnimation } from "../../src/components/OrbAnimation";
import { TranscriptBubble } from "../../src/components/TranscriptBubble";
import { AssistantStatusBar } from "../../src/components/StatusBar";
import { DraftReplySheet } from "../../src/components/DraftReplySheet";

function extractDraft(response: string): string | null {
  const patterns = [
    /suggested reply[:\s]+"?([^"]+)"?/i,
    /you could (?:reply|say)[:\s]+"?([^"]+)"?/i,
    /draft[:\s]+"?([^"]+)"?/i,
    /reply[:\s]+"([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = p.exec(response);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

async function askMicPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Access",
        message: 'Light needs the microphone to hear "Hey Light" and your voice commands.',
        buttonPositive: "Allow",
        buttonNegative: "Deny",
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export default function HomeScreen() {
  const {
    assistantState, currentTranscript, lastResponse, isOffline,
    beginSession, startListening, endCurrentSession,
  } = useAssistant();

  const { unreadCount, setIsOffline, ownerName } = useAppStore();
  const scrollRef  = useRef<ScrollView>(null);
  const [connected, setConnected] = useState(true);
  const [micGranted, setMicGranted] = useState(false);

  // Draft sheet
  const [draftVisible, setDraftVisible] = useState(false);
  const [draftText,    setDraftText]    = useState("");
  const [draftSender,  setDraftSender]  = useState("");
  const [draftApp,     setDraftApp]     = useState("");
  const [draftOriginal, setDraftOriginal] = useState("");

  // Request mic on mount
  useEffect(() => {
    askMicPermission().then(setMicGranted);
  }, []);

  // Network polling
  useEffect(() => {
    const check = async () => {
      try {
        const s = await Network.getNetworkStateAsync();
        const online = s.isConnected ?? true;
        setConnected(online);
        setIsOffline(!online);
      } catch { /* assume online */ }
    };
    check();
    const interval = setInterval(check, 10_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);

  // Notification listener
  useNotificationListener();

  // Wake word (only when mic is granted)
  useWakeWord(async () => {
    await beginSession();
    await startListening();
  }, micGranted);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [lastResponse, currentTranscript]);

  // Show draft sheet when AI suggests a reply
  useEffect(() => {
    if (!lastResponse) return;
    const draft = extractDraft(lastResponse);
    if (!draft) return;
    const t = setTimeout(() => {
      setDraftText(draft);
      setDraftSender("Contact");
      setDraftApp("Messages");
      setDraftOriginal("");
      setDraftVisible(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [lastResponse]);

  async function handleOrbPress() {
    try {
      if (assistantState !== "idle") {
        endCurrentSession();
        return;
      }
      const hasMic = micGranted || (await askMicPermission());
      if (!hasMic) return;
      setMicGranted(true);
      await beginSession();
      await startListening();
    } catch {
      // Silently ignore — user can tap again
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LIGHT</Text>
        <Text style={styles.headerSub}>
          {greeting}{ownerName && ownerName !== "there" ? `, ${ownerName}` : ""}
        </Text>
      </View>

      {/* Status bar */}
      <AssistantStatusBar state={assistantState} unreadCount={unreadCount} isOffline={!connected} />

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!currentTranscript && !lastResponse && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {micGranted ? 'Say "Hey Light" or tap the orb' : "Tap the orb to enable microphone"}
            </Text>
            <View style={styles.quickTips}>
              {[
                "Do I have any messages?",
                "Remind me at 7pm to call mum",
                "What are my reminders?",
                "What time is it?",
              ].map((tip) => (
                <View key={tip} style={styles.tipChip}>
                  <Text style={styles.tipText}>"{tip}"</Text>
                </View>
              ))}
            </View>
            {unreadCount > 0 && (
              <Pressable
                style={styles.unreadChip}
                onPress={async () => { await beginSession(); setTimeout(startListening, 200); }}
              >
                <Text style={styles.unreadChipText}>
                  📩 {unreadCount} unread message{unreadCount > 1 ? "s" : ""} — tap to read aloud
                </Text>
              </Pressable>
            )}
          </View>
        )}
        <TranscriptBubble transcript={currentTranscript} response={lastResponse} isOffline={isOffline} />
      </ScrollView>

      {/* Orb */}
      <View style={styles.orbArea}>
        <OrbAnimation state={assistantState} onPress={handleOrbPress} size={140} />
        <Text style={styles.orbHint}>
          {assistantState === "idle"      ? (micGranted ? "tap to speak" : "tap to allow mic")
          : assistantState === "listening" ? "listening..."
          : assistantState === "thinking"  ? "thinking..."
          : assistantState === "speaking"  ? "tap to stop"
          : "tap to retry"}
        </Text>
      </View>

      {/* End session */}
      {assistantState !== "idle" && (
        <Pressable style={styles.endBtn} onPress={endCurrentSession}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      )}

      {/* Draft reply sheet */}
      <DraftReplySheet
        visible={draftVisible}
        senderName={draftSender}
        appName={draftApp}
        originalMessage={draftOriginal}
        draftReply={draftText}
        onClose={() => setDraftVisible(false)}
        onEdit={setDraftText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050810" },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { color: "#E2E8F0", fontSize: 11, letterSpacing: 6, fontWeight: "300" },
  headerSub:   { color: "#334155", fontSize: 13, marginTop: 2 },
  scroll:      { flex: 1 },
  scrollContent: {
    flexGrow: 1, padding: 16, justifyContent: "flex-end", gap: 12, paddingBottom: 20,
  },
  emptyState:  { alignItems: "center", paddingVertical: 32, gap: 16 },
  emptyText:   { color: "#334155", fontSize: 14, textAlign: "center" },
  quickTips:   { gap: 8, alignItems: "center" },
  tipChip: {
    backgroundColor: "#0A0F1E", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "#1E293B",
  },
  tipText: { color: "#475569", fontSize: 12, fontStyle: "italic" },
  unreadChip: {
    backgroundColor: "#0F1F3D", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "#1D4ED8", marginTop: 8,
  },
  unreadChipText: { color: "#93C5FD", fontSize: 13, textAlign: "center" },
  orbArea:   { alignItems: "center", paddingVertical: 24, gap: 8 },
  orbHint:   { color: "#334155", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  endBtn: {
    marginHorizontal: 60, marginBottom: 12,
    backgroundColor: "#1A0A0A", borderWidth: 1, borderColor: "#7F1D1D",
    borderRadius: 12, padding: 12, alignItems: "center",
  },
  endBtnText: { color: "#FCA5A5", fontSize: 13, fontWeight: "600" },
});
