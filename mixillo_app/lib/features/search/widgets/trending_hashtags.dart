import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class TrendingHashtags extends StatelessWidget {
  const TrendingHashtags({super.key});

  static final List<HashtagItem> _hashtags = [
    HashtagItem(
      tag: '#fyp',
      postCount: 1250000000,
      trending: true,
      rank: 1,
    ),
    HashtagItem(
      tag: '#viral',
      postCount: 890000000,
      trending: true,
      rank: 2,
    ),
    HashtagItem(
      tag: '#dance',
      postCount: 567000000,
      trending: false,
      rank: 3,
    ),
    HashtagItem(
      tag: '#comedy',
      postCount: 445000000,
      trending: true,
      rank: 4,
    ),
    HashtagItem(
      tag: '#music',
      postCount: 389000000,
      trending: false,
      rank: 5,
    ),
    HashtagItem(
      tag: '#fashion',
      postCount: 278000000,
      trending: true,
      rank: 6,
    ),
    HashtagItem(
      tag: '#food',
      postCount: 234000000,
      trending: false,
      rank: 7,
    ),
    HashtagItem(
      tag: '#fitness',
      postCount: 198000000,
      trending: false,
      rank: 8,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _hashtags.length,
        itemBuilder: (context, index) {
          final hashtag = _hashtags[index];
          return _buildHashtagCard(context, hashtag, isDark);
        },
      ),
    );
  }

  Widget _buildHashtagCard(BuildContext context, HashtagItem hashtag, bool isDark) {
    return GestureDetector(
      onTap: () {
        // Navigate to hashtag content
      },
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary.withOpacity(0.8),
              AppColors.secondary.withOpacity(0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.3),
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
                      if (hashtag.trending) ...[
                        const Icon(
                          Icons.local_fire_department,
                          color: Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 2),
                      ],
                      Text(
                        '#${hashtag.rank}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hashtag.trending)
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
                  hashtag.tag,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatCount(hashtag.postCount)} posts',
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
