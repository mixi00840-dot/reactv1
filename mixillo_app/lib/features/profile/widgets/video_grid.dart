import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../../core/theme/app_colors.dart';

class VideoGrid extends StatefulWidget {
  final String userId;
  final String type; // 'videos', 'photos', 'liked', 'saved'

  const VideoGrid({
    super.key,
    required this.userId,
    required this.type,
  });

  @override
  State<VideoGrid> createState() => _VideoGridState();
}

class _VideoGridState extends State<VideoGrid> {
  // Sample video/photo data - Replace with API
  final List<MediaItem> _mediaItems = List.generate(
    24,
    (index) => MediaItem(
      id: '$index',
      thumbnailUrl: 'https://picsum.photos/400/600?random=$index',
      type: index % 3 == 0 ? 'photo' : 'video',
      views: (index + 1) * 12500,
      duration: index % 3 == 0 ? null : '${(index % 60).toString().padLeft(2, '0')}:${((index * 7) % 60).toString().padLeft(2, '0')}',
    ),
  );

  @override
  Widget build(BuildContext context) {
    if (_mediaItems.isEmpty) {
      return _buildEmptyState();
    }

    return MasonryGridView.count(
      padding: const EdgeInsets.all(2),
      crossAxisCount: 3,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
      itemCount: _mediaItems.length,
      itemBuilder: (context, index) {
        return _MediaGridItem(
          item: _mediaItems[index],
          onTap: () {
            // Navigate to video player or photo viewer
          },
        );
      },
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    IconData icon;
    String title;
    String message;

    switch (widget.type) {
      case 'photos':
        icon = Icons.photo_library_outlined;
        title = 'No Photos';
        message = 'Photos you post will appear here';
        break;
      case 'liked':
        icon = Icons.favorite_border;
        title = 'No Liked Videos';
        message = 'Videos you like will appear here';
        break;
      case 'saved':
        icon = Icons.bookmark_border;
        title = 'No Saved Videos';
        message = 'Videos you save will appear here';
        break;
      default:
        icon = Icons.videocam_outlined;
        title = 'No Videos';
        message = 'Videos you post will appear here';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _MediaGridItem extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onTap;

  const _MediaGridItem({
    required this.item,
    required this.onTap,
  });

  String _formatViews(int views) {
    if (views >= 1000000) {
      return '${(views / 1000000).toStringAsFixed(1)}M';
    } else if (views >= 1000) {
      return '${(views / 1000).toStringAsFixed(1)}K';
    }
    return views.toString();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        fit: StackFit.loose,
        children: [
          // Thumbnail
          AspectRatio(
            aspectRatio: item.type == 'photo' ? 1.0 : 9 / 16,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                image: DecorationImage(
                  image: NetworkImage(item.thumbnailUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),

          // Gradient Overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.3),
                  ],
                ),
              ),
            ),
          ),

          // Play Icon (for videos)
          if (item.type == 'video')
            const Positioned(
              top: 8,
              right: 8,
              child: Icon(
                Icons.play_arrow,
                color: Colors.white,
                size: 20,
                shadows: [
                  Shadow(
                    color: Colors.black,
                    blurRadius: 4,
                  ),
                ],
              ),
            ),

          // Duration (for videos)
          if (item.duration != null)
            Positioned(
              bottom: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.duration!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

          // Views
          Positioned(
            bottom: 8,
            left: 8,
            child: Row(
              children: [
                const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 14,
                  shadows: [
                    Shadow(
                      color: Colors.black,
                      blurRadius: 4,
                    ),
                  ],
                ),
                const SizedBox(width: 2),
                Text(
                  _formatViews(item.views),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    shadows: [
                      Shadow(
                        color: Colors.black,
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MediaItem {
  final String id;
  final String thumbnailUrl;
  final String type; // 'video' or 'photo'
  final int views;
  final String? duration;

  MediaItem({
    required this.id,
    required this.thumbnailUrl,
    required this.type,
    required this.views,
    this.duration,
  });
}
