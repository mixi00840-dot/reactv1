import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../models/camera_mode.dart';

/// TikTok-style mode selector with horizontal tabs
/// Shows: Live | 15s | 60s | 10m | Photo
class ModeSelectorWidget extends StatefulWidget {
  final CameraMode selectedMode;
  final Function(CameraMode) onModeChanged;
  final bool isRecording;

  const ModeSelectorWidget({
    super.key,
    required this.selectedMode,
    required this.onModeChanged,
    this.isRecording = false,
  });

  @override
  State<ModeSelectorWidget> createState() => _ModeSelectorWidgetState();
}

class _ModeSelectorWidgetState extends State<ModeSelectorWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _indicatorController;

  @override
  void initState() {
    super.initState();
    _indicatorController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _indicatorController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(ModeSelectorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedMode != widget.selectedMode) {
      _indicatorController.forward(from: 0.0);
    }
  }

  void _handleModeChange(CameraMode mode) {
    if (widget.isRecording) {
      // Cannot change mode while recording
      HapticFeedback.heavyImpact();
      return;
    }

    if (mode != widget.selectedMode) {
      HapticFeedback.mediumImpact();
      widget.onModeChanged(mode);
    }
  }

  @override
  Widget build(BuildContext context) {
    final modes = [
      CameraMode.live,
      CameraMode.video15s,
      CameraMode.video60s,
      CameraMode.video10m,
      CameraMode.photo,
    ];

    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 24),  // Reduced from 16 for centering
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.6),
            Colors.transparent,
          ],
        ),
      ),
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,  // Center the modes
          mainAxisAlignment: MainAxisAlignment.center,
          children: modes.asMap().entries.map((entry) {
            final index = entry.key;
            final mode = entry.value;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildModeTab(mode),
                if (index < modes.length - 1)
                  const SizedBox(width: 32),  // Reduced from implicit 60px for tighter spacing
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildModeTab(CameraMode mode) {
    final isSelected = mode == widget.selectedMode;
    final isDisabled = widget.isRecording && !isSelected;

    return GestureDetector(
      onTap: () => _handleModeChange(mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),  // Added padding for tap area
        color: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Mode label
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                color: isDisabled
                    ? Colors.white.withValues(alpha: 0.3)
                    : isSelected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.6),
                fontSize: isSelected ? 16 : 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                letterSpacing: 0.5,
                shadows: isSelected
                    ? [
                        const Shadow(
                          color: Colors.black45,
                          blurRadius: 4,
                        ),
                      ]
                    : [],
              ),
              child: Text(
                mode.displayName,
              ),
            ),

            const SizedBox(height: 8),

            // Selection indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              width: isSelected ? 30 : 0,
              height: 3,
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(1.5),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: Colors.white.withValues(alpha: 0.5),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ]
                    : [],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

