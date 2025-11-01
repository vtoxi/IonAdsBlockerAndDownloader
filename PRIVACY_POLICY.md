# Privacy Policy for IonBlock Extension

**Last Updated:** October 31, 2025

## Overview

IonBlock is a privacy-focused browser extension that blocks advertisements and enables media downloading. We are committed to protecting your privacy and maintaining transparency about our data practices.

## Data Collection

**We collect ZERO user data. None. Ever.**

### What We DON'T Collect:
- ❌ No browsing history
- ❌ No personal information
- ❌ No IP addresses
- ❌ No cookies or tracking data
- ❌ No usage analytics
- ❌ No telemetry
- ❌ No user identifiers
- ❌ No downloaded media records

## How the Extension Works

### Ad Blocking
- **Network Level:** Blocks ad requests using local rule lists
- **DOM Level:** Removes ad elements from web pages
- **All Processing:** Happens locally on your device
- **No External Servers:** No data sent to remote servers

### Media Downloading
- **Detection:** Scans web pages for downloadable media
- **Downloads:** Processed through your browser's native download API
- **Storage:** Files saved directly to your device
- **No Cloud:** No uploads or external storage

## Data Storage

### Local Storage Only
All extension settings and preferences are stored locally on your device using:
- `chrome.storage.local` - For temporary data
- `chrome.storage.sync` - For syncing settings across your devices (optional, uses browser's sync)

### What We Store Locally:
- Extension enabled/disabled state
- Feature toggles (ad blocker, downloader)
- Whitelisted domains (if you add any)
- Statistics (ads blocked count, media downloaded count)

**Note:** Even this local data can be cleared at any time by removing the extension.

## Permissions Explained

### Why We Need Them:
- **`declarativeNetRequest`** - To block ad domains at the network level
- **`storage`** - To save your extension settings locally
- **`downloads`** - To enable media downloading through browser API
- **`activeTab`** - To interact with the current page when you click the extension
- **`scripting`** - To inject ad-blocking and media detection scripts
- **`webRequest`** - To monitor and capture media requests
- **`<all_urls>`** - To work on all websites (ad blocking needs this)

### What We DON'T Do With Permissions:
- ❌ Track your browsing
- ❌ Collect page content
- ❌ Send data externally
- ❌ Modify pages for profit
- ❌ Inject ads or tracking

## Third-Party Services

**We use ZERO third-party services.**

- No analytics services (Google Analytics, etc.)
- No error tracking (Sentry, etc.)
- No CDNs for code delivery
- No external API calls
- No advertising networks
- No affiliate links

## Open Source

IonBlock is open source. You can:
- Review the entire source code
- Verify there's no data collection
- Audit security yourself
- Contribute improvements

**Repository:** https://github.com/ionblock/extension

## Updates

### How Updates Work:
- Extension updates are delivered through the browser's extension store
- No automatic code execution from remote servers
- All rule updates are bundled with the extension
- You control when to update

## Your Rights

Since we don't collect any data, there's nothing to:
- Request access to
- Request deletion of
- Request portability of
- Opt out from

## Content Policy

### Legal Use Only
IonBlock enables downloading of media content. Users must:
- ✅ Only download content they have rights to access
- ✅ Respect copyright and intellectual property laws
- ✅ Use for personal, non-commercial purposes
- ❌ Not use for piracy or copyright infringement

**Disclaimer:** We are not responsible for how users utilize the download feature. Users assume all legal responsibility for their downloads.

## DRM Content

IonBlock **actively refuses** to download DRM-protected content:
- Detects DRM indicators (Widevine, PlayReady, etc.)
- Skips protected content
- Only works with unencrypted, accessible media

## Children's Privacy

IonBlock does not collect any data from anyone, including children under 13.

## Changes to This Policy

If we ever change this policy, we will:
1. Update this document
2. Change the "Last Updated" date
3. Notify users through extension update notes

## Contact

For questions, concerns, or security issues:
- **GitHub Issues:** https://github.com/ionblock/extension/issues
- **Email:** privacy@ionblock.extension (if applicable)

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Firefox Add-ons Policies
- Microsoft Edge Add-ons Policies
- GDPR (by not collecting any data)
- CCPA (by not collecting any data)

## Verification

You can verify our privacy claims by:
1. Reading the source code
2. Using browser developer tools to monitor network requests
3. Checking storage usage in browser settings
4. Running the extension in a test environment

---

**Bottom Line:** IonBlock respects your privacy absolutely. We don't collect, transmit, or store any of your personal data. Everything happens locally on your device. You're in complete control.

