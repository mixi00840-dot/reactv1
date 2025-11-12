import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/camera_recording_provider.dart';
import '../../../services/filter_service.dart';

/// FiltersSheet provides a staging surface for filter selection.
/// Users can preview multiple presets without committing them until Apply.
/// Cancel restores the previous filter selection.
class FiltersSheet extends ConsumerStatefulWidget {
  const FiltersSheet({super.key});

  @override
  ConsumerState<FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends ConsumerState<FiltersSheet> {
  String? _pendingFilter;
  String? _initialFilter;

  @override
  void initState() {
    super.initState();
    final current = ref.read(cameraRecordingProvider).selectedFilter;
    _initialFilter = current;
    _pendingFilter = current; // start with current value
  }

  void _apply() {
    ref.read(cameraRecordingProvider.notifier).setFilter(_pendingFilter);
    Navigator.of(context).pop(true); // indicate applied
  }

  void _cancel() {
    // Revert to initial (no-op if we never previewed live)
    ref.read(cameraRecordingProvider.notifier).setFilter(_initialFilter);
    Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Container(
      height: size.height * 0.45,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          // Title + actions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filters',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: _cancel,
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _apply,
                      child: const Text('Apply'),
                    ),
                  ],
                )
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Filters list
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: FilterService.presets.length,
              itemBuilder: (context, index) {
                final preset = FilterService.presets[index];
                final isSelected = preset.name == _pendingFilter ||
                    (preset.name == 'Normal' && _pendingFilter == null);

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _pendingFilter = preset.name == 'Normal'
                          ? null
                          : preset.name;
                    });
                  },
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    child: Column(
                      children: [
                        Container(
                          width: 84,
                          height: 84,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                color: isSelected
                  ? AppColors.primary
                  : Colors.white.withValues(alpha: 0.3),
                              width: isSelected ? 3 : 1,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: preset.colorFilter != null
                                ? ColorFiltered(
                                    colorFilter: preset.colorFilter!,
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
                        Text(
                          preset.name,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
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
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
