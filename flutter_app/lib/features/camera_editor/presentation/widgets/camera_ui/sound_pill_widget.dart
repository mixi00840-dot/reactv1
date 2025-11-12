import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';

/// Floating sound pill widget that shows the selected sound name
/// Positioned below the top bar, centered horizontally
class SoundPillWidget extends StatefulWidget {
  final String soundName;
  final String? artistName;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  const SoundPillWidget({
    super.key,
    required this.soundName,
    this.artistName,
    this.onTap,
    this.onRemove,
  });

  @override
  State<SoundPillWidget> createState() => _SoundPillWidgetState();
}

class _SoundPillWidgetState extends State<SoundPillWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _rotationController;

  @override
  void initState() {
    super.initState();
    // Slow rotation for music disc icon (8 seconds per rotation)
    _rotationController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 240),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(20),
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
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Rotating music icon
            RotationTransition(
              turns: _rotationController,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Colors.pink.withValues(alpha: 0.8),
                      Colors.purple.withValues(alpha: 0.8),
                    ],
                  ),
                ),
                child: const Center(
                  child: Icon(
                    Iconsax.musicnote,
                    color: Colors.white,
                    size: 14,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Sound name (with marquee if too long)
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.soundName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      shadows: [
                        Shadow(
                          color: Colors.black45,
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                  if (widget.artistName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      widget.artistName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 11,
                        shadows: const [
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

            // Remove button (X)
            if (widget.onRemove != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: widget.onRemove,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  child: Icon(
                    Icons.close,
                    color: Colors.white.withValues(alpha: 0.8),
                    size: 16,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

