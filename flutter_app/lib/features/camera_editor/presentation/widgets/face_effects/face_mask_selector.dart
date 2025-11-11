import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../models/face_effects_state.dart';
import '../../../providers/face_effects_provider.dart';

/// Face mask selector widget
class FaceMaskSelector extends ConsumerWidget {
  const FaceMaskSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faceEffectsState = ref.watch(faceEffectsProvider);

    return GestureDetector(
      onTap: () => _showMaskModal(context, ref),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: faceEffectsState.hasFaceMask
              ? AppColors.primary.withOpacity(0.3)
              : Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Iconsax.mask,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }

  void _showMaskModal(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black.withOpacity(0.9),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _FaceMaskModalContent(),
    );
  }
}

class _FaceMaskModalContent extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMask = ref.watch(faceEffectsProvider).selectedFaceMask;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Face Masks',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  ref.read(faceEffectsProvider.notifier).setFaceMask(null);
                },
                child: Text(
                  'Clear',
                  style: TextStyle(color: AppColors.primary),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Mask grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.85,
            ),
            itemCount: FaceMaskType.values.length,
            itemBuilder: (context, index) {
              final maskType = FaceMaskType.values[index];
              final isSelected = selectedMask == maskType.name;

              return _MaskButton(
                maskType: maskType,
                isSelected: isSelected,
                onTap: () {
                  final newMask = maskType == FaceMaskType.none
                      ? null
                      : maskType.name;
                  ref.read(faceEffectsProvider.notifier).setFaceMask(newMask);
                },
              );
            },
          ),

          const SizedBox(height: 20),

          // Info text
          if (selectedMask != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Colors.white70,
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Position your face in frame for best results',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

class _MaskButton extends StatelessWidget {
  final FaceMaskType maskType;
  final bool isSelected;
  final VoidCallback onTap;

  const _MaskButton({
    required this.maskType,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary
                  : Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppColors.primary : Colors.white24,
                width: 2,
              ),
            ),
            child: Center(
              child: maskType.emoji != null
                  ? Text(
                      maskType.emoji!,
                      style: const TextStyle(fontSize: 32),
                    )
                  : Icon(
                      Icons.block,
                      color: isSelected ? Colors.white : Colors.white54,
                      size: 32,
                    ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            maskType.label,
            style: TextStyle(
              color: isSelected ? AppColors.primary : Colors.white70,
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
