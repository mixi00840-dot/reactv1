import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'presentation/pages/camera_navigation.dart';

/// Example integration: Add camera button to your existing app
class IntegrationExample extends ConsumerWidget {
  const IntegrationExample({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Camera Integration')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Example 1: Simple camera button
            ElevatedButton.icon(
              onPressed: () => CameraNavigation.openCamera(context),
              icon: const Icon(Icons.camera_alt),
              label: const Text('Open Camera'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Example 2: Camera with result handling
            ElevatedButton.icon(
              onPressed: () async {
                final result = await CameraNavigation.openCameraForResult(
                  context,
                );
                
                if (result != null && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Recorded ${result['segments']} segments'),
                    ),
                  );
                }
              },
              icon: const Icon(Icons.videocam),
              label: const Text('Record Video'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
              ),
            ),

            const SizedBox(height: 48),

            // Instructions
            const Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'CAMERA CONTROLS:\n\n'
                '• Tap record button → Start/stop segment\n'
                '• Hold record button → Continuous recording\n'
                '• Drag up/down while holding → Zoom\n'
                '• Top controls → Flash, Timer, Music, Flip\n'
                '• Bottom controls → Filter, Speed\n'
                '• Checkmark → Finish recording\n'
                '• Undo → Remove last segment',
                textAlign: TextAlign.left,
                style: TextStyle(fontSize: 14, height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Add this to your main.dart routes or navigation
class CameraIntegrationHelper {
  /// Example: Add camera FAB to existing video feed
  static Widget cameraFAB(BuildContext context) {
    return FloatingActionButton(
      onPressed: () => CameraNavigation.openCamera(context),
      child: const Icon(Icons.add),
      tooltip: 'Record Video',
    );
  }

  /// Example: Add camera button to app bar
  static Widget cameraAppBarAction(BuildContext context) {
    return IconButton(
      onPressed: () => CameraNavigation.openCamera(context),
      icon: const Icon(Icons.camera_alt),
      tooltip: 'Open Camera',
    );
  }

  /// Example: Add camera to bottom nav
  static BottomNavigationBarItem cameraNavItem() {
    return const BottomNavigationBarItem(
      icon: Icon(Icons.add_circle_outline),
      activeIcon: Icon(Icons.add_circle),
      label: 'Create',
    );
  }
}
