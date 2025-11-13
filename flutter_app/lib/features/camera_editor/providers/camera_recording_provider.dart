import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import 'package:uuid/uuid.dart';
import '../models/camera_recording_state.dart';
import '../models/video_segment.dart';
import '../models/camera_mode.dart';
import '../models/flash_mode.dart';

/// Camera recording state provider
final cameraRecordingProvider =
    StateNotifierProvider<CameraRecordingNotifier, CameraRecordingState>(
  (ref) => CameraRecordingNotifier(),
);

class CameraRecordingNotifier extends StateNotifier<CameraRecordingState> {
  CameraRecordingNotifier() : super(const CameraRecordingState());

  final _uuid = const Uuid();

  /// Add a new video segment
  void addSegment(String filePath, Duration duration) {
    final segment = VideoSegment(
      id: _uuid.v4(),
      filePath: filePath,
      duration: duration,
      speed: state.currentSpeed,
      filterName: state.selectedFilter,
      timestamp: DateTime.now(),
    );

    final newSegments = [...state.segments, segment];
    final newTotalDuration = _calculateTotalDuration(newSegments);

    state = state.copyWith(
      segments: newSegments,
      totalDuration: newTotalDuration,
      state: RecordingState.idle,
    );
  }

  /// Remove last segment (undo)
  void removeLastSegment() {
    if (state.segments.isEmpty) return;

    final newSegments = state.segments.sublist(0, state.segments.length - 1);
    final newTotalDuration = _calculateTotalDuration(newSegments);

    state = state.copyWith(
      segments: newSegments,
      totalDuration: newTotalDuration,
    );
  }

  /// Clear all segments
  void clearSegments() {
    state = state.copyWith(
      segments: [],
      totalDuration: Duration.zero,
      state: RecordingState.idle,
    );
  }

  /// Set recording state
  void setRecordingState(RecordingState recordingState) {
    state = state.copyWith(state: recordingState);
  }

  /// Set current speed
  void setSpeed(double speed) {
    state = state.copyWith(currentSpeed: speed);
  }

  /// Set selected filter
  void setFilter(String? filterName) {
    state = state.copyWith(selectedFilter: filterName);
  }

  /// Set timer (null, 3, or 10 seconds)
  void setTimer(int? seconds) {
    state = state.copyWith(timerSeconds: seconds);
  }

  /// Start countdown
  void startCountdown() {
    if (state.timerSeconds == null) return;

    state = state.copyWith(
      isCountingDown: true,
      countdownRemaining: state.timerSeconds!,
    );
  }

  /// Update countdown
  void updateCountdown(int remaining) {
    state = state.copyWith(countdownRemaining: remaining);

    if (remaining == 0) {
      state = state.copyWith(
        isCountingDown: false,
        countdownRemaining: 0,
      );
    }
  }

  /// Cancel countdown
  void cancelCountdown() {
    state = state.copyWith(
      isCountingDown: false,
      countdownRemaining: 0,
    );
  }

  /// Set selected sound
  void setSound(String? soundId, Duration? duration) {
    state = state.copyWith(
      selectedSoundId: soundId,
      soundDuration: duration,
      maxDuration: duration ?? const Duration(seconds: 60),
    );
  }

  /// Cycle through flash modes (Off → Auto → On → Off)
  void toggleFlash() {
    final nextMode = state.flashMode.next();
    state = state.copyWith(flashMode: nextMode);
  }

  /// Set specific flash mode
  void setFlashMode(AppFlashMode flashMode) {
    state = state.copyWith(flashMode: flashMode);
  }

  /// Toggle camera (front/back)
  void toggleCamera() {
    state = state.copyWith(isFrontCamera: !state.isFrontCamera);
  }

  /// Set zoom level
  void setZoom(double zoom) {
    state = state.copyWith(zoomLevel: zoom.clamp(1.0, 10.0));
  }
  
  /// Set content type (Post or Story)
  void setContentType(ContentType contentType) {
    state = state.copyWith(contentType: contentType);
  }

  /// Calculate total duration from segments
  Duration _calculateTotalDuration(List<VideoSegment> segments) {
    return segments.fold<Duration>(
      Duration.zero,
      (total, segment) => total + segment.duration,
    );
  }

  /// Reset to initial state
  void reset() {
    state = const CameraRecordingState();
  }

  /// Set camera mode (Live/15s/60s/10m/Photo)
  void setMode(CameraMode mode) {
    // Update mode and maxDuration based on selected mode
    final maxDuration = mode.maxDuration;
    
    state = state.copyWith(
      mode: mode,
      maxDuration: maxDuration,
    );
    
    // Clear segments when switching to photo or live mode
    if (mode.isPhotoMode || mode.isLiveMode) {
      clearSegments();
    }
  }

  /// Toggle between photo and video mode (backward compatibility)
  void togglePhotoMode() {
    if (state.isPhotoMode) {
      // Switch from photo to video
      setMode(CameraMode.video60s);
    } else {
      // Switch from video to photo
      setMode(CameraMode.photo);
    }
  }

  /// Set last captured photo path
  void setLastPhoto(String path) {
    state = state.copyWith(lastPhotoPath: path);
  }

  /// Delete last segment (for UI delete button)
  void deleteLastSegment() {
    removeLastSegment();
  }
}
