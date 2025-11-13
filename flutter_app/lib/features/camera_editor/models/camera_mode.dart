/// Camera recording modes matching TikTok's interface
enum CameraMode {
  /// Live streaming mode
  live,
  
  /// 15-second video mode
  video15s,
  
  /// 60-second video mode (default)
  video60s,
  
  /// 10-minute video mode
  video10m,
  
  /// Photo capture mode
  photo,
}

/// Content destination type
enum ContentType {
  /// Regular post (goes to feed)
  post,
  
  /// Story (24h temporary content)
  story,
}

/// Extension methods for ContentType
extension ContentTypeExtension on ContentType {
  /// Display name for UI
  String get displayName {
    switch (this) {
      case ContentType.post:
        return 'Post';
      case ContentType.story:
        return 'Story';
    }
  }
  
  /// Description text
  String get description {
    switch (this) {
      case ContentType.post:
        return 'Share to your feed';
      case ContentType.story:
        return 'Share for 24 hours';
    }
  }
}

/// Extension methods for CameraMode
extension CameraModeExtension on CameraMode {
  /// Display name for UI
  String get displayName {
    switch (this) {
      case CameraMode.live:
        return 'Live';
      case CameraMode.video15s:
        return '15s';
      case CameraMode.video60s:
        return '60s';
      case CameraMode.video10m:
        return '10m';
      case CameraMode.photo:
        return 'Photo';
    }
  }

  /// Maximum duration for video modes
  Duration get maxDuration {
    switch (this) {
      case CameraMode.video15s:
        return const Duration(seconds: 15);
      case CameraMode.video60s:
        return const Duration(seconds: 60);
      case CameraMode.video10m:
        return const Duration(seconds: 600);
      case CameraMode.live:
      case CameraMode.photo:
        return Duration.zero;
    }
  }

  /// Whether this mode is a video recording mode
  bool get isVideoMode {
    return this == CameraMode.video15s ||
           this == CameraMode.video60s ||
           this == CameraMode.video10m;
  }

  /// Whether this mode is live streaming
  bool get isLiveMode => this == CameraMode.live;

  /// Whether this mode is photo capture
  bool get isPhotoMode => this == CameraMode.photo;

  /// Icon name for this mode (for future use)
  String get iconName {
    switch (this) {
      case CameraMode.live:
        return 'live_icon';
      case CameraMode.video15s:
      case CameraMode.video60s:
      case CameraMode.video10m:
        return 'video_icon';
      case CameraMode.photo:
        return 'photo_icon';
    }
  }

  /// Color indicator for mode
  String get colorHex {
    switch (this) {
      case CameraMode.live:
        return '#FF0000'; // Red for live
      case CameraMode.video15s:
      case CameraMode.video60s:
      case CameraMode.video10m:
        return '#4AB7FF'; // Blue for video
      case CameraMode.photo:
        return '#FFFFFF'; // White for photo
    }
  }
}

