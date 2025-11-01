/**
 * Browser Compatibility Utility
 * Handles differences between Chrome, Firefox, Edge, and Tor Browser
 */

const BrowserCompat = {
  /**
   * Get the browser type
   * @returns {string} 'chrome', 'firefox', 'edge', or 'unknown'
   */
  getBrowserType() {
    if (typeof browser !== 'undefined' && browser.runtime) {
      // Firefox or Tor Browser
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('firefox')) {
        return 'firefox';
      }
      // Tor Browser is based on Firefox ESR
      if (userAgent.includes('tor')) {
        return 'tor';
      }
      return 'firefox'; // Default for browser namespace
    } else if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Chrome or Edge
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('edg/')) {
        return 'edge';
      }
      return 'chrome';
    }
    return 'unknown';
  },

  /**
   * Get the appropriate API namespace
   * @returns {object} Chrome or Browser API
   */
  getAPI() {
    return typeof browser !== 'undefined' ? browser : chrome;
  },

  /**
   * Check if declarativeNetRequest is supported
   * @returns {boolean}
   */
  supportsDeclarativeNetRequest() {
    const api = this.getAPI();
    return !!(api.declarativeNetRequest && api.declarativeNetRequest.updateEnabledRulesets);
  },

  /**
   * Check if service workers are supported
   * @returns {boolean}
   */
  supportsServiceWorkers() {
    return 'serviceWorker' in navigator;
  },

  /**
   * Get extension URL
   * @param {string} path - Relative path to resource
   * @returns {string} Full URL
   */
  getURL(path) {
    const api = this.getAPI();
    return api.runtime.getURL(path);
  },

  /**
   * Send message with compatibility handling
   * @param {object} message - Message to send
   * @returns {Promise} Response
   */
  async sendMessage(message) {
    const api = this.getAPI();
    try {
      return await api.runtime.sendMessage(message);
    } catch (error) {
      console.error('[BrowserCompat] Message error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get manifest version
   * @returns {number} Manifest version (2 or 3)
   */
  getManifestVersion() {
    const api = this.getAPI();
    return api.runtime.getManifest().manifest_version;
  },

  /**
   * Firefox-specific adjustments for DNR
   * Firefox may have different DNR support levels
   */
  async setupFirefoxDNR() {
    const browserType = this.getBrowserType();
    
    if (browserType === 'firefox' || browserType === 'tor') {
      // Check if DNR is available
      if (!this.supportsDeclarativeNetRequest()) {
        console.warn('[BrowserCompat] Firefox DNR not fully supported, using fallback');
        return false;
      }
    }
    
    return true;
  },

  /**
   * Tor Browser specific security adjustments
   */
  isTorBrowser() {
    return this.getBrowserType() === 'tor';
  },

  /**
   * Get storage quota (differs by browser)
   */
  getStorageQuota() {
    const browserType = this.getBrowserType();
    
    switch (browserType) {
      case 'chrome':
      case 'edge':
        return {
          sync: 102400, // 100KB
          local: 10485760 // 10MB
        };
      case 'firefox':
      case 'tor':
        return {
          sync: 102400,
          local: 5242880 // 5MB in Firefox
        };
      default:
        return {
          sync: 102400,
          local: 5242880
        };
    }
  },

  /**
   * Check if feature is supported
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  supportsFeature(feature) {
    const api = this.getAPI();
    
    switch (feature) {
      case 'declarativeNetRequest':
        return !!(api.declarativeNetRequest);
      case 'scripting':
        return !!(api.scripting);
      case 'downloads':
        return !!(api.downloads);
      case 'webRequest':
        return !!(api.webRequest);
      default:
        return false;
    }
  },

  /**
   * Log browser info
   */
  logInfo() {
    console.log('[BrowserCompat] Browser:', this.getBrowserType());
    console.log('[BrowserCompat] Manifest v' + this.getManifestVersion());
    console.log('[BrowserCompat] DNR Support:', this.supportsDeclarativeNetRequest());
    console.log('[BrowserCompat] Service Workers:', this.supportsServiceWorkers());
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserCompat;
}

