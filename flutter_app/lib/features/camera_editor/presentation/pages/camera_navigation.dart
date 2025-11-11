import 'package:flutter/material.dart';
import 'tiktok_camera_page.dart';

/// Navigation helper for camera feature
class CameraNavigation {
  /// Navigate to TikTok-style camera page
  static Future<void> openCamera(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TikTokCameraPage(),
        fullscreenDialog: true,
      ),
    );
  }

  /// Navigate to camera and wait for result
  static Future<Map<String, dynamic>?> openCameraForResult(
    BuildContext context,
  ) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const TikTokCameraPage(),
        fullscreenDialog: true,
      ),
    );
    return result;
  }
}
