# IonBlock Testing Guide

## Overview

This document provides comprehensive testing instructions for IonBlock extension across all supported browsers.

---

## Prerequisites

### Required Browsers
- **Google Chrome** (latest version)
- **Microsoft Edge** (latest version)
- **Mozilla Firefox** (latest version)
- **Tor Browser** (latest version)

### Testing Environment
- Clean browser profiles (recommended)
- No conflicting ad blockers installed
- Developer mode enabled

---

## Installation Testing

### Chrome / Edge

1. **Load Extension**
   ```
   1. Open chrome://extensions/ (or edge://extensions/)
   2. Enable "Developer mode"
   3. Click "Load unpacked"
   4. Select ionblock-extension folder
   5. Verify extension appears in toolbar
   ```

2. **Verify Installation**
   - [ ] Extension icon visible in toolbar
   - [ ] Click icon opens popup
   - [ ] No console errors in background page
   - [ ] Permissions correctly requested

### Firefox / Tor Browser

1. **Load Extension**
   ```
   1. Open about:debugging#/runtime/this-firefox
   2. Click "Load Temporary Add-on"
   3. Select manifest.json from extension folder
   4. Verify extension loads without errors
   ```

2. **Verify Installation**
   - [ ] Extension icon visible
   - [ ] Popup opens correctly
   - [ ] No compatibility warnings
   - [ ] Browser console clear of errors

---

## Feature Testing

### 1. Ad Blocking Tests

#### YouTube Ad Blocking

**Test Case 1.1: Pre-roll Ads**
1. Disable other ad blockers
2. Navigate to https://youtube.com
3. Play a monetized video
4. **Expected:** No pre-roll ad plays
5. **Verify:** Video starts immediately or within 1-2 seconds

**Test Case 1.2: Mid-roll Ads**
1. Watch a long video (>10 minutes)
2. Skip to middle of video
3. **Expected:** No mid-roll ads interrupt playback
4. **Verify:** Continuous playback

**Test Case 1.3: Overlay Ads**
1. Play any YouTube video
2. Watch for 10-15 seconds
3. **Expected:** No banner overlays appear at bottom
4. **Verify:** Clean video player interface

**Test Case 1.4: Sidebar Ads**
1. View YouTube homepage
2. Scroll through recommendations
3. **Expected:** No promoted content cards
4. **Verify:** Only organic recommendations visible

**Test Case 1.5: Skip Button Auto-click**
1. Find a video with unskippable ad (if ads appear)
2. **Expected:** Skip button auto-clicked when available
3. **Verify:** Console log shows "Clicked skip button"

#### General Web Ad Blocking

**Test Case 1.6: Banner Ads**
1. Visit popular news sites (e.g., cnn.com, forbes.com)
2. Scroll through articles
3. **Expected:** No banner ads visible
4. **Verify:** Content loads without ad placeholders

**Test Case 1.7: Tracking Scripts**
1. Open DevTools → Network tab
2. Visit any website
3. Filter by "blocked"
4. **Expected:** Requests to doubleclick.net, googlesyndication.com blocked
5. **Verify:** Red "blocked" status in network panel

**Test Case 1.8: Stats Counter**
1. Browse multiple sites
2. Click extension icon
3. **Expected:** "Ads Blocked" counter increments
4. **Verify:** Number matches blocked requests

### 2. Media Downloader Tests

#### Direct URL Capture

**Test Case 2.1: HTML5 Video**
1. Visit page with `<video src="...">` element
2. Wait 2-3 seconds
3. **Expected:** Floating download button appears
4. **Verify:** Button positioned bottom-right
5. Click button
6. **Expected:** Browser download prompt
7. **Verify:** Video file downloads successfully

**Test Case 2.2: YouTube Thumbnails**
1. Navigate to any YouTube video
2. Wait for page load
3. **Expected:** High-quality thumbnails detected
4. Check console: "Media detected: youtube_thumbnail"
5. **Verify:** Multiple quality thumbnails available

#### Streaming Protocol Support

**Test Case 2.3: HLS Stream Detection**
1. Visit page with .m3u8 stream
2. Open DevTools console
3. **Expected:** Log shows "Stream detected: hls"
4. **Verify:** Media detected event fired

**Test Case 2.4: DASH Stream Detection**
1. Visit page with .mpd manifest
2. Open DevTools console
3. **Expected:** Log shows "Stream detected: dash"
4. **Verify:** Manifest parsing initiated

**Test Case 2.5: Segment Merging**
1. Attempt to download HLS/DASH stream
2. Watch network tab
3. **Expected:** Multiple segment requests
4. **Verify:** Segments merge into single file
5. **Verify:** Final file is playable

#### Network Interception

**Test Case 2.6: XHR Capture**
1. Visit page using XMLHttpRequest for media
2. Open DevTools console
3. **Expected:** "Media detected: network_xhr"
4. **Verify:** URL captured correctly

**Test Case 2.7: Fetch API Capture**
1. Visit modern site using fetch() for media
2. Check console logs
3. **Expected:** "Media detected: network_fetch"
4. **Verify:** Capture script hooks working

#### DRM Protection Test

**Test Case 2.8: DRM Content Rejection**
1. Visit Netflix, Disney+, or similar
2. Play DRM-protected content
3. **Expected:** No download button appears
4. **Verify:** Console shows "Skipping DRM content"
5. **Verify:** Extension respects content protection

### 3. UI/UX Tests

#### Popup Interface

**Test Case 3.1: Main Toggle**
1. Click extension icon
2. Toggle main switch OFF
3. **Expected:** Extension disables
4. Reload page
5. **Verify:** No ad blocking or media detection
6. Toggle back ON
7. **Verify:** Features re-enable

**Test Case 3.2: Feature Toggles**
1. Open popup
2. Disable "Ad Blocker" only
3. **Expected:** Ads appear, downloader still works
4. Disable "Media Downloader" only
5. **Expected:** No download button, ads still blocked

**Test Case 3.3: Statistics Display**
1. Open popup
2. **Verify:** Ads blocked count visible
3. **Verify:** Media downloaded count visible
4. **Verify:** Numbers formatted correctly (commas)

**Test Case 3.4: Whitelist Function**
1. Open popup on any site
2. Click "Add to Whitelist"
3. **Expected:** Button changes to "Remove from Whitelist"
4. **Expected:** Page reloads
5. **Verify:** Ads appear on whitelisted site
6. Click "Remove from Whitelist"
7. **Verify:** Ad blocking resumes

#### Floating Download Button

**Test Case 3.5: Button Appearance**
1. Visit page with media
2. **Expected:** Button slides in from bottom-right
3. **Verify:** Smooth animation
4. **Verify:** Button visible and readable

**Test Case 3.6: Button Interaction**
1. Hover over download button
2. **Expected:** Button elevates (shadow increases)
3. Click button
4. **Expected:** Button shows "Downloading..." state
5. **Expected:** Button changes to "✓ Downloaded!" on success
6. **Expected:** Button fades out after 2 seconds

**Test Case 3.7: Button Auto-hide**
1. Wait 10 seconds without interaction
2. **Expected:** Button fades to opacity 0
3. **Expected:** Button removes itself after fade

### 4. Settings & Storage Tests

**Test Case 4.1: Settings Persistence**
1. Toggle features in popup
2. Close popup
3. Reopen popup
4. **Verify:** Settings remain as set
5. Restart browser
6. **Verify:** Settings still persisted

**Test Case 4.2: Whitelist Persistence**
1. Add 3 domains to whitelist
2. Restart browser
3. **Verify:** All 3 domains still whitelisted
4. Remove 1 domain
5. **Verify:** Only 2 remain

**Test Case 4.3: Stats Persistence**
1. Note current stats (ads blocked, media downloaded)
2. Close browser
3. Reopen browser
4. **Verify:** Stats retained across sessions

---

## Cross-Browser Compatibility Tests

### Chrome-Specific Tests

**Test Case 5.1: Service Worker**
1. Open chrome://extensions/
2. Click "Inspect views: service worker"
3. **Verify:** Background page loads without errors
4. **Verify:** Message handlers registered

**Test Case 5.2: DNR Rules**
1. Open DevTools → Network → Blocked
2. **Verify:** Rules blocking correctly
3. Check chrome.declarativeNetRequest API
4. **Verify:** 20 rules loaded

### Firefox-Specific Tests

**Test Case 5.3: Browser Namespace**
1. Open DevTools console in background page
2. Type: `typeof browser`
3. **Verify:** Returns "object" (not undefined)
4. **Verify:** Extension uses `browser` API not `chrome`

**Test Case 5.4: Temporary Add-on Behavior**
1. Load as temporary add-on
2. Use extension normally
3. Restart Firefox
4. **Verify:** Extension unloaded (expected)
5. **Verify:** No errors in console

### Tor Browser-Specific Tests

**Test Case 5.5: Security Level Compatibility**
1. Set Tor security level to "Safer"
2. Load extension
3. **Verify:** Extension loads
4. **Verify:** Basic functionality works
5. Set to "Safest"
6. **Verify:** Extension behavior under strict restrictions

**Test Case 5.6: Isolation Mode**
1. Test on .onion sites
2. **Verify:** Extension respects Tor's isolation
3. **Verify:** No external requests made

### Edge-Specific Tests

**Test Case 5.7: Edge Store Compatibility**
1. Check manifest.json fields
2. **Verify:** Compatible with Edge Add-ons requirements
3. **Verify:** Icons load correctly
4. **Verify:** Popup renders properly

---

## Performance Tests

### Memory Usage

**Test Case 6.1: Idle Memory**
1. Load extension
2. Open Task Manager (Shift+Esc in Chrome)
3. Note extension memory usage
4. **Expected:** < 50MB idle

**Test Case 6.2: Active Memory**
1. Browse 10+ pages
2. Check memory usage
3. **Expected:** < 100MB with normal browsing

**Test Case 6.3: Memory Leaks**
1. Browse for 30+ minutes
2. Open/close popup 20+ times
3. Monitor memory usage
4. **Expected:** No continuous growth

### CPU Usage

**Test Case 6.4: Idle CPU**
1. Extension loaded, browser idle
2. Check CPU usage
3. **Expected:** < 1% CPU

**Test Case 6.5: Active CPU**
1. Load heavy page (e.g., YouTube)
2. Monitor CPU usage
3. **Expected:** < 10% CPU increase

### Network Impact

**Test Case 6.6: Request Blocking Efficiency**
1. Visit ad-heavy site
2. Compare with extension ON vs OFF
3. **Expected:** 20-50% fewer requests
4. **Expected:** Faster page load time

---

## Security Tests

**Test Case 7.1: No External Requests**
1. Open DevTools → Network
2. Use extension normally
3. **Verify:** NO requests to external servers
4. **Verify:** All traffic stays local

**Test Case 7.2: Content Security Policy**
1. Check manifest.json CSP
2. **Verify:** No 'unsafe-inline' or 'unsafe-eval'
3. **Verify:** Strict CSP enforced

**Test Case 7.3: Permissions Scope**
1. Review manifest permissions
2. **Verify:** Only necessary permissions requested
3. **Verify:** No excessive access

---

## Error Handling Tests

**Test Case 8.1: Invalid URL**
1. Try to download invalid URL
2. **Expected:** Error message shown
3. **Verify:** Extension doesn't crash

**Test Case 8.2: Network Failure**
1. Disable internet during download
2. **Expected:** Download fails gracefully
3. **Verify:** User notified

**Test Case 8.3: Large File Handling**
1. Attempt to download very large video
2. **Expected:** Memory doesn't spike unreasonably
3. **Verify:** Browser remains responsive

---

## Regression Testing Checklist

Before each release, verify:
- [ ] All ad blocking tests pass
- [ ] All media downloader tests pass
- [ ] Cross-browser compatibility confirmed
- [ ] Performance within acceptable limits
- [ ] No security vulnerabilities introduced
- [ ] Privacy policy still accurate
- [ ] Documentation updated

---

## Bug Report Template

When filing bugs, include:
```
**Browser:** Chrome/Firefox/Edge/Tor + version
**OS:** Windows/Mac/Linux + version
**Extension Version:** 1.0.0
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected Behavior:**
**Actual Behavior:**
**Console Errors:** (paste here)
**Screenshots:** (if applicable)
```

---

## Automated Testing (Future)

Consider implementing:
- Selenium/Puppeteer for browser automation
- Jest for unit tests
- CI/CD pipeline for automated testing
- Performance benchmarking suite

---

**Testing Status:** ✅ Manual testing complete | ⏳ Automated testing planned

