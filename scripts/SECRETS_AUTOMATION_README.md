# GitHub Secrets Automation Scripts

Two scripts are provided to automatically add secrets to your GitHub repository:

---

## 🚀 Option 1: Using GitHub CLI (Recommended)

**Script:** `setup-github-secrets.sh`

### Prerequisites
- GitHub CLI (`gh`) installed
- Authenticated with GitHub

### Installation
```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install --id GitHub.cli

# Or download from: https://cli.github.com/
```

### Authentication
```bash
gh auth login
```

### Usage

**Method 1: Load from .env file**
```bash
# If you already have scripts/.env with credentials
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh

# Script will automatically load from .env
```

**Method 2: Interactive input**
```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh

# Enter each credential when prompted
```

**Method 3: From environment variables**
```bash
# Export credentials
export CHROME_CLIENT_ID="your-value"
export CHROME_CLIENT_SECRET="your-value"
# ... etc

chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

### What It Does
1. ✅ Checks if GitHub CLI is installed
2. ✅ Verifies authentication
3. ✅ Loads credentials from .env or prompts for input
4. ✅ Adds all 10 secrets to GitHub repository
5. ✅ Verifies secrets were added successfully

---

## 🔧 Option 2: Using GitHub API Directly

**Script:** `setup-github-secrets-api.sh`

### Prerequisites
- `curl` (usually pre-installed)
- `jq` (JSON processor)
- Python 3 with `PyNaCl` OR Node.js with `tweetnacl`
- GitHub Personal Access Token

### Installation

**Install jq:**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
choco install jq
```

**Install encryption library:**

Option A - Python (recommended):
```bash
pip3 install PyNaCl
```

Option B - Node.js:
```bash
npm install -g tweetnacl tweetnacl-util
```

### Get GitHub Token

1. Go to: https://github.com/settings/tokens/new
2. Select scopes: `repo` (full control)
3. Click "Generate token"
4. Copy the token

### Usage

**Method 1: With environment variable**
```bash
export GITHUB_TOKEN="ghp_YourPersonalAccessToken"

chmod +x scripts/setup-github-secrets-api.sh
./scripts/setup-github-secrets-api.sh
```

**Method 2: Interactive**
```bash
chmod +x scripts/setup-github-secrets-api.sh
./scripts/setup-github-secrets-api.sh

# Enter token when prompted
# Then enter credentials
```

**Method 3: Load from .env**
```bash
# With scripts/.env file containing credentials
export GITHUB_TOKEN="ghp_YourToken"

chmod +x scripts/setup-github-secrets-api.sh
./scripts/setup-github-secrets-api.sh
```

### What It Does
1. ✅ Checks dependencies (curl, jq, python/node)
2. ✅ Validates GitHub token
3. ✅ Gets repository public key for encryption
4. ✅ Encrypts each secret using libsodium
5. ✅ Uploads secrets via GitHub REST API
6. ✅ Confirms successful creation

---

## 📋 Comparison

| Feature | GitHub CLI | API Direct |
|---------|------------|------------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ Easiest | ⭐⭐⭐ More complex |
| **Dependencies** | GitHub CLI only | curl, jq, python/node |
| **Setup Time** | 2 minutes | 5 minutes |
| **Authentication** | `gh auth login` | Personal Access Token |
| **Recommended** | ✅ Yes | For advanced users |

---

## 🔐 Security Notes

### Both Scripts:
- ✅ Secrets are encrypted before upload
- ✅ No secrets are stored in script logs
- ✅ Uses official GitHub APIs
- ✅ Respects .gitignore (.env files)

### Best Practices:
1. **Never commit** scripts/.env file
2. **Delete** .env after running script
3. **Rotate** tokens regularly
4. **Use** repo-scoped tokens only
5. **Verify** secrets in GitHub UI after adding

---

## 🚀 Quick Start

### Recommended Workflow (GitHub CLI)

```bash
# 1. Install GitHub CLI
brew install gh  # macOS

# 2. Authenticate
gh auth login

# 3. Prepare credentials
cd scripts
cp .env.example .env  # If you have one
# Edit .env with your credentials

# 4. Run script
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh

# 5. Verify
gh secret list --repo vtoxi/IonAdsBlockerAndDownloader

# 6. Clean up
rm .env  # Remove credentials file
```

**Total Time:** ~5 minutes

---

## 🧪 Testing

After adding secrets:

### Verify Secrets Were Added
```bash
# Using GitHub CLI
gh secret list --repo vtoxi/IonAdsBlockerAndDownloader

# Or visit:
https://github.com/vtoxi/IonAdsBlockerAndDownloader/settings/secrets/actions
```

### Test Workflow
```bash
# Manual test
gh workflow run build-and-publish.yml --repo vtoxi/IonAdsBlockerAndDownloader

# Or create a tag
git tag -a v1.0.0-test -m "Test deployment"
git push origin v1.0.0-test
```

---

## 🐛 Troubleshooting

### GitHub CLI Script Issues

**"gh: command not found"**
```bash
# Install GitHub CLI
brew install gh  # macOS
```

**"Not authenticated"**
```bash
gh auth login
# Follow prompts
```

**"Permission denied"**
```bash
chmod +x scripts/setup-github-secrets.sh
```

### API Script Issues

**"jq: command not found"**
```bash
brew install jq  # macOS
sudo apt-get install jq  # Linux
```

**"PyNaCl not installed"**
```bash
pip3 install PyNaCl
```

**"Bad credentials"**
```bash
# Generate new token:
# https://github.com/settings/tokens/new
# Make sure 'repo' scope is selected
```

**"Failed to encrypt secret"**
```bash
# Make sure encryption library is installed
pip3 install PyNaCl  # Python
# OR
npm install -g tweetnacl  # Node.js
```

---

## 📚 Additional Resources

- **GitHub CLI Docs:** https://cli.github.com/manual/
- **GitHub Secrets API:** https://docs.github.com/en/rest/actions/secrets
- **PyNaCl Docs:** https://pynacl.readthedocs.io/
- **GitHub Token Scopes:** https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps

---

## ✅ After Running Script

1. **Verify secrets:** Check GitHub UI
2. **Enable Actions:** Settings → Actions → Enable
3. **Test pipeline:** Run workflow manually
4. **Create release:** Push a version tag
5. **Monitor:** Watch Actions tab

---

## 🆘 Need Help?

If scripts fail:
1. Check error messages carefully
2. Verify authentication is working
3. Ensure all dependencies installed
4. Check repository permissions
5. Open an issue with error logs

---

**Both scripts are safe, tested, and ready to use. Choose the one that fits your setup!**

