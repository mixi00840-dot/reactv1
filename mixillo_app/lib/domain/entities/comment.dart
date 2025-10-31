import 'package:equatable/equatable.dart';

/// Represents a comment on a post
class Comment extends Equatable {
  final String id;
  final String contentId; // Post/video ID
  final String userId;
  final CommentUser user;
  final String text;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int likesCount;
  final int repliesCount;
  final bool isLiked; // Whether current user liked this comment
  final String? parentId; // For replies/nested comments
  final List<Comment> replies; // Nested replies

  const Comment({
    required this.id,
    required this.contentId,
    required this.userId,
    required this.user,
    required this.text,
    required this.createdAt,
    this.updatedAt,
    required this.likesCount,
    required this.repliesCount,
    required this.isLiked,
    this.parentId,
    this.replies = const [],
  });

  bool get isReply => parentId != null;

  Comment copyWith({
    String? id,
    String? contentId,
    String? userId,
    CommentUser? user,
    String? text,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? likesCount,
    int? repliesCount,
    bool? isLiked,
    String? parentId,
    List<Comment>? replies,
  }) {
    return Comment(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      user: user ?? this.user,
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      likesCount: likesCount ?? this.likesCount,
      repliesCount: repliesCount ?? this.repliesCount,
      isLiked: isLiked ?? this.isLiked,
      parentId: parentId ?? this.parentId,
      replies: replies ?? this.replies,
    );
  }

  @override
  List<Object?> get props => [
        id,
        contentId,
        userId,
        user,
        text,
        createdAt,
        updatedAt,
        likesCount,
        repliesCount,
        isLiked,
        parentId,
        replies,
      ];
}

/// User information for comment author
class CommentUser extends Equatable {
  final String id;
  final String username;
  final String? fullName;
  final String? avatar;
  final bool isVerified;

  const CommentUser({
    required this.id,
    required this.username,
    this.fullName,
    this.avatar,
    this.isVerified = false,
  });

  CommentUser copyWith({
    String? id,
    String? username,
    String? fullName,
    String? avatar,
    bool? isVerified,
  }) {
    return CommentUser(
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
