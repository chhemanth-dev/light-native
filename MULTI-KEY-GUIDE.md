# Multiple API Keys Guide

## How It Works

### Primary Key System
- **First key you add = PRIMARY** (always tried first)
- Additional keys = BACKUPS (tried if primary fails)
- Order matters: Keys tried in the order you added them

### Auto-Rotation on Failure
When a key fails (out of balance/invalid):
1. Tries PRIMARY key first
2. If fails, tries BACKUP key #1
3. If fails, tries BACKUP key #2
4. After all keys fail once, STOPS (no infinite loop!)
5. Shows clear error with key count

### Example Flow
```
You have:
- OpenAI Key 1 (PRIMARY - added first)
- OpenAI Key 2 (BACKUP)
- OpenAI Key 3 (BACKUP)

Request 1:
→ Tries Key 1 ✓ SUCCESS → Uses Key 1

Request 2 (Key 1 out of balance):
→ Tries Key 1 ✗ Failed (insufficient balance)
→ Tries Key 2 ✓ SUCCESS → Uses Key 2

Request 3 (All keys exhausted):
→ Tries Key 1 ✗ Failed
→ Tries Key 2 ✗ Failed  
→ Tries Key 3 ✗ Failed
→ STOPS with error: "All 3 keys failed"
```

## How to Add Multiple Keys

### Method 1: In Settings (Coming Soon)
1. Go to Settings → AI Settings
2. Tap "Add Another Key" for same provider
3. Keys are tried in order added

### Method 2: In Code (Advanced)
```typescript
// Set primary key
setAPIKey('openai', 'sk-proj-PRIMARY_KEY_HERE');

// Add backup keys
addAPIKey('openai', 'sk-proj-BACKUP_KEY_1');
addAPIKey('openai', 'sk-proj-BACKUP_KEY_2');

// Or set all at once
setAPIKey('openai', [
  'sk-proj-PRIMARY_KEY',
  'sk-proj-BACKUP_KEY_1',
  'sk-proj-BACKUP_KEY_2',
]);
```

## Benefits

### 1. Zero Downtime
When one key runs out of balance, automatically switches to backup.

### 2. Multiple Accounts
Use different OpenAI accounts for redundancy:
- Work account (primary)
- Personal account (backup)
- Free trial account (last resort)

### 3. Rate Limit Handling
If you hit rate limits, automatically tries next key.

### 4. Smart Rotation
- Only rotates on actual failure
- Resets to primary on success
- Stops after trying all keys once

## Error Messages

### Good Key Available
```
✓ Using OpenAI key 1 of 3
✓ SUCCESS
```

### Rotating Keys
```
✗ OpenAI key 1 failed: insufficient_quota
⟳ Rotating to backup key 2 of 3
✓ SUCCESS with key 2
```

### All Keys Failed
```
✗ All 3 OpenAI keys failed:
  - Key 1/3: insufficient_quota
  - Key 2/3: insufficient_quota
  - Key 3/3: invalid_api_key

Please:
1. Check if keys are valid
2. Verify accounts have credit balance
3. Update keys in Settings → AI Settings
```

## Provider Priority

Default order when using "Auto" mode:
1. **OpenAI** (most reliable)
2. **Claude** (best reasoning)
3. **Gemini** (fastest)

Each provider tries ALL its keys before moving to next provider.

## Best Practices

### 1. Set Primary Key First
Your most reliable/funded account should be first.

### 2. Label Your Keys (Mental Note)
- Key 1: "Work account ($20 balance)"
- Key 2: "Personal ($5 balance)"
- Key 3: "Backup (free trial)"

### 3. Monitor Logs
Check which key is being used:
```
[AI] Using OpenAI key 1 of 3 (sk-proj-abc...)
```

### 4. Update Before Exhaustion
Don't wait for all keys to fail - update primary when low.

## Troubleshooting

### "All keys failed" error
1. Check API key validity in provider dashboard
2. Verify account credit balance
3. Try adding a fresh key
4. Check internet connection

### Keys rotating too often
- Primary key likely out of balance
- Update or remove invalid keys
- Check provider status page

### Not using backup keys
- Means primary is working fine!
- Backups only used on failure

## Current Limitations

1. **UI not ready yet** - Can't add multiple keys in Settings UI
2. **Must use code** - For now, use `setAPIKey()` function
3. **No per-key labels** - Can't name keys in UI

## Coming Soon

- [ ] UI to add multiple keys per provider
- [ ] Show which key is active
- [ ] Key management (remove, reorder)
- [ ] Balance checking per key
- [ ] Key usage stats

---

**Your question answered:** The system will NOT infinitely rotate. After trying all keys once, it stops with a clear error message telling you to update keys in Settings.
