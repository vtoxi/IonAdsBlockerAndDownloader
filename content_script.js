/**
 * IonBlock Content Script
 * Main content script that coordinates ad blocking and media detection
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Module instances
let adBlocker = null;
let mediaDownloader = null;
let youtubeDownloader = null;
let settings = null;

/**
 * Initialize content script
 */
async function init() {
  console.log('[IonBlock] Content script initializing...');
  
  // Load settings
  settings = await loadSettings();
  
  // Check if current domain is whitelisted
  const currentDomain = window.location.hostname;
  const isWhitelisted = await checkWhitelist(currentDomain);
  
  if (isWhitelisted) {
    console.log('[IonBlock] Domain is whitelisted, extension disabled');
    return;
  }
  
  // Initialize ad blocker
  if (settings.enabled && settings.adBlockEnabled) {
    initAdBlocker();
  }
  
  // Initialize media downloader
  if (settings.enabled && settings.downloaderEnabled) {
    initMediaDownloader();
  }
  
  // Set up message listener
  setupMessageListener();
  
  console.log('[IonBlock] Content script initialized');
}

/**
 * Initialize ad blocker
 */
function initAdBlocker() {
  // Check if YouTube
  const isYouTube = window.location.hostname.includes('youtube.com');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isYouTube) {
        // Use enhanced YouTube ad blocker
        loadEnhancedYouTubeAdBlocker();
      } else {
        adBlocker = new AdBlocker();
      }
    });
  } else {
    if (isYouTube) {
      // Use enhanced YouTube ad blocker
      loadEnhancedYouTubeAdBlocker();
    } else {
      adBlocker = new AdBlocker();
    }
  }
}

/**
 * Load enhanced YouTube ad blocker
 */
function loadEnhancedYouTubeAdBlocker() {
  // Listen for ready signal from page context
  window.addEventListener('ionblock-adblocker-ready', () => {
    console.log('[IonBlock] Enhanced YouTube Ad Blocker initialized in page context');
    adBlocker = { enabled: true }; // Placeholder since it runs in page context
  }, { once: true });
  
  // Inject script into page context
  fetch(chrome.runtime.getURL('core/enhancedYouTubeAdBlocker.js'))
    .then(response => response.text())
    .then(scriptContent => {
      const script = document.createElement('script');
      script.textContent = scriptContent;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    })
    .catch(error => {
      console.error('[IonBlock] Failed to load enhanced YouTube ad blocker:', error);
      // Fallback to regular ad blocker in content script context
      adBlocker = new AdBlocker();
    });
}

/**
 * Initialize media downloader
 */
function initMediaDownloader() {
  // Check if this is YouTube
  const isYouTube = window.location.hostname.includes('youtube.com');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isYouTube) {
        initYouTubeDownloader();
      } else {
        mediaDownloader = new MediaDownloader();
      }
      setupMediaDetectionUI();
    });
  } else {
    if (isYouTube) {
      initYouTubeDownloader();
    } else {
      mediaDownloader = new MediaDownloader();
    }
    setupMediaDetectionUI();
  }
}

/**
 * Initialize YouTube-specific downloader
 */
function initYouTubeDownloader() {
  // Listen for ready signal from page context
  window.addEventListener('ionblock-downloader-ready', () => {
    console.log('[IonBlock] YouTube Downloader initialized in page context');
    youtubeDownloader = { enabled: true }; // Placeholder since it runs in page context
  }, { once: true });
  
  // Inject script into page context
  fetch(chrome.runtime.getURL('core/youtubeDownloader.js'))
    .then(response => response.text())
    .then(scriptContent => {
      const script = document.createElement('script');
      script.textContent = scriptContent;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    })
    .catch(error => {
      console.error('[IonBlock] Failed to load YouTube downloader:', error);
    });
}

/**
 * Set up UI for media detection
 */
function setupMediaDetectionUI() {
  // Listen for media detection events
  document.addEventListener('ionblock-media-detected', (event) => {
    const mediaInfo = event.detail;
    console.log('[IonBlock] Media detected:', mediaInfo);
    
    // Show floating download button for video/audio
    if (mediaInfo.type.includes('video') || mediaInfo.type.includes('audio')) {
      showFloatingButton(mediaInfo);
    }
  });
  
  // Listen for YouTube-specific events
  document.addEventListener('ionblock-youtube-ready', (event) => {
    const data = event.detail;
    console.log('[IonBlock] YouTube video ready:', data);
    
    // Show YouTube download button
    showYouTubeDownloadButton(data);
  });
  
  // Listen for download status
  document.addEventListener('ionblock-download-status', (event) => {
    const { status, message } = event.detail;
    console.log('[IonBlock] Download status:', status, message);
    
    if (status === 'error') {
      showNotification('Download Error', message, 'error');
    }
  });
}

/**
 * Show floating download button above media element
 */
function showFloatingButton(mediaInfo) {
  // Find the media element
  let targetElement = null;
  
  if (mediaInfo.element) {
    targetElement = mediaInfo.element;
  } else {
    // Try to find video or audio element
    targetElement = document.querySelector('video, audio');
  }
  
  if (!targetElement) {
    console.warn('[IonBlock] No media element found for button placement');
    return;
  }
  
  // Check if button already exists on this element
  const existingContainer = targetElement.parentElement?.closest('.ionblock-media-container');
  if (existingContainer) {
    return;
  }
  
  // Create wrapper container
  const container = document.createElement('div');
  container.className = 'ionblock-media-container';
  
  // Wrap the media element
  targetElement.parentNode.insertBefore(container, targetElement);
  container.appendChild(targetElement);
  
  // Create button
  const button = document.createElement('div');
  button.id = 'ionblock-download-btn';
  button.className = 'ionblock-floating-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/>
      <path d="M20 18H4V20H20V18Z" fill="currentColor"/>
    </svg>
    <span>Download Media</span>
  `;
  
  // Add click handler
  button.addEventListener('click', async () => {
    button.classList.add('downloading');
    button.innerHTML = '<span>⏳ Downloading...</span>';
    
    try {
      const allMedia = mediaDownloader.getAllMedia();
      if (allMedia.length > 0) {
        // Download the first detected video/audio
        const targetMedia = allMedia.find(m => 
          m.type.includes('video') || m.type.includes('audio')
        ) || allMedia[0];
        
        await mediaDownloader.downloadMedia(targetMedia.url);
        
        button.classList.remove('downloading');
        button.classList.add('success');
        button.innerHTML = '<span>✅ Downloaded!</span>';
        setTimeout(() => {
          button.remove();
          // Unwrap the container
          if (container.parentNode) {
            container.parentNode.insertBefore(targetElement, container);
            container.remove();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('[IonBlock] Download error:', error);
      button.classList.remove('downloading');
      button.classList.add('error');
      button.innerHTML = '<span>❌ Error</span>';
      setTimeout(() => {
        button.remove();
        // Unwrap the container
        if (container.parentNode) {
          container.parentNode.insertBefore(targetElement, container);
          container.remove();
        }
      }, 3000);
    }
  });
  
  // Load CSS
  loadFloatingButtonCSS();
  
  // Insert button at the top of container (before media element)
  container.insertBefore(button, targetElement);
  
  console.log('[IonBlock] Download button added above media element');
}

/**
 * Load floating button CSS
 */
function loadFloatingButtonCSS() {
  if (document.getElementById('ionblock-floating-button-css')) {
    return;
  }
  
  const link = document.createElement('link');
  link.id = 'ionblock-floating-button-css';
  link.rel = 'stylesheet';
  link.href = api.runtime.getURL('ui/floatingButton.css');
  document.head.appendChild(link);
}

/**
 * Show YouTube download button above video player
 */
function showYouTubeDownloadButton(data) {
  // Find YouTube video player
  const videoElement = document.querySelector('video') || document.querySelector('#movie_player');
  
  if (!videoElement) {
    console.warn('[IonBlock] No YouTube video player found');
    return;
  }
  
  // Check if button already exists on this element
  const existingContainer = videoElement.parentElement?.closest('.ionblock-media-container');
  if (existingContainer && existingContainer.querySelector('#ionblock-youtube-download-btn')) {
    return;
  }
  
  if (!data.formatsCount || data.formatsCount === 0) {
    console.warn('[IonBlock] No downloadable formats available');
    return;
  }
  
  // Create wrapper container if it doesn't exist
  let container = existingContainer;
  if (!container) {
    container = document.createElement('div');
    container.className = 'ionblock-media-container';
    videoElement.parentNode.insertBefore(container, videoElement);
    container.appendChild(videoElement);
  }
  
  // Create button
  const button = document.createElement('div');
  button.id = 'ionblock-youtube-download-btn';
  button.className = 'ionblock-floating-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z" fill="currentColor"/>
      <path d="M20 18H4V20H20V18Z" fill="currentColor"/>
    </svg>
    <span>Download Video</span>
    ${data.bestFormat?.qualityLabel ? `<span style="opacity: 0.8; font-size: 12px;">(${data.bestFormat.qualityLabel})</span>` : ''}
  `;
  
  // Add click handler
  button.addEventListener('click', async () => {
    button.classList.add('downloading');
    button.innerHTML = '<span>⏳ Downloading...</span>';
    
    try {
      if (youtubeDownloader) {
        await youtubeDownloader.downloadBest();
        
        button.classList.remove('downloading');
        button.classList.add('success');
        button.innerHTML = '<span>✅ Downloaded!</span>';
        setTimeout(() => {
          button.remove();
        }, 3000);
      } else {
        throw new Error('YouTube downloader not initialized');
      }
    } catch (error) {
      console.error('[IonBlock] YouTube download error:', error);
      button.classList.remove('downloading');
      button.classList.add('error');
      button.innerHTML = '<span>❌ Error</span>';
      setTimeout(() => {
        button.remove();
      }, 3000);
    }
  });
  
  // Load CSS
  loadFloatingButtonCSS();
  
  // Insert button at the top of container (before video element)
  container.insertBefore(button, videoElement);
  
  console.log('[IonBlock] YouTube download button shown above video player');
}

/**
 * Show notification
 */
function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ionblock-notification ionblock-notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    max-width: 300px;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <strong style="display: block; margin-bottom: 4px;">${title}</strong>
    <span style="font-size: 14px;">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const response = await api.runtime.sendMessage({
      action: 'get_settings'
    });
    
    return response.settings || {
      enabled: true,
      adBlockEnabled: true,
      downloaderEnabled: true
    };
  } catch (error) {
    console.error('[IonBlock] Failed to load settings:', error);
    return {
      enabled: true,
      adBlockEnabled: true,
      downloaderEnabled: true
    };
  }
}

/**
 * Check if domain is whitelisted
 */
async function checkWhitelist(domain) {
  try {
    const response = await api.runtime.sendMessage({
      action: 'get_whitelist'
    });
    
    return response.whitelist && response.whitelist.includes(domain);
  } catch (error) {
    return false;
  }
}

/**
 * Set up message listener
 */
function setupMessageListener() {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, data } = message;
    
    switch (action) {
      case 'toggle_ad_blocker':
        if (adBlocker) {
          if (data.enabled) {
            adBlocker.enable();
          } else {
            adBlocker.disable();
          }
        }
        sendResponse({ success: true });
        break;
        
      case 'get_detected_media':
        if (mediaDownloader) {
          const media = mediaDownloader.getAllMedia();
          sendResponse({ success: true, media });
        } else {
          sendResponse({ success: false, error: 'Media downloader not initialized' });
        }
        break;
        
      case 'download_media':
        if (mediaDownloader) {
          mediaDownloader.downloadMedia(data.url)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true; // Async response
        }
        sendResponse({ success: false, error: 'Media downloader not initialized' });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return false;
  });
}

// Load core modules inline (since we can't use ES6 imports in content scripts)
// AdBlocker class
class AdBlocker {
  constructor() {
    this.enabled = true;
    this.observer = null;
    this.removedCount = 0;
    this.isYouTube = window.location.hostname.includes('youtube.com');
    
    this.youtubeAdSelectors = [
      '.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay', '.ytp-ad-image-overlay', '.ytp-ad-player-overlay',
      'ytd-display-ad-renderer', 'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer', 'ytd-compact-promoted-video-renderer',
      'ytd-in-feed-ad-layout-renderer', 'ytd-banner-promo-renderer',
      '#masthead-ad', 'ytd-action-companion-ad-renderer',
      'ytd-ad-slot-renderer', '#player-ads'
    ];
    
    this.generalAdSelectors = [
      '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
      'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
      '.adsbygoogle', '[data-ad-slot]'
    ];
    
    this.init();
  }
  
  init() {
    this.cleanupAds();
    this.setupObserver();
    if (this.isYouTube) this.initYouTube();
    setInterval(() => this.reportStats(), 10000);
  }
  
  cleanupAds() {
    if (!this.enabled) return;
    const selectors = this.isYouTube ? this.youtubeAdSelectors : this.generalAdSelectors;
    let removed = 0;
    
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (this.shouldRemove(el)) {
            el.remove();
            removed++;
          }
        });
      } catch (error) {}
    });
    
    if (removed > 0) {
      this.removedCount += removed;
      console.log(`[IonBlock AdBlocker] Removed ${removed} ads (total: ${this.removedCount})`);
    }
  }
  
  shouldRemove(element) {
    if (element.querySelector('video[src]') && !element.closest('.video-ads')) return false;
    return element.tagName === 'IFRAME' || element.hasAttribute('data-ad-slot') || 
           /\bad\b/i.test(element.className);
  }
  
  setupObserver() {
    this.observer = new MutationObserver(() => {
      if (this.enabled) this.scheduleCleanup();
    });
    this.observer.observe(document.body || document.documentElement, {
      childList: true, subtree: true
    });
  }
  
  scheduleCleanup() {
    if (this.cleanupTimeout) clearTimeout(this.cleanupTimeout);
    this.cleanupTimeout = setTimeout(() => this.cleanupAds(), 100);
  }
  
  initYouTube() {
    setInterval(() => {
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
      if (skipButton && skipButton.offsetParent !== null) skipButton.click();
    }, 500);
    
    const style = document.createElement('style');
    style.textContent = '.ytp-ad-text-overlay, .ytp-ad-preview-text { display: none !important; }';
    document.head.appendChild(style);
  }
  
  async reportStats() {
    if (this.removedCount > 0 && api.runtime) {
      try {
        await api.runtime.sendMessage({ action: 'ad_blocked', data: { count: this.removedCount } });
        this.removedCount = 0;
      } catch (error) {}
    }
  }
  
  enable() { this.enabled = true; this.cleanupAds(); }
  disable() { this.enabled = false; }
}

// MediaDownloader class (simplified for inline use)
class MediaDownloader {
  constructor() {
    this.detectedMedia = new Map();
    this.init();
  }
  
  async init() {
    await this.injectCaptureScript();
    this.setupCaptureListener();
    this.scanDOM();
    setInterval(() => this.scanDOM(), 5000);
  }
  
  async injectCaptureScript() {
    const script = document.createElement('script');
    script.src = api.runtime.getURL('injected/captureScript.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }
  
  setupCaptureListener() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'ionblock-capture') {
        this.handleCaptureMessage(event.data);
      }
    });
  }
  
  handleCaptureMessage(message) {
    const { type, data } = message;
    if (type === 'media_detected' || type === 'stream_detected') {
      this.addMedia({
        url: data.url,
        type: data.type || data.format,
        source: type,
        filename: this.extractFilename(data.url) || 'media.mp4'
      });
    }
  }
  
  scanDOM() {
    document.querySelectorAll('video').forEach(video => {
      if (video.src && this.isValidMediaUrl(video.src)) {
        this.addMedia({
          url: video.src,
          type: 'video',
          source: 'dom',
          filename: this.extractFilename(video.src) || 'video.mp4'
        });
      }
    });
    
    if (window.location.hostname.includes('youtube.com')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        ['maxresdefault', 'hqdefault'].forEach(quality => {
          this.addMedia({
            url: `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`,
            type: 'image',
            source: 'youtube_thumbnail',
            filename: `youtube_${videoId}_${quality}.jpg`
          });
        });
      }
    }
  }
  
  addMedia(mediaInfo) {
    if (!this.detectedMedia.has(mediaInfo.url) && this.isValidMediaUrl(mediaInfo.url)) {
      this.detectedMedia.set(mediaInfo.url, { ...mediaInfo, detectedAt: Date.now() });
      document.dispatchEvent(new CustomEvent('ionblock-media-detected', { detail: mediaInfo }));
    }
  }
  
  isValidMediaUrl(url) {
    if (!url) return false;
    if (url.includes('drm') || url.includes('widevine')) return false;
    return url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:');
  }
  
  extractFilename(url) {
    try {
      const pathname = new URL(url).pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1) || null;
    } catch { return null; }
  }
  
  getAllMedia() {
    return Array.from(this.detectedMedia.values());
  }
  
  async downloadMedia(url) {
    const response = await api.runtime.sendMessage({
      action: 'download_media',
      data: {
        url: url,
        filename: this.detectedMedia.get(url)?.filename || 'download.mp4'
      }
    });
    return response;
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

