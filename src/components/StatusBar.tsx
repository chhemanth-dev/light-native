import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { AssistantState } from "../lib/assistant";

type Props = {
  state: AssistantState;
  unreadCount: number;
  isOffline: boolean;
};

const STATE_LABELS: Record<AssistantState, string> = {
  idle: 'Say "Hey Light" or tap the orb',
  listening: "Listening...",
  thinking: "Processing...",
  speaking: "Speaking...",
  error: "Error — please try again",
};

const STATE_COLORS: Record<AssistantState, string> = {
  idle: "#475569",
  listening: "#22D3EE",
  thinking: "#A78BFA",
  speaking: "#34D399",
  error: "#EF4444",
};

export function AssistantStatusBar({ state, unreadCount, isOffline }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: STATE_COLORS[state] }]} />
      <Text style={[styles.label, { color: STATE_COLORS[state] }]}>
        {STATE_LABELS[state]}
      </Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount} new</Text>
        </View>
      )}
      {isOffline && (
        <View style={styles.offlineChip}>
          <Text style={styles.offlineText}>● offline</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    flex: 1,
  },
  badge: {
    backgroundColor: "#1D4ED8",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#BFDBFE",
    fontSize: 10,
    fontWeight: "700",
  },
  offlineChip: {
    backgroundColor: "#292524",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  offlineText: {
    color: "#F59E0B",
    fontSize: 10,
  },
});
