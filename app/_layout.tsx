/**
 * Root layout — handles first-run setup and lock-screen routing.
 */
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, Text, Pressable } from "react-native";
import * as Notifications from "expo-notifications";
import { isSetupDone } from "../src/lib/vault";
import { getDb } from "../src/lib/db";
import { useAppStore } from "../src/store/appStore";
import { router } from "expo-router";
import { initializeNotifications } from "../src/lib/notificationSetup";
import { initializeTraining } from "../src/lib/initialize-training";
import { loadUserPreferences } from "../src/lib/config-loader";

// Optional: Load API keys if local file exists (git-ignored for security)
let initializeMyAPIKeys: (() => Promise<void>) | null = null;
let loadSavedAPIKeys: (() => Promise<void>) | null = null;
try {
  const apiKeysModule = require("../src/config/init-api-keys.local");
  initializeMyAPIKeys = apiKeysModule.initializeMyAPIKeys;
  loadSavedAPIKeys = apiKeysModule.loadSavedAPIKeys;
} catch (e) {
  // Fallback to default module (no .local file)
  try {
    const apiKeysModule = require("../src/config/init-api-keys");
    loadSavedAPIKeys = apiKeysModule.loadSavedAPIKeys;
  } catch (err) {
    console.warn('[Setup] Could not load API keys module');
  }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"/setup" | "/lock" | null>(null);
  const [error, setError] = useState(false);
  const { setSetupDone, setLocked } = useAppStore();

  useEffect(() => {
    (async () => {
      try {
        // Initialize API keys FIRST
        // 1. Load from local file if available (for development)
        if (initializeMyAPIKeys) {
          await initializeMyAPIKeys();
        }
        
        // 2. Load saved keys from secure storage (for production use)
        if (loadSavedAPIKeys) {
          await loadSavedAPIKeys();
        }
        
        // Initialize Light AI training data (on first launch)
        // Run in background - don't await, don't block startup
        console.log("[RootLayout] 🚀 Starting Light AI training (background)...");
        initializeTraining().catch(err => {
          console.warn("[RootLayout] ⚠️ Light AI training initialization failed:", err);
          // Don't block app startup if training fails
        });
        
        // Load user preferences (AI confidence, etc.)
        console.log("[RootLayout] 📋 Loading user preferences...");
        await loadUserPreferences();
        
        // Initialize notifications (channels, permissions, handler)
        await initializeNotifications();
        
        // Then initialize database and check setup status
        await getDb();
        const setup = await isSetupDone();
        setSetupDone(setup);
        if (!setup) {
          setInitialRoute("/setup");
        } else {
          setLocked(true);
          setInitialRoute("/lock");
        }
      } catch (err) {
        console.error("Error during app initialization:", err);
        // If anything fails, go to setup so the user isn't stuck
        setInitialRoute("/setup");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready && initialRoute) {
      router.replace(initialRoute);
    }
  }, [ready, initialRoute]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "reminder") {
        router.push("/(tabs)/reminders");
      }
    });
    return () => sub.remove();
  }, []);

  // Error fallback — if something goes wrong, show a retry button
  if (error) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong starting Light.</Text>
          <Pressable style={styles.retryBtn} onPress={() => {
            setError(false);
            setReady(false);
            // Reload the window
            if (typeof window !== "undefined") window.location.reload();
          }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!ready) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="setup" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050810" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  errorText: { color: "#64748B", fontSize: 14, textAlign: "center" },
  retryBtn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
