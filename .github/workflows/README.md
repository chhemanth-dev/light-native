# GitHub Actions Workflows - Usage Guide

## 🎯 Active Workflow (Auto-Runs on Push)

### `build-apk.yml` ✅ **PRODUCTION**
**Triggers:** Automatically on every push to `main`

**What it does:**
- Builds **Release APK** (production-ready)
- Optimized for speed and disk space
- Uses Ubuntu 24.04 (latest)
- Creates GitHub Release with APK
- Uses Gradle cache for faster builds

**Output:** `app-release.apk`

**When to use:** This runs automatically - you don't need to do anything!

**Minutes used per build:** ~15-20 minutes

---

## 🔧 Manual Workflows (Disabled Auto-Trigger)

These workflows are **disabled** for automatic triggers to save GitHub Actions minutes. You can still run them manually via "Actions" → "Run workflow" if needed.

### `build-with-secrets.yml` 🔐 (Manual Only)
**Triggers:** Manual only (`workflow_dispatch`)

**What it does:**
- Injects API keys from GitHub Secrets
- Builds Release APK with API keys embedded
- For builds that need external API access (OpenAI, etc.)

**When to use manually:**
- When you want to include API keys in the build
- For special builds with external service integration

**Output:** `app-release.apk` (with API keys)

### `android-build.yml` 🐛 (Manual Only)
**Triggers:** Manual only (`workflow_dispatch`)

**What it does:**
- Builds Debug APK
- Creates JavaScript bundle manually
- Older workflow kept for compatibility

**When to use manually:**
- For debugging build issues
- When you need a debug build specifically

**Output:** `app-debug.apk`

### `build-debug-apk.yml` 🔍 (Manual Only)
**Triggers:** Manual only (`workflow_dispatch`)

**What it does:**
- Simple debug build
- Faster than release builds
- No optimization, easier to debug

**When to use manually:**
- Quick test builds
- Development testing
- When you don't need a production APK

**Output:** `app-debug.apk`

---

## 💡 Why This Setup Saves Minutes

### Before (Wasteful):
```
Every git push triggered ALL 4 workflows:
- build-apk.yml          → 15 min
- build-with-secrets.yml → 18 min
- android-build.yml      → 12 min
- build-debug-apk.yml    → 10 min
─────────────────────────────────
Total per push: 55 minutes! ❌
```

### After (Optimized):
```
Every git push triggers ONLY 1 workflow:
- build-apk.yml → 15 min ✅

Other workflows available manually when needed.
─────────────────────────────────
Total per push: 15 minutes! ✅

Savings: 40 minutes per push! 🎉
```

---

## 📊 GitHub Actions Minutes Budget

**Free tier:** 2,000 minutes/month per account

### Before Optimization:
- 55 min per push × 36 pushes = **All 2000 minutes used** ❌

### After Optimization:
- 15 min per push × 133 pushes = 2000 minutes ✅
- **You get 3.6x more builds!** 🎉

---

## 🚀 How To Use

### For Regular Development (Most Common):
1. Make your code changes
2. Commit and push to `main`
3. `build-apk.yml` runs automatically
4. Wait 15-20 minutes
5. Download APK from Releases

### For Special Builds (Rare):
1. Go to GitHub Actions tab
2. Select the workflow you need (e.g., `build-with-secrets.yml`)
3. Click "Run workflow" → "Run workflow" button
4. Wait for completion
5. Download from Releases

---

## 🔄 Which Workflow For What?

| Scenario | Use This Workflow | Trigger |
|----------|------------------|---------|
| Regular code push | `build-apk.yml` | Automatic ✅ |
| Need API keys embedded | `build-with-secrets.yml` | Manual |
| Debug build for testing | `build-debug-apk.yml` | Manual |
| Build troubleshooting | `android-build.yml` | Manual |

---

## ⚡ Pro Tips

1. **Let the auto build finish** before pushing again (saves duplicate builds)
2. **Use manual workflows** only when you specifically need them
3. **Check Actions tab** to see running workflows before pushing again
4. **Debug locally first** to avoid wasting build minutes on broken code

---

## 🛠️ Maintenance

If you ever run out of minutes:
1. Use alt account (light-glitch12) - fresh 2000 minutes
2. Delete old releases to free up storage
3. Consider building locally for testing: `cd android && ./gradlew assembleRelease`

---

**Last Updated:** December 2024
**Optimization:** Reduced from 4 auto-triggers to 1 (saves 40 min per push!)
