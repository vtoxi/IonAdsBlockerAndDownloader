# 🤖 IonBlock Automation - Quick Start

## One-Command Publishing

### Setup (First Time Only)
```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Set up credentials
npm run setup:credentials
# Follow the interactive prompts

# 3. Load credentials
source scripts/.env
```

### Publish to All Stores
```bash
npm run publish
```

That's it! 🎉

---

## What Happens

```
┌──────────────────────────────────────┐
│  Pre-flight Checks                   │
├──────────────────────────────────────┤
│  ✓ Node.js installed                 │
│  ✓ manifest.json valid               │
│  ✓ All scripts found                 │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│  Build Extension                     │
├──────────────────────────────────────┤
│  → Building for Chrome/Edge...       │
│  → Building for Firefox...           │
│  → Creating source archive...        │
│  → Generating checksums...           │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│  Validate Builds                     │
├──────────────────────────────────────┤
│  ✓ Chrome build ready                │
│  ✓ Firefox build ready               │
│  ✓ Source code ready                 │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│  Publish to Stores                   │
├──────────────────────────────────────┤
│  → Chrome Web Store...               │
│  → Firefox Add-ons...                │
│  → Edge Add-ons...                   │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│  Summary & Status                    │
├──────────────────────────────────────┤
│  ✓ All stores updated                │
│  📊 Review status links              │
│  🔗 Store URLs                       │
└──────────────────────────────────────┘
```

---

## Individual Commands

### Build Only
```bash
npm run build
# Output: dist/ionblock-*-v1.0.0.zip
```

### Publish to Specific Store
```bash
npm run publish:chrome   # Chrome Web Store
npm run publish:firefox  # Firefox Add-ons
npm run publish:edge     # Edge Add-ons
```

### Version Management
```bash
npm run version:bump     # Interactive version bumper
```

### Validation
```bash
npm run validate         # Check before publishing
```

---

## Getting Credentials

### Chrome Web Store
1. Visit: https://console.cloud.google.com/
2. Enable Chrome Web Store API
3. Create OAuth 2.0 credentials
4. Get refresh token using authorization code flow

**Guide:** See AUTOMATION.md → "Getting API Credentials"

### Firefox Add-ons
1. Visit: https://addons.mozilla.org/developers/addon/api/key/
2. Generate new API credentials
3. Copy JWT Issuer and JWT Secret

### Microsoft Edge Add-ons
1. Visit: https://partner.microsoft.com/dashboard
2. Create Azure AD application
3. Get Client ID, Client Secret, Tenant ID

---

## Typical Workflow

```bash
# 1. Make changes to code
vim background.js

# 2. Bump version
npm run version:bump  # Choose: major/minor/patch

# 3. Validate
npm run validate

# 4. Build & Publish
npm run publish

# 5. Monitor store dashboards for review status
```

---

## Troubleshooting

### "Permission denied"
```bash
chmod +x scripts/*.sh
```

### "Credentials not found"
```bash
source scripts/.env
```

### "Build failed"
```bash
npm run validate  # Check what's wrong
node -e "require('./manifest.json')"  # Validate JSON
```

---

## Time Saved ⏱️

**Manual Process:** ~30 minutes per release
- Build packages manually: 10 min
- Upload to each store: 5 min × 3 = 15 min
- Update metadata: 5 min

**Automated Process:** ~2 minutes
- Run one command: 2 min
- Everything else is automatic ✨

**Time saved:** 28 minutes per release!

---

## Security 🔐

```bash
# Never commit credentials
# .gitignore already includes:
.env
scripts/.env
```

Store credentials securely:
- Use environment variables
- Use secrets manager (in CI/CD)
- Rotate regularly

---

## Full Documentation

See **AUTOMATION.md** for complete guide including:
- Detailed API credential setup
- CI/CD integration examples
- Troubleshooting guide
- Security best practices

---

**Ready to automate? Run: `npm run setup:credentials`**

