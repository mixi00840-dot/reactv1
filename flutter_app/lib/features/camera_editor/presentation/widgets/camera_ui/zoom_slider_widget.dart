import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// TikTok-style VERTICAL zoom slider widget
/// Appears on the right side when user pinches to zoom
/// Shows current zoom level and fades out after inactivity
class ZoomSliderWidget extends StatefulWidget {
  final double currentZoom;
  final double minZoom;
  final double maxZoom;
  final ValueChanged<double> onZoomChanged;
  final bool isVisible;

  const ZoomSliderWidget({
    super.key,
    required this.currentZoom,
    this.minZoom = 1.0,
    this.maxZoom = 8.0,
    required this.onZoomChanged,
    this.isVisible = false,
  });

  @override
  State<ZoomSliderWidget> createState() => _ZoomSliderWidgetState();
}

class _ZoomSliderWidgetState extends State<ZoomSliderWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.isVisible) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(ZoomSliderWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isVisible && !oldWidget.isVisible) {
      _controller.forward();
    } else if (!widget.isVisible && oldWidget.isVisible) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _formatZoom(double zoom) {
    if (zoom == zoom.roundToDouble()) {
      return '${zoom.toInt()}x';
    }
    return '${zoom.toStringAsFixed(1)}x';
  }

  // Check if current zoom is on a tick mark (1x, 2x, 4x, 8x)
  bool _isOnTickMark(double zoom) {
    const tickMarks = [1.0, 2.0, 4.0, 8.0];
    return tickMarks.any((tick) => (zoom - tick).abs() < 0.1);
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        width: 60,
        height: 200,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Max zoom label (top)
            Text(
              _formatZoom(widget.maxZoom),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 11,
                fontWeight: FontWeight.w600,
                shadows: const [
                  Shadow(
                    color: Colors.black45,
                    blurRadius: 4,
                  ),
                ],
              ),
            ),

            // Vertical slider
            Expanded(
              child: RotatedBox(
                quarterTurns: 3, // Rotate 270 degrees to make vertical
                child: SliderTheme(
                  data: SliderThemeData(
                    trackHeight: 3,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 8,
                    ),
                    overlayShape: const RoundSliderOverlayShape(
                      overlayRadius: 14,
                    ),
                    activeTrackColor: Colors.white,
                    inactiveTrackColor: Colors.white.withValues(alpha: 0.3),
                    thumbColor: Colors.white,
                    overlayColor: Colors.white.withValues(alpha: 0.2),
                    tickMarkShape: const RoundSliderTickMarkShape(
                      tickMarkRadius: 2,
                    ),
                    activeTickMarkColor: Colors.white.withValues(alpha: 0.6),
                    inactiveTickMarkColor: Colors.white.withValues(alpha: 0.3),
                  ),
                  child: Slider(
                    value: widget.currentZoom.clamp(widget.minZoom, widget.maxZoom),
                    min: widget.minZoom,
                    max: widget.maxZoom,
                    divisions: 28, // Smooth granular control
                    onChanged: (value) {
                      // Haptic feedback on tick marks
                      if (_isOnTickMark(value)) {
                        HapticFeedback.selectionClick();
                      }
                      widget.onZoomChanged(value);
                    },
                  ),
                ),
              ),
            ),

            // Current zoom value (center, floating above slider)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                _formatZoom(widget.currentZoom),
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            // Min zoom label (bottom)
            Text(
              _formatZoom(widget.minZoom),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 11,
                fontWeight: FontWeight.w600,
                shadows: const [
                  Shadow(
                    color: Colors.black45,
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
