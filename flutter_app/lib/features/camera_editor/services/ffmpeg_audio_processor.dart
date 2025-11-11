import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/return_code.dart';
import 'package:path/path.dart' as path;
import '../models/audio_editing_models.dart';

/// FFmpeg audio processor for mixing and effects
class FFmpegAudioProcessor {
  /// Extract audio from video file
  static Future<String?> extractAudioFromVideo({
    required String videoPath,
    required String outputPath,
  }) async {
    try {
      final arguments = [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'copy',
        '-y', // Overwrite output
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio extracted: $outputPath');
        return outputPath;
      } else {
        final output = await session.getOutput();
        debugPrint('❌ Audio extraction failed: $output');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error extracting audio: $e');
      return null;
    }
  }

  /// Apply volume adjustment to audio file
  static Future<String?> adjustVolume({
    required String inputPath,
    required String outputPath,
    required double volume, // 0.0 - 2.0 (1.0 = original)
  }) async {
    try {
      final arguments = [
        '-i', inputPath,
        '-filter:a', 'volume=$volume',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Volume adjusted: $outputPath');
        return outputPath;
      } else {
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error adjusting volume: $e');
      return null;
    }
  }

  /// Apply fade in/out effects to audio
  static Future<String?> applyFades({
    required String inputPath,
    required String outputPath,
    double fadeInSeconds = 0.0,
    double fadeOutSeconds = 0.0,
    required Duration totalDuration,
  }) async {
    try {
      if (fadeInSeconds == 0.0 && fadeOutSeconds == 0.0) {
        // No fades, just copy
        await File(inputPath).copy(outputPath);
        return outputPath;
      }

      final filters = <String>[];

      if (fadeInSeconds > 0) {
        filters.add('afade=t=in:d=$fadeInSeconds');
      }

      if (fadeOutSeconds > 0) {
        final fadeOutStart = totalDuration.inSeconds - fadeOutSeconds;
        filters.add('afade=t=out:st=$fadeOutStart:d=$fadeOutSeconds');
      }

      final filterComplex = filters.join(',');

      final arguments = [
        '-i', inputPath,
        '-af', filterComplex,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Fades applied: $outputPath');
        return outputPath;
      } else {
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error applying fades: $e');
      return null;
    }
  }

  /// Mix multiple audio tracks into one
  static Future<String?> mixAudioTracks({
    required List<AudioTrackInput> tracks,
    required String outputPath,
    required Duration totalDuration,
    Function(double)? onProgress,
  }) async {
    try {
      if (tracks.isEmpty) {
        debugPrint('❌ No tracks to mix');
        return null;
      }

      // Build input arguments
      final inputs = <String>[];
      for (final track in tracks) {
        inputs.addAll(['-i', track.filePath]);
      }

      // Build filter complex for mixing
      final filterInputs = <String>[];
      for (int i = 0; i < tracks.length; i++) {
        final track = tracks[i];
        var filter = '[$i:a]';

        // Apply volume
        if (track.volume != 1.0) {
          filter += 'volume=${track.volume}';
        }

        // Apply fade in
        if (track.fadeInSeconds > 0) {
          filter += ',afade=t=in:d=${track.fadeInSeconds}';
        }

        // Apply fade out
        if (track.fadeOutSeconds > 0) {
          final fadeOutStart = totalDuration.inSeconds - track.fadeOutSeconds;
          filter += ',afade=t=out:st=$fadeOutStart:d=${track.fadeOutSeconds}';
        }

        // Apply delay if start time is not zero
        if (track.startTime.inMilliseconds > 0) {
          filter += ',adelay=${track.startTime.inMilliseconds}|${track.startTime.inMilliseconds}';
        }

        filter += '[a$i]';
        filterInputs.add(filter);
      }

      // Mix all tracks
      final mixInputs = List.generate(tracks.length, (i) => '[a$i]').join('');
      final filterComplex = '${filterInputs.join(';')};${mixInputs}amix=inputs=${tracks.length}:duration=longest[aout]';

      final arguments = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[aout]',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-t', '${totalDuration.inSeconds}',
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio tracks mixed: $outputPath');
        return outputPath;
      } else {
        final output = await session.getOutput();
        debugPrint('❌ Audio mixing failed: $output');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error mixing audio tracks: $e');
      return null;
    }
  }

  /// Replace video audio with new audio track
  static Future<String?> replaceVideoAudio({
    required String videoPath,
    required String audioPath,
    required String outputPath,
  }) async {
    try {
      final arguments = [
        '-i', videoPath,
        '-i', audioPath,
        '-map', '0:v', // Video from first input
        '-map', '1:a', // Audio from second input
        '-c:v', 'copy', // Copy video codec
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest', // End when shortest stream ends
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Video audio replaced: $outputPath');
        return outputPath;
      } else {
        final output = await session.getOutput();
        debugPrint('❌ Audio replacement failed: $output');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error replacing audio: $e');
      return null;
    }
  }

  /// Apply audio normalization
  static Future<String?> normalizeAudio({
    required String inputPath,
    required String outputPath,
  }) async {
    try {
      // Use dynaudnorm filter for dynamic audio normalization
      final arguments = [
        '-i', inputPath,
        '-af', 'dynaudnorm',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Audio normalized: $outputPath');
        return outputPath;
      } else {
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error normalizing audio: $e');
      return null;
    }
  }

  /// Apply noise reduction (highpass filter)
  static Future<String?> reduceNoise({
    required String inputPath,
    required String outputPath,
    int highpassFrequency = 200, // Hz
  }) async {
    try {
      // Use highpass filter to remove low-frequency noise
      final arguments = [
        '-i', inputPath,
        '-af', 'highpass=f=$highpassFrequency',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-y',
        outputPath,
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Noise reduced: $outputPath');
        return outputPath;
      } else {
        return null;
      }
    } catch (e) {
      debugPrint('❌ Error reducing noise: $e');
      return null;
    }
  }

  /// Process complete audio editing project
  static Future<String?> processAudioProject({
    required AudioEditingProject project,
    required String outputVideoPath,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🎵 Processing audio project...');
      onProgress?.call(0.1);

      // Step 1: Extract original audio from video
      final tempDir = Directory.systemTemp.createTempSync('audio_mix_');
      final originalAudioPath = path.join(tempDir.path, 'original_audio.aac');
      
      final extractedAudio = await extractAudioFromVideo(
        videoPath: project.videoPath,
        outputPath: originalAudioPath,
      );

      if (extractedAudio == null) {
        debugPrint('❌ Failed to extract original audio');
        return null;
      }

      onProgress?.call(0.2);

      // Step 2: Prepare audio tracks for mixing
      final audioTracks = <AudioTrackInput>[];

      // Add original track
      if (!project.originalTrack.isMuted) {
        audioTracks.add(AudioTrackInput(
          filePath: originalAudioPath,
          volume: project.mixerSettings.originalVolume,
          startTime: Duration.zero,
          fadeInSeconds: project.originalTrack.fadeInDuration,
          fadeOutSeconds: project.originalTrack.fadeOutDuration,
        ));
      }

      onProgress?.call(0.3);

      // Step 3: Process voiceover clips
      if (project.hasVoiceover) {
        for (final clip in project.voiceoverClips) {
          if (!clip.isMuted) {
            audioTracks.add(AudioTrackInput(
              filePath: clip.filePath,
              volume: project.mixerSettings.voiceoverVolume * clip.volume,
              startTime: clip.startTime,
              fadeInSeconds: 0.5, // Default fade for voiceovers
              fadeOutSeconds: 0.5,
            ));
          }
        }
      }

      onProgress?.call(0.4);

      // Step 4: Add music track if present
      if (project.hasMusic && !project.musicTrack!.isMuted) {
        audioTracks.add(AudioTrackInput(
          filePath: project.musicTrack!.filePath!,
          volume: project.mixerSettings.musicVolume,
          startTime: Duration.zero,
          fadeInSeconds: project.musicTrack!.fadeInDuration,
          fadeOutSeconds: project.musicTrack!.fadeOutDuration,
        ));
      }

      onProgress?.call(0.5);

      // Step 5: Mix all audio tracks
      final mixedAudioPath = path.join(tempDir.path, 'mixed_audio.aac');
      final mixedAudio = await mixAudioTracks(
        tracks: audioTracks,
        outputPath: mixedAudioPath,
        totalDuration: project.videoDuration,
        onProgress: (mixProgress) {
          onProgress?.call(0.5 + (mixProgress * 0.2));
        },
      );

      if (mixedAudio == null) {
        debugPrint('❌ Failed to mix audio tracks');
        return null;
      }

      onProgress?.call(0.7);

      // Step 6: Apply audio normalization if enabled
      String finalAudioPath = mixedAudio;
      if (project.mixerSettings.enableAudioNormalization) {
        final normalizedPath = path.join(tempDir.path, 'normalized_audio.aac');
        final normalized = await normalizeAudio(
          inputPath: mixedAudio,
          outputPath: normalizedPath,
        );
        if (normalized != null) {
          finalAudioPath = normalized;
        }
      }

      onProgress?.call(0.8);

      // Step 7: Apply noise reduction if enabled
      if (project.mixerSettings.enableNoiseReduction) {
        final denoisedPath = path.join(tempDir.path, 'denoised_audio.aac');
        final denoised = await reduceNoise(
          inputPath: finalAudioPath,
          outputPath: denoisedPath,
        );
        if (denoised != null) {
          finalAudioPath = denoised;
        }
      }

      onProgress?.call(0.9);

      // Step 8: Replace video audio with mixed audio
      final result = await replaceVideoAudio(
        videoPath: project.videoPath,
        audioPath: finalAudioPath,
        outputPath: outputVideoPath,
      );

      // Cleanup temporary files
      try {
        await tempDir.delete(recursive: true);
      } catch (e) {
        debugPrint('⚠️ Failed to cleanup temp files: $e');
      }

      onProgress?.call(1.0);

      if (result != null) {
        debugPrint('✅ Audio processing complete: $outputVideoPath');
      }

      return result;
    } catch (e) {
      debugPrint('❌ Error processing audio project: $e');
      return null;
    }
  }

  /// Get audio file information
  static Future<Map<String, dynamic>?> getAudioInfo(String filePath) async {
    try {
      final arguments = [
        '-i', filePath,
        '-f', 'null',
        '-',
      ];

      final session = await FFmpegKit.execute(arguments.join(' '));
      final output = await session.getOutput();

      // Parse duration from output
      // Output contains: Duration: 00:00:10.00, start: 0.000000, bitrate: 128 kb/s
      final durationMatch = RegExp(r'Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})').firstMatch(output ?? '');
      
      if (durationMatch != null) {
        final hours = int.parse(durationMatch.group(1)!);
        final minutes = int.parse(durationMatch.group(2)!);
        final seconds = double.parse(durationMatch.group(3)!);
        
        final duration = Duration(
          hours: hours,
          minutes: minutes,
          seconds: seconds.floor(),
          milliseconds: ((seconds - seconds.floor()) * 1000).round(),
        );

        return {
          'duration': duration,
          'durationSeconds': duration.inSeconds,
          'raw': output,
        };
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error getting audio info: $e');
      return null;
    }
  }
}

/// Audio track input for mixing
class AudioTrackInput {
  final String filePath;
  final double volume;
  final Duration startTime;
  final double fadeInSeconds;
  final double fadeOutSeconds;

  const AudioTrackInput({
    required this.filePath,
    this.volume = 1.0,
    this.startTime = Duration.zero,
    this.fadeInSeconds = 0.0,
    this.fadeOutSeconds = 0.0,
  });
}
