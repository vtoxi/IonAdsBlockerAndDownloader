# Store Submission Guide

## Overview

This guide walks through submitting IonBlock to Chrome Web Store, Firefox Add-ons, and Microsoft Edge Add-ons.

---

## Pre-Submission Checklist

### Code Quality
- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Code is readable and well-commented
- [ ] No obfuscated code
- [ ] No external dependencies (unless justified)

### Documentation
- [ ] README.md complete and accurate
- [ ] PRIVACY_POLICY.md hosted and accessible
- [ ] LICENSE file included
- [ ] All permissions justified

### Assets
- [ ] icon16.png (16x16)
- [ ] icon48.png (48x48)
- [ ] icon128.png (128x128)
- [ ] Screenshots prepared (1280x800 or 640x400)
- [ ] Promotional images (if required)

### Legal Compliance
- [ ] Privacy policy reviewed
- [ ] Terms of service clear
- [ ] Copyright disclaimers included
- [ ] DRM detection working

---

## Chrome Web Store Submission

### Requirements

1. **Developer Account**
   - Sign up at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - One-time $5 registration fee
   - Google account required

2. **Package Extension**
   ```bash
   # Create ZIP file
   cd ionblock-extension
   zip -r ionblock-extension-v1.0.0.zip . -x "*.git*" -x "*.DS_Store" -x "node_modules/*"
   ```

3. **Prepare Listing Information**

   **Required Fields:**
   - **Name:** IonBlock - Smart AdBlocker & Media Downloader
   - **Summary:** Privacy-focused ad blocker for YouTube and web with media downloading
   - **Description:** (See below)
   - **Category:** Productivity
   - **Language:** English
   - **Privacy Policy URL:** https://your-domain.com/privacy or GitHub Pages URL

   **Description Template:**
   ```
   IonBlock is a privacy-first browser extension that blocks ads and enables smart media downloading.
   
   FEATURES:
   ✓ YouTube ad blocking (pre-roll, mid-roll, overlays)
   ✓ General web ad blocking
   ✓ Advanced media downloading (9 capture strategies)
   ✓ HLS/DASH stream support
   ✓ Zero data collection
   ✓ Open source
   
   PRIVACY:
   We collect ZERO user data. All processing happens locally on your device.
   No tracking, no analytics, no external servers.
   
   LEGAL USE:
   Only download content you have rights to access. Respects DRM and copyright.
   
   Full source code: https://github.com/ionblock/extension
   ```

4. **Screenshots** (Minimum 1, Maximum 5)
   - Size: 1280x800 or 640x400
   - Show: Popup UI, ad-blocking in action, download feature

5. **Permission Justifications**
   
   When asked why each permission is needed:
   
   - **declarativeNetRequest:** "Required to block advertising and tracking domains at the network level before requests are made. Essential for ad-blocking functionality."
   
   - **storage:** "Stores user preferences (enabled/disabled state, whitelist) locally. No data sent externally."
   
   - **downloads:** "Enables the media download feature. Downloads are processed through the browser's native API."
   
   - **activeTab:** "Allows the extension to interact with the current tab only when the user clicks the extension icon."
   
   - **scripting:** "Injects content scripts to detect and remove ad elements from web pages."
   
   - **webRequest:** "Monitors network requests to detect downloadable media files (videos, images, audio)."
   
   - **host permission (<all_urls>):** "Required for ad-blocking to work across all websites. The extension needs to scan pages for ads and inject blocking scripts."

6. **Single Purpose**
   
   Chrome requires extensions have a single, clear purpose. Our justification:
   
   > "IonBlock's single purpose is content control and enhancement: blocking unwanted content (ads) and enabling access to desired content (media downloads). Both features serve the same goal of giving users control over their browsing experience."

7. **Submit**
   - Upload ZIP file
   - Fill all required fields
   - Submit for review
   - Review typically takes 1-3 business days

---

## Firefox Add-ons Submission

### Requirements

1. **Developer Account**
   - Sign up at [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
   - Free (no registration fee)
   - Firefox account required

2. **Prepare manifest.json for Firefox**
   
   Ensure these fields are present:
   ```json
   {
     "browser_specific_settings": {
       "gecko": {
         "id": "ionblock@extension.local",
         "strict_min_version": "109.0"
       }
     }
   }
   ```

3. **Package Extension**
   ```bash
   # Same as Chrome
   zip -r ionblock-extension-v1.0.0.zip . -x "*.git*" -x "*.DS_Store"
   ```

4. **Source Code Submission**
   
   Firefox manually reviews code. If your ZIP doesn't contain source:
   - Upload separate source code ZIP
   - Include build instructions (if applicable)
   - Our extension has no build step, so source = distribution

5. **Listing Information**
   
   Similar to Chrome Web Store:
   - **Name:** IonBlock
   - **Summary:** (70 characters max)
   - **Description:** Same as Chrome
   - **Categories:** Privacy & Security, Content Blocking
   - **License:** MIT
   - **Privacy Policy:** Required URL

6. **Review Process**
   - Automated scan first
   - Manual code review by Mozilla staff
   - Can take 1-5 days
   - May request changes

7. **Self-Distribution (Alternative)**
   - Generate .xpi file
   - Self-host on your website
   - Users can install directly
   - No review process needed

---

## Microsoft Edge Add-ons Submission

### Requirements

1. **Partner Center Account**
   - Register at [Microsoft Partner Center](https://partner.microsoft.com/)
   - May require verification
   - Uses Azure AD account

2. **Package Extension**
   ```bash
   # Same ZIP as Chrome (Edge uses Chromium)
   zip -r ionblock-extension-v1.0.0.zip . -x "*.git*"
   ```

3. **Listing Details**
   - Nearly identical to Chrome Web Store
   - Supports most Chrome manifest.json fields
   - Privacy policy required

4. **Certification Process**
   - Automated tests first
   - Manual review if flagged
   - Typically faster than Chrome (1-2 days)

---

## Common Rejection Reasons (Avoid These)

### Chrome Web Store

1. **Broad Host Permissions**
   - ❌ Problem: Requesting `<all_urls>` without justification
   - ✅ Solution: Clearly explain why ad-blocking needs all sites

2. **Remote Code Execution**
   - ❌ Problem: Loading external JavaScript
   - ✅ Solution: All code bundled, no external scripts

3. **User Data Collection**
   - ❌ Problem: Unclear privacy policy about data collection
   - ✅ Solution: Explicitly state "ZERO data collection"

4. **Misleading Functionality**
   - ❌ Problem: Features not working as described
   - ✅ Solution: Test thoroughly before submission

5. **Obfuscated Code**
   - ❌ Problem: Minified or packed code without source
   - ✅ Solution: Use readable code, provide source

### Firefox Add-ons

1. **Missing Source Code**
   - ❌ Problem: Compiled/built code without original source
   - ✅ Solution: Include all source files

2. **Unapproved APIs**
   - ❌ Problem: Using experimental or deprecated APIs
   - ✅ Solution: Stick to stable WebExtension APIs

3. **Network Requests**
   - ❌ Problem: Unexplained external requests
   - ✅ Solution: We make NONE (good!)

4. **Security Vulnerabilities**
   - ❌ Problem: XSS, injection flaws, insecure practices
   - ✅ Solution: Follow security best practices

---

## Post-Submission

### After Approval

1. **Monitor Reviews**
   - Respond to user reviews
   - Address common issues
   - Fix reported bugs

2. **Track Metrics**
   - Install counts
   - Uninstall rates
   - Review ratings

3. **Updates**
   - Test thoroughly before updating
   - Increment version number
   - Provide changelog

### Update Process

```bash
# 1. Update version in manifest.json
"version": "1.0.1"

# 2. Create new ZIP
zip -r ionblock-extension-v1.0.1.zip . -x "*.git*"

# 3. Upload to store(s)
# 4. Add update notes
```

---

## Store-Specific Tips

### Chrome Web Store
- **Respond quickly to review feedback** - They may ask questions
- **Keep descriptions concise** - Too much text can be flagged
- **Use high-quality screenshots** - Poor visuals = rejection
- **Monitor dashboard daily** - Reviews can be fast

### Firefox Add-ons
- **Be patient with manual review** - Humans review code
- **Provide detailed source notes** - Explain any complex code
- **Join Mozilla's AMO forum** - Community support available
- **Consider self-distribution initially** - Faster than review

### Edge Add-ons
- **Mirror Chrome listings** - Edge accepts most Chrome extensions
- **Update both stores together** - Keep versions in sync
- **Leverage existing Chrome approval** - Mention if Chrome-approved

---

## Troubleshooting Common Issues

### "Excessive Permissions" Flag

**Problem:** Store thinks permissions are too broad  
**Solution:** Provide detailed justification for each permission

### "Privacy Policy Not Accessible"

**Problem:** Privacy policy URL doesn't load  
**Solution:** Host on GitHub Pages or dedicated domain

### "Functionality Not Working"

**Problem:** Reviewers can't reproduce advertised features  
**Solution:** Provide testing instructions in review notes

### "Violates Content Policy"

**Problem:** Download feature seen as piracy tool  
**Solution:** Emphasize legal use, DRM detection, disclaimers

---

## Hosting Privacy Policy (GitHub Pages)

```bash
# 1. Enable GitHub Pages on your repo
# Settings → Pages → Source: main branch

# 2. Privacy policy will be at:
https://yourusername.github.io/ionblock-extension/PRIVACY_POLICY

# 3. Use this URL in store listings
```

---

## Success Metrics

After listing, track:
- **Weekly Active Users (WAU)**
- **Average Rating** (target: 4.0+)
- **Review Sentiment**
- **Uninstall Rate** (lower is better)
- **Bug Reports** (address quickly)

---

## Resources

- [Chrome Web Store Developer Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- [Edge Add-ons Policies](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/store-policies/developer-policies)

---

**Good luck with your submission! 🚀**

