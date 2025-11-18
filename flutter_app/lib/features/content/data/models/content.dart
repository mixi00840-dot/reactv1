class Content {
  final String id;
  final String creatorId;
  final String? creatorUsername;
  final String? creatorAvatar;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? caption;
  final List<String> hashtags;
  final List<String> mentions;
  final int views;
  final int likes;
  final int comments;
  final int shares;
  final bool isLiked;
  final bool isBookmarked;
  final String? musicId;
  final String? musicTitle;
  final String? musicArtist;
  final bool allowComments;
  final bool allowDuet;
  final bool allowStitch;
  final String visibility;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Content({
    required this.id,
    required this.creatorId,
    this.creatorUsername,
    this.creatorAvatar,
    required this.videoUrl,
    this.thumbnailUrl,
    this.caption,
    this.hashtags = const [],
    this.mentions = const [],
    this.views = 0,
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.musicId,
    this.musicTitle,
    this.musicArtist,
    this.allowComments = true,
    this.allowDuet = true,
    this.allowStitch = true,
    this.visibility = 'public',
    this.createdAt,
    this.updatedAt,
  });

  factory Content.fromJson(Map<String, dynamic> json) {
    return Content(
      id: json['_id'] ?? json['id'] ?? '',
      creatorId: json['creatorId'] ?? json['creator']?['_id'] ?? '',
      creatorUsername: json['creatorUsername'] ?? json['creator']?['username'],
      creatorAvatar: json['creatorAvatar'] ?? json['creator']?['avatar'],
      videoUrl: json['videoUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'],
      caption: json['caption'],
      hashtags: json['hashtags'] != null
          ? List<String>.from(json['hashtags'])
          : [],
      mentions: json['mentions'] != null
          ? List<String>.from(json['mentions'])
          : [],
      views: json['views'] ?? 0,
      likes: json['likes'] ?? json['likesCount'] ?? 0,
      comments: json['comments'] ?? json['commentsCount'] ?? 0,
      shares: json['shares'] ?? json['sharesCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      isBookmarked: json['isBookmarked'] ?? false,
      musicId: json['musicId'] ?? json['music']?['_id'],
      musicTitle: json['musicTitle'] ?? json['music']?['title'],
      musicArtist: json['musicArtist'] ?? json['music']?['artist'],
      allowComments: json['allowComments'] ?? true,
      allowDuet: json['allowDuet'] ?? true,
      allowStitch: json['allowStitch'] ?? true,
      visibility: json['visibility'] ?? 'public',
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'creatorId': creatorId,
      if (creatorUsername != null) 'creatorUsername': creatorUsername,
      if (creatorAvatar != null) 'creatorAvatar': creatorAvatar,
      'videoUrl': videoUrl,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (caption != null) 'caption': caption,
      'hashtags': hashtags,
      'mentions': mentions,
      'views': views,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'isLiked': isLiked,
      'isBookmarked': isBookmarked,
      if (musicId != null) 'musicId': musicId,
      if (musicTitle != null) 'musicTitle': musicTitle,
      if (musicArtist != null) 'musicArtist': musicArtist,
      'allowComments': allowComments,
      'allowDuet': allowDuet,
      'allowStitch': allowStitch,
      'visibility': visibility,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  Content copyWith({
    String? id,
    String? creatorId,
    String? creatorUsername,
    String? creatorAvatar,
    String? videoUrl,
    String? thumbnailUrl,
    String? caption,
    List<String>? hashtags,
    List<String>? mentions,
    int? views,
    int? likes,
    int? comments,
    int? shares,
    bool? isLiked,
    bool? isBookmarked,
    String? musicId,
    String? musicTitle,
    String? musicArtist,
    bool? allowComments,
    bool? allowDuet,
    bool? allowStitch,
    String? visibility,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Content(
      id: id ?? this.id,
      creatorId: creatorId ?? this.creatorId,
      creatorUsername: creatorUsername ?? this.creatorUsername,
      creatorAvatar: creatorAvatar ?? this.creatorAvatar,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      views: views ?? this.views,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      musicId: musicId ?? this.musicId,
      musicTitle: musicTitle ?? this.musicTitle,
      musicArtist: musicArtist ?? this.musicArtist,
      allowComments: allowComments ?? this.allowComments,
      allowDuet: allowDuet ?? this.allowDuet,
      allowStitch: allowStitch ?? this.allowStitch,
      visibility: visibility ?? this.visibility,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
