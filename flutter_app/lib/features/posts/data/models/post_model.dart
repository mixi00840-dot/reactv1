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
}
