/**
 * Reminders screen — list and manage scheduled reminders.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  SafeAreaView, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from "react-native";
import { getPendingReminders, deleteReminder, type Reminder } from "../../src/lib/db";
import { cancelAllReminders, scheduleReminder } from "../../src/lib/reminders";
import { speak } from "../../src/lib/voice";
import { formatRemindersForSpeech } from "../../src/lib/reminders";

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

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
    try {
      speak(formatRemindersForSpeech(reminders)).catch(() => {});
    } catch { /* ignore */ }
  }

  async function handleAddReminder() {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    // Parse date and time
    let fireAt: number;
    
    if (newDate && newTime) {
      // User provided both date and time
      const [year, month, day] = newDate.split('-').map(Number);
      const [hours, minutes] = newTime.split(':').map(Number);
      fireAt = new Date(year, month - 1, day, hours, minutes).getTime();
    } else if (newTime) {
      // Only time provided, use today
      const [hours, minutes] = newTime.split(':').map(Number);
      const now = new Date();
      fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime();
      
      // If time already passed today, schedule for tomorrow
      if (fireAt < Date.now()) {
        fireAt += 24 * 60 * 60 * 1000;
      }
    } else {
      // No time provided, default to 1 hour from now
      fireAt = Date.now() + 60 * 60 * 1000;
    }

    try {
      await scheduleReminder({
        id: Date.now().toString(),
        title: newTitle.trim(),
        time: fireAt,
        repeatInterval: null,
      });

      // Reset form
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setShowAddModal(false);
      
      await load();
      Alert.alert('Success', 'Reminder created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create reminder');
      console.error('[Reminders] Create error:', error);
    }
  }

  function getQuickTimeOptions() {
    const now = new Date();
    return [
      { label: 'In 30 min', minutes: 30 },
      { label: 'In 1 hour', minutes: 60 },
      { label: 'In 2 hours', minutes: 120 },
      { label: 'Tomorrow 9am', getTime: () => {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow.getTime();
      }},
    ];
  }

  function setQuickTime(option: any) {
    if (option.getTime) {
      const time = new Date(option.getTime());
      setNewDate(time.toISOString().split('T')[0]);
      setNewTime(time.toTimeString().slice(0, 5));
    } else {
      const time = new Date(Date.now() + option.minutes * 60 * 1000);
      setNewDate(time.toISOString().split('T')[0]);
      setNewTime(time.toTimeString().slice(0, 5));
    }
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
        <View style={styles.headerButtons}>
          {reminders.length > 0 && (
            <Pressable style={styles.readAllBtn} onPress={handleReadAll}>
              <Text style={styles.readAllText}>🔊</Text>
            </Pressable>
          )}
          <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.voiceHint}>
        <Text style={styles.voiceHintText}>
          💡 Say "Remind me to call mum at 6pm" or tap + Add
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
              Tap + Add or ask Light to remind you.
            </Text>
          </View>
        }
      />

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>What to remind?</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g., Call doctor, Buy groceries..."
                placeholderTextColor="#64748B"
                autoFocus
              />

              <Text style={styles.inputLabel}>Quick Options</Text>
              <View style={styles.quickButtons}>
                {getQuickTimeOptions().map((option, index) => (
                  <Pressable
                    key={index}
                    style={styles.quickBtn}
                    onPress={() => setQuickTime(option)}
                  >
                    <Text style={styles.quickBtnText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Or Choose Specific Time</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={newDate}
                    onChangeText={setNewDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={newTime}
                    onChangeText={setNewTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <Pressable style={styles.createBtn} onPress={handleAddReminder}>
                <Text style={styles.createBtnText}>Create Reminder</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerButtons: { flexDirection: "row", gap: 8 },
  readAllBtn: {
    backgroundColor: "#0F1F3D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  readAllText: { color: "#93C5FD", fontSize: 16 },
  addBtn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  modalTitle: { color: "#E2E8F0", fontSize: 20, fontWeight: "600" },
  modalClose: { color: "#64748B", fontSize: 24 },
  modalScroll: { padding: 20 },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "#E2E8F0",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickBtnText: { color: "#93C5FD", fontSize: 14 },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeCol: { flex: 1 },
  dateTimeLabel: { color: "#64748B", fontSize: 12, marginBottom: 6 },
  dateTimeInput: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
    color: "#E2E8F0",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  createBtn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  createBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
