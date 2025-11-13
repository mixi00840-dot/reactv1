import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../models/sound_model.dart';

/// Selected sound state for camera recording
class SelectedSoundState {
  final Sound? sound;
  final DateTime? selectedAt;

  const SelectedSoundState({
    this.sound,
    this.selectedAt,
  });

  bool get hasSound => sound != null;

  String? get soundId => sound?.id;

  Duration? get soundDuration =>
      sound != null ? Duration(seconds: sound!.duration) : null;

  SelectedSoundState copyWith({
    Sound? sound,
    DateTime? selectedAt,
  }) {
    return SelectedSoundState(
      sound: sound ?? this.sound,
      selectedAt: selectedAt ?? this.selectedAt,
    );
  }

  SelectedSoundState clear() {
    return const SelectedSoundState();
  }
}

/// Provider for selected sound (used in camera recording)
final selectedSoundProvider =
    StateNotifierProvider<SelectedSoundNotifier, SelectedSoundState>((ref) {
  return SelectedSoundNotifier();
});

class SelectedSoundNotifier extends StateNotifier<SelectedSoundState> {
  SelectedSoundNotifier() : super(const SelectedSoundState());

  /// Select a sound
  void selectSound(Sound sound) {
    state = SelectedSoundState(
      sound: sound,
      selectedAt: DateTime.now(),
    );
  }

  /// Clear selection
  void clearSound() {
    state = const SelectedSoundState();
  }

  /// Check if sound is selected
  bool isSelected(String soundId) {
    return state.sound?.id == soundId;
  }
}

