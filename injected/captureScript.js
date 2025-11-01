/**
 * IonBlock Media Capture Script (Injected into Page Context)
 * Hooks into native APIs to capture media URLs and streaming data
 * 
 * This script runs in the page context to access APIs that are isolated
 * from content scripts in Manifest V3.
 */

(function() {
  'use strict';
  
  // Captured media data
  const capturedMedia = {
    directUrls: new Set(),
    streamManifests: new Set(),
    blobUrls: new Map(),
    mseBuffers: []
  };
  
  // Utility to post message to content script
  function notifyContentScript(type, data) {
    window.postMessage({
      source: 'ionblock-capture',
      type: type,
      data: data
    }, '*');
  }
  
  /**
   * 1. XMLHttpRequest Interception
   * Capture media file requests
   */
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._ionblock_url = url;
    this._ionblock_method = method;
    return originalXHROpen.call(this, method, url, ...args);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    const url = this._ionblock_url;
    
    // Check if this is a media request
    if (url && isMediaUrl(url)) {
      this.addEventListener('load', function() {
        const contentType = this.getResponseHeader('Content-Type') || '';
        
        if (isMediaContentType(contentType) || isStreamManifest(url)) {
          capturedMedia.directUrls.add(url);
          
          notifyContentScript('media_detected', {
            url: url,
            type: contentType,
            method: 'xhr',
            responseType: this.responseType
          });
          
          // Capture stream manifests
          if (url.includes('.m3u8') || url.includes('.mpd')) {
            capturedMedia.streamManifests.add(url);
            notifyContentScript('stream_detected', {
              url: url,
              format: url.includes('.m3u8') ? 'hls' : 'dash'
            });
          }
        }
      });
    }
    
    return originalXHRSend.apply(this, args);
  };
  
  /**
   * 2. Fetch API Interception
   * Capture media requests made via fetch()
   */
  const originalFetch = window.fetch;
  
  window.fetch = async function(resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Check if this is a media response
    if (url && isMediaUrl(url)) {
      const contentType = response.headers.get('Content-Type') || '';
      
      if (isMediaContentType(contentType) || isStreamManifest(url)) {
        capturedMedia.directUrls.add(url);
        
        notifyContentScript('media_detected', {
          url: url,
          type: contentType,
          method: 'fetch'
        });
        
        // Capture stream manifests
        if (url.includes('.m3u8') || url.includes('.mpd')) {
          capturedMedia.streamManifests.add(url);
          notifyContentScript('stream_detected', {
            url: url,
            format: url.includes('.m3u8') ? 'hls' : 'dash'
          });
        }
      }
    }
    
    return response;
  };
  
  /**
   * 3. MediaSource API Interception
   * Capture buffers appended to MediaSource
   */
  if (window.MediaSource) {
    const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
    
    MediaSource.prototype.addSourceBuffer = function(mimeType) {
      const sourceBuffer = originalAddSourceBuffer.call(this, mimeType);
      
      // Hook appendBuffer
      const originalAppendBuffer = sourceBuffer.appendBuffer;
      sourceBuffer.appendBuffer = function(data) {
        // Store buffer data
        if (data && data.byteLength > 0) {
          capturedMedia.mseBuffers.push({
            mimeType: mimeType,
            data: data,
            size: data.byteLength,
            timestamp: Date.now()
          });
          
          notifyContentScript('mse_buffer_captured', {
            mimeType: mimeType,
            size: data.byteLength
          });
        }
        
        return originalAppendBuffer.call(this, data);
      };
      
      return sourceBuffer;
    };
  }
  
  /**
   * 4. Blob URL Interception
   * Track blob: URLs and their underlying data
   */
  const originalCreateObjectURL = URL.createObjectURL;
  
  URL.createObjectURL = function(blob) {
    const blobUrl = originalCreateObjectURL.call(this, blob);
    
    // Store blob mapping
    if (blob && blob.size > 0) {
      capturedMedia.blobUrls.set(blobUrl, {
        blob: blob,
        type: blob.type,
        size: blob.size
      });
      
      notifyContentScript('blob_detected', {
        url: blobUrl,
        type: blob.type,
        size: blob.size
      });
    }
    
    return blobUrl;
  };
  
  /**
   * 5. Canvas Frame Extraction
   * Monitor canvas.toDataURL and toBlob calls
   */
  if (window.HTMLCanvasElement) {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      const dataUrl = originalToDataURL.apply(this, args);
      
      notifyContentScript('canvas_captured', {
        dataUrl: dataUrl,
        width: this.width,
        height: this.height,
        method: 'toDataURL'
      });
      
      return dataUrl;
    };
    
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      return originalToBlob.call(this, function(blob) {
        if (blob) {
          notifyContentScript('canvas_captured', {
            blob: blob,
            type: blob.type,
            size: blob.size,
            method: 'toBlob'
          });
        }
        callback(blob);
      }, ...args);
    };
  }
  
  /**
   * Utility Functions
   */
  function isMediaUrl(url) {
    if (!url) return false;
    
    const mediaExtensions = [
      '.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv',
      '.mp3', '.wav', '.ogg', '.m4a', '.aac',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
      '.m3u8', '.mpd', '.ts', '.m4s'
    ];
    
    const lowerUrl = url.toLowerCase();
    return mediaExtensions.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.includes('/video') ||
           lowerUrl.includes('/audio') ||
           lowerUrl.includes('/image');
  }
  
  function isMediaContentType(contentType) {
    if (!contentType) return false;
    
    const mediaTypes = ['video/', 'audio/', 'image/', 'application/vnd.apple.mpegurl', 'application/dash+xml'];
    return mediaTypes.some(type => contentType.includes(type));
  }
  
  function isStreamManifest(url) {
    return url.includes('.m3u8') || url.includes('.mpd');
  }
  
  /**
   * Export captured data via custom event (for content script access)
   */
  window.addEventListener('ionblock-get-captured-data', () => {
    notifyContentScript('captured_data', {
      directUrls: Array.from(capturedMedia.directUrls),
      streamManifests: Array.from(capturedMedia.streamManifests),
      blobUrls: Array.from(capturedMedia.blobUrls.keys()),
      mseBufferCount: capturedMedia.mseBuffers.length
    });
  });
  
  // Notify that capture script is ready
  notifyContentScript('capture_script_ready', {
    timestamp: Date.now()
  });
  
  console.log('[IonBlock Capture] API hooks installed successfully');
})();

