import 'dart:io';
import 'dart:ui';
import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/return_code.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show Color;
import 'package:path_provider/path_provider.dart';
import '../models/video_editing_models.dart';

/// Service for FFmpeg video processing operations
class FFmpegVideoProcessor {
  /// Stitch multiple video segments into one file
  static Future<String?> stitchSegments({
    required List<String> segmentPaths,
    required String outputPath,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🎬 Stitching ${segmentPaths.length} segments...');

      // Create concat file list
      final tempDir = await getTemporaryDirectory();
      final concatFile = File('${tempDir.path}/concat_list.txt');
      final concatContent = segmentPaths
          .map((path) => "file '$path'")
          .join('\n');
      await concatFile.writeAsString(concatContent);

      // FFmpeg command to concat videos
      final command =
          '-f concat -safe 0 -i ${concatFile.path} -c copy $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Segments stitched successfully');
        await concatFile.delete();
        return outputPath;
      } else {
        debugPrint('❌ Stitching failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Stitching error: $e');
      return null;
    }
  }

  /// Trim video to specified time range
  static Future<String?> trimVideo({
    required String inputPath,
    required String outputPath,
    required Duration startTime,
    required Duration endTime,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('✂️ Trimming video: ${startTime.inSeconds}s - ${endTime.inSeconds}s');

      final duration = endTime - startTime;
      final command =
          '-i $inputPath -ss ${_formatDuration(startTime)} '
          '-t ${_formatDuration(duration)} -c copy $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Video trimmed successfully');
        return outputPath;
      } else {
        debugPrint('❌ Trimming failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Trimming error: $e');
      return null;
    }
  }

  /// Apply speed adjustment to video
  static Future<String?> adjustSpeed({
    required String inputPath,
    required String outputPath,
    required double speed,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('⚡ Adjusting speed to ${speed}x');

      // Calculate video and audio speed factors
      final videoSpeed = 1 / speed;
      final audioSpeed = speed;

      final command =
          '-i $inputPath -filter_complex '
          '"[0:v]setpts=$videoSpeed*PTS[v];[0:a]atempo=$audioSpeed[a]" '
          '-map "[v]" -map "[a]" $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Speed adjusted successfully');
        return outputPath;
      } else {
        debugPrint('❌ Speed adjustment failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Speed adjustment error: $e');
      return null;
    }
  }

  /// Apply color filter to video
  static Future<String?> applyFilter({
    required String inputPath,
    required String outputPath,
    required String filterName,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🎨 Applying filter: $filterName');

      final filterCommand = _getFilterCommand(filterName);
      if (filterCommand == null) {
        debugPrint('⚠️ Unknown filter: $filterName');
        return inputPath;
      }

      final command = '-i $inputPath -vf "$filterCommand" -c:a copy $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Filter applied successfully');
        return outputPath;
      } else {
        debugPrint('❌ Filter application failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Filter application error: $e');
      return null;
    }
  }

  /// Burn text overlays into video
  static Future<String?> burnTextOverlays({
    required String inputPath,
    required String outputPath,
    required List<TextOverlay> textOverlays,
    required Size videoSize,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('📝 Burning ${textOverlays.length} text overlays');

      if (textOverlays.isEmpty) return inputPath;

      // Build drawtext filters
      final filters = <String>[];
      for (final overlay in textOverlays) {
        final x = (overlay.position.dx * videoSize.width).toInt();
        final y = (overlay.position.dy * videoSize.height).toInt();
        final startSec = overlay.startTime.inMilliseconds / 1000;
        final endSec = overlay.endTime.inMilliseconds / 1000;

        final filter =
            "drawtext=text='${_escapeText(overlay.text)}'"
            ":x=$x:y=$y"
            ":fontsize=${overlay.fontSize.toInt()}"
            ":fontcolor=${_colorToHex(overlay.color)}"
            ":enable='between(t,$startSec,$endSec)'";

        filters.add(filter);
      }

      final filterChain = filters.join(',');
      final command = '-i $inputPath -vf "$filterChain" -c:a copy $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Text overlays burned successfully');
        return outputPath;
      } else {
        debugPrint('❌ Text burning failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Text burning error: $e');
      return null;
    }
  }

  /// Process complete video editing project
  static Future<String?> processVideoProject({
    required VideoEditingProject project,
    required String outputPath,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🎬 Processing video project: ${project.id}');
      final tempDir = await getTemporaryDirectory();
      String currentPath = '';

      // Step 1: Stitch segments if multiple
      onProgress?.call(0.1);
      if (project.segmentPaths.length > 1) {
        final stitchedPath = '${tempDir.path}/stitched_${project.id}.mp4';
        final result = await stitchSegments(
          segmentPaths: project.segmentPaths,
          outputPath: stitchedPath,
        );
        if (result == null) return null;
        currentPath = result;
      } else {
        currentPath = project.segmentPaths.first;
      }

      // Step 2: Trim if needed
      onProgress?.call(0.3);
      if (project.isTrimmed) {
        final trimmedPath = '${tempDir.path}/trimmed_${project.id}.mp4';
        final result = await trimVideo(
          inputPath: currentPath,
          outputPath: trimmedPath,
          startTime: project.trimStart,
          endTime: project.trimEnd,
        );
        if (result == null) return null;
        currentPath = result;
      }

      // Step 3: Apply speed if not 1.0x
      onProgress?.call(0.5);
      if (project.speed != 1.0) {
        final speedPath = '${tempDir.path}/speed_${project.id}.mp4';
        final result = await adjustSpeed(
          inputPath: currentPath,
          outputPath: speedPath,
          speed: project.speed,
        );
        if (result == null) return null;
        currentPath = result;
      }

      // Step 4: Apply filter if selected
      onProgress?.call(0.7);
      if (project.selectedFilter != null) {
        final filterPath = '${tempDir.path}/filter_${project.id}.mp4';
        final result = await applyFilter(
          inputPath: currentPath,
          outputPath: filterPath,
          filterName: project.selectedFilter!,
        );
        if (result == null) return null;
        currentPath = result;
      }

      // Step 5: Burn text overlays
      onProgress?.call(0.9);
      if (project.hasTextOverlays) {
        final textPath = outputPath;
        final result = await burnTextOverlays(
          inputPath: currentPath,
          outputPath: textPath,
          textOverlays: project.textOverlays,
          videoSize: const Size(1920, 1080), // TODO: Get actual video size
        );
        if (result == null) return null;
        currentPath = result;
      } else {
        // Copy to output path
        await File(currentPath).copy(outputPath);
      }

      onProgress?.call(1.0);
      debugPrint('✅ Video processing complete');
      return outputPath;
    } catch (e) {
      debugPrint('❌ Video processing error: $e');
      return null;
    }
  }

  /// Generate video thumbnail at specific time
  static Future<String?> generateThumbnail({
    required String videoPath,
    required String outputPath,
    Duration? timeOffset,
  }) async {
    try {
      final offset = timeOffset ?? Duration.zero;
      final command =
          '-i $videoPath -ss ${_formatDuration(offset)} '
          '-vframes 1 -vf scale=320:-1 $outputPath';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      }
      return null;
    } catch (e) {
      debugPrint('❌ Thumbnail generation error: $e');
      return null;
    }
  }

  /// Get video information (duration, resolution, etc.)
  static Future<Map<String, dynamic>?> getVideoInfo(String videoPath) async {
    try {
      final command = '-i $videoPath';
      await FFmpegKit.execute(command);
      // Note: FFmpeg output contains video information but parsing is complex
      // For now, just return basic info

      // Parse FFmpeg output for video info
      // This is a simplified version
      return {
        'path': videoPath,
        'exists': await File(videoPath).exists(),
      };
    } catch (e) {
      debugPrint('❌ Get video info error: $e');
      return null;
    }
  }

  /// Merge video with audio track
  /// This will replace the original video audio with the provided audio
  static Future<String?> mergeVideoAudio({
    required String videoPath,
    required String audioPath,
    required String outputPath,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🔊 Merging video with audio...');
      debugPrint('Video: $videoPath');
      debugPrint('Audio: $audioPath');

      // FFmpeg command to merge video and audio
      // -i: input files
      // -c:v copy: copy video codec (no re-encoding)
      // -c:a aac: encode audio to AAC
      // -b:a 192k: audio bitrate 192kbps
      // -map 0:v:0: use video stream from first input
      // -map 1:a:0: use audio stream from second input
      // -shortest: finish when shortest stream ends
      final command =
          '-i "$videoPath" -i "$audioPath" '
          '-c:v copy -c:a aac -b:a 192k '
          '-map 0:v:0 -map 1:a:0 '
          '-shortest '
          '"$outputPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        debugPrint('✅ Video and audio merged successfully');
        onProgress?.call(1.0);
        return outputPath;
      } else {
        debugPrint('❌ Merging failed: ${await session.getOutput()}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ Merge error: $e');
      return null;
    }
  }

  // Helper methods

  static String _formatDuration(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  static String _escapeText(String text) {
    return text
        .replaceAll("'", "\\'")
        .replaceAll('"', '\\"')
        .replaceAll(':', '\\:');
  }

  static String _colorToHex(Color color) {
    return '0x${color.value.toRadixString(16).padLeft(8, '0')}';
  }

  static String? _getFilterCommand(String filterName) {
    switch (filterName.toLowerCase()) {
      case 'vivid':
        return 'eq=saturation=1.5';
      case 'warm':
        return 'colorchannelmixer=rr=1.2:gg=1.1:bb=0.9';
      case 'cool':
        return 'colorchannelmixer=rr=0.9:gg=1.0:bb=1.2';
      case 'b&w':
      case 'bw':
        return 'hue=s=0';
      case 'vintage':
        return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
      default:
        return null;
    }
  }
}
