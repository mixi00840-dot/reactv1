import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/post.dart';

part 'post_model.g.dart';

/// Post Model - Data layer representation with JSON serialization
@JsonSerializable(explicitToJson: true)
class PostModel extends Post {
  @override
  @JsonKey(name: 'creator')
  final UserModel creator;

  @override
  @JsonKey(name: 'media')
  final List<MediaModel> media;

  @override
  @JsonKey(name: 'productTags')
  final List<ProductTagModel> productTags;

  @override
  @JsonKey(name: 'location')
  final LocationModel? location;

  @override
  @JsonKey(name: 'sound')
  final SoundModel? sound;

  @override
  @JsonKey(name: 'stats')
  final PostStatsModel stats;

  const PostModel({
    required super.id,
    required super.userId,
    required this.creator,
    required this.media,
    required super.caption,
    required super.hashtags,
    required this.productTags,
    this.location,
    this.sound,
    required this.stats,
    required super.isLiked,
    required super.isSaved,
    required super.isFollowing,
    required super.createdAt,
    required super.updatedAt,
  }) : super(
          creator: creator,
          media: media,
          productTags: productTags,
          location: location,
          sound: sound,
          stats: stats,
        );

  factory PostModel.fromJson(Map<String, dynamic> json) =>
      _$PostModelFromJson(json);

  Map<String, dynamic> toJson() => _$PostModelToJson(this);

  /// Convert entity to model
  factory PostModel.fromEntity(Post post) {
    return PostModel(
      id: post.id,
      userId: post.userId,
      creator: post.creator is UserModel 
          ? post.creator as UserModel 
          : UserModel.fromEntity(post.creator),
      media: post.media.map((m) => m is MediaModel 
          ? m 
          : MediaModel.fromEntity(m)).toList(),
      caption: post.caption,
      hashtags: post.hashtags,
      productTags: post.productTags.map((p) => p is ProductTagModel 
          ? p 
          : ProductTagModel.fromEntity(p)).toList(),
      location: post.location == null 
          ? null 
          : (post.location is LocationModel 
              ? post.location as LocationModel 
              : LocationModel.fromEntity(post.location!)),
      sound: post.sound == null 
          ? null 
          : (post.sound is SoundModel 
              ? post.sound as SoundModel 
              : SoundModel.fromEntity(post.sound!)),
      stats: post.stats is PostStatsModel 
          ? post.stats as PostStatsModel 
          : PostStatsModel.fromEntity(post.stats),
      isLiked: post.isLiked,
      isSaved: post.isSaved,
      isFollowing: post.isFollowing,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    );
  }

  /// Convert to entity
  Post toEntity() => this;
}

@JsonSerializable()
class MediaModel extends Media {
  const MediaModel({
    required super.id,
    required super.type,
    required super.url,
    super.thumbnail,
    super.duration,
    super.width,
    super.height,
    super.aspectRatio,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) =>
      _$MediaModelFromJson(json);

  Map<String, dynamic> toJson() => _$MediaModelToJson(this);

  factory MediaModel.fromEntity(Media media) {
    return MediaModel(
      id: media.id,
      type: media.type,
      url: media.url,
      thumbnail: media.thumbnail,
      duration: media.duration,
      width: media.width,
      height: media.height,
      aspectRatio: media.aspectRatio,
    );
  }
}

@JsonSerializable()
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.username,
    required super.fullName,
    super.avatar,
    required super.isVerified,
    required super.isSeller,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isSeller: user.isSeller,
    );
  }
}

@JsonSerializable()
class PostStatsModel extends PostStats {
  const PostStatsModel({
    required super.likes,
    required super.comments,
    required super.shares,
    required super.saves,
    required super.views,
  });

  factory PostStatsModel.fromJson(Map<String, dynamic> json) =>
      _$PostStatsModelFromJson(json);

  Map<String, dynamic> toJson() => _$PostStatsModelToJson(this);

  factory PostStatsModel.fromEntity(PostStats stats) {
    return PostStatsModel(
      likes: stats.likes,
      comments: stats.comments,
      shares: stats.shares,
      saves: stats.saves,
      views: stats.views,
    );
  }
}

@JsonSerializable()
class ProductTagModel extends ProductTag {
  const ProductTagModel({
    required super.productId,
    required super.productName,
    required super.price,
    super.image,
    required super.x,
    required super.y,
  });

  factory ProductTagModel.fromJson(Map<String, dynamic> json) =>
      _$ProductTagModelFromJson(json);

  Map<String, dynamic> toJson() => _$ProductTagModelToJson(this);

  factory ProductTagModel.fromEntity(ProductTag tag) {
    return ProductTagModel(
      productId: tag.productId,
      productName: tag.productName,
      price: tag.price,
      image: tag.image,
      x: tag.x,
      y: tag.y,
    );
  }
}

@JsonSerializable()
class LocationModel extends Location {
  const LocationModel({
    required super.name,
    super.latitude,
    super.longitude,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) =>
      _$LocationModelFromJson(json);

  Map<String, dynamic> toJson() => _$LocationModelToJson(this);

  factory LocationModel.fromEntity(Location location) {
    return LocationModel(
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    );
  }
}

@JsonSerializable()
class SoundModel extends Sound {
  const SoundModel({
    required super.id,
    required super.name,
    required super.artist,
    super.cover,
    required super.usageCount,
  });

  factory SoundModel.fromJson(Map<String, dynamic> json) =>
      _$SoundModelFromJson(json);

  Map<String, dynamic> toJson() => _$SoundModelToJson(this);

  factory SoundModel.fromEntity(Sound sound) {
    return SoundModel(
      id: sound.id,
      name: sound.name,
      artist: sound.artist,
      cover: sound.cover,
      usageCount: sound.usageCount,
    );
  }
}
