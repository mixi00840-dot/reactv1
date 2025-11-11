import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

class SearchDiscoverPage extends StatefulWidget {
  const SearchDiscoverPage({super.key});

  @override
  State<SearchDiscoverPage> createState() => _SearchDiscoverPageState();
}

class _SearchDiscoverPageState extends State<SearchDiscoverPage> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  final List<String> _trendingHashtags = [
    '#dance',
    '#music',
    '#comedy',
    '#food',
    '#travel',
    '#fashion',
    '#fitness',
    '#art',
    '#gaming',
    '#pets',
  ];

  final List<TrendingMusic> _trendingMusic = [
    TrendingMusic(
      id: '1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      coverUrl: 'https://picsum.photos/100/100?random=1',
      usedCount: '2.5M',
    ),
    TrendingMusic(
      id: '2',
      title: 'As It Was',
      artist: 'Harry Styles',
      coverUrl: 'https://picsum.photos/100/100?random=2',
      usedCount: '1.8M',
    ),
    TrendingMusic(
      id: '3',
      title: 'Stay',
      artist: 'The Kid LAROI',
      coverUrl: 'https://picsum.photos/100/100?random=3',
      usedCount: '3.2M',
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextField(
                            controller: _searchController,
                            style: AppTheme.bodyStyle,
                            decoration: InputDecoration(
                              hintText: 'Search videos, users, sounds...',
                              hintStyle: AppTheme.bodyStyle.copyWith(
                                color: Colors.white38,
                              ),
                              prefixIcon: const Icon(
                                Iconsax.search_normal,
                                color: Colors.white60,
                              ),
                              suffixIcon: _isSearching
                                  ? IconButton(
                                      onPressed: () {
                                        setState(() {
                                          _searchController.clear();
                                          _isSearching = false;
                                        });
                                      },
                                      icon: const Icon(
                                        Iconsax.close_circle,
                                        color: Colors.white60,
                                      ),
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                            ),
                            onChanged: (value) {
                              setState(() {
                                _isSearching = value.isNotEmpty;
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Text(
                          'Cancel',
                          style: AppTheme.bodyStyle.copyWith(
                            color: AppColors.lightBlue,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: _isSearching
                      ? _buildSearchResults()
                      : _buildDiscoverContent(),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        Text(
          'Top Results',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        // Mock search results
        _buildSearchResultItem(
          'https://i.pravatar.cc/150?img=20',
          'sarah_johnson',
          'Sarah Johnson • 125K followers',
          SearchResultType.user,
        ),
        _buildSearchResultItem(
          'https://picsum.photos/100/100?random=10',
          '#dancechallenge',
          '2.5M videos',
          SearchResultType.hashtag,
        ),
        _buildSearchResultItem(
          'https://picsum.photos/100/100?random=11',
          'Original Sound',
          '1.2M videos',
          SearchResultType.sound,
        ),
      ],
    );
  }

  Widget _buildSearchResultItem(
    String imageUrl,
    String title,
    String subtitle,
    SearchResultType type,
  ) {
    IconData icon;
    switch (type) {
      case SearchResultType.user:
        icon = Iconsax.user;
        break;
      case SearchResultType.hashtag:
        icon = Iconsax.hashtag;
        break;
      case SearchResultType.sound:
        icon = Iconsax.music;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: type == SearchResultType.user
                  ? BoxShape.circle
                  : BoxShape.rectangle,
              borderRadius: type != SearchResultType.user
                  ? BorderRadius.circular(8)
                  : null,
            ),
            child: ClipRRect(
              borderRadius: type == SearchResultType.user
                  ? BorderRadius.circular(24)
                  : BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.bodyStyle.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 13,
                    color: Colors.white60,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            icon,
            size: 20,
            color: Colors.white38,
          ),
        ],
      ),
    );
  }

  Widget _buildDiscoverContent() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // Trending Hashtags
        Text(
          'Trending Hashtags',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _trendingHashtags.map((tag) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
              child: Text(
                tag,
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 14,
                  color: AppColors.lightBlue,
                  fontWeight: FontWeight.w500,
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        // Trending Music
        Text(
          'Trending Music',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ..._trendingMusic.map((music) => _buildMusicItem(music)),
        const SizedBox(height: 24),
        // Trending Videos Grid
        Text(
          'Trending Videos',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 0.6,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: 12,
          itemBuilder: (context, index) {
            return _buildVideoThumbnail(index);
          },
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildMusicItem(TrendingMusic music) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(
              imageUrl: music.coverUrl,
              width: 48,
              height: 48,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  music.title,
                  style: AppTheme.bodyStyle.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  music.artist,
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 13,
                    color: Colors.white60,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Icon(Iconsax.music, size: 16, color: Colors.white60),
              const SizedBox(height: 2),
              Text(
                music.usedCount,
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 11,
                  color: Colors.white38,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVideoThumbnail(int index) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: 'https://picsum.photos/200/300?random=$index',
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          bottom: 8,
          left: 8,
          child: Row(
            children: [
              const Icon(Iconsax.play, size: 12, color: Colors.white),
              const SizedBox(width: 4),
              Text(
                '${(index + 1) * 125}K',
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

enum SearchResultType {
  user,
  hashtag,
  sound,
}

class TrendingMusic {
  final String id;
  final String title;
  final String artist;
  final String coverUrl;
  final String usedCount;

  TrendingMusic({
    required this.id,
    required this.title,
    required this.artist,
    required this.coverUrl,
    required this.usedCount,
  });
}
