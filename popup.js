/**
 * IonBlock Popup Script
 */

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
let elements = {};
let currentTab = null;

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
    reportLink: document.getElementById('reportLink'),
    mediaList: document.getElementById('mediaList'),
    mediaCount: document.getElementById('mediaCount'),
    refreshMediaBtn: document.getElementById('refreshMediaBtn')
  };
  
  // Load current state
  await loadState();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load stats
  await loadStats();
  
  // Get current domain
  await loadCurrentDomain();
  
  // Load detected media
  await loadDetectedMedia();
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
    [currentTab] = await api.tabs.query({ active: true, currentWindow: true });
    
    if (currentTab && currentTab.url) {
      const url = new URL(currentTab.url);
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
  
  // Refresh media button
  elements.refreshMediaBtn.addEventListener('click', async () => {
    elements.refreshMediaBtn.disabled = true;
    elements.refreshMediaBtn.innerHTML = '<span>🔄 Refreshing...</span>';
    await loadDetectedMedia();
    setTimeout(() => {
      elements.refreshMediaBtn.disabled = false;
      elements.refreshMediaBtn.innerHTML = '<span>🔄 Refresh Media List</span>';
    }, 500);
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

/**
 * Load detected media from content script
 */
async function loadDetectedMedia() {
  try {
    if (!currentTab || !currentTab.id) {
      showEmptyMedia();
      return;
    }
    
    // Check if tab URL is valid for content scripts
    const url = currentTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('edge://') || url.startsWith('about:')) {
      showEmptyMedia();
      return;
    }
    
    // Send message to content script to get detected media
    const response = await api.tabs.sendMessage(currentTab.id, {
      action: 'get_detected_media'
    }).catch(err => {
      // Content script may not be injected yet on system pages
      console.warn('[IonBlock Popup] Could not reach content script:', err.message);
      return null;
    });
    
    if (response && response.success && response.media) {
      renderMediaList(response.media);
    } else {
      showEmptyMedia();
    }
  } catch (error) {
    console.error('[IonBlock Popup] Failed to load media:', error);
    showEmptyMedia();
  }
}

/**
 * Show empty media state
 */
function showEmptyMedia() {
  elements.mediaCount.textContent = '0';
  elements.mediaList.innerHTML = `
    <div class="media-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" opacity="0.3"/>
        <path d="M10 16.5L16 12L10 7.5V16.5Z" fill="currentColor"/>
      </svg>
      <p>No media detected on this page</p>
      <p class="hint">Navigate to a page with videos, audio, or images</p>
    </div>
  `;
}

/**
 * Render media list
 */
function renderMediaList(mediaArray) {
  // Filter and sort media
  const filteredMedia = mediaArray
    .filter(media => media.url && media.filename)
    .sort((a, b) => {
      // Sort by type priority: video > audio > image
      const priority = { video: 3, audio: 2, image: 1 };
      const typeA = getMediaType(a.type);
      const typeB = getMediaType(b.type);
      return (priority[typeB] || 0) - (priority[typeA] || 0);
    })
    .slice(0, 20); // Limit to 20 items
  
  if (filteredMedia.length === 0) {
    showEmptyMedia();
    return;
  }
  
  elements.mediaCount.textContent = filteredMedia.length.toString();
  
  // Render media items
  elements.mediaList.innerHTML = filteredMedia.map((media, index) => {
    const mediaType = getMediaType(media.type);
    const icon = getMediaIcon(mediaType);
    const title = getMediaTitle(media);
    const quality = getMediaQuality(media);
    
    return `
      <div class="media-item" data-index="${index}">
        <div class="media-icon">${icon}</div>
        <div class="media-info">
          <div class="media-title" title="${title}">${title}</div>
          <div class="media-meta">
            <span class="media-type">${mediaType}</span>
            ${quality ? `<span class="media-quality">${quality}</span>` : ''}
            <span class="media-source">${media.source || 'detected'}</span>
          </div>
        </div>
        <button class="media-download-btn" data-url="${encodeURIComponent(media.url)}" data-filename="${encodeURIComponent(media.filename)}" data-type="${encodeURIComponent(media.type)}">
          ⬇️ Download
        </button>
      </div>
    `;
  }).join('');
  
  // Add click listeners to download buttons
  document.querySelectorAll('.media-download-btn').forEach(btn => {
    btn.addEventListener('click', handleMediaDownload);
  });
}

/**
 * Get media type from MIME type or type string
 */
function getMediaType(type) {
  if (!type) return 'media';
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('video')) return 'video';
  if (lowerType.includes('audio')) return 'audio';
  if (lowerType.includes('image')) return 'image';
  
  return 'media';
}

/**
 * Get media icon based on type
 */
function getMediaIcon(type) {
  const icons = {
    video: '🎥',
    audio: '🎵',
    image: '🖼️',
    media: '📄'
  };
  return icons[type] || icons.media;
}

/**
 * Get media title from filename or URL
 */
function getMediaTitle(media) {
  if (media.filename) {
    // Clean up filename
    return media.filename.replace(/\.[^.]+$/, ''); // Remove extension
  }
  
  try {
    const url = new URL(media.url);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || 'Untitled Media';
  } catch {
    return 'Untitled Media';
  }
}

/**
 * Get media quality label
 */
function getMediaQuality(media) {
  if (media.qualityLabel) return media.qualityLabel;
  if (media.quality) return media.quality;
  if (media.height) return `${media.height}p`;
  return null;
}

/**
 * Handle media download button click
 */
async function handleMediaDownload(event) {
  const button = event.target.closest('.media-download-btn');
  if (!button || button.classList.contains('downloading')) return;
  
  const url = decodeURIComponent(button.dataset.url);
  const filename = decodeURIComponent(button.dataset.filename);
  const type = decodeURIComponent(button.dataset.type);
  
  // Update button state
  button.classList.add('downloading');
  button.textContent = '⏳ Downloading...';
  button.disabled = true;
  
  try {
    // Send download request to background script instead of content script
    const response = await api.runtime.sendMessage({
      action: 'download_media',
      data: { url, filename, type }
    });
    
    if (response && response.success) {
      button.classList.remove('downloading');
      button.classList.add('success');
      button.textContent = '✅ Downloaded';
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.classList.remove('success');
        button.textContent = '⬇️ Download';
        button.disabled = false;
      }, 2000);
    } else {
      throw new Error(response?.error || 'Download failed');
    }
  } catch (error) {
    console.error('[IonBlock Popup] Download error:', error);
    button.classList.remove('downloading');
    button.classList.add('error');
    button.textContent = '❌ Error';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      button.classList.remove('error');
      button.textContent = '⬇️ Download';
      button.disabled = false;
    }, 2000);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Refresh stats every 5 seconds
setInterval(loadStats, 5000);

// Refresh media list every 10 seconds
setInterval(loadDetectedMedia, 10000);

