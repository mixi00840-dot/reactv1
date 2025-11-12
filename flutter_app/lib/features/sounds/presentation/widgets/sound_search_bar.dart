import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/theme/app_colors.dart';

/// TikTok-style search bar for sounds
class SoundSearchBar extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onSearch;
  final VoidCallback? onClear;

  const SoundSearchBar({
    super.key,
    required this.controller,
    required this.onSearch,
    this.onClear,
  });

  @override
  State<SoundSearchBar> createState() => _SoundSearchBarState();
}

class _SoundSearchBarState extends State<SoundSearchBar> {
  bool _hasFocus = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: _hasFocus
              ? AppColors.primary.withValues(alpha: 0.5)
              : AppColors.border,
          width: 1,
        ),
      ),
      child: TextField(
        controller: widget.controller,
        onChanged: widget.onSearch,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
        ),
        decoration: InputDecoration(
          hintText: 'Search sounds...',
          hintStyle: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 15,
          ),
          prefixIcon: Icon(
            Iconsax.search_normal_1,
            color: _hasFocus ? AppColors.primary : AppColors.textSecondary,
            size: 20,
          ),
          suffixIcon: widget.controller.text.isNotEmpty
              ? IconButton(
                  icon: Icon(
                    Icons.close,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                  onPressed: () {
                    widget.controller.clear();
                    widget.onClear?.call();
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
        onTap: () => setState(() => _hasFocus = true),
        onTapOutside: (_) => setState(() => _hasFocus = false),
      ),
    );
  }
}

