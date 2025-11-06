import 'package:flutter/material.dart';

/// Sound Model - For camera sound/music selection
class SoundModel {
  final String id;
  final String soundId; // Backend soundId
  final String title;
  final String artist;
  final String? album;
  final String? coverUrl;
  final String? thumbnailUrl;
  final String audioUrl;
  final int duration; // in seconds
  final int usageCount;
  final List<String> tags;
  final List<String> categories;
  final String? genre;
  final String? mood;
  final bool isOriginal;
  final bool isTrending;
  final bool isFeatured;
  final DateTime createdAt;
  final DateTime? updatedAt;

  SoundModel({
    required this.id,
    required this.soundId,
    required this.title,
    required this.artist,
    this.album,
    this.coverUrl,
    this.thumbnailUrl,
    required this.audioUrl,
    this.duration = 0,
    this.usageCount = 0,
    this.tags = const [],
    this.categories = const [],
    this.genre,
    this.mood,
    this.isOriginal = false,
    this.isTrending = false,
    this.isFeatured = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory SoundModel.fromJson(Map<String, dynamic> json) {
    return SoundModel(
      id: json['_id'] ?? json['id'] ?? json['soundId'] ?? '',
      soundId: json['soundId'] ?? json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? '',
      artist: json['artist'] ?? json['author'] ?? 'Unknown',
      album: json['album'],
      coverUrl: json['coverUrl'] ?? json['cover_url'] ?? json['thumbnail'],
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'],
      audioUrl: json['audioUrl'] ?? json['fileUrl'] ?? json['url'] ?? '',
      duration: json['duration'] ?? 0,
      usageCount: json['usageCount'] ?? json['usage_count'] ?? 0,
      tags: List<String>.from(json['tags'] ?? []),
      categories: List<String>.from(json['categories'] ?? []),
      genre: json['genre'] ?? json['metadata']?['genre']?.first,
      mood: json['mood'] ?? json['metadata']?['mood']?.first,
      isOriginal: json['isOriginal'] ?? false,
      isTrending: json['isTrending'] ?? false,
      isFeatured: json['isFeatured'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'soundId': soundId,
      'title': title,
      'artist': artist,
      'album': album,
      'coverUrl': coverUrl,
      'thumbnailUrl': thumbnailUrl,
      'audioUrl': audioUrl,
      'duration': duration,
      'usageCount': usageCount,
      'tags': tags,
      'categories': categories,
      'genre': genre,
      'mood': mood,
      'isOriginal': isOriginal,
      'isTrending': isTrending,
      'isFeatured': isFeatured,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get displayName => '$artist - $title';
  String get shortTitle => title.length > 20 ? '${title.substring(0, 20)}...' : title;
}

/// Sound Selection State - For camera recording
class SoundSelection {
  final SoundModel? sound;
  final double startTime; // Start time in sound (seconds)
  final double originalVolume; // 0.0 to 1.0
  final double musicVolume; // 0.0 to 1.0
  final bool useOriginalSound;
  final String? voiceoverPath; // Path to recorded voiceover

  SoundSelection({
    this.sound,
    this.startTime = 0.0,
    this.originalVolume = 1.0,
    this.musicVolume = 1.0,
    this.useOriginalSound = true,
    this.voiceoverPath,
  });

  SoundSelection copyWith({
    SoundModel? sound,
    double? startTime,
    double? originalVolume,
    double? musicVolume,
    bool? useOriginalSound,
    String? voiceoverPath,
  }) {
    return SoundSelection(
      sound: sound ?? this.sound,
      startTime: startTime ?? this.startTime,
      originalVolume: originalVolume ?? this.originalVolume,
      musicVolume: musicVolume ?? this.musicVolume,
      useOriginalSound: useOriginalSound ?? this.useOriginalSound,
      voiceoverPath: voiceoverPath ?? this.voiceoverPath,
    );
  }

  bool get hasSound => sound != null;
  bool get hasVoiceover => voiceoverPath != null;
}

