#!/bin/bash
# IonBlock - Version Bump Script
# Automatically increments version number in manifest.json

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANIFEST="$PROJECT_ROOT/manifest.json"

echo -e "${BLUE}IonBlock Version Bumper${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('$MANIFEST').version")
echo "Current version: $CURRENT_VERSION"
echo ""

# Parse version
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"

# Ask bump type
echo "Select version bump type:"
echo "  1) Major (breaking changes) - $major.$minor.$patch → $((major+1)).0.0"
echo "  2) Minor (new features) - $major.$minor.$patch → $major.$((minor+1)).0"
echo "  3) Patch (bug fixes) - $major.$minor.$patch → $major.$minor.$((patch+1))"
echo "  4) Custom version"
echo ""
read -p "Enter choice [3]: " choice
choice=${choice:-3}

case $choice in
    1)
        NEW_VERSION="$((major+1)).0.0"
        ;;
    2)
        NEW_VERSION="$major.$((minor+1)).0"
        ;;
    3)
        NEW_VERSION="$major.$minor.$((patch+1))"
        ;;
    4)
        read -p "Enter new version (e.g., 1.2.3): " NEW_VERSION
        if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}✗ Invalid version format${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Updating version: $CURRENT_VERSION → $NEW_VERSION${NC}"
echo ""

# Update manifest.json
node -e "
    const fs = require('fs');
    const manifest = require('$MANIFEST');
    manifest.version = '$NEW_VERSION';
    fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2) + '\n');
"

echo -e "${GREEN}✓ manifest.json updated${NC}"

# Create git tag (if git repo exists)
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo ""
    read -p "Create git tag v$NEW_VERSION? [y/N]: " create_tag
    
    if [ "$create_tag" = "y" ] || [ "$create_tag" = "Y" ]; then
        cd "$PROJECT_ROOT"
        git add manifest.json
        git commit -m "Bump version to $NEW_VERSION" || true
        git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
        echo -e "${GREEN}✓ Git tag created: v$NEW_VERSION${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Version bump complete!${NC}"
echo "New version: $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Update CHANGELOG.md"
echo "  2. Run: ./scripts/build.sh"
echo "  3. Run: ./scripts/publish-all.sh"
echo ""

