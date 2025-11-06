import 'package:flutter/material.dart';

class StoreModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? logo;
  final String? banner;
  final String ownerId;
  final String? ownerUsername;
  final BusinessInfo? businessInfo;
  final ShippingInfo? shipping;
  final StorePolicies? policies;
  final String status; // 'active', 'inactive', 'suspended'
  final bool isFeatured;
  final bool isVerified;
  final StoreRatings ratings;
  final StoreStats stats;
  final DateTime createdAt;
  final DateTime updatedAt;

  StoreModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logo,
    this.banner,
    required this.ownerId,
    this.ownerUsername,
    this.businessInfo,
    this.shipping,
    this.policies,
    this.status = 'active',
    this.isFeatured = false,
    this.isVerified = false,
    required this.ratings,
    required this.stats,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    return StoreModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      logo: json['logo'],
      banner: json['banner'],
      ownerId: json['ownerId'] ?? json['owner_id'] ?? '',
      ownerUsername: json['ownerUsername'] ?? json['owner_username'],
      businessInfo: json['businessInfo'] != null || json['business_info'] != null
          ? BusinessInfo.fromJson(json['businessInfo'] ?? json['business_info'])
          : null,
      shipping: json['shipping'] != null
          ? ShippingInfo.fromJson(json['shipping'])
          : null,
      policies: json['policies'] != null
          ? StorePolicies.fromJson(json['policies'])
          : null,
      status: json['status'] ?? 'active',
      isFeatured: json['isFeatured'] ?? json['is_featured'] ?? false,
      isVerified: json['isVerified'] ?? json['is_verified'] ?? false,
      ratings: StoreRatings.fromJson(json['ratings'] ?? {}),
      stats: StoreStats.fromJson(json['stats'] ?? {}),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'logo': logo,
      'banner': banner,
      'ownerId': ownerId,
      'ownerUsername': ownerUsername,
      'businessInfo': businessInfo?.toJson(),
      'shipping': shipping?.toJson(),
      'policies': policies?.toJson(),
      'status': status,
      'isFeatured': isFeatured,
      'isVerified': isVerified,
      'ratings': ratings.toJson(),
      'stats': stats.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'active';
}

class BusinessInfo {
  final String? type; // 'individual', 'company', 'partnership'
  final String? registrationNumber;
  final String? taxId;
  final String? address;
  final String? city;
  final String? country;
  final String? phone;
  final String? email;

  BusinessInfo({
    this.type,
    this.registrationNumber,
    this.taxId,
    this.address,
    this.city,
    this.country,
    this.phone,
    this.email,
  });

  factory BusinessInfo.fromJson(Map<String, dynamic> json) {
    return BusinessInfo(
      type: json['type'],
      registrationNumber: json['registrationNumber'] ?? json['registration_number'],
      taxId: json['taxId'] ?? json['tax_id'],
      address: json['address'],
      city: json['city'],
      country: json['country'],
      phone: json['phone'],
      email: json['email'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'registrationNumber': registrationNumber,
      'taxId': taxId,
      'address': address,
      'city': city,
      'country': country,
      'phone': phone,
      'email': email,
    };
  }
}

class ShippingInfo {
  final bool freeShipping;
  final double? freeShippingThreshold;
  final double? standardShippingCost;
  final List<String>? supportedCountries;
  final int? estimatedDays;

  ShippingInfo({
    this.freeShipping = false,
    this.freeShippingThreshold,
    this.standardShippingCost,
    this.supportedCountries,
    this.estimatedDays,
  });

  factory ShippingInfo.fromJson(Map<String, dynamic> json) {
    return ShippingInfo(
      freeShipping: json['freeShipping'] ?? json['free_shipping'] ?? false,
      freeShippingThreshold: json['freeShippingThreshold'] != null
          ? (json['freeShippingThreshold'] as num).toDouble()
          : json['free_shipping_threshold'] != null
              ? (json['free_shipping_threshold'] as num).toDouble()
              : null,
      standardShippingCost: json['standardShippingCost'] != null
          ? (json['standardShippingCost'] as num).toDouble()
          : json['standard_shipping_cost'] != null
              ? (json['standard_shipping_cost'] as num).toDouble()
              : null,
      supportedCountries: json['supportedCountries'] != null
          ? List<String>.from(json['supportedCountries'])
          : json['supported_countries'] != null
              ? List<String>.from(json['supported_countries'])
              : null,
      estimatedDays: json['estimatedDays'] ?? json['estimated_days'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'freeShipping': freeShipping,
      'freeShippingThreshold': freeShippingThreshold,
      'standardShippingCost': standardShippingCost,
      'supportedCountries': supportedCountries,
      'estimatedDays': estimatedDays,
    };
  }
}

class StorePolicies {
  final String? returnPolicy;
  final String? refundPolicy;
  final String? shippingPolicy;
  final String? privacyPolicy;

  StorePolicies({
    this.returnPolicy,
    this.refundPolicy,
    this.shippingPolicy,
    this.privacyPolicy,
  });

  factory StorePolicies.fromJson(Map<String, dynamic> json) {
    return StorePolicies(
      returnPolicy: json['returnPolicy'] ?? json['return_policy'],
      refundPolicy: json['refundPolicy'] ?? json['refund_policy'],
      shippingPolicy: json['shippingPolicy'] ?? json['shipping_policy'],
      privacyPolicy: json['privacyPolicy'] ?? json['privacy_policy'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'returnPolicy': returnPolicy,
      'refundPolicy': refundPolicy,
      'shippingPolicy': shippingPolicy,
      'privacyPolicy': privacyPolicy,
    };
  }
}

class StoreRatings {
  final double average;
  final int count;

  StoreRatings({
    this.average = 0.0,
    this.count = 0,
  });

  factory StoreRatings.fromJson(Map<String, dynamic> json) {
    return StoreRatings(
      average: (json['average'] ?? 0).toDouble(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'average': average,
      'count': count,
    };
  }
}

class StoreStats {
  final int totalProducts;
  final int totalSales;
  final double totalRevenue;

  StoreStats({
    this.totalProducts = 0,
    this.totalSales = 0,
    this.totalRevenue = 0.0,
  });

  factory StoreStats.fromJson(Map<String, dynamic> json) {
    return StoreStats(
      totalProducts: json['totalProducts'] ?? json['total_products'] ?? 0,
      totalSales: json['totalSales'] ?? json['total_sales'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? json['total_revenue'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalProducts': totalProducts,
      'totalSales': totalSales,
      'totalRevenue': totalRevenue,
    };
  }
}

