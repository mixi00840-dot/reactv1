import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'circular_icon_button.dart';

/// Right side vertical bar for TikTok-style camera interface
/// Contains flip camera, flash, beauty, filters, sound, and timer buttons
class RightSideBarWidget extends StatelessWidget {
  final VoidCallback onFlipCamera;
  final VoidCallback onFlashToggle;
  final VoidCallback onBeautyEffects;
  final VoidCallback onFilters;
  final VoidCallback onSoundPicker;
  final VoidCallback onTimerSettings;
  final VoidCallback? onToggleMode;
  final bool isFlashOn;
  final bool hasBeautyEffects;
  final bool hasFilters;
  final String? selectedSound;
  final bool isRecording;
  final bool isPhotoMode;

  const RightSideBarWidget({
    super.key,
    required this.onFlipCamera,
    required this.onFlashToggle,
    required this.onBeautyEffects,
    required this.onFilters,
    required this.onSoundPicker,
    required this.onTimerSettings,
    this.onToggleMode,
    this.isFlashOn = false,
    this.hasBeautyEffects = false,
    this.hasFilters = false,
    this.selectedSound,
    this.isRecording = false,
    this.isPhotoMode = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      padding: const EdgeInsets.only(right: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Flip Camera Button
          CircularIconButton(
            icon: Iconsax.camera,
            onTap: isRecording ? () {} : onFlipCamera,
            size: 48,
            iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
          ),
          const SizedBox(height: 12),

          // Flash Toggle Button
          CircularIconButton(
            icon: isFlashOn ? Iconsax.flash_15 : Iconsax.flash_slash,
            onTap: onFlashToggle,
            size: 48,
            isActive: isFlashOn,
            badge: isFlashOn
                ? Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.yellow,
                      border: Border.all(
                        color: Colors.white,
                        width: 1.5,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 12),

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
          const SizedBox(height: 12),

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
          const SizedBox(height: 12),

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
                      color: Colors.green,
                      border: Border.all(
                        color: Colors.white,
                        width: 1.5,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 12),

          // Timer Settings Button
          CircularIconButton(
            icon: Iconsax.timer_1,
            onTap: isRecording ? () {} : onTimerSettings,
            size: 48,
            iconColor: isRecording ? Colors.white.withValues(alpha: 0.5) : Colors.white,
          ),
          const SizedBox(height: 12),

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
      ),
    );
  }
}
