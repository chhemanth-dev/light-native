# GitHub Build Setup with API Keys

Your OpenAI API key is now configured locally, but we can't push it to GitHub (security risk).

Instead, we'll use **GitHub Secrets** to inject it during the build.

## Step 1: Add OpenAI Key as GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENAI_API_KEY`
5. Value: `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`
6. Click **Add secret**

## Step 2: Push Changes to GitHub

```bash
git add .
git commit -m "Add GitHub workflow for building APK with API keys"
git push origin main
```

## Step 3: Trigger Build

The build will start automatically after push, or you can:

1. Go to **Actions** tab on GitHub
2. Click **Build APK with API Keys** workflow
3. Click **Run workflow** → **Run workflow**

## Step 4: Download APK

Once the build completes (~10-15 minutes):

1. Go to the **Actions** tab
2. Click on the completed workflow run
3. Scroll down to **Artifacts**
4. Download **light-release-with-keys**
5. Extract the ZIP to get your APK

## Security Notes

✅ Your API key is stored securely in GitHub Secrets (encrypted)
✅ The key is never committed to the repository
✅ The key is only injected during the build process
✅ The workflow file is safe to commit (it only references the secret name)

## Local Development

For local development, keep using your `init-api-keys.local.ts` file (git-ignored).

The GitHub workflow will automatically create this file during the build using the secret.

