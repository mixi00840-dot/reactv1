import 'dart:io';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/premium_button.dart';

/// Voiceover Recorder - Record voiceover for videos
class VoiceoverRecorder extends StatefulWidget {
  final Function(String? path) onRecordingComplete;
  final VoidCallback onClose;

  const VoiceoverRecorder({
    super.key,
    required this.onRecordingComplete,
    required this.onClose,
  });

  @override
  State<VoiceoverRecorder> createState() => _VoiceoverRecorderState();
}

class _VoiceoverRecorderState extends State<VoiceoverRecorder> {
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _recordingPath;
  int _recordingSeconds = 0;
  AudioPlayer? _audioPlayer;
  // Note: Actual audio recording would use `record` package or similar

  @override
  void dispose() {
    _audioPlayer?.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    setState(() {
      _isRecording = true;
      _recordingSeconds = 0;
    });

    // Start recording timer
    _startTimer();

    // TODO: Implement actual audio recording using `record` package
    // For now, this is a placeholder
    try {
      final directory = await getTemporaryDirectory();
      _recordingPath = '${directory.path}/voiceover_${DateTime.now().millisecondsSinceEpoch}.m4a';
      
      // Simulate recording
      await Future.delayed(const Duration(seconds: 1));
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    setState(() {
      _isRecording = false;
    });

    // TODO: Stop actual recording
    // For now, this is a placeholder
  }

  Future<void> _playRecording() async {
    if (_recordingPath == null) return;

    if (_isPlaying) {
      await _audioPlayer?.stop();
      setState(() {
        _isPlaying = false;
      });
    } else {
      _audioPlayer = AudioPlayer();
      await _audioPlayer!.play(DeviceFileSource(_recordingPath!));
      setState(() {
        _isPlaying = true;
      });

      _audioPlayer!.onPlayerComplete.listen((_) {
        setState(() {
          _isPlaying = false;
        });
      });
    }
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (_isRecording && mounted) {
        setState(() {
          _recordingSeconds++;
        });
      }
      return _isRecording;
    });
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _saveRecording() {
    widget.onRecordingComplete(_recordingPath);
    Navigator.pop(context);
  }

  void _deleteRecording() {
    if (_recordingPath != null) {
      try {
        File(_recordingPath!).deleteSync();
      } catch (e) {
        debugPrint('Error deleting recording: $e');
      }
    }
    setState(() {
      _recordingPath = null;
      _recordingSeconds = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.5,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.95),
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
                  'Voiceover',
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

          // Recording Display
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Waveform Animation (placeholder)
                  Container(
                    width: 200,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Center(
                      child: _isRecording
                          ? Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                5,
                                (index) => Container(
                                  width: 4,
                                  height: 40,
                                  margin: const EdgeInsets.symmetric(horizontal: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ),
                            )
                          : Icon(
                              Icons.mic,
                              size: 48,
                              color: Colors.white.withOpacity(0.5),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Timer
                  Text(
                    _formatDuration(_recordingSeconds),
                    style: AppTypography.displaySmall(context).copyWith(
                      color: _isRecording ? AppColors.error : Colors.white,
                      fontSize: 48,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isRecording ? 'Recording...' : 'Tap to record',
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Controls
          Padding(
            padding: AppSpacing.screenPadding(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Delete Button
                if (_recordingPath != null)
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.white),
                    onPressed: _deleteRecording,
                  )
                else
                  const SizedBox(width: 48),

                // Record/Stop Button
                GestureDetector(
                  onTap: _isRecording ? _stopRecording : _startRecording,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isRecording ? AppColors.error : AppColors.primary,
                    ),
                    child: Icon(
                      _isRecording ? Icons.stop : Icons.mic,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ),

                // Play/Save Button
                if (_recordingPath != null)
                  IconButton(
                    icon: Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      color: Colors.white,
                      size: 32,
                    ),
                    onPressed: _playRecording,
                  )
                else
                  const SizedBox(width: 48),
              ],
            ),
          ),

          // Save Button
          if (_recordingPath != null)
            Padding(
              padding: AppSpacing.screenPadding(),
              child: PremiumButton(
                text: 'Use Voiceover',
                variant: ButtonVariant.primary,
                isFullWidth: true,
                onPressed: _saveRecording,
              ),
            ),
        ],
      ),
    );
  }
}

