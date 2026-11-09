/**
 * Diagnostics screen - check which apps are installed and what's working
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getInstalledApps, isAppInstalled, APP_PACKAGES } from '../src/lib/accessibility';
import { isNotificationListenerEnabled } from '../src/lib/notifications';

interface InstalledApp {
  packageName: string;
  appName: string;
}

export default function DiagnosticsScreen() {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [notificationAccess, setNotificationAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    setLoading(true);
    
    try {
      // Check installed apps
      const apps = await getInstalledApps();
      setInstalledApps(apps);
      
      // Check notification listener access
      const hasAccess = await isNotificationListenerEnabled();
      setNotificationAccess(hasAccess);
      
      // Check specific apps
      const checks: Record<string, boolean> = {};
      for (const [key, packageName] of Object.entries(APP_PACKAGES)) {
        checks[key] = await isAppInstalled(packageName);
      }
      setChecking(checks);
      
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Diagnostics</Text>
        <Pressable onPress={runDiagnostics} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>🔄</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Running diagnostics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          
          {/* Notification Access */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Access</Text>
            <View style={[styles.statusCard, notificationAccess ? styles.statusSuccess : styles.statusError]}>
              <Text style={styles.statusIcon}>{notificationAccess ? '✅' : '❌'}</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusText}>
                  {notificationAccess ? 'Enabled' : 'Disabled'}
                </Text>
                <Text style={styles.statusDesc}>
                  {notificationAccess 
                    ? 'Light can read notifications from other apps' 
                    : 'Enable notification access in Settings'}
                </Text>
              </View>
            </View>
          </View>

          {/* Installed Popular Apps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Installed Apps ({installedApps.length})
            </Text>
            <Text style={styles.sectionDesc}>
              These apps are installed and can send notifications to Light:
            </Text>
            {installedApps.length > 0 ? (
              installedApps.map((app) => (
                <View key={app.packageName} style={styles.appCard}>
                  <Text style={styles.appIcon}>✓</Text>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.appPackage}>{app.packageName}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No supported apps found. Install WhatsApp, Instagram, etc.
              </Text>
            )}
          </View>

          {/* Specific App Checks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Status Check</Text>
            {Object.entries(APP_PACKAGES).map(([key, packageName]) => (
              <View key={key} style={styles.checkRow}>
                <Text style={styles.checkIcon}>
                  {checking[key] ? '✅' : '❌'}
                </Text>
                <Text style={styles.checkName}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.checkPackage}>{packageName}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>✓ If Instagram shows as "not installed":</Text>
              <Text style={styles.tipText}>
                • Check if Instagram is actually installed on your device{'\n'}
                • Instagram package name: com.instagram.android{'\n'}
                • Try installing from Google Play Store{'\n'}
                • Some custom ROMs may have different package names
              </Text>
            </View>
            
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>✓ To enable notification access:</Text>
              <Text style={styles.tipText}>
                • Go to Settings → Notifications → Notification Access{'\n'}
                • Enable "Light" in the list{'\n'}
                • Restart the app after enabling
              </Text>
            </View>
          </View>

        </ScrollView>
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
  title: { color: '#E2E8F0', fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
  refreshBtn: { padding: 8 },
  refreshText: { fontSize: 20 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: '#64748B', fontSize: 14 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDesc: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusSuccess: {
    backgroundColor: '#0A1F1A',
    borderColor: '#10B981',
  },
  statusError: {
    backgroundColor: '#1F0A0A',
    borderColor: '#EF4444',
  },
  statusIcon: { fontSize: 32 },
  statusInfo: { flex: 1 },
  statusText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDesc: { color: '#94A3B8', fontSize: 13 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  appIcon: { fontSize: 20, color: '#10B981' },
  appInfo: { flex: 1 },
  appName: { color: '#E2E8F0', fontSize: 15, fontWeight: '500', marginBottom: 2 },
  appPackage: { color: '#64748B', fontSize: 12, fontFamily: 'monospace' },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#0A0F1E',
    borderRadius: 6,
    marginBottom: 6,
  },
  checkIcon: { fontSize: 18 },
  checkName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
    width: 100,
  },
  checkPackage: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  tipCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  tipTitle: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
});
