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

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      items: json['items'] != null
          ? (json['items'] as List).map((item) => StoryItem.fromJson(item)).toList()
          : [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isViewed: json['isViewed'] ?? false,
      isMe: json['isMe'] ?? false,
      viewsCount: json['viewsCount'] ?? 0,
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

  factory StoryItem.fromJson(Map<String, dynamic> json) {
    return StoryItem(
      id: json['id'] ?? '',
      type: StoryType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => StoryType.image,
      ),
      url: json['url'] ?? '',
      thumbnail: json['thumbnail'],
      duration: Duration(seconds: json['duration'] ?? 5),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isViewed: json['isViewed'] ?? false,
    );
  }
}

enum StoryType {
  image,
  video,
}
