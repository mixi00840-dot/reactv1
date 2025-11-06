import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/premium_input_field.dart';
import '../providers/sound_provider.dart';
import '../models/sound_model.dart';

/// Sound Picker Panel - TikTok-style sound/music selector
class SoundPickerPanel extends StatefulWidget {
  final Function(SoundModel?) onSoundSelected;
  final VoidCallback onClose;
  final VoidCallback? onVoiceoverTap;

  const SoundPickerPanel({
    super.key,
    required this.onSoundSelected,
    required this.onClose,
    this.onVoiceoverTap,
  });

  @override
  State<SoundPickerPanel> createState() => _SoundPickerPanelState();
}

class _SoundPickerPanelState extends State<SoundPickerPanel>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? _playingSoundId;
  int _selectedTab = 0; // 0: Trending, 1: Search, 2: Favorites

  @override
  void initState() {
    super.initState();
    _loadSounds();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _loadSounds() async {
    final provider = context.read<SoundProvider>();
    await provider.loadTrendingSounds();
    await provider.loadFeaturedSounds();
  }

  Future<void> _playPreview(SoundModel sound) async {
    if (_playingSoundId == sound.id) {
      await _audioPlayer.stop();
      setState(() {
        _playingSoundId = null;
      });
      return;
    }

    try {
      await _audioPlayer.play(UrlSource(sound.audioUrl));
      setState(() {
        _playingSoundId = sound.id;
      });

      // Auto-stop after 15 seconds
      Future.delayed(const Duration(seconds: 15), () {
        if (_playingSoundId == sound.id && mounted) {
          _audioPlayer.stop();
          setState(() {
            _playingSoundId = null;
          });
        }
      });
    } catch (e) {
      debugPrint('Error playing sound: $e');
    }
  }

  void _onSearchChanged(String query) {
    if (query.isEmpty) {
      setState(() {
        _selectedTab = 0;
      });
    } else {
      setState(() {
        _selectedTab = 1;
      });
      context.read<SoundProvider>().searchSounds(query);
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SoundProvider>();
    final selectedSound = provider.selectedSound.sound;

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
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
                  'Add Sound',
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

          // Search Bar
          Padding(
            padding: AppSpacing.screenPadding(),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              style: AppTypography.bodyMedium(context).copyWith(
                color: Colors.white,
              ),
              decoration: InputDecoration(
                hintText: 'Search sounds...',
                hintStyle: AppTypography.bodyMedium(context).copyWith(
                  color: Colors.white.withOpacity(0.5),
                ),
                prefixIcon: const Icon(Icons.search, color: Colors.white70),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  borderSide: BorderSide.none,
                ),
                contentPadding: AppSpacing.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
              ),
            ),
          ),

          // Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildTab('Trending', 0),
                const SizedBox(width: 16),
                _buildTab('Favorites', 2),
                const Spacer(),
                // Voiceover Button
                if (widget.onVoiceoverTap != null)
                  TextButton.icon(
                    onPressed: widget.onVoiceoverTap,
                    icon: const Icon(Icons.mic, color: AppColors.primary, size: 20),
                    label: Text(
                      'Voiceover',
                      style: AppTypography.labelMedium(context).copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Sound List
          Expanded(
            child: _buildSoundList(provider, selectedSound),
          ),

          // Selected Sound Info
          if (selectedSound != null) _buildSelectedSoundInfo(selectedSound, provider),
        ],
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
        ),
        child: Text(
          label,
          style: AppTypography.labelMedium(context).copyWith(
            color: isSelected ? Colors.white : Colors.white70,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSoundList(SoundProvider provider, SoundModel? selectedSound) {
    List<SoundModel> sounds = [];

    if (_selectedTab == 0) {
      sounds = provider.trendingSounds;
    } else if (_selectedTab == 1) {
      sounds = provider.searchResults;
    } else if (_selectedTab == 2) {
      sounds = provider.featuredSounds; // TODO: Add favorites
    }

    if (provider.isLoadingSounds || provider.isSearching) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (sounds.isEmpty) {
      return Center(
        child: Text(
          _selectedTab == 1 ? 'No sounds found' : 'No sounds available',
          style: AppTypography.bodyMedium(context).copyWith(
            color: Colors.white70,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: AppSpacing.screenPadding(),
      itemCount: sounds.length,
      itemBuilder: (context, index) {
        final sound = sounds[index];
        final isSelected = selectedSound?.id == sound.id;
        final isPlaying = _playingSoundId == sound.id;

        return _buildSoundItem(sound, isSelected, isPlaying, provider);
      },
    );
  }

  Widget _buildSoundItem(
    SoundModel sound,
    bool isSelected,
    bool isPlaying,
    SoundProvider provider,
  ) {
    return GestureDetector(
      onTap: () {
        provider.selectSound(sound);
        widget.onSoundSelected(sound);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.2)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            // Cover Image
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                color: Colors.white.withOpacity(0.1),
              ),
              child: sound.coverUrl != null && sound.coverUrl!.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                      child: CachedNetworkImage(
                        imageUrl: sound.coverUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.music_note,
                          color: Colors.white70,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.music_note,
                      color: Colors.white70,
                      size: 32,
                    ),
            ),
            const SizedBox(width: 12),

            // Sound Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sound.title,
                    style: AppTypography.titleMedium(context).copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    sound.artist,
                    style: AppTypography.bodySmall(context).copyWith(
                      color: Colors.white70,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (sound.duration > 0)
                        Text(
                          _formatDuration(sound.duration),
                          style: AppTypography.labelSmall(context).copyWith(
                            color: Colors.white60,
                          ),
                        ),
                      if (sound.duration > 0 && sound.usageCount > 0)
                        const Text(' • ', style: TextStyle(color: Colors.white60)),
                      if (sound.usageCount > 0)
                        Text(
                          '${sound.usageCount} uses',
                          style: AppTypography.labelSmall(context).copyWith(
                            color: Colors.white60,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // Play/Select Button
            IconButton(
              icon: Icon(
                isPlaying ? Icons.pause_circle : Icons.play_circle,
                color: isSelected ? AppColors.primary : Colors.white,
                size: 32,
              ),
              onPressed: () {
                if (isPlaying) {
                  _playPreview(sound);
                } else {
                  _playPreview(sound);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectedSoundInfo(SoundModel sound, SoundProvider provider) {
    return Container(
      padding: AppSpacing.screenPadding(),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        border: Border(
          top: BorderSide(color: AppColors.primary, width: 1),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Selected: ${sound.displayName}',
                  style: AppTypography.bodyMedium(context).copyWith(
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Volume Controls
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Original Sound',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Slider(
                      value: provider.selectedSound.originalVolume,
                      onChanged: (value) {
                        provider.setOriginalVolume(value);
                      },
                      activeColor: AppColors.primary,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Music',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Slider(
                      value: provider.selectedSound.musicVolume,
                      onChanged: (value) {
                        provider.setMusicVolume(value);
                      },
                      activeColor: AppColors.primary,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

