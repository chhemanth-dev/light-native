/**
 * Messages screen — all notifications/messages Light has collected, grouped by app.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  SafeAreaView, RefreshControl,
} from "react-native";
import { getAllMessages, markAllRead, type Message } from "../../src/lib/db";
import { useAppStore } from "../../src/store/appStore";
import { speak } from "../../src/lib/voice";
import { formatMessagesForSpeech } from "../../src/lib/voice";

const APP_COLORS: Record<string, string> = {
  WhatsApp: "#25D366",
  Gmail: "#EA4335",
  Instagram: "#E1306C",
  Messages: "#3B82F6",
  Telegram: "#2AABEE",
  Slack: "#4A154B",
  Teams: "#5558AF",
  default: "#64748B",
};

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { setUnreadCount } = useAppStore();

  async function load() {
    const msgs = await getAllMessages(200);
    setMessages(msgs);
    const unread = msgs.filter((m) => m.read === 0);
    setUnreadCount(unread.length);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function handleReadAll() {
    await markAllRead();
    await load();
    speak(formatMessagesForSpeech(messages.slice(0, 5).map((m) => ({
      app_name: m.app_name,
      sender: m.sender,
      content: m.content,
    }))));
  }

  function appColor(appName: string) {
    return APP_COLORS[appName] ?? APP_COLORS.default;
  }

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.card, item.read === 0 && styles.cardUnread]}>
      <View style={styles.cardHeader}>
        <View style={[styles.appDot, { backgroundColor: appColor(item.app_name) }]} />
        <Text style={styles.appName}>{item.app_name}</Text>
        <Text style={styles.time}>
          {new Date(item.timestamp).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {item.read === 0 && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.sender}>{item.sender}</Text>
      <Text style={styles.content} numberOfLines={3}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {messages.some((m) => m.read === 0) && (
          <Pressable style={styles.readAllBtn} onPress={handleReadAll}>
            <Text style={styles.readAllText}>Read all aloud</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.emptySubText}>
              Light will collect notifications from your apps here.
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
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: "#0A0F1E",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 6,
  },
  cardUnread: { borderColor: "#1D4ED8" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appDot: { width: 8, height: 8, borderRadius: 4 },
  appName: { color: "#64748B", fontSize: 11, fontWeight: "700", flex: 1 },
  time: { color: "#334155", fontSize: 11 },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  sender: { color: "#93C5FD", fontSize: 13, fontWeight: "600" },
  content: { color: "#CBD5E1", fontSize: 13, lineHeight: 19 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { color: "#334155", fontSize: 15 },
  emptySubText: { color: "#1E293B", fontSize: 12, textAlign: "center", maxWidth: 240 },
});
