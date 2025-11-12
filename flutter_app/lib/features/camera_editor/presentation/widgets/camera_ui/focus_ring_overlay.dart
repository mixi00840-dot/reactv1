import 'package:flutter/material.dart';

/// Focus ring overlay that appears when user taps to focus
/// Shows animated ring that fades out after 1 second
class FocusRingOverlay extends StatefulWidget {
  final Offset? focusPoint;
  final VoidCallback? onFadeComplete;

  const FocusRingOverlay({
    super.key,
    this.focusPoint,
    this.onFadeComplete,
  });

  @override
  State<FocusRingOverlay> createState() => _FocusRingOverlayState();
}

class _FocusRingOverlayState extends State<FocusRingOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.2, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _opacityAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
      ),
    );

    if (widget.focusPoint != null) {
      _controller.forward().then((_) {
        if (mounted && widget.onFadeComplete != null) {
          widget.onFadeComplete!();
        }
      });
    }
  }

  @override
  void didUpdateWidget(FocusRingOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.focusPoint != oldWidget.focusPoint && widget.focusPoint != null) {
      _controller.reset();
      _controller.forward().then((_) {
        if (mounted && widget.onFadeComplete != null) {
          widget.onFadeComplete!();
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.focusPoint == null) {
      return const SizedBox.shrink();
    }

    return Positioned(
      left: widget.focusPoint!.dx - 40,
      top: widget.focusPoint!.dy - 40,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Opacity(
            opacity: _opacityAnimation.value,
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Center(
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                    ),
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
