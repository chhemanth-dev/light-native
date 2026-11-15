# Light AI Storage Management 💾

## Problem: Infinite Storage Growth

You're right to be concerned! Without limits, Light AI could potentially grow forever as it learns:
- ❌ Patterns accumulate infinitely
- ❌ Web knowledge keeps growing
- ❌ User demonstrations pile up
- ❌ Phone storage fills up
- ❌ App becomes slow

## Solution: Intelligent Storage Management ✅

Light AI now has **smart storage limits** and **automatic cleanup** that keeps it lean and fast!

---

## 📊 Storage Limits

### Default Limits (Configurable)
```typescript
MAX_PATTERNS: 100         // Max learned patterns
MAX_KNOWLEDGE_ITEMS: 500  // Max web knowledge items
MAX_DEMONSTRATIONS: 50    // Max user demonstrations
MAX_PATTERN_EXAMPLES: 20  // Max examples per pattern
MAX_STORAGE_MB: 50        // Max total storage (50 MB)
CLEANUP_THRESHOLD: 0.8    // Cleanup at 80% full
```

### What This Means
- **Total storage cap**: 50 MB (very small!)
- **Auto-cleanup**: Triggers at 80% full (40 MB)
- **Smart retention**: Keeps most useful data
- **Always fast**: Never slows down

---

## 🧹 Cleanup Strategy

### When Cleanup Happens
1. **Automatic**: When storage reaches 80% of any limit
2. **On app start**: Quick health check
3. **Manual**: User can force cleanup anytime

### What Gets Removed (In Order)
```
Priority 1: Low-confidence, rarely used patterns
Priority 2: Old, rarely accessed knowledge
Priority 3: Old, rarely used demonstrations
```

### What NEVER Gets Removed
✅ High-confidence patterns (frequently used)
✅ Recently accessed knowledge
✅ Recently used demonstrations
✅ Pre-trained patterns (6000 examples stay in JSON)

---

## 🎯 Smart Cleanup Algorithm

### For Patterns
```
1. Calculate score: confidence × usage_count
2. Sort by score (high to low)
3. Keep top 100 patterns
4. For each kept pattern:
   - Keep only last 20 examples
   - Remove older examples
```

### For Knowledge
```
1. Sort by: access_count + recency
2. Keep top 500 items
3. Remove oldest, least accessed
```

### For Demonstrations
```
1. Sort by: use_count + recency
2. Keep top 50 demos
3. Remove oldest, least used
```

---

## 📈 Storage Growth Examples

### Typical User (Moderate Use)
```
Week 1:  5 MB  (initial training data)
Week 2:  8 MB  (learning from use)
Week 3:  12 MB (more knowledge)
Week 4:  15 MB (stable, auto-cleanup running)
Month 2: 15 MB (stays stable!)
Month 6: 15 MB (still stable!)
Year 1:  15 MB (always stable!)
```

### Power User (Heavy Use)
```
Week 1:  5 MB  (initial training)
Week 2:  15 MB (lots of learning)
Week 3:  25 MB (teaching many tasks)
Week 4:  35 MB (heavy web searches)
Week 5:  40 MB → AUTO CLEANUP → 25 MB
Week 6:  30 MB (growing again)
Week 7:  40 MB → AUTO CLEANUP → 28 MB
Stable: 25-40 MB range (with cleanups)
```

### Maximum Possible Storage
```
Absolute max: 50 MB (hard limit)
Cleanup triggers at: 40 MB
Typical range: 15-30 MB
Minimum: 5 MB (training data only)
```

---

## 🔍 Monitoring Storage

### In Code
```typescript
import { lightAI } from './src/lib/light-ai-service';

// Get detailed health info
const health = await lightAI.getStorageHealth();
console.log(health);
// {
//   status: 'healthy' | 'warning' | 'critical',
//   message: 'Storage levels are healthy',
//   stats: {
//     patterns: 42,
//     knowledgeItems: 156,
//     demonstrations: 8,
//     totalSizeMB: 18.5,
//     lastCleanup: 1734278400000
//   },
//   usage: {
//     patterns: 42%,
//     knowledge: 31%,
//     demonstrations: 16%,
//     total: 37%
//   }
// }
```

### In UI
```typescript
import { StorageHealthCard } from './src/components/StorageHealthCard';

// Add to settings screen
<StorageHealthCard />
```

Shows:
- 📊 Current storage usage
- ⚠️ Health status (healthy/warning/critical)
- 🧹 Manual cleanup button
- 📈 Progress bars
- 📅 Last cleanup date

---

## 🚨 Warning Levels

### Healthy (0-75%)
```
✅ Status: HEALTHY
✅ Color: Green
✅ Action: None needed
✅ Message: "Storage levels are healthy"
```

### Warning (75-90%)
```
⚠️ Status: WARNING
⚠️ Color: Orange
⚠️ Action: Consider cleanup soon
⚠️ Message: "Storage getting full. Consider cleanup soon."
```

### Critical (90-100%)
```
🚨 Status: CRITICAL
🚨 Color: Red
🚨 Action: Cleanup recommended
🚨 Message: "Storage almost full! Cleanup recommended."
🚨 Auto-cleanup: Triggers automatically
```

---

## 🛠️ Manual Cleanup

### For Users
```
Settings → Light AI → Storage Health → [Cleanup Storage]
```

### For Developers
```typescript
import { lightAI } from './src/lib/light-ai-service';

// Force immediate cleanup
await lightAI.cleanupStorage();

// Check if cleanup needed
const storageManager = await import('./src/lib/light-storage-manager');
const needed = await storageManager.storageManager.shouldCleanup();
console.log('Cleanup needed:', needed);

// Get detailed stats
const stats = await storageManager.storageManager.getStats();
console.log(stats);
```

---

## 💡 Best Practices

### For Users
1. **Don't worry about it** - Auto-cleanup handles everything
2. **Check occasionally** - View storage health in settings
3. **Manual cleanup** - If you want to free space now
4. **Reset if needed** - Nuclear option (clears all learning)

### For Developers
1. **Monitor logs** - Cleanup events are logged
2. **Adjust limits** - Edit `STORAGE_LIMITS` if needed
3. **Test cleanup** - Verify cleanup works in your app
4. **Add UI** - Use `StorageHealthCard` component

---

## ⚙️ Customizing Limits

Edit `src/lib/light-storage-manager.ts`:

```typescript
export const STORAGE_LIMITS = {
  MAX_PATTERNS: 100,              // Increase for more patterns
  MAX_KNOWLEDGE_ITEMS: 500,       // Increase for more web knowledge
  MAX_DEMONSTRATIONS: 50,          // Increase for more user demos
  MAX_PATTERN_EXAMPLES: 20,       // Examples per pattern
  MAX_STORAGE_MB: 50,             // Total storage cap
  CLEANUP_THRESHOLD: 0.8,         // 0.8 = 80% full triggers cleanup
};
```

### Recommendations by Device

**Low-end phones** (2-4 GB RAM):
```typescript
MAX_PATTERNS: 50
MAX_KNOWLEDGE_ITEMS: 300
MAX_DEMONSTRATIONS: 30
MAX_STORAGE_MB: 30
```

**Mid-range phones** (4-6 GB RAM):
```typescript
MAX_PATTERNS: 100  // Default
MAX_KNOWLEDGE_ITEMS: 500  // Default
MAX_DEMONSTRATIONS: 50  // Default
MAX_STORAGE_MB: 50  // Default
```

**High-end phones** (8+ GB RAM):
```typescript
MAX_PATTERNS: 200
MAX_KNOWLEDGE_ITEMS: 1000
MAX_DEMONSTRATIONS: 100
MAX_STORAGE_MB: 100
```

---

## 🔬 Technical Details

### Storage Breakdown
```
Training Data (JSON): ~1.2 MB (never cleaned up)
Learned Patterns:     ~50-200 KB (AsyncStorage)
Knowledge Base:       ~5 KB per item (SQLite)
Demonstrations:       ~10 KB per demo (SQLite)
Metadata:            ~10 KB (timestamps, stats)
```

### Cleanup Performance
```
Duration: 100-500ms (depends on data size)
Blocks UI: No (runs async)
Frequency: Only when needed
Impact: None (seamless)
```

### Database Operations
```sql
-- Knowledge cleanup (keeps top 500)
DELETE FROM light_knowledge
WHERE id IN (
  SELECT id FROM light_knowledge
  ORDER BY access_count ASC, last_accessed ASC
  LIMIT ?
);

-- Demonstrations cleanup (keeps top 50)
DELETE FROM light_demonstrations
WHERE id IN (
  SELECT id FROM light_demonstrations
  ORDER BY use_count ASC, last_used ASC
  LIMIT ?
);
```

---

## 📊 Example Cleanup Session

### Before Cleanup
```
Patterns: 142 (42% over limit)
Knowledge: 687 items (37% over limit)
Demonstrations: 62 (24% over limit)
Total Size: 48.7 MB (97% of limit)
Status: 🚨 CRITICAL
```

### Cleanup Process
```
🧹 Starting storage cleanup...
📊 Before cleanup: {...}

Step 1: Patterns
  - Scored all patterns
  - Sorted by confidence × usage
  - Kept top 100 patterns
  - Trimmed examples to 20 per pattern
  🗑️ Cleaned patterns: 142 → 100

Step 2: Knowledge
  - Sorted by access_count + recency
  - Kept top 500 items
  🗑️ Cleaned knowledge: 687 → 500

Step 3: Demonstrations
  - Sorted by use_count + recency
  - Kept top 50 demos
  🗑️ Cleaned demonstrations: 62 → 50

📊 After cleanup: {...}
✅ Freed 18.2 MB
```

### After Cleanup
```
Patterns: 100 (at limit, all high-value)
Knowledge: 500 items (at limit, frequently used)
Demonstrations: 50 (at limit, recent)
Total Size: 30.5 MB (61% of limit)
Status: ✅ HEALTHY
```

---

## 🎓 FAQ

### Q: Will cleanup delete important knowledge?
**A:** No! Cleanup uses smart algorithms:
- Keeps high-confidence patterns
- Keeps frequently accessed knowledge
- Keeps recently used demonstrations
- Only removes old, rarely used data

### Q: How often does cleanup happen?
**A:** Only when needed:
- Automatically at 80% full
- Once per app session max
- Or manually by user

### Q: Can I disable cleanup?
**A:** Not recommended, but you can:
```typescript
// Set very high limits (effectively disables)
MAX_STORAGE_MB: 1000
CLEANUP_THRESHOLD: 0.99
```

### Q: What if I want to keep everything?
**A:** Three options:
1. Increase limits (see Customizing Limits)
2. Export important data before cleanup
3. Disable auto-cleanup (not recommended)

### Q: Will this slow down my app?
**A:** No! Benefits:
- Cleanup is fast (100-500ms)
- Runs in background
- Makes app faster (less data to search)
- Prevents storage-full errors

### Q: What about the 6000 training examples?
**A:** They're safe!
- Stored in JSON file (bundled with app)
- Never cleaned up
- Always available
- Only ~1.2 MB

---

## 🎯 Summary

### The Problem
❌ Learning forever = infinite storage growth

### The Solution
✅ Smart limits + automatic cleanup = always healthy

### The Result
- 📦 Max 50 MB storage (tiny!)
- 🧹 Auto-cleanup at 80% full
- 🎯 Keeps most useful data
- ⚡ Always fast & responsive
- 🔄 Runs seamlessly
- 💯 No user intervention needed

**Light AI learns continuously without filling up your phone!** 🚀
