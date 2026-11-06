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
import { useAppStore } from "../store/appStore";
import { router } from "expo-router";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"/setup" | "/lock" | null>(null);
  const [error, setError] = useState(false);
  const { setSetupDone, setLocked } = useAppStore();

  useEffect(() => {
    (async () => {
      try {
        await getDb();
        const setup = await isSetupDone();
        setSetupDone(setup);
        if (!setup) {
          setInitialRoute("/setup");
        } else {
          setLocked(true);
          setInitialRoute("/lock");
        }
      } catch {
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
