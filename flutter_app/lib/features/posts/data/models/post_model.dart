/// Post model for photo posts
class Post {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final List<String> imageUrls;
  final String caption;
  final List<String> hashtags;
  final int likes;
  final int comments;
  final int shares;
  final DateTime createdAt;
  final bool isLiked;
  final bool isBookmarked;

  Post({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.imageUrls,
    required this.caption,
    this.hashtags = const [],
    required this.likes,
    required this.comments,
    required this.shares,
    required this.createdAt,
    this.isLiked = false,
    this.isBookmarked = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      caption: json['caption'] ?? '',
      hashtags: List<String>.from(json['hashtags'] ?? []),
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      shares: json['shares'] ?? 0,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isLiked: json['isLiked'] ?? false,
      isBookmarked: json['isBookmarked'] ?? false,
    );
  }
}

/// Comment model
class Comment {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final String text;
  final int likes;
  final DateTime createdAt;
  final bool isLiked;

  Comment({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.text,
    required this.likes,
    required this.createdAt,
    this.isLiked = false,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      text: json['text'] ?? '',
      likes: json['likes'] ?? 0,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isLiked: json['isLiked'] ?? false,
    );
  }
}
