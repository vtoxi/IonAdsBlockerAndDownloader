#!/bin/bash
# IonBlock - Unified Publishing Script
# Publishes to all web stores sequentially

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║       🚀 IonBlock Extension Publisher 🚀             ║"
echo "║                                                      ║"
echo "║   Automated Build & Publish to All Web Stores       ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

VERSION=$(node -p "require('$PROJECT_ROOT/manifest.json').version" 2>/dev/null || echo "unknown")
echo -e "${BLUE}Version: $VERSION${NC}"
echo ""

# Pre-flight checks
preflight_checks() {
    echo -e "${YELLOW}═══ Pre-flight Checks ═══${NC}"
    echo ""
    
    # Check Node.js
    if ! command -v node > /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js installed${NC}"
    
    # Check for manifest
    if [ ! -f "$PROJECT_ROOT/manifest.json" ]; then
        echo -e "${RED}✗ manifest.json not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ manifest.json found${NC}"
    
    # Check scripts exist
    for script in build.sh publish-chrome.sh publish-firefox.sh publish-edge.sh; do
        if [ ! -f "$SCRIPT_DIR/$script" ]; then
            echo -e "${RED}✗ Missing script: $script${NC}"
            exit 1
        fi
        chmod +x "$SCRIPT_DIR/$script"
    done
    echo -e "${GREEN}✓ All scripts found${NC}"
    
    echo ""
}

# Step 1: Build
build_extension() {
    echo -e "${YELLOW}═══ Step 1: Building Extension ═══${NC}"
    echo ""
    
    "$SCRIPT_DIR/build.sh"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Build complete${NC}"
    echo ""
}

# Step 2: Pre-publish validation
validate_builds() {
    echo -e "${YELLOW}═══ Step 2: Validating Builds ═══${NC}"
    echo ""
    
    # Check all ZIP files exist
    CHROME_ZIP="$PROJECT_ROOT/dist/ionblock-chrome-v$VERSION.zip"
    FIREFOX_ZIP="$PROJECT_ROOT/dist/ionblock-firefox-v$VERSION.zip"
    SOURCE_ZIP="$PROJECT_ROOT/dist/ionblock-source-v$VERSION.zip"
    
    if [ ! -f "$CHROME_ZIP" ]; then
        echo -e "${RED}✗ Chrome build missing${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Chrome build ready${NC}"
    
    if [ ! -f "$FIREFOX_ZIP" ]; then
        echo -e "${RED}✗ Firefox build missing${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Firefox build ready${NC}"
    
    if [ ! -f "$SOURCE_ZIP" ]; then
        echo -e "${RED}✗ Source code missing${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Source code ready${NC}"
    
    # Check file sizes
    echo ""
    echo "Build sizes:"
    ls -lh "$PROJECT_ROOT/dist"/*.zip | awk '{print "  " $9 " - " $5}'
    
    echo ""
}

# Step 3: Publish to stores
publish_to_stores() {
    echo -e "${YELLOW}═══ Step 3: Publishing to Stores ═══${NC}"
    echo ""
    
    # Ask which stores to publish to
    echo "Select stores to publish to:"
    echo "  1) Chrome Web Store"
    echo "  2) Firefox Add-ons"
    echo "  3) Microsoft Edge Add-ons"
    echo "  4) All stores"
    echo ""
    read -p "Enter choice [4]: " choice
    choice=${choice:-4}
    
    PUBLISH_CHROME=false
    PUBLISH_FIREFOX=false
    PUBLISH_EDGE=false
    
    case $choice in
        1) PUBLISH_CHROME=true ;;
        2) PUBLISH_FIREFOX=true ;;
        3) PUBLISH_EDGE=true ;;
        4) PUBLISH_CHROME=true; PUBLISH_FIREFOX=true; PUBLISH_EDGE=true ;;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
    esac
    
    echo ""
    
    # Chrome Web Store
    if [ "$PUBLISH_CHROME" = true ]; then
        echo -e "${CYAN}─── Publishing to Chrome Web Store ───${NC}"
        echo ""
        
        if [ -z "$CHROME_CLIENT_ID" ]; then
            echo -e "${YELLOW}⚠ Chrome credentials not set, skipping...${NC}"
            echo "Set credentials to enable Chrome publishing"
        else
            "$SCRIPT_DIR/publish-chrome.sh"
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Chrome Web Store: Published${NC}"
            else
                echo -e "${RED}✗ Chrome Web Store: Failed${NC}"
            fi
        fi
        echo ""
    fi
    
    # Firefox Add-ons
    if [ "$PUBLISH_FIREFOX" = true ]; then
        echo -e "${CYAN}─── Publishing to Firefox Add-ons ───${NC}"
        echo ""
        
        if [ -z "$FIREFOX_JWT_ISSUER" ]; then
            echo -e "${YELLOW}⚠ Firefox credentials not set, skipping...${NC}"
            echo "Set credentials to enable Firefox publishing"
        else
            "$SCRIPT_DIR/publish-firefox.sh"
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Firefox Add-ons: Submitted${NC}"
            else
                echo -e "${RED}✗ Firefox Add-ons: Failed${NC}"
            fi
        fi
        echo ""
    fi
    
    # Microsoft Edge Add-ons
    if [ "$PUBLISH_EDGE" = true ]; then
        echo -e "${CYAN}─── Publishing to Edge Add-ons ───${NC}"
        echo ""
        
        if [ -z "$EDGE_CLIENT_ID" ]; then
            echo -e "${YELLOW}⚠ Edge credentials not set, skipping...${NC}"
            echo "Set credentials to enable Edge publishing"
        else
            "$SCRIPT_DIR/publish-edge.sh"
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Edge Add-ons: Submitted${NC}"
            else
                echo -e "${RED}✗ Edge Add-ons: Failed${NC}"
            fi
        fi
        echo ""
    fi
}

# Step 4: Post-publish summary
post_publish_summary() {
    echo -e "${YELLOW}═══ Step 4: Summary ═══${NC}"
    echo ""
    
    echo "Publish complete for version: $VERSION"
    echo ""
    echo "Next steps:"
    echo "  • Monitor review status on each platform"
    echo "  • Respond to any review feedback"
    echo "  • Test published versions after approval"
    echo "  • Update changelog/release notes"
    echo ""
    echo "Store links:"
    if [ ! -z "$CHROME_APP_ID" ]; then
        echo "  Chrome: https://chrome.google.com/webstore/detail/$CHROME_APP_ID"
    fi
    echo "  Firefox: https://addons.mozilla.org/developers/addons"
    echo "  Edge: https://partner.microsoft.com/dashboard/microsoftedge/overview"
    echo ""
}

# Main execution
main() {
    preflight_checks
    
    echo -e "${CYAN}Ready to publish version $VERSION${NC}"
    echo ""
    read -p "Continue? [y/N]: " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi
    
    echo ""
    
    build_extension
    validate_builds
    publish_to_stores
    post_publish_summary
    
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                                                      ║"
    echo "║           🎉 Publishing Complete! 🎉                 ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Run main
main

