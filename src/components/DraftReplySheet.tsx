/**
 * Draft Reply bottom sheet — appears when Light suggests a reply.
 * Shows the suggested text, lets user copy it or share directly
 * to the originating app.
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  Animated,
  Dimensions,
  ScrollView,
  ToastAndroid,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type Props = {
  visible: boolean;
  senderName: string;
  appName: string;
  originalMessage: string;
  draftReply: string;
  onClose: () => void;
  onEdit: (text: string) => void;
};

export function DraftReplySheet({
  visible,
  senderName,
  appName,
  originalMessage,
  draftReply,
  onClose,
  onEdit,
}: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [visible]);

  async function handleCopy() {
    await Clipboard.setStringAsync(draftReply);
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: draftReply,
        title: `Reply to ${senderName}`,
      });
    } catch {
      // user dismissed
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appBadge}>{appName}</Text>
            <Text style={styles.headerTitle}>Draft Reply</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Original message */}
          {!!originalMessage && (
            <View style={styles.originalBox}>
              <Text style={styles.originalLabel}>
                {senderName} said:
              </Text>
              <Text style={styles.originalText} numberOfLines={3}>
                {originalMessage}
              </Text>
            </View>
          )}

          {/* Draft */}
          <Text style={styles.draftLabel}>Suggested reply</Text>
          <TextInput
            style={styles.draftInput}
            value={draftReply}
            onChangeText={onEdit}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#475569"
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.copyBtn]} onPress={handleCopy}>
              <Text style={styles.actionBtnText}>📋  Copy</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
              <Text style={styles.actionBtnText}>↗  Share</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Tap "Share" to open {appName} with this reply pre-filled.{"\n"}
            Light never sends anything automatically.
          </Text>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0A0F1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#1E293B",
    zIndex: 11,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#1E293B",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0F172A",
  },
  headerLeft: { flex: 1, gap: 4 },
  appBadge: {
    color: "#3B82F6",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: { color: "#E2E8F0", fontSize: 16, fontWeight: "600" },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#475569", fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 36 },
  originalBox: {
    backgroundColor: "#050810",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#334155",
    gap: 4,
  },
  originalLabel: { color: "#475569", fontSize: 11, fontWeight: "700" },
  originalText: { color: "#94A3B8", fontSize: 13, lineHeight: 19 },
  draftLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  draftInput: {
    backgroundColor: "#050810",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
  },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  copyBtn: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  shareBtn: {
    backgroundColor: "#1D4ED8",
  },
  actionBtnText: { color: "#E2E8F0", fontSize: 13, fontWeight: "600" },
  hint: {
    color: "#334155",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});
