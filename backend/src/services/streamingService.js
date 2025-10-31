const path = require('path');
const fs = require('fs').promises;
const Content = require('../models/Content');
const TranscodeJob = require('../models/TranscodeJob');

/**
 * Streaming Service
 * 
 * Handles video streaming with HLS/DASH manifest generation,
 * adaptive bitrate logic, CDN integration, and player optimization.
 */

class StreamingService {
  /**
   * Get HLS streaming manifest
   */
  static async getHLSManifest(contentId, options = {}) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      // Get transcode job to find HLS outputs
      const transcodeJob = await TranscodeJob.findOne({ content: contentId, status: 'completed' });
      if (!transcodeJob || !transcodeJob.outputs.hls) {
        throw new Error('HLS stream not available');
      }
      
      const hlsPath = transcodeJob.outputs.hls.path;
      
      // Generate master playlist
      const manifest = await this.generateHLSMasterPlaylist(hlsPath, transcodeJob.outputs.hls.variants);
      
      return {
        type: 'hls',
        manifestUrl: `/api/player/hls/${contentId}/master.m3u8`,
        manifest,
        variants: transcodeJob.outputs.hls.variants,
        duration: content.duration
      };
      
    } catch (error) {
      console.error('Error getting HLS manifest:', error);
      throw error;
    }
  }
  
  /**
   * Generate HLS master playlist
   */
  static async generateHLSMasterPlaylist(basePath, variants) {
    let manifest = '#EXTM3U\n';
    manifest += '#EXT-X-VERSION:3\n\n';
    
    // Sort variants by bitrate
    const sortedVariants = variants.sort((a, b) => a.bitrate - b.bitrate);
    
    for (const variant of sortedVariants) {
      manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate},RESOLUTION=${variant.resolution},CODECS="${variant.codecs || 'avc1.42E01E,mp4a.40.2'}"\n`;
      manifest += `${variant.quality}/playlist.m3u8\n`;
    }
    
    return manifest;
  }
  
  /**
   * Get DASH streaming manifest
   */
  static async getDASHManifest(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      const transcodeJob = await TranscodeJob.findOne({ content: contentId, status: 'completed' });
      if (!transcodeJob || !transcodeJob.outputs.dash) {
        throw new Error('DASH stream not available');
      }
      
      // Generate MPD (Media Presentation Description)
      const manifest = await this.generateDASHManifest(content, transcodeJob.outputs.dash);
      
      return {
        type: 'dash',
        manifestUrl: `/api/player/dash/${contentId}/manifest.mpd`,
        manifest,
        duration: content.duration
      };
      
    } catch (error) {
      console.error('Error getting DASH manifest:', error);
      throw error;
    }
  }
  
  /**
   * Generate DASH MPD manifest
   */
  static async generateDASHManifest(content, dashOutput) {
    const duration = `PT${content.duration}S`;
    
    let manifest = '<?xml version="1.0" encoding="UTF-8"?>\n';
    manifest += '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="' + duration + '" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">\n';
    manifest += '  <Period>\n';
    
    // Add video adaptation set
    manifest += '    <AdaptationSet mimeType="video/mp4" codecs="avc1.42E01E">\n';
    
    for (const variant of dashOutput.variants) {
      manifest += `      <Representation id="${variant.quality}" bandwidth="${variant.bitrate}" width="${variant.width}" height="${variant.height}">\n`;
      manifest += `        <BaseURL>${variant.quality}/</BaseURL>\n`;
      manifest += `        <SegmentBase indexRange="0-${variant.indexRange}">\n`;
      manifest += `          <Initialization range="0-${variant.initRange}"/>\n`;
      manifest += '        </SegmentBase>\n';
      manifest += '      </Representation>\n';
    }
    
    manifest += '    </AdaptationSet>\n';
    manifest += '  </Period>\n';
    manifest += '</MPD>';
    
    return manifest;
  }
  
  /**
   * Get optimal quality based on bandwidth and device
   */
  static selectOptimalQuality(availableQualities, options = {}) {
    const {
      bandwidth = 5000000,      // 5 Mbps default
      deviceType = 'mobile',
      screenResolution = '1920x1080',
      batteryLevel = 1.0,
      dataPreference = 'auto'
    } = options;
    
    // Parse screen resolution
    const [screenWidth, screenHeight] = screenResolution.split('x').map(Number);
    
    // Filter qualities based on bandwidth
    const suitableQualities = availableQualities.filter(q => {
      // Add 20% overhead for bandwidth estimation
      return q.bitrate <= bandwidth * 0.8;
    });
    
    if (suitableQualities.length === 0) {
      return availableQualities[0]; // Return lowest quality
    }
    
    // Apply device-specific rules
    let targetQuality;
    
    if (dataPreference === 'save') {
      // Data saver mode: lowest quality
      targetQuality = suitableQualities[0];
    } else if (deviceType === 'mobile' && batteryLevel < 0.2) {
      // Low battery: reduce quality
      const midIndex = Math.floor(suitableQualities.length / 2);
      targetQuality = suitableQualities[midIndex];
    } else {
      // Auto mode: best quality that fits screen and bandwidth
      targetQuality = suitableQualities.reduce((best, current) => {
        const [width, height] = current.resolution.split('x').map(Number);
        
        // Don't exceed screen resolution
        if (width > screenWidth || height > screenHeight) {
          return best;
        }
        
        // Pick higher quality
        return current.bitrate > best.bitrate ? current : best;
      }, suitableQualities[0]);
    }
    
    return targetQuality;
  }
  
  /**
   * Generate video segment URLs for preloading
   */
  static async getPreloadSegments(contentId, count = 5) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      const transcodeJob = await TranscodeJob.findOne({ content: contentId, status: 'completed' });
      if (!transcodeJob) {
        throw new Error('Transcode not available');
      }
      
      const segments = [];
      const hlsOutput = transcodeJob.outputs.hls;
      
      if (hlsOutput && hlsOutput.variants) {
        // Use medium quality for preload
        const mediumVariant = hlsOutput.variants.find(v => v.quality === '720p') || hlsOutput.variants[0];
        
        for (let i = 0; i < count; i++) {
          segments.push({
            url: `/api/player/hls/${contentId}/${mediumVariant.quality}/segment${i}.ts`,
            duration: 6, // Typical segment duration
            index: i
          });
        }
      }
      
      return segments;
      
    } catch (error) {
      console.error('Error getting preload segments:', error);
      throw error;
    }
  }
  
  /**
   * Get CDN URLs for content
   */
  static getCDNUrls(content, options = {}) {
    const {
      cdnProvider = process.env.CDN_PROVIDER || 'local',
      region = 'us-east-1'
    } = options;
    
    const cdnBaseUrls = {
      cloudflare: `https://cdn.mixillo.com`,
      cloudfront: `https://d123456789.cloudfront.net`,
      fastly: `https://mixillo.global.ssl.fastly.net`,
      local: `${process.env.API_URL || 'https://reactv1-v8sa.onrender.com'}/uploads`
    };
    
    const baseUrl = cdnBaseUrls[cdnProvider] || cdnBaseUrls.local;
    
    return {
      video: `${baseUrl}/videos/${content._id}`,
      thumbnail: `${baseUrl}/thumbnails/${content._id}.jpg`,
      poster: `${baseUrl}/posters/${content._id}.jpg`,
      hls: `${baseUrl}/hls/${content._id}/master.m3u8`,
      dash: `${baseUrl}/dash/${content._id}/manifest.mpd`
    };
  }
  
  /**
   * Generate signed URL for secure streaming
   */
  static generateSignedUrl(contentId, userId, options = {}) {
    const {
      expiresIn = 3600,        // 1 hour
      quality = 'auto',
      format = 'hls'
    } = options;
    
    const crypto = require('crypto');
    const secret = process.env.STREAM_SECRET || 'default-secret';
    
    const payload = {
      contentId,
      userId: userId?.toString(),
      quality,
      format,
      expiresAt: Date.now() + expiresIn * 1000
    };
    
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(token)
      .digest('hex');
    
    const signedToken = `${token}.${signature}`;
    
    return {
      url: `/api/player/stream/${contentId}?token=${signedToken}`,
      expiresAt: payload.expiresAt
    };
  }
  
  /**
   * Verify signed streaming token
   */
  static verifyStreamToken(token) {
    try {
      const crypto = require('crypto');
      const secret = process.env.STREAM_SECRET || 'default-secret';
      
      const [payloadBase64, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadBase64)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }
      
      // Decode payload
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      
      // Check expiration
      if (payload.expiresAt < Date.now()) {
        throw new Error('Token expired');
      }
      
      return payload;
      
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Get player configuration
   */
  static async getPlayerConfig(contentId, userId, options = {}) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      // Get optimal streaming format
      const transcodeJob = await TranscodeJob.findOne({ content: contentId, status: 'completed' });
      
      const config = {
        contentId,
        title: content.title,
        duration: content.duration,
        poster: content.thumbnailUrl,
        
        sources: [],
        
        tracks: [],
        
        controls: {
          playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
          quality: true,
          pip: true,
          fullscreen: true,
          airplay: true,
          chromecast: true
        },
        
        analytics: {
          enabled: true,
          trackProgress: true,
          progressInterval: 10 // seconds
        },
        
        autoplay: options.autoplay || false,
        muted: options.muted || false,
        preload: options.preload || 'metadata'
      };
      
      // Add HLS source
      if (transcodeJob && transcodeJob.outputs.hls) {
        config.sources.push({
          type: 'application/x-mpegURL',
          src: `/api/player/hls/${contentId}/master.m3u8`,
          label: 'Auto (HLS)'
        });
      }
      
      // Add direct MP4 sources
      if (transcodeJob && transcodeJob.outputs.progressive) {
        for (const variant of transcodeJob.outputs.progressive) {
          config.sources.push({
            type: 'video/mp4',
            src: `/api/player/progressive/${contentId}/${variant.quality}.mp4`,
            label: variant.quality.toUpperCase(),
            quality: variant.quality
          });
        }
      }
      
      // Add captions if available
      if (content.captions) {
        config.tracks.push({
          kind: 'captions',
          label: 'English',
          srclang: 'en',
          src: `/api/player/captions/${contentId}/en.vtt`
        });
      }
      
      return config;
      
    } catch (error) {
      console.error('Error getting player config:', error);
      throw error;
    }
  }
  
  /**
   * Track playback progress
   */
  static async trackProgress(contentId, userId, progressData) {
    try {
      const ViewEvent = require('../models/ViewEvent');
      
      const event = new ViewEvent({
        user: userId,
        content: contentId,
        eventType: 'view_progress',
        currentTime: progressData.currentTime,
        duration: progressData.duration,
        watchTime: progressData.watchTime,
        completionRate: progressData.currentTime / progressData.duration,
        quality: progressData.quality,
        metadata: {
          bandwidth: progressData.bandwidth,
          bufferHealth: progressData.bufferHealth,
          deviceType: progressData.deviceType
        }
      });
      
      await event.save();
      
      return event;
      
    } catch (error) {
      console.error('Error tracking progress:', error);
      throw error;
    }
  }
}

module.exports = StreamingService;
