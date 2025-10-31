// Video transcoding service requires FFmpeg to be installed on the system
// If FFmpeg is not available, endpoints will return 503 Service Unavailable
let videoTranscodingService = null;
try {
  videoTranscodingService = require('../services/videoTranscodingService');
  console.log('✓ Video transcoding service loaded successfully');
} catch (err) {
  console.warn('⚠ Video transcoding service not available - FFmpeg may not be installed');
  console.warn('  Install FFmpeg from https://ffmpeg.org/download.html to enable video transcoding');
}

const VideoQuality = require('../models/VideoQuality');
const Content = require('../models/Content');

async function transcodeVideo(req, res) {
  if (!videoTranscodingService) {
    return res.status(503).json({ 
      success: false,
      message: 'Video transcoding service is not available. Please install FFmpeg to enable this feature.'
    });
  }
  try {
    const { contentId, qualities } = req.body;

    if (!contentId) {
      return res.status(400).json({ message: 'Content ID is required' });
    }

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Start transcoding (async process)
    videoTranscodingService.transcodeVideo(
      contentId,
      content.videoUrl,
      qualities || ['360p', '480p', '720p', '1080p']
    ).catch(err => console.error('Transcoding error:', err));

    res.json({
      success: true,
      message: 'Transcoding started',
      contentId
    });

  } catch (error) {
    console.error('Transcode video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getVideoQualities(req, res) {
  if (!videoTranscodingService) {
    return res.status(503).json({ 
      success: false,
      message: 'Video transcoding service is not available. Please install FFmpeg to enable this feature.'
    });
  }

  try {
    const { contentId } = req.params;

    const qualities = await videoTranscodingService.getAvailableQualities(contentId);

    res.json({
      success: true,
      qualities: qualities.map(q => ({
        quality: q.quality,
        resolution: q.resolution,
        bitrate: q.bitrate,
        fileSize: q.fileSize,
        url: q.url
      }))
    });

  } catch (error) {
    console.error('Get video qualities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getHLSPlaylist(req, res) {
  if (!videoTranscodingService) {
    return res.status(503).json({ 
      success: false,
      message: 'Video transcoding service is not available. Please install FFmpeg to enable this feature.'
    });
  }

  try {
    const { contentId } = req.params;

    const playlist = await videoTranscodingService.generateHLSPlaylist(contentId);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(playlist.masterPlaylist);

  } catch (error) {
    console.error('Get HLS playlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getTranscodingStatus(req, res) {
  try {
    const { contentId } = req.params;

    const qualities = await VideoQuality.find({ originalVideo: contentId });

    const status = {
      total: qualities.length,
      completed: qualities.filter(q => q.status === 'completed').length,
      processing: qualities.filter(q => q.status === 'processing').length,
      failed: qualities.filter(q => q.status === 'failed').length,
      qualities: qualities.map(q => ({
        quality: q.quality,
        status: q.status,
        progress: q.status === 'completed' ? 100 : q.status === 'processing' ? 50 : 0
      }))
    };

    res.json({ success: true, status });

  } catch (error) {
    console.error('Get transcoding status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function retryTranscoding(req, res) {
  if (!videoTranscodingService) {
    return res.status(503).json({ 
      success: false,
      message: 'Video transcoding service is not available. Please install FFmpeg to enable this feature.'
    });
  }

  try {
    const { qualityId } = req.params;

    const quality = await VideoQuality.findById(qualityId);
    if (!quality) {
      return res.status(404).json({ message: 'Quality record not found' });
    }

    const content = await Content.findById(quality.originalVideo);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Reset status and retry
    quality.status = 'processing';
    quality.error = null;
    quality.processingStarted = new Date();
    await quality.save();

    videoTranscodingService.transcodeToQuality(
      quality.originalVideo,
      content.videoUrl,
      quality.quality,
      { duration: content.duration }
    ).catch(err => console.error('Retry transcoding error:', err));

    res.json({
      success: true,
      message: 'Transcoding retry started'
    });

  } catch (error) {
    console.error('Retry transcoding error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function deleteQuality(req, res) {
  try {
    const { qualityId } = req.params;

    await VideoQuality.findByIdAndDelete(qualityId);

    res.json({
      success: true,
      message: 'Quality deleted successfully'
    });

  } catch (error) {
    console.error('Delete quality error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getAllTranscodingJobs(req, res) {
  try {
    const { status, limit = 50 } = req.query;

    const query = status ? { status } : {};

    const jobs = await VideoQuality.find(query)
      .populate('originalVideo', 'title creator')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = {
      total: await VideoQuality.countDocuments(),
      processing: await VideoQuality.countDocuments({ status: 'processing' }),
      completed: await VideoQuality.countDocuments({ status: 'completed' }),
      failed: await VideoQuality.countDocuments({ status: 'failed' })
    };

    res.json({
      success: true,
      jobs,
      stats
    });

  } catch (error) {
    console.error('Get all transcoding jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export all controller functions as an object at the end
module.exports = {
  transcodeVideo,
  getVideoQualities,
  getHLSPlaylist,
  getTranscodingStatus,
  retryTranscoding,
  deleteQuality,
  getAllTranscodingJobs,
};
