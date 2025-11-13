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
  final int viewsCount;

  Story({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.items,
    required this.createdAt,
    this.isViewed = false,
    this.isMe = false,
    this.viewsCount = 0,
  });
  
  Story copyWith({
    String? id,
    String? userId,
    String? username,
    String? userAvatar,
    List<StoryItem>? items,
    DateTime? createdAt,
    bool? isViewed,
    bool? isMe,
    int? viewsCount,
  }) {
    return Story(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      items: items ?? this.items,
      createdAt: createdAt ?? this.createdAt,
      isViewed: isViewed ?? this.isViewed,
      isMe: isMe ?? this.isMe,
      viewsCount: viewsCount ?? this.viewsCount,
    );
  }
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
