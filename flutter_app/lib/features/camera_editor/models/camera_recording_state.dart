import 'video_segment.dart';
import 'camera_mode.dart';
import 'flash_mode.dart';

/// Camera recording state
enum RecordingState {
  idle,
  recording,
  paused,
  processing,
}

/// Camera recording state model
class CameraRecordingState {
  final RecordingState state;
  final CameraMode mode;
  final ContentType contentType;
  final List<VideoSegment> segments;
  final Duration totalDuration;
  final Duration maxDuration;
  final double currentSpeed;
  final String? selectedFilter;
  final int? timerSeconds; // null, 3, or 10
  final bool isCountingDown;
  final int countdownRemaining;
  final String? selectedSoundId;
  final Duration? soundDuration;
  final AppFlashMode flashMode;
  final bool isFrontCamera;
  final double zoomLevel;
  final String? lastPhotoPath;

  const CameraRecordingState({
    this.state = RecordingState.idle,
    this.mode = CameraMode.video60s,
    this.contentType = ContentType.post,
    this.segments = const [],
    this.totalDuration = Duration.zero,
    this.maxDuration = const Duration(seconds: 60),
    this.currentSpeed = 1.0,
    this.selectedFilter,
    this.timerSeconds,
    this.isCountingDown = false,
    this.countdownRemaining = 0,
    this.selectedSoundId,
    this.soundDuration,
    this.flashMode = AppFlashMode.off,
    this.isFrontCamera = true,
    this.zoomLevel = 1.0,
    this.lastPhotoPath,
  });

  // Computed properties based on mode
  bool get isPhotoMode => mode.isPhotoMode;
  bool get isVideoMode => mode.isVideoMode;
  bool get isLiveMode => mode.isLiveMode;
  
  // Backward compatibility
  bool get isFlashOn => flashMode != AppFlashMode.off;
  
  bool get canRecord => totalDuration < maxDuration && state != RecordingState.processing;
  bool get hasSegments => segments.isNotEmpty;
  double get progress => maxDuration.inMilliseconds > 0
      ? totalDuration.inMilliseconds / maxDuration.inMilliseconds
      : 0.0;

  CameraRecordingState copyWith({
    RecordingState? state,
    CameraMode? mode,
    ContentType? contentType,
    List<VideoSegment>? segments,
    Duration? totalDuration,
    Duration? maxDuration,
    double? currentSpeed,
    String? selectedFilter,
    int? timerSeconds,
    bool? isCountingDown,
    int? countdownRemaining,
    String? selectedSoundId,
    Duration? soundDuration,
    AppFlashMode? flashMode,
    bool? isFrontCamera,
    double? zoomLevel,
    String? lastPhotoPath,
  }) {
    return CameraRecordingState(
      state: state ?? this.state,
      mode: mode ?? this.mode,
      contentType: contentType ?? this.contentType,
      segments: segments ?? this.segments,
      totalDuration: totalDuration ?? this.totalDuration,
      maxDuration: maxDuration ?? this.maxDuration,
      currentSpeed: currentSpeed ?? this.currentSpeed,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      timerSeconds: timerSeconds ?? this.timerSeconds,
      isCountingDown: isCountingDown ?? this.isCountingDown,
      countdownRemaining: countdownRemaining ?? this.countdownRemaining,
      selectedSoundId: selectedSoundId ?? this.selectedSoundId,
      soundDuration: soundDuration ?? this.soundDuration,
      flashMode: flashMode ?? this.flashMode,
      isFrontCamera: isFrontCamera ?? this.isFrontCamera,
      zoomLevel: zoomLevel ?? this.zoomLevel,
      lastPhotoPath: lastPhotoPath ?? this.lastPhotoPath,
    );
  }
}
