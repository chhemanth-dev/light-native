/**
 * AI Provider Settings Screen
 * Allows users to choose AI provider and configure multiple API keys with rotation
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
import { setAPIKey, addAPIKey, isProviderConfigured, AIProvider } from '../src/lib/ai-providers';
import { saveAPIKey, loadAPIKeys } from '../src/config/api-keys';

type ProviderKeys = {
  gemini: string[];
  deepseek: string[];
  openai: string[];
};

export default function AISettingsScreen() {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(getAIProvider());
  const [keys, setKeys] = useState<ProviderKeys>({
    gemini: [],
    deepseek: [],
    openai: [],
  });
  const [newKeys, setNewKeys] = useState({
    gemini: '',
    deepseek: '',
    openai: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadAllKeys();
  }, []);

  async function loadAllKeys() {
    console.log('[AI Settings] Loading all keys from storage...');
    const gemini = await loadAPIKeys('gemini');
    const deepseek = await loadAPIKeys('deepseek');
    const openai = await loadAPIKeys('openai');
    
    setKeys({ gemini, deepseek, openai });
    
    console.log('[AI Settings] Loaded keys:', {
      gemini: `${gemini.length} key(s)`,
      deepseek: `${deepseek.length} key(s)`,
      openai: `${openai.length} key(s)`,
    });
  }

  async function handleAddKey(provider: 'gemini' | 'deepseek' | 'openai') {
    const key = newKeys[provider].trim();
    
    if (!key || key.length < 10) {
      Alert.alert('Invalid Key', 'Please enter a valid API key.');
      return;
    }
    
    // Check if key already exists
    if (keys[provider].includes(key)) {
      Alert.alert('Duplicate Key', 'This key is already added.');
      return;
    }
    
    try {
      const updatedKeys = [...keys[provider], key];
      
      // Save to secure storage
      await saveAPIKey(provider, updatedKeys);
      
      // Update in-memory API provider system
      if (updatedKeys.length === 1) {
        setAPIKey(provider, key); // First key
      } else {
        addAPIKey(provider, key); // Additional key
      }
      
      // Update UI
      setKeys(prev => ({
        ...prev,
        [provider]: updatedKeys,
      }));
      
      // Clear input
      setNewKeys(prev => ({
        ...prev,
        [provider]: '',
      }));
      
      Alert.alert(
        'Success!',
        `Added ${provider.toUpperCase()} key #${updatedKeys.length}. ${updatedKeys.length === 1 ? 'This is your PRIMARY key.' : 'Will be used as backup if primary fails.'}`
      );
    } catch (error) {
      console.error('[AI Settings] Add key error:', error);
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    }
  }

  async function handleRemoveKey(provider: 'gemini' | 'deepseek' | 'openai', index: number) {
    Alert.alert(
      'Remove Key?',
      `Remove ${provider.toUpperCase()} key #${index + 1}?${index === 0 ? ' (This is your PRIMARY key!)' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedKeys = keys[provider].filter((_, i) => i !== index);
              
              // Save to secure storage
              await saveAPIKey(provider, updatedKeys);
              
              // Update in-memory system (reload all keys)
              if (updatedKeys.length > 0) {
                setAPIKey(provider, updatedKeys[0]);
                updatedKeys.slice(1).forEach(k => addAPIKey(provider, k));
              }
              
              // Update UI
              setKeys(prev => ({
                ...prev,
                [provider]: updatedKeys,
              }));
              
              Alert.alert('Removed', `${provider.toUpperCase()} key removed successfully.`);
            } catch (error) {
              console.error('[AI Settings] Remove key error:', error);
              Alert.alert('Error', 'Failed to remove key.');
            }
          },
        },
      ]
    );
  }

  function handleProviderChange(provider: AIProvider) {
    setAIProvider(provider);
    setCurrentProvider(provider);
  }

  function renderKeysList(provider: 'gemini' | 'deepseek' | 'openai', color: string, icon: string) {
    const providerKeys = keys[provider];
    const displayName = provider === 'gemini' ? 'Gemini' : provider === 'deepseek' ? 'DeepSeek' : 'OpenAI';
    
    return (
      <View style={styles.keySection}>
        <View style={styles.keySectionHeader}>
          <Text style={styles.keySectionIcon}>{icon}</Text>
          <Text style={styles.keySectionTitle}>{displayName} API Keys</Text>
          <Text style={[styles.keyCount, { color }]}>
            {providerKeys.length} key{providerKeys.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Existing Keys */}
        {providerKeys.map((key, index) => (
          <View key={index} style={styles.keyCard}>
            <View style={styles.keyInfo}>
              <Text style={styles.keyLabel}>
                {index === 0 ? '🎯 PRIMARY KEY' : `⚙️ BACKUP KEY #${index}`}
              </Text>
              <Text style={styles.keyValue}>
                {key.substring(0, 12)}...{key.slice(-4)}
              </Text>
            </View>
            <Pressable
              style={styles.removeBtn}
              onPress={() => handleRemoveKey(provider, index)}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        ))}

        {/* Add New Key */}
        <View style={styles.addKeyContainer}>
          <TextInput
            style={styles.keyInput}
            value={newKeys[provider]}
            onChangeText={(text) => setNewKeys(prev => ({ ...prev, [provider]: text }))}
            placeholder={`Add ${displayName} API key...`}
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.addBtn, { backgroundColor: color }]}
            onPress={() => handleAddKey(provider)}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        </View>

        <Text style={styles.keyHint}>
          {provider === 'gemini' && '🔗 Get key at: makersuite.google.com/app/apikey'}
          {provider === 'deepseek' && '🔗 Get key at: platform.deepseek.com'}
          {provider === 'openai' && '🔗 Get key at: platform.openai.com/api-keys'}
        </Text>
      </View>
    );
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
                Tries all providers with smart key rotation
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
                Fast • Free tier available • Good for quick tasks
              </Text>
            </View>
            {currentProvider === 'gemini' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.providerCard, currentProvider === 'deepseek' && styles.selected]}
            onPress={() => handleProviderChange('deepseek')}
          >
            <Text style={styles.providerIcon}>🤖</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>DeepSeek</Text>
              <Text style={styles.providerDesc}>
                Smart reasoning • Affordable • Open source focus
              </Text>
            </View>
            {currentProvider === 'deepseek' && (
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
                Advanced tasks • Creative • Most capable
              </Text>
            </View>
            {currentProvider === 'openai' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Pressable>
        </View>

        {/* Multi-Key Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>💡 Multiple Keys Support</Text>
          <Text style={styles.infoBannerText}>
            Add multiple API keys per provider for automatic failover.{'\n'}
            • First key = PRIMARY (always tried first){'\n'}
            • Additional keys = BACKUP (used if primary fails){'\n'}
            • No rebuild needed - works immediately!
          </Text>
        </View>

        {/* API Keys Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys Management</Text>
          <Text style={styles.sectionDesc}>
            Add and manage your API keys. Multiple keys per provider supported!
          </Text>

          {renderKeysList('openai', '#10B981', '🚀')}
          {renderKeysList('deepseek', '#8B5CF6', '🤖')}
          {renderKeysList('gemini', '#3B82F6', '⚡')}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Gemini:</Text>
            <Text style={keys.gemini.length > 0 ? styles.statusReady : styles.statusNotConfigured}>
              {keys.gemini.length > 0 ? `✓ ${keys.gemini.length} key(s)` : '○ No keys'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>DeepSeek:</Text>
            <Text style={keys.deepseek.length > 0 ? styles.statusReady : styles.statusNotConfigured}>
              {keys.deepseek.length > 0 ? `✓ ${keys.deepseek.length} key(s)` : '○ No keys'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>OpenAI:</Text>
            <Text style={keys.openai.length > 0 ? styles.statusReady : styles.statusNotConfigured}>
              {keys.openai.length > 0 ? `✓ ${keys.openai.length} key(s)` : '○ No keys'}
            </Text>
          </View>
        </View>

        <Text style={styles.footerNote}>
          🔒 All keys are encrypted and stored securely on your device{'\n'}
          🔄 Keys are rotated automatically when balance runs out{'\n'}
          ⚡ Changes take effect immediately - no app rebuild required!
        </Text>
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

  infoBanner: {
    backgroundColor: '#0A1829',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoBannerTitle: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoBannerText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },

  keySection: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  keySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  keySectionIcon: { fontSize: 24, marginRight: 10 },
  keySectionTitle: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  keyCount: {
    fontSize: 13,
    fontWeight: '600',
  },

  keyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1219',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  keyInfo: { flex: 1 },
  keyLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  keyValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#FEE2E2',
    fontSize: 16,
    fontWeight: 'bold',
  },

  addKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  keyInput: {
    flex: 1,
    backgroundColor: '#0A1219',
    borderRadius: 8,
    padding: 12,
    color: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  keyHint: {
    color: '#475569',
    fontSize: 11,
    marginTop: 8,
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

  footerNote: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
});
