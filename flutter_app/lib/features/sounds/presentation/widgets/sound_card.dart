import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/sound_model.dart';
import '../../providers/sound_player_provider.dart';

/// Sound card widget displaying sound information
/// TikTok-style design with album art, title, artist, and play button
class SoundCard extends ConsumerStatefulWidget {
  final Sound sound;
  final bool isSelected;
  final VoidCallback? onTap;

  const SoundCard({
    super.key,
    required this.sound,
    this.isSelected = false,
    this.onTap,
  });

  @override
  ConsumerState<SoundCard> createState() => _SoundCardState();
}

class _SoundCardState extends ConsumerState<SoundCard> {
  void _onPlayPause() {
    ref.read(soundPlayerProvider.notifier).togglePlayPause(widget.sound);
  }

  @override
  Widget build(BuildContext context) {
    final playerState = ref.watch(soundPlayerProvider);
    final isPlaying = playerState.currentSound?.id == widget.sound.id &&
        playerState.isPlaying;
    final isLoading = playerState.currentSound?.id == widget.sound.id &&
        playerState.isLoading;

    return InkWell(
      onTap: widget.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: widget.isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          border: Border(
            left: widget.isSelected
                ? BorderSide(color: AppColors.primary, width: 3)
                : BorderSide.none,
          ),
        ),
        child: Row(
          children: [
            // Album Art
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: widget.sound.albumArt != null
                    ? CachedNetworkImage(
                        imageUrl: widget.sound.albumArt!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: Icon(
                            Iconsax.musicnote,
                            color: AppColors.textSecondary,
                            size: 24,
                          ),
                        ),
                        errorWidget: (context, url, error) => const Center(
                          child: Icon(
                            Iconsax.musicnote,
                            color: AppColors.textSecondary,
                            size: 24,
                          ),
                        ),
                      )
                    : const Center(
                        child: Icon(
                          Iconsax.musicnote,
                          color: AppColors.textSecondary,
                          size: 24,
                        ),
                      ),
              ),
            ),

            const SizedBox(width: 12),

            // Sound Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    widget.sound.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: widget.isSelected ? AppColors.primary : Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  
                  // Artist
                  Text(
                    widget.sound.artistName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  
                  // Stats: Duration + Use count
                  Row(
                    children: [
                      Icon(
                        Iconsax.clock,
                        size: 12,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        widget.sound.formattedDuration,
                        style: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(
                        Iconsax.video_play,
                        size: 12,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.sound.formattedUseCount} videos',
                        style: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                      if (widget.sound.isTrending) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF3B30),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.local_fire_department,
                                size: 10,
                                color: Colors.white,
                              ),
                              SizedBox(width: 2),
                              Text(
                                'Trending',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Play/Pause Button
            GestureDetector(
              onTap: _onPlayPause,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isPlaying || isLoading
                      ? AppColors.primary.withValues(alpha: 0.2)
                      : Colors.white.withValues(alpha: 0.1),
                  border: Border.all(
                    color: isPlaying || isLoading
                        ? AppColors.primary
                        : Colors.white.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: isLoading
                    ? Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: AppColors.primary,
                            strokeWidth: 2,
                          ),
                        ),
                      )
                    : Icon(
                        isPlaying ? Icons.pause : Icons.play_arrow,
                        color: isPlaying ? AppColors.primary : Colors.white,
                        size: 24,
                      ),
              ),
            ),

            const SizedBox(width: 8),

            // Select/Check Icon
            Icon(
              widget.isSelected ? Icons.check_circle : Icons.circle_outlined,
              color: widget.isSelected ? AppColors.primary : AppColors.textTertiary,
              size: 28,
            ),
          ],
        ),
      ),
    );
  }
}

