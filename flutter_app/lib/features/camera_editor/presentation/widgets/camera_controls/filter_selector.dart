import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';
import '../../../services/filter_service.dart';

/// Filter selector widget
class FilterSelector extends ConsumerWidget {
  const FilterSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final currentFilter = recordingState.selectedFilter;

    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (context) => Container(
            height: MediaQuery.of(context).size.height * 0.4,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.95),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Handle
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                
                // Title
                const Text(
                  'Filters',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),

                // Filter list
                Expanded(
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: FilterService.presets.length,
                    itemBuilder: (context, index) {
                      final filter = FilterService.presets[index];
                      final isSelected = filter.name == currentFilter ||
                          (filter.name == 'Normal' && currentFilter == null);

                      return GestureDetector(
                        onTap: () {
                          ref
                              .read(cameraRecordingProvider.notifier)
                              .setFilter(
                                  filter.name == 'Normal' ? null : filter.name);
                          Navigator.pop(context);
                        },
                        child: Container(
                          width: 100,
                          margin: const EdgeInsets.symmetric(horizontal: 8),
                          child: Column(
                            children: [
                              // Filter preview
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : Colors.white.withOpacity(0.3),
                                    width: isSelected ? 3 : 1,
                                  ),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: filter.colorFilter != null
                                      ? ColorFiltered(
                                          colorFilter: filter.colorFilter!,
                                          child: Container(
                                            decoration: const BoxDecoration(
                                              gradient: LinearGradient(
                                                colors: [
                                                  Colors.red,
                                                  Colors.orange,
                                                  Colors.yellow,
                                                  Colors.green,
                                                  Colors.blue,
                                                ],
                                              ),
                                            ),
                                          ),
                                        )
                                      : Container(
                                          decoration: const BoxDecoration(
                                            gradient: LinearGradient(
                                              colors: [
                                                Colors.red,
                                                Colors.orange,
                                                Colors.yellow,
                                                Colors.green,
                                                Colors.blue,
                                              ],
                                            ),
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              
                              // Filter name
                              Text(
                                filter.name,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: currentFilter != null
              ? AppColors.primary.withOpacity(0.3)
              : Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Iconsax.filter,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}
