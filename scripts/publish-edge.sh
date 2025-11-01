#!/bin/bash
# IonBlock - Microsoft Edge Add-ons Publishing Script
# Uses Partner Center API for automated publishing

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
echo -e "${BLUE}║   Microsoft Edge Add-ons Publisher    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check credentials
check_credentials() {
    echo -e "${YELLOW}→ Checking credentials...${NC}"
    
    if [ -z "$EDGE_CLIENT_ID" ] || [ -z "$EDGE_CLIENT_SECRET" ] || [ -z "$EDGE_ACCESS_TOKEN_URL" ]; then
        echo -e "${RED}✗ Edge credentials not set${NC}"
        echo "Please set:"
        echo "  export EDGE_CLIENT_ID='your-client-id'"
        echo "  export EDGE_CLIENT_SECRET='your-client-secret'"
        echo "  export EDGE_ACCESS_TOKEN_URL='your-token-url'"
        echo "  export EDGE_PRODUCT_ID='your-product-id'"
        echo ""
        echo "Get from: https://partner.microsoft.com/dashboard"
        exit 1
    fi
    
    if [ -z "$EDGE_PRODUCT_ID" ]; then
        echo -e "${RED}✗ EDGE_PRODUCT_ID not set${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Credentials found${NC}"
    echo ""
}

# Get access token
get_access_token() {
    echo -e "${YELLOW}→ Getting access token...${NC}"
    
    TOKEN_RESPONSE=$(curl -s -X POST "$EDGE_ACCESS_TOKEN_URL" \
        -d "client_id=$EDGE_CLIENT_ID" \
        -d "client_secret=$EDGE_CLIENT_SECRET" \
        -d "grant_type=client_credentials" \
        -d "resource=https://api.addons.microsoftedge.microsoft.com")
    
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).access_token" 2>/dev/null)
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}✗ Failed to get access token${NC}"
        echo "$TOKEN_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Access token obtained${NC}"
    echo ""
}

# Upload package
upload_package() {
    local zip_file="$1"
    
    echo -e "${YELLOW}→ Uploading package to Edge Add-ons...${NC}"
    echo "  File: $(basename "$zip_file")"
    
    # Create operation
    OPERATION_ID=$(curl -s -X POST \
        "https://api.addons.microsoftedge.microsoft.com/v1/products/$EDGE_PRODUCT_ID/submissions/draft/package" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/zip" \
        --data-binary "@$zip_file" | \
        node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).id" 2>/dev/null)
    
    if [ -z "$OPERATION_ID" ]; then
        echo -e "${RED}✗ Upload failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Package uploaded (Operation ID: $OPERATION_ID)${NC}"
    echo ""
    
    # Poll operation status
    poll_operation "$OPERATION_ID"
}

# Poll operation status
poll_operation() {
    local operation_id="$1"
    
    echo -e "${YELLOW}→ Waiting for processing...${NC}"
    
    for i in {1..30}; do
        sleep 5
        
        STATUS=$(curl -s \
            "https://api.addons.microsoftedge.microsoft.com/v1/products/$EDGE_PRODUCT_ID/submissions/draft/package/operations/$operation_id" \
            -H "Authorization: Bearer $ACCESS_TOKEN" | \
            node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).status" 2>/dev/null)
        
        case "$STATUS" in
            "Succeeded")
                echo -e "${GREEN}✓ Package processed successfully${NC}"
                return 0
                ;;
            "Failed")
                echo -e "${RED}✗ Processing failed${NC}"
                return 1
                ;;
            "InProgress")
                echo "  Attempt $i/30..."
                ;;
        esac
    done
    
    echo -e "${YELLOW}⚠ Processing timeout${NC}"
}

# Publish submission
publish_submission() {
    echo -e "${YELLOW}→ Publishing to Edge Add-ons store...${NC}"
    
    PUBLISH_RESPONSE=$(curl -s -X POST \
        "https://api.addons.microsoftedge.microsoft.com/v1/products/$EDGE_PRODUCT_ID/submissions" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "notes": "Automated publish via script"
        }')
    
    SUBMISSION_ID=$(echo "$PUBLISH_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).id" 2>/dev/null)
    
    if [ -z "$SUBMISSION_ID" ]; then
        echo -e "${RED}✗ Publish failed${NC}"
        echo "$PUBLISH_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Submission published (ID: $SUBMISSION_ID)${NC}"
    echo ""
}

# Get submission status
get_status() {
    echo -e "${YELLOW}→ Checking submission status...${NC}"
    
    STATUS_RESPONSE=$(curl -s \
        "https://api.addons.microsoftedge.microsoft.com/v1/products/$EDGE_PRODUCT_ID/submissions" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "$STATUS_RESPONSE" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin').toString());
        if (data.value && data.value[0]) {
            const sub = data.value[0];
            console.log('  Product ID:', sub.productId);
            console.log('  Status:', sub.status);
            console.log('  Created:', sub.createdTime);
        }
    " 2>/dev/null || echo "  Status: Submitted"
    echo ""
}

# Main process
main() {
    VERSION=$(node -p "require('$PROJECT_ROOT/manifest.json').version")
    # Edge uses Chrome build (Chromium-based)
    ZIP_FILE="$PROJECT_ROOT/dist/ionblock-chrome-v$VERSION.zip"
    
    if [ ! -f "$ZIP_FILE" ]; then
        echo -e "${RED}✗ Build not found: $ZIP_FILE${NC}"
        echo "Please run: ./scripts/build.sh first"
        exit 1
    fi
    
    echo "Publishing version: $VERSION"
    echo ""
    
    check_credentials
    get_access_token
    upload_package "$ZIP_FILE"
    publish_submission
    get_status
    
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Edge Add-ons Submission Complete!   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Note: Edge requires automated review${NC}"
    echo "Expected review time: 1-2 business days"
    echo ""
    echo "Monitor at: https://partner.microsoft.com/dashboard/microsoftedge/overview"
    echo ""
}

main

