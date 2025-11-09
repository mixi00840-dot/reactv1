import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// TikTok-style top bar for camera interface
class CameraTopBar extends StatelessWidget {
  final VoidCallback onClose;
  final VoidCallback onFlashTap;
  final bool isFlashOn;
  final VoidCallback onSpeedTap;
  final VoidCallback onTimerTap;
  final VoidCallback onFlipTap;
  final double selectedSpeed;

  const CameraTopBar({
    Key? key,
    required this.onClose,
    required this.onFlashTap,
    required this.isFlashOn,
    required this.onSpeedTap,
    required this.onTimerTap,
    required this.onFlipTap,
    required this.selectedSpeed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Close button
            _CameraIconButton(
              icon: Icons.close,
              onTap: onClose,
            ),

            // Center controls
            Row(
              children: [
                // Flash
                _CameraIconButton(
                  icon: isFlashOn ? Icons.flash_on : Icons.flash_off,
                  onTap: onFlashTap,
                  isActive: isFlashOn,
                ),
                const SizedBox(width: AppSpacing.lg),

                // Speed
                _CameraTextButton(
                  text: '${selectedSpeed}x',
                  onTap: onSpeedTap,
                ),
                const SizedBox(width: AppSpacing.lg),

                // Timer
                _CameraIconButton(
                  icon: Icons.timer,
                  onTap: onTimerTap,
                ),
              ],
            ),

            // Flip camera
            _CameraIconButton(
              icon: Icons.flip_camera_ios,
              onTap: onFlipTap,
            ),
          ],
        ),
      ),
    );
  }
}

/// Camera icon button with glassmorphism effect
class _CameraIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isActive;

  const _CameraIconButton({
    Key? key,
    required this.icon,
    required this.onTap,
    this.isActive = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isActive 
              ? AppColors.primary.withOpacity(0.3)
              : AppColors.whiteOverlay20,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: isActive ? AppColors.primary : Colors.white.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Icon(
          icon,
          color: isActive ? AppColors.primary : Colors.white,
          size: AppSpacing.iconLg,
        ),
      ),
    );
  }
}

/// Camera text button (for speed indicator)
class _CameraTextButton extends StatelessWidget {
  final String text;
  final VoidCallback onTap;

  const _CameraTextButton({
    Key? key,
    required this.text,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: AppColors.whiteOverlay20,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
