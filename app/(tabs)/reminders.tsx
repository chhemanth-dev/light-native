/**
 * Reminders screen — list and manage scheduled reminders.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  SafeAreaView, RefreshControl, Alert,
} from "react-native";
import { getPendingReminders, deleteReminder, type Reminder } from "../../src/lib/db";
import { cancelAllReminders } from "../../src/lib/reminders";
import { speak } from "../../src/lib/voice";
import { formatRemindersForSpeech } from "../../src/lib/reminders";

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const r = await getPendingReminders();
    setReminders(r);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    Alert.alert("Delete reminder?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteReminder(id);
          await load();
        },
      },
    ]);
  }

  async function handleReadAll() {
    speak(formatRemindersForSpeech(reminders));
  }

  function formatFireAt(ts: number) {
    const d = new Date(ts);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? `Today at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
      : d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  const renderItem = ({ item }: { item: Reminder }) => {
    const isPast = item.fire_at < Date.now();
    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        <View style={styles.cardHeader}>
          <Text style={styles.reminderIcon}>⏰</Text>
          <View style={styles.cardBody}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={[styles.reminderTime, isPast && styles.reminderTimePast]}>
              {formatFireAt(item.fire_at)}
              {item.repeat_interval ? `  ·  repeats ${item.repeat_interval}` : ""}
            </Text>
          </View>
          <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        {reminders.length > 0 && (
          <Pressable style={styles.readAllBtn} onPress={handleReadAll}>
            <Text style={styles.readAllText}>Read aloud</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.voiceHint}>
        <Text style={styles.voiceHintText}>
          💡 Say "Remind me to call mum at 6pm" to Light
        </Text>
      </View>

      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reminders set.</Text>
            <Text style={styles.emptySubText}>
              Ask Light to remind you about anything.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050810" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  readAllBtn: {
    backgroundColor: "#0F1F3D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  readAllText: { color: "#93C5FD", fontSize: 12 },
  voiceHint: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#0A0F1E",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  voiceHintText: { color: "#475569", fontSize: 12 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: "#0A0F1E",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardPast: { opacity: 0.5 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  reminderIcon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 3 },
  reminderTitle: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
  reminderTime: { color: "#3B82F6", fontSize: 12 },
  reminderTimePast: { color: "#475569" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A0A0A",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#FCA5A5", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { color: "#334155", fontSize: 15 },
  emptySubText: { color: "#1E293B", fontSize: 12, textAlign: "center", maxWidth: 240 },
});
