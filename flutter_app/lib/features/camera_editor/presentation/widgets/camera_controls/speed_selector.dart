import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';

/// Speed selector widget (0.3x, 0.5x, 1x, 2x, 3x)
class SpeedSelector extends ConsumerWidget {
  const SpeedSelector({super.key});

  static const List<double> speeds = [0.3, 0.5, 1.0, 2.0, 3.0];
  static final Map<double, String> speedLabels = {
    0.3: '0.3x',
    0.5: '0.5x',
    1.0: '1x',
    2.0: '2x',
    3.0: '3x',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final currentSpeed = recordingState.currentSpeed;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: speeds.map((speed) {
          final isSelected = speed == currentSpeed;
          return GestureDetector(
            onTap: () {
              ref.read(cameraRecordingProvider.notifier).setSpeed(speed);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                speedLabels[speed]!,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
