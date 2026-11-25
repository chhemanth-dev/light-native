/**
 * Settings screen — privacy controls, PIN change, data management.
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, SafeAreaView,
  Alert, ScrollView, TextInput, Modal,
} from "react-native";
import { router } from "expo-router";
import { getOwnerName, hasBiometrics } from "../../src/lib/vault";
import { forgetAllSessions, deleteOldMessages } from "../../src/lib/db";
import { cancelAllReminders } from "../../src/lib/reminders";
import { isNotificationListenerEnabled, openNotificationListenerSettings } from "../../src/lib/notifications";
import { isGeminiNanoAvailable } from "../../src/lib/gemini";
import { useAppStore } from "../../src/store/appStore";
import { speak } from "../../src/lib/voice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT_CONFIG } from "../../src/lib/light-config";
import { saveAIConfidence } from "../../src/lib/config-loader";

export default function SettingsScreen() {
  const [ownerName, setOwnerNameState] = useState("");
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [nlEnabled, setNlEnabled] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(LIGHT_CONFIG.ai.confidenceThreshold);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [confidenceInput, setConfidenceInput] = useState('70');
  const { setLocked } = useAppStore();

  useEffect(() => {
    getOwnerName().then(setOwnerNameState);
    hasBiometrics().then(setBiometricsAvailable);
    isNotificationListenerEnabled().then(setNlEnabled);
    isGeminiNanoAvailable().then(setGeminiAvailable);
    
    // Load saved AI confidence
    AsyncStorage.getItem('ai_confidence_threshold').then((value) => {
      if (value) {
        const confidence = parseFloat(value);
        setAiConfidence(confidence);
        // Update config in memory
        (LIGHT_CONFIG.ai as any).confidenceThreshold = confidence;
      }
    });
  }, []);

  function handleLock() {
    setLocked(true);
    router.replace("/lock");
  }

  function handleForgetHistory() {
    Alert.alert(
      "Forget conversation history?",
      "This clears all chat sessions. Your messages and reminders are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear history",
          style: "destructive",
          onPress: async () => {
            await forgetAllSessions();
            speak("Conversation history cleared, sir.");
          },
        },
      ]
    );
  }

  function handleDeleteOldMessages() {
    Alert.alert(
      "Delete messages older than 7 days?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteOldMessages(7);
            speak("Old messages deleted, sir.");
          },
        },
      ]
    );
  }

  function handleCancelReminders() {
    Alert.alert("Cancel all reminders?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Cancel all",
        style: "destructive",
        onPress: async () => {
          await cancelAllReminders();
          speak("All reminders cancelled, sir.");
        },
      },
    ]);
  }

  function handleChangeConfidence() {
    setConfidenceInput((aiConfidence * 100).toFixed(0));
    setShowConfidenceModal(true);
  }

  async function saveConfidence() {
    const value = parseInt(confidenceInput);
    if (isNaN(value) || value < 0 || value > 100) {
      Alert.alert("Invalid", "Please enter a number between 0 and 100");
      return;
    }
    
    const confidence = value / 100;
    setAiConfidence(confidence);
    await saveAIConfidence(confidence);
    setShowConfidenceModal(false);
    speak(`Confidence threshold set to ${value} percent, sir.`);
  }

  const Section = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const Row = ({
    label,
    value,
    onPress,
    destructive,
    badge,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    destructive?: boolean;
    badge?: { text: string; color: string };
  }) => (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color + "22" }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        )}
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* AI Confidence Modal */}
        <Modal
          visible={showConfidenceModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfidenceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>AI Confidence Threshold</Text>
              <Text style={styles.modalDesc}>
                Current: {(aiConfidence * 100).toFixed(0)}%{'\n\n'}
                Light will only execute actions when confidence is above this threshold.{'\n\n'}
                Lower = more actions{'\n'}
                Higher = fewer but more accurate{'\n\n'}
                Enter new threshold (0-100):
              </Text>
              <TextInput
                style={styles.modalInput}
                value={confidenceInput}
                onChangeText={setConfidenceInput}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowConfidenceModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={saveConfidence}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Section title="ACCOUNT" />
        <View style={styles.group}>
          <Row label="Name" value={ownerName} />
          <Row
            label="Change PIN"
            onPress={() => {
              Alert.alert("Change PIN", "Feature: enter current PIN then new PIN.");
            }}
          />
          <Row
            label="Biometric unlock"
            badge={
              biometricsAvailable
                ? { text: "Available", color: "#34D399" }
                : { text: "Not available", color: "#EF4444" }
            }
          />
        </View>

        <Section title="PERMISSIONS" />
        <View style={styles.group}>
          <Row
            label="Notification access"
            badge={
              nlEnabled
                ? { text: "Enabled", color: "#34D399" }
                : { text: "Disabled", color: "#EF4444" }
            }
            onPress={nlEnabled ? undefined : openNotificationListenerSettings}
          />
        </View>

        <Section title="AI ENGINE" />
        <View style={styles.group}>
          <Row
            label="AI Confidence Threshold"
            value={`${(aiConfidence * 100).toFixed(0)}%`}
            onPress={handleChangeConfidence}
          />
          <Row
            label="AI Provider & API Keys"
            onPress={() => router.push('/ai-settings')}
            value="Manage →"
          />
          <Row
            label="Gemini Nano (on-device)"
            badge={
              geminiAvailable
                ? { text: "Ready", color: "#34D399" }
                : { text: "Not available", color: "#F59E0B" }
            }
          />
          {!geminiAvailable && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Gemini Nano requires Android 14+ with AICore. Using cloud AI as primary.
              </Text>
            </View>
          )}
        </View>

        <Section title="PRIVACY" />
        <View style={styles.group}>
          <Row
            label="Manage Contacts"
            onPress={() => router.push('/contacts')}
            value="View →"
          />
          <Row
            label="View conversation history"
            onPress={() => router.push('/conversation-history')}
            value="View →"
          />
          <Row
            label="Clear conversation history"
            onPress={handleForgetHistory}
          />
          <Row
            label="Delete messages older than 7 days"
            onPress={handleDeleteOldMessages}
          />
          <Row
            label="Cancel all reminders"
            onPress={handleCancelReminders}
            destructive
          />
        </View>

        <Section title="DEBUGGING" />
        <View style={styles.group}>
          <Row
            label="Error Logs"
            onPress={() => router.push('/error-logs')}
            value="View →"
          />
        </View>

        <Pressable style={styles.lockBtn} onPress={handleLock}>
          <Text style={styles.lockBtnText}>🔒  Lock Light</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050810" },
  scroll: { padding: 20, gap: 6, paddingBottom: 48 },
  title: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#334155",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  group: {
    backgroundColor: "#0A0F1E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#0F172A",
  },
  rowLabel: { flex: 1, color: "#CBD5E1", fontSize: 14 },
  rowLabelDestructive: { color: "#FCA5A5" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { color: "#475569", fontSize: 13 },
  rowChevron: { color: "#334155", fontSize: 18 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#0C0A00",
    borderRadius: 8,
  },
  infoText: { color: "#92400E", fontSize: 12, lineHeight: 18 },
  lockBtn: {
    marginTop: 24,
    backgroundColor: "#0A0F1E",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  lockBtnText: { color: "#64748B", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#0A0F1E",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalTitle: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalDesc: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
    color: "#E2E8F0",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#1E293B",
  },
  modalButtonSave: {
    backgroundColor: "#6A4CFF",
  },
  modalButtonText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
  },
});
