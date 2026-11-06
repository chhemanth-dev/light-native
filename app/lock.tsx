/**
 * Lock screen — shown every time the app opens.
 * User unlocks via biometrics (fingerprint/face) or PIN.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Alert,
} from "react-native";
import { router } from "expo-router";
import { verifyPin, hasBiometrics, authenticateWithBiometrics, getOwnerName } from "../src/lib/vault";
import { useAppStore } from "../src/store/appStore";

export default function LockScreen() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [ownerName, setOwnerName] = useState("there");
  const [verifying, setVerifying] = useState(false);
  const { setLocked, setOwnerName: storeSetOwner } = useAppStore();
  const triedBiometrics = useRef(false);

  useEffect(() => {
    getOwnerName().then((n) => {
      setOwnerName(n);
      storeSetOwner(n);
    }).catch(() => {});
    if (!triedBiometrics.current) {
      triedBiometrics.current = true;
      tryBiometrics();
    }
  }, []);

  async function tryBiometrics() {
    try {
      const available = await hasBiometrics();
      if (!available) {
        setShowPin(true);
        return;
      }
      const ok = await authenticateWithBiometrics();
      if (ok) unlock();
      else setShowPin(true);
    } catch {
      setShowPin(true);
    }
  }

  function unlock() {
    setLocked(false);
    router.replace("/(tabs)");
  }

  async function submitPin(value: string) {
    if (verifying || value.length !== 4) return;
    setVerifying(true);
    try {
      const ok = await verifyPin(value);
      if (ok) {
        unlock();
      } else {
        Alert.alert("Wrong PIN", "Please try again.");
        setPin("");
      }
    } catch {
      Alert.alert("Error", "Could not verify PIN. Please try again.");
      setPin("");
    } finally {
      setVerifying(false);
    }
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.root}>
      <View style={styles.orb} />

      <Text style={styles.greeting}>{greeting},</Text>
      <Text style={styles.name}>{ownerName}</Text>

      {showPin ? (
        <View style={styles.pinArea}>
          <Text style={styles.pinLabel}>Enter your PIN</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, "").slice(0, 4);
              setPin(digits);
              if (digits.length === 4) {
                submitPin(digits);
              }
            }}
            keyboardType="number-pad"
            secureTextEntry
            autoFocus
            maxLength={4}
            placeholder="● ● ● ●"
            placeholderTextColor="#334155"
          />
        </View>
      ) : (
        <Pressable style={styles.biometricBtn} onPress={tryBiometrics}>
          <Text style={styles.biometricText}>🔒  Touch to unlock</Text>
        </Pressable>
      )}

      {!showPin && (
        <Pressable onPress={() => setShowPin(true)}>
          <Text style={styles.usePinText}>Use PIN instead</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050810",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0A1628",
    borderWidth: 2,
    borderColor: "#3B82F6",
    marginBottom: 16,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  greeting: { color: "#64748B", fontSize: 16 },
  name: {
    color: "#E2E8F0",
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  pinArea: { gap: 12, alignItems: "center", width: "80%" },
  pinLabel: { color: "#64748B", fontSize: 13, letterSpacing: 1 },
  pinInput: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "#E2E8F0",
    fontSize: 22,
    width: "100%",
    textAlign: "center",
    letterSpacing: 12,
  },
  biometricBtn: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E40AF",
    borderRadius: 50,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  biometricText: { color: "#3B82F6", fontSize: 16 },
  usePinText: { color: "#475569", fontSize: 13, marginTop: 8 },
});
