import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/trending_hashtags.dart';
import '../widgets/user_search_result.dart';
import '../widgets/sound_search_result.dart';
import '../widgets/search_history_widget.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  late TabController _tabController;
  
  bool _isSearching = false;
  String _searchQuery = '';
  String _selectedFilter = 'All';

  final List<String> _filters = ['All', 'Users', 'Videos', 'Sounds', 'Hashtags'];

  // Sample trending videos
  final List<TrendingVideo> _trendingVideos = List.generate(
    20,
    (index) => TrendingVideo(
      id: '$index',
      thumbnailUrl: 'https://picsum.photos/400/600?random=$index',
      title: 'Trending Video ${index + 1}',
      views: (index + 1) * 125000,
      duration: '${(index % 60).toString().padLeft(2, '0')}:${((index * 7) % 60).toString().padLeft(2, '0')}',
    ),
  );

  // Sample user results
  final List<UserSearchResult> _userResults = List.generate(
    10,
    (index) => UserSearchResult(
      id: '$index',
      username: '@user${index + 1}',
      displayName: 'User ${index + 1}',
      avatarUrl: 'https://i.pravatar.cc/150?img=${index + 1}',
      followers: (index + 1) * 12500,
      isVerified: index % 3 == 0,
      isFollowing: index % 2 == 0,
    ),
  );

  // Sample sound results
  final List<SoundSearchResult> _soundResults = List.generate(
    10,
    (index) => SoundSearchResult(
      id: '$index',
      name: 'Sound ${index + 1}',
      artist: 'Artist ${index + 1}',
      duration: '${(index % 3) + 1}:${((index * 7) % 60).toString().padLeft(2, '0')}',
      usageCount: (index + 1) * 8500,
      thumbnailUrl: 'https://i.pravatar.cc/150?img=${index + 10}',
    ),
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _searchFocus.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isSearching = _searchFocus.hasFocus;
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      _isSearching = query.isNotEmpty;
    });
  }

  void _clearSearch() {
    setState(() {
      _searchController.clear();
      _searchQuery = '';
      _isSearching = false;
    });
    _searchFocus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: SearchBarWidget(
          controller: _searchController,
          focusNode: _searchFocus,
          onChanged: _onSearchChanged,
          onClear: _clearSearch,
        ),
      ),
      body: Column(
        children: [
          // Filter Chips
          if (_isSearching && _searchQuery.isNotEmpty)
            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filters.length,
                itemBuilder: (context, index) {
                  final filter = _filters[index];
                  final isSelected = _selectedFilter == filter;
                  
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedFilter = filter;
                        });
                      },
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : null,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                },
              ),
            ),
          
          // Content
          Expanded(
            child: _isSearching && _searchQuery.isNotEmpty
                ? _buildSearchResults()
                : _buildDiscoverContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    switch (_selectedFilter) {
      case 'Users':
        return _buildUserResults();
      case 'Videos':
        return _buildVideoResults();
      case 'Sounds':
        return _buildSoundResults();
      case 'Hashtags':
        return _buildHashtagResults();
      default:
        return _buildAllResults();
    }
  }

  Widget _buildDiscoverContent() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search History
          SearchHistoryWidget(
            onHistoryTap: (query) {
              _searchController.text = query;
              _onSearchChanged(query);
            },
          ),
          
          const SizedBox(height: 16),
          
          // Trending Hashtags
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Trending Hashtags',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const TrendingHashtags(),
          
          const SizedBox(height: 24),
          
          // Discover Videos
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Discover',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _buildDiscoverGrid(),
        ],
      ),
    );
  }

  Widget _buildDiscoverGrid() {
    return MasonryGridView.count(
      padding: const EdgeInsets.all(2),
      crossAxisCount: 2,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _trendingVideos.length,
      itemBuilder: (context, index) {
        final video = _trendingVideos[index];
        return _buildVideoThumbnail(video, index);
      },
    );
  }

  Widget _buildVideoThumbnail(TrendingVideo video, int index) {
    return GestureDetector(
      onTap: () {
        // Navigate to video player
      },
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: index % 3 == 0 ? 1.0 : 9 / 16,
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(video.thumbnailUrl),
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
                    Colors.black.withOpacity(0.5),
                  ],
                ),
              ),
            ),
          ),
          
          // Duration
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                video.duration,
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
            right: 8,
            child: Row(
              children: [
                const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 14,
                ),
                const SizedBox(width: 2),
                Text(
                  _formatCount(video.views),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAllResults() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top Users
        if (_userResults.isNotEmpty) ...[
          const Text(
            'Users',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(
            _userResults.take(3).length,
            (index) => UserSearchResultWidget(
              user: _userResults[index],
              onTap: () {},
              onFollow: () {},
            ),
          ),
          const SizedBox(height: 24),
        ],
        
        // Videos
        const Text(
          'Videos',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildVideoGrid(),
      ],
    );
  }

  Widget _buildUserResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _userResults.length,
      itemBuilder: (context, index) {
        return UserSearchResultWidget(
          user: _userResults[index],
          onTap: () {},
          onFollow: () {},
        );
      },
    );
  }

  Widget _buildVideoResults() {
    return _buildVideoGrid();
  }

  Widget _buildVideoGrid() {
    return MasonryGridView.count(
      padding: const EdgeInsets.all(2),
      crossAxisCount: 3,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _trendingVideos.length,
      itemBuilder: (context, index) {
        return _buildVideoThumbnail(_trendingVideos[index], index);
      },
    );
  }

  Widget _buildSoundResults() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _soundResults.length,
      itemBuilder: (context, index) {
        return SoundSearchResultWidget(
          sound: _soundResults[index],
          onTap: () {},
          onUse: () {},
        );
      },
    );
  }

  Widget _buildHashtagResults() {
    return const TrendingHashtags();
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

// Models
class TrendingVideo {
  final String id;
  final String thumbnailUrl;
  final String title;
  final int views;
  final String duration;

  TrendingVideo({
    required this.id,
    required this.thumbnailUrl,
    required this.title,
    required this.views,
    required this.duration,
  });
}

class UserSearchResult {
  final String id;
  final String username;
  final String displayName;
  final String avatarUrl;
  final int followers;
  final bool isVerified;
  final bool isFollowing;

  UserSearchResult({
    required this.id,
    required this.username,
    required this.displayName,
    required this.avatarUrl,
    required this.followers,
    required this.isVerified,
    required this.isFollowing,
  });
}

class SoundSearchResult {
  final String id;
  final String name;
  final String artist;
  final String duration;
  final int usageCount;
  final String thumbnailUrl;

  SoundSearchResult({
    required this.id,
    required this.name,
    required this.artist,
    required this.duration,
    required this.usageCount,
    required this.thumbnailUrl,
  });
}
