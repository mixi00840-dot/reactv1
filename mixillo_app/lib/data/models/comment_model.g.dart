// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'comment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CommentModel _$CommentModelFromJson(Map<String, dynamic> json) => CommentModel(
      id: json['id'] as String,
      contentId: json['contentId'] as String,
      userId: json['userId'] as String,
      user: CommentModel._userFromJson(json['user'] as Map<String, dynamic>),
      text: json['text'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      likesCount: (json['likesCount'] as num).toInt(),
      repliesCount: (json['repliesCount'] as num).toInt(),
      isLiked: json['isLiked'] as bool,
      parentId: json['parentId'] as String?,
      replies: json['replies'] == null
          ? const []
          : CommentModel._repliesFromJson(json['replies'] as List?),
    );

Map<String, dynamic> _$CommentModelToJson(CommentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'contentId': instance.contentId,
      'userId': instance.userId,
      'text': instance.text,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'likesCount': instance.likesCount,
      'repliesCount': instance.repliesCount,
      'isLiked': instance.isLiked,
      'parentId': instance.parentId,
      'user': CommentModel._userToJson(instance.user),
      'replies': CommentModel._repliesToJson(instance.replies),
    };

CommentUserModel _$CommentUserModelFromJson(Map<String, dynamic> json) =>
    CommentUserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      fullName: json['fullName'] as String?,
      avatar: json['avatar'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
    );

Map<String, dynamic> _$CommentUserModelToJson(CommentUserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'fullName': instance.fullName,
      'avatar': instance.avatar,
      'isVerified': instance.isVerified,
    };
