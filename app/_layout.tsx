/**
 * Root layout — handles first-run setup and lock-screen routing.
 *
 * KEY FIX: router.replace() is called in a SEPARATE useEffect that fires
 * only AFTER `ready` becomes true, i.e. after the <Stack> tree is mounted.
 * Calling it in the same effect that sets state caused "Attempted to
 * navigate before mounting the Root Layout" on Android.
 */
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";
import { isSetupDone } from "../src/lib/vault";
import { getDb } from "../src/lib/db";
import { useAppStore } from "../src/store/appStore";
import { router } from "expo-router";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"/setup" | "/lock" | null>(null);
  const { setSetupDone, setLocked } = useAppStore();

  // Step 1 — initialise DB and decide which route to start on
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
        // Secure store failure on first run — go to setup
        setInitialRoute("/setup");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Step 2 — navigate only once the <Stack> is rendered
  useEffect(() => {
    if (ready && initialRoute) {
      router.replace(initialRoute);
    }
  }, [ready, initialRoute]);

  // Handle notification tap (reminder fired while app was closed)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "reminder") {
        router.push("/(tabs)/reminders");
      }
    });
    return () => sub.remove();
  }, []);

  // Show blank dark screen while initialising — prevents white flash
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
});
