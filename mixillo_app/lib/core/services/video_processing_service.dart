import 'dart:async';
import 'dart:io';
import 'dart:developer' as developer;
import 'package:path_provider/path_provider.dart';
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import '../../features/camera/models/video_clip.dart';

/// FFmpeg-based video processing service
/// Handles merging, speed adjustment, filters, audio mixing, thumbnail generation
class VideoProcessingService {
  /// Process multiple video clips into a single video
  /// 
  /// Steps:
  /// 1. Apply speed adjustments to each clip
  /// 2. Apply visual filters to each clip
  /// 3. Merge all clips into one video
  /// 4. Add background audio (if provided)
  /// 5. Generate thumbnail
  /// 6. Compress to target quality
  Future<ProcessedVideo> processVideo(
    VideoProcessingSettings settings, {
    Function(double progress)? onProgress,
  }) async {
    developer.log('🎬 Starting video processing...');
    
    try {
      // Create temp directory for intermediate files
      final tempDir = await _getTempDirectory();
      final outputDir = await _getOutputDirectory();
      
      // Step 1: Process each clip (speed + filter)
      final processedClips = <String>[];
      int clipIndex = 0;
      
      for (final clip in settings.clips) {
        onProgress?.call((clipIndex / settings.clips.length) * 0.4);
        
        final processedPath = await _processClip(
          clip,
          tempDir,
          clipIndex,
        );
        processedClips.add(processedPath);
        clipIndex++;
      }
      
      developer.log('✅ Processed ${processedClips.length} clips');
      onProgress?.call(0.5);
      
      // Step 2: Merge all clips
      final mergedPath = await _mergeClips(
        processedClips,
        tempDir,
      );
      
      developer.log('✅ Merged clips into: $mergedPath');
      onProgress?.call(0.7);
      
      // Step 3: Add audio (if provided)
      String finalVideoPath = mergedPath;
      if (settings.audioPath != null) {
        finalVideoPath = await _addAudio(
          mergedPath,
          settings.audioPath!,
          settings.audioVolume,
          tempDir,
        );
        developer.log('✅ Added audio');
      }
      onProgress?.call(0.8);
      
      // Step 4: Compress and save to output directory
      final outputPath = '${outputDir.path}/mixillo_${DateTime.now().millisecondsSinceEpoch}.${settings.outputFormat}';
      await _compressVideo(
        finalVideoPath,
        outputPath,
        settings.quality,
      );
      
      developer.log('✅ Compressed and saved to: $outputPath');
      onProgress?.call(0.9);
      
      // Step 5: Generate thumbnail
      final thumbnailPath = await _generateThumbnail(
        outputPath,
        outputDir,
      );
      
      developer.log('✅ Generated thumbnail: $thumbnailPath');
      onProgress?.call(1.0);
      
      // Step 6: Get video info
      final videoInfo = await _getVideoInfo(outputPath);
      
      // Clean up temp files
      await _cleanupTempFiles(tempDir);
      
      developer.log('🎉 Video processing complete!');
      
      return ProcessedVideo(
        outputPath: outputPath,
        thumbnailPath: thumbnailPath,
        duration: videoInfo['duration'] as Duration,
        fileSizeBytes: videoInfo['size'] as int,
        width: videoInfo['width'] as int,
        height: videoInfo['height'] as int,
      );
      
    } catch (e, stackTrace) {
      developer.log('❌ Video processing failed: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// Process a single clip (apply speed and filter)
  Future<String> _processClip(
    VideoClip clip,
    Directory tempDir,
    int index,
  ) async {
    final outputPath = '${tempDir.path}/processed_clip_$index.mp4';
    
    // Build FFmpeg filter chain
    final filters = <String>[];
    
    // Apply speed adjustment
    if (clip.speed != 1.0) {
      // setpts adjusts video playback speed
      // 0.5x = 2.0*PTS (slower), 2.0x = 0.5*PTS (faster)
      final ptsMultiplier = 1.0 / clip.speed;
      filters.add('setpts=${ptsMultiplier}*PTS');
      
      // Also adjust audio speed to match
      // atempo only works for 0.5x-2.0x, chain multiple for extreme speeds
      final audioFilters = _buildAudioTempoFilters(clip.speed);
      if (audioFilters.isNotEmpty) {
        filters.add(audioFilters);
      }
    }
    
    // Apply visual filter
    if (clip.filter != null && clip.filter != 'None') {
      filters.add(_getFilterCommand(clip.filter!));
    }
    
    // Build FFmpeg command
    String command;
    if (filters.isEmpty) {
      // No processing needed, just copy
      command = '-i "${clip.path}" -c copy "$outputPath"';
    } else {
      final videoFilter = filters.where((f) => !f.startsWith('atempo')).join(',');
      final audioFilter = filters.where((f) => f.startsWith('atempo')).join(',');
      
      command = '-i "${clip.path}"';
      if (videoFilter.isNotEmpty) {
        command += ' -vf "$videoFilter"';
      }
      if (audioFilter.isNotEmpty) {
        command += ' -af "$audioFilter"';
      }
      command += ' -c:v libx264 -preset ultrafast -crf 23 "$outputPath"';
    }
    
    developer.log('Processing clip $index: $command');
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (!ReturnCode.isSuccess(returnCode)) {
      final failLog = await session.getFailStackTrace();
      throw Exception('Failed to process clip $index: $failLog');
    }
    
    return outputPath;
  }
  
  /// Merge multiple video clips into one
  Future<String> _mergeClips(
    List<String> clipPaths,
    Directory tempDir,
  ) async {
    if (clipPaths.isEmpty) {
      throw Exception('No clips to merge');
    }
    
    if (clipPaths.length == 1) {
      return clipPaths.first;
    }
    
    final outputPath = '${tempDir.path}/merged.mp4';
    
    // Create concat file for FFmpeg
    final concatFilePath = '${tempDir.path}/concat_list.txt';
    final concatFile = File(concatFilePath);
    
    // Write file paths in FFmpeg concat format
    final concatContent = clipPaths.map((path) => "file '$path'").join('\n');
    await concatFile.writeAsString(concatContent);
    
    // Merge using concat demuxer (fast, no re-encoding)
    final command = '-f concat -safe 0 -i "$concatFilePath" -c copy "$outputPath"';
    
    developer.log('Merging ${clipPaths.length} clips: $command');
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (!ReturnCode.isSuccess(returnCode)) {
      final failLog = await session.getFailStackTrace();
      throw Exception('Failed to merge clips: $failLog');
    }
    
    return outputPath;
  }
  
  /// Add background audio to video
  Future<String> _addAudio(
    String videoPath,
    String audioPath,
    double volume,
    Directory tempDir,
  ) async {
    final outputPath = '${tempDir.path}/with_audio.mp4';
    
    // Mix video with audio, loop audio if shorter than video
    final command = '-i "$videoPath" -stream_loop -1 -i "$audioPath" '
        '-filter_complex "[1:a]volume=$volume[a];[a]aloop=1[out]" '
        '-map 0:v -map [out] -c:v copy -c:a aac -shortest "$outputPath"';
    
    developer.log('Adding audio: $command');
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (!ReturnCode.isSuccess(returnCode)) {
      final failLog = await session.getFailStackTrace();
      throw Exception('Failed to add audio: $failLog');
    }
    
    return outputPath;
  }
  
  /// Compress video to target quality
  Future<void> _compressVideo(
    String inputPath,
    String outputPath,
    VideoQuality quality,
  ) async {
    final preset = _getQualityPreset(quality);
    
    // Use H.264 codec with target bitrate
    final command = '-i "$inputPath" '
        '-c:v libx264 -preset ${preset['preset']} '
        '-b:v ${preset['bitrate']} '
        '-vf scale=${preset['width']}:${preset['height']} '
        '-c:a aac -b:a 128k '
        '-movflags +faststart '  // Enable streaming
        '"$outputPath"';
    
    developer.log('Compressing video: $command');
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (!ReturnCode.isSuccess(returnCode)) {
      final failLog = await session.getFailStackTrace();
      throw Exception('Failed to compress video: $failLog');
    }
  }
  
  /// Generate thumbnail from video
  Future<String> _generateThumbnail(
    String videoPath,
    Directory outputDir,
  ) async {
    final thumbnailPath = '${outputDir.path}/thumbnail_${DateTime.now().millisecondsSinceEpoch}.jpg';
    
    // Extract frame at 1 second (or first frame if video is shorter)
    final command = '-i "$videoPath" -ss 00:00:01.000 -vframes 1 '
        '-vf scale=480:854 '  // 9:16 aspect ratio thumbnail
        '"$thumbnailPath"';
    
    developer.log('Generating thumbnail: $command');
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (!ReturnCode.isSuccess(returnCode)) {
      final failLog = await session.getFailStackTrace();
      throw Exception('Failed to generate thumbnail: $failLog');
    }
    
    return thumbnailPath;
  }
  
  /// Get video information (duration, size, dimensions)
  Future<Map<String, dynamic>> _getVideoInfo(String videoPath) async {
    final file = File(videoPath);
    final fileSize = await file.length();
    
    // Use FFprobe to get video metadata
    final command = '-i "$videoPath" -show_entries format=duration:stream=width,height '
        '-v quiet -of csv="p=0"';
    
    final session = await FFmpegKit.execute(command);
    final output = await session.getOutput();
    
    // Parse output: "1920,1080,45.5"
    final parts = output?.split(',') ?? [];
    
    return {
      'duration': Duration(seconds: double.parse(parts.length > 2 ? parts[2] : '0').toInt()),
      'size': fileSize,
      'width': int.parse(parts.isNotEmpty ? parts[0] : '1080'),
      'height': int.parse(parts.length > 1 ? parts[1] : '1920'),
    };
  }
  
  /// Build audio tempo filters for speed adjustment
  /// atempo only supports 0.5x-2.0x, chain multiple for extreme speeds
  String _buildAudioTempoFilters(double speed) {
    if (speed == 1.0) return '';
    
    final filters = <String>[];
    double remainingSpeed = speed;
    
    // Handle speeds < 0.5x (very slow)
    while (remainingSpeed < 0.5) {
      filters.add('atempo=0.5');
      remainingSpeed *= 2;
    }
    
    // Handle speeds > 2.0x (very fast)
    while (remainingSpeed > 2.0) {
      filters.add('atempo=2.0');
      remainingSpeed /= 2;
    }
    
    // Handle remaining speed (0.5x - 2.0x)
    if (remainingSpeed != 1.0) {
      filters.add('atempo=$remainingSpeed');
    }
    
    return filters.join(',');
  }
  
  /// Get FFmpeg filter command for visual effects
  String _getFilterCommand(String filterName) {
    switch (filterName) {
      case 'Vintage':
        return 'curves=vintage,colorbalance=rs=0.1:gs=-0.1:bs=-0.1';
      case 'B&W':
        return 'hue=s=0';
      case 'Sepia':
        return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
      case 'Vivid':
        return 'eq=saturation=1.5:contrast=1.1';
      case 'Cool':
        return 'colorbalance=bs=0.2:gs=0.1';
      case 'Warm':
        return 'colorbalance=rs=0.2:gs=0.1';
      default:
        return '';
    }
  }
  
  /// Get quality preset settings
  Map<String, dynamic> _getQualityPreset(VideoQuality quality) {
    switch (quality) {
      case VideoQuality.low:
        return {
          'width': 480,
          'height': 854,
          'bitrate': '1000k',
          'preset': 'fast',
        };
      case VideoQuality.medium:
        return {
          'width': 720,
          'height': 1280,
          'bitrate': '2500k',
          'preset': 'medium',
        };
      case VideoQuality.high:
        return {
          'width': 1080,
          'height': 1920,
          'bitrate': '5000k',
          'preset': 'medium',
        };
      case VideoQuality.ultra:
        return {
          'width': 1080,
          'height': 1920,
          'bitrate': '8000k',
          'preset': 'slow',
        };
    }
  }
  
  /// Get temp directory for intermediate files
  Future<Directory> _getTempDirectory() async {
    final appDir = await getTemporaryDirectory();
    final tempDir = Directory('${appDir.path}/video_processing');
    if (!await tempDir.exists()) {
      await tempDir.create(recursive: true);
    }
    return tempDir;
  }
  
  /// Get output directory for final videos
  Future<Directory> _getOutputDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final outputDir = Directory('${appDir.path}/Mixillo/Videos');
    if (!await outputDir.exists()) {
      await outputDir.create(recursive: true);
    }
    return outputDir;
  }
  
  /// Clean up temporary files
  Future<void> _cleanupTempFiles(Directory tempDir) async {
    try {
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
        developer.log('🧹 Cleaned up temp files');
      }
    } catch (e) {
      developer.log('⚠️ Failed to clean temp files: $e');
    }
  }
  
  /// Cancel ongoing processing
  Future<void> cancelProcessing() async {
    await FFmpegKit.cancel();
    developer.log('❌ Video processing cancelled');
  }
}
