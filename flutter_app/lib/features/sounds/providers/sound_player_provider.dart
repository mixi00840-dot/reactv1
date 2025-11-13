import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import 'package:just_audio/just_audio.dart';
import '../models/sound_model.dart';

/// Sound player state
class SoundPlayerState {
  final Sound? currentSound;
  final bool isPlaying;
  final bool isLoading;
  final Duration position;
  final Duration? duration;
  final String? error;

  const SoundPlayerState({
    this.currentSound,
    this.isPlaying = false,
    this.isLoading = false,
    this.position = Duration.zero,
    this.duration,
    this.error,
  });

  double get progress {
    if (duration == null || duration!.inMilliseconds == 0) return 0.0;
    return position.inMilliseconds / duration!.inMilliseconds;
  }

  SoundPlayerState copyWith({
    Sound? currentSound,
    bool? isPlaying,
    bool? isLoading,
    Duration? position,
    Duration? duration,
    String? error,
  }) {
    return SoundPlayerState(
      currentSound: currentSound ?? this.currentSound,
      isPlaying: isPlaying ?? this.isPlaying,
      isLoading: isLoading ?? this.isLoading,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      error: error,
    );
  }
}

/// Sound player provider for previewing audio
final soundPlayerProvider =
    StateNotifierProvider<SoundPlayerNotifier, SoundPlayerState>((ref) {
  return SoundPlayerNotifier();
});

class SoundPlayerNotifier extends StateNotifier<SoundPlayerState> {
  SoundPlayerNotifier() : super(const SoundPlayerState()) {
    _initializePlayer();
  }

  final AudioPlayer _audioPlayer = AudioPlayer();

  void _initializePlayer() {
    // Listen to playback state
    _audioPlayer.playingStream.listen((isPlaying) {
      if (mounted) {
        state = state.copyWith(isPlaying: isPlaying);
      }
    });

    // Listen to position
    _audioPlayer.positionStream.listen((position) {
      if (mounted) {
        state = state.copyWith(position: position);
      }
    });

    // Listen to duration
    _audioPlayer.durationStream.listen((duration) {
      if (mounted) {
        state = state.copyWith(duration: duration);
      }
    });

    // Listen to player state
    _audioPlayer.playerStateStream.listen((playerState) {
      if (mounted) {
        final isLoading = playerState.processingState == ProcessingState.loading ||
            playerState.processingState == ProcessingState.buffering;
        state = state.copyWith(isLoading: isLoading);

        // Auto-stop when completed
        if (playerState.processingState == ProcessingState.completed) {
          stop();
        }
      }
    });
  }

  /// Play or resume sound
  Future<void> play(Sound sound) async {
    try {
      // If same sound, just resume
      if (state.currentSound?.id == sound.id && !state.isPlaying) {
        await _audioPlayer.play();
        return;
      }

      // Stop current if different sound
      if (state.currentSound?.id != sound.id) {
        await stop();
        state = state.copyWith(
          currentSound: sound,
          isLoading: true,
          error: null,
        );

        // Load and play new sound
        await _audioPlayer.setUrl(sound.audioUrl);
        await _audioPlayer.play();
      } else {
        await _audioPlayer.play();
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to play sound: $e',
      );
    }
  }

  /// Pause playback
  Future<void> pause() async {
    try {
      await _audioPlayer.pause();
    } catch (e) {
      print('❌ Pause error: $e');
    }
  }

  /// Stop playback and reset
  Future<void> stop() async {
    try {
      await _audioPlayer.stop();
      await _audioPlayer.seek(Duration.zero);
      state = state.copyWith(
        isPlaying: false,
        position: Duration.zero,
      );
    } catch (e) {
      print('❌ Stop error: $e');
    }
  }

  /// Toggle play/pause
  Future<void> togglePlayPause(Sound sound) async {
    if (state.currentSound?.id == sound.id && state.isPlaying) {
      await pause();
    } else {
      await play(sound);
    }
  }

  /// Seek to position
  Future<void> seek(Duration position) async {
    try {
      await _audioPlayer.seek(position);
    } catch (e) {
      print('❌ Seek error: $e');
    }
  }

  /// Set volume (0.0 to 1.0)
  Future<void> setVolume(double volume) async {
    try {
      await _audioPlayer.setVolume(volume.clamp(0.0, 1.0));
    } catch (e) {
      print('❌ Set volume error: $e');
    }
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }
}

