/**
 * AI Provider Settings Screen
 * Allows users to choose AI provider and configure API keys
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { setAIProvider, getAIProvider } from '../src/lib/gemini';
import { setAPIKey, isProviderConfigured, AIProvider } from '../src/lib/ai-providers';
import { saveAPIKey, loadAPIKey } from '../src/config/api-keys';

export default function AISettingsScreen() {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(getAIProvider());
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const claude = await loadAPIKey('claude');
    const openai = await loadAPIKey('openai');
    
    if (claude) setClaudeKey(claude);
    if (openai) setOpenaiKey(openai);
  }

  async function handleSaveKeys() {
    try {
      if (claudeKey) {
        await saveAPIKey('claude', claudeKey);
        setAPIKey('claude', claudeKey);
      }
      if (openaiKey) {
        await saveAPIKey('openai', openaiKey);
        setAPIKey('openai', openaiKey);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      Alert.alert('Success', 'API keys saved securely');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API keys');
    }
  }

  function handleProviderChange(provider: AIProvider) {
    setAIProvider(provider);
    setCurrentProvider(provider);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>AI Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* AI Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Provider</Text>
          <Text style={styles.sectionDesc}>
            Choose which AI powers Light's responses
          </Text>

          <Pressable
            style={[styles.providerCard, currentProvider === 'auto' && styles.selected]}
            onPress={() => handleProviderChange('auto')}
          >
            <Text style={styles.providerIcon}>🤖</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Auto (Recommended)</Text>
              <Text style={styles.providerDesc}>
                Tries all providers for best reliability
              </Text>
            </View>
            {currentProvider === 'auto' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.providerCard, currentProvider === 'gemini' && styles.selected]}
            onPress={() => handleProviderChange('gemini')}
          >
            <Text style={styles.providerIcon}>⚡</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Gemini (Google)</Text>
              <Text style={styles.providerDesc}>
                Fast responses • Free • Good for quick answers
              </Text>
            </View>
            {currentProvider === 'gemini' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.providerCard, currentProvider === 'claude' && styles.selected]}
            onPress={() => handleProviderChange('claude')}
          >
            <Text style={styles.providerIcon}>🧠</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Claude (Anthropic)</Text>
              <Text style={styles.providerDesc}>
                Best reasoning • Thoughtful • Requires API key
              </Text>
            </View>
            {currentProvider === 'claude' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.providerCard, currentProvider === 'openai' && styles.selected]}
            onPress={() => handleProviderChange('openai')}
          >
            <Text style={styles.providerIcon}>🚀</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>OpenAI (GPT-4)</Text>
              <Text style={styles.providerDesc}>
                Advanced tasks • Creative • Requires API key
              </Text>
            </View>
            {currentProvider === 'openai' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>
        </View>

        {/* API Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys</Text>
          <Text style={styles.sectionDesc}>
            Add your own API keys for Claude and OpenAI
          </Text>

          <Text style={styles.label}>Claude API Key (Optional)</Text>
          <TextInput
            style={styles.input}
            value={claudeKey}
            onChangeText={setClaudeKey}
            placeholder="sk-ant-..."
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Get your key at: console.anthropic.com
          </Text>

          <Text style={styles.label}>OpenAI API Key (Optional)</Text>
          <TextInput
            style={styles.input}
            value={openaiKey}
            onChangeText={setOpenaiKey}
            placeholder="sk-..."
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Get your key at: platform.openai.com/api-keys
          </Text>

          <Pressable
            style={[styles.saveBtn, saved && styles.savedBtn]}
            onPress={handleSaveKeys}
          >
            <Text style={styles.saveText}>
              {saved ? '✓ Saved!' : 'Save Keys'}
            </Text>
          </Pressable>

          <Text style={styles.note}>
            🔒 Keys are stored securely on your device and never leave your phone
          </Text>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Gemini:</Text>
            <Text style={styles.statusReady}>✓ Ready (Free)</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Claude:</Text>
            <Text style={isProviderConfigured('claude') ? styles.statusReady : styles.statusNotConfigured}>
              {isProviderConfigured('claude') ? '✓ Configured' : '○ Not configured'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>OpenAI:</Text>
            <Text style={isProviderConfigured('openai') ? styles.statusReady : styles.statusNotConfigured}>
              {isProviderConfigured('openai') ? '✓ Configured' : '○ Not configured'}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  title: { color: '#E2E8F0', fontSize: 20, fontWeight: '600' },
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

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  selected: {
    borderColor: '#3B82F6',
    backgroundColor: '#0A1829',
  },
  providerIcon: { fontSize: 32, marginRight: 16 },
  providerInfo: { flex: 1 },
  providerName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerDesc: { color: '#64748B', fontSize: 13 },
  checkmark: { color: '#3B82F6', fontSize: 24, fontWeight: 'bold' },

  label: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 14,
    color: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  hint: {
    color: '#475569',
    fontSize: 12,
    marginTop: 6,
  },

  saveBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  savedBtn: { backgroundColor: '#10B981' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  note: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statusLabel: { color: '#94A3B8', fontSize: 14 },
  statusReady: { color: '#10B981', fontSize: 14, fontWeight: '500' },
  statusNotConfigured: { color: '#64748B', fontSize: 14 },
});
