/**
 * IonBlock Stream Parser Module
 * Parses and processes HLS (M3U8) and DASH (MPD) streaming manifests
 */

class StreamParser {
  /**
   * Parse M3U8 (HLS) playlist
   * @param {string} manifestUrl - URL of the M3U8 manifest
   * @returns {Promise<Object>} Parsed manifest data
   */
  static async parseM3U8(manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      const text = await response.text();
      
      const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
      const lines = text.split('\n').filter(line => line.trim());
      
      const result = {
        type: 'hls',
        manifestUrl: manifestUrl,
        segments: [],
        playlists: [],
        duration: 0
      };
      
      let isPlaylist = false;
      let currentSegment = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this is a master playlist
        if (line.includes('#EXT-X-STREAM-INF')) {
          isPlaylist = true;
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.startsWith('#')) {
            const playlistUrl = this.resolveUrl(nextLine, baseUrl);
            result.playlists.push({
              url: playlistUrl,
              info: line
            });
          }
        }
        // Segment duration
        else if (line.startsWith('#EXTINF:')) {
          const duration = parseFloat(line.split(':')[1]);
          currentSegment.duration = duration;
          result.duration += duration;
        }
        // Segment URL
        else if (!line.startsWith('#') && line.length > 0) {
          const segmentUrl = this.resolveUrl(line, baseUrl);
          result.segments.push({
            url: segmentUrl,
            duration: currentSegment.duration || 0
          });
          currentSegment = {};
        }
      }
      
      // If this is a master playlist, parse the first variant
      if (isPlaylist && result.playlists.length > 0) {
        const variantData = await this.parseM3U8(result.playlists[0].url);
        result.segments = variantData.segments;
        result.duration = variantData.duration;
      }
      
      return result;
    } catch (error) {
      console.error('[IonBlock StreamParser] M3U8 parse error:', error);
      throw error;
    }
  }
  
  /**
   * Parse MPD (DASH) manifest
   * @param {string} manifestUrl - URL of the MPD manifest
   * @returns {Promise<Object>} Parsed manifest data
   */
  static async parseMPD(manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      const text = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
      
      const result = {
        type: 'dash',
        manifestUrl: manifestUrl,
        segments: [],
        duration: 0
      };
      
      // Extract media presentation duration
      const mpdElement = xmlDoc.querySelector('MPD');
      if (mpdElement) {
        const durationStr = mpdElement.getAttribute('mediaPresentationDuration');
        if (durationStr) {
          result.duration = this.parseDuration(durationStr);
        }
      }
      
      // Find video adaptation sets
      const adaptationSets = xmlDoc.querySelectorAll('AdaptationSet');
      
      for (const adaptationSet of adaptationSets) {
        const mimeType = adaptationSet.getAttribute('mimeType');
        
        // Focus on video content
        if (mimeType && mimeType.includes('video')) {
          const representations = adaptationSet.querySelectorAll('Representation');
          
          // Use the first (usually highest quality) representation
          if (representations.length > 0) {
            const repr = representations[0];
            const segmentTemplate = repr.querySelector('SegmentTemplate') || 
                                   adaptationSet.querySelector('SegmentTemplate');
            
            if (segmentTemplate) {
              const mediaTemplate = segmentTemplate.getAttribute('media');
              const initTemplate = segmentTemplate.getAttribute('initialization');
              const startNumber = parseInt(segmentTemplate.getAttribute('startNumber') || '1');
              const timescale = parseInt(segmentTemplate.getAttribute('timescale') || '1');
              
              // Get segment timeline
              const segmentTimeline = segmentTemplate.querySelector('SegmentTimeline');
              if (segmentTimeline) {
                const sElements = segmentTimeline.querySelectorAll('S');
                let segmentNumber = startNumber;
                
                for (const s of sElements) {
                  const repeat = parseInt(s.getAttribute('r') || '0');
                  const duration = parseInt(s.getAttribute('d'));
                  
                  for (let i = 0; i <= repeat; i++) {
                    const segmentUrl = this.buildSegmentUrl(
                      mediaTemplate,
                      baseUrl,
                      repr.getAttribute('id'),
                      segmentNumber
                    );
                    
                    result.segments.push({
                      url: segmentUrl,
                      duration: duration / timescale
                    });
                    
                    segmentNumber++;
                  }
                }
              }
            }
            
            break; // Use first video adaptation set
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('[IonBlock StreamParser] MPD parse error:', error);
      throw error;
    }
  }
  
  /**
   * Download all segments and merge
   * @param {Array} segments - Array of segment URLs
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Blob>} Merged blob
   */
  static async downloadAndMerge(segments, progressCallback) {
    const blobs = [];
    let downloaded = 0;
    
    for (const segment of segments) {
      try {
        const response = await fetch(segment.url);
        const blob = await response.blob();
        blobs.push(blob);
        
        downloaded++;
        if (progressCallback) {
          progressCallback(downloaded, segments.length);
        }
      } catch (error) {
        console.warn('[IonBlock StreamParser] Failed to download segment:', segment.url);
      }
    }
    
    // Merge all blobs
    return new Blob(blobs, { type: 'video/mp4' });
  }
  
  /**
   * Utility: Resolve relative URL
   */
  static resolveUrl(url, baseUrl) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      return urlObj.origin + url;
    }
    
    return baseUrl + url;
  }
  
  /**
   * Utility: Parse ISO 8601 duration
   */
  static parseDuration(durationStr) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseFloat(match[3] || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  /**
   * Utility: Build segment URL from template
   */
  static buildSegmentUrl(template, baseUrl, representationId, segmentNumber) {
    let url = template
      .replace('$RepresentationID$', representationId)
      .replace('$Number$', segmentNumber)
      .replace('$Number%04d$', segmentNumber.toString().padStart(4, '0'));
    
    return this.resolveUrl(url, baseUrl);
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StreamParser;
}

