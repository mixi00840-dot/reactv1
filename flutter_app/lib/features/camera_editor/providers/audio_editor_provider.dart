import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import 'package:uuid/uuid.dart';
import '../models/audio_editing_models.dart';
import '../services/audio_recorder_service.dart';
import '../services/ffmpeg_audio_processor.dart';

/// Provider for audio editing state
final audioEditorProvider =
    StateNotifierProvider<AudioEditorNotifier, AudioEditingProject?>((ref) {
  return AudioEditorNotifier();
});

/// Provider for audio recording state
final audioRecordingProvider = StateProvider<RecordingState>((ref) {
  return RecordingState.idle;
});

/// Provider for recording duration
final recordingDurationProvider = StateProvider<Duration>((ref) {
  return Duration.zero;
});

/// Provider for audio processing progress
final audioProcessingProgressProvider = StateProvider<double>((ref) {
  return 0.0;
});

/// Notifier for managing audio editing state
class AudioEditorNotifier extends StateNotifier<AudioEditingProject?> {
  AudioEditorNotifier() : super(null);

  final _uuid = const Uuid();
  final _audioRecorder = AudioRecorderService();

  @override
  void dispose() {
    _audioRecorder.dispose();
    super.dispose();
  }

  /// Initialize audio editor with video
  void initializeProject({
    required String videoPath,
    required Duration videoDuration,
  }) {
    // Create original audio track
    final originalTrack = AudioTrack(
      id: _uuid.v4(),
      type: AudioTrackType.original,
      duration: videoDuration,
    );

    state = AudioEditingProject(
      id: _uuid.v4(),
      videoPath: videoPath,
      videoDuration: videoDuration,
      originalTrack: originalTrack,
      mixerSettings: AudioMixerSettings.defaultSettings,
    );

    debugPrint('🎵 Audio editor initialized');
  }

  /// Update mixer settings
  void updateMixerSettings(AudioMixerSettings settings) {
    if (state == null) return;
    state = state!.copyWith(mixerSettings: settings);
    debugPrint('🎚️ Mixer settings updated');
  }

  /// Set original track volume
  void setOriginalVolume(double volume) {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(originalVolume: volume);
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Toggle original track mute
  void toggleOriginalMute() {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(
      originalMuted: !state!.mixerSettings.originalMuted,
    );
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Set voiceover volume
  void setVoiceoverVolume(double volume) {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(voiceoverVolume: volume);
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Toggle voiceover mute
  void toggleVoiceoverMute() {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(
      voiceoverMuted: !state!.mixerSettings.voiceoverMuted,
    );
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Set music volume
  void setMusicVolume(double volume) {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(musicVolume: volume);
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Toggle music mute
  void toggleMusicMute() {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(
      musicMuted: !state!.mixerSettings.musicMuted,
    );
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Set master volume
  void setMasterVolume(double volume) {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(masterVolume: volume);
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Toggle audio normalization
  void toggleAudioNormalization() {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(
      enableAudioNormalization: !state!.mixerSettings.enableAudioNormalization,
    );
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Toggle noise reduction
  void toggleNoiseReduction() {
    if (state == null) return;
    final settings = state!.mixerSettings.copyWith(
      enableNoiseReduction: !state!.mixerSettings.enableNoiseReduction,
    );
    state = state!.copyWith(mixerSettings: settings);
  }

  /// Add voiceover clip
  void addVoiceoverClip(VoiceoverClip clip) {
    if (state == null) return;
    final clips = [...state!.voiceoverClips, clip];
    state = state!.copyWith(voiceoverClips: clips);
    debugPrint('🎤 Voiceover clip added: ${clip.duration.inSeconds}s');
  }

  /// Update voiceover clip
  void updateVoiceoverClip(String clipId, VoiceoverClip updatedClip) {
    if (state == null) return;
    final clips = state!.voiceoverClips.map((clip) {
      return clip.id == clipId ? updatedClip : clip;
    }).toList();
    state = state!.copyWith(voiceoverClips: clips);
  }

  /// Remove voiceover clip
  void removeVoiceoverClip(String clipId) {
    if (state == null) return;
    final clips = state!.voiceoverClips.where((c) => c.id != clipId).toList();
    state = state!.copyWith(voiceoverClips: clips);
    debugPrint('🗑️ Voiceover clip removed');
  }

  /// Set voiceover clip volume
  void setVoiceoverClipVolume(String clipId, double volume) {
    if (state == null) return;
    final clips = state!.voiceoverClips.map((clip) {
      return clip.id == clipId ? clip.copyWith(volume: volume) : clip;
    }).toList();
    state = state!.copyWith(voiceoverClips: clips);
  }

  /// Toggle voiceover clip mute
  void toggleVoiceoverClipMute(String clipId) {
    if (state == null) return;
    final clips = state!.voiceoverClips.map((clip) {
      return clip.id == clipId ? clip.copyWith(isMuted: !clip.isMuted) : clip;
    }).toList();
    state = state!.copyWith(voiceoverClips: clips);
  }

  /// Add music track
  void addMusicTrack({
    required String filePath,
    required Duration duration,
  }) {
    if (state == null) return;
    
    final musicTrack = AudioTrack(
      id: _uuid.v4(),
      type: AudioTrackType.music,
      filePath: filePath,
      duration: duration,
      volume: 0.5, // Default 50% volume for music
    );

    state = state!.copyWith(musicTrack: musicTrack);
    debugPrint('🎵 Music track added: ${duration.inSeconds}s');
  }

  /// Remove music track
  void removeMusicTrack() {
    if (state == null) return;
    state = state!.copyWith(clearMusicTrack: true);
    debugPrint('🗑️ Music track removed');
  }

  /// Update music track
  void updateMusicTrack(AudioTrack updatedTrack) {
    if (state == null || state!.musicTrack == null) return;
    state = state!.copyWith(musicTrack: updatedTrack);
  }

  /// Set music track fade in
  void setMusicFadeIn(double seconds) {
    if (state == null || state!.musicTrack == null) return;
    final track = state!.musicTrack!.copyWith(fadeInDuration: seconds);
    state = state!.copyWith(musicTrack: track);
  }

  /// Set music track fade out
  void setMusicFadeOut(double seconds) {
    if (state == null || state!.musicTrack == null) return;
    final track = state!.musicTrack!.copyWith(fadeOutDuration: seconds);
    state = state!.copyWith(musicTrack: track);
  }

  /// Get visible voiceover clips at current time
  List<VoiceoverClip> getVisibleVoiceoverClips(Duration currentTime) {
    if (state == null) return [];
    return state!.voiceoverClips
        .where((clip) => clip.isVisibleAt(currentTime))
        .toList();
  }

  /// Start recording voiceover
  Future<void> startRecording({
    Duration? startTimeInVideo,
  }) async {
    try {
      await _audioRecorder.startRecording();
      debugPrint('🎤 Recording started');
    } catch (e) {
      debugPrint('❌ Error starting recording: $e');
      rethrow;
    }
  }

  /// Pause recording
  Future<void> pauseRecording() async {
    try {
      await _audioRecorder.pauseRecording();
      debugPrint('⏸️ Recording paused');
    } catch (e) {
      debugPrint('❌ Error pausing recording: $e');
      rethrow;
    }
  }

  /// Resume recording
  Future<void> resumeRecording() async {
    try {
      await _audioRecorder.resumeRecording();
      debugPrint('▶️ Recording resumed');
    } catch (e) {
      debugPrint('❌ Error resuming recording: $e');
      rethrow;
    }
  }

  /// Stop recording and add clip
  Future<VoiceoverClip?> stopRecording({
    Duration? startTimeInVideo,
  }) async {
    try {
      final clip = await _audioRecorder.stopRecording(
        startTimeInVideo: startTimeInVideo,
      );

      if (clip != null) {
        addVoiceoverClip(clip);
        debugPrint('✅ Recording stopped and added');
      }

      return clip;
    } catch (e) {
      debugPrint('❌ Error stopping recording: $e');
      rethrow;
    }
  }

  /// Cancel recording
  Future<void> cancelRecording() async {
    try {
      await _audioRecorder.cancelRecording();
      debugPrint('🗑️ Recording cancelled');
    } catch (e) {
      debugPrint('❌ Error cancelling recording: $e');
      rethrow;
    }
  }

  /// Check if has permission
  Future<bool> hasRecordingPermission() async {
    return await _audioRecorder.hasPermission();
  }

  /// Get recording duration stream
  Stream<Duration> getRecordingDurationStream() {
    return _audioRecorder.durationStream;
  }

  /// Process audio and merge with video
  Future<String?> processAudio({
    required String outputVideoPath,
    Function(double)? onProgress,
  }) async {
    if (state == null) return null;

    try {
      debugPrint('🎵 Processing audio...');
      
      final result = await FFmpegAudioProcessor.processAudioProject(
        project: state!,
        outputVideoPath: outputVideoPath,
        onProgress: onProgress,
      );

      if (result != null) {
        debugPrint('✅ Audio processing complete');
      }

      return result;
    } catch (e) {
      debugPrint('❌ Error processing audio: $e');
      return null;
    }
  }

  /// Reset audio editor
  void reset() {
    state = null;
    debugPrint('🔄 Audio editor reset');
  }
}

/// Helper extension for audio mixer settings presets
extension AudioMixerPresets on AudioMixerSettings {
  /// Balanced preset (default)
  static AudioMixerSettings get balanced => const AudioMixerSettings(
        originalVolume: 1.0,
        voiceoverVolume: 1.0,
        musicVolume: 0.5,
        masterVolume: 1.0,
      );

  /// Voiceover focus preset
  static AudioMixerSettings get voiceoverFocus => const AudioMixerSettings(
        originalVolume: 0.3,
        voiceoverVolume: 1.0,
        musicVolume: 0.2,
        masterVolume: 1.0,
      );

  /// Music focus preset
  static AudioMixerSettings get musicFocus => const AudioMixerSettings(
        originalVolume: 0.5,
        voiceoverVolume: 0.7,
        musicVolume: 1.0,
        masterVolume: 1.0,
      );

  /// Original only preset
  static AudioMixerSettings get originalOnly => const AudioMixerSettings(
        originalVolume: 1.0,
        voiceoverVolume: 0.0,
        musicVolume: 0.0,
        masterVolume: 1.0,
      );

  /// Silent original preset
  static AudioMixerSettings get silentOriginal => const AudioMixerSettings(
        originalVolume: 0.0,
        voiceoverVolume: 1.0,
        musicVolume: 0.8,
        masterVolume: 1.0,
      );
}
