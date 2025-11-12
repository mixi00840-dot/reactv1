import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../../core/theme/app_colors.dart';

/// TikTok-style text editor overlay
/// Bottom sheet that keeps video visible above with quick editing controls
class TextEditorOverlay extends StatefulWidget {
  final Function(String text, Color color, double fontSize, FontWeight weight) onDone;
  final VoidCallback? onCancel;
  final String initialText;
  final Color initialColor;
  final double initialFontSize;
  final FontWeight initialWeight;

  const TextEditorOverlay({
    super.key,
    required this.onDone,
    this.onCancel,
    this.initialText = '',
    this.initialColor = Colors.white,
    this.initialFontSize = 24.0,
    this.initialWeight = FontWeight.normal,
  });

  @override
  State<TextEditorOverlay> createState() => _TextEditorOverlayState();
}

class _TextEditorOverlayState extends State<TextEditorOverlay> {
  late TextEditingController _textController;
  late Color _selectedColor;
  late double _fontSize;
  late FontWeight _fontWeight;

  final List<Color> _colors = [
    Colors.white,
    Colors.black,
    const Color(0xFFFE2C55), // TikTok pink
    const Color(0xFF25F4EE), // TikTok cyan
    Colors.red,
    Colors.orange,
    Colors.yellow,
    Colors.green,
    Colors.blue,
    Colors.purple,
    Colors.pink,
  ];

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.initialText);
    _selectedColor = widget.initialColor;
    _fontSize = widget.initialFontSize;
    _fontWeight = widget.initialWeight;
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onDone() {
    if (_textController.text.trim().isEmpty) {
      widget.onCancel?.call();
      return;
    }
    
    widget.onDone(
      _textController.text,
      _selectedColor,
      _fontSize,
      _fontWeight,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.95),
            Colors.black.withValues(alpha: 0.7),
            Colors.transparent,
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 16),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Quick tools row (Aa, Bold, Color, Align)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Font size toggle
                _QuickToolButton(
                  icon: Icons.format_size,
                  label: _fontSize > 30 ? 'Large' : 'Normal',
                  isActive: _fontSize > 30,
                  onTap: () {
                    setState(() {
                      _fontSize = _fontSize > 30 ? 24.0 : 36.0;
                    });
                  },
                ),

                // Bold toggle
                _QuickToolButton(
                  icon: Icons.format_bold,
                  label: 'Bold',
                  isActive: _fontWeight == FontWeight.bold,
                  onTap: () {
                    setState(() {
                      _fontWeight = _fontWeight == FontWeight.bold
                          ? FontWeight.normal
                          : FontWeight.bold;
                    });
                  },
                ),

                // Color indicator
                GestureDetector(
                  onTap: () {
                    // Cycle through colors
                    final currentIndex = _colors.indexOf(_selectedColor);
                    final nextIndex = (currentIndex + 1) % _colors.length;
                    setState(() {
                      _selectedColor = _colors[nextIndex];
                    });
                    HapticFeedback.selectionClick();
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: _selectedColor,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: _selectedColor.withValues(alpha: 0.5),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Color',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Color palette (horizontal scroll)
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _colors.length,
              itemBuilder: (context, index) {
                final color = _colors[index];
                final isSelected = color == _selectedColor;

                return GestureDetector(
                  onTap: () {
                    setState(() => _selectedColor = color);
                    HapticFeedback.selectionClick();
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.3),
                        width: isSelected ? 3 : 2,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.5),
                                blurRadius: 12,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 20,
                          )
                        : null,
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // Text input field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _textController,
              autofocus: true,
              maxLines: 3,
              minLines: 1,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: _fontWeight,
              ),
              decoration: InputDecoration(
                hintText: 'Type something...',
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 18,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Action buttons (Cancel / Done)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Cancel button
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onCancel,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Done button
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _onDone,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      elevation: 4,
                    ),
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
        ],
      ),
    );
  }
}

/// Quick tool button for text editor
class _QuickToolButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _QuickToolButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isActive
                  ? AppColors.primary.withValues(alpha: 0.3)
                  : Colors.white.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(
                color: isActive ? AppColors.primary : Colors.white.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
            child: Icon(
              icon,
              color: isActive ? AppColors.primary : Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isActive
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.7),
              fontSize: 11,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

