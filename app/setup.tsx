/**
 * First-run setup screen.
 * User enters their name + a 4-digit PIN to lock the app.
 * Shown only once — on first launch.
 */
import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import { completeSetup } from "../src/lib/vault";
import { requestNotificationPermission } from "../src/lib/reminders";
import { isNotificationListenerEnabled, openNotificationListenerSettings } from "../src/lib/notifications";
import { useAppStore } from "../src/store/appStore";
import { initVoice } from "../src/lib/voice";

export default function SetupScreen() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"name" | "pin" | "permissions">("name");
  const [loading, setLoading] = useState(false);
  const { setSetupDone, setOwnerName } = useAppStore();

  async function handleNameNext() {
    if (!name.trim()) {
      Alert.alert("Please enter your name.");
      return;
    }
    setStep("pin");
  }

  async function handlePinNext() {
    if (pin.length !== 4) {
      Alert.alert("PIN must be 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("PINs do not match.");
      return;
    }
    setStep("permissions");
  }

  async function handlePermissions() {
    setLoading(true);
    try {
      // Notification permission
      await requestNotificationPermission();

      // Notification Listener (for reading app notifications)
      const nlEnabled = await isNotificationListenerEnabled();
      if (!nlEnabled) {
        Alert.alert(
          "Notification Access Required",
          "Light needs notification access to read your messages hands-free. " +
            "Please enable 'Light' in the Notification Access settings that will open.",
          [
            {
              text: "Open Settings",
              onPress: () => openNotificationListenerSettings(),
            },
            { text: "Skip for now", style: "cancel" },
          ]
        );
      }

      // Save credentials
      await completeSetup(name.trim(), pin);
      await initVoice();

      setOwnerName(name.trim());
      setSetupDone(true);

      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoOrb} />
          <Text style={styles.logoText}>LIGHT</Text>
          <Text style={styles.logoSub}>Your personal AI assistant</Text>
        </View>

        {step === "name" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What's your name?</Text>
            <Text style={styles.cardSub}>
              Light will use this to address you.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNameNext}
            />
            <Pressable style={styles.btn} onPress={handleNameNext}>
              <Text style={styles.btnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === "pin" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set a PIN</Text>
            <Text style={styles.cardSub}>
              This locks Light so only you can access your messages.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="4-digit PIN"
              placeholderTextColor="#475569"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm PIN"
              placeholderTextColor="#475569"
              value={confirmPin}
              onChangeText={(t) => setConfirmPin(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handlePinNext}
            />
            <Pressable style={styles.btn} onPress={handlePinNext}>
              <Text style={styles.btnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === "permissions" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grant Access</Text>
            <Text style={styles.cardSub}>
              Light needs these to read your notifications and remind you hands-free.
            </Text>
            {[
              { icon: "🔔", label: "Notifications — for reminders" },
              { icon: "📩", label: "Notification Access — to read app messages" },
              { icon: "🎤", label: "Microphone — for voice commands" },
            ].map((item) => (
              <View key={item.label} style={styles.permRow}>
                <Text style={styles.permIcon}>{item.icon}</Text>
                <Text style={styles.permLabel}>{item.label}</Text>
              </View>
            ))}
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handlePermissions}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? "Setting up..." : "Grant & Get Started"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050810" },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  logoArea: { alignItems: "center", gap: 8 },
  logoOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0A1628",
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: "#E2E8F0",
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 10,
  },
  logoSub: { color: "#475569", fontSize: 13, letterSpacing: 1 },
  card: {
    width: "100%",
    backgroundColor: "#0A0F1E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 24,
    gap: 16,
  },
  cardTitle: { color: "#E2E8F0", fontSize: 20, fontWeight: "600" },
  cardSub: { color: "#64748B", fontSize: 13, lineHeight: 20 },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "#E2E8F0",
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  permIcon: { fontSize: 20 },
  permLabel: { color: "#94A3B8", fontSize: 14 },
});
