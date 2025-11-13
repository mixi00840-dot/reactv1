import 'privacy_setting.dart';

/// Post data model for creating/publishing video content
class PostData {
  final String videoPath;
  final String? thumbnailPath;
  final String caption;
  final List<String> hashtags;
  final List<String> mentions;
  final PrivacySetting privacy;
  final bool allowComments;
  final bool allowDuet;
  final bool allowStitch;
  final String? soundId;
  final String? location;
  final DateTime? scheduledAt;
  final List<String> taggedUserIds;
  final Map<String, dynamic>? metadata;

  const PostData({
    required this.videoPath,
    this.thumbnailPath,
    this.caption = '',
    this.hashtags = const [],
    this.mentions = const [],
    this.privacy = PrivacySetting.public,
    this.allowComments = true,
    this.allowDuet = true,
    this.allowStitch = true,
    this.soundId,
    this.location,
    this.scheduledAt,
    this.taggedUserIds = const [],
    this.metadata,
  });

  bool get isValid => videoPath.isNotEmpty;

  bool get isScheduled => scheduledAt != null && scheduledAt!.isAfter(DateTime.now());

  int get captionLength => caption.length;

  bool get hasTags => hashtags.isNotEmpty || mentions.isNotEmpty;

  PostData copyWith({
    String? videoPath,
    String? thumbnailPath,
    String? caption,
    List<String>? hashtags,
    List<String>? mentions,
    PrivacySetting? privacy,
    bool? allowComments,
    bool? allowDuet,
    bool? allowStitch,
    String? soundId,
    String? location,
    DateTime? scheduledAt,
    List<String>? taggedUserIds,
    Map<String, dynamic>? metadata,
  }) {
    return PostData(
      videoPath: videoPath ?? this.videoPath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      privacy: privacy ?? this.privacy,
      allowComments: allowComments ?? this.allowComments,
      allowDuet: allowDuet ?? this.allowDuet,
      allowStitch: allowStitch ?? this.allowStitch,
      soundId: soundId ?? this.soundId,
      location: location ?? this.location,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      taggedUserIds: taggedUserIds ?? this.taggedUserIds,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'videoPath': videoPath,
      'thumbnailPath': thumbnailPath,
      'caption': caption,
      'hashtags': hashtags,
      'mentions': mentions,
      'privacy': privacy.apiValue,
      'allowComments': allowComments,
      'allowDuet': allowDuet,
      'allowStitch': allowStitch,
      if (soundId != null) 'soundId': soundId,
      if (location != null) 'location': location,
      if (scheduledAt != null) 'scheduledAt': scheduledAt!.toIso8601String(),
      if (taggedUserIds.isNotEmpty) 'taggedUsers': taggedUserIds,
      if (metadata != null) ...metadata!,
    };
  }

  factory PostData.fromJson(Map<String, dynamic> json) {
    return PostData(
      videoPath: json['videoPath'] ?? '',
      thumbnailPath: json['thumbnailPath'],
      caption: json['caption'] ?? '',
      hashtags: List<String>.from(json['hashtags'] ?? []),
      mentions: List<String>.from(json['mentions'] ?? []),
      privacy: PrivacySetting.fromApiValue(json['privacy'] ?? 'public'),
      allowComments: json['allowComments'] ?? true,
      allowDuet: json['allowDuet'] ?? true,
      allowStitch: json['allowStitch'] ?? true,
      soundId: json['soundId'],
      location: json['location'],
      scheduledAt: json['scheduledAt'] != null 
          ? DateTime.parse(json['scheduledAt']) 
          : null,
      taggedUserIds: List<String>.from(json['taggedUsers'] ?? []),
      metadata: json['metadata'],
    );
  }
}

/// Upload progress state
class UploadProgress {
  final int uploadedBytes;
  final int totalBytes;
  final String currentStep;
  final double percentage;

  const UploadProgress({
    required this.uploadedBytes,
    required this.totalBytes,
    required this.currentStep,
    required this.percentage,
  });

  bool get isComplete => percentage >= 100;

  String get formattedProgress => '${percentage.toStringAsFixed(0)}%';

  UploadProgress copyWith({
    int? uploadedBytes,
    int? totalBytes,
    String? currentStep,
    double? percentage,
  }) {
    return UploadProgress(
      uploadedBytes: uploadedBytes ?? this.uploadedBytes,
      totalBytes: totalBytes ?? this.totalBytes,
      currentStep: currentStep ?? this.currentStep,
      percentage: percentage ?? this.percentage,
    );
  }
}

