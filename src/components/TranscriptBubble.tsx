import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

type Props = {
  transcript: string;
  response: string;
  isOffline: boolean;
};

export function TranscriptBubble({ transcript, response, isOffline }: Props) {
  if (!transcript && !response) return null;

  return (
    <View style={styles.container}>
      {!!transcript && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown} style={styles.userBubble}>
          <Text style={styles.userLabel}>YOU</Text>
          <Text style={styles.userText}>{transcript}</Text>
        </Animated.View>
      )}
      {!!response && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown} style={styles.lightBubble}>
          <View style={styles.lightHeader}>
            <Text style={styles.lightLabel}>LIGHT</Text>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>OFFLINE</Text>
              </View>
            )}
          </View>
          <Text style={styles.lightText}>{response}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 10,
  },
  userBubble: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  userLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },
  userText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  lightBubble: {
    backgroundColor: "#0C1428",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E40AF",
    padding: 14,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  lightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  lightLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#3B82F6",
    fontWeight: "700",
  },
  offlineBadge: {
    backgroundColor: "#451A03",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  offlineBadgeText: {
    fontSize: 8,
    color: "#F59E0B",
    fontWeight: "700",
    letterSpacing: 1,
  },
  lightText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 22,
  },
});
