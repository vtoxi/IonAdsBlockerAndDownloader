# GitHub Actions CI/CD Guide

## 🤖 Automated Build & Publish Pipeline

Your IonBlock extension now has a complete CI/CD pipeline using GitHub Actions that automatically builds and publishes to all web stores.

---

## 🎯 What's Automated

### 1. **Build Workflow**
- ✅ Validates manifest.json and code
- ✅ Builds packages for Chrome, Firefox, and Edge
- ✅ Generates checksums and build info
- ✅ Stores build artifacts

### 2. **Publish Workflows**
- ✅ Publishes to Chrome Web Store (live in hours)
- ✅ Publishes to Firefox Add-ons (review 1-5 days)
- ✅ Publishes to Edge Add-ons (review 1-2 days)

### 3. **Validation Workflow**
- ✅ Runs on every pull request
- ✅ Validates code before merging
- ✅ Tests build process
- ✅ Comments on PRs with results

### 4. **Release Workflow**
- ✅ Creates GitHub releases
- ✅ Uploads build artifacts
- ✅ Generates release notes

---

## 📂 Workflow Files

### 1. `.github/workflows/build-and-publish.yml`
Main deployment pipeline triggered by:
- **Version tags:** `v1.0.0`, `v1.2.3`, etc.
- **Manual dispatch:** Run manually from Actions tab

### 2. `.github/workflows/validate-pr.yml`
Validation pipeline triggered by:
- Pull requests to `main` branch
- Pushes to `main` branch

---

## 🚀 How to Use

### Automatic Publishing (Recommended)

#### 1. **Make Changes**
```bash
# Edit code, fix bugs, add features
git checkout -b feature-x
# ... make changes ...
```

#### 2. **Bump Version**
```bash
npm run version:bump
# Choose: major (2.0.0), minor (1.1.0), or patch (1.0.1)
```

#### 3. **Commit and Push**
```bash
git add .
git commit -m "Add new feature X"
git push origin feature-x
```

#### 4. **Create Pull Request**
- Go to GitHub
- Create PR from `feature-x` to `main`
- Wait for validation to pass ✅
- Merge PR

#### 5. **Create Release Tag**
```bash
# After merging to main
git checkout main
git pull

# Create and push version tag
git tag -a v1.0.1 -m "Release v1.0.1: Bug fixes and improvements"
git push origin v1.0.1
```

#### 6. **Automatic Deployment**
🎉 **GitHub Actions will automatically:**
1. Build packages for all browsers
2. Run validation tests
3. Publish to Chrome Web Store
4. Publish to Firefox Add-ons
5. Publish to Edge Add-ons
6. Create GitHub Release with artifacts

**Time:** ~10-15 minutes

---

### Manual Publishing (On-Demand)

For testing or selective publishing:

#### 1. **Go to Actions Tab**
- Visit: https://github.com/vtoxi/IonAdsBlockerAndDownloader/actions

#### 2. **Select Workflow**
- Click: "Build and Publish Extension"

#### 3. **Run Workflow**
- Click: "Run workflow" button
- Select branch: `main`
- Choose stores to publish to:
  - ✅ Chrome Web Store
  - ✅ Firefox Add-ons
  - ✅ Edge Add-ons
- Click: "Run workflow"

#### 4. **Monitor Progress**
Watch the workflow run in real-time

---

## 📊 Workflow Stages

```
┌─────────────────────────────────────────┐
│  1. VALIDATION                          │
│  • Check manifest.json                  │
│  • Validate code structure              │
│  • Run validation script                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. BUILD                               │
│  • Build Chrome/Edge package            │
│  • Build Firefox package                │
│  • Create source archive                │
│  • Generate checksums                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. PUBLISH (Parallel)                  │
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │
│  │   Chrome    │  │   Firefox   │     │
│  │  Web Store  │  │   Add-ons   │     │
│  └─────────────┘  └─────────────┘     │
│         │                │              │
│         └────────┬───────┘              │
│                  │                      │
│          ┌───────┴────────┐            │
│          │  Edge Add-ons  │            │
│          └────────────────┘            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. RELEASE                             │
│  • Create GitHub Release                │
│  • Upload build artifacts               │
│  • Generate release notes               │
└─────────────────────────────────────────┘
```

---

## 🔧 Required Setup

### Step 1: Add Secrets

**Required:** 10 secrets total

See **[.github/SECRETS_SETUP.md](.github/SECRETS_SETUP.md)** for detailed instructions.

**Quick Checklist:**
- [ ] `CHROME_CLIENT_ID`
- [ ] `CHROME_CLIENT_SECRET`
- [ ] `CHROME_REFRESH_TOKEN`
- [ ] `CHROME_APP_ID`
- [ ] `FIREFOX_JWT_ISSUER`
- [ ] `FIREFOX_JWT_SECRET`
- [ ] `EDGE_CLIENT_ID`
- [ ] `EDGE_CLIENT_SECRET`
- [ ] `EDGE_ACCESS_TOKEN_URL`
- [ ] `EDGE_PRODUCT_ID`

### Step 2: Enable Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select:
   - ✅ "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
4. Click **Save**

### Step 3: Test Pipeline

```bash
# Create a test tag
git tag -a v1.0.0-test -m "Test release"
git push origin v1.0.0-test

# Watch the Actions tab
```

---

## 📧 Notifications

### Success Notifications
When workflows succeed, you'll get:
- ✅ Email notification (if enabled)
- ✅ Comment on commit with status
- ✅ Green checkmark on commit
- ✅ GitHub release created

### Failure Notifications
When workflows fail, you'll get:
- ❌ Email notification (if enabled)
- ❌ Comment on commit with error
- ❌ Red X on commit
- ❌ Workflow logs with details

---

## 🔍 Monitoring Workflows

### View Workflow Runs
1. Go to **Actions** tab
2. See all workflow runs with status
3. Click on a run to see details

### Check Logs
1. Click on workflow run
2. Click on job name (e.g., "Publish to Chrome Web Store")
3. Expand steps to see detailed logs

### Download Artifacts
1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download ZIP files:
   - `chrome-build`
   - `firefox-build`
   - `firefox-source`
   - `build-info`

---

## 🐛 Troubleshooting

### Workflow Fails at Validation
**Cause:** Code errors or invalid files

**Fix:**
```bash
# Run validation locally
npm run validate

# Fix errors and push
git add .
git commit -m "Fix validation errors"
git push
```

### Workflow Fails at Build
**Cause:** Build script errors

**Fix:**
```bash
# Test build locally
npm run build

# Check for errors
# Fix and push
```

### Workflow Fails at Publish
**Cause:** API credentials or permissions

**Fix:**
1. Check secrets are set correctly
2. Verify credentials haven't expired
3. Check store API status pages
4. Test credentials locally:
```bash
source scripts/.env
npm run publish:chrome  # Test one store
```

### Workflow Doesn't Trigger
**Cause:** Tag format or permissions

**Fix:**
- Ensure tag format: `vX.Y.Z` (e.g., `v1.0.0`)
- Check Actions are enabled in Settings
- Verify workflow files are in `.github/workflows/`

---

## 📈 Best Practices

### 1. **Version Numbering**
Use semantic versioning:
- **Major** (v2.0.0): Breaking changes
- **Minor** (v1.1.0): New features
- **Patch** (v1.0.1): Bug fixes

### 2. **Tag Messages**
Use descriptive tag messages:
```bash
git tag -a v1.2.0 -m "Release v1.2.0

- Add new feature X
- Fix bug Y
- Improve performance Z"
```

### 3. **Testing Before Release**
Always test locally first:
```bash
npm run validate
npm run build
# Test in browser
# Then create tag
```

### 4. **Monitoring Releases**
After publishing:
- Check Chrome Web Store dashboard
- Monitor Firefox Add-ons review
- Watch Edge Add-ons status
- Respond to store reviews

### 5. **Handling Failures**
If publish fails:
- Don't panic! Builds are saved as artifacts
- Check workflow logs
- Fix credentials if needed
- Re-run failed jobs or create new tag

---

## 🔄 Workflow Customization

### Change Trigger Conditions

Edit `.github/workflows/build-and-publish.yml`:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'          # Only vX.Y.Z tags
      # - 'release-*'     # Also release-* tags
  workflow_dispatch:      # Manual trigger
  # schedule:             # Scheduled builds
  #   - cron: '0 0 * * 0' # Every Sunday
```

### Selective Publishing

Run workflow manually and uncheck stores you don't want to publish to.

### Add Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Extension published! 🎉"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📊 CI/CD Metrics

Track your automation success:
- **Build time:** ~5-7 minutes
- **Total deployment:** ~10-15 minutes
- **Success rate:** Aim for >95%
- **Time saved:** ~25 minutes per release

---

## 🎓 Learning Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Workflow Syntax:** https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- **Encrypted Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Example Workflows:** https://github.com/actions/starter-workflows

---

## ✅ Quick Start Checklist

- [ ] Read this guide
- [ ] Add all 10 secrets (see SECRETS_SETUP.md)
- [ ] Enable GitHub Actions
- [ ] Test with manual workflow dispatch
- [ ] Create a version tag to test automatic deployment
- [ ] Monitor first workflow run
- [ ] Check store dashboards
- [ ] Celebrate successful automation! 🎉

---

**🚀 You're now set up for automated releases! Every tag push will deploy to all stores automatically.**

**Need help?** Check workflow logs or open an issue in the repository.

