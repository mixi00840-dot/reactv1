import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'circular_icon_button.dart';
import '../../../models/flash_mode.dart';

/// Right side vertical bar for TikTok-style camera interface
/// Contains flip camera, flash, speed, beauty, filters, sound, and timer buttons
class RightSideBarWidget extends StatelessWidget {
  final VoidCallback onFlipCamera;
  final VoidCallback onFlashToggle;
  final VoidCallback onSpeedSelector;
  final VoidCallback onBeautyEffects;
  final VoidCallback onFilters;
  final VoidCallback onSoundPicker;
  final VoidCallback onTimerSettings;
  final VoidCallback? onToggleMode;
  final AppFlashMode flashMode;
  final double currentSpeed;
  final bool hasBeautyEffects;
  final bool hasFilters;
  final String? selectedSound;
  final bool isRecording;
  final bool isPhotoMode;

  const RightSideBarWidget({
    super.key,
    required this.onFlipCamera,
    required this.onFlashToggle,
    required this.onSpeedSelector,
    required this.onBeautyEffects,
    required this.onFilters,
    required this.onSoundPicker,
    required this.onTimerSettings,
    this.onToggleMode,
    this.flashMode = AppFlashMode.off,
    this.currentSpeed = 1.0,
    this.hasBeautyEffects = false,
    this.hasFilters = false,
    this.selectedSound,
    this.isRecording = false,
    this.isPhotoMode = false,
  });

  @override
  Widget build(BuildContext context) {
    // ✅ FIXED: Use LayoutBuilder for responsive sizing
    return LayoutBuilder(
      builder: (context, constraints) {
        // ✅ FIXED: Calculate safe button spacing based on available height
        final availableHeight = constraints.maxHeight;
        final buttonCount = 7; // Total number of buttons
        final buttonSize = 48.0;
        final minSpacing = 8.0; // Minimum spacing
        final totalButtonHeight = buttonSize * buttonCount;
        
        // Calculate optimal spacing (max 12, min 8)
        final optimalSpacing = ((availableHeight - totalButtonHeight) / (buttonCount + 1))
            .clamp(minSpacing, 12.0);

        return Container(
          width: 60,
          padding: const EdgeInsets.only(right: 8),
          // ✅ FIXED: Make scrollable if content exceeds height
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: optimalSpacing),
                
                // Flip Camera Button
                CircularIconButton(
                  icon: Iconsax.camera,
                  onTap: isRecording ? () {} : onFlipCamera,
                  size: 48,
                  iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
                ),
                SizedBox(height: optimalSpacing),

                // Flash Toggle Button (Off/Auto/On with cycling)
                CircularIconButton(
                  icon: _getFlashIcon(),
                  onTap: onFlashToggle,
                  size: 48,
                  isActive: flashMode != AppFlashMode.off,
                  badge: _getFlashBadge(),
                ),
                SizedBox(height: optimalSpacing),

                // Speed Selector Button
                CircularIconButton(
                  icon: Iconsax.speedometer,
                  onTap: isRecording ? () {} : onSpeedSelector,
                  size: 48,
                  iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
                  isActive: currentSpeed != 1.0,
                  badge: currentSpeed != 1.0
                      ? Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF00D9FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Colors.white,
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            '${currentSpeed}x',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        )
                      : null,
                ),
                SizedBox(height: optimalSpacing),

                // Beauty Effects Button
                CircularIconButton(
                  icon: Iconsax.magic_star,
                  onTap: onBeautyEffects,
                  size: 48,
                  isActive: hasBeautyEffects,
                  badge: hasBeautyEffects
                      ? Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.pink,
                            border: Border.all(
                              color: Colors.white,
                              width: 1.5,
                            ),
                          ),
                        )
                      : null,
                ),
                SizedBox(height: optimalSpacing),

                // Filters Button
                CircularIconButton(
                  icon: Iconsax.colorfilter,
                  onTap: onFilters,
                  size: 48,
                  isActive: hasFilters,
                  badge: hasFilters
                      ? Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.purple,
                            border: Border.all(
                              color: Colors.white,
                              width: 1.5,
                            ),
                          ),
                        )
                      : null,
                ),
                SizedBox(height: optimalSpacing),

                // Sound Picker Button
                CircularIconButton(
                  icon: selectedSound != null ? Iconsax.music5 : Iconsax.musicnote,
                  onTap: isRecording ? () {} : onSoundPicker,
                  size: 48,
                  isActive: selectedSound != null,
                  iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
                  badge: selectedSound != null
                      ? Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF2ECC71),
                            border: Border.all(
                              color: Colors.white,
                              width: 1.5,
                            ),
                          ),
                        )
                      : null,
                ),
                SizedBox(height: optimalSpacing),

                // Timer Settings Button
                CircularIconButton(
                  icon: Iconsax.timer_1,
                  onTap: isRecording ? () {} : onTimerSettings,
                  size: 48,
                  iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
                ),
                SizedBox(height: optimalSpacing),

          // Mode Toggle Button (Video <-> Photo)
          CircularIconButton(
            icon: isPhotoMode ? Icons.videocam : Iconsax.camera,
            onTap: isRecording ? () {} : (onToggleMode ?? () {}),
            size: 48,
            isActive: isPhotoMode,
            iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
            badge: isPhotoMode
                ? Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.blue,
                      border: Border.all(
                        color: Colors.white,
                        width: 1.5,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 6),
          Text(
            isPhotoMode ? 'Photo' : 'Video',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 12,
              fontWeight: FontWeight.w600,
              shadows: const [
                Shadow(color: Colors.black45, blurRadius: 4),
              ],
            ),
          ),
        ],
            ), // Column
          ), // SingleChildScrollView
        ); // Container
      }, // builder
    ); // LayoutBuilder
  }

  /// Get flash icon based on mode
  IconData _getFlashIcon() {
    switch (flashMode) {
      case AppFlashMode.off:
        return Iconsax.flash_slash;
      case AppFlashMode.auto:
        return Iconsax.flash;
      case AppFlashMode.on:
        return Iconsax.flash_15;
    }
  }

  /// Get flash badge widget
  Widget? _getFlashBadge() {
    if (flashMode == AppFlashMode.off) return null;

    if (flashMode == AppFlashMode.auto) {
      // Auto mode: White badge with "A"
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white,
            width: 1.5,
          ),
        ),
        child: const Text(
          'A',
          style: TextStyle(
            color: Colors.black,
            fontSize: 9,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    } else {
      // On mode: Yellow circle
      return Container(
        width: 12,
        height: 12,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFFFD700),
          border: Border.all(
            color: Colors.white,
            width: 1.5,
          ),
        ),
      );
    }
  }
}
