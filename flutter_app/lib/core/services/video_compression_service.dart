import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Video compression quality presets
enum CompressionQuality {
  low,    // CRF 28, 720p, 1Mbps
  medium, // CRF 23, 1080p, 2.5Mbps
  high,   // CRF 18, 1080p, 5Mbps
}

/// Video compression service using FFmpeg
class VideoCompressionService {
  /// Compress video for upload
  /// 
  /// This reduces file size while maintaining acceptable quality
  /// Uses H.264 codec for maximum compatibility
  static Future<VideoCompressionResult?> compressVideo({
    required String inputPath,
    CompressionQuality quality = CompressionQuality.medium,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🎬 Starting video compression...');
      debugPrint('   Input: $inputPath');
      debugPrint('   Quality: $quality');

      // Verify input file exists
      final inputFile = File(inputPath);
      if (!await inputFile.exists()) {
        debugPrint('❌ Input file not found');
        return null;
      }

      final inputSize = await inputFile.length();
      debugPrint('   Input size: ${(inputSize / 1024 / 1024).toStringAsFixed(2)} MB');

      // Create output path
      final directory = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        directory.path,
        'compressed_$timestamp.mp4',
      );

      // Get compression parameters based on quality
      final params = _getCompressionParams(quality);

      // Build FFmpeg command
      final command = '-i "$inputPath" '
          '-c:v libx264 '
          '-preset ${params.preset} '
          '-crf ${params.crf} '
          '-maxrate ${params.maxBitrate} '
          '-bufsize ${params.bufsize} '
          '-vf "scale=${params.width}:${params.height}:force_original_aspect_ratio=decrease" '
          '-c:a aac '
          '-b:a ${params.audioBitrate} '
          '-movflags +faststart ' // Enable fast start for web playback
          '-y ' // Overwrite output
          '"$outputPath"';

      debugPrint('   Command: $command');

      // Execute compression with progress tracking
      Duration? inputDuration;
      double progress = 0.0;

      final session = await FFmpegKit.executeAsync(
        command,
        (session) async {
          final returnCode = await session.getReturnCode();
          if (ReturnCode.isSuccess(returnCode)) {
            debugPrint('✅ Video compression completed');
          } else {
            debugPrint('❌ Compression failed: ${await session.getOutput()}');
          }
        },
        null, // Log callback
        (statistics) {
          // Calculate progress from statistics
          if (inputDuration != null) {
            final currentTime = statistics.getTime();
            if (currentTime > 0) {
              progress = (currentTime / inputDuration.inMilliseconds).clamp(0.0, 1.0);
              onProgress?.call(progress);
            }
          }
        },
      );

      // Get input duration for progress calculation
      final mediaInfo = await FFmpegKit.execute('-i "$inputPath"');
      final output = await mediaInfo.getOutput();
      inputDuration = _extractDuration(output ?? '');

      // Wait for completion
      await session.getReturnCode();
      final returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        debugPrint('❌ Compression failed with return code: $returnCode');
        return null;
      }

      // Verify output file
      final outputFile = File(outputPath);
      if (!await outputFile.exists()) {
        debugPrint('❌ Output file not created');
        return null;
      }

      final outputSize = await outputFile.length();
      final compressionRatio = ((1 - outputSize / inputSize) * 100);

      debugPrint('✅ Compression successful!');
      debugPrint('   Output: $outputPath');
      debugPrint('   Output size: ${(outputSize / 1024 / 1024).toStringAsFixed(2)} MB');
      debugPrint('   Compression: ${compressionRatio.toStringAsFixed(1)}%');

      onProgress?.call(1.0);

      return VideoCompressionResult(
        outputPath: outputPath,
        originalSize: inputSize,
        compressedSize: outputSize,
        compressionRatio: compressionRatio,
      );

    } catch (e) {
      debugPrint('❌ Compression error: $e');
      return null;
    }
  }

  /// Get compression parameters based on quality preset
  static _CompressionParams _getCompressionParams(CompressionQuality quality) {
    switch (quality) {
      case CompressionQuality.low:
        return _CompressionParams(
          preset: 'fast',
          crf: 28,
          maxBitrate: '1M',
          bufsize: '2M',
          width: 1280,
          height: 720,
          audioBitrate: '96k',
        );
      case CompressionQuality.medium:
        return _CompressionParams(
          preset: 'medium',
          crf: 23,
          maxBitrate: '2.5M',
          bufsize: '5M',
          width: 1920,
          height: 1080,
          audioBitrate: '128k',
        );
      case CompressionQuality.high:
        return _CompressionParams(
          preset: 'slow',
          crf: 18,
          maxBitrate: '5M',
          bufsize: '10M',
          width: 1920,
          height: 1080,
          audioBitrate: '192k',
        );
    }
  }

  /// Extract video duration from FFmpeg output
  static Duration? _extractDuration(String output) {
    try {
      final regex = RegExp(r'Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})');
      final match = regex.firstMatch(output);
      
      if (match != null) {
        final hours = int.parse(match.group(1)!);
        final minutes = int.parse(match.group(2)!);
        final seconds = int.parse(match.group(3)!);
        final centiseconds = int.parse(match.group(4)!);
        
        return Duration(
          hours: hours,
          minutes: minutes,
          seconds: seconds,
          milliseconds: centiseconds * 10,
        );
      }
    } catch (e) {
      debugPrint('Error extracting duration: $e');
    }
    return null;
  }

  /// Check if video needs compression
  static Future<bool> shouldCompress(String videoPath) async {
    try {
      final file = File(videoPath);
      if (!await file.exists()) return false;

      final size = await file.length();
      const threshold = 50 * 1024 * 1024; // 50MB

      return size > threshold;
    } catch (e) {
      debugPrint('Error checking compression need: $e');
      return false;
    }
  }

  /// Get estimated output size
  static Future<int> estimateCompressedSize(
    String videoPath,
    CompressionQuality quality,
  ) async {
    try {
      final file = File(videoPath);
      final originalSize = await file.length();

      // Rough estimation based on quality
      double ratio;
      switch (quality) {
        case CompressionQuality.low:
          ratio = 0.3; // 70% reduction
          break;
        case CompressionQuality.medium:
          ratio = 0.4; // 60% reduction
          break;
        case CompressionQuality.high:
          ratio = 0.6; // 40% reduction
          break;
      }

      return (originalSize * ratio).toInt();
    } catch (e) {
      debugPrint('Error estimating size: $e');
      return 0;
    }
  }
}

/// Compression parameters
class _CompressionParams {
  final String preset;
  final int crf;
  final String maxBitrate;
  final String bufsize;
  final int width;
  final int height;
  final String audioBitrate;

  _CompressionParams({
    required this.preset,
    required this.crf,
    required this.maxBitrate,
    required this.bufsize,
    required this.width,
    required this.height,
    required this.audioBitrate,
  });
}

/// Video compression result
class VideoCompressionResult {
  final String outputPath;
  final int originalSize;
  final int compressedSize;
  final double compressionRatio;

  VideoCompressionResult({
    required this.outputPath,
    required this.originalSize,
    required this.compressedSize,
    required this.compressionRatio,
  });

  String get originalSizeMB => (originalSize / 1024 / 1024).toStringAsFixed(2);
  String get compressedSizeMB => (compressedSize / 1024 / 1024).toStringAsFixed(2);
  String get compressionPercentage => compressionRatio.toStringAsFixed(1);
}
