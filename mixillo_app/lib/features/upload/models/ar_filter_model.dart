import 'package:flutter/material.dart';

class ARFilterModel {
  final String id;
  final String name;
  final String icon; // Icon URL or asset path
  final FilterType type;
  final FilterCategory category;
  final bool isPremium;
  final Map<String, dynamic>? parameters; // Filter-specific parameters

  ARFilterModel({
    required this.id,
    required this.name,
    required this.icon,
    required this.type,
    required this.category,
    this.isPremium = false,
    this.parameters,
  });

  factory ARFilterModel.fromJson(Map<String, dynamic> json) {
    return ARFilterModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      icon: json['icon'] ?? json['thumbnail'] ?? '',
      type: FilterType.fromString(json['type'] ?? 'effect'),
      category: FilterCategory.fromString(json['category'] ?? 'fun'),
      isPremium: json['isPremium'] ?? json['is_premium'] ?? false,
      parameters: json['parameters'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'type': type.name,
      'category': category.name,
      'isPremium': isPremium,
      'parameters': parameters,
    };
  }
}

enum FilterType {
  effect, // Visual effects
  beauty, // Beauty filters
  ar, // AR face filters
  background, // Background replacement
  sticker, // Stickers/overlays

  static FilterType fromString(String value) {
    return FilterType.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => FilterType.effect,
    );
  }
}

enum FilterCategory {
  fun,
  beauty,
  artistic,
  vintage,
  nature,
  animal,
  celebrity,
  seasonal,

  static FilterCategory fromString(String value) {
    return FilterCategory.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => FilterCategory.fun,
    );
  }
}

class BeautyEffectModel {
  final String id;
  final String name;
  final BeautyType type;
  final double intensity; // 0.0 to 1.0
  final IconData icon;

  BeautyEffectModel({
    required this.id,
    required this.name,
    required this.type,
    this.intensity = 0.5,
    required this.icon,
  });
}

enum BeautyType {
  smoothSkin,
  brighten,
  whiten,
  shrinkFace,
  enlargeEyes,
  slimNose,
  removeBlemishes,
  antiAging,
}

class VideoSpeedModel {
  final double speed; // 0.25x, 0.5x, 1x, 2x, 3x
  final String label;
  final IconData icon;

  VideoSpeedModel({
    required this.speed,
    required this.label,
    required this.icon,
  });

  static List<VideoSpeedModel> get defaultSpeeds => [
    VideoSpeedModel(speed: 0.25, label: '0.25x', icon: Icons.slow_motion_video),
    VideoSpeedModel(speed: 0.5, label: '0.5x', icon: Icons.speed),
    VideoSpeedModel(speed: 1.0, label: '1x', icon: Icons.play_circle),
    VideoSpeedModel(speed: 2.0, label: '2x', icon: Icons.fast_forward),
    VideoSpeedModel(speed: 3.0, label: '3x', icon: Icons.fast_forward),
  ];
}

