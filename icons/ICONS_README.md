# IonBlock Icons

## Required Icon Sizes

The extension needs three icon sizes for different contexts:

- **icon16.png** - 16x16 pixels - Toolbar icon (small)
- **icon48.png** - 48x48 pixels - Extension management page
- **icon128.png** - 128x128 pixels - Chrome Web Store listing

## Design Concept

**Theme:** Shield + Download Arrow

- Primary color: #4F46E5 (Indigo)
- Gradient: Purple to indigo
- Symbol: Shield (protection/blocking) with download arrow
- Style: Modern, flat design with subtle gradients

## Generating Icons

### Option 1: Use Online Tools
1. Visit https://www.canva.com or https://www.figma.com
2. Create a 128x128 canvas
3. Design a shield with a download arrow
4. Export as PNG at 128x128, 48x48, and 16x16

### Option 2: Use ImageMagick (Command Line)
```bash
# Create a simple placeholder
convert -size 128x128 xc:#4F46E5 -fill white -pointsize 60 -gravity center -annotate +0+0 "↓" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

### Option 3: Use the SVG Template
An SVG template is provided in this directory. Convert it using:
```bash
# If you have rsvg-convert
rsvg-convert -w 128 -h 128 icon.svg > icon128.png
rsvg-convert -w 48 -h 48 icon.svg > icon48.png
rsvg-convert -w 16 -h 16 icon.svg > icon16.png
```

## Temporary Placeholders

For development and testing, you can use solid color placeholders:
- The extension will still work without fancy icons
- Replace with proper designs before publishing

## Design Guidelines (for Store Approval)

1. **No copyrighted elements** - Original design only
2. **Clear at small sizes** - Icon must be recognizable at 16px
3. **Light/dark backgrounds** - Should work on both
4. **No text** - Icons should be symbolic, not text-based
5. **Professional** - Clean, polished appearance

## Current Status

⚠️ **Placeholder icons needed** - Create actual PNG files before publishing to extension stores.

