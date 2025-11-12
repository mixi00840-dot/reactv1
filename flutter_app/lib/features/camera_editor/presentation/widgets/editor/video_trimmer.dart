import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/video_editor_provider.dart';

/// Video trimmer with draggable handles and thumbnail timeline
class VideoTrimmer extends ConsumerStatefulWidget {
  final Duration totalDuration;
  final Function(Duration start, Duration end)? onTrimChanged;
  final List<Uint8List>? thumbnails; // Optional timeline thumbnails

  const VideoTrimmer({
    super.key,
    required this.totalDuration,
    this.onTrimChanged,
    this.thumbnails,
  });

  @override
  ConsumerState<VideoTrimmer> createState() => _VideoTrimmerState();
}

class _VideoTrimmerState extends ConsumerState<VideoTrimmer> {
  double _startPosition = 0.0;
  double _endPosition = 1.0;
  // ignore: unused_field
  bool _isDraggingStart = false;
  // ignore: unused_field
  bool _isDraggingEnd = false;

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(videoEditorProvider);
    if (project == null) return const SizedBox.shrink();

    return Container(
      height: 80,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          
          return Stack(
            children: [
              // Timeline background (thumbnails would go here)
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade800,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: _buildTimelineThumbnails(),
                ),
              ),

              // Trim overlay (darkens non-selected areas)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                child: CustomPaint(
                  painter: _TrimOverlayPainter(
                    startPosition: _startPosition,
                    endPosition: _endPosition,
                  ),
                ),
              ),

              // Start handle
              Positioned(
                left: _startPosition * width - 12,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  onPanStart: (_) => setState(() => _isDraggingStart = true),
                  onPanUpdate: (details) => _onDragStart(details, width),
                  onPanEnd: (_) {
                    setState(() => _isDraggingStart = false);
                    _notifyChange();
                  },
                  child: Container(
                    width: 24,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(8),
                        bottomLeft: Radius.circular(8),
                      ),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(
                      Icons.arrow_left,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),

              // End handle
              Positioned(
                left: _endPosition * width - 12,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  onPanStart: (_) => setState(() => _isDraggingEnd = true),
                  onPanUpdate: (details) => _onDragEnd(details, width),
                  onPanEnd: (_) {
                    setState(() => _isDraggingEnd = false);
                    _notifyChange();
                  },
                  child: Container(
                    width: 24,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(8),
                        bottomRight: Radius.circular(8),
                      ),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(
                      Icons.arrow_right,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),

              // Duration labels
              Positioned(
                left: _startPosition * width,
                bottom: -20,
                child: Text(
                  _formatDuration(_getDuration(_startPosition)),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Positioned(
                left: _endPosition * width - 40,
                bottom: -20,
                child: Text(
                  _formatDuration(_getDuration(_endPosition)),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTimelineThumbnails() {
    final thumbs = widget.thumbnails;
    if (thumbs == null || thumbs.isEmpty) {
      return Container(
        color: Colors.grey.shade700,
        child: const Center(
          child: Icon(
            Icons.video_library,
            color: Colors.white54,
            size: 32,
          ),
        ),
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final bytes in thumbs)
          Expanded(
            child: bytes.isNotEmpty
                ? Image.memory(
                    bytes,
                    fit: BoxFit.cover,
                  )
                : Container(color: Colors.grey.shade700),
          ),
      ],
    );
  }

  void _onDragStart(DragUpdateDetails details, double width) {
    setState(() {
      final delta = details.delta.dx / width;
      _startPosition = (_startPosition + delta).clamp(0.0, _endPosition - 0.05);
    });
  }

  void _onDragEnd(DragUpdateDetails details, double width) {
    setState(() {
      final delta = details.delta.dx / width;
      _endPosition = (_endPosition + delta).clamp(_startPosition + 0.05, 1.0);
    });
  }

  void _notifyChange() {
    final startDuration = _getDuration(_startPosition);
    final endDuration = _getDuration(_endPosition);
    
    widget.onTrimChanged?.call(startDuration, endDuration);
    ref.read(videoEditorProvider.notifier).setTrimRange(
      startDuration,
      endDuration,
    );
  }

  Duration _getDuration(double position) {
    final milliseconds = (widget.totalDuration.inMilliseconds * position).round();
    return Duration(milliseconds: milliseconds);
  }

  String _formatDuration(Duration duration) {
    final seconds = duration.inSeconds;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}

/// Custom painter for trim overlay
class _TrimOverlayPainter extends CustomPainter {
  final double startPosition;
  final double endPosition;

  _TrimOverlayPainter({
    required this.startPosition,
    required this.endPosition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;

    // Darken left side (before start)
    if (startPosition > 0) {
      canvas.drawRect(
        Rect.fromLTWH(0, 0, startPosition * size.width, size.height),
        paint,
      );
    }

    // Darken right side (after end)
    if (endPosition < 1.0) {
      canvas.drawRect(
        Rect.fromLTWH(
          endPosition * size.width,
          0,
          (1.0 - endPosition) * size.width,
          size.height,
        ),
        paint,
      );
    }

    // Draw selection border
    final selectionPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRect(
      Rect.fromLTWH(
        startPosition * size.width,
        0,
        (endPosition - startPosition) * size.width,
        size.height,
      ),
      selectionPaint,
    );
  }

  @override
  bool shouldRepaint(_TrimOverlayPainter oldDelegate) {
    return oldDelegate.startPosition != startPosition ||
        oldDelegate.endPosition != endPosition;
  }
}
