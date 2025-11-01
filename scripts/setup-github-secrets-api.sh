#!/bin/bash
# IonBlock - GitHub Secrets Setup via API (Alternative Method)
# Uses GitHub REST API directly (no GitHub CLI needed)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     GitHub Secrets API Setup Script                   ║"
echo "║     Direct API method (no gh CLI required)            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Configuration
REPO_OWNER="vtoxi"
REPO_NAME="IonAdsBlockerAndDownloader"
GITHUB_API="https://api.github.com"

# Check dependencies
check_dependencies() {
    echo -e "${YELLOW}→ Checking dependencies...${NC}"
    
    local missing=0
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}✗ curl is not installed${NC}"
        missing=1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}✗ jq is not installed (needed for JSON parsing)${NC}"
        echo "  Install: brew install jq"
        missing=1
    fi
    
    if ! command -v python3 &> /dev/null && ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Neither Python 3 nor Node.js found (needed for encryption)${NC}"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies found${NC}"
    echo ""
}

# Get GitHub token
get_github_token() {
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${YELLOW}GitHub Personal Access Token required${NC}"
        echo ""
        echo "Create one at: https://github.com/settings/tokens/new"
        echo "Required scopes: repo (full control)"
        echo ""
        read -sp "Enter your GitHub token: " GITHUB_TOKEN
        echo ""
        echo ""
    fi
    
    # Test token
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "$GITHUB_API/repos/$REPO_OWNER/$REPO_NAME")
    
    if echo "$response" | grep -q "Not Found"; then
        echo -e "${RED}✗ Repository not found or no access${NC}"
        exit 1
    fi
    
    if echo "$response" | grep -q "Bad credentials"; then
        echo -e "${RED}✗ Invalid GitHub token${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ GitHub token validated${NC}"
    echo ""
}

# Get repository public key for encryption
get_repo_public_key() {
    echo -e "${YELLOW}→ Getting repository public key...${NC}"
    
    local response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "$GITHUB_API/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key")
    
    REPO_KEY_ID=$(echo "$response" | jq -r '.key_id')
    REPO_PUBLIC_KEY=$(echo "$response" | jq -r '.key')
    
    if [ -z "$REPO_KEY_ID" ] || [ "$REPO_KEY_ID" == "null" ]; then
        echo -e "${RED}✗ Failed to get repository public key${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Public key obtained${NC}"
    echo ""
}

# Encrypt secret using Python (libsodium)
encrypt_secret_python() {
    local secret_value=$1
    
    python3 - "$REPO_PUBLIC_KEY" "$secret_value" <<'EOF'
import sys
import base64
from nacl import encoding, public

def encrypt(public_key: str, secret_value: str) -> str:
    """Encrypt a Unicode string using the public key."""
    public_key_bytes = base64.b64decode(public_key)
    sealed_box = public.SealedBox(public.PublicKey(public_key_bytes))
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")

public_key = sys.argv[1]
secret_value = sys.argv[2]
print(encrypt(public_key, secret_value))
EOF
}

# Encrypt secret using Node.js (tweetnacl)
encrypt_secret_node() {
    local secret_value=$1
    
    node - "$REPO_PUBLIC_KEY" "$secret_value" <<'EOF'
const sodium = require('tweetnacl');
const publicKey = Buffer.from(process.argv[2], 'base64');
const secretValue = Buffer.from(process.argv[3]);
const encrypted = sodium.seal(secretValue, publicKey);
console.log(Buffer.from(encrypted).toString('base64'));
EOF
}

# Encrypt secret (tries Python first, then Node.js)
encrypt_secret() {
    local secret_value=$1
    local encrypted
    
    if command -v python3 &> /dev/null; then
        # Check if PyNaCl is installed
        if python3 -c "import nacl" 2>/dev/null; then
            encrypted=$(encrypt_secret_python "$secret_value")
        else
            echo -e "${YELLOW}  ⚠ PyNaCl not installed. Install with: pip3 install PyNaCl${NC}"
            return 1
        fi
    elif command -v node &> /dev/null; then
        # Check if tweetnacl is installed
        if node -e "require('tweetnacl')" 2>/dev/null; then
            encrypted=$(encrypt_secret_node "$secret_value")
        else
            echo -e "${YELLOW}  ⚠ tweetnacl not installed. Install with: npm install -g tweetnacl${NC}"
            return 1
        fi
    else
        echo -e "${RED}  ✗ No encryption method available${NC}"
        return 1
    fi
    
    echo "$encrypted"
}

# Set a secret via API
set_secret_api() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}  ⊘ Skipping $secret_name (no value provided)${NC}"
        return
    fi
    
    echo -e "${YELLOW}  → Setting $secret_name...${NC}"
    
    # Encrypt the secret
    local encrypted_value=$(encrypt_secret "$secret_value")
    
    if [ -z "$encrypted_value" ]; then
        echo -e "${RED}  ✗ Failed to encrypt $secret_name${NC}"
        return 1
    fi
    
    # Create JSON payload
    local payload=$(jq -n \
        --arg encrypted "$encrypted_value" \
        --arg key_id "$REPO_KEY_ID" \
        '{encrypted_value: $encrypted, key_id: $key_id}')
    
    # Send to GitHub API
    local response=$(curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -d "$payload" \
        "$GITHUB_API/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/$secret_name")
    
    # Check if successful (empty response means success)
    if [ -z "$response" ] || [ "$response" == "{}" ]; then
        echo -e "${GREEN}  ✓ $secret_name set successfully${NC}"
    else
        echo -e "${RED}  ✗ Failed to set $secret_name${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
}

# Load credentials
load_credentials() {
    ENV_FILE="$(dirname "$0")/.env"
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}Found $ENV_FILE${NC}"
        read -p "Load credentials from .env file? [Y/n]: " load_env
        
        if [[ ! "$load_env" =~ ^[Nn]$ ]]; then
            source "$ENV_FILE"
            echo -e "${GREEN}✓ Loaded credentials${NC}"
        fi
    fi
    echo ""
}

# Main function
main() {
    check_dependencies
    get_github_token
    get_repo_public_key
    load_credentials
    
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Repository: $REPO_OWNER/$REPO_NAME${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Prompt for credentials if not in environment
    if [ -z "$CHROME_CLIENT_ID" ]; then
        echo -e "${CYAN}─── Chrome Web Store ───${NC}"
        read -p "Chrome Client ID: " CHROME_CLIENT_ID
        read -p "Chrome Client Secret: " CHROME_CLIENT_SECRET
        read -p "Chrome Refresh Token: " CHROME_REFRESH_TOKEN
        read -p "Chrome Extension ID: " CHROME_APP_ID
        echo ""
    fi
    
    if [ -z "$FIREFOX_JWT_ISSUER" ]; then
        echo -e "${CYAN}─── Firefox Add-ons ───${NC}"
        read -p "Firefox JWT Issuer: " FIREFOX_JWT_ISSUER
        read -p "Firefox JWT Secret: " FIREFOX_JWT_SECRET
        echo ""
    fi
    
    if [ -z "$EDGE_CLIENT_ID" ]; then
        echo -e "${CYAN}─── Microsoft Edge Add-ons ───${NC}"
        read -p "Edge Client ID: " EDGE_CLIENT_ID
        read -p "Edge Client Secret: " EDGE_CLIENT_SECRET
        read -p "Edge Token URL: " EDGE_ACCESS_TOKEN_URL
        read -p "Edge Product ID: " EDGE_PRODUCT_ID
        echo ""
    fi
    
    read -p "Add secrets to GitHub? [y/N]: " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}→ Adding secrets via GitHub API...${NC}"
    echo ""
    
    # Chrome
    echo -e "${CYAN}Chrome Web Store:${NC}"
    set_secret_api "CHROME_CLIENT_ID" "$CHROME_CLIENT_ID"
    set_secret_api "CHROME_CLIENT_SECRET" "$CHROME_CLIENT_SECRET"
    set_secret_api "CHROME_REFRESH_TOKEN" "$CHROME_REFRESH_TOKEN"
    set_secret_api "CHROME_APP_ID" "$CHROME_APP_ID"
    echo ""
    
    # Firefox
    echo -e "${CYAN}Firefox Add-ons:${NC}"
    set_secret_api "FIREFOX_JWT_ISSUER" "$FIREFOX_JWT_ISSUER"
    set_secret_api "FIREFOX_JWT_SECRET" "$FIREFOX_JWT_SECRET"
    echo ""
    
    # Edge
    echo -e "${CYAN}Microsoft Edge Add-ons:${NC}"
    set_secret_api "EDGE_CLIENT_ID" "$EDGE_CLIENT_ID"
    set_secret_api "EDGE_CLIENT_SECRET" "$EDGE_CLIENT_SECRET"
    set_secret_api "EDGE_ACCESS_TOKEN_URL" "$EDGE_ACCESS_TOKEN_URL"
    set_secret_api "EDGE_PRODUCT_ID" "$EDGE_PRODUCT_ID"
    echo ""
    
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ Secrets added successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Verify at: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
    echo "  2. Enable GitHub Actions"
    echo "  3. Test with a version tag: git tag -a v1.0.0 -m 'Release'"
    echo ""
}

# Run
main

