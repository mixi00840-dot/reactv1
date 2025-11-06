import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/camera_provider.dart';
import '../models/ar_filter_model.dart';

/// Speed Selector - Video speed control (0.25x to 3x)
class SpeedSelector extends StatelessWidget {
  final Function(double) onSpeedSelected;
  final VoidCallback onClose;

  const SpeedSelector({
    super.key,
    required this.onSpeedSelected,
    required this.onClose,
  });

  static const List<VideoSpeedModel> speeds = [
    VideoSpeedModel(speed: 0.25, label: '0.25x', icon: Icons.slow_motion_video),
    VideoSpeedModel(speed: 0.5, label: '0.5x', icon: Icons.speed),
    VideoSpeedModel(speed: 1.0, label: '1x', icon: Icons.play_circle),
    VideoSpeedModel(speed: 2.0, label: '2x', icon: Icons.fast_forward),
    VideoSpeedModel(speed: 3.0, label: '3x', icon: Icons.fast_forward),
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CameraProvider>();
    final currentSpeed = provider.videoSpeed;

    return Container(
      height: 150,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusXl),
          topRight: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: AppSpacing.screenPadding(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Speed',
                  style: AppTypography.headlineSmall(context).copyWith(
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: onClose,
                ),
              ],
            ),
          ),

          // Speed Options
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: speeds.map((speed) {
                final isSelected = currentSpeed == speed.speed;
                return _buildSpeedOption(speed, isSelected, context);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpeedOption(VideoSpeedModel speed, bool isSelected, BuildContext context) {
    return GestureDetector(
      onTap: () {
        onSpeedSelected(speed.speed);
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.1),
              border: Border.all(
                color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.3),
                width: isSelected ? 3 : 1,
              ),
            ),
            child: Icon(
              speed.icon,
              color: isSelected ? Colors.white : Colors.white70,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            speed.label,
            style: AppTypography.labelMedium(context).copyWith(
              color: isSelected ? AppColors.primary : Colors.white70,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

