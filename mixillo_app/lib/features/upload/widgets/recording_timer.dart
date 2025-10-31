import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class RecordingTimer extends StatelessWidget {
  final int seconds;
  final bool isPaused;
  final int maxSeconds;

  const RecordingTimer({
    super.key,
    required this.seconds,
    required this.isPaused,
    required this.maxSeconds,
  });

  @override
  Widget build(BuildContext context) {
    final progress = seconds / maxSeconds;
    final minutesStr = (seconds ~/ 60).toString().padLeft(2, '0');
    final secondsStr = (seconds % 60).toString().padLeft(2, '0');

    return Container(
      margin: const EdgeInsets.only(top: 60),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Recording Indicator
              if (!isPaused)
                Container(
                  width: 12,
                  height: 12,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.red,
                  ),
                ),

              // Pause Icon
              if (isPaused)
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: const Icon(
                    Icons.pause,
                    color: Colors.yellow,
                    size: 16,
                  ),
                ),

              // Timer Text
              Text(
                '$minutesStr:$secondsStr',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),

              Text(
                ' / ${(maxSeconds ~/ 60).toString().padLeft(2, '0')}:${(maxSeconds % 60).toString().padLeft(2, '0')}',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Progress Bar
          Container(
            width: 200,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: progress,
              child: Container(
                decoration: BoxDecoration(
                  color: progress > 0.9 ? Colors.red : AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
