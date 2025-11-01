/**
 * IonBlock YouTube Downloader Module
 * Enhanced YouTube video detection and downloading
 */

class YouTubeDownloader {
  constructor() {
    this.videoId = null;
    this.videoInfo = null;
    this.playerResponse = null;
    this.detectedFormats = [];
    
    this.init();
  }
  
  /**
   * Initialize YouTube downloader
   */
  async init() {
    console.log('[IonBlock YouTube] Initializing...');
    
    // Extract video ID
    this.videoId = this.getVideoId();
    
    if (this.videoId) {
      console.log('[IonBlock YouTube] Video ID:', this.videoId);
      
      // Try to extract video info from page
      await this.extractVideoInfo();
      
      // Monitor for video formats
      this.monitorVideoFormats();
    }
  }
  
  /**
   * Get YouTube video ID from URL
   */
  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }
  
  /**
   * Extract video information from YouTube's initial data
   */
  async extractVideoInfo() {
    try {
      // Method 1: Try ytInitialPlayerResponse
      if (window.ytInitialPlayerResponse) {
        this.playerResponse = window.ytInitialPlayerResponse;
        this.processPlayerResponse();
        return;
      }
      
      // Method 2: Try to find it in page scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent;
        
        // Look for ytInitialPlayerResponse
        const responseMatch = content.match(/var ytInitialPlayerResponse = ({.+?});/);
        if (responseMatch) {
          try {
            this.playerResponse = JSON.parse(responseMatch[1]);
            this.processPlayerResponse();
            return;
          } catch (e) {
            console.warn('[IonBlock YouTube] Failed to parse player response:', e);
          }
        }
      }
      
      // Method 3: Wait for it to load
      this.waitForPlayerResponse();
      
    } catch (error) {
      console.error('[IonBlock YouTube] Failed to extract video info:', error);
    }
  }
  
  /**
   * Wait for player response to be available
   */
  waitForPlayerResponse() {
    let attempts = 0;
    const maxAttempts = 20;
    
    const interval = setInterval(() => {
      attempts++;
      
      if (window.ytInitialPlayerResponse) {
        clearInterval(interval);
        this.playerResponse = window.ytInitialPlayerResponse;
        this.processPlayerResponse();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.warn('[IonBlock YouTube] Player response not found');
      }
    }, 500);
  }
  
  /**
   * Process YouTube player response to extract download formats
   */
  processPlayerResponse() {
    try {
      if (!this.playerResponse) return;
      
      // Check for DRM protection
      if (this.playerResponse.streamingData?.licenseInfos) {
        console.warn('[IonBlock YouTube] Video is DRM protected');
        this.notifyDownloadStatus('error', 'Video is DRM protected and cannot be downloaded');
        return;
      }
      
      // Extract video details
      const videoDetails = this.playerResponse.videoDetails || {};
      this.videoInfo = {
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        author: videoDetails.author,
        lengthSeconds: videoDetails.lengthSeconds,
        thumbnail: videoDetails.thumbnail?.thumbnails?.[0]?.url
      };
      
      // Extract available formats
      const streamingData = this.playerResponse.streamingData || {};
      const formats = [
        ...(streamingData.formats || []),
        ...(streamingData.adaptiveFormats || [])
      ];
      
      console.log('[IonBlock YouTube] Found', formats.length, 'formats');
      
      // Process each format
      formats.forEach(format => {
        // Skip formats without URLs
        if (!format.url && !format.signatureCipher) {
          return;
        }
        
        // Skip DRM protected
        if (format.isDrc || format.drmFamilies) {
          return;
        }
        
        const formatInfo = {
          itag: format.itag,
          url: format.url,
          mimeType: format.mimeType,
          quality: format.quality || format.qualityLabel,
          qualityLabel: format.qualityLabel,
          width: format.width,
          height: format.height,
          fps: format.fps,
          bitrate: format.bitrate,
          averageBitrate: format.averageBitrate,
          contentLength: format.contentLength,
          hasVideo: format.mimeType?.includes('video'),
          hasAudio: format.mimeType?.includes('audio')
        };
        
        this.detectedFormats.push(formatInfo);
      });
      
      if (this.detectedFormats.length > 0) {
        console.log('[IonBlock YouTube] Detected formats:', this.detectedFormats);
        this.notifyFormatsAvailable();
      } else {
        console.warn('[IonBlock YouTube] No downloadable formats found');
      }
      
    } catch (error) {
      console.error('[IonBlock YouTube] Failed to process player response:', error);
    }
  }
  
  /**
   * Monitor for video format URLs in network requests
   */
  monitorVideoFormats() {
    // This is handled by the injected captureScript.js
    // We listen for notifications
    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'ionblock-capture') {
        if (event.data.type === 'media_detected') {
          const url = event.data.data.url;
          
          // Check if this is a YouTube video URL
          if (this.isYouTubeVideoUrl(url)) {
            console.log('[IonBlock YouTube] Video URL detected:', url);
            
            // Add to detected formats if not already present
            const existing = this.detectedFormats.find(f => f.url === url);
            if (!existing) {
              this.detectedFormats.push({
                url: url,
                source: 'network_intercept',
                type: event.data.data.type
              });
              this.notifyFormatsAvailable();
            }
          }
        }
      }
    });
  }
  
  /**
   * Check if URL is a YouTube video URL
   */
  isYouTubeVideoUrl(url) {
    return url && (
      url.includes('googlevideo.com') ||
      url.includes('youtube.com/videoplayback') ||
      url.includes('ytimg.com')
    );
  }
  
  /**
   * Get best available format
   */
  getBestFormat() {
    if (this.detectedFormats.length === 0) {
      return null;
    }
    
    // Prefer formats with both video and audio
    const combined = this.detectedFormats.filter(f => f.hasVideo && f.hasAudio);
    if (combined.length > 0) {
      // Sort by quality (highest first)
      combined.sort((a, b) => {
        const qualityA = a.height || 0;
        const qualityB = b.height || 0;
        return qualityB - qualityA;
      });
      return combined[0];
    }
    
    // Otherwise, get best video-only format
    const videoOnly = this.detectedFormats.filter(f => f.hasVideo);
    if (videoOnly.length > 0) {
      videoOnly.sort((a, b) => {
        const qualityA = a.height || 0;
        const qualityB = b.height || 0;
        return qualityB - qualityA;
      });
      return videoOnly[0];
    }
    
    // Fallback to any format
    return this.detectedFormats[0];
  }
  
  /**
   * Get all available formats grouped by quality
   */
  getFormats() {
    const grouped = {
      combined: [], // Video + Audio
      videoOnly: [],
      audioOnly: []
    };
    
    this.detectedFormats.forEach(format => {
      if (format.hasVideo && format.hasAudio) {
        grouped.combined.push(format);
      } else if (format.hasVideo) {
        grouped.videoOnly.push(format);
      } else if (format.hasAudio) {
        grouped.audioOnly.push(format);
      }
    });
    
    // Sort each group by quality
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (key === 'audioOnly') {
          return (b.bitrate || 0) - (a.bitrate || 0);
        } else {
          return (b.height || 0) - (a.height || 0);
        }
      });
    });
    
    return grouped;
  }
  
  /**
   * Download best quality video
   */
  async downloadBest() {
    const format = this.getBestFormat();
    
    if (!format) {
      throw new Error('No downloadable formats available');
    }
    
    return await this.downloadFormat(format);
  }
  
  /**
   * Download specific format
   */
  async downloadFormat(format) {
    if (!format.url) {
      throw new Error('Format URL not available');
    }
    
    // Generate filename
    const filename = this.generateFilename(format);
    
    console.log('[IonBlock YouTube] Downloading:', filename);
    
    try {
      // Send download request to background
      const response = await chrome.runtime.sendMessage({
        action: 'download_media',
        data: {
          url: format.url,
          filename: filename,
          type: format.mimeType || 'video/mp4'
        }
      });
      
      return response;
    } catch (error) {
      console.error('[IonBlock YouTube] Download error:', error);
      throw error;
    }
  }
  
  /**
   * Generate filename for download
   */
  generateFilename(format) {
    let filename = '';
    
    // Use video title if available
    if (this.videoInfo?.title) {
      filename = this.sanitizeFilename(this.videoInfo.title);
    } else {
      filename = `youtube_${this.videoId}`;
    }
    
    // Add quality label if available
    if (format.qualityLabel) {
      filename += `_${format.qualityLabel}`;
    } else if (format.height) {
      filename += `_${format.height}p`;
    }
    
    // Add extension based on mime type
    const extension = this.getExtensionFromMimeType(format.mimeType);
    filename += extension;
    
    return filename;
  }
  
  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }
  
  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType) {
    if (!mimeType) return '.mp4';
    
    const mimeToExt = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mp4': '.m4a',
      'audio/webm': '.weba',
      'audio/mpeg': '.mp3'
    };
    
    for (const [mime, ext] of Object.entries(mimeToExt)) {
      if (mimeType.includes(mime)) {
        return ext;
      }
    }
    
    return '.mp4';
  }
  
  /**
   * Notify that formats are available
   */
  notifyFormatsAvailable() {
    document.dispatchEvent(new CustomEvent('ionblock-youtube-ready', {
      detail: {
        videoId: this.videoId,
        videoInfo: this.videoInfo,
        formatsCount: this.detectedFormats.length,
        bestFormat: this.getBestFormat()
      }
    }));
  }
  
  /**
   * Notify download status
   */
  notifyDownloadStatus(status, message) {
    document.dispatchEvent(new CustomEvent('ionblock-download-status', {
      detail: {
        status: status,
        message: message
      }
    }));
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTubeDownloader;
}

// Also expose globally for dynamic loading
if (typeof window !== 'undefined') {
  window.YouTubeDownloader = YouTubeDownloader;
}

