const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

/**
 * VideoProcessor Service - FFmpeg-based video processing
 * Handles transcoding, thumbnail generation, HLS/DASH creation
 */

class VideoProcessor {
  constructor() {
    // FFmpeg path configuration (update for your system)
    // ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
    // ffmpeg.setFfprobePath('/usr/bin/ffprobe');
    
    this.outputDir = path.join(__dirname, '../../uploads/videos');
    this.tempDir = path.join(__dirname, '../../uploads/temp');
    
    // Encoding presets
    this.presets = {
      '1080p': {
        width: 1080,
        height: 1920,
        videoBitrate: '5000k',
        audioBitrate: '192k',
        fps: 30
      },
      '720p': {
        width: 720,
        height: 1280,
        videoBitrate: '2500k',
        audioBitrate: '128k',
        fps: 30
      },
      '480p': {
        width: 480,
        height: 854,
        videoBitrate: '1000k',
        audioBitrate: '96k',
        fps: 30
      },
      '360p': {
        width: 360,
        height: 640,
        videoBitrate: '600k',
        audioBitrate: '96k',
        fps: 30
      },
      '240p': {
        width: 240,
        height: 426,
        videoBitrate: '300k',
        audioBitrate: '64k',
        fps: 24
      }
    };
  }
  
  /**
   * Get video metadata using ffprobe
   */
  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
            bitrate: videoStream.bit_rate,
            pixelFormat: videoStream.pix_fmt
          } : null,
          
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate
          } : null
        });
      });
    });
  }
  
  /**
   * Transcode video to specific quality/resolution
   */
  async transcodeVideo(inputPath, outputPath, quality, onProgress) {
    const preset = this.presets[quality];
    if (!preset) {
      throw new Error(`Invalid quality preset: ${quality}`);
    }
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',                    // Video codec
          '-preset medium',                   // Encoding speed/quality tradeoff
          '-crf 23',                         // Quality (18-28, lower = better)
          `-b:v ${preset.videoBitrate}`,     // Video bitrate
          '-maxrate ' + preset.videoBitrate,
          '-bufsize ' + (parseInt(preset.videoBitrate) * 2) + 'k',
          `-vf scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`,
          `-r ${preset.fps}`,                // Frame rate
          '-c:a aac',                        // Audio codec
          `-b:a ${preset.audioBitrate}`,     // Audio bitrate
          '-ar 44100',                       // Audio sample rate
          '-ac 2',                           // Stereo audio
          '-movflags +faststart',            // Enable progressive download
          '-f mp4'
        ])
        .output(outputPath);
      
      // Progress tracking
      command.on('progress', (progress) => {
        if (onProgress) {
          onProgress(progress.percent || 0);
        }
      });
      
      command.on('end', () => {
        resolve({
          outputPath,
          quality,
          preset
        });
      });
      
      command.on('error', (err) => {
        reject(new Error(`Transcode failed: ${err.message}`));
      });
      
      command.run();
    });
  }
  
  /**
   * Generate HLS (HTTP Live Streaming) manifest and segments
   */
  async generateHLS(inputPath, outputDir, contentId) {
    const hlsDir = path.join(outputDir, 'hls');
    await fs.mkdir(hlsDir, { recursive: true });
    
    const playlistPath = path.join(hlsDir, 'master.m3u8');
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-ar 44100',
          '-ac 2',
          '-preset fast',
          '-g 48',                           // Keyframe interval
          '-sc_threshold 0',
          '-f hls',
          '-hls_time 6',                     // 6-second segments
          '-hls_playlist_type vod',
          '-hls_segment_filename', path.join(hlsDir, 'segment_%03d.ts'),
          '-master_pl_name master.m3u8'
        ])
        .output(playlistPath);
      
      command.on('end', async () => {
        // Count segments
        const files = await fs.readdir(hlsDir);
        const segmentCount = files.filter(f => f.endsWith('.ts')).length;
        
        resolve({
          manifestUrl: playlistPath,
          segmentCount,
          segmentDuration: 6
        });
      });
      
      command.on('error', (err) => {
        reject(new Error(`HLS generation failed: ${err.message}`));
      });
      
      command.run();
    });
  }
  
  /**
   * Generate DASH (Dynamic Adaptive Streaming over HTTP) manifest
   */
  async generateDASH(inputPath, outputDir) {
    const dashDir = path.join(outputDir, 'dash');
    await fs.mkdir(dashDir, { recursive: true });
    
    const manifestPath = path.join(dashDir, 'manifest.mpd');
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-f dash',
          '-seg_duration 6',
          '-use_template 1',
          '-use_timeline 1'
        ])
        .output(manifestPath);
      
      command.on('end', async () => {
        const files = await fs.readdir(dashDir);
        const segmentCount = files.filter(f => f.includes('segment')).length;
        
        resolve({
          manifestUrl: manifestPath,
          segmentCount
        });
      });
      
      command.on('error', (err) => {
        reject(new Error(`DASH generation failed: ${err.message}`));
      });
      
      command.run();
    });
  }
  
  /**
   * Extract thumbnails at specific timestamps
   */
  async extractThumbnails(inputPath, outputDir, count = 5) {
    const metadata = await this.getVideoMetadata(inputPath);
    const duration = metadata.duration;
    const interval = duration / (count + 1);
    
    const thumbnails = [];
    const thumbDir = path.join(outputDir, 'thumbnails');
    await fs.mkdir(thumbDir, { recursive: true });
    
    for (let i = 1; i <= count; i++) {
      const timeOffset = interval * i;
      const filename = `thumb_${i}.jpg`;
      const outputPath = path.join(thumbDir, filename);
      
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(timeOffset)
          .outputOptions([
            '-vframes 1',              // Extract 1 frame
            '-vf scale=720:-1',        // Width 720, maintain aspect ratio
            '-q:v 2'                   // High quality JPEG
          ])
          .output(outputPath)
          .on('end', () => {
            thumbnails.push({
              path: outputPath,
              filename,
              timeOffset: Math.round(timeOffset),
              width: 720
            });
            resolve();
          })
          .on('error', reject)
          .run();
      });
    }
    
    return thumbnails;
  }
  
  /**
   * Generate animated preview (GIF or short video clip)
   */
  async generateAnimatedPreview(inputPath, outputPath, duration = 3, startTime = 0) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .outputOptions([
          '-vf scale=360:-1:flags=lanczos,fps=15',  // Lower resolution and fps for smaller size
          '-c:v libx264',
          '-preset fast',
          '-crf 28',
          '-movflags +faststart',
          '-an'                              // No audio
        ])
        .output(outputPath)
        .on('end', () => {
          resolve({
            path: outputPath,
            duration
          });
        })
        .on('error', reject)
        .run();
    });
  }
  
  /**
   * Extract audio track from video
   */
  async extractAudio(inputPath, outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vn',                      // No video
          '-c:a libmp3lame',         // MP3 codec
          '-b:a 192k',               // Audio bitrate
          '-ar 44100'                // Sample rate
        ])
        .output(outputPath)
        .on('end', async () => {
          const metadata = await this.getVideoMetadata(outputPath);
          resolve({
            path: outputPath,
            duration: metadata.duration,
            codec: metadata.audio?.codec,
            bitrate: metadata.audio?.bitrate,
            sampleRate: metadata.audio?.sampleRate,
            channels: metadata.audio?.channels
          });
        })
        .on('error', reject)
        .run();
    });
  }
  
  /**
   * Process video - full pipeline
   */
  async processVideo(inputPath, contentId, options = {}) {
    const {
      qualities = ['720p', '480p', '360p'],
      generateHLS: shouldGenerateHLS = true,
      generateDASH: shouldGenerateDASH = false,
      thumbnailCount = 5,
      extractAudioTrack = true,
      generatePreview = true,
      onProgress
    } = options;
    
    const results = {
      metadata: null,
      transcodes: [],
      hls: null,
      dash: null,
      thumbnails: [],
      audio: null,
      preview: null
    };
    
    // Get metadata
    results.metadata = await this.getVideoMetadata(inputPath);
    if (onProgress) onProgress('metadata', 5);
    
    // Create content-specific output directory
    const contentOutputDir = path.join(this.outputDir, contentId);
    await fs.mkdir(contentOutputDir, { recursive: true });
    
    // Transcode to multiple qualities
    let progressBase = 10;
    const progressPerQuality = 60 / qualities.length;
    
    for (const quality of qualities) {
      const outputPath = path.join(contentOutputDir, `${quality}.mp4`);
      
      const transcoded = await this.transcodeVideo(
        inputPath,
        outputPath,
        quality,
        (percent) => {
          if (onProgress) {
            onProgress(`transcode_${quality}`, progressBase + (percent * progressPerQuality / 100));
          }
        }
      );
      
      results.transcodes.push({
        quality,
        path: transcoded.outputPath,
        preset: transcoded.preset
      });
      
      progressBase += progressPerQuality;
      if (onProgress) onProgress(`transcode_${quality}_complete`, progressBase);
    }
    
    // Generate HLS
    if (shouldGenerateHLS) {
      results.hls = await this.generateHLS(inputPath, contentOutputDir, contentId);
      if (onProgress) onProgress('hls', 75);
    }
    
    // Generate DASH
    if (shouldGenerateDASH) {
      results.dash = await this.generateDASH(inputPath, contentOutputDir);
      if (onProgress) onProgress('dash', 80);
    }
    
    // Extract thumbnails
    results.thumbnails = await this.extractThumbnails(inputPath, contentOutputDir, thumbnailCount);
    if (onProgress) onProgress('thumbnails', 85);
    
    // Generate animated preview
    if (generatePreview) {
      const previewPath = path.join(contentOutputDir, 'preview.mp4');
      results.preview = await this.generateAnimatedPreview(inputPath, previewPath);
      if (onProgress) onProgress('preview', 90);
    }
    
    // Extract audio
    if (extractAudioTrack) {
      const audioPath = path.join(contentOutputDir, 'audio.mp3');
      results.audio = await this.extractAudio(inputPath, audioPath);
      if (onProgress) onProgress('audio', 95);
    }
    
    if (onProgress) onProgress('complete', 100);
    
    return results;
  }
  
  /**
   * Clean up temp files
   */
  async cleanup(paths) {
    for (const filePath of paths) {
      try {
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error(`Cleanup failed for ${filePath}:`, error);
      }
    }
  }
}

module.exports = new VideoProcessor();
