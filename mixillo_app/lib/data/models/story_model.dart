import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/story.dart';

part 'story_model.g.dart';

/// Data model for Story with JSON serialization
@JsonSerializable(explicitToJson: true)
class StoryModel extends Story {
  @override
  final String id;
  @override
  final String userId;
  @override
  final StoryUserModel creator;
  @override
  final StoryMediaModel media;
  @override
  final List<StoryViewerModel> viewers;
  @override
  final DateTime createdAt;
  @override
  final DateTime expiresAt;
  @override
  final bool isViewed;
  @override
  final int viewCount;
  @override
  final String? caption;
  @override
  final String? backgroundColor;

  const StoryModel({
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
  }) : super(
          id: id,
          userId: userId,
          creator: creator,
          media: media,
          viewers: viewers,
          createdAt: createdAt,
          expiresAt: expiresAt,
          isViewed: isViewed,
          viewCount: viewCount,
          caption: caption,
          backgroundColor: backgroundColor,
        );

  factory StoryModel.fromJson(Map<String, dynamic> json) => _$StoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$StoryModelToJson(this);

  /// Convert Story entity to StoryModel
  factory StoryModel.fromEntity(Story story) {
    return StoryModel(
      id: story.id,
      userId: story.userId,
      creator: story.creator is StoryUserModel
          ? story.creator as StoryUserModel
          : StoryUserModel.fromEntity(story.creator),
      media: story.media is StoryMediaModel
          ? story.media as StoryMediaModel
          : StoryMediaModel.fromEntity(story.media),
      viewers: story.viewers
          .map((v) =>
              v is StoryViewerModel ? v : StoryViewerModel.fromEntity(v))
          .toList(),
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      isViewed: story.isViewed,
      viewCount: story.viewCount,
      caption: story.caption,
      backgroundColor: story.backgroundColor,
    );
  }
}

@JsonSerializable()
class StoryUserModel extends StoryUser {
  @override
  final String id;
  @override
  final String username;
  @override
  final String? fullName;
  @override
  final String? avatar;
  @override
  final bool isVerified;

  const StoryUserModel({
    required this.id,
    required this.username,
    this.fullName,
    this.avatar,
    this.isVerified = false,
  }) : super(
          id: id,
          username: username,
          fullName: fullName,
          avatar: avatar,
          isVerified: isVerified,
        );

  factory StoryUserModel.fromJson(Map<String, dynamic> json) =>
      _$StoryUserModelFromJson(json);

  Map<String, dynamic> toJson() => _$StoryUserModelToJson(this);

  factory StoryUserModel.fromEntity(StoryUser user) {
    return StoryUserModel(
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      isVerified: user.isVerified,
    );
  }
}

@JsonSerializable()
class StoryMediaModel extends StoryMedia {
  @override
  final String id;
  @override
  @JsonKey(unknownEnumValue: StoryMediaType.photo)
  final StoryMediaType type;
  @override
  final String url;
  @override
  final String? thumbnailUrl;
  @override
  final int? duration;
  @override
  final int? width;
  @override
  final int? height;

  const StoryMediaModel({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.duration,
    this.width,
    this.height,
  }) : super(
          id: id,
          type: type,
          url: url,
          thumbnailUrl: thumbnailUrl,
          duration: duration,
          width: width,
          height: height,
        );

  factory StoryMediaModel.fromJson(Map<String, dynamic> json) =>
      _$StoryMediaModelFromJson(json);

  Map<String, dynamic> toJson() => _$StoryMediaModelToJson(this);

  factory StoryMediaModel.fromEntity(StoryMedia media) {
    return StoryMediaModel(
      id: media.id,
      type: media.type,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration,
      width: media.width,
      height: media.height,
    );
  }
}

@JsonSerializable()
class StoryViewerModel extends StoryViewer {
  @override
  final String userId;
  @override
  final String username;
  @override
  final String? avatar;
  @override
  final DateTime viewedAt;

  const StoryViewerModel({
    required this.userId,
    required this.username,
    this.avatar,
    required this.viewedAt,
  }) : super(
          userId: userId,
          username: username,
          avatar: avatar,
          viewedAt: viewedAt,
        );

  factory StoryViewerModel.fromJson(Map<String, dynamic> json) =>
      _$StoryViewerModelFromJson(json);

  Map<String, dynamic> toJson() => _$StoryViewerModelToJson(this);

  factory StoryViewerModel.fromEntity(StoryViewer viewer) {
    return StoryViewerModel(
      userId: viewer.userId,
      username: viewer.username,
      avatar: viewer.avatar,
      viewedAt: viewer.viewedAt,
    );
  }
}

@JsonSerializable(explicitToJson: true)
class StoryGroupModel extends StoryGroup {
  @override
  final StoryUserModel user;
  @override
  final List<StoryModel> stories;
  @override
  final bool hasUnviewed;

  const StoryGroupModel({
    required this.user,
    required this.stories,
    required this.hasUnviewed,
  }) : super(
          user: user,
          stories: stories,
          hasUnviewed: hasUnviewed,
        );

  factory StoryGroupModel.fromJson(Map<String, dynamic> json) =>
      _$StoryGroupModelFromJson(json);

  Map<String, dynamic> toJson() => _$StoryGroupModelToJson(this);

  factory StoryGroupModel.fromEntity(StoryGroup group) {
    return StoryGroupModel(
      user: group.user is StoryUserModel
          ? group.user as StoryUserModel
          : StoryUserModel.fromEntity(group.user),
      stories: group.stories
          .map((s) => s is StoryModel ? s : StoryModel.fromEntity(s))
          .toList(),
      hasUnviewed: group.hasUnviewed,
    );
  }
}
