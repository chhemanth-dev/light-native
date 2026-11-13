/**
 * Conversation History Screen
 * View all past conversations with Light and copy messages
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getAllConversationTurns, type Turn } from '../src/lib/db';
import * as Clipboard from 'expo-clipboard';

export default function ConversationHistoryScreen() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const allTurns = await getAllConversationTurns(500); // Get last 500 messages
      setTurns(allTurns);
    } catch (error) {
      console.error('[History] Load error:', error);
      Alert.alert('Error', 'Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(turn: Turn) {
    try {
      await Clipboard.setStringAsync(turn.content);
      setCopiedId(turn.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
  }

  async function handleCopyAll() {
    try {
      // Format all messages as text
      const allText = turns
        .reverse() // Oldest first
        .map(turn => {
          const timestamp = new Date(turn.timestamp).toLocaleString();
          const role = turn.role === 'user' ? 'You' : 'Light';
          return `[${timestamp}] ${role}:\n${turn.content}\n`;
        })
        .join('\n');
      
      await Clipboard.setStringAsync(allText);
      Alert.alert('Copied!', `Copied ${turns.length} messages to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy all messages');
    }
  }

  function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  const renderItem = ({ item }: { item: Turn }) => {
    const isUser = item.role === 'user';
    const isCopied = copiedId === item.id;

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessage]}>
        <View style={styles.messageHeader}>
          <View style={styles.messageHeaderLeft}>
            <Text style={styles.roleIcon}>{isUser ? '👤' : '🤖'}</Text>
            <Text style={styles.roleName}>{isUser ? 'You' : 'Light'}</Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        
        <Text style={styles.messageContent}>{item.content}</Text>
        
        <Pressable
          style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
          onPress={() => handleCopy(item)}
        >
          <Text style={styles.copyBtnText}>
            {isCopied ? '✓ Copied' : '📋 Copy'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Conversation History</Text>
        <Pressable onPress={handleCopyAll} style={styles.copyAllBtn}>
          <Text style={styles.copyAllText}>Copy All</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : turns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No conversation history yet</Text>
          <Text style={styles.emptySubText}>
            Start talking to Light to build your history!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {turns.length} message{turns.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <FlatList
            data={turns}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            inverted={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050810' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 8 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { 
    color: '#E2E8F0', 
    fontSize: 20, 
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  copyAllBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyAllText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0A0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statsText: { color: '#64748B', fontSize: 13 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#64748B', fontSize: 16 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { 
    color: '#E2E8F0', 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: { 
    color: '#64748B', 
    fontSize: 14, 
    textAlign: 'center',
    lineHeight: 20,
  },

  list: { 
    padding: 16, 
    paddingBottom: 100,
  },

  messageContainer: {
    backgroundColor: '#0A0F1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  userMessage: {
    backgroundColor: '#0F1829',
    borderColor: '#1D4ED8',
  },

  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleIcon: { fontSize: 18 },
  roleName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: '#64748B',
    fontSize: 12,
  },

  messageContent: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },

  copyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  copyBtnSuccess: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  copyBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});
