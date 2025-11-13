const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { SpeechClient } = require('@google-cloud/speech');
const ffmpeg = require('fluent-ffmpeg');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mp3|wav|m4a|aac|flac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio/video files are allowed'));
    }
  }
});

// Initialize Google Cloud Speech client
let speechClient;
try {
  speechClient = new SpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-cloud-key.json'
  });
  console.log('✅ Google Cloud Speech-to-Text initialized');
} catch (error) {
  console.error('❌ Failed to initialize Speech-to-Text:', error.message);
}

/**
 * Extract audio from video file
 */
async function extractAudioFromVideo(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .audioCodec('pcm_s16le') // Linear PCM for Speech-to-Text
      .audioChannels(1) // Mono
      .audioFrequency(16000) // 16kHz sample rate
      .format('wav')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * POST /api/ai/captions/generate
 * Generate captions from audio/video file
 */
router.post('/generate', upload.single('file'), async (req, res) => {
  let audioPath = null;
  let extractedAudioPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!speechClient) {
      return res.status(503).json({
        success: false,
        error: 'Speech-to-Text service not configured'
      });
    }

    const { language = 'en-US', enableAutoPunctuation = true } = req.body;
    audioPath = req.file.path;

    console.log(`🎤 Generating captions for: ${req.file.filename}`);

    // Extract audio if video file
    const isVideo = /\.(mp4|mov|avi)$/i.test(req.file.originalname);
    if (isVideo) {
      extractedAudioPath = audioPath.replace(path.extname(audioPath), '.wav');
      console.log('🎵 Extracting audio from video...');
      await extractAudioFromVideo(audioPath, extractedAudioPath);
      audioPath = extractedAudioPath;
    }

    // Read audio file
    const audioBytes = await fs.readFile(audioPath);

    // Configure Speech-to-Text request
    const audio = {
      content: audioBytes.toString('base64'),
    };

    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: language,
      enableWordTimeOffsets: true, // Get word-level timestamps
      enableAutomaticPunctuation: enableAutoPunctuation === 'true' || enableAutoPunctuation === true,
      model: 'default', // Use 'video' model for video content
      useEnhanced: true, // Use enhanced model for better accuracy
    };

    const request = {
      audio,
      config,
    };

    console.log('🤖 Sending to Google Speech-to-Text API...');

    // Perform speech recognition
    const [response] = await speechClient.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      return res.json({
        success: true,
        captions: [],
        message: 'No speech detected in audio'
      });
    }

    // Process results into caption format
    const captions = [];
    let captionId = 1;

    response.results.forEach((result) => {
      const alternative = result.alternatives[0];
      
      if (!alternative.words || alternative.words.length === 0) {
        return;
      }

      // Group words into caption segments (max 10 words per caption)
      const wordsPerCaption = 10;
      const words = alternative.words;

      for (let i = 0; i < words.length; i += wordsPerCaption) {
        const segment = words.slice(i, i + wordsPerCaption);
        const text = segment.map(w => w.word).join(' ');
        
        const startTime = parseFloat(segment[0].startTime.seconds || 0) + 
                         (parseFloat(segment[0].startTime.nanos || 0) / 1e9);
        const endTime = parseFloat(segment[segment.length - 1].endTime.seconds || 0) + 
                       (parseFloat(segment[segment.length - 1].endTime.nanos || 0) / 1e9);

        captions.push({
          id: captionId++,
          text,
          startTime: startTime.toFixed(3),
          endTime: endTime.toFixed(3),
          duration: (endTime - startTime).toFixed(3),
          words: segment.map(w => ({
            word: w.word,
            startTime: (parseFloat(w.startTime.seconds || 0) + 
                       (parseFloat(w.startTime.nanos || 0) / 1e9)).toFixed(3),
            endTime: (parseFloat(w.endTime.seconds || 0) + 
                     (parseFloat(w.endTime.nanos || 0) / 1e9)).toFixed(3),
          }))
        });
      }
    });

    console.log(`✅ Generated ${captions.length} captions`);

    // Cleanup temp files
    try {
      if (req.file.path) await fs.unlink(req.file.path);
      if (extractedAudioPath) await fs.unlink(extractedAudioPath);
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError);
    }

    res.json({
      success: true,
      captions,
      language,
      totalDuration: captions.length > 0 
        ? parseFloat(captions[captions.length - 1].endTime)
        : 0,
      confidence: response.results[0]?.alternatives[0]?.confidence || 0,
    });

  } catch (error) {
    console.error('❌ Caption generation error:', error);
    
    // Cleanup on error
    try {
      if (audioPath) await fs.unlink(audioPath);
      if (extractedAudioPath) await fs.unlink(extractedAudioPath);
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate captions'
    });
  }
});

/**
 * POST /api/ai/captions/translate
 * Translate captions to another language (future feature)
 */
router.post('/translate', async (req, res) => {
  try {
    const { captions, targetLanguage } = req.body;

    if (!captions || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Captions and target language are required'
      });
    }

    // Placeholder for translation service (Google Cloud Translation API)
    res.json({
      success: true,
      message: 'Translation feature coming soon',
      captions: captions, // Return original captions for now
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/captions/languages
 * Get supported languages for captions
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = [
      { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
      { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
      { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
      { code: 'es-US', name: 'Spanish (US)', flag: '🇺🇸' },
      { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
      { code: 'de-DE', name: 'German', flag: '🇩🇪' },
      { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
      { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
      { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
      { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
      { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
      { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
      { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
      { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
      { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
      { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
      { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
      { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
    ];

    res.json({
      success: true,
      languages,
    });
  } catch (error) {
    console.error('❌ Get languages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
