import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

/// TikTok-style slim timeline for video editor
/// 40px total height with 3px progress bar and small thumbnails
class EditorTimelineSlim extends StatefulWidget {
  final Duration totalDuration;
  final Duration currentPosition;
  final Duration trimStart;
  final Duration trimEnd;
  final List<Uint8List> thumbnails;
  final Function(Duration, Duration)? onTrimChanged;
  final Function(Duration)? onSeek;

  const EditorTimelineSlim({
    super.key,
    required this.totalDuration,
    required this.currentPosition,
    this.trimStart = Duration.zero,
    Duration? trimEnd,
    this.thumbnails = const [],
    this.onTrimChanged,
    this.onSeek,
  }) : trimEnd = trimEnd ?? totalDuration;

  @override
  State<EditorTimelineSlim> createState() => _EditorTimelineSlimState();
}

class _EditorTimelineSlimState extends State<EditorTimelineSlim> {
  Duration? _draggingStart;
  Duration? _draggingEnd;

  Duration get effectiveTrimStart => _draggingStart ?? widget.trimStart;
  Duration get effectiveTrimEnd => _draggingEnd ?? widget.trimEnd;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width - 32;
    final progress = widget.totalDuration.inMilliseconds > 0
        ? widget.currentPosition.inMilliseconds / widget.totalDuration.inMilliseconds
        : 0.0;

    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Progress bar (3px height - TikTok exact)
          SizedBox(
            height: 3,
            child: Stack(
              children: [
                // Background (full timeline)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(1.5),
                  ),
                ),
                
                // Recorded/trimmed area (gradient)
                FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary,
                          AppColors.primaryDark,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.5),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                ),

                // Current position indicator (white line)
                Positioned(
                  left: screenWidth * progress.clamp(0.0, 1.0),
                  top: -6,
                  bottom: -6,
                  child: Container(
                    width: 2,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 6),

          // Thumbnail strip (32px height)
          SizedBox(
            height: 32,
            child: widget.thumbnails.isNotEmpty
                ? Row(
                    children: widget.thumbnails
                        .take(10) // Show max 10 thumbnails
                        .map((thumbnail) => Padding(
                              padding: const EdgeInsets.only(right: 2),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: Image.memory(
                                  thumbnail,
                                  width: 32,
                                  height: 32,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ))
                        .toList(),
                  )
                : Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

