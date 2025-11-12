import 'video_segment.dart';

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
  final bool isFlashOn;
  final bool isFrontCamera;
  final double zoomLevel;
  final bool isPhotoMode;
  final String? lastPhotoPath;

  const CameraRecordingState({
    this.state = RecordingState.idle,
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
    this.isFlashOn = false,
    this.isFrontCamera = true,
    this.zoomLevel = 1.0,
    this.isPhotoMode = false,
    this.lastPhotoPath,
  });

  bool get canRecord => totalDuration < maxDuration && state != RecordingState.processing;
  bool get hasSegments => segments.isNotEmpty;
  double get progress => maxDuration.inMilliseconds > 0
      ? totalDuration.inMilliseconds / maxDuration.inMilliseconds
      : 0.0;

  CameraRecordingState copyWith({
    RecordingState? state,
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
    bool? isFlashOn,
    bool? isFrontCamera,
    double? zoomLevel,
    bool? isPhotoMode,
    String? lastPhotoPath,
  }) {
    return CameraRecordingState(
      state: state ?? this.state,
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
      isFlashOn: isFlashOn ?? this.isFlashOn,
      isFrontCamera: isFrontCamera ?? this.isFrontCamera,
      zoomLevel: zoomLevel ?? this.zoomLevel,
      isPhotoMode: isPhotoMode ?? this.isPhotoMode,
      lastPhotoPath: lastPhotoPath ?? this.lastPhotoPath,
    );
  }
}
