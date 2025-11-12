import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/face_effects_provider.dart';
import '../../../services/beauty_effects_processor.dart';

/// Beauty effects selector button that opens a staged sheet
class BeautySelector extends ConsumerWidget {
  const BeautySelector({super.key});

  /// Programmatically open the staged Beauty modal.
  /// Returns true if Apply was pressed, false/null on cancel or dismiss.
  static Future<bool?> show(BuildContext context, WidgetRef ref) {
    final initial = ref.read(faceEffectsProvider).beautySettings;
    return showModalBottomSheet<bool>(
      context: context,
  backgroundColor: Colors.black.withValues(alpha: 0.95),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _BeautyModalContent(initialSettings: initial),
    ).then((applied) {
      if (applied != true) {
        // Revert on cancel or dismiss
        ref.read(faceEffectsProvider.notifier).setBeautySettings(initial);
      }
      return applied;
    });
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasBeauty = ref.watch(faceEffectsProvider).hasBeautyEffects;
    return GestureDetector(
      onTap: () => BeautySelector.show(context, ref),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: hasBeauty
              ? AppColors.primary.withValues(alpha: 0.3)
              : Colors.black.withValues(alpha: 0.5),
          shape: BoxShape.circle,
        ),
        child: const Icon(Iconsax.magic_star, color: Colors.white, size: 28),
      ),
    );
  }
}

class _BeautyModalContent extends ConsumerStatefulWidget {
  final BeautySettings initialSettings;
  const _BeautyModalContent({required this.initialSettings});

  @override
  ConsumerState<_BeautyModalContent> createState() => _BeautyModalContentState();
}

class _BeautyModalContentState extends ConsumerState<_BeautyModalContent> {
  late BeautySettings _pending;

  @override
  void initState() {
    super.initState();
    _pending = widget.initialSettings;
  }

  void _preview(BeautySettings s) {
    setState(() => _pending = s);
    // Live preview by updating provider; will be reverted if cancelled
    ref.read(faceEffectsProvider.notifier).setBeautySettings(s);
  }

  void _apply() {
    // Already previewing; ensure commit
    ref.read(faceEffectsProvider.notifier).setBeautySettings(_pending);
    Navigator.of(context).pop(true);
  }

  void _cancel() {
    Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Beauty Effects',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton(onPressed: _cancel, child: const Text('Cancel')),
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
            ),
            const SizedBox(height: 20),
            const Text(
              'Presets',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            _PresetsRow(
              current: _pending,
              onSelect: (p) => _preview(p),
            ),
            const SizedBox(height: 30),
            const Text(
              'Adjust Manually',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            _LabeledSlider(
              label: 'Smoothness',
              icon: Iconsax.blur,
              value: _pending.smoothness,
              onChanged: (v) => _preview(_pending.copyWith(smoothness: v)),
            ),
            const SizedBox(height: 16),
            _LabeledSlider(
              label: 'Brightness',
              icon: Iconsax.sun_1,
              value: _pending.brightness,
              onChanged: (v) => _preview(_pending.copyWith(brightness: v)),
            ),
            const SizedBox(height: 16),
            _LabeledSlider(
              label: 'Face Slim',
              icon: Iconsax.profile_2user,
              value: _pending.faceSlim,
              onChanged: (v) => _preview(_pending.copyWith(faceSlim: v)),
            ),
          ],
        ),
      ),
    );
  }
}

class _PresetsRow extends StatelessWidget {
  final BeautySettings current;
  final ValueChanged<BeautySettings> onSelect;
  const _PresetsRow({required this.current, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    const presets = [
      BeautySettings.none,
      BeautySettings.light,
      BeautySettings.medium,
      BeautySettings.strong,
      BeautySettings.maximum,
    ];
    const labels = ['None', 'Light', 'Medium', 'Strong', 'Maximum'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (int i = 0; i < presets.length; i++) ...[
            _PresetChip(
              label: labels[i],
              selected: current.smoothness == presets[i].smoothness &&
                  current.brightness == presets[i].brightness &&
                  current.faceSlim == presets[i].faceSlim,
              onTap: () => onSelect(presets[i]),
            ),
            if (i < presets.length - 1) const SizedBox(width: 12),
          ]
        ],
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _PresetChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : Colors.white24,
            width: 2,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 10,
                    spreadRadius: 1,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.white70,
            fontSize: 14,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _LabeledSlider extends StatelessWidget {
  final String label;
  final IconData icon;
  final double value;
  final ValueChanged<double> onChanged;
  const _LabeledSlider({
    required this.label,
    required this.icon,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
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
            overlayColor: AppColors.primary.withValues(alpha: 0.2),
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
