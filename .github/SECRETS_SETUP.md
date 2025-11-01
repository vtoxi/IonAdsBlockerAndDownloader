# GitHub Actions Secrets Setup Guide

## Required Secrets for Automated Publishing

To enable automated building and publishing to all web stores, you need to add the following secrets to your GitHub repository.

---

## 🚀 Quick Setup (Automated)

**NEW:** We provide automated scripts to add all secrets at once!

### Using GitHub CLI (Recommended - 2 minutes)
```bash
# Install GitHub CLI (if not already installed)
brew install gh  # macOS

# Authenticate
gh auth login

# Run automation script
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

### Using GitHub API (Alternative)
```bash
# Install dependencies
brew install jq
pip3 install PyNaCl

# Run API script
chmod +x scripts/setup-github-secrets-api.sh
export GITHUB_TOKEN="your_personal_access_token"
./scripts/setup-github-secrets-api.sh
```

**📚 Full Documentation:** See `scripts/SECRETS_AUTOMATION_README.md` for detailed instructions.

---

## 📖 Manual Setup (Traditional Method)

If you prefer to add secrets manually through the GitHub UI, follow the instructions below.

---

## 📍 Where to Add Secrets

1. Go to your repository: https://github.com/vtoxi/IonAdsBlockerAndDownloader
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

---

## 🔐 Required Secrets

### Chrome Web Store (4 secrets)

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `CHROME_CLIENT_ID` | OAuth 2.0 Client ID | Google Cloud Console → APIs & Services → Credentials |
| `CHROME_CLIENT_SECRET` | OAuth 2.0 Client Secret | Same as above |
| `CHROME_REFRESH_TOKEN` | OAuth 2.0 Refresh Token | Use OAuth authorization flow |
| `CHROME_APP_ID` | Your extension ID | Chrome Web Store Developer Dashboard |

**Detailed Steps:**

1. **Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Create project or select existing
   - Enable "Chrome Web Store API"
   - Create OAuth 2.0 credentials (Desktop app)
   - Copy Client ID and Client Secret

2. **Get Refresh Token:**
   ```bash
   # 1. Get authorization code (replace YOUR_CLIENT_ID)
   # Open this URL in browser:
   https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob
   
   # 2. Exchange code for refresh token
   curl -X POST https://accounts.google.com/o/oauth2/token \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=AUTHORIZATION_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
   ```

3. **Extension ID:**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Your extension ID is visible in the URL or extension details

---

### Firefox Add-ons (2 secrets)

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `FIREFOX_JWT_ISSUER` | JWT Issuer (API Key) | Firefox Developer Hub |
| `FIREFOX_JWT_SECRET` | JWT Secret | Firefox Developer Hub |

**Detailed Steps:**

1. Go to: https://addons.mozilla.org/developers/addon/api/key/
2. Click **"Generate new credentials"**
3. Copy the **JWT Issuer** and **JWT Secret**
4. Add them as secrets in GitHub

---

### Microsoft Edge Add-ons (4 secrets)

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `EDGE_CLIENT_ID` | Azure AD Client ID | Microsoft Partner Center |
| `EDGE_CLIENT_SECRET` | Azure AD Client Secret | Same as above |
| `EDGE_ACCESS_TOKEN_URL` | OAuth token URL | Format: `https://login.microsoftonline.com/{tenant-id}/oauth2/token` |
| `EDGE_PRODUCT_ID` | Your extension Product ID | Partner Center Dashboard |

**Detailed Steps:**

1. **Partner Center:**
   - Go to: https://partner.microsoft.com/dashboard
   - Navigate to your extension

2. **Create Azure AD Application:**
   - Go to Account Settings → Manage users → Azure AD applications
   - Click "Create new Azure AD application"
   - Copy Client ID and Client Secret
   - Note your Tenant ID for the token URL

3. **Token URL Format:**
   ```
   https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/token
   ```

4. **Product ID:**
   - Found in Partner Center → Product Management → Product Identity

---

## 📋 Complete Secrets Checklist

Copy this checklist when adding secrets:

### Chrome Web Store
- [ ] `CHROME_CLIENT_ID`
- [ ] `CHROME_CLIENT_SECRET`
- [ ] `CHROME_REFRESH_TOKEN`
- [ ] `CHROME_APP_ID`

### Firefox Add-ons
- [ ] `FIREFOX_JWT_ISSUER`
- [ ] `FIREFOX_JWT_SECRET`

### Microsoft Edge Add-ons
- [ ] `EDGE_CLIENT_ID`
- [ ] `EDGE_CLIENT_SECRET`
- [ ] `EDGE_ACCESS_TOKEN_URL`
- [ ] `EDGE_PRODUCT_ID`

**Total: 10 secrets required**

---

## 🧪 Testing the Pipeline

### Option 1: Tag-based Deployment (Automatic)
```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# This will trigger automatic build and publish to all stores
```

### Option 2: Manual Deployment (On-Demand)
1. Go to: **Actions** tab in GitHub
2. Select **"Build and Publish Extension"** workflow
3. Click **"Run workflow"**
4. Choose which stores to publish to
5. Click **"Run workflow"** button

---

## 🔍 Verifying Secrets Are Set

After adding all secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify you see all 10 secrets listed
3. They should show: "Updated X minutes ago"
4. Secrets are encrypted and cannot be viewed after creation

---

## 🚨 Security Best Practices

### ✅ Do:
- Keep secrets secure and never commit them to code
- Use separate credentials for development and production
- Rotate secrets every 90 days
- Restrict secret access to necessary users only
- Use environment-specific secrets if needed

### ❌ Don't:
- Never hardcode secrets in workflow files
- Never share secrets in public channels
- Never commit `.env` files with real credentials
- Never reuse the same credentials across projects

---

## 🔄 Rotating Secrets

When you need to update a secret:

1. Generate new credentials from the respective platform
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click on the secret name
4. Click **"Update secret"**
5. Paste new value
6. Click **"Update secret"** button
7. Revoke old credentials from the platform

---

## 🆘 Troubleshooting

### Pipeline Fails with "Unauthorized" Error
- Check that all secrets are set correctly
- Verify secrets don't have extra spaces or line breaks
- Check if tokens/credentials have expired
- Ensure API access is enabled on each platform

### Pipeline Fails at Build Step
- Check manifest.json syntax
- Verify all required files exist
- Run local validation: `npm run validate`

### Pipeline Fails at Publish Step
- Check store-specific credentials
- Verify extension IDs are correct
- Check if you have permissions on the store account
- Review store API status pages

---

## 📚 Additional Resources

- **Chrome Web Store API:** https://developer.chrome.com/docs/webstore/using_webstore_api/
- **Firefox Add-ons API:** https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
- **Edge Add-ons API:** https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/
- **GitHub Actions Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## ✅ After Setup

Once all secrets are added:

1. Test with manual workflow dispatch
2. Verify builds are created
3. Check publish logs for each store
4. Monitor store dashboards for review status
5. Set up tag-based releases for production

---

**Need help?** Open an issue in the repository with the workflow error logs (remove any sensitive information first).

