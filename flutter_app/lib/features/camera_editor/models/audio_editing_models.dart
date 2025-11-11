import 'package:flutter/foundation.dart';

/// Waveform data model
@immutable
class WaveformData {
  final List<double> samples; // Normalized amplitude values (0.0 to 1.0)
  final Duration duration;
  final int sampleRate;

  const WaveformData({
    required this.samples,
    required this.duration,
    this.sampleRate = 44100,
  });

  WaveformData copyWith({
    List<double>? samples,
    Duration? duration,
    int? sampleRate,
  }) {
    return WaveformData(
      samples: samples ?? this.samples,
      duration: duration ?? this.duration,
      sampleRate: sampleRate ?? this.sampleRate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'samples': samples,
      'duration': duration.inMilliseconds,
      'sampleRate': sampleRate,
    };
  }

  factory WaveformData.fromJson(Map<String, dynamic> json) {
    return WaveformData(
      samples: List<double>.from(json['samples'] as List),
      duration: Duration(milliseconds: json['duration'] as int),
      sampleRate: json['sampleRate'] as int? ?? 44100,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is WaveformData &&
        listEquals(other.samples, samples) &&
        other.duration == duration &&
        other.sampleRate == sampleRate;
  }

  @override
  int get hashCode => Object.hash(samples, duration, sampleRate);
}

/// Audio track types
enum AudioTrackType {
  original, // Original video audio
  voiceover, // Recorded voiceover
  music, // Background music
}

/// Audio editing project model
@immutable
class AudioEditingProject {
  final String id;
  final String videoPath;
  final Duration videoDuration;
  final AudioTrack originalTrack;
  final List<VoiceoverClip> voiceoverClips;
  final AudioTrack? musicTrack;
  final AudioMixerSettings mixerSettings;

  const AudioEditingProject({
    required this.id,
    required this.videoPath,
    required this.videoDuration,
    required this.originalTrack,
    this.voiceoverClips = const [],
    this.musicTrack,
    required this.mixerSettings,
  });

  // Computed properties
  bool get hasVoiceover => voiceoverClips.isNotEmpty;
  bool get hasMusic => musicTrack != null;
  bool get hasAudioEdits => hasVoiceover || hasMusic || !mixerSettings.isDefault;
  int get totalVoiceoverDuration => voiceoverClips.fold(
        0,
        (sum, clip) => sum + clip.duration.inMilliseconds,
      );

  AudioEditingProject copyWith({
    String? id,
    String? videoPath,
    Duration? videoDuration,
    AudioTrack? originalTrack,
    List<VoiceoverClip>? voiceoverClips,
    AudioTrack? musicTrack,
    bool clearMusicTrack = false,
    AudioMixerSettings? mixerSettings,
  }) {
    return AudioEditingProject(
      id: id ?? this.id,
      videoPath: videoPath ?? this.videoPath,
      videoDuration: videoDuration ?? this.videoDuration,
      originalTrack: originalTrack ?? this.originalTrack,
      voiceoverClips: voiceoverClips ?? this.voiceoverClips,
      musicTrack: clearMusicTrack ? null : (musicTrack ?? this.musicTrack),
      mixerSettings: mixerSettings ?? this.mixerSettings,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'videoPath': videoPath,
      'videoDuration': videoDuration.inMilliseconds,
      'originalTrack': originalTrack.toJson(),
      'voiceoverClips': voiceoverClips.map((c) => c.toJson()).toList(),
      'musicTrack': musicTrack?.toJson(),
      'mixerSettings': mixerSettings.toJson(),
    };
  }

  factory AudioEditingProject.fromJson(Map<String, dynamic> json) {
    return AudioEditingProject(
      id: json['id'] as String,
      videoPath: json['videoPath'] as String,
      videoDuration: Duration(milliseconds: json['videoDuration'] as int),
      originalTrack: AudioTrack.fromJson(json['originalTrack'] as Map<String, dynamic>),
      voiceoverClips: (json['voiceoverClips'] as List<dynamic>?)
              ?.map((c) => VoiceoverClip.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      musicTrack: json['musicTrack'] != null
          ? AudioTrack.fromJson(json['musicTrack'] as Map<String, dynamic>)
          : null,
      mixerSettings: AudioMixerSettings.fromJson(
          json['mixerSettings'] as Map<String, dynamic>),
    );
  }
}

/// Audio track model
@immutable
class AudioTrack {
  final String id;
  final AudioTrackType type;
  final String? filePath; // Null for original (extracted from video)
  final Duration duration;
  final double volume; // 0.0 - 1.0
  final bool isMuted;
  final double fadeInDuration; // Seconds
  final double fadeOutDuration; // Seconds

  const AudioTrack({
    required this.id,
    required this.type,
    this.filePath,
    required this.duration,
    this.volume = 1.0,
    this.isMuted = false,
    this.fadeInDuration = 0.0,
    this.fadeOutDuration = 0.0,
  });

  bool get hasFadeIn => fadeInDuration > 0;
  bool get hasFadeOut => fadeOutDuration > 0;
  bool get hasFades => hasFadeIn || hasFadeOut;
  double get effectiveVolume => isMuted ? 0.0 : volume;

  AudioTrack copyWith({
    String? id,
    AudioTrackType? type,
    String? filePath,
    Duration? duration,
    double? volume,
    bool? isMuted,
    double? fadeInDuration,
    double? fadeOutDuration,
  }) {
    return AudioTrack(
      id: id ?? this.id,
      type: type ?? this.type,
      filePath: filePath ?? this.filePath,
      duration: duration ?? this.duration,
      volume: volume ?? this.volume,
      isMuted: isMuted ?? this.isMuted,
      fadeInDuration: fadeInDuration ?? this.fadeInDuration,
      fadeOutDuration: fadeOutDuration ?? this.fadeOutDuration,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toString(),
      'filePath': filePath,
      'duration': duration.inMilliseconds,
      'volume': volume,
      'isMuted': isMuted,
      'fadeInDuration': fadeInDuration,
      'fadeOutDuration': fadeOutDuration,
    };
  }

  factory AudioTrack.fromJson(Map<String, dynamic> json) {
    return AudioTrack(
      id: json['id'] as String,
      type: AudioTrackType.values.firstWhere(
        (e) => e.toString() == json['type'],
        orElse: () => AudioTrackType.original,
      ),
      filePath: json['filePath'] as String?,
      duration: Duration(milliseconds: json['duration'] as int),
      volume: (json['volume'] as num?)?.toDouble() ?? 1.0,
      isMuted: json['isMuted'] as bool? ?? false,
      fadeInDuration: (json['fadeInDuration'] as num?)?.toDouble() ?? 0.0,
      fadeOutDuration: (json['fadeOutDuration'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Voiceover clip model (recorded audio segments)
@immutable
class VoiceoverClip {
  final String id;
  final String filePath;
  final Duration startTime; // Start time in video timeline
  final Duration duration;
  final double volume; // 0.0 - 1.0
  final bool isMuted;
  final String? waveformData; // Cached waveform data (optional)

  const VoiceoverClip({
    required this.id,
    required this.filePath,
    required this.startTime,
    required this.duration,
    this.volume = 1.0,
    this.isMuted = false,
    this.waveformData,
  });

  Duration get endTime => startTime + duration;
  bool get hasWaveformData => waveformData != null;
  double get effectiveVolume => isMuted ? 0.0 : volume;

  /// Check if clip is visible at given time
  bool isVisibleAt(Duration time) {
    return time >= startTime && time < endTime;
  }

  VoiceoverClip copyWith({
    String? id,
    String? filePath,
    Duration? startTime,
    Duration? duration,
    double? volume,
    bool? isMuted,
    String? waveformData,
  }) {
    return VoiceoverClip(
      id: id ?? this.id,
      filePath: filePath ?? this.filePath,
      startTime: startTime ?? this.startTime,
      duration: duration ?? this.duration,
      volume: volume ?? this.volume,
      isMuted: isMuted ?? this.isMuted,
      waveformData: waveformData ?? this.waveformData,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'filePath': filePath,
      'startTime': startTime.inMilliseconds,
      'duration': duration.inMilliseconds,
      'volume': volume,
      'isMuted': isMuted,
      'waveformData': waveformData,
    };
  }

  factory VoiceoverClip.fromJson(Map<String, dynamic> json) {
    return VoiceoverClip(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
      startTime: Duration(milliseconds: json['startTime'] as int),
      duration: Duration(milliseconds: json['duration'] as int),
      volume: (json['volume'] as num?)?.toDouble() ?? 1.0,
      isMuted: json['isMuted'] as bool? ?? false,
      waveformData: json['waveformData'] as String?,
    );
  }
}

/// Audio mixer settings
@immutable
class AudioMixerSettings {
  final double originalVolume; // 0.0 - 1.0
  final double voiceoverVolume; // 0.0 - 1.0
  final double musicVolume; // 0.0 - 1.0
  final bool originalMuted;
  final bool voiceoverMuted;
  final bool musicMuted;
  final double masterVolume; // 0.0 - 1.0
  final bool enableAudioNormalization;
  final bool enableNoiseReduction;

  const AudioMixerSettings({
    this.originalVolume = 1.0,
    this.voiceoverVolume = 1.0,
    this.musicVolume = 0.5,
    this.originalMuted = false,
    this.voiceoverMuted = false,
    this.musicMuted = false,
    this.masterVolume = 1.0,
    this.enableAudioNormalization = false,
    this.enableNoiseReduction = false,
  });

  // Default settings
  static const AudioMixerSettings defaultSettings = AudioMixerSettings();

  bool get isDefault {
    return originalVolume == 1.0 &&
        voiceoverVolume == 1.0 &&
        musicVolume == 0.5 &&
        !originalMuted &&
        !voiceoverMuted &&
        !musicMuted &&
        masterVolume == 1.0 &&
        !enableAudioNormalization &&
        !enableNoiseReduction;
  }

  double getEffectiveVolume(AudioTrackType type) {
    double trackVolume;
    bool trackMuted;

    switch (type) {
      case AudioTrackType.original:
        trackVolume = originalVolume;
        trackMuted = originalMuted;
        break;
      case AudioTrackType.voiceover:
        trackVolume = voiceoverVolume;
        trackMuted = voiceoverMuted;
        break;
      case AudioTrackType.music:
        trackVolume = musicVolume;
        trackMuted = musicMuted;
        break;
    }

    return trackMuted ? 0.0 : trackVolume * masterVolume;
  }

  AudioMixerSettings copyWith({
    double? originalVolume,
    double? voiceoverVolume,
    double? musicVolume,
    bool? originalMuted,
    bool? voiceoverMuted,
    bool? musicMuted,
    double? masterVolume,
    bool? enableAudioNormalization,
    bool? enableNoiseReduction,
  }) {
    return AudioMixerSettings(
      originalVolume: originalVolume ?? this.originalVolume,
      voiceoverVolume: voiceoverVolume ?? this.voiceoverVolume,
      musicVolume: musicVolume ?? this.musicVolume,
      originalMuted: originalMuted ?? this.originalMuted,
      voiceoverMuted: voiceoverMuted ?? this.voiceoverMuted,
      musicMuted: musicMuted ?? this.musicMuted,
      masterVolume: masterVolume ?? this.masterVolume,
      enableAudioNormalization:
          enableAudioNormalization ?? this.enableAudioNormalization,
      enableNoiseReduction: enableNoiseReduction ?? this.enableNoiseReduction,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'originalVolume': originalVolume,
      'voiceoverVolume': voiceoverVolume,
      'musicVolume': musicVolume,
      'originalMuted': originalMuted,
      'voiceoverMuted': voiceoverMuted,
      'musicMuted': musicMuted,
      'masterVolume': masterVolume,
      'enableAudioNormalization': enableAudioNormalization,
      'enableNoiseReduction': enableNoiseReduction,
    };
  }

  factory AudioMixerSettings.fromJson(Map<String, dynamic> json) {
    return AudioMixerSettings(
      originalVolume: (json['originalVolume'] as num?)?.toDouble() ?? 1.0,
      voiceoverVolume: (json['voiceoverVolume'] as num?)?.toDouble() ?? 1.0,
      musicVolume: (json['musicVolume'] as num?)?.toDouble() ?? 0.5,
      originalMuted: json['originalMuted'] as bool? ?? false,
      voiceoverMuted: json['voiceoverMuted'] as bool? ?? false,
      musicMuted: json['musicMuted'] as bool? ?? false,
      masterVolume: (json['masterVolume'] as num?)?.toDouble() ?? 1.0,
      enableAudioNormalization:
          json['enableAudioNormalization'] as bool? ?? false,
      enableNoiseReduction: json['enableNoiseReduction'] as bool? ?? false,
    );
  }
}

/// Recording state for voiceover
enum RecordingState {
  idle,
  recording,
  paused,
  stopped,
}

/// Voiceover recording session
class VoiceoverRecordingSession {
  final String sessionId;
  RecordingState state;
  DateTime? startTime;
  DateTime? endTime;
  Duration recordedDuration;
  String? outputFilePath;

  VoiceoverRecordingSession({
    required this.sessionId,
    this.state = RecordingState.idle,
    this.startTime,
    this.endTime,
    this.recordedDuration = Duration.zero,
    this.outputFilePath,
  });

  bool get isRecording => state == RecordingState.recording;
  bool get isPaused => state == RecordingState.paused;
  bool get isStopped => state == RecordingState.stopped;
  bool get hasRecording => outputFilePath != null;

  Duration get currentDuration {
    if (state == RecordingState.recording && startTime != null) {
      return DateTime.now().difference(startTime!) + recordedDuration;
    }
    return recordedDuration;
  }
}
