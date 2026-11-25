/**
 * Error Logs Screen - View and share error logs for debugging
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Share, Alert,
} from "react-native";
import { router } from "expo-router";
import {
  getErrorLogs,
  clearErrorLogs,
  exportLogsAsText,
  subscribeToErrors,
  type ErrorLog,
} from "../src/lib/error-logger";
import * as Clipboard from 'expo-clipboard';

export default function ErrorLogsScreen() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Load initial logs
    setLogs(getErrorLogs());

    // Subscribe to updates
    const unsubscribe = subscribeToErrors((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Error Logs?",
      "This will delete all error logs permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearErrorLogs();
            Alert.alert("Cleared", "All error logs have been deleted.");
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const text = exportLogsAsText();
      await Share.share({
        message: text,
        title: "Light Native Error Logs",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share logs");
    }
  };

  const handleCopyAll = async () => {
    try {
      const text = exportLogsAsText();
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Error logs copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy logs");
    }
  };

  const handleCopyLog = async (log: ErrorLog) => {
    try {
      let text = `[${log.source}] ${log.message}\n`;
      text += `Time: ${new Date(log.timestamp).toLocaleString()}\n`;
      if (log.details) {
        text += `Details: ${log.details}\n`;
      }
      if (log.stack) {
        text += `\nStack:\n${log.stack}`;
      }
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Error log copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy log");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Error Logs</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {logs.length} error{logs.length !== 1 ? 's' : ''} logged
        </Text>
        {logs.length > 0 && (
          <Text style={styles.statsSubtext}>
            Latest: {new Date(logs[0].timestamp).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Actions */}
      {logs.length > 0 && (
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleCopyAll}>
            <Text style={styles.actionBtnText}>📋 Copy All</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleExport}>
            <Text style={styles.actionBtnText}>📤 Share</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={handleClearAll}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
              🗑️ Clear
            </Text>
          </Pressable>
        </View>
      )}

      {/* Error List */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {logs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No errors logged</Text>
            <Text style={styles.emptySubtext}>
              Errors will appear here when they occur
            </Text>
          </View>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <View key={log.id} style={styles.logCard}>
                <Pressable onPress={() => toggleExpand(log.id)}>
                  <View style={styles.logHeader}>
                    <View style={styles.logIcon}>
                      <Text style={styles.logIconText}>⚠️</Text>
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={styles.logSource}>{log.source}</Text>
                      {log.feature && (
                        <Text style={styles.logFeature}>Feature: {log.feature}</Text>
                      )}
                      <Text style={styles.logTime}>
                        {new Date(log.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.logExpand}>
                      {isExpanded ? '▼' : '▶'}
                    </Text>
                  </View>
                  <Text style={styles.logMessage} numberOfLines={isExpanded ? undefined : 2}>
                    {log.message}
                  </Text>
                </Pressable>

                {isExpanded && (
                  <View style={styles.logDetails}>
                    {log.details && (
                      <View style={styles.logSection}>
                        <Text style={styles.logSectionTitle}>Details:</Text>
                        <Text style={styles.logSectionText}>{log.details}</Text>
                      </View>
                    )}
                    {log.stack && (
                      <View style={styles.logSection}>
                        <Text style={styles.logSectionTitle}>Stack Trace:</Text>
                        <ScrollView
                          horizontal
                          style={styles.stackScroll}
                          showsHorizontalScrollIndicator={false}
                        >
                          <Text style={styles.stackText}>{log.stack}</Text>
                        </ScrollView>
                      </View>
                    )}
                    <Pressable
                      style={styles.copyBtn}
                      onPress={() => handleCopyLog(log)}
                    >
                      <Text style={styles.copyBtnText}>📋 Copy This Error</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Help */}
      {logs.length > 0 && (
        <View style={styles.bottomHelp}>
          <Text style={styles.bottomHelpText}>
            💡 Tap an error to see full details. Use "Share" to send logs to developer.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050810",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    color: "#3B82F6",
    fontSize: 16,
  },
  title: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginRight: 50, // Offset for back button
  },
  headerSpacer: {
    width: 50,
  },
  stats: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0A0F1E",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  statsText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
  },
  statsSubtext: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  actionBtnDanger: {
    borderColor: "#7F1D1D",
  },
  actionBtnText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
  },
  actionBtnTextDanger: {
    color: "#FCA5A5",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#475569",
    fontSize: 13,
    marginTop: 4,
  },
  logCard: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 12,
    padding: 12,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F1410",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logIconText: {
    fontSize: 16,
  },
  logInfo: {
    flex: 1,
  },
  logSource: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
  logFeature: {
    color: "#F59E0B",
    fontSize: 11,
    marginTop: 2,
    fontStyle: "italic",
  },
  logTime: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  logExpand: {
    color: "#64748B",
    fontSize: 12,
    marginLeft: 8,
  },
  logMessage: {
    color: "#F87171",
    fontSize: 13,
    lineHeight: 18,
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  logSection: {
    marginBottom: 12,
  },
  logSectionTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  logSectionText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 16,
  },
  stackScroll: {
    maxHeight: 120,
  },
  stackText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontFamily: "monospace",
  },
  copyBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
  },
  copyBtnText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomHelp: {
    padding: 12,
    backgroundColor: "#0A0F1E",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  bottomHelpText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
