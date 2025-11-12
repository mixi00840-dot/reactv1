import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';

/// Countdown overlay (3, 2, 1)
class CountdownOverlay extends ConsumerWidget {
  const CountdownOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordingState = ref.watch(cameraRecordingProvider);

    if (!recordingState.isCountingDown) {
      return const SizedBox.shrink();
    }

    return Container(
      color: Colors.black.withValues(alpha: 0.6),
      child: Center(
        child: TweenAnimationBuilder<double>(
          key: ValueKey(recordingState.countdownRemaining),
          tween: Tween(begin: 1.5, end: 0.8),
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOut,
          builder: (context, scale, child) {
            return Transform.scale(
              scale: scale,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary,
                    width: 4,
                  ),
                ),
                child: Center(
                  child: Text(
                    '${recordingState.countdownRemaining}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 72,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          color: Colors.black,
                          blurRadius: 10,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
