/// User Profile Model
/// Represents complete user profile data
class UserProfile {
  final String id;
  final String username;
  final String? fullName;
  final String? displayName; // Display name (can be different from username)
  final String? email;
  final String? phoneNumber;
  final String? avatar;
  final String? avatarUrl; // Alternative name for avatar
  final String? bio;
  final String? website;
  final String? instagramHandle;
  final String? youtubeHandle;
  final bool isVerified;
  final bool isPrivate;
  final String? location;
  final DateTime? dateOfBirth;
  final String? gender;
  
  // Social stats
  final int followersCount;
  final int followingCount;
  final int likesCount;
  final int videosCount;
  
  // Seller info
  final bool isSeller;
  final String? sellerStatus; // 'pending', 'approved', 'rejected'
  final bool? isShopFeatured;
  
  // Engagement
  final bool isFollowing;
  final bool isBlocked;
  
  // Metadata
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserProfile({
    required this.id,
    required this.username,
    this.fullName,
    this.displayName,
    this.email,
    this.phoneNumber,
    this.avatar,
    this.avatarUrl,
    this.bio,
    this.website,
    this.instagramHandle,
    this.youtubeHandle,
    this.isVerified = false,
    this.isPrivate = false,
    this.location,
    this.dateOfBirth,
    this.gender,
    this.followersCount = 0,
    this.followingCount = 0,
    this.likesCount = 0,
    this.videosCount = 0,
    this.isSeller = false,
    this.sellerStatus,
    this.isShopFeatured,
    this.isFollowing = false,
    this.isBlocked = false,
    this.createdAt,
    this.updatedAt,
  });

  /// Create UserProfile from JSON
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['_id'] ?? json['id'] ?? '',
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? json['full_name'],
      displayName: json['displayName'] ?? json['display_name'],
      email: json['email'],
      phoneNumber: json['phoneNumber'] ?? json['phone_number'],
      avatar: json['avatar'] ?? json['profilePicture'] ?? json['profile_picture'],
      avatarUrl: json['avatarUrl'] ?? json['avatar_url'] ?? json['avatar'] ?? json['profilePicture'],
      bio: json['bio'],
      website: json['website'],
      instagramHandle: json['instagramHandle'] ?? json['instagram_handle'],
      youtubeHandle: json['youtubeHandle'] ?? json['youtube_handle'],
      isVerified: json['isVerified'] ?? json['is_verified'] ?? false,
      isPrivate: json['isPrivate'] ?? json['is_private'] ?? false,
      location: json['location'],
      dateOfBirth: json['dateOfBirth'] != null || json['date_of_birth'] != null
          ? DateTime.tryParse(json['dateOfBirth'] ?? json['date_of_birth'])
          : null,
      gender: json['gender'],
      followersCount: json['followersCount'] ?? json['followers_count'] ?? json['followers'] ?? 0,
      followingCount: json['followingCount'] ?? json['following_count'] ?? json['following'] ?? 0,
      likesCount: json['likesCount'] ?? json['likes_count'] ?? json['likes'] ?? 0,
      videosCount: json['videosCount'] ?? json['videos_count'] ?? json['videos'] ?? 0,
      isSeller: json['isSeller'] ?? json['is_seller'] ?? false,
      sellerStatus: json['sellerStatus'] ?? json['seller_status'],
      isShopFeatured: json['isShopFeatured'] ?? json['is_shop_featured'],
      isFollowing: json['isFollowing'] ?? json['is_following'] ?? false,
      isBlocked: json['isBlocked'] ?? json['is_blocked'] ?? false,
      createdAt: json['createdAt'] != null || json['created_at'] != null
          ? DateTime.tryParse(json['createdAt'] ?? json['created_at'])
          : null,
      updatedAt: json['updatedAt'] != null || json['updated_at'] != null
          ? DateTime.tryParse(json['updatedAt'] ?? json['updated_at'])
          : null,
    );
  }

  /// Convert UserProfile to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'displayName': displayName,
      'email': email,
      'phoneNumber': phoneNumber,
      'avatar': avatar,
      'avatarUrl': avatarUrl,
      'bio': bio,
      'website': website,
      'instagramHandle': instagramHandle,
      'youtubeHandle': youtubeHandle,
      'isVerified': isVerified,
      'isPrivate': isPrivate,
      'location': location,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'followersCount': followersCount,
      'followingCount': followingCount,
      'likesCount': likesCount,
      'videosCount': videosCount,
      'isSeller': isSeller,
      'sellerStatus': sellerStatus,
      'isShopFeatured': isShopFeatured,
      'isFollowing': isFollowing,
      'isBlocked': isBlocked,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  /// Create a copy with updated fields
  UserProfile copyWith({
    String? id,
    String? username,
    String? fullName,
    String? displayName,
    String? email,
    String? phoneNumber,
    String? avatar,
    String? avatarUrl,
    String? bio,
    String? website,
    String? instagramHandle,
    String? youtubeHandle,
    bool? isVerified,
    bool? isPrivate,
    String? location,
    DateTime? dateOfBirth,
    String? gender,
    int? followersCount,
    int? followingCount,
    int? likesCount,
    int? videosCount,
    bool? isSeller,
    String? sellerStatus,
    bool? isShopFeatured,
    bool? isFollowing,
    bool? isBlocked,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserProfile(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatar: avatar ?? this.avatar,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      website: website ?? this.website,
      instagramHandle: instagramHandle ?? this.instagramHandle,
      youtubeHandle: youtubeHandle ?? this.youtubeHandle,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      location: location ?? this.location,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      likesCount: likesCount ?? this.likesCount,
      videosCount: videosCount ?? this.videosCount,
      isSeller: isSeller ?? this.isSeller,
      sellerStatus: sellerStatus ?? this.sellerStatus,
      isShopFeatured: isShopFeatured ?? this.isShopFeatured,
      isFollowing: isFollowing ?? this.isFollowing,
      isBlocked: isBlocked ?? this.isBlocked,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'UserProfile(id: $id, username: $username, fullName: $fullName, followers: $followersCount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is UserProfile &&
      other.id == id &&
      other.username == username;
  }

  @override
  int get hashCode => id.hashCode ^ username.hashCode;
}
