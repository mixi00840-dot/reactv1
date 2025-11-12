import 'package:flutter/material.dart';

/// Circular icon button used in TikTok-style camera interface
/// Provides consistent styling for side bar and action buttons
class CircularIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  final double size;
  final Color? backgroundColor;
  final Color? iconColor;
  final String? label;
  final bool isActive;
  final Widget? badge;

  const CircularIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.size = 48.0,
    this.backgroundColor,
    this.iconColor,
    this.label,
    this.isActive = false,
    this.badge,
  });

  @override
  State<CircularIconButton> createState() => _CircularIconButtonState();
}

class _CircularIconButtonState extends State<CircularIconButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
        color: widget.isActive
          ? (widget.backgroundColor ?? Colors.white.withValues(alpha: 0.3))
          : (widget.backgroundColor ?? Colors.black.withValues(alpha: 0.3)),
                border: widget.isActive
                    ? Border.all(color: Colors.white, width: 2)
                    : null,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    widget.icon,
                    color: widget.iconColor ?? Colors.white,
                    size: widget.size * 0.5,
                  ),
                  if (widget.badge != null)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: widget.badge!,
                    ),
                ],
              ),
            ),
            if (widget.label != null) ...[
              const SizedBox(height: 4),
              Text(
                widget.label!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  shadows: [
                    Shadow(
                      color: Colors.black45,
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
