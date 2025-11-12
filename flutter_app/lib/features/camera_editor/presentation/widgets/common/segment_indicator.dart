import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';
import '../../../models/camera_recording_state.dart';

/// Segment timeline indicator showing recorded segments
class SegmentIndicator extends ConsumerWidget {
  const SegmentIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      width: screenWidth,
      height: 4,
      color: Colors.white.withValues(alpha: 0.3),
      child: Stack(
        children: [
          // Recorded segments
          ...recordingState.segments.asMap().entries.map((entry) {
            final startProgress = recordingState.segments
                .take(entry.key)
                .fold<Duration>(
                  Duration.zero,
                  (sum, seg) => sum + seg.duration,
                )
                .inMilliseconds /
                recordingState.maxDuration.inMilliseconds;

            final segmentProgress =
                entry.value.duration.inMilliseconds /
                    recordingState.maxDuration.inMilliseconds;

            return Positioned(
              left: startProgress * screenWidth,
              child: Container(
                width: segmentProgress * screenWidth,
                height: 4,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primaryDark,
                    ],
                  ),
                ),
              ),
            );
          }),

          // Current progress (if recording)
          if (recordingState.state == RecordingState.recording)
            Positioned(
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                value: recordingState.progress,
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.liveRed.withValues(alpha: 0.8),
                ),
                minHeight: 4,
              ),
            ),
        ],
      ),
    );
  }
}
