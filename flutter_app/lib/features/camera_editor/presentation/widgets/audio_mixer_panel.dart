import 'package:flutter/material.dart';
import '../../../../core/services/audio_mixer_service.dart';

/// Audio mixer panel for video editor
class AudioMixerPanel extends StatefulWidget {
  final String videoPath;
  final Duration videoDuration;
  final List<AudioTrack> audioTracks;
  final Function(List<AudioTrack>) onTracksChanged;
  final Function() onAddMusic;
  final Function() onRecordVoiceover;

  const AudioMixerPanel({
    super.key,
    required this.videoPath,
    required this.videoDuration,
    required this.audioTracks,
    required this.onTracksChanged,
    required this.onAddMusic,
    required this.onRecordVoiceover,
  });

  @override
  State<AudioMixerPanel> createState() => _AudioMixerPanelState();
}

class _AudioMixerPanelState extends State<AudioMixerPanel> {
  late List<AudioTrack> _tracks;
  int? _playingTrackIndex;
  bool _isRecording = false;

  @override
  void initState() {
    super.initState();
    _tracks = List.from(widget.audioTracks);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: _tracks.isEmpty
                ? _buildEmptyState()
                : _buildTracksList(),
          ),
          _buildBottomActions(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const Text(
            'Audio Mixer',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: () {
              widget.onTracksChanged(_tracks);
              Navigator.pop(context);
            },
            child: const Text(
              'Done',
              style: TextStyle(
                color: Colors.pinkAccent,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.music_note,
            size: 80,
            color: Colors.grey[700],
          ),
          const SizedBox(height: 16),
          Text(
            'No audio tracks yet',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add music or record voiceover',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTracksList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _tracks.length,
      itemBuilder: (context, index) {
        final track = _tracks[index];
        return _buildTrackItem(track, index);
      },
    );
  }

  Widget _buildTrackItem(AudioTrack track, int index) {
    final isPlaying = _playingTrackIndex == index;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: track.isMuted ? Colors.grey[800]! : Colors.pinkAccent.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Track header
          Row(
            children: [
              Icon(
                _getTrackIcon(track.type),
                color: track.isMuted ? Colors.grey : Colors.pinkAccent,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  track.name,
                  style: TextStyle(
                    color: track.isMuted ? Colors.grey : Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              // Play/Pause button
              IconButton(
                icon: Icon(
                  isPlaying ? Icons.pause_circle : Icons.play_circle,
                  color: Colors.white,
                ),
                onPressed: () => _togglePlayTrack(index),
              ),
              // Mute button
              IconButton(
                icon: Icon(
                  track.isMuted ? Icons.volume_off : Icons.volume_up,
                  color: track.isMuted ? Colors.grey : Colors.white,
                ),
                onPressed: () => _toggleMute(index),
              ),
              // Delete button
              IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () => _deleteTrack(index),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Volume slider
          Row(
            children: [
              const Text(
                'Volume:',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              Expanded(
                child: Slider(
                  value: track.volume,
                  min: 0.0,
                  max: 2.0,
                  divisions: 20,
                  activeColor: Colors.pinkAccent,
                  inactiveColor: Colors.grey[800],
                  onChanged: (value) => _updateVolume(index, value),
                ),
              ),
              Text(
                '${(track.volume * 100).toInt()}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          // Fade controls
          Row(
            children: [
              Expanded(
                child: _buildFadeButton(
                  'Fade In',
                  track.fadeIn != null,
                  () => _toggleFadeIn(index),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFadeButton(
                  'Fade Out',
                  track.fadeOut != null,
                  () => _toggleFadeOut(index),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFadeButton(String label, bool isActive, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? Colors.pinkAccent.withOpacity(0.2) : Colors.grey[850],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? Colors.pinkAccent : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isActive ? Colors.pinkAccent : Colors.grey[400],
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: widget.onAddMusic,
              icon: const Icon(Icons.library_music),
              label: const Text('Add Music'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[800],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _isRecording ? null : widget.onRecordVoiceover,
              icon: Icon(_isRecording ? Icons.mic : Icons.mic_none),
              label: Text(_isRecording ? 'Recording...' : 'Voiceover'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _isRecording ? Colors.red : Colors.pinkAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTrackIcon(AudioTrackType type) {
    switch (type) {
      case AudioTrackType.original:
        return Icons.videocam;
      case AudioTrackType.music:
        return Icons.music_note;
      case AudioTrackType.voiceover:
        return Icons.mic;
    }
  }

  void _togglePlayTrack(int index) async {
    if (_playingTrackIndex == index) {
      await AudioMixerService.stopAudio();
      setState(() => _playingTrackIndex = null);
    } else {
      await AudioMixerService.stopAudio();
      await AudioMixerService.playAudio(_tracks[index].filePath);
      setState(() => _playingTrackIndex = index);
      
      // Auto-stop after duration
      Future.delayed(widget.videoDuration, () {
        if (mounted && _playingTrackIndex == index) {
          setState(() => _playingTrackIndex = null);
        }
      });
    }
  }

  void _toggleMute(int index) {
    setState(() {
      _tracks[index] = _tracks[index].copyWith(
        isMuted: !_tracks[index].isMuted,
      );
    });
  }

  void _deleteTrack(int index) {
    setState(() {
      _tracks.removeAt(index);
      if (_playingTrackIndex == index) {
        AudioMixerService.stopAudio();
        _playingTrackIndex = null;
      }
    });
  }

  void _updateVolume(int index, double volume) {
    setState(() {
      _tracks[index] = _tracks[index].copyWith(volume: volume);
    });
  }

  void _toggleFadeIn(int index) {
    setState(() {
      final currentFadeIn = _tracks[index].fadeIn;
      _tracks[index] = _tracks[index].copyWith(
        fadeIn: currentFadeIn == null ? const Duration(seconds: 2) : null,
      );
    });
  }

  void _toggleFadeOut(int index) {
    setState(() {
      final currentFadeOut = _tracks[index].fadeOut;
      _tracks[index] = _tracks[index].copyWith(
        fadeOut: currentFadeOut == null ? const Duration(seconds: 2) : null,
      );
    });
  }

  @override
  void dispose() {
    AudioMixerService.stopAudio();
    super.dispose();
  }
}

/// Quick audio controls bar
class QuickAudioBar extends StatelessWidget {
  final double originalVolume;
  final bool hasMusic;
  final Function(double) onVolumeChanged;
  final Function() onOpenMixer;

  const QuickAudioBar({
    super.key,
    required this.originalVolume,
    required this.hasMusic,
    required this.onVolumeChanged,
    required this.onOpenMixer,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.black.withOpacity(0.7),
      child: Row(
        children: [
          Icon(
            originalVolume > 0 ? Icons.volume_up : Icons.volume_off,
            color: Colors.white,
            size: 20,
          ),
          Expanded(
            child: Slider(
              value: originalVolume,
              min: 0.0,
              max: 2.0,
              activeColor: Colors.pinkAccent,
              inactiveColor: Colors.grey[700],
              onChanged: onVolumeChanged,
            ),
          ),
          Text(
            '${(originalVolume * 100).toInt()}%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            icon: Icon(
              hasMusic ? Icons.music_note : Icons.library_music,
              color: hasMusic ? Colors.pinkAccent : Colors.white,
            ),
            onPressed: onOpenMixer,
            tooltip: 'Audio Mixer',
          ),
        ],
      ),
    );
  }
}
