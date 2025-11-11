import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../models/camera_recording_state.dart';
import '../../../providers/camera_recording_provider.dart';

/// TikTok-style record button with tap/hold functionality
class RecordButton extends ConsumerStatefulWidget {
  final VoidCallback onTap;
  final VoidCallback onLongPressStart;
  final VoidCallback onLongPressEnd;
  final VoidCallback? onZoomStart;
  final Function(double)? onZoomUpdate;
  final VoidCallback? onZoomEnd;

  const RecordButton({
    super.key,
    required this.onTap,
    required this.onLongPressStart,
    required this.onLongPressEnd,
    this.onZoomStart,
    this.onZoomUpdate,
    this.onZoomEnd,
  });

  @override
  ConsumerState<RecordButton> createState() => _RecordButtonState();
}

class _RecordButtonState extends ConsumerState<RecordButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;
  double _startY = 0;
  bool _isZooming = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    setState(() => _isPressed = true);
  }

  void _onTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    widget.onTap();
  }

  void _onTapCancel() {
    setState(() => _isPressed = false);
  }

  void _onLongPressStart(LongPressStartDetails details) {
    setState(() {
      _isPressed = true;
      _startY = details.localPosition.dy;
    });
    _animationController.forward();
    widget.onLongPressStart();
  }

  void _onLongPressMoveUpdate(LongPressMoveUpdateDetails details) {
    // Zoom control: drag up/down while holding
    if (!_isZooming && (details.localPosition.dy - _startY).abs() > 20) {
      _isZooming = true;
      widget.onZoomStart?.call();
    }

    if (_isZooming) {
      final deltaY = _startY - details.localPosition.dy;
      final zoomDelta = deltaY / 200; // Sensitivity: 200px = 1x zoom change
      widget.onZoomUpdate?.call(zoomDelta);
    }
  }

  void _onLongPressEnd(LongPressEndDetails details) {
    setState(() {
      _isPressed = false;
      _isZooming = false;
    });
    _animationController.reverse();
    widget.onZoomEnd?.call();
    widget.onLongPressEnd();
  }

  @override
  Widget build(BuildContext context) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final isRecording = recordingState.state == RecordingState.recording;

    return GestureDetector(
      onTapDown: isRecording ? null : _onTapDown,
      onTapUp: isRecording ? null : _onTapUp,
      onTapCancel: _onTapCancel,
      onLongPressStart: _onLongPressStart,
      onLongPressMoveUpdate: _onLongPressMoveUpdate,
      onLongPressEnd: _onLongPressEnd,
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Transform.scale(
            scale: _isPressed ? 0.95 : _scaleAnimation.value,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white,
                  width: 6,
                ),
              ),
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: isRecording ? 32 : 64,
                  height: isRecording ? 32 : 64,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(isRecording ? 8 : 32),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
