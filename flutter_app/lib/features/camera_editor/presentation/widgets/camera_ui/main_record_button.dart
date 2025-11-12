import 'package:flutter/material.dart';

/// Main record button for TikTok-style camera interface
/// Supports normal, recording, and paused states with animations
class MainRecordButton extends StatefulWidget {
  final VoidCallback? onTap;
  final VoidCallback? onLongPressStart;
  final VoidCallback? onLongPressEnd;
  final bool isRecording;
  final bool isPaused;
  final bool isProcessing;

  const MainRecordButton({
    super.key,
    this.onTap,
    this.onLongPressStart,
    this.onLongPressEnd,
    this.isRecording = false,
    this.isPaused = false,
    this.isProcessing = false,
  });

  @override
  State<MainRecordButton> createState() => _MainRecordButtonState();
}

class _MainRecordButtonState extends State<MainRecordButton>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _scaleController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    // Pulse animation for recording state
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Scale animation for press feedback
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );

    if (widget.isRecording && !widget.isPaused) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(MainRecordButton oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.isRecording && !widget.isPaused && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if ((!widget.isRecording || widget.isPaused) && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _scaleController.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _scaleController.reverse();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isProcessing ? null : widget.onTap,
      onLongPressStart: widget.isProcessing ? null : (_) => widget.onLongPressStart?.call(),
      onLongPressEnd: widget.isProcessing ? null : (_) => widget.onLongPressEnd?.call(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: widget.isRecording && !widget.isPaused
                  ? _pulseAnimation.value
                  : 1.0,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.isRecording
                      ? (widget.isPaused ? Colors.white : Colors.red)
                      : Colors.white,
                  border: Border.all(
                    color: Colors.white,
                    width: widget.isRecording ? 0 : 4,
                  ),
                    boxShadow: [
                    BoxShadow(
                      color: widget.isRecording
                          ? Colors.red.withValues(alpha: 0.4)
                          : Colors.black.withValues(alpha: 0.3),
                      blurRadius: widget.isRecording ? 20 : 12,
                      spreadRadius: widget.isRecording ? 4 : 2,
                    ),
                  ],
                ),
                child: Center(
                  child: widget.isProcessing
                      ? const SizedBox(
                          width: 30,
                          height: 30,
                          child: CircularProgressIndicator(
                            color: Colors.red,
                            strokeWidth: 3,
                          ),
                        )
                      : AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: widget.isRecording ? 32 : 0,
                          height: widget.isRecording ? 32 : 0,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              widget.isPaused ? 0 : 4,
                            ),
                            color: widget.isRecording
                                ? (widget.isPaused
                                    ? Colors.red
                                    : Colors.white)
                                : Colors.transparent,
                          ),
                          child: widget.isPaused
                              ? const Icon(
                                  Icons.play_arrow,
                                  color: Colors.white,
                                  size: 24,
                                )
                              : null,
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
