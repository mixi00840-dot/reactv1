import 'package:video_player/video_player.dart';

/// Model for feed videos
class FeedVideoModel {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String caption;
  final List<String> hashtags;
  final int duration;
  
  // User info
  final String userId;
  final String username;
  final String? userAvatar;
  final bool isVerified;
  
  // Stats
  final int likes;
  final int comments;
  final int shares;
  final int views;
  
  // User interactions
  final bool isLiked;
  final bool isFollowing;
  
  // Video player
  VideoPlayerController? controller;

  FeedVideoModel({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.caption,
    required this.hashtags,
    required this.duration,
    required this.userId,
    required this.username,
    this.userAvatar,
    this.isVerified = false,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.views,
    this.isLiked = false,
    this.isFollowing = false,
    this.controller,
  });

  factory FeedVideoModel.fromJson(Map<String, dynamic> json) {
    // Handle different response formats
    final content = json['content'] ?? json;
    final user = json['user'] ?? json['creator'] ?? {};
    final stats = json['stats'] ?? {};
    
    return FeedVideoModel(
      id: content['_id'] ?? content['id'] ?? '',
      videoUrl: content['videoUrl'] ?? content['url'] ?? '',
      thumbnailUrl: content['thumbnailUrl'] ?? content['thumbnail'] ?? '',
      caption: content['caption'] ?? content['description'] ?? '',
      hashtags: List<String>.from(content['hashtags'] ?? []),
      duration: content['duration'] ?? 0,
      userId: user['_id'] ?? user['id'] ?? '',
      username: user['username'] ?? 'Unknown',
      userAvatar: user['avatar'] ?? user['avatarUrl'],
      isVerified: user['isVerified'] ?? false,
      likes: stats['likes'] ?? content['likes'] ?? 0,
      comments: stats['comments'] ?? content['comments'] ?? 0,
      shares: stats['shares'] ?? content['shares'] ?? 0,
      views: stats['views'] ?? content['views'] ?? 0,
      isLiked: content['isLiked'] ?? false,
      isFollowing: user['isFollowing'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'caption': caption,
      'hashtags': hashtags,
      'duration': duration,
      'userId': userId,
      'username': username,
      'userAvatar': userAvatar,
      'isVerified': isVerified,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'views': views,
      'isLiked': isLiked,
      'isFollowing': isFollowing,
    };
  }

  FeedVideoModel copyWith({
    String? id,
    String? videoUrl,
    String? thumbnailUrl,
    String? caption,
    List<String>? hashtags,
    int? duration,
    String? userId,
    String? username,
    String? userAvatar,
    bool? isVerified,
    int? likes,
    int? comments,
    int? shares,
    int? views,
    bool? isLiked,
    bool? isFollowing,
    VideoPlayerController? controller,
  }) {
    return FeedVideoModel(
      id: id ?? this.id,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      duration: duration ?? this.duration,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      isVerified: isVerified ?? this.isVerified,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      views: views ?? this.views,
      isLiked: isLiked ?? this.isLiked,
      isFollowing: isFollowing ?? this.isFollowing,
      controller: controller ?? this.controller,
    );
  }
}
