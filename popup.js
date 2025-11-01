/**
 * IonBlock Popup Script
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
let elements = {};

/**
 * Initialize popup
 */
async function init() {
  // Get DOM elements
  elements = {
    mainToggle: document.getElementById('mainToggle'),
    adBlockerToggle: document.getElementById('adBlockerToggle'),
    downloaderToggle: document.getElementById('downloaderToggle'),
    whitelistBtn: document.getElementById('whitelistBtn'),
    whitelistText: document.getElementById('whitelistText'),
    currentDomain: document.getElementById('currentDomain'),
    adsBlocked: document.getElementById('adsBlocked'),
    mediaDownloaded: document.getElementById('mediaDownloaded'),
    privacyLink: document.getElementById('privacyLink'),
    helpLink: document.getElementById('helpLink'),
    reportLink: document.getElementById('reportLink')
  };
  
  // Load current state
  await loadState();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load stats
  await loadStats();
  
  // Get current domain
  await loadCurrentDomain();
}

/**
 * Load current state from storage
 */
async function loadState() {
  try {
    const response = await api.runtime.sendMessage({
      action: 'get_settings'
    });
    
    if (response.success && response.settings) {
      const { enabled, adBlockEnabled, downloaderEnabled } = response.settings;
      
      elements.mainToggle.checked = enabled;
      elements.adBlockerToggle.checked = adBlockEnabled;
      elements.downloaderToggle.checked = downloaderEnabled;
    }
  } catch (error) {
    console.error('[IonBlock Popup] Failed to load state:', error);
  }
}

/**
 * Load statistics
 */
async function loadStats() {
  try {
    const response = await api.runtime.sendMessage({
      action: 'get_ad_stats'
    });
    
    if (response.success && response.stats) {
      elements.adsBlocked.textContent = formatNumber(response.stats.adsBlocked || 0);
      elements.mediaDownloaded.textContent = formatNumber(response.stats.mediaDownloaded || 0);
    }
  } catch (error) {
    console.error('[IonBlock Popup] Failed to load stats:', error);
  }
}

/**
 * Load current domain and whitelist status
 */
async function loadCurrentDomain() {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      elements.currentDomain.textContent = domain;
      
      // Check if whitelisted
      const whitelistResponse = await api.runtime.sendMessage({
        action: 'get_whitelist'
      });
      
      if (whitelistResponse.success) {
        const isWhitelisted = whitelistResponse.whitelist.includes(domain);
        updateWhitelistButton(isWhitelisted);
      }
    }
  } catch (error) {
    elements.currentDomain.textContent = 'Unknown';
  }
}

/**
 * Update whitelist button
 */
function updateWhitelistButton(isWhitelisted) {
  if (isWhitelisted) {
    elements.whitelistBtn.classList.add('btn-danger');
    elements.whitelistBtn.classList.remove('btn-secondary');
    elements.whitelistText.textContent = 'Remove from Whitelist';
  } else {
    elements.whitelistBtn.classList.add('btn-secondary');
    elements.whitelistBtn.classList.remove('btn-danger');
    elements.whitelistText.textContent = 'Add to Whitelist';
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Main toggle
  elements.mainToggle.addEventListener('change', async () => {
    const enabled = elements.mainToggle.checked;
    await updateSetting('enabled', enabled);
    
    // Update dependent toggles
    elements.adBlockerToggle.disabled = !enabled;
    elements.downloaderToggle.disabled = !enabled;
  });
  
  // Ad blocker toggle
  elements.adBlockerToggle.addEventListener('change', async () => {
    const enabled = elements.adBlockerToggle.checked;
    await updateSetting('adBlockEnabled', enabled);
  });
  
  // Downloader toggle
  elements.downloaderToggle.addEventListener('change', async () => {
    const enabled = elements.downloaderToggle.checked;
    await updateSetting('downloaderEnabled', enabled);
  });
  
  // Whitelist button
  elements.whitelistBtn.addEventListener('click', async () => {
    const domain = elements.currentDomain.textContent;
    if (domain === 'Unknown' || domain === 'Loading...') return;
    
    const isCurrentlyWhitelisted = elements.whitelistBtn.classList.contains('btn-danger');
    
    if (isCurrentlyWhitelisted) {
      // Remove from whitelist
      await api.runtime.sendMessage({
        action: 'remove_from_whitelist',
        data: { domain }
      });
      updateWhitelistButton(false);
    } else {
      // Add to whitelist
      await api.runtime.sendMessage({
        action: 'add_to_whitelist',
        data: { domain }
      });
      updateWhitelistButton(true);
    }
    
    // Reload the tab to apply changes
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      api.tabs.reload(tab.id);
    }
  });
  
  // Footer links
  elements.privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    api.tabs.create({ url: 'https://github.com/ionblock/extension/blob/main/PRIVACY_POLICY.md' });
  });
  
  elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    api.tabs.create({ url: 'https://github.com/ionblock/extension#readme' });
  });
  
  elements.reportLink.addEventListener('click', (e) => {
    e.preventDefault();
    api.tabs.create({ url: 'https://github.com/ionblock/extension/issues' });
  });
}

/**
 * Update setting
 */
async function updateSetting(key, value) {
  try {
    const update = {};
    update[key] = value;
    
    await api.runtime.sendMessage({
      action: 'update_settings',
      data: update
    });
  } catch (error) {
    console.error('[IonBlock Popup] Failed to update setting:', error);
  }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Refresh stats every 5 seconds
setInterval(loadStats, 5000);

