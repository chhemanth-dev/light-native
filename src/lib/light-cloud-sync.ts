/**
 * Light Cloud Sync
 * Sync learned tasks, patterns, and knowledge across devices
 * Uses GitHub Gist as free cloud storage (no server costs!)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { patternLearner } from './light-pattern-learner';
import { lightBrain } from './light-brain';
import { lightTeacher } from './light-teacher';

const SYNC_KEYS = {
  ENABLED: '@light_sync_enabled',
  GITHUB_TOKEN: '@light_sync_github_token',
  GIST_ID: '@light_sync_gist_id',
  LAST_SYNC: '@light_sync_last_sync',
};

export interface SyncData {
  version: string;
  timestamp: number;
  deviceId: string;
  patterns: any[];
  knowledge: any[];
  demonstrations: any[];
}

export class LightCloudSync {
  private enabled = false;
  private githubToken: string | null = null;
  private gistId: string | null = null;

  /**
   * Initialize cloud sync
   */
  async initialize(): Promise<void> {
    const enabled = await AsyncStorage.getItem(SYNC_KEYS.ENABLED);
    this.enabled = enabled === 'true';
    
    if (this.enabled) {
      this.githubToken = await AsyncStorage.getItem(SYNC_KEYS.GITHUB_TOKEN);
      this.gistId = await AsyncStorage.getItem(SYNC_KEYS.GIST_ID);
      console.log('☁️ Cloud sync initialized');
    }
  }

  /**
   * Enable cloud sync with GitHub token
   */
  async enable(githubToken: string): Promise<void> {
    this.githubToken = githubToken;
    this.enabled = true;
    
    await AsyncStorage.setItem(SYNC_KEYS.ENABLED, 'true');
    await AsyncStorage.setItem(SYNC_KEYS.GITHUB_TOKEN, githubToken);
    
    console.log('✅ Cloud sync enabled');
  }

  /**
   * Disable cloud sync
   */
  async disable(): Promise<void> {
    this.enabled = false;
    await AsyncStorage.setItem(SYNC_KEYS.ENABLED, 'false');
    console.log('❌ Cloud sync disabled');
  }

  /**
   * Upload learned data to cloud
   */
  async upload(): Promise<{ success: boolean; message: string }> {
    if (!this.enabled || !this.githubToken) {
      return { success: false, message: 'Cloud sync not enabled' };
    }

    try {
      console.log('☁️ Uploading data to cloud...');

      // Collect all data
      const patterns = patternLearner.getAllPatterns();
      const knowledge = await lightBrain.recall(''); // Get all
      const demonstrations = await lightTeacher.getAllDemonstrations();

      const syncData: SyncData = {
        version: '1.0',
        timestamp: Date.now(),
        deviceId: await this.getDeviceId(),
        patterns,
        knowledge,
        demonstrations,
      };

      const content = JSON.stringify(syncData, null, 2);

      // Create or update GitHub Gist
      if (this.gistId) {
        // Update existing gist
        await this.updateGist(content);
      } else {
        // Create new gist
        const gistId = await this.createGist(content);
        this.gistId = gistId;
        await AsyncStorage.setItem(SYNC_KEYS.GIST_ID, gistId);
      }

      await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, Date.now().toString());
      
      console.log('✅ Upload complete!');
      return { 
        success: true, 
        message: `Uploaded ${patterns.length} patterns, ${knowledge.length} knowledge items, ${demonstrations.length} demos` 
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Download learned data from cloud
   */
  async download(): Promise<{ success: boolean; message: string }> {
    if (!this.enabled || !this.githubToken || !this.gistId) {
      return { success: false, message: 'Cloud sync not configured' };
    }

    try {
      console.log('☁️ Downloading data from cloud...');

      // Fetch gist
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const gist = await response.json();
      const file = Object.values(gist.files)[0] as any;
      const syncData: SyncData = JSON.parse(file.content);

      // Apply downloaded data
      await patternLearner.learnFromExamples(
        syncData.patterns.map(p => ({
          input: p.examples[0] || '',
          intent: p.intent,
          response: p.responseTemplate,
        }))
      );

      // Store knowledge items
      for (const item of syncData.knowledge) {
        await lightBrain.storeKnowledge(item);
      }

      // Store demonstrations
      for (const demo of syncData.demonstrations) {
        // Store via teacher (would need method in light-teacher.ts)
        console.log('📚 Restoring demo:', demo.task);
      }

      await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, Date.now().toString());

      console.log('✅ Download complete!');
      return { 
        success: true, 
        message: `Downloaded ${syncData.patterns.length} patterns, ${syncData.knowledge.length} knowledge items, ${syncData.demonstrations.length} demos` 
      };
    } catch (error) {
      console.error('❌ Download failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  }

  /**
   * Auto-sync (upload after learning new things)
   */
  async autoSync(): Promise<void> {
    if (!this.enabled) return;

    const lastSync = parseInt(await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC) || '0');
    const timeSinceSync = Date.now() - lastSync;

    // Auto-sync every 24 hours
    if (timeSinceSync > 24 * 60 * 60 * 1000) {
      console.log('🔄 Auto-syncing...');
      await this.upload();
    }
  }

  /**
   * Create GitHub Gist
   */
  private async createGist(content: string): Promise<string> {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Light AI - Learned Knowledge',
        public: false,
        files: {
          'light-ai-data.json': {
            content,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create gist: ${response.status}`);
    }

    const gist = await response.json();
    return gist.id;
  }

  /**
   * Update existing GitHub Gist
   */
  private async updateGist(content: string): Promise<void> {
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'light-ai-data.json': {
            content,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update gist: ${response.status}`);
    }
  }

  /**
   * Get unique device ID
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('@device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('@device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<{
    enabled: boolean;
    configured: boolean;
    lastSync: number;
    syncAvailable: boolean;
  }> {
    const lastSync = parseInt(await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC) || '0');
    
    return {
      enabled: this.enabled,
      configured: !!(this.githubToken && this.gistId),
      lastSync,
      syncAvailable: this.enabled && !!this.githubToken,
    };
  }
}

// Singleton
export const cloudSync = new LightCloudSync();
