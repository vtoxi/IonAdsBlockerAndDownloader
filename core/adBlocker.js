/**
 * IonBlock Ad Blocker Core Module
 * DOM-based ad removal with mutation observers for YouTube and general websites
 */

class AdBlocker {
  constructor() {
    this.enabled = true;
    this.observer = null;
    this.removedCount = 0;
    this.isYouTube = window.location.hostname.includes('youtube.com');
    
    // YouTube-specific selectors
    this.youtubeAdSelectors = [
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.ytp-ad-image-overlay',
      '.ytp-ad-player-overlay',
      'ytd-display-ad-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer',
      'ytd-compact-promoted-video-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-banner-promo-renderer',
      '#masthead-ad',
      '.ytd-merch-shelf-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-statement-banner-renderer',
      'ytd-ad-slot-renderer',
      '.ytd-player-legacy-desktop-watch-ads-renderer',
      '#player-ads',
      '.ytp-ad-skip-button-container',
      '.ytp-ad-button-icon'
    ];
    
    // General ad selectors
    this.generalAdSelectors = [
      '[class*="ad-"]',
      '[id*="ad-"]',
      '[class*="advertisement"]',
      '[id*="advertisement"]',
      '[class*="banner-ad"]',
      '[id*="banner-ad"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'iframe[src*="/ads/"]',
      '.adsbygoogle',
      '[data-ad-slot]',
      '[data-ad-client]'
    ];
    
    this.init();
  }
  
  /**
   * Initialize ad blocker
   */
  init() {
    console.log('[IonBlock AdBlocker] Initializing...');
    
    // Initial cleanup
    this.cleanupAds();
    
    // Set up mutation observer
    this.setupObserver();
    
    // YouTube-specific initialization
    if (this.isYouTube) {
      this.initYouTube();
    }
    
    // Report stats periodically
    setInterval(() => this.reportStats(), 10000);
  }
  
  /**
   * Clean up ads in the DOM
   */
  cleanupAds() {
    if (!this.enabled) return;
    
    const selectors = this.isYouTube 
      ? this.youtubeAdSelectors 
      : this.generalAdSelectors;
    
    let removed = 0;
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (this.shouldRemove(el)) {
            el.remove();
            removed++;
          }
        });
      } catch (error) {
        // Invalid selector, skip
      }
    });
    
    if (removed > 0) {
      this.removedCount += removed;
      console.log(`[IonBlock AdBlocker] Removed ${removed} ad elements (total: ${this.removedCount})`);
    }
  }
  
  /**
   * Check if element should be removed
   */
  shouldRemove(element) {
    // Don't remove if it contains video content
    if (element.querySelector('video[src]') && !element.closest('.video-ads')) {
      return false;
    }
    
    // Check if element is actually an ad
    const isAd = 
      element.tagName === 'IFRAME' ||
      element.hasAttribute('data-ad-slot') ||
      element.hasAttribute('data-ad-client') ||
      /\bad\b/i.test(element.className) ||
      /\bad\b/i.test(element.id);
    
    return isAd;
  }
  
  /**
   * Set up mutation observer
   */
  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      
      let needsCleanup = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          needsCleanup = true;
          break;
        }
      }
      
      if (needsCleanup) {
        // Debounced cleanup
        this.scheduleCleanup();
      }
    });
    
    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    
    console.log('[IonBlock AdBlocker] Mutation observer started');
  }
  
  /**
   * Schedule cleanup with debouncing
   */
  scheduleCleanup() {
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
    
    this.cleanupTimeout = setTimeout(() => {
      this.cleanupAds();
    }, 100);
  }
  
  /**
   * YouTube-specific initialization
   */
  initYouTube() {
    console.log('[IonBlock AdBlocker] YouTube mode enabled');
    
    // Skip ad button auto-clicker
    this.setupSkipButtonClicker();
    
    // Hide ad countdown
    this.hideAdCountdown();
    
    // Intercept ad-related API calls
    this.interceptYouTubeAds();
  }
  
  /**
   * Auto-click skip button on YouTube
   */
  setupSkipButtonClicker() {
    const checkSkipButton = () => {
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
      if (skipButton && skipButton.offsetParent !== null) {
        skipButton.click();
        console.log('[IonBlock AdBlocker] Clicked skip button');
      }
    };
    
    // Check every 500ms
    setInterval(checkSkipButton, 500);
  }
  
  /**
   * Hide ad countdown overlay
   */
  hideAdCountdown() {
    const style = document.createElement('style');
    style.textContent = `
      .ytp-ad-text-overlay,
      .ytp-ad-preview-text,
      .ytp-ad-duration-remaining,
      .ytp-ad-visit-advertiser-button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Intercept YouTube ad-related functionality
   */
  interceptYouTubeAds() {
    // Hook into YouTube's internal player
    const originalParse = JSON.parse;
    JSON.parse = function(...args) {
      const result = originalParse.apply(this, args);
      
      // Remove ad-related properties from player config
      if (result && typeof result === 'object') {
        if (result.playerAds) {
          delete result.playerAds;
        }
        if (result.adPlacements) {
          result.adPlacements = [];
        }
        if (result.adSlots) {
          result.adSlots = [];
        }
      }
      
      return result;
    };
  }
  
  /**
   * Report statistics to background script
   */
  async reportStats() {
    if (this.removedCount > 0 && typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        await chrome.runtime.sendMessage({
          action: 'ad_blocked',
          data: { count: this.removedCount }
        });
        this.removedCount = 0;
      } catch (error) {
        // Extension context invalidated or message failed
      }
    }
  }
  
  /**
   * Enable ad blocker
   */
  enable() {
    this.enabled = true;
    this.cleanupAds();
    console.log('[IonBlock AdBlocker] Enabled');
  }
  
  /**
   * Disable ad blocker
   */
  disable() {
    this.enabled = false;
    console.log('[IonBlock AdBlocker] Disabled');
  }
  
  /**
   * Destroy ad blocker
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdBlocker;
}

