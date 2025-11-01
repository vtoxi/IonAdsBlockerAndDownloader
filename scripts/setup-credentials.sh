#!/bin/bash
# IonBlock - Credentials Setup Script
# Helps set up API credentials for automated publishing

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   IonBlock Credentials Setup           ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Create .env file
touch "$ENV_FILE"

echo "This script will help you set up API credentials for automated publishing."
echo "Credentials will be saved to: $ENV_FILE"
echo ""
echo -e "${YELLOW}⚠ Keep this file secure and never commit it to git!${NC}"
echo ""

# Chrome Web Store
echo -e "${BLUE}═══ Chrome Web Store ═══${NC}"
echo ""
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Create a new project or select existing"
echo "3. Enable Chrome Web Store API"
echo "4. Create OAuth 2.0 credentials"
echo "5. Get Client ID, Client Secret, and Refresh Token"
echo ""
read -p "Enter Chrome Client ID: " chrome_client_id
read -p "Enter Chrome Client Secret: " chrome_client_secret
read -p "Enter Chrome Refresh Token: " chrome_refresh_token
read -p "Enter Chrome App/Extension ID: " chrome_app_id

cat >> "$ENV_FILE" << EOF
# Chrome Web Store
export CHROME_CLIENT_ID="$chrome_client_id"
export CHROME_CLIENT_SECRET="$chrome_client_secret"
export CHROME_REFRESH_TOKEN="$chrome_refresh_token"
export CHROME_APP_ID="$chrome_app_id"

EOF

echo -e "${GREEN}✓ Chrome credentials saved${NC}"
echo ""

# Firefox Add-ons
echo -e "${BLUE}═══ Firefox Add-ons ═══${NC}"
echo ""
echo "1. Go to: https://addons.mozilla.org/developers/addon/api/key/"
echo "2. Generate new API credentials"
echo "3. Copy JWT Issuer and JWT Secret"
echo ""
read -p "Enter Firefox JWT Issuer: " firefox_jwt_issuer
read -p "Enter Firefox JWT Secret: " firefox_jwt_secret

cat >> "$ENV_FILE" << EOF
# Firefox Add-ons
export FIREFOX_JWT_ISSUER="$firefox_jwt_issuer"
export FIREFOX_JWT_SECRET="$firefox_jwt_secret"

EOF

echo -e "${GREEN}✓ Firefox credentials saved${NC}"
echo ""

# Microsoft Edge
echo -e "${BLUE}═══ Microsoft Edge Add-ons ═══${NC}"
echo ""
echo "1. Go to: https://partner.microsoft.com/dashboard"
echo "2. Navigate to your extension"
echo "3. Go to Product Management → Product Identity"
echo "4. Generate API credentials"
echo ""
read -p "Enter Edge Client ID: " edge_client_id
read -p "Enter Edge Client Secret: " edge_client_secret
read -p "Enter Edge Access Token URL: " edge_token_url
read -p "Enter Edge Product ID: " edge_product_id

cat >> "$ENV_FILE" << EOF
# Microsoft Edge Add-ons
export EDGE_CLIENT_ID="$edge_client_id"
export EDGE_CLIENT_SECRET="$edge_client_secret"
export EDGE_ACCESS_TOKEN_URL="$edge_token_url"
export EDGE_PRODUCT_ID="$edge_product_id"

EOF

echo -e "${GREEN}✓ Edge credentials saved${NC}"
echo ""

# Secure the file
chmod 600 "$ENV_FILE"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   Setup Complete!                      ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "Credentials saved to: $ENV_FILE"
echo ""
echo "To use these credentials, run:"
echo -e "${YELLOW}  source $ENV_FILE${NC}"
echo ""
echo "Or add this to your ~/.bashrc or ~/.zshrc:"
echo -e "${YELLOW}  source $ENV_FILE${NC}"
echo ""
echo -e "${RED}Security reminders:${NC}"
echo "  • Never commit .env file to git"
echo "  • Add .env to .gitignore"
echo "  • Rotate credentials periodically"
echo "  • Use separate credentials for production"
echo ""

