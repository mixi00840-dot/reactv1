import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/video_clip.dart';

/// Recording progress bar showing clips and remaining time
class RecordingProgressBar extends StatelessWidget {
  final double progress;
  final List<VideoClip> clips;
  final int maxDuration;

  const RecordingProgressBar({
    Key? key,
    required this.progress,
    required this.clips,
    required this.maxDuration,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (clips.isEmpty && progress == 0) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          // Progress bar
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.whiteOverlay20,
              borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            ),
            child: Stack(
              children: [
                // Clip segments
                Row(
                  children: _buildClipSegments(),
                ),
                
                // Total progress
                FractionallySizedBox(
                  widthFactor: progress.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.secondary],
                      ),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: AppSpacing.xs),
          
          // Time indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                _formatDuration(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  shadows: [
                    Shadow(
                      color: Colors.black54,
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildClipSegments() {
    if (clips.isEmpty) return [];

    return clips.map((clip) {
      final clipProgress = clip.duration.inMilliseconds /
          (maxDuration * 1000);

      return Expanded(
        flex: (clipProgress * 1000).round(),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 0.5),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          ),
        ),
      );
    }).toList();
  }

  String _formatDuration() {
    final totalSeconds = (progress * maxDuration).round();
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')} / ${maxDuration ~/ 60}:${(maxDuration % 60).toString().padLeft(2, '0')}';
  }
}
