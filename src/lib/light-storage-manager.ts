/**
 * Light Storage Manager
 * Manages storage limits and cleanup to prevent infinite growth
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from './db';

// Storage limits (configurable)
export const STORAGE_LIMITS = {
  MAX_PATTERNS: 100,              // Max learned patterns to keep
  MAX_KNOWLEDGE_ITEMS: 500,       // Max web knowledge items
  MAX_DEMONSTRATIONS: 50,          // Max user demonstrations
  MAX_PATTERN_EXAMPLES: 20,       // Max examples per pattern
  MAX_STORAGE_MB: 50,             // Max total storage in MB
  CLEANUP_THRESHOLD: 0.8,         // Cleanup when 80% full
};

// Storage keys
const STORAGE_KEYS = {
  PATTERNS: '@light_learned_patterns',
  LAST_CLEANUP: '@light_last_cleanup',
  STORAGE_STATS: '@light_storage_stats',
};

export interface StorageStats {
  patterns: number;
  knowledgeItems: number;
  demonstrations: number;
  totalSizeMB: number;
  lastCleanup: number;
}

export class LightStorageManager {
  /**
   * Check if storage cleanup is needed
   */
  async shouldCleanup(): Promise<boolean> {
    const stats = await this.getStats();
    
    // Check if limits exceeded
    if (stats.patterns > STORAGE_LIMITS.MAX_PATTERNS * STORAGE_LIMITS.CLEANUP_THRESHOLD) return true;
    if (stats.knowledgeItems > STORAGE_LIMITS.MAX_KNOWLEDGE_ITEMS * STORAGE_LIMITS.CLEANUP_THRESHOLD) return true;
    if (stats.demonstrations > STORAGE_LIMITS.MAX_DEMONSTRATIONS * STORAGE_LIMITS.CLEANUP_THRESHOLD) return true;
    if (stats.totalSizeMB > STORAGE_LIMITS.MAX_STORAGE_MB * STORAGE_LIMITS.CLEANUP_THRESHOLD) return true;
    
    return false;
  }

  /**
   * Perform intelligent cleanup
   * Removes least useful data first
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Starting storage cleanup...');
    
    const before = await this.getStats();
    console.log('📊 Before cleanup:', before);

    // 1. Cleanup patterns (remove lowest confidence, oldest)
    await this.cleanupPatterns();

    // 2. Cleanup knowledge base (remove oldest, least accessed)
    await this.cleanupKnowledge();

    // 3. Cleanup demonstrations (remove oldest, least used)
    await this.cleanupDemonstrations();

    // 4. Update cleanup timestamp
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, Date.now().toString());

    const after = await this.getStats();
    console.log('📊 After cleanup:', after);
    console.log(`✅ Freed ${(before.totalSizeMB - after.totalSizeMB).toFixed(2)} MB`);
  }

  /**
   * Cleanup learned patterns
   * Strategy: Keep high-confidence patterns, remove low-confidence old ones
   */
  private async cleanupPatterns(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PATTERNS);
      if (!stored) return;

      const patterns = JSON.parse(stored);
      
      if (patterns.length <= STORAGE_LIMITS.MAX_PATTERNS) {
        // Also trim examples per pattern
        for (const pattern of patterns) {
          if (pattern.examples && pattern.examples.length > STORAGE_LIMITS.MAX_PATTERN_EXAMPLES) {
            // Keep most recent examples
            pattern.examples = pattern.examples.slice(-STORAGE_LIMITS.MAX_PATTERN_EXAMPLES);
          }
        }
        await AsyncStorage.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(patterns));
        return;
      }

      // Sort by score: confidence * usage
      const scored = patterns.map((p: any) => ({
        ...p,
        score: (p.confidence || 0.5) * (p.usageCount || 1),
        lastUsed: p.lastUsed || 0,
      }));

      // Sort by score (high to low) and recency
      scored.sort((a: any, b: any) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        return b.lastUsed - a.lastUsed;
      });

      // Keep top patterns
      const kept = scored.slice(0, STORAGE_LIMITS.MAX_PATTERNS);
      
      // Trim examples in kept patterns
      for (const pattern of kept) {
        if (pattern.examples && pattern.examples.length > STORAGE_LIMITS.MAX_PATTERN_EXAMPLES) {
          pattern.examples = pattern.examples.slice(-STORAGE_LIMITS.MAX_PATTERN_EXAMPLES);
        }
        delete pattern.score; // Remove temporary score field
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(kept));
      console.log(`🗑️ Cleaned patterns: ${patterns.length} → ${kept.length}`);
    } catch (error) {
      console.error('❌ Error cleaning patterns:', error);
    }
  }

  /**
   * Cleanup knowledge base
   * Strategy: Keep frequently accessed, recent items
   */
  private async cleanupKnowledge(): Promise<void> {
    try {
      const db = await getDb();
      
      // Count items
      const countResult = await db.getAllAsync('SELECT COUNT(*) as count FROM light_knowledge');
      const count = (countResult[0] as any)?.count || 0;

      if (count <= STORAGE_LIMITS.MAX_KNOWLEDGE_ITEMS) return;

      // Keep items with high access_count and recent items
      const toDelete = count - STORAGE_LIMITS.MAX_KNOWLEDGE_ITEMS;
      
      await db.runAsync(`
        DELETE FROM light_knowledge
        WHERE id IN (
          SELECT id FROM light_knowledge
          ORDER BY 
            access_count ASC,
            last_accessed ASC
          LIMIT ?
        )
      `, [toDelete]);

      console.log(`🗑️ Cleaned knowledge: ${count} → ${STORAGE_LIMITS.MAX_KNOWLEDGE_ITEMS}`);
    } catch (error) {
      console.error('❌ Error cleaning knowledge:', error);
    }
  }

  /**
   * Cleanup demonstrations
   * Strategy: Keep recently used, frequently accessed
   */
  private async cleanupDemonstrations(): Promise<void> {
    try {
      const db = await getDb();
      
      // Count items
      const countResult = await db.getAllAsync('SELECT COUNT(*) as count FROM light_demonstrations');
      const count = (countResult[0] as any)?.count || 0;

      if (count <= STORAGE_LIMITS.MAX_DEMONSTRATIONS) return;

      // Keep items with high use_count and recent items
      const toDelete = count - STORAGE_LIMITS.MAX_DEMONSTRATIONS;
      
      await db.runAsync(`
        DELETE FROM light_demonstrations
        WHERE id IN (
          SELECT id FROM light_demonstrations
          ORDER BY 
            use_count ASC,
            last_used ASC
          LIMIT ?
        )
      `, [toDelete]);

      console.log(`🗑️ Cleaned demonstrations: ${count} → ${STORAGE_LIMITS.MAX_DEMONSTRATIONS}`);
    } catch (error) {
      console.error('❌ Error cleaning demonstrations:', error);
    }
  }

  /**
   * Get current storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      // Count patterns
      const patternsStr = await AsyncStorage.getItem(STORAGE_KEYS.PATTERNS);
      const patterns = patternsStr ? JSON.parse(patternsStr).length : 0;

      // Count knowledge items
      const db = await getDb();
      const knowledgeResult = await db.getAllAsync('SELECT COUNT(*) as count FROM light_knowledge');
      const knowledgeItems = (knowledgeResult[0] as any)?.count || 0;

      // Count demonstrations
      const demosResult = await db.getAllAsync('SELECT COUNT(*) as count FROM light_demonstrations');
      const demonstrations = (demosResult[0] as any)?.count || 0;

      // Estimate storage size
      const patternSize = patternsStr ? new Blob([patternsStr]).size : 0;
      const knowledgeSize = knowledgeItems * 5000; // ~5KB per item estimate
      const demoSize = demonstrations * 10000;      // ~10KB per demo estimate
      const totalSizeMB = (patternSize + knowledgeSize + demoSize) / (1024 * 1024);

      return {
        patterns,
        knowledgeItems,
        demonstrations,
        totalSizeMB,
        lastCleanup: parseInt(await AsyncStorage.getItem(STORAGE_KEYS.LAST_CLEANUP) || '0'),
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {
        patterns: 0,
        knowledgeItems: 0,
        demonstrations: 0,
        totalSizeMB: 0,
        lastCleanup: 0,
      };
    }
  }

  /**
   * Check storage health and cleanup if needed
   * Call this periodically (e.g., on app start)
   */
  async checkAndCleanup(): Promise<void> {
    const shouldClean = await this.shouldCleanup();
    if (shouldClean) {
      console.log('⚠️ Storage threshold reached, cleaning up...');
      await this.cleanup();
    } else {
      console.log('✅ Storage levels healthy');
    }
  }

  /**
   * Force full cleanup (for settings/troubleshooting)
   */
  async forceCleanup(): Promise<void> {
    console.log('🗑️ Force cleanup initiated...');
    await this.cleanup();
  }

  /**
   * Get storage usage percentage
   */
  async getUsagePercentage(): Promise<{
    patterns: number;
    knowledge: number;
    demonstrations: number;
    total: number;
  }> {
    const stats = await this.getStats();
    
    return {
      patterns: (stats.patterns / STORAGE_LIMITS.MAX_PATTERNS) * 100,
      knowledge: (stats.knowledgeItems / STORAGE_LIMITS.MAX_KNOWLEDGE_ITEMS) * 100,
      demonstrations: (stats.demonstrations / STORAGE_LIMITS.MAX_DEMONSTRATIONS) * 100,
      total: (stats.totalSizeMB / STORAGE_LIMITS.MAX_STORAGE_MB) * 100,
    };
  }

  /**
   * Clear all Light AI data (nuclear option)
   */
  async clearAll(): Promise<void> {
    console.log('☢️ Clearing all Light AI data...');
    
    // Clear patterns
    await AsyncStorage.removeItem(STORAGE_KEYS.PATTERNS);
    
    // Clear knowledge
    const db = await getDb();
    await db.runAsync('DELETE FROM light_knowledge');
    
    // Clear demonstrations
    await db.runAsync('DELETE FROM light_demonstrations');
    
    // Clear stats
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_CLEANUP);
    await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_STATS);
    
    console.log('✅ All Light AI data cleared');
  }
}

// Singleton instance
export const storageManager = new LightStorageManager();
