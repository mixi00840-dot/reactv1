import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../models/trending_model.dart';
import '../providers/search_provider.dart';

class TrendingHashtags extends StatelessWidget {
  const TrendingHashtags({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        final hashtags = provider.trendingHashtags;
        
        if (hashtags.isEmpty) {
          return const SizedBox(
            height: 100,
            child: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        return SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: hashtags.length,
            itemBuilder: (context, index) {
              final hashtag = hashtags[index];
              return _buildHashtagCard(context, hashtag);
            },
          ),
        );
      },
    );
  }

  Widget _buildHashtagCard(BuildContext context, TrendingHashtagModel hashtag) {
    return GestureDetector(
      onTap: () {
        // Navigate to hashtag content
        // context.push('/hashtag/${hashtag.hashtag.replaceAll('#', '')}');
      },
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: hashtag.isTrending
                ? [
                    AppColors.primary.withOpacity(0.8),
                    AppColors.secondary.withOpacity(0.8),
                  ]
                : [
                    Colors.grey[800]!.withOpacity(0.8),
                    Colors.grey[700]!.withOpacity(0.8),
                  ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: (hashtag.isTrending ? AppColors.primary : Colors.grey)
                  .withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      if (hashtag.isTrending) ...[
                        const Icon(
                          Icons.local_fire_department,
                          color: Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 2),
                      ],
                      Text(
                        '${hashtag.videoCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hashtag.isTrending)
                  const Icon(
                    Icons.trending_up,
                    color: Colors.white,
                    size: 16,
                  ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hashtag.hashtag,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatCount(hashtag.videoCount)} videos',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000000) {
      return '${(count / 1000000000).toStringAsFixed(1)}B';
    } else if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

// Legacy model for backward compatibility
class HashtagItem {
  final String tag;
  final int postCount;
  final bool trending;
  final int rank;

  HashtagItem({
    required this.tag,
    required this.postCount,
    required this.trending,
    required this.rank,
  });
}
