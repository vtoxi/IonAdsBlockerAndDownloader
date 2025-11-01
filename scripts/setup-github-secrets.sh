#!/bin/bash
# IonBlock - GitHub Secrets Setup Script
# Automatically creates/updates repository secrets via GitHub CLI

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
echo "║     GitHub Secrets Automation Script                  ║"
echo "║     Automatically add secrets to your repository      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Configuration
REPO_OWNER="vtoxi"
REPO_NAME="IonAdsBlockerAndDownloader"
REPO_FULL="${REPO_OWNER}/${REPO_NAME}"

# Check if GitHub CLI is installed
check_gh_cli() {
    echo -e "${YELLOW}→ Checking for GitHub CLI...${NC}"
    
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
        echo ""
        echo "Please install GitHub CLI first:"
        echo ""
        echo "  macOS:    brew install gh"
        echo "  Linux:    See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
        echo "  Windows:  See https://github.com/cli/cli#installation"
        echo ""
        exit 1
    fi
    
    echo -e "${GREEN}✓ GitHub CLI found${NC}"
    echo ""
}

# Check authentication
check_auth() {
    echo -e "${YELLOW}→ Checking GitHub authentication...${NC}"
    
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠ Not authenticated with GitHub${NC}"
        echo ""
        echo "Please authenticate first:"
        echo "  gh auth login"
        echo ""
        read -p "Do you want to authenticate now? [y/N]: " auth_now
        
        if [[ "$auth_now" =~ ^[Yy]$ ]]; then
            gh auth login
        else
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✓ Authenticated${NC}"
    echo ""
}

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}  ⊘ Skipping $secret_name (no value provided)${NC}"
        return
    fi
    
    echo -e "${YELLOW}  → Setting $secret_name...${NC}"
    
    # Use GitHub CLI to set secret
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_FULL" --body -
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ $secret_name set successfully${NC}"
    else
        echo -e "${RED}  ✗ Failed to set $secret_name${NC}"
    fi
}

# Load from environment or prompt
get_secret_value() {
    local var_name=$1
    local prompt_text=$2
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        read -p "$prompt_text: " var_value
    fi
    
    echo "$var_value"
}

# Main function
main() {
    check_gh_cli
    check_auth
    
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Repository: $REPO_FULL${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo "This script will add/update 10 secrets for automated publishing."
    echo "You can either:"
    echo "  1. Load from environment variables (scripts/.env)"
    echo "  2. Enter values interactively"
    echo ""
    
    # Check if .env file exists
    ENV_FILE="$(dirname "$0")/.env"
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}Found $ENV_FILE${NC}"
        read -p "Load credentials from .env file? [Y/n]: " load_env
        
        if [[ ! "$load_env" =~ ^[Nn]$ ]]; then
            source "$ENV_FILE"
            echo -e "${GREEN}✓ Loaded credentials from .env${NC}"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}─── Chrome Web Store (4 secrets) ───${NC}"
    
    CHROME_CLIENT_ID=$(get_secret_value "CHROME_CLIENT_ID" "Chrome Client ID")
    CHROME_CLIENT_SECRET=$(get_secret_value "CHROME_CLIENT_SECRET" "Chrome Client Secret")
    CHROME_REFRESH_TOKEN=$(get_secret_value "CHROME_REFRESH_TOKEN" "Chrome Refresh Token")
    CHROME_APP_ID=$(get_secret_value "CHROME_APP_ID" "Chrome Extension ID")
    
    echo ""
    echo -e "${CYAN}─── Firefox Add-ons (2 secrets) ───${NC}"
    
    FIREFOX_JWT_ISSUER=$(get_secret_value "FIREFOX_JWT_ISSUER" "Firefox JWT Issuer")
    FIREFOX_JWT_SECRET=$(get_secret_value "FIREFOX_JWT_SECRET" "Firefox JWT Secret")
    
    echo ""
    echo -e "${CYAN}─── Microsoft Edge Add-ons (4 secrets) ───${NC}"
    
    EDGE_CLIENT_ID=$(get_secret_value "EDGE_CLIENT_ID" "Edge Client ID")
    EDGE_CLIENT_SECRET=$(get_secret_value "EDGE_CLIENT_SECRET" "Edge Client Secret")
    EDGE_ACCESS_TOKEN_URL=$(get_secret_value "EDGE_ACCESS_TOKEN_URL" "Edge Token URL")
    EDGE_PRODUCT_ID=$(get_secret_value "EDGE_PRODUCT_ID" "Edge Product ID")
    
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Ready to add secrets to GitHub${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    read -p "Continue? [y/N]: " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}→ Adding secrets to GitHub...${NC}"
    echo ""
    
    # Chrome Web Store
    echo -e "${CYAN}Chrome Web Store:${NC}"
    set_secret "CHROME_CLIENT_ID" "$CHROME_CLIENT_ID" "Chrome OAuth Client ID"
    set_secret "CHROME_CLIENT_SECRET" "$CHROME_CLIENT_SECRET" "Chrome OAuth Client Secret"
    set_secret "CHROME_REFRESH_TOKEN" "$CHROME_REFRESH_TOKEN" "Chrome OAuth Refresh Token"
    set_secret "CHROME_APP_ID" "$CHROME_APP_ID" "Chrome Extension ID"
    
    echo ""
    
    # Firefox Add-ons
    echo -e "${CYAN}Firefox Add-ons:${NC}"
    set_secret "FIREFOX_JWT_ISSUER" "$FIREFOX_JWT_ISSUER" "Firefox JWT Issuer"
    set_secret "FIREFOX_JWT_SECRET" "$FIREFOX_JWT_SECRET" "Firefox JWT Secret"
    
    echo ""
    
    # Edge Add-ons
    echo -e "${CYAN}Microsoft Edge Add-ons:${NC}"
    set_secret "EDGE_CLIENT_ID" "$EDGE_CLIENT_ID" "Edge Client ID"
    set_secret "EDGE_CLIENT_SECRET" "$EDGE_CLIENT_SECRET" "Edge Client Secret"
    set_secret "EDGE_ACCESS_TOKEN_URL" "$EDGE_ACCESS_TOKEN_URL" "Edge Token URL"
    set_secret "EDGE_PRODUCT_ID" "$EDGE_PRODUCT_ID" "Edge Product ID"
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ All secrets added successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Verify secrets
    echo -e "${YELLOW}→ Verifying secrets...${NC}"
    echo ""
    
    gh secret list --repo "$REPO_FULL"
    
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Enable GitHub Actions in repository settings"
    echo "  2. Set workflow permissions to 'Read and write'"
    echo "  3. Test with: gh workflow run build-and-publish.yml"
    echo "  4. Or create a version tag: git tag -a v1.0.0 -m 'Release'"
    echo ""
}

# Run main function
main

