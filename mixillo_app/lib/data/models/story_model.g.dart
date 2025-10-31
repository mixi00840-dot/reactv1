// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'story_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StoryModel _$StoryModelFromJson(Map<String, dynamic> json) => StoryModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      creator: StoryUserModel.fromJson(json['creator'] as Map<String, dynamic>),
      media: StoryMediaModel.fromJson(json['media'] as Map<String, dynamic>),
      viewers: (json['viewers'] as List<dynamic>)
          .map((e) => StoryViewerModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      isViewed: json['isViewed'] as bool,
      viewCount: (json['viewCount'] as num).toInt(),
      caption: json['caption'] as String?,
      backgroundColor: json['backgroundColor'] as String?,
    );

Map<String, dynamic> _$StoryModelToJson(StoryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'creator': instance.creator.toJson(),
      'media': instance.media.toJson(),
      'viewers': instance.viewers.map((e) => e.toJson()).toList(),
      'createdAt': instance.createdAt.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
      'isViewed': instance.isViewed,
      'viewCount': instance.viewCount,
      'caption': instance.caption,
      'backgroundColor': instance.backgroundColor,
    };

StoryUserModel _$StoryUserModelFromJson(Map<String, dynamic> json) =>
    StoryUserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      fullName: json['fullName'] as String?,
      avatar: json['avatar'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
    );

Map<String, dynamic> _$StoryUserModelToJson(StoryUserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'fullName': instance.fullName,
      'avatar': instance.avatar,
      'isVerified': instance.isVerified,
    };

StoryMediaModel _$StoryMediaModelFromJson(Map<String, dynamic> json) =>
    StoryMediaModel(
      id: json['id'] as String,
      type: $enumDecode(_$StoryMediaTypeEnumMap, json['type'],
          unknownValue: StoryMediaType.photo),
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      duration: (json['duration'] as num?)?.toInt(),
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
    );

Map<String, dynamic> _$StoryMediaModelToJson(StoryMediaModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$StoryMediaTypeEnumMap[instance.type]!,
      'url': instance.url,
      'thumbnailUrl': instance.thumbnailUrl,
      'duration': instance.duration,
      'width': instance.width,
      'height': instance.height,
    };

const _$StoryMediaTypeEnumMap = {
  StoryMediaType.photo: 'photo',
  StoryMediaType.video: 'video',
};

StoryViewerModel _$StoryViewerModelFromJson(Map<String, dynamic> json) =>
    StoryViewerModel(
      userId: json['userId'] as String,
      username: json['username'] as String,
      avatar: json['avatar'] as String?,
      viewedAt: DateTime.parse(json['viewedAt'] as String),
    );

Map<String, dynamic> _$StoryViewerModelToJson(StoryViewerModel instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'username': instance.username,
      'avatar': instance.avatar,
      'viewedAt': instance.viewedAt.toIso8601String(),
    };

StoryGroupModel _$StoryGroupModelFromJson(Map<String, dynamic> json) =>
    StoryGroupModel(
      user: StoryUserModel.fromJson(json['user'] as Map<String, dynamic>),
      stories: (json['stories'] as List<dynamic>)
          .map((e) => StoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      hasUnviewed: json['hasUnviewed'] as bool,
    );

Map<String, dynamic> _$StoryGroupModelToJson(StoryGroupModel instance) =>
    <String, dynamic>{
      'user': instance.user.toJson(),
      'stories': instance.stories.map((e) => e.toJson()).toList(),
      'hasUnviewed': instance.hasUnviewed,
    };
