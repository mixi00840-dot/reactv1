import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// TikTok-style caption input widget
/// Multi-line text field with character counter and hashtag/mention highlighting
class CaptionInputWidget extends StatelessWidget {
  final TextEditingController controller;
  final Function(String) onChanged;
  final int currentLength;
  final int maxLength;

  const CaptionInputWidget({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.currentLength,
    this.maxLength = 150,
  });

  @override
  Widget build(BuildContext context) {
    final isOverLimit = currentLength > maxLength;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Multi-line text input
        TextField(
          controller: controller,
          onChanged: onChanged,
          maxLines: 5,
          minLines: 3,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            height: 1.4,
          ),
          decoration: InputDecoration(
            hintText: 'Describe your video...\n\nUse #hashtags and @mentions',
            hintStyle: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 15,
              height: 1.4,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: AppColors.border,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: isOverLimit ? AppColors.error : AppColors.primary,
                width: 2,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: isOverLimit ? AppColors.error : AppColors.border,
                width: 1,
              ),
            ),
            filled: true,
            fillColor: AppColors.surface,
            contentPadding: const EdgeInsets.all(12),
          ),
        ),

        const SizedBox(height: 8),

        // Character counter
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Hashtag/mention hints
            if (currentLength > 0)
              Expanded(
                child: Text(
                  _getHints(),
                  style: TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 12,
                  ),
                ),
              ),

            // Character counter
            Text(
              '$currentLength/$maxLength',
              style: TextStyle(
                color: isOverLimit ? AppColors.error : AppColors.textTertiary,
                fontSize: 12,
                fontWeight: isOverLimit ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),

        // Warning if over limit
        if (isOverLimit)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Caption is too long. Please shorten it.',
              style: TextStyle(
                color: AppColors.error,
                fontSize: 12,
              ),
            ),
          ),
      ],
    );
  }

  String _getHints() {
    final text = controller.text;
    final hashtagCount = '#'.allMatches(text).length;
    final mentionCount = '@'.allMatches(text).length;

    if (hashtagCount > 0 || mentionCount > 0) {
      final parts = <String>[];
      if (hashtagCount > 0) parts.add('$hashtagCount hashtag${hashtagCount > 1 ? 's' : ''}');
      if (mentionCount > 0) parts.add('$mentionCount mention${mentionCount > 1 ? 's' : ''}');
      return parts.join(', ');
    }

    return 'Tip: Add #hashtags to increase visibility';
  }
}

