import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/camera_provider.dart';
import '../models/ar_filter_model.dart';

/// Filter Panel - TikTok-style filter selector
class FilterPanel extends StatefulWidget {
  final Function(ARFilterModel?) onFilterSelected;
  final VoidCallback onClose;

  const FilterPanel({
    super.key,
    required this.onFilterSelected,
    required this.onClose,
  });

  @override
  State<FilterPanel> createState() => _FilterPanelState();
}

class _FilterPanelState extends State<FilterPanel> {
  FilterCategory? _selectedCategory;
  FilterType? _selectedType;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFilters();
    });
  }

  Future<void> _loadFilters() async {
    final provider = context.read<CameraProvider>();
    await provider.loadFilters(
      category: _selectedCategory,
      type: _selectedType,
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CameraProvider>();
    final selectedFilter = provider.selectedFilter;

    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusXl),
          topRight: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: AppSpacing.screenPadding(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filters',
                  style: AppTypography.headlineSmall(context).copyWith(
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),

          // Category Tabs
          _buildCategoryTabs(provider),

          // Filter List
          Expanded(
            child: provider.isLoadingFilters
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _buildFilterList(provider, selectedFilter),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(CameraProvider provider) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildCategoryTab('All', null, provider),
          const SizedBox(width: 8),
          _buildCategoryTab('Trending', FilterCategory.fun, provider),
          const SizedBox(width: 8),
          _buildCategoryTab('Beauty', FilterCategory.beauty, provider),
          const SizedBox(width: 8),
          _buildCategoryTab('AR', FilterType.ar, provider),
          const SizedBox(width: 8),
          _buildCategoryTab('Effects', FilterType.effect, provider),
        ],
      ),
    );
  }

  Widget _buildCategoryTab(String label, dynamic categoryOrType, CameraProvider provider) {
    final isSelected = _selectedCategory == categoryOrType || _selectedType == categoryOrType;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          if (categoryOrType is FilterCategory) {
            _selectedCategory = categoryOrType;
            _selectedType = null;
          } else if (categoryOrType is FilterType) {
            _selectedType = categoryOrType;
            _selectedCategory = null;
          } else {
            _selectedCategory = null;
            _selectedType = null;
          }
        });
        provider.selectCategory(_selectedCategory);
        _loadFilters();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
        ),
        child: Text(
          label,
          style: AppTypography.labelMedium(context).copyWith(
            color: isSelected ? Colors.white : Colors.white70,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterList(CameraProvider provider, ARFilterModel? selectedFilter) {
    final filters = provider.filters.isEmpty
        ? (provider.trendingFilters.isNotEmpty
            ? provider.trendingFilters
            : provider.featuredFilters)
        : provider.filters;

    if (filters.isEmpty) {
      return Center(
        child: Text(
          'No filters available',
          style: AppTypography.bodyMedium(context).copyWith(
            color: Colors.white70,
          ),
        ),
      );
    }

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: filters.length + 1, // +1 for "None" option
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildFilterItem(
            null,
            'None',
            null,
            selectedFilter == null,
            provider,
          );
        }

        final filter = filters[index - 1];
        return _buildFilterItem(
          filter,
          filter.displayName,
          filter.icon,
          selectedFilter?.id == filter.id,
          provider,
        );
      },
    );
  }

  Widget _buildFilterItem(
    ARFilterModel? filter,
    String name,
    String? iconUrl,
    bool isSelected,
    CameraProvider provider,
  ) {
    return GestureDetector(
      onTap: () {
        provider.selectFilter(filter);
        widget.onFilterSelected(filter);
      },
      child: Container(
        width: 80,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            // Filter Preview
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.3),
                  width: isSelected ? 3 : 1,
                ),
                color: Colors.white.withOpacity(0.1),
              ),
              child: ClipOval(
                child: iconUrl != null && iconUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: iconUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.filter_vintage,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(
                        Icons.filter_vintage,
                        color: Colors.white,
                        size: 32,
                      ),
              ),
            ),
            const SizedBox(height: 6),
            // Filter Name
            Text(
              name,
              style: AppTypography.labelSmall(context).copyWith(
                color: isSelected ? AppColors.primary : Colors.white70,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            // Premium Badge
            if (filter?.isPremium == true)
              Container(
                margin: const EdgeInsets.only(top: 2),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'PRO',
                  style: AppTypography.labelSmall(context).copyWith(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

