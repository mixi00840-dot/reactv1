import 'package:flutter/material.dart';
import '../../../models/camera_mode.dart';
import '../../../../../core/theme/app_colors.dart';

/// Main record button for TikTok-style camera interface
/// Supports 5 states with exact TikTok animations:
/// 1. Video Ready - Blue gradient circle (66px)
/// 2. Photo Ready - White circle (66px)
/// 3. Live Ready - Red gradient circle (66px)
/// 4. Recording - Red square with rounded corners (28x28px)
/// 5. Processing - Spinner
class MainRecordButton extends StatefulWidget {
  final CameraMode mode;
  final VoidCallback? onTap;
  final VoidCallback? onLongPressStart;
  final VoidCallback? onLongPressEnd;
  final bool isRecording;
  final bool isProcessing;

  const MainRecordButton({
    super.key,
    required this.mode,
    this.onTap,
    this.onLongPressStart,
    this.onLongPressEnd,
    this.isRecording = false,
    this.isProcessing = false,
  });

  @override
  State<MainRecordButton> createState() => _MainRecordButtonState();
}

class _MainRecordButtonState extends State<MainRecordButton>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _pressController;
  late AnimationController _morphController;
  
  late Animation<double> _pulseAnimation;
  late Animation<double> _pressAnimation;
  late Animation<double> _morphAnimation;

  @override
  void initState() {
    super.initState();

    // Pulse animation for recording state (1.0 → 1.1 → 1.0, 1.2s)
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ),
    );

    // Press feedback animation (1.0 → 0.92, 100ms)
    _pressController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _pressAnimation = Tween<double>(
      begin: 1.0,
      end: 0.92,
    ).animate(
      CurvedAnimation(
        parent: _pressController,
        curve: Curves.easeOut,
      ),
    );

    // Shape morph animation (circle → square, 200ms)
    _morphController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _morphAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _morphController,
        curve: Curves.easeInOut,
      ),
    );

    // Start animations based on initial state
    if (widget.isRecording) {
      _pulseController.repeat(reverse: true);
      _morphController.forward();
    }
  }

  @override
  void didUpdateWidget(MainRecordButton oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Handle recording state changes
    if (widget.isRecording != oldWidget.isRecording) {
      if (widget.isRecording) {
        _pulseController.repeat(reverse: true);
        _morphController.forward();
      } else {
        _pulseController.stop();
        _pulseController.reset();
        _morphController.reverse();
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _pressController.dispose();
    _morphController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (!widget.isProcessing) {
      _pressController.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    _pressController.reverse();
  }

  void _handleTapCancel() {
    _pressController.reverse();
  }

  Color _getInnerColor() {
    if (widget.isRecording) {
      return const Color(0xFFFF0000); // Bright red when recording
    }
    
    switch (widget.mode) {
      case CameraMode.live:
        return const Color(0xFFFF0000); // Red for live
      case CameraMode.photo:
        return Colors.white; // White for photo
      case CameraMode.video15s:
      case CameraMode.video60s:
      case CameraMode.video10m:
        return AppColors.primary; // Blue for video modes
    }
  }

  List<BoxShadow> _getGlowShadows() {
    final color = _getInnerColor();
    final isRecording = widget.isRecording;
    
    return [
      BoxShadow(
        color: color.withValues(alpha: isRecording ? 0.6 : 0.3),
        blurRadius: isRecording ? 24 : 12,
        spreadRadius: isRecording ? 2 : 0,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isProcessing ? null : widget.onTap,
      onLongPressStart:
          widget.isProcessing ? null : (_) => widget.onLongPressStart?.call(),
      onLongPressEnd:
          widget.isProcessing ? null : (_) => widget.onLongPressEnd?.call(),
      child: AnimatedBuilder(
        animation: Listenable.merge([_pressAnimation, _pulseAnimation]),
        builder: (context, child) {
          // Calculate combined scale
          final pressScale = _pressAnimation.value;
          final pulseScale = widget.isRecording ? _pulseAnimation.value : 1.0;
          final combinedScale = pressScale * pulseScale;

          return Transform.scale(
            scale: combinedScale,
            child: Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white,
                  width: 4,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: widget.isProcessing
                    ? _buildProcessingState()
                    : _buildInnerButton(),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProcessingState() {
    return const SizedBox(
      width: 40,
      height: 40,
      child: CircularProgressIndicator(
        color: Colors.white,
        strokeWidth: 3,
      ),
    );
  }

  Widget _buildInnerButton() {
    return AnimatedBuilder(
      animation: _morphAnimation,
      builder: (context, child) {
        final morphValue = _morphAnimation.value;
        final innerColor = _getInnerColor();
        
        // Calculate dimensions
        // Circle: 66px, Square: 28px
        final circleSize = 66.0;
        final squareSize = 28.0;
        final size = circleSize - (morphValue * (circleSize - squareSize));
        
        // Calculate border radius
        // Circle: 33px (half of 66), Square: 6px
        final circleBorderRadius = circleSize / 2;
        final squareBorderRadius = 6.0;
        final borderRadius =
            circleBorderRadius - (morphValue * (circleBorderRadius - squareBorderRadius));

        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            color: innerColor,
            boxShadow: _getGlowShadows(),
          ),
        );
      },
    );
  }
}
