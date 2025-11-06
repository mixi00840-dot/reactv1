/// Enhanced Comment Model - Complete backend structure
/// Matches backend Comment model with all fields

class CommentModel {
  // Basic identification
  final String id;
  final String contentId; // Video/Post ID
  final String userId; // Comment author
  final String? parentId; // For replies
  
  // Content
  final String text;
  final List<Mention>? mentions;
  final List<String>? hashtags;
  
  // Engagement
  final int likes;
  final int replies;
  final bool isLiked;
  final bool isPinned;
  final bool isEdited;
  
  // Status
  final CommentStatus status;
  final bool isDeleted;
  
  // Author info (embedded)
  final CommentAuthor? author;
  
  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? editedAt;
  final DateTime? deletedAt;
  
  // Additional metadata
  final Map<String, dynamic>? metadata;
  final List<CommentModel>? repliesList; // Nested replies

  CommentModel({
    required this.id,
    required this.contentId,
    required this.userId,
    this.parentId,
    required this.text,
    this.mentions,
    this.hashtags,
    this.likes = 0,
    this.replies = 0,
    this.isLiked = false,
    this.isPinned = false,
    this.isEdited = false,
    this.status = CommentStatus.published,
    this.isDeleted = false,
    this.author,
    required this.createdAt,
    this.updatedAt,
    this.editedAt,
    this.deletedAt,
    this.metadata,
    this.repliesList,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    // Handle different backend response formats
    final commentId = json['id'] ?? json['_id'] ?? json['commentId'] ?? '';
    
    // Parse author from various formats
    CommentAuthor? author;
    if (json['author'] != null) {
      author = CommentAuthor.fromJson(json['author']);
    } else if (json['user'] != null) {
      author = CommentAuthor.fromJson(json['user']);
    } else if (json['userId'] != null) {
      author = CommentAuthor(
        id: json['userId'] ?? '',
        username: json['username'] ?? '@user',
        avatar: json['avatar'] ?? json['avatarUrl'] ?? '',
        verified: json['verified'] ?? json['isVerified'] ?? false,
      );
    }

    // Parse nested replies
    List<CommentModel>? repliesList;
    if (json['replies'] != null && json['replies'] is List) {
      repliesList = (json['replies'] as List)
          .map((r) => CommentModel.fromJson(r))
          .toList();
    }

    return CommentModel(
      id: commentId,
      contentId: json['contentId'] ?? json['content_id'] ?? json['videoId'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? author?.id ?? '',
      parentId: json['parentId'] ?? json['parent_id'],
      text: json['text'] ?? json['content'] ?? json['comment'] ?? '',
      mentions: json['mentions'] != null
          ? (json['mentions'] as List).map((m) => Mention.fromJson(m)).toList()
          : null,
      hashtags: json['hashtags'] != null
          ? List<String>.from(json['hashtags'])
          : null,
      likes: json['likes'] ?? json['likeCount'] ?? 0,
      replies: json['replies'] != null && json['replies'] is List
          ? (json['replies'] as List).length
          : json['replyCount'] ?? json['repliesCount'] ?? 0,
      isLiked: json['isLiked'] ?? json['is_liked'] ?? false,
      isPinned: json['isPinned'] ?? json['is_pinned'] ?? false,
      isEdited: json['isEdited'] ?? json['is_edited'] ?? false,
      status: _parseCommentStatus(json['status'] ?? 'published'),
      isDeleted: json['isDeleted'] ?? json['is_deleted'] ?? false,
      author: author,
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
      editedAt: json['editedAt'] != null
          ? DateTime.parse(json['editedAt'].toString())
          : json['edited_at'] != null
              ? DateTime.parse(json['edited_at'].toString())
              : null,
      deletedAt: json['deletedAt'] != null
          ? DateTime.parse(json['deletedAt'].toString())
          : json['deleted_at'] != null
              ? DateTime.parse(json['deleted_at'].toString())
              : null,
      metadata: json['metadata'],
      repliesList: repliesList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contentId': contentId,
      'userId': userId,
      if (parentId != null) 'parentId': parentId,
      'text': text,
      if (mentions != null) 'mentions': mentions!.map((m) => m.toJson()).toList(),
      if (hashtags != null) 'hashtags': hashtags,
      'likes': likes,
      'replies': replies,
      'isLiked': isLiked,
      'isPinned': isPinned,
      'isEdited': isEdited,
      'status': status.name,
      'isDeleted': isDeleted,
      if (author != null) 'author': author!.toJson(),
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (editedAt != null) 'editedAt': editedAt!.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      if (repliesList != null)
        'replies': repliesList!.map((r) => r.toJson()).toList(),
    };
  }

  CommentModel copyWith({
    String? id,
    String? contentId,
    String? userId,
    String? parentId,
    String? text,
    List<Mention>? mentions,
    List<String>? hashtags,
    int? likes,
    int? replies,
    bool? isLiked,
    bool? isPinned,
    bool? isEdited,
    CommentStatus? status,
    bool? isDeleted,
    CommentAuthor? author,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? editedAt,
    DateTime? deletedAt,
    Map<String, dynamic>? metadata,
    List<CommentModel>? repliesList,
  }) {
    return CommentModel(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      parentId: parentId ?? this.parentId,
      text: text ?? this.text,
      mentions: mentions ?? this.mentions,
      hashtags: hashtags ?? this.hashtags,
      likes: likes ?? this.likes,
      replies: replies ?? this.replies,
      isLiked: isLiked ?? this.isLiked,
      isPinned: isPinned ?? this.isPinned,
      isEdited: isEdited ?? this.isEdited,
      status: status ?? this.status,
      isDeleted: isDeleted ?? this.isDeleted,
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      editedAt: editedAt ?? this.editedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      metadata: metadata ?? this.metadata,
      repliesList: repliesList ?? this.repliesList,
    );
  }

  // Helper getters
  bool get isReply => parentId != null;
  bool get hasReplies => replies > 0 || (repliesList != null && repliesList!.isNotEmpty);
  String get displayText => isDeleted ? '[Deleted]' : text;

  static CommentStatus _parseCommentStatus(dynamic value) {
    if (value is String) {
      return CommentStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => CommentStatus.published,
      );
    }
    return CommentStatus.published;
  }
}

// Enums
enum CommentStatus { published, pending, hidden, deleted }

// Supporting Models
class CommentAuthor {
  final String id;
  final String username;
  final String? displayName;
  final String avatar;
  final bool verified;
  final bool? isFollowing;

  CommentAuthor({
    required this.id,
    required this.username,
    this.displayName,
    required this.avatar,
    this.verified = false,
    this.isFollowing,
  });

  factory CommentAuthor.fromJson(Map<String, dynamic> json) {
    return CommentAuthor(
      id: json['id'] ?? json['_id'] ?? json['userId'] ?? '',
      username: json['username'] ?? '@user',
      displayName: json['displayName'] ?? json['display_name'] ?? json['fullName'],
      avatar: json['avatar'] ?? json['avatarUrl'] ?? '',
      verified: json['verified'] ?? json['isVerified'] ?? false,
      isFollowing: json['isFollowing'] ?? json['is_following'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    if (displayName != null) 'displayName': displayName,
    'avatar': avatar,
    'verified': verified,
    if (isFollowing != null) 'isFollowing': isFollowing,
  };
}

// Reuse Mention from video_model.dart
// If not available, define here:
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

