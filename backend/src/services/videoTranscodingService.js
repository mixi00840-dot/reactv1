const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const VideoQuality = require('../models/VideoQuality');
const Content = require('../models/Content');

class VideoTranscodingService {
  constructor() {
    this.qualityPresets = {
      '360p': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
      '480p': { width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
      '720p': { width: 1280, height: 720, bitrate: '2800k', audioBitrate: '192k' },
      '1080p': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
      '1440p': { width: 2560, height: 1440, bitrate: '8000k', audioBitrate: '256k' },
      '4k': { width: 3840, height: 2160, bitrate: '15000k', audioBitrate: '256k' }
    };
  }

  async transcodeVideo(contentId, inputPath, qualities = ['360p', '480p', '720p', '1080p']) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      console.log(`Starting transcoding for content ${contentId}...`);

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      const originalHeight = metadata.height;

      // Filter qualities based on original video resolution
      const validQualities = qualities.filter(quality => {
        const preset = this.qualityPresets[quality];
        return preset.height <= originalHeight;
      });

      console.log(`Transcoding to qualities: ${validQualities.join(', ')}`);

      // Transcode to each quality in parallel
      const transcodePromises = validQualities.map(quality =>
        this.transcodeToQuality(contentId, inputPath, quality, metadata)
      );

      const results = await Promise.allSettled(transcodePromises);

      // Update content with available qualities
      const successfulQualities = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.quality);

      await Content.findByIdAndUpdate(contentId, {
        $set: {
          'processing.transcoding': 'completed',
          availableQualities: successfulQualities,
          'processing.transcodedAt': new Date()
        }
      });

      console.log(`Transcoding completed for content ${contentId}`);

      return {
        success: true,
        qualities: successfulQualities,
        failed: results.filter(r => r.status === 'rejected').length
      };

    } catch (error) {
      console.error('Transcoding error:', error);
      await Content.findByIdAndUpdate(contentId, {
        $set: {
          'processing.transcoding': 'failed',
          'processing.error': error.message
        }
      });
      throw error;
    }
  }

  async transcodeToQuality(contentId, inputPath, quality, metadata) {
    return new Promise(async (resolve, reject) => {
      try {
        const preset = this.qualityPresets[quality];
        const outputDir = path.join(path.dirname(inputPath), 'qualities');
        
        // Create output directory
        await fs.mkdir(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, `${quality}_${path.basename(inputPath)}`);

        // Create VideoQuality record
        const videoQuality = new VideoQuality({
          originalVideo: contentId,
          quality: quality,
          resolution: {
            width: preset.width,
            height: preset.height
          },
          bitrate: parseInt(preset.bitrate),
          duration: metadata.duration,
          url: outputPath,
          s3Key: `videos/qualities/${contentId}/${quality}_video.mp4`,
          status: 'processing',
          processingStarted: new Date()
        });

        await videoQuality.save();

        console.log(`Starting ${quality} transcoding...`);

        ffmpeg(inputPath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(`${preset.width}x${preset.height}`)
          .videoBitrate(preset.bitrate)
          .audioBitrate(preset.audioBitrate)
          .fps(30)
          .outputOptions([
            '-preset fast',
            '-movflags +faststart', // Enable streaming
            '-profile:v main',
            '-level 4.0'
          ])
          .on('progress', (progress) => {
            console.log(`${quality} transcoding: ${Math.round(progress.percent || 0)}%`);
          })
          .on('end', async () => {
            try {
              const stats = await fs.stat(outputPath);
              
              await VideoQuality.findByIdAndUpdate(videoQuality._id, {
                $set: {
                  status: 'completed',
                  fileSize: stats.size,
                  processingCompleted: new Date()
                }
              });

              console.log(`${quality} transcoding completed`);
              resolve({ quality, outputPath, fileSize: stats.size });
            } catch (err) {
              reject(err);
            }
          })
          .on('error', async (err) => {
            console.error(`${quality} transcoding failed:`, err);
            
            await VideoQuality.findByIdAndUpdate(videoQuality._id, {
              $set: {
                status: 'failed',
                error: err.message
              }
            });

            reject(err);
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }

  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        resolve({
          duration: metadata.format.duration,
          width: videoStream.width,
          height: videoStream.height,
          bitrate: metadata.format.bit_rate,
          codec: videoStream.codec_name,
          fps: eval(videoStream.r_frame_rate) // Convert "30/1" to 30
        });
      });
    });
  }

  async generateHLSPlaylist(contentId) {
    try {
      const qualities = await VideoQuality.find({
        originalVideo: contentId,
        status: 'completed'
      }).sort({ 'resolution.height': -1 });

      if (qualities.length === 0) {
        throw new Error('No transcoded qualities available');
      }

      // Generate master playlist
      let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

      qualities.forEach(q => {
        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${q.bitrate * 1000},RESOLUTION=${q.resolution.width}x${q.resolution.height}\n`;
        masterPlaylist += `${q.quality}/playlist.m3u8\n\n`;
      });

      return {
        masterPlaylist,
        qualities: qualities.map(q => ({
          quality: q.quality,
          url: q.url,
          bitrate: q.bitrate,
          resolution: q.resolution
        }))
      };

    } catch (error) {
      console.error('Error generating HLS playlist:', error);
      throw error;
    }
  }

  async getAvailableQualities(contentId) {
    try {
      const qualities = await VideoQuality.find({
        originalVideo: contentId,
        status: 'completed'
      }).select('quality resolution bitrate fileSize url');

      return qualities;
    } catch (error) {
      console.error('Error getting available qualities:', error);
      throw error;
    }
  }
}

module.exports = new VideoTranscodingService();
