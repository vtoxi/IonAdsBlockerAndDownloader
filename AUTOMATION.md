# IonBlock - Automation Guide

Complete guide for automated building and publishing to all web stores.

---

## 🚀 Quick Start

### One-Command Publish

```bash
# Build and publish to all stores
npm run publish
```

That's it! The script will:
1. ✅ Build packages for all browsers
2. ✅ Validate all builds
3. ✅ Publish to Chrome, Firefox, and Edge
4. ✅ Show status and links

---

## 📋 Prerequisites

### 1. Install Node.js
```bash
# Check if installed
node --version  # Should be >= 14.0.0

# If not installed, download from:
# https://nodejs.org/
```

### 2. Install npm Dependencies (Optional)
```bash
cd ionblock-extension
npm install  # No dependencies currently, but good practice
```

### 3. Make Scripts Executable
```bash
chmod +x scripts/*.sh
```

---

## 🔑 Setting Up API Credentials

### Option 1: Interactive Setup (Recommended)

```bash
npm run setup:credentials
```

This will guide you through setting up credentials for all three stores.

### Option 2: Manual Setup

Create `scripts/.env` file:

```bash
# Chrome Web Store
export CHROME_CLIENT_ID="your-client-id"
export CHROME_CLIENT_SECRET="your-client-secret"
export CHROME_REFRESH_TOKEN="your-refresh-token"
export CHROME_APP_ID="your-extension-id"

# Firefox Add-ons
export FIREFOX_JWT_ISSUER="your-jwt-issuer"
export FIREFOX_JWT_SECRET="your-jwt-secret"

# Microsoft Edge Add-ons
export EDGE_CLIENT_ID="your-client-id"
export EDGE_CLIENT_SECRET="your-client-secret"
export EDGE_ACCESS_TOKEN_URL="your-token-url"
export EDGE_PRODUCT_ID="your-product-id"
```

Then load credentials:
```bash
source scripts/.env
```

---

## 🔐 Getting API Credentials

### Chrome Web Store

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable Chrome Web Store API**
   - APIs & Services → Enable APIs
   - Search for "Chrome Web Store API"
   - Enable it

3. **Create OAuth 2.0 Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Desktop app
   - Copy Client ID and Client Secret

4. **Get Refresh Token**
   ```bash
   # Use this URL (replace CLIENT_ID):
   https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob
   
   # Exchange authorization code for refresh token:
   curl -X POST https://accounts.google.com/o/oauth2/token \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=AUTHORIZATION_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
   ```

5. **Get App ID**
   - Visit: https://chrome.google.com/webstore/devconsole
   - Your extension ID is in the URL or extension details

**Documentation:** https://developer.chrome.com/docs/webstore/using_webstore_api/

### Firefox Add-ons

1. **Go to Firefox Add-ons Developer Hub**
   - Visit: https://addons.mozilla.org/developers/addon/api/key/

2. **Generate API Credentials**
   - Click "Generate new credentials"
   - Copy JWT Issuer and JWT Secret
   - Store securely

**Documentation:** https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign

### Microsoft Edge Add-ons

1. **Go to Partner Center**
   - Visit: https://partner.microsoft.com/dashboard

2. **Register Your Extension**
   - Submit your extension first (can be draft)
   - Note your Product ID

3. **Generate API Credentials**
   - Go to Account Settings → Manage users → Azure AD applications
   - Create new Azure AD application
   - Copy Client ID, Client Secret, and Tenant ID
   - Token URL format: `https://login.microsoftonline.com/{tenant-id}/oauth2/token`

**Documentation:** https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api

---

## 🛠️ Available Commands

### Build Only
```bash
npm run build
# Creates ZIP files in dist/ folder
```

### Validate Before Publishing
```bash
npm run validate
# Checks manifest, files, rules, etc.
```

### Publish to Specific Store
```bash
npm run publish:chrome
npm run publish:firefox
npm run publish:edge
```

### Publish to All Stores
```bash
npm run publish
# Interactive menu to select stores
```

### Version Management
```bash
npm run version:bump
# Increments version number
# Options: major, minor, patch, custom
```

### Clean Build Artifacts
```bash
npm run clean
# Removes build/ and dist/ directories
```

---

## 📦 Build Process

The build script (`scripts/build.sh`) performs:

1. **Validation**
   - Checks manifest.json syntax
   - Verifies required files exist
   - Warns about console.log statements

2. **Chrome/Edge Build**
   - Copies all extension files
   - Removes Firefox-specific manifest fields
   - Creates `ionblock-chrome-vX.Y.Z.zip`

3. **Firefox Build**
   - Copies all extension files
   - Ensures Firefox manifest fields present
   - Creates `ionblock-firefox-vX.Y.Z.zip`
   - Creates source code archive (required by Firefox)

4. **Checksums**
   - Generates SHA256 checksums for all ZIPs

5. **Build Info**
   - Creates BUILD_INFO.txt with metadata

**Output:** All files in `dist/` folder

---

## 🚀 Publishing Process

### Chrome Web Store

1. **Upload Package**
   - Uses Chrome Web Store API
   - Uploads ZIP file

2. **Publish**
   - Publishes to store
   - Typically live within hours

3. **Status**
   - Checks extension status
   - Reports any errors

### Firefox Add-ons

1. **Upload Package**
   - Uses web-ext sign or Firefox API
   - Uploads both extension and source code

2. **Validation**
   - Automated validation first
   - Manual review by Mozilla staff

3. **Review Wait**
   - Typical: 1-5 business days
   - May request changes

### Microsoft Edge Add-ons

1. **Upload Package**
   - Uses Partner Center API
   - Creates new submission

2. **Processing**
   - Automated tests run
   - Usually faster than Chrome

3. **Publish**
   - Typically live within 1-2 days

---

## 🔄 Complete Workflow

### 1. Make Changes
```bash
# Edit code, test locally
```

### 2. Bump Version
```bash
npm run version:bump
# Select: patch, minor, or major
```

### 3. Validate
```bash
npm run validate
# Fix any errors
```

### 4. Build
```bash
npm run build
# Creates dist/ionblock-*-vX.Y.Z.zip files
```

### 5. Test Builds
```bash
# Manually load each ZIP in respective browser
# Verify all features work
```

### 6. Publish
```bash
# Load credentials
source scripts/.env

# Publish to all stores
npm run publish
```

### 7. Monitor
```bash
# Check each store's dashboard for review status
# Respond to any feedback
```

---

## 🔧 Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/*.sh
```

### "Node not found"
```bash
# Install Node.js from nodejs.org
# Or use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 14
```

### "Credentials not found"
```bash
# Make sure to load credentials:
source scripts/.env

# Or set them manually:
export CHROME_CLIENT_ID="..."
# etc.
```

### "Build failed"
```bash
# Check validation first:
npm run validate

# Check manifest.json syntax:
node -e "require('./manifest.json')"
```

### "Upload failed"
```bash
# Check credentials are correct
# Check network connection
# Verify extension ID/Product ID matches
# Check token hasn't expired
```

---

## 🔐 Security Best Practices

1. **Never Commit Credentials**
   ```bash
   # .gitignore already includes:
   .env
   scripts/.env
   credentials.json
   ```

2. **Use Separate Credentials**
   - Development credentials
   - Production credentials
   - Never mix them

3. **Rotate Regularly**
   - Change API keys every 90 days
   - Revoke unused credentials

4. **Restrict Permissions**
   - Give minimum required scope
   - Use separate accounts if possible

5. **Monitor Access**
   - Check API usage logs
   - Set up alerts for unusual activity

---

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      
      - name: Build Extension
        run: npm run build
      
      - name: Publish to Chrome
        env:
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          CHROME_APP_ID: ${{ secrets.CHROME_APP_ID }}
        run: npm run publish:chrome
      
      - name: Publish to Firefox
        env:
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
        run: npm run publish:firefox
```

---

## 📚 Additional Resources

- **Chrome Web Store API**: https://developer.chrome.com/docs/webstore/using_webstore_api/
- **Firefox Add-ons API**: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
- **Edge Add-ons API**: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/

---

## 🆘 Getting Help

If automation scripts fail:
1. Check error messages carefully
2. Verify credentials are loaded (`echo $CHROME_CLIENT_ID`)
3. Test API access with curl
4. Check store dashboard for manual errors
5. Open GitHub issue with details

---

**Happy Automating! 🤖**

