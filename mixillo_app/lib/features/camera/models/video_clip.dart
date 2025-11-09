/// Video clip model for multi-clip recording
class VideoClip {
  final String path;
  final Duration duration;
  final double speed;
  final String? filter;

  VideoClip({
    required this.path,
    required this.duration,
    this.speed = 1.0,
    this.filter,
  });

  VideoClip copyWith({
    String? path,
    Duration? duration,
    double? speed,
    String? filter,
  }) {
    return VideoClip(
      path: path ?? this.path,
      duration: duration ?? this.duration,
      speed: speed ?? this.speed,
      filter: filter ?? this.filter,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'path': path,
      'durationMs': duration.inMilliseconds,
      'speed': speed,
      'filter': filter,
    };
  }

  factory VideoClip.fromJson(Map<String, dynamic> json) {
    return VideoClip(
      path: json['path'] as String,
      duration: Duration(milliseconds: json['durationMs'] as int),
      speed: json['speed'] as double? ?? 1.0,
      filter: json['filter'] as String?,
    );
  }
}

/// Video processing settings
class VideoProcessingSettings {
  final List<VideoClip> clips;
  final String? audioPath;
  final double audioVolume;
  final String? coverImagePath;
  final int? trimStartMs;
  final int? trimEndMs;
  final String outputFormat;
  final VideoQuality quality;

  VideoProcessingSettings({
    required this.clips,
    this.audioPath,
    this.audioVolume = 1.0,
    this.coverImagePath,
    this.trimStartMs,
    this.trimEndMs,
    this.outputFormat = 'mp4',
    this.quality = VideoQuality.high,
  });
}

/// Video quality presets
enum VideoQuality {
  low,     // 480p, 1000kbps
  medium,  // 720p, 2500kbps
  high,    // 1080p, 5000kbps
  ultra,   // 1080p, 8000kbps
}

/// Video processing result
class ProcessedVideo {
  final String outputPath;
  final String thumbnailPath;
  final Duration duration;
  final int fileSizeBytes;
  final int width;
  final int height;

  ProcessedVideo({
    required this.outputPath,
    required this.thumbnailPath,
    required this.duration,
    required this.fileSizeBytes,
    required this.width,
    required this.height,
  });
}
