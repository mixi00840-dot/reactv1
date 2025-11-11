import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';

/// Timer selector (Off, 3s, 10s)
class TimerSelector extends ConsumerWidget {
  const TimerSelector({super.key});

  static const List<int?> timerOptions = [null, 3, 10];
  static final Map<int?, String> timerLabels = {
    null: 'Off',
    3: '3s',
    10: '10s',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final currentTimer = recordingState.timerSeconds;

    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.black.withOpacity(0.9),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (context) => Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Timer',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                ...timerOptions.map((option) {
                  final isSelected = option == currentTimer;
                  return ListTile(
                    leading: Icon(
                      isSelected ? Icons.check_circle : Icons.circle_outlined,
                      color: isSelected ? AppColors.primary : Colors.white60,
                    ),
                    title: Text(
                      timerLabels[option]!,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    onTap: () {
                      ref
                          .read(cameraRecordingProvider.notifier)
                          .setTimer(option);
                      Navigator.pop(context);
                    },
                  );
                }),
                const SizedBox(height: 10),
              ],
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: currentTimer != null
              ? AppColors.primary.withOpacity(0.3)
              : Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(
          currentTimer != null ? Iconsax.timer_15 : Iconsax.timer,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }
}
