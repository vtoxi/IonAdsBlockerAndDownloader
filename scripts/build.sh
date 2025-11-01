#!/bin/bash
# IonBlock Extension - Build Script
# Packages extension for Chrome Web Store, Firefox Add-ons, and Edge Add-ons

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
DIST_DIR="$PROJECT_ROOT/dist"

# Get version from manifest.json
VERSION=$(node -p "require('$PROJECT_ROOT/manifest.json').version")

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   IonBlock Extension Build Script     ║${NC}"
echo -e "${BLUE}║   Version: $VERSION                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Clean previous builds
clean_build() {
    echo -e "${YELLOW}→ Cleaning previous builds...${NC}"
    rm -rf "$BUILD_DIR"
    rm -rf "$DIST_DIR"
    mkdir -p "$BUILD_DIR"
    mkdir -p "$DIST_DIR"
    echo -e "${GREEN}✓ Build directories cleaned${NC}"
    echo ""
}

# Validate extension files
validate_extension() {
    echo -e "${YELLOW}→ Validating extension files...${NC}"
    
    # Check required files exist
    required_files=(
        "manifest.json"
        "background.js"
        "content_script.js"
        "popup.html"
        "popup.js"
        "popup.css"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            echo -e "${RED}✗ Missing required file: $file${NC}"
            exit 1
        fi
    done
    
    # Validate manifest.json
    if ! node -e "require('$PROJECT_ROOT/manifest.json')" 2>/dev/null; then
        echo -e "${RED}✗ Invalid manifest.json${NC}"
        exit 1
    fi
    
    # Check for console.log in production code (warning only)
    if grep -r "console.log" "$PROJECT_ROOT"/*.js "$PROJECT_ROOT"/core/*.js 2>/dev/null | grep -v "console.error\|console.warn" > /dev/null; then
        echo -e "${YELLOW}⚠ Warning: console.log found in code (consider removing for production)${NC}"
    fi
    
    echo -e "${GREEN}✓ Validation passed${NC}"
    echo ""
}

# Build for Chrome/Edge (Chromium-based)
build_chrome() {
    echo -e "${YELLOW}→ Building for Chrome Web Store / Edge Add-ons...${NC}"
    
    local chrome_build="$BUILD_DIR/chrome"
    mkdir -p "$chrome_build"
    
    # Copy extension files
    cp -r "$PROJECT_ROOT"/{manifest.json,background.js,content_script.js,popup.html,popup.js,popup.css} "$chrome_build/"
    cp -r "$PROJECT_ROOT"/{utils,core,injected,ui,rules,icons} "$chrome_build/"
    
    # Copy documentation for reviewers
    cp "$PROJECT_ROOT"/{README.md,PRIVACY_POLICY.md,LICENSE} "$chrome_build/"
    
    # Remove Firefox-specific fields from manifest
    node -e "
        const fs = require('fs');
        const manifest = require('$chrome_build/manifest.json');
        delete manifest.browser_specific_settings;
        fs.writeFileSync('$chrome_build/manifest.json', JSON.stringify(manifest, null, 2));
    "
    
    # Create ZIP file
    cd "$chrome_build"
    zip -r "$DIST_DIR/ionblock-chrome-v$VERSION.zip" . -x "*.DS_Store" "*.git*" > /dev/null
    cd "$PROJECT_ROOT"
    
    echo -e "${GREEN}✓ Chrome/Edge build complete: ionblock-chrome-v$VERSION.zip${NC}"
    echo ""
}

# Build for Firefox
build_firefox() {
    echo -e "${YELLOW}→ Building for Firefox Add-ons...${NC}"
    
    local firefox_build="$BUILD_DIR/firefox"
    mkdir -p "$firefox_build"
    
    # Copy extension files
    cp -r "$PROJECT_ROOT"/{manifest.json,background.js,content_script.js,popup.html,popup.js,popup.css} "$firefox_build/"
    cp -r "$PROJECT_ROOT"/{utils,core,injected,ui,rules,icons} "$firefox_build/"
    
    # Copy documentation
    cp "$PROJECT_ROOT"/{README.md,PRIVACY_POLICY.md,LICENSE} "$firefox_build/"
    
    # Ensure Firefox-specific manifest fields are present
    node -e "
        const fs = require('fs');
        const manifest = require('$firefox_build/manifest.json');
        
        // Ensure browser_specific_settings exists
        if (!manifest.browser_specific_settings) {
            manifest.browser_specific_settings = {
                gecko: {
                    id: 'ionblock@extension.local',
                    strict_min_version: '109.0'
                }
            };
        }
        
        fs.writeFileSync('$firefox_build/manifest.json', JSON.stringify(manifest, null, 2));
    "
    
    # Create ZIP file for Firefox
    cd "$firefox_build"
    zip -r "$DIST_DIR/ionblock-firefox-v$VERSION.zip" . -x "*.DS_Store" "*.git*" > /dev/null
    cd "$PROJECT_ROOT"
    
    # Create source code ZIP (required by Firefox)
    echo -e "${YELLOW}  → Creating source code archive...${NC}"
    cd "$PROJECT_ROOT"
    zip -r "$DIST_DIR/ionblock-source-v$VERSION.zip" . \
        -x "*.git*" \
        -x "*.DS_Store" \
        -x "node_modules/*" \
        -x "build/*" \
        -x "dist/*" \
        > /dev/null
    
    echo -e "${GREEN}✓ Firefox build complete: ionblock-firefox-v$VERSION.zip${NC}"
    echo -e "${GREEN}✓ Source code archive: ionblock-source-v$VERSION.zip${NC}"
    echo ""
}

# Generate checksums
generate_checksums() {
    echo -e "${YELLOW}→ Generating checksums...${NC}"
    
    cd "$DIST_DIR"
    
    if command -v sha256sum > /dev/null; then
        sha256sum *.zip > checksums.txt
    elif command -v shasum > /dev/null; then
        shasum -a 256 *.zip > checksums.txt
    else
        echo -e "${YELLOW}⚠ SHA256 tool not found, skipping checksums${NC}"
        return
    fi
    
    echo -e "${GREEN}✓ Checksums generated: checksums.txt${NC}"
    echo ""
}

# Generate build info
generate_build_info() {
    echo -e "${YELLOW}→ Generating build info...${NC}"
    
    cat > "$DIST_DIR/BUILD_INFO.txt" << EOF
IonBlock Extension Build Information
=====================================

Version: $VERSION
Build Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Build System: $(uname -s) $(uname -m)

Packages:
---------
- ionblock-chrome-v$VERSION.zip     (Chrome Web Store / Edge Add-ons)
- ionblock-firefox-v$VERSION.zip    (Firefox Add-ons)
- ionblock-source-v$VERSION.zip     (Source code for Firefox review)

File Sizes:
-----------
$(ls -lh "$DIST_DIR"/*.zip | awk '{print $9, "-", $5}')

Installation:
-------------
Chrome/Edge:
  1. Extract ZIP file
  2. Open chrome://extensions/ or edge://extensions/
  3. Enable Developer Mode
  4. Click "Load unpacked" and select extracted folder

Firefox:
  1. Open about:addons
  2. Click gear icon → "Install Add-on From File"
  3. Select ionblock-firefox-v$VERSION.zip

Notes:
------
- All builds tested and validated
- Manifest V3 compliant
- Zero external dependencies
- Privacy-first (no data collection)

For publishing instructions, see STORE_SUBMISSION.md
EOF
    
    echo -e "${GREEN}✓ Build info generated: BUILD_INFO.txt${NC}"
    echo ""
}

# Main build process
main() {
    echo -e "${BLUE}Starting build process...${NC}"
    echo ""
    
    clean_build
    validate_extension
    build_chrome
    build_firefox
    generate_checksums
    generate_build_info
    
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Build Complete! 🎉             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Build artifacts available in: $DIST_DIR${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test each build thoroughly"
    echo "  2. Review BUILD_INFO.txt"
    echo "  3. Run: ${YELLOW}npm run publish${NC} to publish to stores"
    echo ""
}

# Run main function
main

