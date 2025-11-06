class StoryModel {
  final String id;
  final String storyId;
  final String userId;
  final String mediaUrl;
  final String mediaType; // 'image', 'video', 'text'
  final String? thumbnail;
  final String? caption;
  final int duration; // seconds
  final String? backgroundColor;
  final StoryMusic? music;
  final StoryLocation? location;
  final List<StoryMention> mentions;
  final List<String> hashtags;
  final int viewCount;
  final int reactionCount;
  final int replyCount;
  final List<String> viewers; // User IDs who viewed
  final List<StoryReaction> reactions;
  final List<StoryReply> replies;
  final String status; // 'active', 'expired', 'deleted'
  final DateTime createdAt;
  final DateTime expiresAt;
  final DateTime updatedAt;
  
  // User info (populated from API)
  final String? username;
  final String? userAvatar;
  final bool? isVerified;

  StoryModel({
    required this.id,
    required this.storyId,
    required this.userId,
    required this.mediaUrl,
    required this.mediaType,
    this.thumbnail,
    this.caption,
    this.duration = 5,
    this.backgroundColor,
    this.music,
    this.location,
    this.mentions = const [],
    this.hashtags = const [],
    this.viewCount = 0,
    this.reactionCount = 0,
    this.replyCount = 0,
    this.viewers = const [],
    this.reactions = const [],
    this.replies = const [],
    this.status = 'active',
    required this.createdAt,
    required this.expiresAt,
    required this.updatedAt,
    this.username,
    this.userAvatar,
    this.isVerified,
  });

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    return StoryModel(
      id: json['id'] ?? json['_id'] ?? json['storyId'] ?? '',
      storyId: json['storyId'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user']?['_id'] ?? json['user']?['id'] ?? '',
      mediaUrl: json['mediaUrl'] ?? json['media']?['url'] ?? '',
      mediaType: json['mediaType'] ?? json['type'] ?? json['media']?['type'] ?? 'image',
      thumbnail: json['thumbnail'] ?? json['media']?['thumbnailUrl'],
      caption: json['caption'] ?? json['text']?['content'],
      duration: json['duration'] ?? json['media']?['duration'] ?? 5,
      backgroundColor: json['backgroundColor'] ?? json['text']?['backgroundColor'],
      music: json['music'] != null ? StoryMusic.fromJson(json['music']) : null,
      location: json['location'] != null ? StoryLocation.fromJson(json['location']) : null,
      mentions: (json['mentions'] ?? []).map((m) => StoryMention.fromJson(m)).toList(),
      hashtags: List<String>.from(json['hashtags'] ?? []),
      viewCount: json['viewCount'] ?? json['view_count'] ?? 0,
      reactionCount: json['reactionCount'] ?? json['reaction_count'] ?? 0,
      replyCount: json['replyCount'] ?? json['reply_count'] ?? 0,
      viewers: List<String>.from(json['viewers'] ?? []),
      reactions: (json['reactions'] ?? []).map((r) => StoryReaction.fromJson(r)).toList(),
      replies: (json['replies'] ?? []).map((r) => StoryReply.fromJson(r)).toList(),
      status: json['status'] ?? 'active',
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is DateTime
              ? json['createdAt']
              : DateTime.parse(json['createdAt'].toString()))
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      expiresAt: json['expiresAt'] != null
          ? (json['expiresAt'] is DateTime
              ? json['expiresAt']
              : DateTime.parse(json['expiresAt'].toString()))
          : json['expires_at'] != null
              ? DateTime.parse(json['expires_at'].toString())
              : DateTime.now().add(const Duration(hours: 24)),
      updatedAt: json['updatedAt'] != null
          ? (json['updatedAt'] is DateTime
              ? json['updatedAt']
              : DateTime.parse(json['updatedAt'].toString()))
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : DateTime.now(),
      username: json['username'] ?? json['user']?['username'],
      userAvatar: json['userAvatar'] ?? json['user']?['avatar'],
      isVerified: json['isVerified'] ?? json['user']?['verified'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storyId': storyId,
      'userId': userId,
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'thumbnail': thumbnail,
      'caption': caption,
      'duration': duration,
      'backgroundColor': backgroundColor,
      'music': music?.toJson(),
      'location': location?.toJson(),
      'mentions': mentions.map((m) => m.toJson()).toList(),
      'hashtags': hashtags,
      'viewCount': viewCount,
      'reactionCount': reactionCount,
      'replyCount': replyCount,
      'viewers': viewers,
      'reactions': reactions.map((r) => r.toJson()).toList(),
      'replies': replies.map((r) => r.toJson()).toList(),
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'active' && !isExpired;
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isImage => mediaType == 'image';
  bool get isVideo => mediaType == 'video';
  bool get isText => mediaType == 'text';
  
  Duration get remainingTime {
    final remaining = expiresAt.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }
}

class StoryMusic {
  final String title;
  final String artist;
  final String? url;

  StoryMusic({
    required this.title,
    required this.artist,
    this.url,
  });

  factory StoryMusic.fromJson(Map<String, dynamic> json) {
    return StoryMusic(
      title: json['title'] ?? '',
      artist: json['artist'] ?? '',
      url: json['url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'artist': artist,
      'url': url,
    };
  }
}

class StoryLocation {
  final String name;
  final double? latitude;
  final double? longitude;

  StoryLocation({
    required this.name,
    this.latitude,
    this.longitude,
  });

  factory StoryLocation.fromJson(Map<String, dynamic> json) {
    return StoryLocation(
      name: json['name'] ?? '',
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}

class StoryMention {
  final String userId;
  final double? x;
  final double? y;

  StoryMention({
    required this.userId,
    this.x,
    this.y,
  });

  factory StoryMention.fromJson(Map<String, dynamic> json) {
    return StoryMention(
      userId: json['userId'] ?? json['user']?['_id'] ?? json['user']?['id'] ?? '',
      x: json['x'] ?? json['position']?['x'] != null ? (json['position']?['x'] as num).toDouble() : null,
      y: json['y'] ?? json['position']?['y'] != null ? (json['position']?['y'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'x': x,
      'y': y,
    };
  }
}

class StoryReaction {
  final String userId;
  final String type; // 'like', 'love', 'laugh', etc.
  final DateTime timestamp;

  StoryReaction({
    required this.userId,
    required this.type,
    required this.timestamp,
  });

  factory StoryReaction.fromJson(Map<String, dynamic> json) {
    return StoryReaction(
      userId: json['userId'] ?? json['user']?['_id'] ?? json['user']?['id'] ?? '',
      type: json['type'] ?? 'like',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'type': type,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class StoryReply {
  final String userId;
  final String message;
  final DateTime timestamp;

  StoryReply({
    required this.userId,
    required this.message,
    required this.timestamp,
  });

  factory StoryReply.fromJson(Map<String, dynamic> json) {
    return StoryReply(
      userId: json['userId'] ?? json['user']?['_id'] ?? json['user']?['id'] ?? '',
      message: json['message'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Story group by user (for feed display)
class StoryGroup {
  final String userId;
  final String? username;
  final String? userAvatar;
  final bool? isVerified;
  final List<StoryModel> stories;
  final bool hasUnviewed;

  StoryGroup({
    required this.userId,
    this.username,
    this.userAvatar,
    this.isVerified,
    required this.stories,
    this.hasUnviewed = false,
  });

  bool get hasStories => stories.isNotEmpty;
  int get storyCount => stories.length;
}

