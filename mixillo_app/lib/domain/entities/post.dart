import 'package:equatable/equatable.dart';

/// Post Entity - Core business object for posts/content
/// This represents Instagram-style posts (photos/videos with captions)
class Post extends Equatable {
  final String id;
  final String userId;
  final User creator;
  final List<Media> media; // Multiple photos/videos (carousel)
  final String caption;
  final List<String> hashtags;
  final List<ProductTag> productTags;
  final Location? location;
  final Sound? sound;
  final PostStats stats;
  final bool isLiked;
  final bool isSaved;
  final bool isFollowing;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Post({
    required this.id,
    required this.userId,
    required this.creator,
    required this.media,
    required this.caption,
    required this.hashtags,
    required this.productTags,
    this.location,
    this.sound,
    required this.stats,
    required this.isLiked,
    required this.isSaved,
    required this.isFollowing,
    required this.createdAt,
    required this.updatedAt,
  });

  Post copyWith({
    String? id,
    String? userId,
    User? creator,
    List<Media>? media,
    String? caption,
    List<String>? hashtags,
    List<ProductTag>? productTags,
    Location? location,
    Sound? sound,
    PostStats? stats,
    bool? isLiked,
    bool? isSaved,
    bool? isFollowing,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Post(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      creator: creator ?? this.creator,
      media: media ?? this.media,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      productTags: productTags ?? this.productTags,
      location: location ?? this.location,
      sound: sound ?? this.sound,
      stats: stats ?? this.stats,
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
      isFollowing: isFollowing ?? this.isFollowing,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        creator,
        media,
        caption,
        hashtags,
        productTags,
        location,
        sound,
        stats,
        isLiked,
        isSaved,
        isFollowing,
        createdAt,
        updatedAt,
      ];
}

/// Media Entity - Represents a single photo/video in a post
class Media extends Equatable {
  final String id;
  final MediaType type;
  final String url;
  final String? thumbnail;
  final int? duration; // For videos (in seconds)
  final int? width;
  final int? height;
  final double aspectRatio;

  const Media({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnail,
    this.duration,
    this.width,
    this.height,
    this.aspectRatio = 1.0,
  });

  @override
  List<Object?> get props => [
        id,
        type,
        url,
        thumbnail,
        duration,
        width,
        height,
        aspectRatio,
      ];
}

enum MediaType {
  photo,
  video,
}

/// User Entity (simplified for posts)
class User extends Equatable {
  final String id;
  final String username;
  final String? fullName;
  final String? avatar;
  final bool isVerified;
  final bool isSeller;

  const User({
    required this.id,
    required this.username,
    this.fullName,
    this.avatar,
    this.isVerified = false,
    this.isSeller = false,
  });

  @override
  List<Object?> get props => [
        id,
        username,
        fullName,
        avatar,
        isVerified,
        isSeller,
      ];
}

/// PostStats Entity - Engagement metrics
class PostStats extends Equatable {
  final int likes;
  final int comments;
  final int shares;
  final int saves;
  final int views;

  const PostStats({
    required this.likes,
    required this.comments,
    required this.shares,
    required this.saves,
    required this.views,
  });

  PostStats copyWith({
    int? likes,
    int? comments,
    int? shares,
    int? saves,
    int? views,
  }) {
    return PostStats(
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      saves: saves ?? this.saves,
      views: views ?? this.views,
    );
  }

  @override
  List<Object?> get props => [likes, comments, shares, saves, views];
}

/// ProductTag Entity - Tagged products in posts
class ProductTag extends Equatable {
  final String productId;
  final String productName;
  final double price;
  final String? image;
  final double x; // Position on image (0.0 to 1.0)
  final double y; // Position on image (0.0 to 1.0)

  const ProductTag({
    required this.productId,
    required this.productName,
    required this.price,
    this.image,
    required this.x,
    required this.y,
  });

  @override
  List<Object?> get props => [productId, productName, price, image, x, y];
}

/// Location Entity
class Location extends Equatable {
  final String name;
  final double? latitude;
  final double? longitude;

  const Location({
    required this.name,
    this.latitude,
    this.longitude,
  });

  @override
  List<Object?> get props => [name, latitude, longitude];
}

/// Sound Entity (for video posts with sound)
class Sound extends Equatable {
  final String id;
  final String name;
  final String artist;
  final String? cover;
  final int usageCount;

  const Sound({
    required this.id,
    required this.name,
    required this.artist,
    this.cover,
    required this.usageCount,
  });

  @override
  List<Object?> get props => [id, name, artist, cover, usageCount];
}
