/**
 * IonBlock Enhanced YouTube Ad Blocker
 * Uses multiple aggressive techniques to block all YouTube ads
 */

class EnhancedYouTubeAdBlocker {
  constructor() {
    this.enabled = true;
    this.observer = null;
    this.videoCheckInterval = null;
    this.adsBlocked = 0;
    
    // Comprehensive YouTube ad selectors (updated 2025)
    this.adSelectors = [
      // Video player ads
      '.video-ads', '.ytp-ad-module', '.ytp-ad-player-overlay',
      '.ytp-ad-overlay-container', '.ytp-ad-text-overlay', 
      '.ytp-ad-image-overlay', '.ytp-ad-overlay-close-button',
      '.ytp-ad-skip-button-modern', '.ytp-ad-button',
      
      // Sidebar ads
      'ytd-display-ad-renderer', 'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer', 'ytd-compact-promoted-video-renderer',
      
      // Feed ads
      'ytd-in-feed-ad-layout-renderer', 'ytd-statement-banner-renderer',
      'ytd-banner-promo-renderer', 'ytd-video-masthead-ad-v3-renderer',
      
      // Companion ads
      'ytd-action-companion-ad-renderer', 'ytd-ad-slot-renderer',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
      
      // Player ads
      '#player-ads', '#masthead-ad', '.ad-container', '.ad-showing',
      
      // New YouTube ad formats
      'ytd-rich-item-renderer.ytd-rich-grid-row-renderer[is-ad]',
      'ytd-ad-slot-renderer', '.ytd-merch-shelf-renderer',
      'ytd-player-legacy-desktop-watch-ads-renderer'
    ];
    
    this.init();
  }
  
  init() {
    console.log('[IonBlock] Enhanced YouTube Ad Blocker initialized');
    
    // Immediate cleanup
    this.removeAds();
    
    // Setup continuous monitoring
    this.setupMutationObserver();
    
    // Monitor video element for ad playback
    this.monitorVideoElement();
    
    // Setup ad skip automation
    this.setupAdSkipper();
    
    // Inject aggressive CSS to hide ads
    this.injectAdBlockCSS();
    
    // Monitor for ad insertion
    this.setupAdBlockerLoop();
    
    // Hook into YouTube's player
    this.hookYouTubePlayer();
  }
  
  /**
   * Remove all ad elements from DOM
   */
  removeAds() {
    if (!this.enabled) return;
    
    let removed = 0;
    
    this.adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Double check it's an ad before removing
          if (this.isAdElement(el)) {
            el.remove();
            removed++;
          }
        });
      } catch (error) {
        // Silently handle selector errors
      }
    });
    
    // Remove ad containers by attribute
    document.querySelectorAll('[class*="ad-"]').forEach(el => {
      if (this.isAdElement(el)) {
        el.remove();
        removed++;
      }
    });
    
    if (removed > 0) {
      this.adsBlocked += removed;
      console.log(`[IonBlock] Removed ${removed} ads (total: ${this.adsBlocked})`);
    }
  }
  
  /**
   * Check if element is actually an ad
   */
  isAdElement(element) {
    // Don't remove if it contains the main video
    if (element.querySelector('video.html5-main-video')) {
      return false;
    }
    
    // Check for ad indicators
    const className = element.className || '';
    const id = element.id || '';
    
    // Is explicitly marked as ad
    if (element.hasAttribute('is-ad')) return true;
    if (element.hasAttribute('ad-id')) return true;
    if (className.includes('ad-showing')) return true;
    
    // Contains ad-related classes
    if (/\bad\b|\bads\b|promoted|sponsored/i.test(className)) {
      return true;
    }
    
    // Is an ad iframe
    if (element.tagName === 'IFRAME') {
      const src = element.src || '';
      if (src.includes('doubleclick') || src.includes('googlesyndication')) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Setup mutation observer for dynamic ad insertion
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      
      // Quick check for new ad elements
      let hasAds = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              // Check if the node or its children contain ads
              if (this.isAdElement(node)) {
                hasAds = true;
                break;
              }
              
              // Check children
              if (node.querySelectorAll) {
                const adNodes = this.adSelectors.some(selector => {
                  try {
                    return node.querySelector(selector);
                  } catch {
                    return false;
                  }
                });
                if (adNodes) {
                  hasAds = true;
                  break;
                }
              }
            }
          }
        }
        if (hasAds) break;
      }
      
      if (hasAds) {
        this.scheduleAdRemoval();
      }
    });
    
    // Start observing
    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Schedule ad removal (debounced)
   */
  scheduleAdRemoval() {
    if (this.removalTimeout) clearTimeout(this.removalTimeout);
    this.removalTimeout = setTimeout(() => this.removeAds(), 50);
  }
  
  /**
   * Monitor video element for ad playback
   */
  monitorVideoElement() {
    this.videoCheckInterval = setInterval(() => {
      if (!this.enabled) return;
      
      const video = document.querySelector('video.html5-main-video');
      if (!video) return;
      
      const player = document.querySelector('.html5-video-player');
      if (!player) return;
      
      // Check if ad is playing
      const isAdPlaying = player.classList.contains('ad-showing') ||
                         player.classList.contains('ad-interrupting') ||
                         document.querySelector('.ytp-ad-player-overlay');
      
      if (isAdPlaying) {
        // Skip ad by seeking to end
        if (video.duration && video.duration > 0) {
          video.currentTime = video.duration;
        }
        
        // Click skip button if available
        const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
        if (skipButton) {
          skipButton.click();
        }
        
        // Remove ad overlay
        const adOverlay = document.querySelector('.ytp-ad-player-overlay-layout');
        if (adOverlay) {
          adOverlay.remove();
        }
        
        console.log('[IonBlock] Skipped video ad');
      }
    }, 250);
  }
  
  /**
   * Setup aggressive ad skipper
   */
  setupAdSkipper() {
    setInterval(() => {
      if (!this.enabled) return;
      
      // Auto-click skip buttons
      const skipButtons = document.querySelectorAll(
        '.ytp-ad-skip-button, .ytp-skip-ad-button, ' +
        '.ytp-ad-skip-button-modern, .videoAdUiSkipButton'
      );
      
      skipButtons.forEach(btn => {
        if (btn.offsetParent !== null) {
          btn.click();
        }
      });
      
      // Close ad overlays
      const closeButtons = document.querySelectorAll(
        '.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-container'
      );
      
      closeButtons.forEach(btn => {
        if (btn.offsetParent !== null) {
          btn.click();
        }
      });
    }, 500);
  }
  
  /**
   * Inject CSS to hide ads
   */
  injectAdBlockCSS() {
    const style = document.createElement('style');
    style.id = 'ionblock-adblock-css';
    style.textContent = `
      /* Hide all YouTube ad elements */
      ${this.adSelectors.join(', ')} {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        pointer-events: none !important;
      }
      
      /* Hide ad containers */
      [class*="ad-"], [id*="ad-"] {
        display: none !important;
      }
      
      /* Keep video player visible */
      video.html5-main-video, .html5-video-container {
        display: block !important;
        visibility: visible !important;
      }
      
      /* Hide ad showing indicator */
      .ad-showing .ytp-ad-player-overlay,
      .ad-showing .ytp-ad-text-overlay,
      .ad-showing .ytp-ad-image-overlay {
        display: none !important;
      }
      
      /* Hide promoted content */
      [is-ad], [ad-id], ytd-promoted-sparkles-web-renderer,
      ytd-in-feed-ad-layout-renderer {
        display: none !important;
      }
    `;
    
    (document.head || document.documentElement).appendChild(style);
  }
  
  /**
   * Setup continuous ad blocking loop
   */
  setupAdBlockerLoop() {
    setInterval(() => {
      if (!this.enabled) return;
      this.removeAds();
    }, 1000);
  }
  
  /**
   * Hook into YouTube player to detect ad playback
   */
  hookYouTubePlayer() {
    // Wait for YouTube player to load
    const checkPlayer = setInterval(() => {
      const player = document.querySelector('.html5-video-player');
      if (player) {
        clearInterval(checkPlayer);
        
        // Monitor player state changes
        const observer = new MutationObserver(() => {
          if (player.classList.contains('ad-showing')) {
            // Remove ad-showing class
            player.classList.remove('ad-showing');
            player.classList.remove('ad-interrupting');
            
            // Remove ad elements
            this.removeAds();
          }
        });
        
        observer.observe(player, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    }, 500);
    
    // Clear check after 10 seconds
    setTimeout(() => clearInterval(checkPlayer), 10000);
  }
  
  /**
   * Enable ad blocker
   */
  enable() {
    this.enabled = true;
    this.removeAds();
    console.log('[IonBlock] YouTube Ad Blocker enabled');
  }
  
  /**
   * Disable ad blocker
   */
  disable() {
    this.enabled = false;
    console.log('[IonBlock] YouTube Ad Blocker disabled');
  }
  
  /**
   * Report blocked ads count
   */
  async reportStats() {
    if (this.adsBlocked > 0) {
      try {
        await chrome.runtime.sendMessage({
          action: 'ad_blocked',
          data: { count: this.adsBlocked }
        });
      } catch (error) {
        // Silent fail
      }
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedYouTubeAdBlocker;
}

