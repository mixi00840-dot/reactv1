class VideoModel {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String username;
  final String userAvatar;
  final String userId;
  final String caption;
  final int likes;
  final int comments;
  final int shares;
  final int views;
  final bool isLiked;
  final DateTime createdAt;
  final String? soundName;

  VideoModel({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.username,
    required this.userAvatar,
    required this.userId,
    required this.caption,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.views,
    this.isLiked = false,
    required this.createdAt,
    this.soundName,
  });

  factory VideoModel.fromJson(Map<String, dynamic> json) {
    return VideoModel(
      id: json['_id'] ?? json['id'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'] ?? '',
      username: json['user']?['username'] ?? json['username'] ?? 'Unknown',
      userAvatar: json['user']?['avatar'] ?? json['userAvatar'] ?? '',
      userId: json['user']?['_id'] ?? json['userId'] ?? '',
      caption: json['description'] ?? json['caption'] ?? '',
      likes: json['likesCount'] ?? json['likes'] ?? 0,
      comments: json['commentsCount'] ?? json['comments'] ?? 0,
      shares: json['sharesCount'] ?? json['shares'] ?? 0,
      views: json['viewsCount'] ?? json['views'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      soundName: json['soundName'] ?? json['sound']?['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'username': username,
      'userAvatar': userAvatar,
      'userId': userId,
      'caption': caption,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'views': views,
      'isLiked': isLiked,
      'createdAt': createdAt.toIso8601String(),
      'soundName': soundName,
    };
  }

  VideoModel copyWith({
    String? id,
    String? videoUrl,
    String? thumbnailUrl,
    String? username,
    String? userAvatar,
    String? userId,
    String? caption,
    int? likes,
    int? comments,
    int? shares,
    int? views,
    bool? isLiked,
    DateTime? createdAt,
    String? soundName,
  }) {
    return VideoModel(
      id: id ?? this.id,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      userId: userId ?? this.userId,
      caption: caption ?? this.caption,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      views: views ?? this.views,
      isLiked: isLiked ?? this.isLiked,
      createdAt: createdAt ?? this.createdAt,
      soundName: soundName ?? this.soundName,
    );
  }
}
