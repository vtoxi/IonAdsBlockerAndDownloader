# IonBlock - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Load the Extension

#### Chrome or Edge
```
1. Open chrome://extensions/ (or edge://extensions/)
2. Toggle "Developer mode" ON (top right)
3. Click "Load unpacked"
4. Navigate to and select the ionblock-extension folder
5. Extension appears in toolbar ✓
```

#### Firefox or Tor Browser
```
1. Open about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Navigate to ionblock-extension folder
4. Select any file (e.g., manifest.json)
5. Extension appears in toolbar ✓
```

### Step 2: Test Ad Blocking

```
1. Visit https://youtube.com
2. Play any video
3. Observe: No pre-roll ads!
4. Click extension icon
5. See "Ads Blocked" counter increase
```

### Step 3: Test Media Downloader

```
1. Stay on YouTube video page
2. Wait 2-3 seconds
3. Look for floating "Download" button (bottom-right)
4. Click button
5. Choose save location
6. Thumbnail downloads! ✓
```

### Step 4: Explore Features

**Open Extension Popup:**
- Click IonBlock icon in toolbar
- Toggle features on/off
- View statistics
- Whitelist current site
- Check privacy links

**Try These Pages:**
- YouTube (ad blocking + thumbnail download)
- News sites (general ad blocking)
- Video sites (media detection)

---

## ⚡ Common Commands

### Load Extension
```bash
# Chrome
chrome://extensions/ → Developer Mode → Load Unpacked

# Firefox
about:debugging → Load Temporary Add-on
```

### Reload After Changes
```bash
# Chrome/Edge
chrome://extensions/ → Click ↻ on IonBlock card

# Firefox
about:debugging → Reload button
```

### Check Console for Errors
```bash
# Chrome/Edge Background Console
chrome://extensions/ → IonBlock → "Inspect views: service worker"

# Content Script Console
Right-click page → Inspect → Console → Look for [IonBlock] logs

# Firefox
about:debugging → IonBlock → Inspect
```

---

## 🐛 Troubleshooting

### Extension Won't Load
- **Check manifest.json is valid** (no syntax errors)
- **Verify all files present** (check file list in README)
- **Look for red errors** in chrome://extensions page

### Ad Blocking Not Working
1. Disable other ad blockers (conflicts!)
2. Check extension is enabled (click icon)
3. Verify not on whitelisted domain
4. Reload page after enabling

### Download Button Not Appearing
1. Check "Media Downloader" is enabled in popup
2. Verify page has detectable media
3. Open console, look for "Media detected" logs
4. Some sites may not have downloadable content

### No Statistics Showing
- Stats may take 10-15 seconds to update
- Refresh popup to see latest numbers
- Stats persist across browser restarts

---

## 📊 Quick Test Checklist

- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Popup opens when clicked
- [ ] YouTube ads are blocked
- [ ] Download button appears on video pages
- [ ] Statistics update correctly
- [ ] Whitelist add/remove works
- [ ] Settings persist after reload

**All checked?** You're ready to use IonBlock! 🎉

---

## 📚 Full Documentation

For comprehensive guides, see:
- **README.md** - Full feature documentation
- **TESTING.md** - Complete test cases
- **STORE_SUBMISSION.md** - Publishing guide
- **PRIVACY_POLICY.md** - Privacy information

---

## 🆘 Need Help?

1. Check console for error messages
2. Review README.md FAQ section
3. Open GitHub issue with details
4. Include browser type, OS, error logs

---

**You're all set! Enjoy an ad-free, media-enhanced browsing experience!** 🛡️⬇️

