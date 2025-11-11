import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/face_effects_provider.dart';
import '../../../services/beauty_effects_processor.dart';

/// Beauty effects selector widget
class BeautySelector extends ConsumerWidget {
  const BeautySelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faceEffectsState = ref.watch(faceEffectsProvider);

    return GestureDetector(
      onTap: () => _showBeautyModal(context, ref),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: faceEffectsState.hasBeautyEffects
              ? AppColors.primary.withOpacity(0.3)
              : Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Iconsax.magic_star,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }

  void _showBeautyModal(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black.withOpacity(0.9),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _BeautyModalContent(),
    );
  }
}

class _BeautyModalContent extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faceEffectsState = ref.watch(faceEffectsProvider);
    final beautySettings = faceEffectsState.beautySettings;

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
                'Beauty Effects',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  ref.read(faceEffectsProvider.notifier).clearAllEffects();
                },
                child: Text(
                  'Clear',
                  style: TextStyle(color: AppColors.primary),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Presets
          const Text(
            'Presets',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildPresets(ref),

          const SizedBox(height: 30),

          // Manual controls
          const Text(
            'Adjust Manually',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),

          // Smoothness slider
          _buildSlider(
            label: 'Smoothness',
            icon: Iconsax.blur,
            value: beautySettings.smoothness,
            onChanged: (value) {
              ref.read(faceEffectsProvider.notifier).setSmoothness(value);
            },
          ),

          const SizedBox(height: 16),

          // Brightness slider
          _buildSlider(
            label: 'Brightness',
            icon: Iconsax.sun_1,
            value: beautySettings.brightness,
            onChanged: (value) {
              ref.read(faceEffectsProvider.notifier).setBrightness(value);
            },
          ),

          const SizedBox(height: 16),

          // Face slim slider
          _buildSlider(
            label: 'Face Slim',
            icon: Iconsax.profile_2user,
            value: beautySettings.faceSlim,
            onChanged: (value) {
              ref.read(faceEffectsProvider.notifier).setFaceSlim(value);
            },
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildPresets(WidgetRef ref) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _PresetButton(
            label: 'None',
            preset: BeautySettings.none,
            onTap: () {
              ref.read(faceEffectsProvider.notifier).applyBeautyPreset(
                    BeautySettings.none,
                  );
            },
          ),
          const SizedBox(width: 12),
          _PresetButton(
            label: 'Light',
            preset: BeautySettings.light,
            onTap: () {
              ref.read(faceEffectsProvider.notifier).applyBeautyPreset(
                    BeautySettings.light,
                  );
            },
          ),
          const SizedBox(width: 12),
          _PresetButton(
            label: 'Medium',
            preset: BeautySettings.medium,
            onTap: () {
              ref.read(faceEffectsProvider.notifier).applyBeautyPreset(
                    BeautySettings.medium,
                  );
            },
          ),
          const SizedBox(width: 12),
          _PresetButton(
            label: 'Strong',
            preset: BeautySettings.strong,
            onTap: () {
              ref.read(faceEffectsProvider.notifier).applyBeautyPreset(
                    BeautySettings.strong,
                  );
            },
          ),
          const SizedBox(width: 12),
          _PresetButton(
            label: 'Maximum',
            preset: BeautySettings.maximum,
            onTap: () {
              ref.read(faceEffectsProvider.notifier).applyBeautyPreset(
                    BeautySettings.maximum,
                  );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSlider({
    required String label,
    required IconData icon,
    required double value,
    required ValueChanged<double> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white70, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            Text(
              '${(value * 100).toInt()}%',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SliderTheme(
          data: SliderThemeData(
            activeTrackColor: AppColors.primary,
            inactiveTrackColor: Colors.white24,
            thumbColor: AppColors.primary,
            overlayColor: AppColors.primary.withOpacity(0.2),
            trackHeight: 4,
          ),
          child: Slider(
            value: value,
            onChanged: onChanged,
            min: 0,
            max: 1,
          ),
        ),
      ],
    );
  }
}

class _PresetButton extends ConsumerWidget {
  final String label;
  final BeautySettings preset;
  final VoidCallback onTap;

  const _PresetButton({
    required this.label,
    required this.preset,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentSettings = ref.watch(faceEffectsProvider).beautySettings;
    final isSelected = currentSettings.smoothness == preset.smoothness &&
        currentSettings.brightness == preset.brightness &&
        currentSettings.faceSlim == preset.faceSlim;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.white24,
            width: 2,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
