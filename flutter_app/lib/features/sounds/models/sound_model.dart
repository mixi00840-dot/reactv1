/// Sound model representing a music/audio track
class Sound {
  final String id;
  final String title;
  final String artistName;
  final String? albumArt;
  final String audioUrl;
  final int duration; // Duration in seconds
  final String? category;
  final int useCount; // Number of times used in videos
  final bool isTrending;
  final bool isFavorite;
  final DateTime? createdAt;
  final Map<String, dynamic>? metadata;

  const Sound({
    required this.id,
    required this.title,
    required this.artistName,
    this.albumArt,
    required this.audioUrl,
    required this.duration,
    this.category,
    this.useCount = 0,
    this.isTrending = false,
    this.isFavorite = false,
    this.createdAt,
    this.metadata,
  });

  /// Create Sound from JSON
  factory Sound.fromJson(Map<String, dynamic> json) {
    return Sound(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? 'Unknown',
      artistName: json['artistName'] ?? json['artist'] ?? 'Unknown Artist',
      albumArt: json['albumArt'] ?? json['coverImage'],
      audioUrl: json['audioUrl'] ?? json['url'] ?? '',
      duration: json['duration'] ?? 0,
      category: json['category'],
      useCount: json['useCount'] ?? json['usageCount'] ?? 0,
      isTrending: json['isTrending'] ?? json['trending'] ?? false,
      isFavorite: json['isFavorite'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      metadata: json['metadata'],
    );
  }

  /// Convert Sound to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'artistName': artistName,
      'albumArt': albumArt,
      'audioUrl': audioUrl,
      'duration': duration,
      'category': category,
      'useCount': useCount,
      'isTrending': isTrending,
      'isFavorite': isFavorite,
      'createdAt': createdAt?.toIso8601String(),
      'metadata': metadata,
    };
  }

  /// Format duration as mm:ss
  String get formattedDuration {
    final minutes = duration ~/ 60;
    final seconds = duration % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  /// Format use count (e.g., "1.2M", "890K")
  String get formattedUseCount {
    if (useCount >= 1000000) {
      return '${(useCount / 1000000).toStringAsFixed(1)}M';
    } else if (useCount >= 1000) {
      return '${(useCount / 1000).toStringAsFixed(1)}K';
    }
    return useCount.toString();
  }

  /// Copy with method for immutability
  Sound copyWith({
    String? id,
    String? title,
    String? artistName,
    String? albumArt,
    String? audioUrl,
    int? duration,
    String? category,
    int? useCount,
    bool? isTrending,
    bool? isFavorite,
    DateTime? createdAt,
    Map<String, dynamic>? metadata,
  }) {
    return Sound(
      id: id ?? this.id,
      title: title ?? this.title,
      artistName: artistName ?? this.artistName,
      albumArt: albumArt ?? this.albumArt,
      audioUrl: audioUrl ?? this.audioUrl,
      duration: duration ?? this.duration,
      category: category ?? this.category,
      useCount: useCount ?? this.useCount,
      isTrending: isTrending ?? this.isTrending,
      isFavorite: isFavorite ?? this.isFavorite,
      createdAt: createdAt ?? this.createdAt,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Sound && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

