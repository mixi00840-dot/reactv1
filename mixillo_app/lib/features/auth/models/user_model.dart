/// Enhanced User Model - Complete backend structure
/// Matches backend User model with all fields

class UserModel {
  // Basic identification
  final String id;
  final String username;
  final String email;
  final String? fullName;
  final String? displayName;
  
  // Profile information
  final String? avatar;
  final String? avatarUrl;
  final String? bio;
  final DateTime? dateOfBirth;
  final String? phone;
  
  // Account status
  final UserRole role;
  final UserStatus status;
  final bool isVerified;
  final bool isFeatured;
  final bool isLimitedFromExplore;
  
  // Social stats
  final UserStats stats;
  
  // E-commerce fields
  final List<ShippingAddress>? shippingAddresses;
  final BillingAddress? billingAddress;
  
  // Seller-specific fields
  final SellerProfile? sellerProfile;
  
  // Preferences
  final UserPreferences? preferences;
  
  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastLogin;
  final DateTime? emailVerifiedAt;
  
  // Additional metadata
  final Map<String, dynamic>? metadata;
  final int? activeStrikes;
  final WalletInfo? wallet;
  final SellerStatusInfo? sellerStatus;
  
  // Interaction states (for current user context)
  final bool? isFollowing;
  final bool? isBlocked;
  final bool? isMuted;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    this.displayName,
    this.avatar,
    this.avatarUrl,
    this.bio,
    this.dateOfBirth,
    this.phone,
    this.role = UserRole.user,
    this.status = UserStatus.active,
    this.isVerified = false,
    this.isFeatured = false,
    this.isLimitedFromExplore = false,
    required this.stats,
    this.shippingAddresses,
    this.billingAddress,
    this.sellerProfile,
    this.preferences,
    required this.createdAt,
    this.updatedAt,
    this.lastLogin,
    this.emailVerifiedAt,
    this.metadata,
    this.activeStrikes,
    this.wallet,
    this.sellerStatus,
    this.isFollowing,
    this.isBlocked,
    this.isMuted,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Handle different backend response formats
    final userId = json['id'] ?? json['_id'] ?? json['userId'] ?? '';
    
    // Parse stats from various formats
    final statsData = json['stats'] ?? json['statistics'] ?? {};
    final stats = UserStats.fromJson({
      ...statsData,
      'followers': json['followersCount'] ?? json['followers'] ?? statsData['followers'] ?? 0,
      'following': json['followingCount'] ?? json['following'] ?? statsData['following'] ?? 0,
      'videos': json['videosCount'] ?? json['videos'] ?? statsData['videos'] ?? 0,
      'posts': json['postsCount'] ?? json['posts'] ?? statsData['posts'] ?? 0,
      'likes': json['likesReceived'] ?? json['likes'] ?? statsData['likes'] ?? 0,
      'views': json['profileViews'] ?? json['views'] ?? statsData['views'] ?? 0,
    });

    return UserModel(
      id: userId,
      username: json['username'] ?? '@user',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? json['full_name'],
      displayName: json['displayName'] ?? json['display_name'] ?? json['fullName'],
      avatar: json['avatar'] ?? json['avatarUrl'],
      avatarUrl: json['avatarUrl'] ?? json['avatar'],
      bio: json['bio'],
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.parse(json['dateOfBirth'].toString())
          : json['date_of_birth'] != null
              ? DateTime.parse(json['date_of_birth'].toString())
              : null,
      phone: json['phone'],
      role: _parseUserRole(json['role'] ?? 'user'),
      status: _parseUserStatus(json['status'] ?? 'active'),
      isVerified: json['isVerified'] ?? json['verified'] ?? false,
      isFeatured: json['isFeatured'] ?? json['is_featured'] ?? false,
      isLimitedFromExplore: json['isLimitedFromExplore'] ?? json['is_limited_from_explore'] ?? false,
      stats: stats,
      shippingAddresses: json['shippingAddresses'] != null
          ? (json['shippingAddresses'] as List).map((a) => ShippingAddress.fromJson(a)).toList()
          : null,
      billingAddress: json['billingAddress'] != null
          ? BillingAddress.fromJson(json['billingAddress'])
          : null,
      sellerProfile: json['sellerProfile'] != null
          ? SellerProfile.fromJson(json['sellerProfile'])
          : null,
      preferences: json['preferences'] != null
          ? UserPreferences.fromJson(json['preferences'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'].toString())
          : json['last_login'] != null
              ? DateTime.parse(json['last_login'].toString())
              : null,
      emailVerifiedAt: json['emailVerifiedAt'] != null
          ? DateTime.parse(json['emailVerifiedAt'].toString())
          : json['email_verified_at'] != null
              ? DateTime.parse(json['email_verified_at'].toString())
              : null,
      metadata: json['metadata'],
      activeStrikes: json['activeStrikes'] ?? json['active_strikes'],
      wallet: json['wallet'] != null ? WalletInfo.fromJson(json['wallet']) : null,
      sellerStatus: json['sellerStatus'] != null ? SellerStatusInfo.fromJson(json['sellerStatus']) : null,
      isFollowing: json['isFollowing'] ?? json['is_following'],
      isBlocked: json['isBlocked'] ?? json['is_blocked'],
      isMuted: json['isMuted'] ?? json['is_muted'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      if (fullName != null) 'fullName': fullName,
      if (displayName != null) 'displayName': displayName,
      if (avatar != null) 'avatar': avatar,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (bio != null) 'bio': bio,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth!.toIso8601String(),
      if (phone != null) 'phone': phone,
      'role': role.name,
      'status': status.name,
      'isVerified': isVerified,
      'isFeatured': isFeatured,
      'isLimitedFromExplore': isLimitedFromExplore,
      'stats': stats.toJson(),
      if (shippingAddresses != null)
        'shippingAddresses': shippingAddresses!.map((a) => a.toJson()).toList(),
      if (billingAddress != null) 'billingAddress': billingAddress!.toJson(),
      if (sellerProfile != null) 'sellerProfile': sellerProfile!.toJson(),
      if (preferences != null) 'preferences': preferences!.toJson(),
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (lastLogin != null) 'lastLogin': lastLogin!.toIso8601String(),
      if (emailVerifiedAt != null) 'emailVerifiedAt': emailVerifiedAt!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      if (activeStrikes != null) 'activeStrikes': activeStrikes,
      if (wallet != null) 'wallet': wallet!.toJson(),
      if (sellerStatus != null) 'sellerStatus': sellerStatus!.toJson(),
      if (isFollowing != null) 'isFollowing': isFollowing,
      if (isBlocked != null) 'isBlocked': isBlocked,
      if (isMuted != null) 'isMuted': isMuted,
    };
  }

  UserModel copyWith({
    String? id,
    String? username,
    String? email,
    String? fullName,
    String? displayName,
    String? avatar,
    String? avatarUrl,
    String? bio,
    DateTime? dateOfBirth,
    String? phone,
    UserRole? role,
    UserStatus? status,
    bool? isVerified,
    bool? isFeatured,
    bool? isLimitedFromExplore,
    UserStats? stats,
    List<ShippingAddress>? shippingAddresses,
    BillingAddress? billingAddress,
    SellerProfile? sellerProfile,
    UserPreferences? preferences,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? lastLogin,
    DateTime? emailVerifiedAt,
    Map<String, dynamic>? metadata,
    int? activeStrikes,
    WalletInfo? wallet,
    SellerStatusInfo? sellerStatus,
    bool? isFollowing,
    bool? isBlocked,
    bool? isMuted,
  }) {
    return UserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      displayName: displayName ?? this.displayName,
      avatar: avatar ?? this.avatar,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      status: status ?? this.status,
      isVerified: isVerified ?? this.isVerified,
      isFeatured: isFeatured ?? this.isFeatured,
      isLimitedFromExplore: isLimitedFromExplore ?? this.isLimitedFromExplore,
      stats: stats ?? this.stats,
      shippingAddresses: shippingAddresses ?? this.shippingAddresses,
      billingAddress: billingAddress ?? this.billingAddress,
      sellerProfile: sellerProfile ?? this.sellerProfile,
      preferences: preferences ?? this.preferences,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      lastLogin: lastLogin ?? this.lastLogin,
      emailVerifiedAt: emailVerifiedAt ?? this.emailVerifiedAt,
      metadata: metadata ?? this.metadata,
      activeStrikes: activeStrikes ?? this.activeStrikes,
      wallet: wallet ?? this.wallet,
      sellerStatus: sellerStatus ?? this.sellerStatus,
      isFollowing: isFollowing ?? this.isFollowing,
      isBlocked: isBlocked ?? this.isBlocked,
      isMuted: isMuted ?? this.isMuted,
    );
  }

  // Helper getters
  String get displayAvatar => avatarUrl ?? avatar ?? '';
  String get displayNameOrUsername => displayName ?? fullName ?? username;
  bool get isSeller => sellerProfile != null && sellerProfile!.hasActiveStore;
  bool get isActive => status == UserStatus.active;
  bool get canPost => isActive && !isLimitedFromExplore;

  static UserRole _parseUserRole(dynamic value) {
    if (value is String) {
      return UserRole.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => UserRole.user,
      );
    }
    return UserRole.user;
  }

  static UserStatus _parseUserStatus(dynamic value) {
    if (value is String) {
      return UserStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => UserStatus.active,
      );
    }
    return UserStatus.active;
  }
}

// Enums
enum UserRole { user, admin, seller }
enum UserStatus { active, suspended, banned, pending }

// Supporting Models
class UserStats {
  final int followers;
  final int following;
  final int videos;
  final int posts;
  final int likes;
  final int views;
  final int? comments;
  final int? shares;

  UserStats({
    this.followers = 0,
    this.following = 0,
    this.videos = 0,
    this.posts = 0,
    this.likes = 0,
    this.views = 0,
    this.comments,
    this.shares,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      followers: json['followers'] ?? json['followersCount'] ?? 0,
      following: json['following'] ?? json['followingCount'] ?? 0,
      videos: json['videos'] ?? json['videosCount'] ?? 0,
      posts: json['posts'] ?? json['postsCount'] ?? 0,
      likes: json['likes'] ?? json['likesReceived'] ?? 0,
      views: json['views'] ?? json['profileViews'] ?? 0,
      comments: json['comments'] ?? json['commentsCount'],
      shares: json['shares'] ?? json['sharesCount'],
    );
  }

  Map<String, dynamic> toJson() => {
    'followers': followers,
    'following': following,
    'videos': videos,
    'posts': posts,
    'likes': likes,
    'views': views,
    if (comments != null) 'comments': comments,
    if (shares != null) 'shares': shares,
  };

  UserStats copyWith({
    int? followers,
    int? following,
    int? videos,
    int? posts,
    int? likes,
    int? views,
    int? comments,
    int? shares,
  }) {
    return UserStats(
      followers: followers ?? this.followers,
      following: following ?? this.following,
      videos: videos ?? this.videos,
      posts: posts ?? this.posts,
      likes: likes ?? this.likes,
      views: views ?? this.views,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
    );
  }
}

class ShippingAddress {
  final String? label;
  final String? fullName;
  final String? street;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? country;
  final String? phone;
  final bool isDefault;

  ShippingAddress({
    this.label,
    this.fullName,
    this.street,
    this.city,
    this.state,
    this.zipCode,
    this.country,
    this.phone,
    this.isDefault = false,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      label: json['label'],
      fullName: json['fullName'] ?? json['full_name'],
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zipCode'] ?? json['zip_code'],
      country: json['country'],
      phone: json['phone'],
      isDefault: json['isDefault'] ?? json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    if (label != null) 'label': label,
    if (fullName != null) 'fullName': fullName,
    if (street != null) 'street': street,
    if (city != null) 'city': city,
    if (state != null) 'state': state,
    if (zipCode != null) 'zipCode': zipCode,
    if (country != null) 'country': country,
    if (phone != null) 'phone': phone,
    'isDefault': isDefault,
  };
}

class BillingAddress {
  final String? fullName;
  final String? street;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? country;
  final String? phone;

  BillingAddress({
    this.fullName,
    this.street,
    this.city,
    this.state,
    this.zipCode,
    this.country,
    this.phone,
  });

  factory BillingAddress.fromJson(Map<String, dynamic> json) {
    return BillingAddress(
      fullName: json['fullName'] ?? json['full_name'],
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zipCode'] ?? json['zip_code'],
      country: json['country'],
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (fullName != null) 'fullName': fullName,
    if (street != null) 'street': street,
    if (city != null) 'city': city,
    if (state != null) 'state': state,
    if (zipCode != null) 'zipCode': zipCode,
    if (country != null) 'country': country,
    if (phone != null) 'phone': phone,
  };
}

class SellerProfile {
  final String? businessName;
  final BusinessType? businessType;
  final String? taxId;
  final BusinessAddress? businessAddress;
  final BankDetails? bankDetails;
  final List<VerificationDocument>? verificationDocuments;
  final DateTime? applicationDate;
  final DateTime? approvedDate;
  final DateTime? rejectedDate;
  final String? rejectionReason;
  final bool hasActiveStore;

  SellerProfile({
    this.businessName,
    this.businessType,
    this.taxId,
    this.businessAddress,
    this.bankDetails,
    this.verificationDocuments,
    this.applicationDate,
    this.approvedDate,
    this.rejectedDate,
    this.rejectionReason,
    this.hasActiveStore = false,
  });

  factory SellerProfile.fromJson(Map<String, dynamic> json) {
    return SellerProfile(
      businessName: json['businessName'] ?? json['business_name'],
      businessType: json['businessType'] != null
          ? _parseBusinessType(json['businessType'])
          : null,
      taxId: json['taxId'] ?? json['tax_id'],
      businessAddress: json['businessAddress'] != null
          ? BusinessAddress.fromJson(json['businessAddress'])
          : null,
      bankDetails: json['bankDetails'] != null
          ? BankDetails.fromJson(json['bankDetails'])
          : null,
      verificationDocuments: json['sellerVerificationDocuments'] != null
          ? (json['sellerVerificationDocuments'] as List)
              .map((d) => VerificationDocument.fromJson(d))
              .toList()
          : null,
      applicationDate: json['sellerApplicationDate'] != null
          ? DateTime.parse(json['sellerApplicationDate'].toString())
          : null,
      approvedDate: json['sellerApprovedDate'] != null
          ? DateTime.parse(json['sellerApprovedDate'].toString())
          : null,
      rejectedDate: json['sellerRejectedDate'] != null
          ? DateTime.parse(json['sellerRejectedDate'].toString())
          : null,
      rejectionReason: json['sellerRejectionReason'],
      hasActiveStore: json['hasActiveStore'] ?? json['has_active_store'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    if (businessName != null) 'businessName': businessName,
    if (businessType != null) 'businessType': businessType!.name,
    if (taxId != null) 'taxId': taxId,
    if (businessAddress != null) 'businessAddress': businessAddress!.toJson(),
    if (bankDetails != null) 'bankDetails': bankDetails!.toJson(),
    if (verificationDocuments != null)
      'sellerVerificationDocuments': verificationDocuments!.map((d) => d.toJson()).toList(),
    if (applicationDate != null) 'sellerApplicationDate': applicationDate!.toIso8601String(),
    if (approvedDate != null) 'sellerApprovedDate': approvedDate!.toIso8601String(),
    if (rejectedDate != null) 'sellerRejectedDate': rejectedDate!.toIso8601String(),
    if (rejectionReason != null) 'sellerRejectionReason': rejectionReason,
    'hasActiveStore': hasActiveStore,
  };

  static BusinessType _parseBusinessType(dynamic value) {
    if (value is String) {
      return BusinessType.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => BusinessType.individual,
      );
    }
    return BusinessType.individual;
  }
}

enum BusinessType { individual, business, company }

class BusinessAddress {
  final String? street;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? country;

  BusinessAddress({
    this.street,
    this.city,
    this.state,
    this.zipCode,
    this.country,
  });

  factory BusinessAddress.fromJson(Map<String, dynamic> json) {
    return BusinessAddress(
      street: json['street'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zipCode'] ?? json['zip_code'],
      country: json['country'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (street != null) 'street': street,
    if (city != null) 'city': city,
    if (state != null) 'state': state,
    if (zipCode != null) 'zipCode': zipCode,
    if (country != null) 'country': country,
  };
}

class BankDetails {
  final String? accountHolderName;
  final String? accountNumber;
  final String? routingNumber;
  final String? bankName;
  final String? swiftCode;

  BankDetails({
    this.accountHolderName,
    this.accountNumber,
    this.routingNumber,
    this.bankName,
    this.swiftCode,
  });

  factory BankDetails.fromJson(Map<String, dynamic> json) {
    return BankDetails(
      accountHolderName: json['accountHolderName'] ?? json['account_holder_name'],
      accountNumber: json['accountNumber'] ?? json['account_number'],
      routingNumber: json['routingNumber'] ?? json['routing_number'],
      bankName: json['bankName'] ?? json['bank_name'],
      swiftCode: json['swiftCode'] ?? json['swift_code'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (accountHolderName != null) 'accountHolderName': accountHolderName,
    if (accountNumber != null) 'accountNumber': accountNumber,
    if (routingNumber != null) 'routingNumber': routingNumber,
    if (bankName != null) 'bankName': bankName,
    if (swiftCode != null) 'swiftCode': swiftCode,
  };
}

class VerificationDocument {
  final String type;
  final String url;
  final bool verified;
  final DateTime? uploadedAt;

  VerificationDocument({
    required this.type,
    required this.url,
    this.verified = false,
    this.uploadedAt,
  });

  factory VerificationDocument.fromJson(Map<String, dynamic> json) {
    return VerificationDocument(
      type: json['type'] ?? '',
      url: json['url'] ?? '',
      verified: json['verified'] ?? false,
      uploadedAt: json['uploadedAt'] != null
          ? DateTime.parse(json['uploadedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type,
    'url': url,
    'verified': verified,
    if (uploadedAt != null) 'uploadedAt': uploadedAt!.toIso8601String(),
  };
}

class UserPreferences {
  final String currency;
  final String language;
  final bool marketingEmails;
  final bool orderNotifications;
  final bool promoNotifications;

  UserPreferences({
    this.currency = 'USD',
    this.language = 'en',
    this.marketingEmails = true,
    this.orderNotifications = true,
    this.promoNotifications = false,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      currency: json['currency'] ?? 'USD',
      language: json['language'] ?? 'en',
      marketingEmails: json['marketingEmails'] ?? json['marketing_emails'] ?? true,
      orderNotifications: json['orderNotifications'] ?? json['order_notifications'] ?? true,
      promoNotifications: json['promoNotifications'] ?? json['promo_notifications'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'currency': currency,
    'language': language,
    'marketingEmails': marketingEmails,
    'orderNotifications': orderNotifications,
    'promoNotifications': promoNotifications,
  };
}

class WalletInfo {
  final String? id;
  final double balance;
  final String currency;

  WalletInfo({
    this.id,
    this.balance = 0.0,
    this.currency = 'USD',
  });

  factory WalletInfo.fromJson(Map<String, dynamic> json) {
    return WalletInfo(
      id: json['id'] ?? json['_id'],
      balance: (json['balance'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'balance': balance,
    'currency': currency,
  };
}

class SellerStatusInfo {
  final String? id;
  final String? status;
  final DateTime? submittedAt;
  final DateTime? approvedAt;
  final DateTime? rejectedAt;
  final String? rejectionReason;

  SellerStatusInfo({
    this.id,
    this.status,
    this.submittedAt,
    this.approvedAt,
    this.rejectedAt,
    this.rejectionReason,
  });

  factory SellerStatusInfo.fromJson(Map<String, dynamic> json) {
    return SellerStatusInfo(
      id: json['id'] ?? json['_id'],
      status: json['status'],
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'].toString())
          : json['submitted_at'] != null
              ? DateTime.parse(json['submitted_at'].toString())
              : null,
      approvedAt: json['approvedAt'] != null
          ? DateTime.parse(json['approvedAt'].toString())
          : null,
      rejectedAt: json['rejectedAt'] != null
          ? DateTime.parse(json['rejectedAt'].toString())
          : null,
      rejectionReason: json['rejectionReason'] ?? json['rejection_reason'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    if (status != null) 'status': status,
    if (submittedAt != null) 'submittedAt': submittedAt!.toIso8601String(),
    if (approvedAt != null) 'approvedAt': approvedAt!.toIso8601String(),
    if (rejectedAt != null) 'rejectedAt': rejectedAt!.toIso8601String(),
    if (rejectionReason != null) 'rejectionReason': rejectionReason,
  };
}

