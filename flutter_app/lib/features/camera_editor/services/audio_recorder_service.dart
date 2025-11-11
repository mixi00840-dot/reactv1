import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:record/record.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../models/audio_editing_models.dart';

/// Audio recorder service for voiceover recording
class AudioRecorderService {
  final _audioRecorder = AudioRecorder();
  final _uuid = const Uuid();
  
  VoiceoverRecordingSession? _currentSession;
  Timer? _durationTimer;
  StreamController<Duration>? _durationStreamController;

  /// Get current recording session
  VoiceoverRecordingSession? get currentSession => _currentSession;

  /// Check if recording is in progress
  bool get isRecording => _currentSession?.isRecording ?? false;

  /// Check if recording is paused
  bool get isPaused => _currentSession?.isPaused ?? false;

  /// Stream of recording duration updates
  Stream<Duration> get durationStream {
    _durationStreamController ??= StreamController<Duration>.broadcast();
    return _durationStreamController!.stream;
  }

  /// Check if microphone permission is granted
  Future<bool> hasPermission() async {
    return await _audioRecorder.hasPermission();
  }

  /// Start recording voiceover
  Future<VoiceoverRecordingSession> startRecording({
    String? outputDirectory,
    int bitRate = 128000,
    int sampleRate = 44100,
  }) async {
    try {
      // Check permission
      final hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw Exception('Microphone permission not granted');
      }

      // Stop any existing recording
      if (_currentSession != null) {
        await stopRecording();
      }

      // Create output directory if not provided
      final directory = outputDirectory != null
          ? Directory(outputDirectory)
          : await getTemporaryDirectory();

      // Generate output file path
      final fileName = 'voiceover_${_uuid.v4()}.m4a';
      final outputPath = path.join(directory.path, fileName);

      // Configure recording
      final config = RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: bitRate,
        sampleRate: sampleRate,
        numChannels: 1, // Mono
      );

      // Start recording
      await _audioRecorder.start(config, path: outputPath);

      // Create session
      _currentSession = VoiceoverRecordingSession(
        sessionId: _uuid.v4(),
        state: RecordingState.recording,
        startTime: DateTime.now(),
        outputFilePath: outputPath,
      );

      // Start duration timer
      _startDurationTimer();

      debugPrint('🎤 Recording started: $outputPath');
      return _currentSession!;
    } catch (e) {
      debugPrint('❌ Error starting recording: $e');
      rethrow;
    }
  }

  /// Pause recording
  Future<void> pauseRecording() async {
    if (_currentSession == null || !_currentSession!.isRecording) {
      return;
    }

    try {
      await _audioRecorder.pause();
      
      _currentSession!.state = RecordingState.paused;
      _currentSession!.recordedDuration = _currentSession!.currentDuration;
      
      _stopDurationTimer();

      debugPrint('⏸️ Recording paused');
    } catch (e) {
      debugPrint('❌ Error pausing recording: $e');
      rethrow;
    }
  }

  /// Resume recording
  Future<void> resumeRecording() async {
    if (_currentSession == null || !_currentSession!.isPaused) {
      return;
    }

    try {
      await _audioRecorder.resume();
      
      _currentSession!.state = RecordingState.recording;
      _currentSession!.startTime = DateTime.now();
      
      _startDurationTimer();

      debugPrint('▶️ Recording resumed');
    } catch (e) {
      debugPrint('❌ Error resuming recording: $e');
      rethrow;
    }
  }

  /// Stop recording and return the recorded clip
  Future<VoiceoverClip?> stopRecording({
    Duration? startTimeInVideo,
  }) async {
    if (_currentSession == null) {
      return null;
    }

    try {
      // Stop recording
      final outputPath = await _audioRecorder.stop();
      
      _stopDurationTimer();

      if (outputPath == null) {
        debugPrint('❌ No audio file recorded');
        _currentSession = null;
        return null;
      }

      // Get final duration
      final duration = _currentSession!.currentDuration;
      _currentSession!.state = RecordingState.stopped;
      _currentSession!.endTime = DateTime.now();
      _currentSession!.recordedDuration = duration;

      // Create voiceover clip
      final clip = VoiceoverClip(
        id: _currentSession!.sessionId,
        filePath: outputPath,
        startTime: startTimeInVideo ?? Duration.zero,
        duration: duration,
      );

      debugPrint('✅ Recording stopped: $outputPath (${duration.inSeconds}s)');

      // Clear session
      _currentSession = null;

      return clip;
    } catch (e) {
      debugPrint('❌ Error stopping recording: $e');
      _currentSession = null;
      rethrow;
    }
  }

  /// Cancel recording without saving
  Future<void> cancelRecording() async {
    if (_currentSession == null) {
      return;
    }

    try {
      await _audioRecorder.stop();
      _stopDurationTimer();

      // Delete the recorded file
      if (_currentSession!.outputFilePath != null) {
        final file = File(_currentSession!.outputFilePath!);
        if (await file.exists()) {
          await file.delete();
        }
      }

      debugPrint('🗑️ Recording cancelled');
      _currentSession = null;
    } catch (e) {
      debugPrint('❌ Error cancelling recording: $e');
      _currentSession = null;
      rethrow;
    }
  }

  /// Get current recording duration
  Future<Duration> getRecordingDuration() async {
    if (_currentSession == null) {
      return Duration.zero;
    }
    return _currentSession!.currentDuration;
  }

  /// Check if recording is supported
  Future<bool> isRecordingSupported() async {
    try {
      return await _audioRecorder.isEncoderSupported(AudioEncoder.aacLc);
    } catch (e) {
      return false;
    }
  }

  /// Get list of available audio encoders
  Future<List<AudioEncoder>> getAvailableEncoders() async {
    final encoders = <AudioEncoder>[];
    for (final encoder in AudioEncoder.values) {
      if (await _audioRecorder.isEncoderSupported(encoder)) {
        encoders.add(encoder);
      }
    }
    return encoders;
  }

  /// Start duration timer
  void _startDurationTimer() {
    _stopDurationTimer();
    
    _durationTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (_currentSession != null && _currentSession!.isRecording) {
        final duration = _currentSession!.currentDuration;
        _durationStreamController?.add(duration);
      }
    });
  }

  /// Stop duration timer
  void _stopDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = null;
  }

  /// Dispose resources
  void dispose() {
    _durationTimer?.cancel();
    _durationStreamController?.close();
    _audioRecorder.dispose();
  }
}

/// Audio waveform extractor
class AudioWaveformExtractor {
  /// Extract waveform data from audio file
  /// This is a simplified implementation - for production, use a dedicated library
  static Future<WaveformData> extractWaveform({
    required String filePath,
    int samplesPerSecond = 100,
  }) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      // TODO: Implement actual waveform extraction
      // For now, return mock data
      // In production, use a library like flutter_sound or ffmpeg to extract audio samples
      
      // Get file duration (mock)
      final duration = Duration(seconds: 10); // Mock duration
      
      // Generate mock waveform samples
      final sampleCount = duration.inSeconds * samplesPerSecond;
      final samples = List<double>.generate(
        sampleCount,
        (index) {
          // Generate a simple sine wave pattern for visualization
          final t = index / sampleCount;
          return (0.5 + 0.5 * math.sin(t * 10)).clamp(0.0, 1.0);
        },
      );

      return WaveformData(
        samples: samples,
        duration: duration,
        sampleRate: samplesPerSecond,
      );
    } catch (e) {
      debugPrint('❌ Error extracting waveform: $e');
      rethrow;
    }
  }

  /// Extract waveform data with custom resolution
  static Future<WaveformData> extractWaveformWithResolution({
    required String filePath,
    required int targetSampleCount,
  }) async {
    final fullWaveform = await extractWaveform(filePath: filePath);
    
    // Downsample if needed
    if (fullWaveform.samples.length <= targetSampleCount) {
      return fullWaveform;
    }

    final step = fullWaveform.samples.length / targetSampleCount;
    final downsampledSamples = <double>[];

    for (int i = 0; i < targetSampleCount; i++) {
      final index = (i * step).floor();
      if (index < fullWaveform.samples.length) {
        downsampledSamples.add(fullWaveform.samples[index]);
      }
    }

    return WaveformData(
      samples: downsampledSamples,
      duration: fullWaveform.duration,
      sampleRate: (targetSampleCount / fullWaveform.duration.inSeconds).round(),
    );
  }

  /// Calculate RMS (Root Mean Square) for amplitude normalization
  static double calculateRMS(List<double> samples) {
    if (samples.isEmpty) return 0.0;
    
    final sumOfSquares = samples.fold<double>(
      0.0,
      (sum, sample) => sum + (sample * sample),
    );
    
    return math.sqrt(sumOfSquares / samples.length);
  }

  /// Normalize waveform samples to target RMS level
  static List<double> normalizeSamples(List<double> samples, {double targetRMS = 0.7}) {
    final currentRMS = calculateRMS(samples);
    if (currentRMS == 0.0) return samples;

    final scaleFactor = targetRMS / currentRMS;
    return samples.map((sample) => (sample * scaleFactor).clamp(0.0, 1.0)).toList();
  }
}

/// Audio file utilities
class AudioFileUtils {
  /// Get audio file duration using FFmpeg (requires ffmpeg_kit_flutter)
  static Future<Duration> getAudioDuration(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      // TODO: Implement actual duration extraction using FFmpeg
      // For now, return mock duration
      return Duration(seconds: 10);
    } catch (e) {
      debugPrint('❌ Error getting audio duration: $e');
      rethrow;
    }
  }

  /// Get audio file size in bytes
  static Future<int> getAudioFileSize(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }
      return await file.length();
    } catch (e) {
      debugPrint('❌ Error getting audio file size: $e');
      rethrow;
    }
  }

  /// Format file size to human-readable string
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  /// Validate audio file format
  static bool isValidAudioFile(String filePath) {
    final extension = path.extension(filePath).toLowerCase();
    return ['.m4a', '.aac', '.mp3', '.wav', '.flac', '.ogg'].contains(extension);
  }
}
