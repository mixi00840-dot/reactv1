import 'package:flutter/foundation.dart';
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:record/record.dart';
import 'package:just_audio/just_audio.dart';

/// Audio track model
class AudioTrack {
  final String id;
  final String name;
  final String filePath;
  final double volume; // 0.0 - 2.0 (0-200%)
  final Duration startTime;
  final Duration? fadeIn;
  final Duration? fadeOut;
  final bool isMuted;
  final AudioTrackType type;

  const AudioTrack({
    required this.id,
    required this.name,
    required this.filePath,
    this.volume = 1.0,
    this.startTime = Duration.zero,
    this.fadeIn,
    this.fadeOut,
    this.isMuted = false,
    this.type = AudioTrackType.music,
  });

  AudioTrack copyWith({
    String? id,
    String? name,
    String? filePath,
    double? volume,
    Duration? startTime,
    Duration? fadeIn,
    Duration? fadeOut,
    bool? isMuted,
    AudioTrackType? type,
  }) {
    return AudioTrack(
      id: id ?? this.id,
      name: name ?? this.name,
      filePath: filePath ?? this.filePath,
      volume: volume ?? this.volume,
      startTime: startTime ?? this.startTime,
      fadeIn: fadeIn ?? this.fadeIn,
      fadeOut: fadeOut ?? this.fadeOut,
      isMuted: isMuted ?? this.isMuted,
      type: type ?? this.type,
    );
  }
}

enum AudioTrackType {
  original, // Original video audio
  music, // Background music
  voiceover, // Voice recording
}

/// Audio mixer service
class AudioMixerService {
  static final AudioRecorder _recorder = AudioRecorder();
  static final AudioPlayer _player = AudioPlayer();

  /// Record voiceover
  static Future<String?> recordVoiceover({
    required Duration duration,
    Function(Duration)? onProgress,
  }) async {
    try {
      // Check permission
      if (!await _recorder.hasPermission()) {
        debugPrint('❌ Microphone permission denied');
        return null;
      }

      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'voiceover_$timestamp.m4a',
      );

      // Start recording
      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: outputPath,
      );

      debugPrint('🎤 Recording voiceover...');

      // Monitor progress
      if (onProgress != null) {
        final startTime = DateTime.now();
        while (await _recorder.isRecording()) {
          final elapsed = DateTime.now().difference(startTime);
          onProgress(elapsed);

          if (elapsed >= duration) {
            break;
          }

          await Future.delayed(const Duration(milliseconds: 100));
        }
      } else {
        // Wait for duration
        await Future.delayed(duration);
      }

      // Stop recording
      final recordedPath = await _recorder.stop();
      debugPrint('✅ Voiceover recorded: $recordedPath');

      return recordedPath ?? outputPath;
    } catch (e) {
      debugPrint('❌ Record voiceover error: $e');
      return null;
    }
  }

  /// Stop recording
  static Future<void> stopRecording() async {
    try {
      if (await _recorder.isRecording()) {
        await _recorder.stop();
      }
    } catch (e) {
      debugPrint('❌ Stop recording error: $e');
    }
  }

  /// Check if recording
  static Future<bool> isRecording() async {
    try {
      return await _recorder.isRecording();
    } catch (e) {
      return false;
    }
  }

  /// Play audio preview
  static Future<void> playAudio(String filePath) async {
    try {
      await _player.setFilePath(filePath);
      await _player.play();
    } catch (e) {
      debugPrint('❌ Play audio error: $e');
    }
  }

  /// Stop audio playback
  static Future<void> stopAudio() async {
    try {
      await _player.stop();
    } catch (e) {
      debugPrint('❌ Stop audio error: $e');
    }
  }

  /// Pause audio playback
  static Future<void> pauseAudio() async {
    try {
      await _player.pause();
    } catch (e) {
      debugPrint('❌ Pause audio error: $e');
    }
  }

  /// Mix multiple audio tracks with video
  static Future<String?> mixAudioTracks({
    required String videoPath,
    required List<AudioTrack> audioTracks,
    required Duration videoDuration,
    Function(double)? onProgress,
  }) async {
    try {
      if (audioTracks.isEmpty) {
        return videoPath;
      }

      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'mixed_audio_$timestamp.mp4',
      );

      // Build FFmpeg filter complex for mixing
      final filterComplex =
          _buildMixingFilterComplex(audioTracks, videoDuration);

      // Build input files string
      final inputs = audioTracks
          .where((track) => !track.isMuted)
          .map((track) => '-i "${track.filePath}"')
          .join(' ');

      final command =
          '-i "$videoPath" $inputs -filter_complex "$filterComplex" '
          '-map "[vout]" -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest -y "$outputPath"';

      debugPrint('🎵 Mixing audio tracks...');
      debugPrint('Command: $command');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio mixed successfully');
        return outputPath;
      } else {
        final output = await session.getOutput();
        debugPrint('❌ Audio mixing failed: $output');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Mix audio tracks error: $e');
      return null;
    }
  }

  /// Trim audio file
  static Future<String?> trimAudio({
    required String inputPath,
    required Duration start,
    required Duration end,
  }) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'trimmed_audio_$timestamp.m4a',
      );

      final startSeconds = start.inMilliseconds / 1000.0;
      final durationSeconds = (end - start).inMilliseconds / 1000.0;

      final command = '-i "$inputPath" -ss $startSeconds -t $durationSeconds '
          '-c:a copy -y "$outputPath"';

      debugPrint('✂️ Trimming audio...');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio trimmed successfully');
        return outputPath;
      } else {
        debugPrint('❌ Audio trimming failed');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Trim audio error: $e');
      return null;
    }
  }

  /// Adjust audio volume
  static Future<String?> adjustVolume({
    required String inputPath,
    required double volume, // 0.0 - 2.0
  }) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'volume_adjusted_$timestamp.m4a',
      );

      final command = '-i "$inputPath" -filter:a "volume=$volume" '
          '-c:a aac -b:a 192k -y "$outputPath"';

      debugPrint('🔊 Adjusting volume to ${(volume * 100).toInt()}%...');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Volume adjusted successfully');
        return outputPath;
      } else {
        debugPrint('❌ Volume adjustment failed');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Adjust volume error: $e');
      return null;
    }
  }

  /// Extract audio from video
  static Future<String?> extractAudioFromVideo(String videoPath) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'extracted_audio_$timestamp.m4a',
      );

      final command = '-i "$videoPath" -vn -c:a copy -y "$outputPath"';

      debugPrint('🎵 Extracting audio from video...');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio extracted successfully');
        return outputPath;
      } else {
        debugPrint('❌ Audio extraction failed');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Extract audio error: $e');
      return null;
    }
  }

  /// Get audio duration
  static Future<Duration?> getAudioDuration(String audioPath) async {
    try {
      final player = AudioPlayer();
      await player.setFilePath(audioPath);
      final duration = player.duration;
      await player.dispose();
      return duration;
    } catch (e) {
      debugPrint('❌ Get audio duration error: $e');
      return null;
    }
  }

  /// Build FFmpeg filter complex for mixing multiple audio tracks
  static String _buildMixingFilterComplex(
    List<AudioTrack> audioTracks,
    Duration videoDuration,
  ) {
    final audibleTracks = audioTracks.where((track) => !track.isMuted).toList();

    if (audibleTracks.isEmpty) {
      return '[0:v]copy[vout];[0:a]anull[aout]';
    }

    // Build filter for each audio track
    final filters = <String>[];

    for (int i = 0; i < audibleTracks.length; i++) {
      final track = audibleTracks[i];
      final inputIndex = i + 1; // 0 is video

      // Volume adjustment
      var filter = '[$inputIndex:a]volume=${track.volume}';

      // Fade in
      if (track.fadeIn != null) {
        filter += ',afade=t=in:d=${track.fadeIn!.inMilliseconds / 1000.0}';
      }

      // Fade out
      if (track.fadeOut != null) {
        final fadeOutStart =
            videoDuration.inMilliseconds - track.fadeOut!.inMilliseconds;
        filter +=
            ',afade=t=out:st=${fadeOutStart / 1000.0}:d=${track.fadeOut!.inMilliseconds / 1000.0}';
      }

      // Delay for start time
      if (track.startTime > Duration.zero) {
        filter +=
            ',adelay=${track.startTime.inMilliseconds}|${track.startTime.inMilliseconds}';
      }

      filter += '[a$i]';
      filters.add(filter);
    }

    // Mix all audio tracks
    final trackLabels =
        List.generate(audibleTracks.length, (i) => '[a$i]').join('');
    filters.add(
        '$trackLabels${audibleTracks.length > 1 ? 'amix=inputs=${audibleTracks.length}:' : ''}normalize=1[aout]');

    // Video pass-through
    filters.insert(0, '[0:v]copy[vout]');

    return filters.join(';');
  }

  /// Apply fade in/out to audio
  static Future<String?> applyFade({
    required String inputPath,
    Duration? fadeIn,
    Duration? fadeOut,
    required Duration totalDuration,
  }) async {
    try {
      if (fadeIn == null && fadeOut == null) {
        return inputPath;
      }

      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        tempDir.path,
        'faded_audio_$timestamp.m4a',
      );

      var filterString = '';

      if (fadeIn != null) {
        filterString += 'afade=t=in:d=${fadeIn.inMilliseconds / 1000.0}';
      }

      if (fadeOut != null) {
        if (filterString.isNotEmpty) filterString += ',';
        final fadeOutStart =
            totalDuration.inMilliseconds - fadeOut.inMilliseconds;
        filterString +=
            'afade=t=out:st=${fadeOutStart / 1000.0}:d=${fadeOut.inMilliseconds / 1000.0}';
      }

      final command = '-i "$inputPath" -filter:a "$filterString" '
          '-c:a aac -b:a 192k -y "$outputPath"';

      debugPrint('🎚️ Applying fade effects...');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Fade applied successfully');
        return outputPath;
      } else {
        debugPrint('❌ Fade application failed');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Apply fade error: $e');
      return null;
    }
  }

  /// Dispose resources
  static Future<void> dispose() async {
    try {
      await _player.dispose();
      await _recorder.dispose();
    } catch (e) {
      debugPrint('❌ Dispose error: $e');
    }
  }
}
