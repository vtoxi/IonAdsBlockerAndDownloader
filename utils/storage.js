/**
 * Storage Utility Module
 * Wrapper for chrome.storage API with fallback to browser.storage for Firefox/Tor
 */

const StorageUtil = {
  /**
   * Get browser storage API (chrome or browser namespace)
   */
  getAPI() {
    return typeof browser !== 'undefined' ? browser : chrome;
  },

  /**
   * Get value from sync storage
   * @param {string|string[]|object} keys - Key(s) to retrieve
   * @returns {Promise<object>} Retrieved values
   */
  async getSync(keys) {
    try {
      const api = this.getAPI();
      return await api.storage.sync.get(keys);
    } catch (error) {
      console.error('[IonBlock] Storage getSync error:', error);
      return {};
    }
  },

  /**
   * Set value in sync storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async setSync(items) {
    try {
      const api = this.getAPI();
      await api.storage.sync.set(items);
    } catch (error) {
      console.error('[IonBlock] Storage setSync error:', error);
    }
  },

  /**
   * Get value from local storage
   * @param {string|string[]|object} keys - Key(s) to retrieve
   * @returns {Promise<object>} Retrieved values
   */
  async getLocal(keys) {
    try {
      const api = this.getAPI();
      return await api.storage.local.get(keys);
    } catch (error) {
      console.error('[IonBlock] Storage getLocal error:', error);
      return {};
    }
  },

  /**
   * Set value in local storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async setLocal(items) {
    try {
      const api = this.getAPI();
      await api.storage.local.set(items);
    } catch (error) {
      console.error('[IonBlock] Storage setLocal error:', error);
    }
  },

  /**
   * Remove items from sync storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async removeSync(keys) {
    try {
      const api = this.getAPI();
      await api.storage.sync.remove(keys);
    } catch (error) {
      console.error('[IonBlock] Storage removeSync error:', error);
    }
  },

  /**
   * Remove items from local storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async removeLocal(keys) {
    try {
      const api = this.getAPI();
      await api.storage.local.remove(keys);
    } catch (error) {
      console.error('[IonBlock] Storage removeLocal error:', error);
    }
  },

  /**
   * Clear all sync storage
   * @returns {Promise<void>}
   */
  async clearSync() {
    try {
      const api = this.getAPI();
      await api.storage.sync.clear();
    } catch (error) {
      console.error('[IonBlock] Storage clearSync error:', error);
    }
  },

  /**
   * Clear all local storage
   * @returns {Promise<void>}
   */
  async clearLocal() {
    try {
      const api = this.getAPI();
      await api.storage.local.clear();
    } catch (error) {
      console.error('[IonBlock] Storage clearLocal error:', error);
    }
  },

  /**
   * Get extension settings with defaults
   * @returns {Promise<object>} Settings object
   */
  async getSettings() {
    const defaults = {
      enabled: true,
      adBlockEnabled: true,
      downloaderEnabled: true,
      whitelist: [],
      stats: {
        adsBlocked: 0,
        mediaDownloaded: 0
      }
    };

    const stored = await this.getSync(['enabled', 'adBlockEnabled', 'downloaderEnabled', 'whitelist', 'stats']);
    return { ...defaults, ...stored };
  },

  /**
   * Update extension settings
   * @param {object} settings - Settings to update
   * @returns {Promise<void>}
   */
  async updateSettings(settings) {
    await this.setSync(settings);
  },

  /**
   * Check if current domain is whitelisted
   * @param {string} domain - Domain to check
   * @returns {Promise<boolean>}
   */
  async isWhitelisted(domain) {
    const { whitelist = [] } = await this.getSync('whitelist');
    return whitelist.includes(domain);
  },

  /**
   * Add domain to whitelist
   * @param {string} domain - Domain to add
   * @returns {Promise<void>}
   */
  async addToWhitelist(domain) {
    const { whitelist = [] } = await this.getSync('whitelist');
    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      await this.setSync({ whitelist });
    }
  },

  /**
   * Remove domain from whitelist
   * @param {string} domain - Domain to remove
   * @returns {Promise<void>}
   */
  async removeFromWhitelist(domain) {
    const { whitelist = [] } = await this.getSync('whitelist');
    const updated = whitelist.filter(d => d !== domain);
    await this.setSync({ whitelist: updated });
  },

  /**
   * Increment ad block counter
   * @param {number} count - Number to increment by (default 1)
   * @returns {Promise<void>}
   */
  async incrementAdsBlocked(count = 1) {
    const { stats = { adsBlocked: 0, mediaDownloaded: 0 } } = await this.getSync('stats');
    stats.adsBlocked = (stats.adsBlocked || 0) + count;
    await this.setSync({ stats });
  },

  /**
   * Increment media download counter
   * @param {number} count - Number to increment by (default 1)
   * @returns {Promise<void>}
   */
  async incrementMediaDownloaded(count = 1) {
    const { stats = { adsBlocked: 0, mediaDownloaded: 0 } } = await this.getSync('stats');
    stats.mediaDownloaded = (stats.mediaDownloaded || 0) + count;
    await this.setSync({ stats });
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUtil;
}

