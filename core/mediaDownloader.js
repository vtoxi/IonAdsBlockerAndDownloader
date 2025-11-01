/**
 * IonBlock Media Downloader Module
 * Multi-strategy media detection and download coordination
 */

class MediaDownloader {
  constructor() {
    this.detectedMedia = new Map();
    this.captureScriptInjected = false;
    this.streamParser = null;
    
    this.init();
  }
  
  /**
   * Initialize media downloader
   */
  async init() {
    console.log('[IonBlock MediaDownloader] Initializing...');
    
    // Inject capture script into page context
    await this.injectCaptureScript();
    
    // Set up message listener for capture script
    this.setupCaptureListener();
    
    // Start DOM scanning
    this.scanDOM();
    
    // Set up periodic scanning
    setInterval(() => this.scanDOM(), 5000);
  }
  
  /**
   * Strategy 1: Direct HTTP(S) URL Capture from DOM
   */
  scanDOM() {
    // Scan video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.src && this.isValidMediaUrl(video.src)) {
        this.addMedia({
          url: video.src,
          type: 'video',
          source: 'dom_video',
          element: video,
          filename: this.extractFilename(video.src) || 'video.mp4'
        });
      }
      
      // Check source elements
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src && this.isValidMediaUrl(source.src)) {
          this.addMedia({
            url: source.src,
            type: source.type || 'video',
            source: 'dom_video_source',
            filename: this.extractFilename(source.src) || 'video.mp4'
          });
        }
      });
    });
    
    // Scan audio elements
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      if (audio.src && this.isValidMediaUrl(audio.src)) {
        this.addMedia({
          url: audio.src,
          type: 'audio',
          source: 'dom_audio',
          element: audio,
          filename: this.extractFilename(audio.src) || 'audio.mp3'
        });
      }
    });
    
    // Scan image elements (high-res)
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && this.isValidMediaUrl(img.src) && this.isHighResImage(img)) {
        this.addMedia({
          url: img.src,
          type: 'image',
          source: 'dom_image',
          element: img,
          filename: this.extractFilename(img.src) || 'image.jpg'
        });
      }
    });
    
    // YouTube-specific: Extract thumbnail URLs
    if (window.location.hostname.includes('youtube.com')) {
      this.extractYouTubeThumbnails();
    }
  }
  
  /**
   * Strategy 2-6: Network interception via injected script
   * Handled by captureScript.js and received via postMessage
   */
  setupCaptureListener() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'ionblock-capture') {
        this.handleCaptureMessage(event.data);
      }
    });
  }
  
  handleCaptureMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'capture_script_ready':
        this.captureScriptInjected = true;
        console.log('[IonBlock MediaDownloader] Capture script ready');
        break;
        
      case 'media_detected':
        // Network request interception (XHR/Fetch)
        this.addMedia({
          url: data.url,
          type: data.type,
          source: `network_${data.method}`,
          filename: this.extractFilename(data.url)
        });
        break;
        
      case 'stream_detected':
        // HLS/DASH manifest detected
        this.addMedia({
          url: data.url,
          type: data.format,
          source: 'streaming',
          isStream: true,
          filename: `stream_${data.format}.mp4`
        });
        break;
        
      case 'blob_detected':
        // Blob URL detected
        this.addMedia({
          url: data.url,
          type: data.type,
          source: 'blob',
          size: data.size,
          filename: 'media_blob.mp4'
        });
        break;
        
      case 'mse_buffer_captured':
        // MediaSource buffer captured
        console.log('[IonBlock MediaDownloader] MSE buffer captured:', data.size, 'bytes');
        break;
        
      case 'canvas_captured':
        // Canvas frame captured
        if (data.dataUrl) {
          this.addMedia({
            url: data.dataUrl,
            type: 'image/png',
            source: 'canvas',
            filename: 'canvas_capture.png'
          });
        }
        break;
    }
  }
  
  /**
   * Inject capture script into page context
   */
  async injectCaptureScript() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected/captureScript.js');
      script.onload = () => {
        console.log('[IonBlock MediaDownloader] Capture script injected');
        script.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error('[IonBlock MediaDownloader] Failed to inject capture script:', error);
    }
  }
  
  /**
   * YouTube-specific thumbnail extraction
   */
  extractYouTubeThumbnails() {
    const videoId = this.getYouTubeVideoId();
    if (videoId) {
      const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];
      qualities.forEach(quality => {
        const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
        this.addMedia({
          url: url,
          type: 'image/jpeg',
          source: 'youtube_thumbnail',
          filename: `youtube_${videoId}_${quality}.jpg`
        });
      });
    }
  }
  
  getYouTubeVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }
  
  /**
   * Add media to detected list
   */
  addMedia(mediaInfo) {
    const key = mediaInfo.url;
    if (!this.detectedMedia.has(key) && this.isValidMediaUrl(key)) {
      this.detectedMedia.set(key, {
        ...mediaInfo,
        detectedAt: Date.now()
      });
      
      // Notify content script to show download button
      this.notifyMediaDetected(mediaInfo);
    }
  }
  
  /**
   * Check if URL is valid media URL
   */
  isValidMediaUrl(url) {
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
      // For blob/data URLs, additional validation needed
      if (url.startsWith('blob:')) return true;
      if (url.startsWith('data:image') || url.startsWith('data:video')) return true;
      return false;
    }
    
    // Check for DRM indicators (reject protected content)
    if (url.includes('drm') || url.includes('widevine') || url.includes('playready')) {
      console.log('[IonBlock MediaDownloader] Skipping DRM content:', url);
      return false;
    }
    
    return url.startsWith('http://') || url.startsWith('https://');
  }
  
  /**
   * Check if image is high resolution
   */
  isHighResImage(img) {
    return img.naturalWidth >= 800 || img.naturalHeight >= 600;
  }
  
  /**
   * Extract filename from URL
   */
  extractFilename(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1) || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Notify that media was detected
   */
  notifyMediaDetected(mediaInfo) {
    // Post message to content script
    document.dispatchEvent(new CustomEvent('ionblock-media-detected', {
      detail: mediaInfo
    }));
  }
  
  /**
   * Get all detected media
   */
  getAllMedia() {
    return Array.from(this.detectedMedia.values());
  }
  
  /**
   * Download media
   */
  async downloadMedia(url) {
    const mediaInfo = this.detectedMedia.get(url);
    
    if (!mediaInfo) {
      throw new Error('Media not found');
    }
    
    // Check if this is a streaming manifest
    if (mediaInfo.isStream) {
      return await this.downloadStream(mediaInfo);
    }
    
    // Direct download
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'download_media',
        data: {
          url: mediaInfo.url,
          filename: mediaInfo.filename,
          type: mediaInfo.type
        }
      });
      
      return response;
    } catch (error) {
      console.error('[IonBlock MediaDownloader] Download error:', error);
      throw error;
    }
  }
  
  /**
   * Download streaming media (HLS/DASH)
   */
  async downloadStream(mediaInfo) {
    try {
      // Parse manifest
      let manifest;
      if (mediaInfo.type === 'hls') {
        manifest = await StreamParser.parseM3U8(mediaInfo.url);
      } else if (mediaInfo.type === 'dash') {
        manifest = await StreamParser.parseMPD(mediaInfo.url);
      } else {
        throw new Error('Unknown stream format');
      }
      
      // Send segments to background for download and merge
      const response = await chrome.runtime.sendMessage({
        action: 'download_stream',
        data: {
          segments: manifest.segments,
          filename: mediaInfo.filename,
          type: 'video/mp4'
        }
      });
      
      return response;
    } catch (error) {
      console.error('[IonBlock MediaDownloader] Stream download error:', error);
      throw error;
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaDownloader;
}

