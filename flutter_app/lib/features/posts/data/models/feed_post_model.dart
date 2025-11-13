import '../../models/privacy_setting.dart';

/// Feed post model that supports both images and videos
/// Matches backend API response format
class FeedPost {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final bool isVerified;
  
  // Media
  final PostMediaType mediaType;
  final List<String> mediaUrls;      // Can be images or videos
  final String? thumbnailUrl;        // For videos
  final int? duration;               // For videos (in seconds)
  
  // Content
  final String caption;
  final List<String> hashtags;
  final List<String> mentions;
  final String? location;
  
  // Interactions
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int viewsCount;
  final int giftsCount;
  
  // User state
  final bool isLiked;
  final bool isBookmarked;
  
  // Privacy & Settings
  final PrivacySetting privacy;
  final bool allowComments;
  final bool allowShare;
  
  // Metadata
  final DateTime createdAt;
  final DateTime? updatedAt;

  const FeedPost({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    this.isVerified = false,
    required this.mediaType,
    required this.mediaUrls,
    this.thumbnailUrl,
    this.duration,
    this.caption = '',
    this.hashtags = const [],
    this.mentions = const [],
    this.location,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.viewsCount = 0,
    this.giftsCount = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.privacy = PrivacySetting.public,
    this.allowComments = true,
    this.allowShare = true,
    required this.createdAt,
    this.updatedAt,
  });

  bool get isVideo => mediaType == PostMediaType.video;
  bool get isImage => mediaType == PostMediaType.image;
  bool get hasMultipleMedia => mediaUrls.length > 1;

  FeedPost copyWith({
    String? id,
    String? userId,
    String? username,
    String? userAvatar,
    bool? isVerified,
    PostMediaType? mediaType,
    List<String>? mediaUrls,
    String? thumbnailUrl,
    int? duration,
    String? caption,
    List<String>? hashtags,
    List<String>? mentions,
    String? location,
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    int? viewsCount,
    int? giftsCount,
    bool? isLiked,
    bool? isBookmarked,
    PrivacySetting? privacy,
    bool? allowComments,
    bool? allowShare,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FeedPost(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      isVerified: isVerified ?? this.isVerified,
      mediaType: mediaType ?? this.mediaType,
      mediaUrls: mediaUrls ?? this.mediaUrls,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      duration: duration ?? this.duration,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      location: location ?? this.location,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      viewsCount: viewsCount ?? this.viewsCount,
      giftsCount: giftsCount ?? this.giftsCount,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      privacy: privacy ?? this.privacy,
      allowComments: allowComments ?? this.allowComments,
      allowShare: allowShare ?? this.allowShare,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    return FeedPost(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user']?['_id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
      userAvatar: json['userAvatar'] ?? json['user']?['avatar'] ?? '',
      isVerified: json['isVerified'] ?? json['user']?['isVerified'] ?? false,
      mediaType: _parseMediaType(json['mediaType'] ?? json['type'] ?? 'image'),
      mediaUrls: List<String>.from(json['mediaUrls'] ?? json['imageUrls'] ?? [json['videoUrl'] ?? json['mediaUrl']].where((e) => e != null)),
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'],
      duration: json['duration'],
      caption: json['caption'] ?? json['description'] ?? '',
      hashtags: List<String>.from(json['hashtags'] ?? []),
      mentions: List<String>.from(json['mentions'] ?? []),
      location: json['location'],
      likesCount: json['likesCount'] ?? json['likes'] ?? 0,
      commentsCount: json['commentsCount'] ?? json['comments'] ?? 0,
      sharesCount: json['sharesCount'] ?? json['shares'] ?? 0,
      viewsCount: json['viewsCount'] ?? json['views'] ?? 0,
      giftsCount: json['giftsCount'] ?? json['gifts'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      isBookmarked: json['isBookmarked'] ?? json['isSaved'] ?? false,
      privacy: PrivacySetting.fromApiValue(json['privacy'] ?? 'public'),
      allowComments: json['allowComments'] ?? true,
      allowShare: json['allowShare'] ?? json['allowSharing'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'username': username,
      'userAvatar': userAvatar,
      'isVerified': isVerified,
      'mediaType': mediaType.apiValue,
      'mediaUrls': mediaUrls,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (duration != null) 'duration': duration,
      'caption': caption,
      'hashtags': hashtags,
      'mentions': mentions,
      if (location != null) 'location': location,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'sharesCount': sharesCount,
      'viewsCount': viewsCount,
      'giftsCount': giftsCount,
      'isLiked': isLiked,
      'isBookmarked': isBookmarked,
      'privacy': privacy.apiValue,
      'allowComments': allowComments,
      'allowShare': allowShare,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  static PostMediaType _parseMediaType(String type) {
    switch (type.toLowerCase()) {
      case 'video':
        return PostMediaType.video;
      case 'image':
      case 'photo':
        return PostMediaType.image;
      default:
        return PostMediaType.image;
    }
  }
}

enum PostMediaType {
  image,
  video;

  String get apiValue {
    switch (this) {
      case PostMediaType.image:
        return 'image';
      case PostMediaType.video:
        return 'video';
    }
  }
}

/// Comment model for feed posts
class FeedComment {
  final String id;
  final String postId;
  final String userId;
  final String username;
  final String userAvatar;
  final bool isVerified;
  final String text;
  final int likesCount;
  final bool isLiked;
  final DateTime createdAt;
  final List<FeedComment> replies;

  const FeedComment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.username,
    required this.userAvatar,
    this.isVerified = false,
    required this.text,
    this.likesCount = 0,
    this.isLiked = false,
    required this.createdAt,
    this.replies = const [],
  });

  factory FeedComment.fromJson(Map<String, dynamic> json) {
    return FeedComment(
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] ?? '',
      userId: json['userId'] ?? json['user']?['_id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
      userAvatar: json['userAvatar'] ?? json['user']?['avatar'] ?? '',
      isVerified: json['isVerified'] ?? json['user']?['isVerified'] ?? false,
      text: json['text'] ?? json['comment'] ?? '',
      likesCount: json['likesCount'] ?? json['likes'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      replies: (json['replies'] as List?)?.map((r) => FeedComment.fromJson(r)).toList() ?? [],
    );
  }

  FeedComment copyWith({
    bool? isLiked,
    int? likesCount,
  }) {
    return FeedComment(
      id: id,
      postId: postId,
      userId: userId,
      username: username,
      userAvatar: userAvatar,
      isVerified: isVerified,
      text: text,
      likesCount: likesCount ?? this.likesCount,
      isLiked: isLiked ?? this.isLiked,
      createdAt: createdAt,
      replies: replies,
    );
  }
}
