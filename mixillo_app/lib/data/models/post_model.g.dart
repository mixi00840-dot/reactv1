// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PostModel _$PostModelFromJson(Map<String, dynamic> json) => PostModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      creator: UserModel.fromJson(json['creator'] as Map<String, dynamic>),
      media: (json['media'] as List<dynamic>)
          .map((e) => MediaModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      caption: json['caption'] as String,
      hashtags:
          (json['hashtags'] as List<dynamic>).map((e) => e as String).toList(),
      productTags: (json['productTags'] as List<dynamic>)
          .map((e) => ProductTagModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      location: json['location'] == null
          ? null
          : LocationModel.fromJson(json['location'] as Map<String, dynamic>),
      sound: json['sound'] == null
          ? null
          : SoundModel.fromJson(json['sound'] as Map<String, dynamic>),
      stats: PostStatsModel.fromJson(json['stats'] as Map<String, dynamic>),
      isLiked: json['isLiked'] as bool,
      isSaved: json['isSaved'] as bool,
      isFollowing: json['isFollowing'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$PostModelToJson(PostModel instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'caption': instance.caption,
      'hashtags': instance.hashtags,
      'isLiked': instance.isLiked,
      'isSaved': instance.isSaved,
      'isFollowing': instance.isFollowing,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'creator': instance.creator.toJson(),
      'media': instance.media.map((e) => e.toJson()).toList(),
      'productTags': instance.productTags.map((e) => e.toJson()).toList(),
      'location': instance.location?.toJson(),
      'sound': instance.sound?.toJson(),
      'stats': instance.stats.toJson(),
    };

MediaModel _$MediaModelFromJson(Map<String, dynamic> json) => MediaModel(
      id: json['id'] as String,
      type: $enumDecode(_$MediaTypeEnumMap, json['type']),
      url: json['url'] as String,
      thumbnail: json['thumbnail'] as String?,
      duration: (json['duration'] as num?)?.toInt(),
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      aspectRatio: (json['aspectRatio'] as num?)?.toDouble() ?? 1.0,
    );

Map<String, dynamic> _$MediaModelToJson(MediaModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$MediaTypeEnumMap[instance.type]!,
      'url': instance.url,
      'thumbnail': instance.thumbnail,
      'duration': instance.duration,
      'width': instance.width,
      'height': instance.height,
      'aspectRatio': instance.aspectRatio,
    };

const _$MediaTypeEnumMap = {
  MediaType.photo: 'photo',
  MediaType.video: 'video',
};

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      fullName: json['fullName'] as String?,
      avatar: json['avatar'] as String?,
      isVerified: json['isVerified'] as bool,
      isSeller: json['isSeller'] as bool,
    );

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'fullName': instance.fullName,
      'avatar': instance.avatar,
      'isVerified': instance.isVerified,
      'isSeller': instance.isSeller,
    };

PostStatsModel _$PostStatsModelFromJson(Map<String, dynamic> json) =>
    PostStatsModel(
      likes: (json['likes'] as num).toInt(),
      comments: (json['comments'] as num).toInt(),
      shares: (json['shares'] as num).toInt(),
      saves: (json['saves'] as num).toInt(),
      views: (json['views'] as num).toInt(),
    );

Map<String, dynamic> _$PostStatsModelToJson(PostStatsModel instance) =>
    <String, dynamic>{
      'likes': instance.likes,
      'comments': instance.comments,
      'shares': instance.shares,
      'saves': instance.saves,
      'views': instance.views,
    };

ProductTagModel _$ProductTagModelFromJson(Map<String, dynamic> json) =>
    ProductTagModel(
      productId: json['productId'] as String,
      productName: json['productName'] as String,
      price: (json['price'] as num).toDouble(),
      image: json['image'] as String?,
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
    );

Map<String, dynamic> _$ProductTagModelToJson(ProductTagModel instance) =>
    <String, dynamic>{
      'productId': instance.productId,
      'productName': instance.productName,
      'price': instance.price,
      'image': instance.image,
      'x': instance.x,
      'y': instance.y,
    };

LocationModel _$LocationModelFromJson(Map<String, dynamic> json) =>
    LocationModel(
      name: json['name'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$LocationModelToJson(LocationModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
    };

SoundModel _$SoundModelFromJson(Map<String, dynamic> json) => SoundModel(
      id: json['id'] as String,
      name: json['name'] as String,
      artist: json['artist'] as String,
      cover: json['cover'] as String?,
      usageCount: (json['usageCount'] as num).toInt(),
    );

Map<String, dynamic> _$SoundModelToJson(SoundModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'artist': instance.artist,
      'cover': instance.cover,
      'usageCount': instance.usageCount,
    };
