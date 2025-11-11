import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../providers/audio_editor_provider.dart';

/// Audio mixer widget with volume controls
class AudioMixerWidget extends ConsumerWidget {
  const AudioMixerWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(audioEditorProvider);

    if (project == null) {
      return const Center(
        child: Text(
          'No audio project loaded',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    final settings = project.mixerSettings;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Audio Mixer',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Mixer presets
            const Text(
              'Presets',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _PresetButton(
                    label: 'Balanced',
                    onTap: () {
                      ref.read(audioEditorProvider.notifier).updateMixerSettings(
                            AudioMixerPresets.balanced,
                          );
                    },
                  ),
                  _PresetButton(
                    label: 'Voiceover Focus',
                    onTap: () {
                      ref.read(audioEditorProvider.notifier).updateMixerSettings(
                            AudioMixerPresets.voiceoverFocus,
                          );
                    },
                  ),
                  _PresetButton(
                    label: 'Music Focus',
                    onTap: () {
                      ref.read(audioEditorProvider.notifier).updateMixerSettings(
                            AudioMixerPresets.musicFocus,
                          );
                    },
                  ),
                  _PresetButton(
                    label: 'Original Only',
                    onTap: () {
                      ref.read(audioEditorProvider.notifier).updateMixerSettings(
                            AudioMixerPresets.originalOnly,
                          );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Divider(color: Colors.white24),
            const SizedBox(height: 16),

            // Original track
            _AudioTrackControl(
              label: 'Original Audio',
              icon: Icons.videocam,
              volume: settings.originalVolume,
              isMuted: settings.originalMuted,
              onVolumeChanged: (value) {
                ref.read(audioEditorProvider.notifier).setOriginalVolume(value);
              },
              onMuteToggle: () {
                ref.read(audioEditorProvider.notifier).toggleOriginalMute();
              },
            ),

            const SizedBox(height: 16),

            // Voiceover track
            _AudioTrackControl(
              label: 'Voiceover',
              icon: Icons.mic,
              volume: settings.voiceoverVolume,
              isMuted: settings.voiceoverMuted,
              isDisabled: !project.hasVoiceover,
              onVolumeChanged: (value) {
                ref.read(audioEditorProvider.notifier).setVoiceoverVolume(value);
              },
              onMuteToggle: () {
                ref.read(audioEditorProvider.notifier).toggleVoiceoverMute();
              },
            ),

            const SizedBox(height: 16),

            // Music track
            _AudioTrackControl(
              label: 'Background Music',
              icon: Icons.music_note,
              volume: settings.musicVolume,
              isMuted: settings.musicMuted,
              isDisabled: !project.hasMusic,
              onVolumeChanged: (value) {
                ref.read(audioEditorProvider.notifier).setMusicVolume(value);
              },
              onMuteToggle: () {
                ref.read(audioEditorProvider.notifier).toggleMusicMute();
              },
            ),

            const SizedBox(height: 24),
            const Divider(color: Colors.white24),
            const SizedBox(height: 16),

            // Master volume
            _AudioTrackControl(
              label: 'Master Volume',
              icon: Icons.volume_up,
              volume: settings.masterVolume,
              isMuted: false,
              showMuteButton: false,
              onVolumeChanged: (value) {
                ref.read(audioEditorProvider.notifier).setMasterVolume(value);
              },
            ),

            const SizedBox(height: 24),
            const Divider(color: Colors.white24),
            const SizedBox(height: 16),

            // Audio processing options
            const Text(
              'Audio Processing',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Normalization toggle
            _ToggleOption(
              label: 'Audio Normalization',
              description: 'Balance audio levels automatically',
              value: settings.enableAudioNormalization,
              onChanged: (value) {
                ref.read(audioEditorProvider.notifier).toggleAudioNormalization();
              },
            ),

            const SizedBox(height: 12),

            // Noise reduction toggle
            _ToggleOption(
              label: 'Noise Reduction',
              description: 'Reduce background noise',
              value: settings.enableNoiseReduction,
              onChanged: (value) {
                ref.read(audioEditorProvider.notifier).toggleNoiseReduction();
              },
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// Audio track control with volume slider and mute button
class _AudioTrackControl extends StatelessWidget {
  final String label;
  final IconData icon;
  final double volume;
  final bool isMuted;
  final bool isDisabled;
  final bool showMuteButton;
  final Function(double) onVolumeChanged;
  final VoidCallback? onMuteToggle;

  const _AudioTrackControl({
    required this.label,
    required this.icon,
    required this.volume,
    required this.isMuted,
    this.isDisabled = false,
    this.showMuteButton = true,
    required this.onVolumeChanged,
    this.onMuteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveVolume = isMuted ? 0.0 : volume;
    final color = isDisabled ? Colors.white30 : Colors.white;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (showMuteButton && onMuteToggle != null)
              IconButton(
                icon: Icon(
                  isMuted ? Icons.volume_off : Icons.volume_up,
                  color: color,
                  size: 20,
                ),
                onPressed: isDisabled ? null : onMuteToggle,
              ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: SliderTheme(
                data: SliderThemeData(
                  activeTrackColor: isDisabled
                      ? Colors.white30
                      : (isMuted ? Colors.red : AppColors.primary),
                  inactiveTrackColor: Colors.white24,
                  thumbColor: isDisabled
                      ? Colors.white30
                      : (isMuted ? Colors.red : AppColors.primary),
                  overlayColor: isDisabled
                      ? Colors.transparent
                      : AppColors.primary.withOpacity(0.2),
                ),
                child: Slider(
                  value: effectiveVolume,
                  min: 0.0,
                  max: 1.0,
                  onChanged: isDisabled ? null : onVolumeChanged,
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 40,
              child: Text(
                '${(effectiveVolume * 100).toInt()}%',
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                ),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Preset button
class _PresetButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PresetButton({
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: Colors.white30),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      ),
    );
  }
}

/// Toggle option with description
class _ToggleOption extends StatelessWidget {
  final String label;
  final String description;
  final bool value;
  final Function(bool) onChanged;

  const _ToggleOption({
    required this.label,
    required this.description,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.primary,
        ),
      ],
    );
  }
}

/// Voiceover recorder button
class VoiceoverRecorderButton extends ConsumerWidget {
  const VoiceoverRecorderButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => const VoiceoverRecorderSheet(),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.red, width: 2),
            ),
            child: const Icon(
              Icons.mic,
              color: Colors.red,
              size: 28,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Voiceover',
            style: TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

/// Voiceover recorder sheet
class VoiceoverRecorderSheet extends ConsumerStatefulWidget {
  const VoiceoverRecorderSheet({super.key});

  @override
  ConsumerState<VoiceoverRecorderSheet> createState() =>
      _VoiceoverRecorderSheetState();
}

class _VoiceoverRecorderSheetState
    extends ConsumerState<VoiceoverRecorderSheet> {
  bool _isRecording = false;
  bool _isPaused = false;
  Duration _recordingDuration = Duration.zero;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.4,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Record Voiceover',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),

          const Spacer(),

          // Recording duration
          Text(
            _formatDuration(_recordingDuration),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 48,
              fontWeight: FontWeight.bold,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),

          const SizedBox(height: 32),

          // Recording indicator
          if (_isRecording)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Recording...',
                  style: TextStyle(color: Colors.red, fontSize: 16),
                ),
              ],
            ),

          const Spacer(),

          // Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Cancel button
              if (_isRecording)
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.white, size: 32),
                  onPressed: _onCancel,
                ),

              // Record/Stop button
              GestureDetector(
                onTap: _isRecording ? _onStop : _onStart,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _isRecording ? Colors.red : Colors.red.shade700,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isRecording ? Icons.stop : Icons.mic,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              ),

              // Pause/Resume button
              if (_isRecording)
                IconButton(
                  icon: Icon(
                    _isPaused ? Icons.play_arrow : Icons.pause,
                    color: Colors.white,
                    size: 32,
                  ),
                  onPressed: _isPaused ? _onResume : _onPause,
                ),
            ],
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _onStart() async {
    try {
      await ref.read(audioEditorProvider.notifier).startRecording();
      setState(() => _isRecording = true);

      // Listen to duration updates
      ref
          .read(audioEditorProvider.notifier)
          .getRecordingDurationStream()
          .listen((duration) {
        if (mounted) {
          setState(() => _recordingDuration = duration);
        }
      });
    } catch (e) {
      _showError('Failed to start recording: $e');
    }
  }

  void _onStop() async {
    try {
      await ref.read(audioEditorProvider.notifier).stopRecording();
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      _showError('Failed to stop recording: $e');
    }
  }

  void _onPause() async {
    try {
      await ref.read(audioEditorProvider.notifier).pauseRecording();
      setState(() => _isPaused = true);
    } catch (e) {
      _showError('Failed to pause recording: $e');
    }
  }

  void _onResume() async {
    try {
      await ref.read(audioEditorProvider.notifier).resumeRecording();
      setState(() => _isPaused = false);
    } catch (e) {
      _showError('Failed to resume recording: $e');
    }
  }

  void _onCancel() async {
    try {
      await ref.read(audioEditorProvider.notifier).cancelRecording();
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      _showError('Failed to cancel recording: $e');
    }
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    final milliseconds = (duration.inMilliseconds % 1000) ~/ 10;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}.${milliseconds.toString().padLeft(2, '0')}';
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }
}
