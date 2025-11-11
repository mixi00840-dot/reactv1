/// Video recording segment model
class VideoSegment {
  final String id;
  final String filePath;
  final Duration duration;
  final double speed; // 0.3x, 0.5x, 1x, 2x, 3x
  final String? filterName;
  final DateTime timestamp;

  const VideoSegment({
    required this.id,
    required this.filePath,
    required this.duration,
    this.speed = 1.0,
    this.filterName,
    required this.timestamp,
  });

  VideoSegment copyWith({
    String? id,
    String? filePath,
    Duration? duration,
    double? speed,
    String? filterName,
    DateTime? timestamp,
  }) {
    return VideoSegment(
      id: id ?? this.id,
      filePath: filePath ?? this.filePath,
      duration: duration ?? this.duration,
      speed: speed ?? this.speed,
      filterName: filterName ?? this.filterName,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'filePath': filePath,
      'duration': duration.inMilliseconds,
      'speed': speed,
      'filterName': filterName,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory VideoSegment.fromJson(Map<String, dynamic> json) {
    return VideoSegment(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
      duration: Duration(milliseconds: json['duration'] as int),
      speed: (json['speed'] as num?)?.toDouble() ?? 1.0,
      filterName: json['filterName'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}
