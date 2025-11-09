import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Filter selector with preview thumbnails
class FilterSelector extends StatelessWidget {
  final List<String> filters;
  final String? selectedFilter;
  final Function(String?) onFilterSelected;

  const FilterSelector({
    Key? key,
    required this.filters,
    required this.selectedFilter,
    required this.onFilterSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = filter == selectedFilter;
          
          return GestureDetector(
            onTap: () => onFilterSelected(filter == 'None' ? null : filter),
            child: Container(
              width: 80,
              margin: const EdgeInsets.only(right: AppSpacing.md),
              child: Column(
                children: [
                  // Filter preview (placeholder with color)
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: _getFilterPreviewColor(filter),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        width: 3,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Icon(
                        Icons.filter_vintage,
                        color: Colors.white.withOpacity(0.5),
                        size: 24,
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.xs),
                  
                  // Filter name
                  Text(
                    filter,
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppColors.darkTextSecondary,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getFilterPreviewColor(String filter) {
    switch (filter) {
      case 'None':
        return Colors.grey.shade800;
      case 'Vintage':
        return const Color(0xFFD4A574);
      case 'B&W':
        return Colors.grey.shade600;
      case 'Sepia':
        return const Color(0xFF704214);
      case 'Vivid':
        return const Color(0xFFFF6B9D);
      case 'Cool':
        return const Color(0xFF4A90E2);
      case 'Warm':
        return const Color(0xFFFF8C42);
      default:
        return Colors.grey.shade700;
    }
  }
}
