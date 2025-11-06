class TrendingHashtagModel {
  final String hashtag;
  final int videoCount;
  final bool isTrending;
  final double? trendScore;

  TrendingHashtagModel({
    required this.hashtag,
    required this.videoCount,
    this.isTrending = false,
    this.trendScore,
  });

  factory TrendingHashtagModel.fromJson(Map<String, dynamic> json) {
    return TrendingHashtagModel(
      hashtag: json['hashtag'] ?? json['name'] ?? '',
      videoCount: json['videoCount'] ?? json['video_count'] ?? json['count'] ?? 0,
      isTrending: json['isTrending'] ?? json['is_trending'] ?? json['trending'] ?? false,
      trendScore: json['trendScore'] != null ? (json['trendScore'] as num).toDouble() : json['trend_score'] != null ? (json['trend_score'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'hashtag': hashtag,
      'videoCount': videoCount,
      'isTrending': isTrending,
      'trendScore': trendScore,
    };
  }
}

class TrendingVideoModel {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String? title;
  final String? caption;
  final String creatorId;
  final String? creatorUsername;
  final String? creatorAvatar;
  final int views;
  final int likes;
  final int comments;
  final String? duration;
  final List<String>? hashtags;
  final double? trendScore;
  final DateTime? createdAt;

  TrendingVideoModel({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    this.title,
    this.caption,
    required this.creatorId,
    this.creatorUsername,
    this.creatorAvatar,
    this.views = 0,
    this.likes = 0,
    this.comments = 0,
    this.duration,
    this.hashtags,
    this.trendScore,
    this.createdAt,
  });

  factory TrendingVideoModel.fromJson(Map<String, dynamic> json) {
    return TrendingVideoModel(
      id: json['id'] ?? json['_id'] ?? json['contentId'] ?? '',
      videoUrl: json['videoUrl'] ?? json['video_url'] ?? json['media']?['url'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail_url'] ?? json['media']?['thumbnailUrl'] ?? '',
      title: json['title'],
      caption: json['caption'],
      creatorId: json['creatorId'] ?? json['creator']?['_id'] ?? json['creator']?['id'] ?? json['userId'] ?? '',
      creatorUsername: json['creatorUsername'] ?? json['creator']?['username'],
      creatorAvatar: json['creatorAvatar'] ?? json['creator']?['avatar'],
      views: json['views'] ?? json['viewCount'] ?? 0,
      likes: json['likes'] ?? json['likeCount'] ?? 0,
      comments: json['comments'] ?? json['commentCount'] ?? 0,
      duration: json['duration']?.toString(),
      hashtags: json['hashtags'] != null ? List<String>.from(json['hashtags']) : null,
      trendScore: json['trendScore'] != null ? (json['trendScore'] as num).toDouble() : json['trend_score'] != null ? (json['trend_score'] as num).toDouble() : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'title': title,
      'caption': caption,
      'creatorId': creatorId,
      'creatorUsername': creatorUsername,
      'creatorAvatar': creatorAvatar,
      'views': views,
      'likes': likes,
      'comments': comments,
      'duration': duration,
      'hashtags': hashtags,
      'trendScore': trendScore,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

class TrendingUserModel {
  final String id;
  final String username;
  final String? displayName;
  final String? avatar;
  final int followers;
  final int following;
  final int videos;
  final bool isVerified;
  final bool? isFollowing;
  final double? trendScore;

  TrendingUserModel({
    required this.id,
    required this.username,
    this.displayName,
    this.avatar,
    this.followers = 0,
    this.following = 0,
    this.videos = 0,
    this.isVerified = false,
    this.isFollowing,
    this.trendScore,
  });

  factory TrendingUserModel.fromJson(Map<String, dynamic> json) {
    return TrendingUserModel(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '@user',
      displayName: json['displayName'] ?? json['display_name'] ?? json['fullName'] ?? json['full_name'],
      avatar: json['avatar'] ?? json['avatarUrl'],
      followers: json['followers'] ?? json['followerCount'] ?? 0,
      following: json['following'] ?? json['followingCount'] ?? 0,
      videos: json['videos'] ?? json['videoCount'] ?? 0,
      isVerified: json['isVerified'] ?? json['verified'] ?? false,
      isFollowing: json['isFollowing'],
      trendScore: json['trendScore'] != null ? (json['trendScore'] as num).toDouble() : json['trend_score'] != null ? (json['trend_score'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'displayName': displayName,
      'avatar': avatar,
      'followers': followers,
      'following': following,
      'videos': videos,
      'isVerified': isVerified,
      'isFollowing': isFollowing,
      'trendScore': trendScore,
    };
  }
}

class SearchResultModel {
  final List<TrendingVideoModel> videos;
  final List<TrendingUserModel> users;
  final List<TrendingHashtagModel> hashtags;
  final List<dynamic>? sounds;

  SearchResultModel({
    this.videos = const [],
    this.users = const [],
    this.hashtags = const [],
    this.sounds,
  });

  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    return SearchResultModel(
      videos: (json['videos'] ?? []).map((v) => TrendingVideoModel.fromJson(v)).toList(),
      users: (json['users'] ?? []).map((u) => TrendingUserModel.fromJson(u)).toList(),
      hashtags: (json['hashtags'] ?? []).map((h) => TrendingHashtagModel.fromJson(h)).toList(),
      sounds: json['sounds'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'videos': videos.map((v) => v.toJson()).toList(),
      'users': users.map((u) => u.toJson()).toList(),
      'hashtags': hashtags.map((h) => h.toJson()).toList(),
      'sounds': sounds,
    };
  }
}

