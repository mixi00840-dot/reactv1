import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';

/// TikTok-style horizontal scrollable toolbar for video editor
/// Contains: Adjust, Text, Stickers, Effects, Filters, Audio, etc.
class EditorBottomToolbar extends StatelessWidget {
  final String? selectedTool;
  final Function(String) onToolSelected;

  const EditorBottomToolbar({
    super.key,
    this.selectedTool,
    required this.onToolSelected,
  });

  @override
  Widget build(BuildContext context) {
    final tools = [
      _EditorTool(
        id: 'adjust',
        icon: Icons.content_cut,
        label: 'Adjust',
      ),
      _EditorTool(
        id: 'text',
        icon: Icons.text_fields,
        label: 'Text',
      ),
      _EditorTool(
        id: 'stickers',
        icon: Iconsax.emoji_happy,
        label: 'Stickers',
      ),
      _EditorTool(
        id: 'effects',
        icon: Iconsax.magic_star,
        label: 'Effects',
      ),
      _EditorTool(
        id: 'filters',
        icon: Iconsax.colorfilter,
        label: 'Filters',
      ),
      _EditorTool(
        id: 'audio',
        icon: Iconsax.musicnote,
        label: 'Audio',
      ),
      _EditorTool(
        id: 'speed',
        icon: Iconsax.speedometer,
        label: 'Speed',
      ),
      _EditorTool(
        id: 'captions',
        icon: Icons.closed_caption,
        label: 'Captions',
      ),
    ];

    return Container(
      height: 70,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: tools.length,
        itemBuilder: (context, index) {
          final tool = tools[index];
          final isSelected = selectedTool == tool.id;

          return _ToolButton(
            tool: tool,
            isSelected: isSelected,
            onTap: () {
              HapticFeedback.selectionClick();
              onToolSelected(tool.id);
            },
          );
        },
      ),
    );
  }
}

/// Tool data model
class _EditorTool {
  final String id;
  final IconData icon;
  final String label;

  const _EditorTool({
    required this.id,
    required this.icon,
    required this.label,
  });
}

/// Individual tool button
class _ToolButton extends StatefulWidget {
  final _EditorTool tool;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToolButton({
    required this.tool,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_ToolButton> createState() => _ToolButtonState();
}

class _ToolButtonState extends State<_ToolButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.90).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 70,
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Icon(
                widget.tool.icon,
                size: 28,
                color: widget.isSelected
                    ? Colors.white
                    : Colors.white.withValues(alpha: 0.6),
              ),
              
              const SizedBox(height: 6),
              
              // Label
              Text(
                widget.tool.label,
                style: TextStyle(
                  color: widget.isSelected
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.6),
                  fontSize: 11,
                  fontWeight: widget.isSelected ? FontWeight.w600 : FontWeight.w500,
                  shadows: const [
                    Shadow(
                      color: Colors.black45,
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 4),
              
              // Active indicator (pink underline)
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: widget.isSelected ? 30 : 0,
                height: 3,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(1.5),
                  boxShadow: widget.isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.5),
                            blurRadius: 6,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

