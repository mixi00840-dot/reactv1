import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/video_editing_models.dart';
import '../services/ffmpeg_video_processor.dart';

/// Provider for video editor state
final videoEditorProvider =
    StateNotifierProvider<VideoEditorNotifier, VideoEditingProject?>((ref) {
  return VideoEditorNotifier();
});

/// Notifier for managing video editing state
class VideoEditorNotifier extends StateNotifier<VideoEditingProject?> {
  VideoEditorNotifier() : super(null);

  final _uuid = const Uuid();

  /// Initialize editor with video segments
  void initializeProject({
    required List<String> segmentPaths,
    required Duration totalDuration,
    String? selectedFilter,
    double speed = 1.0,
  }) {
    state = VideoEditingProject(
      id: _uuid.v4(),
      segmentPaths: segmentPaths,
      totalDuration: totalDuration,
      selectedFilter: selectedFilter,
      speed: speed,
    );
    debugPrint('📹 Video editor initialized with ${segmentPaths.length} segments');
  }

  /// Update trim positions
  void setTrimRange(Duration start, Duration end) {
    if (state == null) return;
    
    // Ensure valid range
    final validStart = Duration(
      microseconds: start.inMicroseconds.clamp(0, state!.totalDuration.inMicroseconds)
    );
    final validEnd = Duration(
      microseconds: end.inMicroseconds.clamp(validStart.inMicroseconds, state!.totalDuration.inMicroseconds)
    );

    state = state!.copyWith(
      trimStart: validStart,
      trimEnd: validEnd,
    );
    debugPrint('✂️ Trim range: ${validStart.inSeconds}s - ${validEnd.inSeconds}s');
  }

  /// Add text overlay
  void addTextOverlay({
    String? text,
    Offset? position,
    Duration? startTime,
    Duration? endTime,
  }) {
    if (state == null) return;

    final currentTime = startTime ?? Duration.zero;
    final overlay = TextOverlay(
      id: _uuid.v4(),
      text: text ?? 'Text',
      position: position ?? const Offset(0.5, 0.5),
      startTime: currentTime,
      endTime: endTime ?? state!.trimmedDuration,
    );

    final updatedOverlays = [...state!.textOverlays, overlay];
    state = state!.copyWith(textOverlays: updatedOverlays);
    debugPrint('📝 Text overlay added: "${overlay.text}"');
  }

  /// Update text overlay
  void updateTextOverlay(String id, TextOverlay updatedOverlay) {
    if (state == null) return;

    final updatedOverlays = state!.textOverlays.map((overlay) {
      return overlay.id == id ? updatedOverlay : overlay;
    }).toList();

    state = state!.copyWith(textOverlays: updatedOverlays);
  }

  /// Remove text overlay
  void removeTextOverlay(String id) {
    if (state == null) return;

    final updatedOverlays = state!.textOverlays
        .where((overlay) => overlay.id != id)
        .toList();

    state = state!.copyWith(textOverlays: updatedOverlays);
    debugPrint('🗑️ Text overlay removed');
  }

  /// Add sticker overlay
  void addStickerOverlay({
    required String stickerType,
    required String content,
    Offset? position,
    Duration? startTime,
    Duration? endTime,
  }) {
    if (state == null) return;

    final currentTime = startTime ?? Duration.zero;
    final overlay = StickerOverlay(
      id: _uuid.v4(),
      stickerType: stickerType,
      content: content,
      position: position ?? const Offset(0.5, 0.5),
      startTime: currentTime,
      endTime: endTime ?? state!.trimmedDuration,
    );

    final updatedOverlays = [...state!.stickerOverlays, overlay];
    state = state!.copyWith(stickerOverlays: updatedOverlays);
    debugPrint('🎨 Sticker overlay added: $content');
  }

  /// Update sticker overlay
  void updateStickerOverlay(String id, StickerOverlay updatedOverlay) {
    if (state == null) return;

    final updatedOverlays = state!.stickerOverlays.map((overlay) {
      return overlay.id == id ? updatedOverlay : overlay;
    }).toList();

    state = state!.copyWith(stickerOverlays: updatedOverlays);
  }

  /// Remove sticker overlay
  void removeStickerOverlay(String id) {
    if (state == null) return;

    final updatedOverlays = state!.stickerOverlays
        .where((overlay) => overlay.id != id)
        .toList();

    state = state!.copyWith(stickerOverlays: updatedOverlays);
    debugPrint('🗑️ Sticker overlay removed');
  }

  /// Update filter
  void setFilter(String? filterName) {
    if (state == null) return;
    state = state!.copyWith(selectedFilter: filterName);
    debugPrint('🎨 Filter updated: $filterName');
  }

  /// Update speed
  void setSpeed(double speed) {
    if (state == null) return;
    state = state!.copyWith(speed: speed);
    debugPrint('⚡ Speed updated: ${speed}x');
  }

  /// Toggle beauty effects
  void setBeautyEffects(bool enabled) {
    if (state == null) return;
    state = state!.copyWith(applyBeautyEffects: enabled);
    debugPrint('✨ Beauty effects: ${enabled ? "ON" : "OFF"}');
  }

  /// Export video with all edits
  Future<String?> exportVideo({
    required String outputPath,
    Function(double)? onProgress,
  }) async {
    if (state == null) {
      debugPrint('❌ No project to export');
      return null;
    }

    try {
      debugPrint('🎬 Starting video export...');
      
      final result = await FFmpegVideoProcessor.processVideoProject(
        project: state!,
        outputPath: outputPath,
        onProgress: onProgress,
      );

      if (result != null) {
        debugPrint('✅ Video exported successfully: $outputPath');
      } else {
        debugPrint('❌ Video export failed');
      }

      return result;
    } catch (e) {
      debugPrint('❌ Export error: $e');
      return null;
    }
  }

  /// Reset editor state
  void reset() {
    state = null;
    debugPrint('🔄 Video editor reset');
  }

  /// Get overlays visible at specific time
  List<TextOverlay> getVisibleTextOverlays(Duration currentTime) {
    if (state == null) return [];
    return state!.textOverlays
        .where((overlay) => overlay.isVisibleAt(currentTime))
        .toList();
  }

  List<StickerOverlay> getVisibleStickerOverlays(Duration currentTime) {
    if (state == null) return [];
    return state!.stickerOverlays
        .where((overlay) => overlay.isVisibleAt(currentTime))
        .toList();
  }
}

/// Provider for export progress
final exportProgressProvider = StateProvider<double>((ref) => 0.0);

/// Provider for current playback position
final playbackPositionProvider = StateProvider<Duration>((ref) => Duration.zero);
