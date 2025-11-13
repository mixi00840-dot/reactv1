/// User profile data model
class UserProfile {
  final String id;
  final String username;
  final String displayName;
  final String bio;
  final String avatarUrl;
  final String coverImageUrl;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int reelsCount;
  final int likesCount;
  final bool isVerified;
  final bool isPrivate;
  final DateTime createdAt;
  final WalletInfo? wallet;
  final bool isFollowing;
  final String? website;
  final String? phone;
  final String? role;
  final Map<String, String>? socialLinks;

  UserProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.bio,
    required this.avatarUrl,
    required this.coverImageUrl,
    required this.followersCount,
    required this.followingCount,
    required this.postsCount,
    required this.reelsCount,
    required this.likesCount,
    this.isVerified = false,
    this.isPrivate = false,
    required this.createdAt,
    this.wallet,
    this.isFollowing = false,
    this.website,
    this.phone,
    this.role,
    this.socialLinks,
  });

  /// Create UserProfile from API JSON
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>?;
    
    return UserProfile(
      id: json['_id'] ?? json['id'],
      username: json['username'] ?? '',
      displayName: json['fullName'] ?? json['displayName'] ?? '',
      bio: json['bio'] ?? '',
      avatarUrl: json['avatar'] ?? json['avatarUrl'] ?? '',
      coverImageUrl: json['coverImage'] ?? json['coverImageUrl'] ?? '',
      followersCount: stats?['followers'] ?? json['followersCount'] ?? 0,
      followingCount: stats?['following'] ?? json['followingCount'] ?? 0,
      postsCount: json['videosCount'] ?? json['postsCount'] ?? 0,
      reelsCount: json['videosCount'] ?? json['reelsCount'] ?? 0,
      likesCount: json['likesReceivedCount'] ?? json['likesCount'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      isPrivate: json['privacySettings']?['isPrivate'] ?? json['isPrivate'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      isFollowing: json['isFollowing'] ?? false,
      website: json['website'],
      phone: json['phone'],
      role: json['role'],
      socialLinks: json['socialLinks'] != null 
          ? Map<String, String>.from(json['socialLinks']) 
          : null,
    );
  }

  /// Copy with method for updates
  UserProfile copyWith({
    String? id,
    String? username,
    String? displayName,
    String? bio,
    String? avatarUrl,
    String? coverImageUrl,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    int? reelsCount,
    int? likesCount,
    bool? isVerified,
    bool? isPrivate,
    DateTime? createdAt,
    WalletInfo? wallet,
    bool? isFollowing,
    String? website,
    String? phone,
    String? role,
    Map<String, String>? socialLinks,
  }) {
    return UserProfile(
      id: id ?? this.id,
      username: username ?? this.username,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      reelsCount: reelsCount ?? this.reelsCount,
      likesCount: likesCount ?? this.likesCount,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      createdAt: createdAt ?? this.createdAt,
      wallet: wallet ?? this.wallet,
      isFollowing: isFollowing ?? this.isFollowing,
      website: website ?? this.website,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      socialLinks: socialLinks ?? this.socialLinks,
    );
  }
}

/// Wallet information
class WalletInfo {
  final String id;
  final int coinBalance;
  final int diamondBalance;
  final List<Transaction> recentTransactions;
  
  // Additional fields for new wallet screen
  final double balance;
  final String userId;
  final double? totalEarned;
  final double? totalSpent;

  WalletInfo({
    required this.id,
    required this.coinBalance,
    required this.diamondBalance,
    required this.recentTransactions,
    double? balance,
    String? userId,
    this.totalEarned,
    this.totalSpent,
  }) : balance = balance ?? coinBalance.toDouble(),
       userId = userId ?? id;
}

/// Transaction model
class Transaction {
  final String id;
  final TransactionType type;
  final int amount;
  final String description;
  final DateTime createdAt;
  final bool isIncome;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
    required this.isIncome,
  });
}

/// Transaction types
enum TransactionType {
  purchase,
  gift,
  reward,
  withdrawal,
  refund,
  earnings,
}
