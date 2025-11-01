/**
 * IonBlock Background Service Worker
 * Handles downloads, settings management, and coordinates extension features
 */

// Import utilities (note: imports work in service workers with type: "module")
importScripts('utils/storage.js', 'utils/messaging.js');

// Browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Active download sessions
const activeDownloads = new Map();

/**
 * Initialize extension on install/update
 */
api.runtime.onInstalled.addListener(async (details) => {
  console.log('[IonBlock] Extension installed/updated:', details.reason);
  
  // Initialize default settings
  const settings = await StorageUtil.getSettings();
  await StorageUtil.updateSettings(settings);
  
  // Register declarativeNetRequest rules
  try {
    await api.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['ad_rules']
    });
    console.log('[IonBlock] Ad-blocking rules registered');
  } catch (error) {
    console.error('[IonBlock] Failed to register DNR rules:', error);
  }
  
  // Show welcome page on first install
  if (details.reason === 'install') {
    // Could open a welcome page here if needed
    console.log('[IonBlock] First time installation - welcome!');
  }
});

/**
 * Handle download requests
 */
async function handleDownload(data, sender) {
  const { url, filename, type } = data;
  
  if (!url) {
    return { success: false, error: 'No URL provided' };
  }
  
  // Check if downloader is enabled
  const settings = await StorageUtil.getSettings();
  if (!settings.downloaderEnabled) {
    return { success: false, error: 'Downloader is disabled' };
  }
  
  try {
    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename || extractFilenameFromUrl(url));
    
    // Initiate download
    const downloadId = await api.downloads.download({
      url: url,
      filename: sanitizedFilename,
      saveAs: true,
      conflictAction: 'uniquify'
    });
    
    // Track download
    activeDownloads.set(downloadId, {
      url,
      filename: sanitizedFilename,
      type,
      tabId: sender.tab?.id,
      startTime: Date.now()
    });
    
    // Increment stats
    await StorageUtil.incrementMediaDownloaded();
    
    console.log('[IonBlock] Download started:', downloadId, sanitizedFilename);
    
    return { 
      success: true, 
      downloadId,
      filename: sanitizedFilename 
    };
  } catch (error) {
    console.error('[IonBlock] Download error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle streaming media downloads (HLS/DASH)
 */
async function handleStreamDownload(data, sender) {
  const { segments, filename, type } = data;
  
  if (!segments || segments.length === 0) {
    return { success: false, error: 'No segments provided' };
  }
  
  try {
    // Download all segments
    const segmentBlobs = [];
    for (const segmentUrl of segments) {
      const response = await fetch(segmentUrl);
      const blob = await response.blob();
      segmentBlobs.push(blob);
    }
    
    // Merge segments
    const mergedBlob = new Blob(segmentBlobs, { type: type || 'video/mp4' });
    
    // Create object URL
    const blobUrl = URL.createObjectURL(mergedBlob);
    
    // Download merged file
    const sanitizedFilename = sanitizeFilename(filename || 'video.mp4');
    const downloadId = await api.downloads.download({
      url: blobUrl,
      filename: sanitizedFilename,
      saveAs: true
    });
    
    // Clean up blob URL after download starts
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    
    await StorageUtil.incrementMediaDownloaded();
    
    console.log('[IonBlock] Stream download started:', downloadId);
    
    return { success: true, downloadId, filename: sanitizedFilename };
  } catch (error) {
    console.error('[IonBlock] Stream download error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle settings updates
 */
async function handleUpdateSettings(data) {
  try {
    await StorageUtil.updateSettings(data);
    
    // If ad blocker was toggled, update DNR rules
    if ('adBlockEnabled' in data) {
      const rulesetIds = ['ad_rules'];
      if (data.adBlockEnabled) {
        await api.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: rulesetIds
        });
      } else {
        await api.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: rulesetIds
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[IonBlock] Update settings error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle whitelist operations
 */
async function handleWhitelistAdd(data) {
  const { domain } = data;
  if (!domain) {
    return { success: false, error: 'No domain provided' };
  }
  
  try {
    await StorageUtil.addToWhitelist(domain);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleWhitelistRemove(data) {
  const { domain } = data;
  if (!domain) {
    return { success: false, error: 'No domain provided' };
  }
  
  try {
    await StorageUtil.removeFromWhitelist(domain);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Message router
 */
const messageHandlers = {
  [MessageActions.DOWNLOAD_MEDIA]: handleDownload,
  [MessageActions.DOWNLOAD_STREAM]: handleStreamDownload,
  [MessageActions.GET_SETTINGS]: async () => {
    const settings = await StorageUtil.getSettings();
    return { success: true, settings };
  },
  [MessageActions.UPDATE_SETTINGS]: handleUpdateSettings,
  [MessageActions.ADD_TO_WHITELIST]: handleWhitelistAdd,
  [MessageActions.REMOVE_FROM_WHITELIST]: handleWhitelistRemove,
  [MessageActions.GET_WHITELIST]: async () => {
    const { whitelist = [] } = await StorageUtil.getSync('whitelist');
    return { success: true, whitelist };
  },
  [MessageActions.GET_AD_STATS]: async () => {
    const { stats = { adsBlocked: 0, mediaDownloaded: 0 } } = await StorageUtil.getSync('stats');
    return { success: true, stats };
  },
  [MessageActions.AD_BLOCKED]: async (data) => {
    await StorageUtil.incrementAdsBlocked(data.count || 1);
    return { success: true };
  }
};

// Set up message listener
MessagingUtil.addListener(MessagingUtil.createRouter(messageHandlers));

/**
 * Monitor download progress
 */
api.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    const downloadInfo = activeDownloads.get(delta.id);
    if (downloadInfo) {
      console.log('[IonBlock] Download completed:', downloadInfo.filename);
      activeDownloads.delete(delta.id);
      
      // Notify content script
      if (downloadInfo.tabId) {
        MessagingUtil.sendToTab(downloadInfo.tabId, MessageActions.DOWNLOAD_COMPLETE, {
          filename: downloadInfo.filename
        }).catch(() => {});
      }
    }
  }
  
  if (delta.error) {
    console.error('[IonBlock] Download error:', delta.error);
  }
});

/**
 * Utility functions
 */
function sanitizeFilename(filename) {
  // Remove invalid characters
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  
  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 200 - ext.length - 1) + '.' + ext;
  }
  
  return sanitized;
}

function extractFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'download';
    
    // Add extension if missing
    if (!filename.includes('.')) {
      return filename + '.mp4';
    }
    
    return filename;
  } catch {
    return 'download.mp4';
  }
}

// Add DOWNLOAD_STREAM action to MessageActions
MessageActions.DOWNLOAD_STREAM = 'download_stream';

console.log('[IonBlock] Background service worker initialized');

