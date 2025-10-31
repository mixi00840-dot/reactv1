import 'package:equatable/equatable.dart';

/// Represents a story posted by a user
/// Stories expire after 24 hours
class Story extends Equatable {
  final String id;
  final String userId;
  final StoryUser creator;
  final StoryMedia media;
  final List<StoryViewer> viewers;
  final DateTime createdAt;
  final DateTime expiresAt;
  final bool isViewed; // Whether current user has viewed this story
  final int viewCount;
  final String? caption;
  final String? backgroundColor; // For text-only stories

  const Story({
    required this.id,
    required this.userId,
    required this.creator,
    required this.media,
    required this.viewers,
    required this.createdAt,
    required this.expiresAt,
    required this.isViewed,
    required this.viewCount,
    this.caption,
    this.backgroundColor,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  
  Duration get timeRemaining => expiresAt.difference(DateTime.now());
  
  Duration get timeElapsed => DateTime.now().difference(createdAt);

  Story copyWith({
    String? id,
    String? userId,
    StoryUser? creator,
    StoryMedia? media,
    List<StoryViewer>? viewers,
    DateTime? createdAt,
    DateTime? expiresAt,
    bool? isViewed,
    int? viewCount,
    String? caption,
    String? backgroundColor,
  }) {
    return Story(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      creator: creator ?? this.creator,
      media: media ?? this.media,
      viewers: viewers ?? this.viewers,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      isViewed: isViewed ?? this.isViewed,
      viewCount: viewCount ?? this.viewCount,
      caption: caption ?? this.caption,
      backgroundColor: backgroundColor ?? this.backgroundColor,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        creator,
        media,
        viewers,
        createdAt,
        expiresAt,
        isViewed,
        viewCount,
        caption,
        backgroundColor,
      ];
}

/// User information for story creator
class StoryUser extends Equatable {
  final String id;
  final String username;
  final String? fullName;
  final String? avatar;
  final bool isVerified;

  const StoryUser({
    required this.id,
    required this.username,
    this.fullName,
    this.avatar,
    this.isVerified = false,
  });

  StoryUser copyWith({
    String? id,
    String? username,
    String? fullName,
    String? avatar,
    bool? isVerified,
  }) {
    return StoryUser(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      avatar: avatar ?? this.avatar,
      isVerified: isVerified ?? this.isVerified,
    );
  }

  @override
  List<Object?> get props => [id, username, fullName, avatar, isVerified];
}

/// Media content of a story (photo or video)
class StoryMedia extends Equatable {
  final String id;
  final StoryMediaType type;
  final String url;
  final String? thumbnailUrl;
  final int? duration; // in seconds, for videos
  final int? width;
  final int? height;

  const StoryMedia({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.duration,
    this.width,
    this.height,
  });

  StoryMedia copyWith({
    String? id,
    StoryMediaType? type,
    String? url,
    String? thumbnailUrl,
    int? duration,
    int? width,
    int? height,
  }) {
    return StoryMedia(
      id: id ?? this.id,
      type: type ?? this.type,
      url: url ?? this.url,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      duration: duration ?? this.duration,
      width: width ?? this.width,
      height: height ?? this.height,
    );
  }

  @override
  List<Object?> get props => [id, type, url, thumbnailUrl, duration, width, height];
}

enum StoryMediaType {
  photo,
  video,
}

/// Viewer information for who viewed the story
class StoryViewer extends Equatable {
  final String userId;
  final String username;
  final String? avatar;
  final DateTime viewedAt;

  const StoryViewer({
    required this.userId,
    required this.username,
    this.avatar,
    required this.viewedAt,
  });

  StoryViewer copyWith({
    String? userId,
    String? username,
    String? avatar,
    DateTime? viewedAt,
  }) {
    return StoryViewer(
      userId: userId ?? this.userId,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      viewedAt: viewedAt ?? this.viewedAt,
    );
  }

  @override
  List<Object?> get props => [userId, username, avatar, viewedAt];
}

/// Groups multiple stories from the same user
class StoryGroup extends Equatable {
  final StoryUser user;
  final List<Story> stories;
  final bool hasUnviewed;

  const StoryGroup({
    required this.user,
    required this.stories,
    required this.hasUnviewed,
  });

  Story get firstStory => stories.first;
  
  Story get firstUnviewedStory => stories.firstWhere(
        (story) => !story.isViewed,
        orElse: () => stories.first,
      );

  int get unviewedCount => stories.where((story) => !story.isViewed).length;

  StoryGroup copyWith({
    StoryUser? user,
    List<Story>? stories,
    bool? hasUnviewed,
  }) {
    return StoryGroup(
      user: user ?? this.user,
      stories: stories ?? this.stories,
      hasUnviewed: hasUnviewed ?? this.hasUnviewed,
    );
  }

  @override
  List<Object?> get props => [user, stories, hasUnviewed];
}
