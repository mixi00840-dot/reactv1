class LiveStream {
  final String id;
  final String hostId;
  final String? hostUsername;
  final String? hostAvatar;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String? streamUrl;
  final String status; // pending, live, ended
  final int viewerCount;
  final int likeCount;
  final int giftCount;
  final DateTime? scheduledAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final DateTime? createdAt;

  LiveStream({
    required this.id,
    required this.hostId,
    this.hostUsername,
    this.hostAvatar,
    required this.title,
    this.description,
    this.thumbnailUrl,
    this.streamUrl,
    this.status = 'pending',
    this.viewerCount = 0,
    this.likeCount = 0,
    this.giftCount = 0,
    this.scheduledAt,
    this.startedAt,
    this.endedAt,
    this.createdAt,
  });

  factory LiveStream.fromJson(Map<String, dynamic> json) {
    return LiveStream(
      id: json['_id'] ?? json['id'] ?? '',
      hostId: json['hostId'] ?? json['host']?['_id'] ?? '',
      hostUsername: json['hostUsername'] ?? json['host']?['username'],
      hostAvatar: json['hostAvatar'] ?? json['host']?['avatar'],
      title: json['title'] ?? '',
      description: json['description'],
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'],
      streamUrl: json['streamUrl'],
      status: json['status'] ?? 'pending',
      viewerCount: json['viewerCount'] ?? 0,
      likeCount: json['likeCount'] ?? 0,
      giftCount: json['giftCount'] ?? 0,
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.parse(json['scheduledAt'])
          : null,
      startedAt:
          json['startedAt'] != null ? DateTime.parse(json['startedAt']) : null,
      endedAt:
          json['endedAt'] != null ? DateTime.parse(json['endedAt']) : null,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hostId': hostId,
      if (hostUsername != null) 'hostUsername': hostUsername,
      if (hostAvatar != null) 'hostAvatar': hostAvatar,
      'title': title,
      if (description != null) 'description': description,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (streamUrl != null) 'streamUrl': streamUrl,
      'status': status,
      'viewerCount': viewerCount,
      'likeCount': likeCount,
      'giftCount': giftCount,
      if (scheduledAt != null) 'scheduledAt': scheduledAt!.toIso8601String(),
      if (startedAt != null) 'startedAt': startedAt!.toIso8601String(),
      if (endedAt != null) 'endedAt': endedAt!.toIso8601String(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  bool get isLive => status == 'live';
  bool get isScheduled => status == 'pending';
  bool get isEnded => status == 'ended';

  LiveStream copyWith({
    String? id,
    String? hostId,
    String? hostUsername,
    String? hostAvatar,
    String? title,
    String? description,
    String? thumbnailUrl,
    String? streamUrl,
    String? status,
    int? viewerCount,
    int? likeCount,
    int? giftCount,
    DateTime? scheduledAt,
    DateTime? startedAt,
    DateTime? endedAt,
    DateTime? createdAt,
  }) {
    return LiveStream(
      id: id ?? this.id,
      hostId: hostId ?? this.hostId,
      hostUsername: hostUsername ?? this.hostUsername,
      hostAvatar: hostAvatar ?? this.hostAvatar,
      title: title ?? this.title,
      description: description ?? this.description,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      streamUrl: streamUrl ?? this.streamUrl,
      status: status ?? this.status,
      viewerCount: viewerCount ?? this.viewerCount,
      likeCount: likeCount ?? this.likeCount,
      giftCount: giftCount ?? this.giftCount,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
