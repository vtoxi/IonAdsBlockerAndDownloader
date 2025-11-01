#!/bin/bash
# IonBlock - Chrome Web Store Publishing Script
# Uses Chrome Web Store API for automated publishing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Chrome Web Store Publisher          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check for required environment variables
check_credentials() {
    echo -e "${YELLOW}→ Checking credentials...${NC}"
    
    if [ -z "$CHROME_CLIENT_ID" ]; then
        echo -e "${RED}✗ CHROME_CLIENT_ID not set${NC}"
        echo "Please set the following environment variables:"
        echo "  export CHROME_CLIENT_ID='your-client-id'"
        echo "  export CHROME_CLIENT_SECRET='your-client-secret'"
        echo "  export CHROME_REFRESH_TOKEN='your-refresh-token'"
        echo "  export CHROME_APP_ID='your-app-id'"
        echo ""
        echo "See docs: https://developer.chrome.com/docs/webstore/using_webstore_api/"
        exit 1
    fi
    
    if [ -z "$CHROME_CLIENT_SECRET" ] || [ -z "$CHROME_REFRESH_TOKEN" ] || [ -z "$CHROME_APP_ID" ]; then
        echo -e "${RED}✗ Missing Chrome Web Store credentials${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Credentials found${NC}"
    echo ""
}

# Get access token
get_access_token() {
    echo -e "${YELLOW}→ Getting access token...${NC}"
    
    ACCESS_TOKEN=$(curl -s "https://accounts.google.com/o/oauth2/token" \
        -d "client_id=$CHROME_CLIENT_ID" \
        -d "client_secret=$CHROME_CLIENT_SECRET" \
        -d "refresh_token=$CHROME_REFRESH_TOKEN" \
        -d "grant_type=refresh_token" | \
        node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).access_token")
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}✗ Failed to get access token${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Access token obtained${NC}"
    echo ""
}

# Upload extension
upload_extension() {
    local zip_file="$1"
    
    echo -e "${YELLOW}→ Uploading extension package...${NC}"
    echo "  File: $(basename "$zip_file")"
    
    UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "x-goog-api-version: 2" \
        -X PUT \
        -T "$zip_file" \
        "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CHROME_APP_ID")
    
    HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo -e "${RED}✗ Upload failed (HTTP $HTTP_CODE)${NC}"
        echo "$RESPONSE_BODY"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Extension uploaded successfully${NC}"
    echo ""
}

# Publish extension
publish_extension() {
    echo -e "${YELLOW}→ Publishing to Chrome Web Store...${NC}"
    
    PUBLISH_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "x-goog-api-version: 2" \
        -H "Content-Length: 0" \
        -X POST \
        "https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_APP_ID/publish")
    
    HTTP_CODE=$(echo "$PUBLISH_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$PUBLISH_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo -e "${RED}✗ Publish failed (HTTP $HTTP_CODE)${NC}"
        echo "$RESPONSE_BODY"
        exit 1
    fi
    
    STATUS=$(echo "$RESPONSE_BODY" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).status[0]" 2>/dev/null || echo "PUBLISHED")
    
    echo -e "${GREEN}✓ Extension published successfully!${NC}"
    echo -e "  Status: ${GREEN}$STATUS${NC}"
    echo ""
}

# Get extension status
get_status() {
    echo -e "${YELLOW}→ Checking extension status...${NC}"
    
    STATUS_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "x-goog-api-version: 2" \
        "https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_APP_ID?projection=DRAFT")
    
    echo "$STATUS_RESPONSE" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin').toString());
        console.log('  Extension ID:', data.id);
        console.log('  Status:', data.itemError ? 'ERROR' : 'OK');
        console.log('  Version:', data.crxVersion || 'N/A');
    "
    echo ""
}

# Main process
main() {
    # Find Chrome ZIP file
    VERSION=$(node -p "require('$PROJECT_ROOT/manifest.json').version")
    ZIP_FILE="$PROJECT_ROOT/dist/ionblock-chrome-v$VERSION.zip"
    
    if [ ! -f "$ZIP_FILE" ]; then
        echo -e "${RED}✗ Chrome build not found: $ZIP_FILE${NC}"
        echo "Please run: ./scripts/build.sh first"
        exit 1
    fi
    
    echo "Publishing version: $VERSION"
    echo ""
    
    check_credentials
    get_access_token
    upload_extension "$ZIP_FILE"
    publish_extension
    get_status
    
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Chrome Web Store Publish Complete!  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Your extension is now live on Chrome Web Store!${NC}"
    echo "View at: https://chrome.google.com/webstore/detail/$CHROME_APP_ID"
    echo ""
}

# Run
main

