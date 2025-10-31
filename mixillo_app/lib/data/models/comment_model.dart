import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/comment.dart';

part 'comment_model.g.dart';

/// Data model for Comment with JSON serialization
@JsonSerializable(explicitToJson: true)
class CommentModel extends Comment {
  @JsonKey(fromJson: _userFromJson, toJson: _userToJson)
  @override
  final CommentUserModel user;

  @JsonKey(fromJson: _repliesFromJson, toJson: _repliesToJson)
  @override
  final List<CommentModel> replies;

  const CommentModel({
    required String id,
    required String contentId,
    required String userId,
    required this.user,
    required String text,
    required DateTime createdAt,
    DateTime? updatedAt,
    required int likesCount,
    required int repliesCount,
    required bool isLiked,
    String? parentId,
    this.replies = const [],
  }) : super(
          id: id,
          contentId: contentId,
          userId: userId,
          user: user,
          text: text,
          createdAt: createdAt,
          updatedAt: updatedAt,
          likesCount: likesCount,
          repliesCount: repliesCount,
          isLiked: isLiked,
          parentId: parentId,
          replies: replies,
        );

  static CommentUserModel _userFromJson(Map<String, dynamic> json) =>
      CommentUserModel.fromJson(json);

  static Map<String, dynamic> _userToJson(CommentUserModel user) =>
      user.toJson();

  static List<CommentModel> _repliesFromJson(List<dynamic>? json) =>
      json?.map((e) => CommentModel.fromJson(e as Map<String, dynamic>)).toList() ?? [];

  static List<Map<String, dynamic>> _repliesToJson(List<CommentModel> replies) =>
      replies.map((e) => e.toJson()).toList();

  /// Create CommentModel from JSON
  factory CommentModel.fromJson(Map<String, dynamic> json) =>
      _$CommentModelFromJson(json);

  /// Convert CommentModel to JSON
  Map<String, dynamic> toJson() => _$CommentModelToJson(this);

  /// Create CommentModel from Comment entity
  factory CommentModel.fromEntity(Comment comment) {
    return CommentModel(
      id: comment.id,
      contentId: comment.contentId,
      userId: comment.userId,
      user: comment.user is CommentUserModel
          ? comment.user as CommentUserModel
          : CommentUserModel.fromEntity(comment.user),
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount: comment.likesCount,
      repliesCount: comment.repliesCount,
      isLiked: comment.isLiked,
      parentId: comment.parentId,
      replies: comment.replies
          .map((reply) => reply is CommentModel
              ? reply
              : CommentModel.fromEntity(reply))
          .toList(),
    );
  }

  /// Convert to Comment entity
  Comment toEntity() {
    return Comment(
      id: id,
      contentId: contentId,
      userId: userId,
      user: user.toEntity(),
      text: text,
      createdAt: createdAt,
      updatedAt: updatedAt,
      likesCount: likesCount,
      repliesCount: repliesCount,
      isLiked: isLiked,
      parentId: parentId,
      replies: replies.map((reply) => reply.toEntity()).toList(),
    );
  }

  /// Create a copy with modified fields
  @override
  CommentModel copyWith({
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
    return CommentModel(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      user: (user is CommentUserModel ? user : user != null ? CommentUserModel.fromEntity(user) : this.user),
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      likesCount: likesCount ?? this.likesCount,
      repliesCount: repliesCount ?? this.repliesCount,
      isLiked: isLiked ?? this.isLiked,
      parentId: parentId ?? this.parentId,
      replies: replies != null
          ? replies.map((r) => r is CommentModel ? r : CommentModel.fromEntity(r)).toList()
          : this.replies,
    );
  }
}

/// Data model for CommentUser with JSON serialization
@JsonSerializable()
class CommentUserModel extends CommentUser {
  const CommentUserModel({
    required String id,
    required String username,
    String? fullName,
    String? avatar,
    bool isVerified = false,
  }) : super(
          id: id,
          username: username,
          fullName: fullName,
          avatar: avatar,
          isVerified: isVerified,
        );

  /// Create CommentUserModel from JSON
  factory CommentUserModel.fromJson(Map<String, dynamic> json) =>
      _$CommentUserModelFromJson(json);

  /// Convert CommentUserModel to JSON
  Map<String, dynamic> toJson() => _$CommentUserModelToJson(this);

  /// Create CommentUserModel from CommentUser entity
  factory CommentUserModel.fromEntity(CommentUser user) {
    return CommentUserModel(
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      isVerified: user.isVerified,
    );
  }

  /// Convert to CommentUser entity
  CommentUser toEntity() {
    return CommentUser(
      id: id,
      username: username,
      fullName: fullName,
      avatar: avatar,
      isVerified: isVerified,
    );
  }

  /// Create a copy with modified fields
  @override
  CommentUserModel copyWith({
    String? id,
    String? username,
    String? fullName,
    String? avatar,
    bool? isVerified,
  }) {
    return CommentUserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      avatar: avatar ?? this.avatar,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}
