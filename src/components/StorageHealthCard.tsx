/**
 * Storage Health Card
 * Shows Light AI storage usage and cleanup options
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { lightAI } from '../lib/light-ai-service';

export function StorageHealthCard() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  async function loadHealth() {
    setLoading(true);
    try {
      const h = await lightAI.getStorageHealth();
      setHealth(h);
    } catch (error) {
      console.error('Error loading storage health:', error);
    }
    setLoading(false);
  }

  async function handleCleanup() {
    setCleaning(true);
    try {
      await lightAI.cleanupStorage();
      await loadHealth(); // Refresh stats
    } catch (error) {
      console.error('Error cleaning storage:', error);
    }
    setCleaning(false);
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!health) return null;

  const statusColors = {
    healthy: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
  };

  const statusEmojis = {
    healthy: '✅',
    warning: '⚠️',
    critical: '🚨',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {statusEmojis[health.status]} Storage Health
        </Text>
        <Text style={[styles.statusBadge, { backgroundColor: statusColors[health.status] + '20', color: statusColors[health.status] }]}>
          {health.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.message}>{health.message}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Storage</Text>
          <Text style={styles.statValue}>{health.stats.totalSizeMB.toFixed(1)} MB</Text>
          <Text style={styles.statSubtext}>of 50 MB limit</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Patterns</Text>
          <Text style={styles.statValue}>{health.stats.patterns}</Text>
          <Text style={styles.statSubtext}>of 100 max</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Knowledge</Text>
          <Text style={styles.statValue}>{health.stats.knowledgeItems}</Text>
          <Text style={styles.statSubtext}>of 500 max</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Demos</Text>
          <Text style={styles.statValue}>{health.stats.demonstrations}</Text>
          <Text style={styles.statSubtext}>of 50 max</Text>
        </View>
      </View>

      {/* Progress bars */}
      <View style={styles.progressSection}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Overall Usage</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, health.usage.total)}%`,
                  backgroundColor: statusColors[health.status]
                }
              ]} 
            />
          </View>
          <Text style={styles.progressValue}>{health.usage.total.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Cleanup button */}
      {health.usage.total > 50 && (
        <Pressable 
          style={[styles.cleanupBtn, cleaning && styles.cleanupBtnDisabled]} 
          onPress={handleCleanup}
          disabled={cleaning}
        >
          {cleaning ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.cleanupBtnText}>
              🧹 Cleanup Storage
            </Text>
          )}
        </Pressable>
      )}

      {health.stats.lastCleanup > 0 && (
        <Text style={styles.lastCleanup}>
          Last cleanup: {new Date(health.stats.lastCleanup).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  statSubtext: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  progressSection: {
    gap: 8,
  },
  progressItem: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  cleanupBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cleanupBtnDisabled: {
    opacity: 0.5,
  },
  cleanupBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lastCleanup: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: -8,
  },
});
