class Comment {
  final String id;
  final String contentId;
  final String userId;
  final String? username;
  final String? userAvatar;
  final String text;
  final int likes;
  final bool isLiked;
  final int replies;
  final String? parentCommentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Comment({
    required this.id,
    required this.contentId,
    required this.userId,
    this.username,
    this.userAvatar,
    required this.text,
    this.likes = 0,
    this.isLiked = false,
    this.replies = 0,
    this.parentCommentId,
    this.createdAt,
    this.updatedAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] ?? json['id'] ?? '',
      contentId: json['contentId'] ?? json['content'] ?? '',
      userId: json['userId'] ?? json['user']?['_id'] ?? '',
      username: json['username'] ?? json['user']?['username'],
      userAvatar: json['userAvatar'] ?? json['user']?['avatar'],
      text: json['text'] ?? '',
      likes: json['likes'] ?? json['likesCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      replies: json['replies'] ?? json['repliesCount'] ?? 0,
      parentCommentId: json['parentCommentId'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contentId': contentId,
      'userId': userId,
      if (username != null) 'username': username,
      if (userAvatar != null) 'userAvatar': userAvatar,
      'text': text,
      'likes': likes,
      'isLiked': isLiked,
      'replies': replies,
      if (parentCommentId != null) 'parentCommentId': parentCommentId,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  Comment copyWith({
    String? id,
    String? contentId,
    String? userId,
    String? username,
    String? userAvatar,
    String? text,
    int? likes,
    bool? isLiked,
    int? replies,
    String? parentCommentId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Comment(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      text: text ?? this.text,
      likes: likes ?? this.likes,
      isLiked: isLiked ?? this.isLiked,
      replies: replies ?? this.replies,
      parentCommentId: parentCommentId ?? this.parentCommentId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
