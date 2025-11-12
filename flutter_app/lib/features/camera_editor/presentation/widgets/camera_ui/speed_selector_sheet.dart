import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../../core/theme/app_colors.dart';

/// TikTok-style speed selector modal
/// Shows speed options: 0.3x, 0.5x, 1x, 2x, 3x
class SpeedSelectorSheet extends StatefulWidget {
  final double currentSpeed;
  final Function(double) onSpeedSelected;

  const SpeedSelectorSheet({
    super.key,
    required this.currentSpeed,
    required this.onSpeedSelected,
  });

  /// Show the speed selector as a bottom sheet
  static Future<double?> show(
    BuildContext context,
    double currentSpeed,
  ) {
    return showModalBottomSheet<double>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: false,
      builder: (context) => SpeedSelectorSheet(
        currentSpeed: currentSpeed,
        onSpeedSelected: (speed) {
          Navigator.of(context).pop(speed);
        },
      ),
    );
  }

  @override
  State<SpeedSelectorSheet> createState() => _SpeedSelectorSheetState();
}

class _SpeedSelectorSheetState extends State<SpeedSelectorSheet> {
  late double _selectedSpeed;

  final List<double> _speeds = [0.3, 0.5, 1.0, 2.0, 3.0];

  @override
  void initState() {
    super.initState();
    _selectedSpeed = widget.currentSpeed;
  }

  String _getSpeedLabel(double speed) {
    if (speed == 1.0) {
      return 'Normal';
    } else if (speed < 1.0) {
      return '${speed}x (Slow)';
    } else {
      return '${speed.toInt()}x (Fast)';
    }
  }

  String _getSpeedDescription(double speed) {
    if (speed == 1.0) {
      return 'Standard speed';
    } else if (speed == 0.3) {
      return 'Very slow motion';
    } else if (speed == 0.5) {
      return 'Slow motion';
    } else if (speed == 2.0) {
      return 'Fast motion';
    } else {
      return 'Very fast motion';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Speed',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(
            color: Color(0xFF2A2A2A),
            height: 1,
          ),

          // Speed options
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _speeds.length,
            itemBuilder: (context, index) {
              final speed = _speeds[index];
              final isSelected = speed == _selectedSpeed;

              return _SpeedOption(
                speed: speed,
                label: _getSpeedLabel(speed),
                description: _getSpeedDescription(speed),
                isSelected: isSelected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedSpeed = speed);
                  widget.onSpeedSelected(speed);
                },
              );
            },
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
        ],
      ),
    );
  }
}

class _SpeedOption extends StatelessWidget {
  final double speed;
  final String label;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const _SpeedOption({
    required this.speed,
    required this.label,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.15)
              : Colors.transparent,
          border: isSelected
              ? Border(
                  left: BorderSide(
                    color: AppColors.primary,
                    width: 3,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            // Speed icon/indicator
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.1),
                border: Border.all(
                  color: isSelected
                      ? AppColors.primary
                      : Colors.white.withValues(alpha: 0.3),
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  speed == 1.0 ? '1x' : '${speed}x',
                  style: TextStyle(
                    color: isSelected ? AppColors.primary : Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 16),

            // Label and description
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.9),
                      fontSize: 16,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),

            // Checkmark
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: 24,
              ),
          ],
        ),
      ),
    );
  }
}

