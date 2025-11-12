import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../../core/theme/app_colors.dart';

/// TikTok-style sticker selector overlay
/// Bottom sheet with categories and sticker grid (video visible above)
class StickerSelectorOverlay extends StatefulWidget {
  final Function(String stickerId) onStickerSelected;
  final VoidCallback? onClose;

  const StickerSelectorOverlay({
    super.key,
    required this.onStickerSelected,
    this.onClose,
  });

  @override
  State<StickerSelectorOverlay> createState() => _StickerSelectorOverlayState();
}

class _StickerSelectorOverlayState extends State<StickerSelectorOverlay> {
  String _selectedCategory = 'Emoji';

  final Map<String, List<String>> _stickerCategories = {
    'Emoji': ['😀', '😂', '😍', '😎', '🤔', '😭', '🥰', '😜', '🤩', '😇', '🙃', '😱', '🔥', '💯', '✨', '⭐'],
    'Hearts': ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💞', '💟', '❣️', '💔', '🧡', '💛', '💚', '💙', '💜'],
    'Shapes': ['⭐', '✨', '💫', '🌟', '⚡', '🔥', '💥', '✅', '❌', '⭕', '🔺', '🔻', '🔶', '🔷', '🔸', '🔹'],
    'Celebrations': ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🥳', '🎆', '🎇', '✨', '🎄', '🎃', '👻', '🎭', '🎪'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
    'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥖', '🥨', '🧀'],
    'Arrows': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔄', '🔃'],
    'Travel': ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🚲'],
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.5,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.95),
            Colors.black.withValues(alpha: 0.75),
            Colors.transparent,
          ],
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Category tabs (horizontal scroll)
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _stickerCategories.keys.length,
              itemBuilder: (context, index) {
                final category = _stickerCategories.keys.elementAt(index);
                final isSelected = category == _selectedCategory;

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedCategory = category);
                      HapticFeedback.selectionClick();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary
                            : Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : Colors.white.withValues(alpha: 0.2),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 12),

          // Sticker grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1,
              ),
              itemCount: _stickerCategories[_selectedCategory]?.length ?? 0,
              itemBuilder: (context, index) {
                final sticker = _stickerCategories[_selectedCategory]![index];

                return GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    widget.onStickerSelected(sticker);
                    widget.onClose?.call();
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1),
                        width: 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        sticker,
                        style: const TextStyle(fontSize: 32),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }
}

