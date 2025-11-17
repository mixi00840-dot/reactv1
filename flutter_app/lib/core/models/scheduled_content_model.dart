/// ScheduledContent Model - Content scheduling
/// Matches backend/src/models/ScheduledContent.js
enum ScheduleStatus {
  scheduled,
  published,
  cancelled,
  failed;

  static ScheduleStatus fromString(String value) {
    return ScheduleStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ScheduleStatus.scheduled,
    );
  }
}

enum ScheduleType {
  post,
  story,
  video,
  live;

  static ScheduleType fromString(String value) {
    return ScheduleType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ScheduleType.post,
    );
  }
}

class ScheduledContentModel {
  final String id;
  final String userId;
  final ScheduleType contentType;
  final DateTime scheduledFor;
  final ScheduleStatus status;
  final Map<String, dynamic> contentData;
  final String? mediaUrl;
  final String? caption;
  final List<String>? hashtags;
  final String? location;
  final Map<String, dynamic>? metadata;
  final DateTime? publishedAt;
  final String? publishedContentId;
  final String? failureReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  ScheduledContentModel({
    required this.id,
    required this.userId,
    required this.contentType,
    required this.scheduledFor,
    this.status = ScheduleStatus.scheduled,
    required this.contentData,
    this.mediaUrl,
    this.caption,
    this.hashtags,
    this.location,
    this.metadata,
    this.publishedAt,
    this.publishedContentId,
    this.failureReason,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ScheduledContentModel.fromJson(Map<String, dynamic> json) {
    return ScheduledContentModel(
      id: json['_id'] ?? json['id'],
      userId: json['user'] ?? json['userId'],
      contentType: ScheduleType.fromString(json['contentType'] ?? 'post'),
      scheduledFor: DateTime.parse(json['scheduledFor']),
      status: ScheduleStatus.fromString(json['status'] ?? 'scheduled'),
      contentData: json['contentData'] ?? {},
      mediaUrl: json['mediaUrl'],
      caption: json['caption'],
      hashtags:
          json['hashtags'] != null ? List<String>.from(json['hashtags']) : null,
      location: json['location'],
      metadata: json['metadata'],
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'])
          : null,
      publishedContentId: json['publishedContent'],
      failureReason: json['failureReason'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'contentType': contentType.name,
      'scheduledFor': scheduledFor.toIso8601String(),
      'status': status.name,
      'contentData': contentData,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
      if (caption != null) 'caption': caption,
      if (hashtags != null) 'hashtags': hashtags,
      if (location != null) 'location': location,
      if (metadata != null) 'metadata': metadata,
      if (publishedAt != null) 'publishedAt': publishedAt!.toIso8601String(),
      if (publishedContentId != null) 'publishedContent': publishedContentId,
      if (failureReason != null) 'failureReason': failureReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isScheduled => status == ScheduleStatus.scheduled;
  bool get isPublished => status == ScheduleStatus.published;
  bool get isFailed => status == ScheduleStatus.failed;
  bool get isCancelled => status == ScheduleStatus.cancelled;

  bool get isPending {
    return status == ScheduleStatus.scheduled &&
        DateTime.now().isBefore(scheduledFor);
  }

  bool get isDue {
    return status == ScheduleStatus.scheduled &&
        DateTime.now().isAfter(scheduledFor);
  }

  Duration get timeUntilPublish {
    if (!isScheduled) return Duration.zero;
    final diff = scheduledFor.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  String get statusDisplay {
    switch (status) {
      case ScheduleStatus.scheduled:
        return 'Scheduled';
      case ScheduleStatus.published:
        return 'Published';
      case ScheduleStatus.cancelled:
        return 'Cancelled';
      case ScheduleStatus.failed:
        return 'Failed';
    }
  }

  String get typeDisplay {
    switch (contentType) {
      case ScheduleType.post:
        return 'Post';
      case ScheduleType.story:
        return 'Story';
      case ScheduleType.video:
        return 'Video';
      case ScheduleType.live:
        return 'Live Stream';
    }
  }
}
