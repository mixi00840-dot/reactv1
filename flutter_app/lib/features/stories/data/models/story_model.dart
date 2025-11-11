/// Story model for stories feature
class Story {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final List<StoryItem> items;
  final DateTime createdAt;
  final bool isViewed;
  final bool isMe;

  Story({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.items,
    required this.createdAt,
    this.isViewed = false,
    this.isMe = false,
  });
}

/// Individual story item (image or video)
class StoryItem {
  final String id;
  final StoryType type;
  final String url;
  final String? thumbnail;
  final Duration duration;
  final DateTime createdAt;
  final bool isViewed;

  StoryItem({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnail,
    this.duration = const Duration(seconds: 5),
    required this.createdAt,
    this.isViewed = false,
  });
}

enum StoryType {
  image,
  video,
}
