import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../../../core/theme/app_colors.dart';

class CameraControls extends StatelessWidget {
  final bool isPhotoMode;
  final bool isRecording;
  final bool isPaused;
  final FlashMode flashMode;
  final VoidCallback onCapture;
  final VoidCallback? onPauseResume;
  final VoidCallback onFlipCamera;
  final VoidCallback onFlashToggle;
  final VoidCallback onGalleryOpen;

  const CameraControls({
    super.key,
    required this.isPhotoMode,
    required this.isRecording,
    required this.isPaused,
    required this.flashMode,
    required this.onCapture,
    this.onPauseResume,
    required this.onFlipCamera,
    required this.onFlashToggle,
    required this.onGalleryOpen,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Side Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Gallery
              _buildSideButton(
                icon: Icons.photo_library,
                label: 'Gallery',
                onTap: onGalleryOpen,
              ),

              // Capture Button
              GestureDetector(
                onTap: onCapture,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 4,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isRecording ? Colors.red : Colors.white,
                      ),
                    ),
                  ),
                ),
              ),

              // Flip Camera
              _buildSideButton(
                icon: Icons.flip_camera_ios,
                label: 'Flip',
                onTap: onFlipCamera,
              ),
            ],
          ),

          if (!isPhotoMode && isRecording) ...[
            const SizedBox(height: 16),
            // Pause/Resume Button
            ElevatedButton.icon(
              onPressed: onPauseResume,
              icon: Icon(isPaused ? Icons.play_arrow : Icons.pause),
              label: Text(isPaused ? 'Resume' : 'Pause'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Bottom Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Flash
              _buildBottomControl(
                icon: _getFlashIcon(),
                label: _getFlashLabel(),
                onTap: onFlashToggle,
              ),

              // Speed (Video only)
              if (!isPhotoMode)
                _buildBottomControl(
                  icon: Icons.speed,
                  label: '1x',
                  onTap: () {
                    // Speed control
                  },
                ),

              // Beauty (Photo only)
              if (isPhotoMode)
                _buildBottomControl(
                  icon: Icons.face_retouching_natural,
                  label: 'Beauty',
                  onTap: () {
                    // Beauty mode
                  },
                ),

              // Filters
              _buildBottomControl(
                icon: Icons.filter_vintage,
                label: 'Filters',
                onTap: () {
                  // Open filters
                },
              ),

              // Timer
              _buildBottomControl(
                icon: Icons.timer,
                label: 'Timer',
                onTap: () {
                  // Set timer
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSideButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.black.withOpacity(0.5),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControl({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getFlashIcon() {
    switch (flashMode) {
      case FlashMode.off:
        return Icons.flash_off;
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      default:
        return Icons.flash_off;
    }
  }

  String _getFlashLabel() {
    switch (flashMode) {
      case FlashMode.off:
        return 'Off';
      case FlashMode.auto:
        return 'Auto';
      case FlashMode.always:
        return 'On';
      default:
        return 'Off';
    }
  }
}
