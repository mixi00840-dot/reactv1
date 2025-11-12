import 'package:camera/camera.dart' as camera;

/// Flash mode options for camera
enum AppFlashMode {
  off,
  auto,
  on,
}

extension AppFlashModeExtension on AppFlashMode {
  /// Display name for UI
  String get displayName {
    switch (this) {
      case AppFlashMode.off:
        return 'Off';
      case AppFlashMode.auto:
        return 'Auto';
      case AppFlashMode.on:
        return 'On';
    }
  }

  /// Icon name for UI
  String get iconName {
    switch (this) {
      case AppFlashMode.off:
        return 'flash_slash';
      case AppFlashMode.auto:
        return 'flash_auto';
      case AppFlashMode.on:
        return 'flash_on';
    }
  }

  /// Convert to camera package FlashMode
  camera.FlashMode toCameraFlashMode() {
    switch (this) {
      case AppFlashMode.off:
        return camera.FlashMode.off;
      case AppFlashMode.auto:
        return camera.FlashMode.auto;
      case AppFlashMode.on:
        return camera.FlashMode.torch;
    }
  }

  /// Cycle to next flash mode
  AppFlashMode next() {
    switch (this) {
      case AppFlashMode.off:
        return AppFlashMode.auto;
      case AppFlashMode.auto:
        return AppFlashMode.on;
      case AppFlashMode.on:
        return AppFlashMode.off;
    }
  }

  /// Badge color for UI
  String? get badgeColor {
    switch (this) {
      case AppFlashMode.off:
        return null; // No badge
      case AppFlashMode.auto:
        return '#FFFFFF'; // White for auto
      case AppFlashMode.on:
        return '#FFD700'; // Yellow/Gold for on
    }
  }

  /// Badge text (for auto mode)
  String? get badgeText {
    switch (this) {
      case AppFlashMode.auto:
        return 'A';
      default:
        return null;
    }
  }
}

