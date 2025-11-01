#!/bin/bash
# IonBlock - Firefox Add-ons Publishing Script
# Uses Firefox Add-on API for automated publishing

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
echo -e "${BLUE}║   Firefox Add-ons Publisher           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check credentials
check_credentials() {
    echo -e "${YELLOW}→ Checking credentials...${NC}"
    
    if [ -z "$FIREFOX_JWT_ISSUER" ] || [ -z "$FIREFOX_JWT_SECRET" ]; then
        echo -e "${RED}✗ Firefox credentials not set${NC}"
        echo "Please set:"
        echo "  export FIREFOX_JWT_ISSUER='your-jwt-issuer'"
        echo "  export FIREFOX_JWT_SECRET='your-jwt-secret'"
        echo ""
        echo "Get credentials from: https://addons.mozilla.org/developers/addon/api/key/"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Credentials found${NC}"
    echo ""
}

# Generate JWT token
generate_jwt() {
    echo -e "${YELLOW}→ Generating JWT token...${NC}"
    
    # Using web-ext sign command (requires web-ext tool)
    if ! command -v web-ext > /dev/null; then
        echo -e "${YELLOW}⚠ web-ext not found, installing...${NC}"
        npm install -g web-ext
    fi
    
    echo -e "${GREEN}✓ JWT ready${NC}"
    echo ""
}

# Upload and sign extension
upload_and_sign() {
    local zip_file="$1"
    local source_zip="$2"
    
    echo -e "${YELLOW}→ Uploading to Firefox Add-ons...${NC}"
    echo "  Extension: $(basename "$zip_file")"
    echo "  Source: $(basename "$source_zip")"
    
    # Create temporary directory for web-ext
    TEMP_DIR=$(mktemp -d)
    unzip -q "$zip_file" -d "$TEMP_DIR"
    
    # Run web-ext sign
    cd "$TEMP_DIR"
    
    web-ext sign \
        --api-key="$FIREFOX_JWT_ISSUER" \
        --api-secret="$FIREFOX_JWT_SECRET" \
        --channel=listed \
        --source-dir=. \
        2>&1 | tee /tmp/firefox-publish.log
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Extension uploaded and signed${NC}"
    else
        echo -e "${RED}✗ Upload failed${NC}"
        cat /tmp/firefox-publish.log
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    rm -rf "$TEMP_DIR"
    echo ""
}

# Alternative: Upload via API
upload_via_api() {
    local zip_file="$1"
    local addon_id="$2"
    
    echo -e "${YELLOW}→ Uploading via API...${NC}"
    
    # Create new version
    RESPONSE=$(curl -s -X POST \
        "https://addons.mozilla.org/api/v5/addons/$addon_id/versions/" \
        -H "Authorization: JWT $FIREFOX_JWT_ISSUER:$FIREFOX_JWT_SECRET" \
        -F "upload=@$zip_file" \
        -F "channel=listed")
    
    UUID=$(echo "$RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).uuid" 2>/dev/null)
    
    if [ -z "$UUID" ]; then
        echo -e "${RED}✗ Upload failed${NC}"
        echo "$RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Upload initiated (UUID: $UUID)${NC}"
    echo ""
    
    # Poll for validation result
    poll_validation "$UUID"
}

# Poll validation status
poll_validation() {
    local uuid="$1"
    
    echo -e "${YELLOW}→ Waiting for validation...${NC}"
    
    for i in {1..30}; do
        sleep 5
        
        STATUS_RESPONSE=$(curl -s \
            "https://addons.mozilla.org/api/v5/addons/upload/$uuid/" \
            -H "Authorization: JWT $FIREFOX_JWT_ISSUER:$FIREFOX_JWT_SECRET")
        
        VALID=$(echo "$STATUS_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).valid" 2>/dev/null)
        PROCESSED=$(echo "$STATUS_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).processed" 2>/dev/null)
        
        if [ "$PROCESSED" = "true" ]; then
            if [ "$VALID" = "true" ]; then
                echo -e "${GREEN}✓ Validation passed!${NC}"
                return 0
            else
                echo -e "${RED}✗ Validation failed${NC}"
                echo "$STATUS_RESPONSE"
                return 1
            fi
        fi
        
        echo "  Attempt $i/30..."
    done
    
    echo -e "${YELLOW}⚠ Validation timeout (still processing)${NC}"
    echo "Check status at: https://addons.mozilla.org/developers/"
}

# Main process
main() {
    VERSION=$(node -p "require('$PROJECT_ROOT/manifest.json').version")
    ZIP_FILE="$PROJECT_ROOT/dist/ionblock-firefox-v$VERSION.zip"
    SOURCE_ZIP="$PROJECT_ROOT/dist/ionblock-source-v$VERSION.zip"
    
    if [ ! -f "$ZIP_FILE" ]; then
        echo -e "${RED}✗ Firefox build not found: $ZIP_FILE${NC}"
        echo "Please run: ./scripts/build.sh first"
        exit 1
    fi
    
    if [ ! -f "$SOURCE_ZIP" ]; then
        echo -e "${RED}✗ Source code not found: $SOURCE_ZIP${NC}"
        echo "Please run: ./scripts/build.sh first"
        exit 1
    fi
    
    echo "Publishing version: $VERSION"
    echo ""
    
    check_credentials
    generate_jwt
    
    echo -e "${YELLOW}Choose upload method:${NC}"
    echo "  1) web-ext sign (recommended)"
    echo "  2) Direct API upload"
    echo ""
    read -p "Enter choice [1]: " choice
    choice=${choice:-1}
    
    if [ "$choice" = "1" ]; then
        upload_and_sign "$ZIP_FILE" "$SOURCE_ZIP"
    else
        read -p "Enter your Add-on ID (e.g., {addon-uuid}): " ADDON_ID
        upload_via_api "$ZIP_FILE" "$ADDON_ID"
    fi
    
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Firefox Add-ons Submission Complete ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Note: Firefox requires manual code review${NC}"
    echo "Expected review time: 1-5 business days"
    echo ""
    echo "Monitor status at: https://addons.mozilla.org/developers/addons"
    echo ""
}

main

