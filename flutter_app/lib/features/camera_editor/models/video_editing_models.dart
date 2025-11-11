import 'package:flutter/material.dart';

/// Model for video editing project
class VideoEditingProject {
  final String id;
  final List<String> segmentPaths; // Original video segment files
  final Duration totalDuration;
  final Duration trimStart;
  final Duration trimEnd;
  final List<TextOverlay> textOverlays;
  final List<StickerOverlay> stickerOverlays;
  final String? selectedFilter;
  final double speed;
  final bool applyBeautyEffects;

  const VideoEditingProject({
    required this.id,
    required this.segmentPaths,
    required this.totalDuration,
    this.trimStart = Duration.zero,
    Duration? trimEnd,
    this.textOverlays = const [],
    this.stickerOverlays = const [],
    this.selectedFilter,
    this.speed = 1.0,
    this.applyBeautyEffects = false,
  }) : trimEnd = trimEnd ?? totalDuration;

  VideoEditingProject copyWith({
    String? id,
    List<String>? segmentPaths,
    Duration? totalDuration,
    Duration? trimStart,
    Duration? trimEnd,
    List<TextOverlay>? textOverlays,
    List<StickerOverlay>? stickerOverlays,
    String? selectedFilter,
    double? speed,
    bool? applyBeautyEffects,
  }) {
    return VideoEditingProject(
      id: id ?? this.id,
      segmentPaths: segmentPaths ?? this.segmentPaths,
      totalDuration: totalDuration ?? this.totalDuration,
      trimStart: trimStart ?? this.trimStart,
      trimEnd: trimEnd ?? this.trimEnd,
      textOverlays: textOverlays ?? this.textOverlays,
      stickerOverlays: stickerOverlays ?? this.stickerOverlays,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      speed: speed ?? this.speed,
      applyBeautyEffects: applyBeautyEffects ?? this.applyBeautyEffects,
    );
  }

  Duration get trimmedDuration => trimEnd - trimStart;
  bool get isTrimmed => trimStart > Duration.zero || trimEnd < totalDuration;
  bool get hasTextOverlays => textOverlays.isNotEmpty;
  bool get hasStickerOverlays => stickerOverlays.isNotEmpty;
  bool get hasOverlays => hasTextOverlays || hasStickerOverlays;
}

/// Model for text overlay
class TextOverlay {
  final String id;
  final String text;
  final Offset position; // Normalized (0.0-1.0)
  final double fontSize;
  final Color color;
  final String fontFamily;
  final FontWeight fontWeight;
  final TextAlign textAlign;
  final Color? backgroundColor;
  final Duration startTime;
  final Duration endTime;
  final double rotation; // Degrees
  final double scale;

  const TextOverlay({
    required this.id,
    required this.text,
    this.position = const Offset(0.5, 0.5),
    this.fontSize = 32,
    this.color = Colors.white,
    this.fontFamily = 'Roboto',
    this.fontWeight = FontWeight.bold,
    this.textAlign = TextAlign.center,
    this.backgroundColor,
    required this.startTime,
    required this.endTime,
    this.rotation = 0,
    this.scale = 1.0,
  });

  TextOverlay copyWith({
    String? id,
    String? text,
    Offset? position,
    double? fontSize,
    Color? color,
    String? fontFamily,
    FontWeight? fontWeight,
    TextAlign? textAlign,
    Color? backgroundColor,
    Duration? startTime,
    Duration? endTime,
    double? rotation,
    double? scale,
  }) {
    return TextOverlay(
      id: id ?? this.id,
      text: text ?? this.text,
      position: position ?? this.position,
      fontSize: fontSize ?? this.fontSize,
      color: color ?? this.color,
      fontFamily: fontFamily ?? this.fontFamily,
      fontWeight: fontWeight ?? this.fontWeight,
      textAlign: textAlign ?? this.textAlign,
      backgroundColor: backgroundColor ?? this.backgroundColor,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      rotation: rotation ?? this.rotation,
      scale: scale ?? this.scale,
    );
  }

  Duration get duration => endTime - startTime;

  bool isVisibleAt(Duration currentTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'positionX': position.dx,
        'positionY': position.dy,
        'fontSize': fontSize,
        'color': color.value,
        'fontFamily': fontFamily,
        'fontWeight': fontWeight.index,
        'textAlign': textAlign.index,
        'backgroundColor': backgroundColor?.value,
        'startTime': startTime.inMilliseconds,
        'endTime': endTime.inMilliseconds,
        'rotation': rotation,
        'scale': scale,
      };

  factory TextOverlay.fromJson(Map<String, dynamic> json) => TextOverlay(
        id: json['id'],
        text: json['text'],
        position: Offset(json['positionX'], json['positionY']),
        fontSize: json['fontSize'],
        color: Color(json['color']),
        fontFamily: json['fontFamily'],
        fontWeight: FontWeight.values[json['fontWeight']],
        textAlign: TextAlign.values[json['textAlign']],
        backgroundColor: json['backgroundColor'] != null
            ? Color(json['backgroundColor'])
            : null,
        startTime: Duration(milliseconds: json['startTime']),
        endTime: Duration(milliseconds: json['endTime']),
        rotation: json['rotation'],
        scale: json['scale'],
      );
}

/// Model for sticker overlay
class StickerOverlay {
  final String id;
  final String stickerType; // 'emoji', 'shape', 'custom'
  final String content; // Emoji character or asset path
  final Offset position; // Normalized (0.0-1.0)
  final double size; // Base size multiplier
  final Duration startTime;
  final Duration endTime;
  final double rotation; // Degrees
  final double scale;
  final double opacity;

  const StickerOverlay({
    required this.id,
    required this.stickerType,
    required this.content,
    this.position = const Offset(0.5, 0.5),
    this.size = 1.0,
    required this.startTime,
    required this.endTime,
    this.rotation = 0,
    this.scale = 1.0,
    this.opacity = 1.0,
  });

  StickerOverlay copyWith({
    String? id,
    String? stickerType,
    String? content,
    Offset? position,
    double? size,
    Duration? startTime,
    Duration? endTime,
    double? rotation,
    double? scale,
    double? opacity,
  }) {
    return StickerOverlay(
      id: id ?? this.id,
      stickerType: stickerType ?? this.stickerType,
      content: content ?? this.content,
      position: position ?? this.position,
      size: size ?? this.size,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      rotation: rotation ?? this.rotation,
      scale: scale ?? this.scale,
      opacity: opacity ?? this.opacity,
    );
  }

  Duration get duration => endTime - startTime;

  bool isVisibleAt(Duration currentTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'stickerType': stickerType,
        'content': content,
        'positionX': position.dx,
        'positionY': position.dy,
        'size': size,
        'startTime': startTime.inMilliseconds,
        'endTime': endTime.inMilliseconds,
        'rotation': rotation,
        'scale': scale,
        'opacity': opacity,
      };

  factory StickerOverlay.fromJson(Map<String, dynamic> json) => StickerOverlay(
        id: json['id'],
        stickerType: json['stickerType'],
        content: json['content'],
        position: Offset(json['positionX'], json['positionY']),
        size: json['size'],
        startTime: Duration(milliseconds: json['startTime']),
        endTime: Duration(milliseconds: json['endTime']),
        rotation: json['rotation'],
        scale: json['scale'],
        opacity: json['opacity'],
      );
}

/// Available sticker categories
enum StickerCategory {
  emoji('Emoji', '😊'),
  shapes('Shapes', '⭐'),
  arrows('Arrows', '➡️'),
  hearts('Hearts', '❤️'),
  celebrations('Party', '🎉'),
  animals('Animals', '🐶'),
  food('Food', '🍕'),
  travel('Travel', '✈️');

  final String label;
  final String icon;

  const StickerCategory(this.label, this.icon);
}

/// Preset stickers by category
class StickerPresets {
  static const Map<StickerCategory, List<String>> stickers = {
    StickerCategory.emoji: [
      '😀', '😂', '😍', '🤩', '😎', '🤔', '😱', '😭',
      '😴', '🤗', '🥳', '😇', '🤪', '🤯', '😈', '👻'
    ],
    StickerCategory.shapes: [
      '⭐', '✨', '💫', '⚡', '🔥', '💥', '✅', '❌',
      '⭕', '🔴', '🟢', '🟡', '🔵', '🟣', '🟤', '⚫'
    ],
    StickerCategory.arrows: [
      '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️',
      '🔄', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔁', '🔂'
    ],
    StickerCategory.hearts: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '💕', '💖', '💗', '💓', '💞', '💝', '💘', '💔'
    ],
    StickerCategory.celebrations: [
      '🎉', '🎊', '🎈', '🎁', '🎂', '🎆', '🎇', '✨',
      '🥳', '🍾', '🥂', '🎭', '🎪', '🎨', '🎬', '🎤'
    ],
    StickerCategory.animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄'
    ],
    StickerCategory.food: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥤', '☕',
      '🍦', '🍰', '🎂', '🍪', '🍩', '🍫', '🍬', '🍭'
    ],
    StickerCategory.travel: [
      '✈️', '🚀', '🚁', '🚂', '🚗', '🚕', '🚙', '🚌',
      '🏖️', '🏝️', '🗺️', '🧳', '⛱️', '🏔️', '🗽', '🗼'
    ],
  };

  static List<String> getStickers(StickerCategory category) {
    return stickers[category] ?? [];
  }

  static List<String> getAllStickers() {
    return stickers.values.expand((list) => list).toList();
  }
}
