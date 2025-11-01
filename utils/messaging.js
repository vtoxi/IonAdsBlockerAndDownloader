/**
 * Messaging Utility Module
 * Central message bus for communication between content scripts, background, and popup
 */

const MessagingUtil = {
  /**
   * Get browser runtime API (chrome or browser namespace)
   */
  getAPI() {
    return typeof browser !== 'undefined' ? browser : chrome;
  },

  /**
   * Send message to background script
   * @param {string} action - Action type
   * @param {object} data - Message payload
   * @returns {Promise<any>} Response from background
   */
  async sendToBackground(action, data = {}) {
    try {
      const api = this.getAPI();
      const response = await api.runtime.sendMessage({ action, data });
      return response;
    } catch (error) {
      console.error('[IonBlock] Send to background error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send message to content script in specific tab
   * @param {number} tabId - Target tab ID
   * @param {string} action - Action type
   * @param {object} data - Message payload
   * @returns {Promise<any>} Response from content script
   */
  async sendToTab(tabId, action, data = {}) {
    try {
      const api = this.getAPI();
      const response = await api.tabs.sendMessage(tabId, { action, data });
      return response;
    } catch (error) {
      console.error('[IonBlock] Send to tab error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send message to active tab
   * @param {string} action - Action type
   * @param {object} data - Message payload
   * @returns {Promise<any>} Response from content script
   */
  async sendToActiveTab(action, data = {}) {
    try {
      const api = this.getAPI();
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        return await this.sendToTab(tab.id, action, data);
      }
      return { success: false, error: 'No active tab' };
    } catch (error) {
      console.error('[IonBlock] Send to active tab error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listen for messages
   * @param {function} handler - Message handler function
   */
  addListener(handler) {
    const api = this.getAPI();
    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Validate message structure
      if (!message || typeof message.action !== 'string') {
        return false;
      }

      // Handle message asynchronously
      (async () => {
        try {
          const result = await handler(message, sender);
          sendResponse(result || { success: true });
        } catch (error) {
          console.error('[IonBlock] Message handler error:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();

      // Return true to indicate async response
      return true;
    });
  },

  /**
   * Create message handler router
   * @param {object} handlers - Map of action -> handler function
   * @returns {function} Message handler function
   */
  createRouter(handlers) {
    return async (message, sender) => {
      const { action, data } = message;
      
      if (handlers[action]) {
        return await handlers[action](data, sender);
      }
      
      console.warn('[IonBlock] Unknown action:', action);
      return { success: false, error: 'Unknown action' };
    };
  }
};

// Message action constants
const MessageActions = {
  // Ad Blocker actions
  AD_BLOCKED: 'ad_blocked',
  GET_AD_STATS: 'get_ad_stats',
  TOGGLE_AD_BLOCKER: 'toggle_ad_blocker',
  
  // Media Downloader actions
  DETECT_MEDIA: 'detect_media',
  DOWNLOAD_MEDIA: 'download_media',
  DOWNLOAD_PROGRESS: 'download_progress',
  DOWNLOAD_COMPLETE: 'download_complete',
  
  // Settings actions
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTINGS: 'update_settings',
  GET_WHITELIST: 'get_whitelist',
  ADD_TO_WHITELIST: 'add_to_whitelist',
  REMOVE_FROM_WHITELIST: 'remove_from_whitelist',
  
  // UI actions
  SHOW_DOWNLOAD_BUTTON: 'show_download_button',
  HIDE_DOWNLOAD_BUTTON: 'hide_download_button',
  UPDATE_POPUP: 'update_popup',
  
  // Capture script actions
  MEDIA_DETECTED: 'media_detected',
  STREAM_DETECTED: 'stream_detected',
  BLOB_DETECTED: 'blob_detected'
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MessagingUtil, MessageActions };
}

