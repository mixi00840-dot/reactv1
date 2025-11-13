import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Product variants selector for sizes and colors
/// Supports text-based options (sizes) and color-based options (colors)
class ProductVariantsSelector extends StatelessWidget {
  final String label;
  final List<String> options;
  final List<String>? colorOptions; // Hex color codes for color selector
  final String? selectedOption;
  final Function(String) onOptionSelected;
  final bool isColorSelector;

  const ProductVariantsSelector({
    Key? key,
    required this.label,
    required this.options,
    this.colorOptions,
    this.selectedOption,
    required this.onOptionSelected,
    this.isColorSelector = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label with Selected Value
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            if (selectedOption != null)
              Text(
                selectedOption!,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
          ],
        ),
        
        const SizedBox(height: ShopConstants.defaultPadding),
        
        // Options
        Wrap(
          spacing: ShopConstants.defaultPaddingSmall,
          runSpacing: ShopConstants.defaultPaddingSmall,
          children: List.generate(
            options.length,
            (index) {
              final option = options[index];
              final isSelected = option == selectedOption;
              
              if (isColorSelector && colorOptions != null) {
                return _buildColorOption(
                  option,
                  colorOptions![index],
                  isSelected,
                );
              } else {
                return _buildTextOption(option, isSelected);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTextOption(String option, bool isSelected) {
    return GestureDetector(
      onTap: () => onOptionSelected(option),
      child: AnimatedContainer(
        duration: ShopConstants.animationDurationShort,
        padding: const EdgeInsets.symmetric(
          horizontal: ShopConstants.defaultPadding,
          vertical: ShopConstants.defaultPaddingSmall,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(
            ShopConstants.defaultBorderRadiusSmall,
          ),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Text(
          option,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildColorOption(String name, String hexColor, bool isSelected) {
    final color = _parseHexColor(hexColor);
    
    return GestureDetector(
      onTap: () => onOptionSelected(name),
      child: AnimatedContainer(
        duration: ShopConstants.animationDurationShort,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 3 : 1,
          ),
        ),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: isSelected
              ? Center(
                  child: Icon(
                    Icons.check,
                    size: 20,
                    color: _isLightColor(color) ? Colors.black : Colors.white,
                  ),
                )
              : null,
        ),
      ),
    );
  }

  Color _parseHexColor(String hexColor) {
    final hex = hexColor.replaceAll('#', '');
    return Color(int.parse('FF$hex', radix: 16));
  }

  bool _isLightColor(Color color) {
    // Calculate luminance to determine if color is light or dark
    final luminance = (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) / 255;
    return luminance > 0.5;
  }
}
