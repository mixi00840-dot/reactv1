/// Enhanced Video Model - Complete backend structure
/// Matches backend Content model with all fields

class VideoModel {
  // Content identification
  final String id;
  final String? contentId;
  final String userId;
  
  // Content type and status
  final ContentType type;
  final ContentStatus status;
  final ContentVisibility visibility;
  
  // Content metadata
  final String? caption;
  final String? description;
  final String? title;
  
  // Tags and mentions
  final List<String> tags;
  final List<Hashtag> hashtags;
  final List<Mention> mentions;
  
  // Location data
  final Location? location;
  
  // Sound/Music association
  final SoundInfo? sound;
  final bool originalSound;
  
  // Media files
  final MediaInfo media;
  
  // Engagement metrics
  final EngagementMetrics metrics;
  
  // User interaction states
  final bool isLiked;
  final bool isFollowing;
  final bool isSaved;
  final bool isReposted;
  
  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? publishedAt;
  
  // Additional metadata
  final Map<String, dynamic>? metadata;
  final List<String>? categories;
  final String? language;
  final bool isFeatured;
  final bool isPinned;
  final int? viewCount;
  final int? likeCount;
  final int? commentCount;
  final int? shareCount;
  final int? repostCount;

  VideoModel({
    required this.id,
    this.contentId,
    required this.userId,
    this.type = ContentType.video,
    this.status = ContentStatus.ready,
    this.visibility = ContentVisibility.public,
    this.caption,
    this.description,
    this.title,
    this.tags = const [],
    this.hashtags = const [],
    this.mentions = const [],
    this.location,
    this.sound,
    this.originalSound = false,
    required this.media,
    required this.metrics,
    this.isLiked = false,
    this.isFollowing = false,
    this.isSaved = false,
    this.isReposted = false,
    required this.createdAt,
    this.updatedAt,
    this.publishedAt,
    this.metadata,
    this.categories,
    this.language,
    this.isFeatured = false,
    this.isPinned = false,
    this.viewCount,
    this.likeCount,
    this.commentCount,
    this.shareCount,
    this.repostCount,
  });

  factory VideoModel.fromJson(Map<String, dynamic> json) {
    // Handle different backend response formats
    final contentId = json['id'] ?? json['_id'] ?? json['contentId'] ?? '';
    final userId = json['userId'] ?? json['creator']?['id'] ?? json['creator']?['_id'] ?? '';
    
    return VideoModel(
      id: contentId,
      contentId: json['contentId'],
      userId: userId,
      type: _parseContentType(json['type'] ?? 'video'),
      status: _parseContentStatus(json['status'] ?? 'ready'),
      visibility: _parseVisibility(json['visibility'] ?? 'public'),
      caption: json['caption'] ?? json['description'],
      description: json['description'],
      title: json['title'],
      tags: List<String>.from(json['tags'] ?? []),
            hashtags: (json['hashtags'] ?? []).map((h) => Hashtag.fromJson(h is Map ? Map<String, dynamic>.from(h) : {'tag': h.toString()})).toList(),
      mentions: (json['mentions'] ?? []).map((m) => Mention.fromJson(m)).toList(),
      location: json['location'] != null ? Location.fromJson(json['location']) : null,
      sound: json['sound'] != null || json['soundId'] != null 
          ? SoundInfo.fromJson(json['sound'] ?? {'id': json['soundId']})
          : null,
      originalSound: json['originalSound'] ?? false,
      media: MediaInfo.fromJson(json['media'] ?? {
        'videoUrl': json['videoUrl'],
        'thumbnailUrl': json['thumbnailUrl'],
        'duration': json['duration'],
      }),
      metrics: EngagementMetrics.fromJson(json['metrics'] ?? json['stats'] ?? {
        'views': json['views'] ?? json['viewCount'] ?? 0,
        'likes': json['likes'] ?? json['likeCount'] ?? 0,
        'comments': json['comments'] ?? json['commentCount'] ?? 0,
        'shares': json['shares'] ?? json['shareCount'] ?? 0,
      }),
      isLiked: json['isLiked'] ?? false,
      isFollowing: json['isFollowing'] ?? false,
      isSaved: json['isSaved'] ?? false,
      isReposted: json['isReposted'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'].toString())
          : null,
      metadata: json['metadata'],
      categories: json['categories'] != null ? List<String>.from(json['categories']) : null,
      language: json['language'],
      isFeatured: json['isFeatured'] ?? false,
      isPinned: json['isPinned'] ?? false,
      viewCount: json['viewCount'] ?? json['views'],
      likeCount: json['likeCount'] ?? json['likes'],
      commentCount: json['commentCount'] ?? json['comments'],
      shareCount: json['shareCount'] ?? json['shares'],
      repostCount: json['repostCount'] ?? json['reposts'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (contentId != null) 'contentId': contentId,
      'userId': userId,
      'type': type.name,
      'status': status.name,
      'visibility': visibility.name,
      if (caption != null) 'caption': caption,
      if (description != null) 'description': description,
      if (title != null) 'title': title,
      'tags': tags,
      'hashtags': hashtags.map((h) => h.toJson()).toList(),
      'mentions': mentions.map((m) => m.toJson()).toList(),
      if (location != null) 'location': location!.toJson(),
      if (sound != null) 'sound': sound!.toJson(),
      'originalSound': originalSound,
      'media': media.toJson(),
      'metrics': metrics.toJson(),
      'isLiked': isLiked,
      'isFollowing': isFollowing,
      'isSaved': isSaved,
      'isReposted': isReposted,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (publishedAt != null) 'publishedAt': publishedAt!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      if (categories != null) 'categories': categories,
      if (language != null) 'language': language,
      'isFeatured': isFeatured,
      'isPinned': isPinned,
      if (viewCount != null) 'viewCount': viewCount,
      if (likeCount != null) 'likeCount': likeCount,
      if (commentCount != null) 'commentCount': commentCount,
      if (shareCount != null) 'shareCount': shareCount,
      if (repostCount != null) 'repostCount': repostCount,
    };
  }

  VideoModel copyWith({
    String? id,
    String? contentId,
    String? userId,
    ContentType? type,
    ContentStatus? status,
    ContentVisibility? visibility,
    String? caption,
    String? description,
    String? title,
    List<String>? tags,
    List<Hashtag>? hashtags,
    List<Mention>? mentions,
    Location? location,
    SoundInfo? sound,
    bool? originalSound,
    MediaInfo? media,
    EngagementMetrics? metrics,
    bool? isLiked,
    bool? isFollowing,
    bool? isSaved,
    bool? isReposted,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? publishedAt,
    Map<String, dynamic>? metadata,
    List<String>? categories,
    String? language,
    bool? isFeatured,
    bool? isPinned,
    int? viewCount,
    int? likeCount,
    int? commentCount,
    int? shareCount,
    int? repostCount,
  }) {
    return VideoModel(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      status: status ?? this.status,
      visibility: visibility ?? this.visibility,
      caption: caption ?? this.caption,
      description: description ?? this.description,
      title: title ?? this.title,
      tags: tags ?? this.tags,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      location: location ?? this.location,
      sound: sound ?? this.sound,
      originalSound: originalSound ?? this.originalSound,
      media: media ?? this.media,
      metrics: metrics ?? this.metrics,
      isLiked: isLiked ?? this.isLiked,
      isFollowing: isFollowing ?? this.isFollowing,
      isSaved: isSaved ?? this.isSaved,
      isReposted: isReposted ?? this.isReposted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
      metadata: metadata ?? this.metadata,
      categories: categories ?? this.categories,
      language: language ?? this.language,
      isFeatured: isFeatured ?? this.isFeatured,
      isPinned: isPinned ?? this.isPinned,
      viewCount: viewCount ?? this.viewCount,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      shareCount: shareCount ?? this.shareCount,
      repostCount: repostCount ?? this.repostCount,
    );
  }

  // Helper getters
  String get videoUrl => media.videoUrl;
  String get thumbnailUrl => media.thumbnailUrl;
  int get duration => media.duration;
  VideoCreator get creator => VideoCreator(
    id: userId,
    username: metadata?['creator']?['username'] ?? '@user',
    avatar: metadata?['creator']?['avatar'] ?? '',
    verified: metadata?['creator']?['verified'] ?? false,
  );
  VideoStats get stats => VideoStats(
    likes: metrics.likes,
    comments: metrics.comments,
    shares: metrics.shares,
    views: metrics.views,
  );

  static ContentType _parseContentType(dynamic value) {
    if (value is String) {
      return ContentType.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => ContentType.video,
      );
    }
    return ContentType.video;
  }

  static ContentStatus _parseContentStatus(dynamic value) {
    if (value is String) {
      return ContentStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => ContentStatus.ready,
      );
    }
    return ContentStatus.ready;
  }

  static ContentVisibility _parseVisibility(dynamic value) {
    if (value is String) {
      return ContentVisibility.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => ContentVisibility.public,
      );
    }
    return ContentVisibility.public;
  }
}

// Enums
enum ContentType { video, story, post, image, carousel }
enum ContentStatus { uploading, processing, transcoding, ready, failed, deleted, archived }
enum ContentVisibility { public, private, followers, friends, unlisted }

// Supporting Models
class Hashtag {
  final String tag;
  final String? normalizedTag;

  Hashtag({required this.tag, this.normalizedTag});

  factory Hashtag.fromJson(Map<String, dynamic> json) {
    return Hashtag(
      tag: json['tag'] ?? json['hashtag'] ?? '',
      normalizedTag: json['normalizedTag'] ?? json['normalized_tag'],
    );
  }

  Map<String, dynamic> toJson() => {
    'tag': tag,
    if (normalizedTag != null) 'normalizedTag': normalizedTag,
  };
}

class Mention {
  final String userId;
  final String username;
  final int? position;

  Mention({required this.userId, required this.username, this.position});

  factory Mention.fromJson(Map<String, dynamic> json) {
    return Mention(
      userId: json['userId'] ?? json['user_id'] ?? '',
      username: json['username'] ?? '',
      position: json['position'],
    );
  }

  Map<String, dynamic> toJson() => {
    'userId': userId,
    'username': username,
    if (position != null) 'position': position,
  };
}

class Location {
  final String? name;
  final double? latitude;
  final double? longitude;
  final String? placeId;
  final String? city;
  final String? country;
  final String? countryCode;

  Location({
    this.name,
    this.latitude,
    this.longitude,
    this.placeId,
    this.city,
    this.country,
    this.countryCode,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      name: json['name'],
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      placeId: json['placeId'] ?? json['place_id'],
      city: json['city'],
      country: json['country'],
      countryCode: json['countryCode'] ?? json['country_code'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (name != null) 'name': name,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (placeId != null) 'placeId': placeId,
    if (city != null) 'city': city,
    if (country != null) 'country': country,
    if (countryCode != null) 'countryCode': countryCode,
  };
}

class SoundInfo {
  final String id;
  final String? name;
  final String? artist;
  final String? coverUrl;
  final int? duration;
  final int? usageCount;

  SoundInfo({
    required this.id,
    this.name,
    this.artist,
    this.coverUrl,
    this.duration,
    this.usageCount,
  });

  factory SoundInfo.fromJson(Map<String, dynamic> json) {
    return SoundInfo(
      id: json['id'] ?? json['_id'] ?? json['soundId'] ?? '',
      name: json['name'] ?? json['title'],
      artist: json['artist'] ?? json['author'],
      coverUrl: json['coverUrl'] ?? json['cover_url'] ?? json['thumbnail'],
      duration: json['duration'],
      usageCount: json['usageCount'] ?? json['usage_count'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    if (name != null) 'name': name,
    if (artist != null) 'artist': artist,
    if (coverUrl != null) 'coverUrl': coverUrl,
    if (duration != null) 'duration': duration,
    if (usageCount != null) 'usageCount': usageCount,
  };
}

class MediaInfo {
  final String videoUrl;
  final String thumbnailUrl;
  final int duration; // seconds
  final int? width;
  final int? height;
  final String? aspectRatio;
  final double? fps;
  final int? bitrate;
  final String? codec;
  final bool? hasAudio;
  final List<Thumbnail> thumbnails;
  final List<VideoVersion> versions;
  final AnimatedPreview? animatedPreview;

  MediaInfo({
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.duration,
    this.width,
    this.height,
    this.aspectRatio,
    this.fps,
    this.bitrate,
    this.codec,
    this.hasAudio,
    this.thumbnails = const [],
    this.versions = const [],
    this.animatedPreview,
  });

  factory MediaInfo.fromJson(Map<String, dynamic> json) {
    // Handle different response formats
    final masterFile = json['masterFile'] ?? {};
    final videoUrl = json['videoUrl'] ?? 
                     masterFile['url'] ?? 
                     json['url'] ?? 
                     '';
    
    final thumbnailsData = json['thumbnails'] ?? [];
    final defaultThumb = thumbnailsData.isNotEmpty 
        ? thumbnailsData.firstWhere((t) => t['isDefault'] == true, orElse: () => thumbnailsData.first)
        : json['thumbnail'] ?? json['thumbnailUrl'] ?? {};
    
    final thumbnailUrl = defaultThumb is Map 
        ? (defaultThumb['url'] ?? '')
        : (defaultThumb.toString());

    return MediaInfo(
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      duration: json['duration'] ?? 0,
      width: json['width'],
      height: json['height'],
      aspectRatio: json['aspectRatio'] ?? json['aspect_ratio'],
      fps: json['fps'] != null ? (json['fps'] as num).toDouble() : null,
      bitrate: json['bitrate'],
      codec: json['codec'],
      hasAudio: json['hasAudio'] ?? json['has_audio'],
      thumbnails: (json['thumbnails'] ?? []).map((t) => Thumbnail.fromJson(t)).toList(),
      versions: (json['versions'] ?? []).map((v) => VideoVersion.fromJson(v)).toList(),
      animatedPreview: json['animatedPreview'] != null 
          ? AnimatedPreview.fromJson(json['animatedPreview'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'videoUrl': videoUrl,
    'thumbnailUrl': thumbnailUrl,
    'duration': duration,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    if (aspectRatio != null) 'aspectRatio': aspectRatio,
    if (fps != null) 'fps': fps,
    if (bitrate != null) 'bitrate': bitrate,
    if (codec != null) 'codec': codec,
    if (hasAudio != null) 'hasAudio': hasAudio,
    'thumbnails': thumbnails.map((t) => t.toJson()).toList(),
    'versions': versions.map((v) => v.toJson()).toList(),
    if (animatedPreview != null) 'animatedPreview': animatedPreview!.toJson(),
  };
}

class Thumbnail {
  final String url;
  final String? key;
  final int? width;
  final int? height;
  final double? timeOffset;
  final bool isDefault;

  Thumbnail({
    required this.url,
    this.key,
    this.width,
    this.height,
    this.timeOffset,
    this.isDefault = false,
  });

  factory Thumbnail.fromJson(Map<String, dynamic> json) {
    return Thumbnail(
      url: json['url'] ?? '',
      key: json['key'],
      width: json['width'],
      height: json['height'],
      timeOffset: json['timeOffset'] != null ? (json['timeOffset'] as num).toDouble() : null,
      isDefault: json['isDefault'] ?? json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    if (key != null) 'key': key,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    if (timeOffset != null) 'timeOffset': timeOffset,
    'isDefault': isDefault,
  };
}

class VideoVersion {
  final String quality;
  final String url;
  final String? key;
  final int? size;
  final int? bitrate;
  final int? width;
  final int? height;
  final String? format;
  final String? hlsManifest;
  final String? dashManifest;

  VideoVersion({
    required this.quality,
    required this.url,
    this.key,
    this.size,
    this.bitrate,
    this.width,
    this.height,
    this.format,
    this.hlsManifest,
    this.dashManifest,
  });

  factory VideoVersion.fromJson(Map<String, dynamic> json) {
    return VideoVersion(
      quality: json['quality'] ?? '',
      url: json['url'] ?? '',
      key: json['key'],
      size: json['size'],
      bitrate: json['bitrate'],
      width: json['width'],
      height: json['height'],
      format: json['format'],
      hlsManifest: json['hlsManifest'] ?? json['hls_manifest'],
      dashManifest: json['dashManifest'] ?? json['dash_manifest'],
    );
  }

  Map<String, dynamic> toJson() => {
    'quality': quality,
    'url': url,
    if (key != null) 'key': key,
    if (size != null) 'size': size,
    if (bitrate != null) 'bitrate': bitrate,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    if (format != null) 'format': format,
    if (hlsManifest != null) 'hlsManifest': hlsManifest,
    if (dashManifest != null) 'dashManifest': dashManifest,
  };
}

class AnimatedPreview {
  final String url;
  final String? key;
  final int? duration;
  final int? size;

  AnimatedPreview({
    required this.url,
    this.key,
    this.duration,
    this.size,
  });

  factory AnimatedPreview.fromJson(Map<String, dynamic> json) {
    return AnimatedPreview(
      url: json['url'] ?? '',
      key: json['key'],
      duration: json['duration'],
      size: json['size'],
    );
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    if (key != null) 'key': key,
    if (duration != null) 'duration': duration,
    if (size != null) 'size': size,
  };
}

class EngagementMetrics {
  final int views;
  final int likes;
  final int comments;
  final int shares;
  final int? reposts;
  final int? saves;
  final int? duets;
  final int? stitches;

  EngagementMetrics({
    this.views = 0,
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    this.reposts,
    this.saves,
    this.duets,
    this.stitches,
  });

  factory EngagementMetrics.fromJson(Map<String, dynamic> json) {
    return EngagementMetrics(
      views: json['views'] ?? json['viewCount'] ?? 0,
      likes: json['likes'] ?? json['likeCount'] ?? 0,
      comments: json['comments'] ?? json['commentCount'] ?? 0,
      shares: json['shares'] ?? json['shareCount'] ?? 0,
      reposts: json['reposts'] ?? json['repostCount'],
      saves: json['saves'] ?? json['saveCount'],
      duets: json['duets'] ?? json['duetCount'],
      stitches: json['stitches'] ?? json['stitchCount'],
    );
  }

  Map<String, dynamic> toJson() => {
    'views': views,
    'likes': likes,
    'comments': comments,
    'shares': shares,
    if (reposts != null) 'reposts': reposts,
    if (saves != null) 'saves': saves,
    if (duets != null) 'duets': duets,
    if (stitches != null) 'stitches': stitches,
  };

  EngagementMetrics copyWith({
    int? views,
    int? likes,
    int? comments,
    int? shares,
    int? reposts,
    int? saves,
    int? duets,
    int? stitches,
  }) {
    return EngagementMetrics(
      views: views ?? this.views,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      reposts: reposts ?? this.reposts,
      saves: saves ?? this.saves,
      duets: duets ?? this.duets,
      stitches: stitches ?? this.stitches,
    );
  }
}

// Legacy models for backward compatibility
class VideoCreator {
  final String id;
  final String username;
  final String avatar;
  final bool verified;

  VideoCreator({
    required this.id,
    required this.username,
    required this.avatar,
    this.verified = false,
  });

  factory VideoCreator.fromJson(Map<String, dynamic> json) {
    return VideoCreator(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '@user',
      avatar: json['avatar'] ?? json['avatarUrl'] ?? '',
      verified: json['verified'] ?? json['isVerified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'avatar': avatar,
    'verified': verified,
  };
}

class VideoStats {
  final int likes;
  final int comments;
  final int shares;
  final int views;

  VideoStats({
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    this.views = 0,
  });

  factory VideoStats.fromJson(Map<String, dynamic> json) {
    return VideoStats(
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      shares: json['shares'] ?? 0,
      views: json['views'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'likes': likes,
    'comments': comments,
    'shares': shares,
    'views': views,
  };

  VideoStats copyWith({
    int? likes,
    int? comments,
    int? shares,
    int? views,
  }) {
    return VideoStats(
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      views: views ?? this.views,
    );
  }
}
