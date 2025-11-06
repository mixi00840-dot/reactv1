import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_router.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/trending_hashtags.dart';
import '../widgets/user_search_result.dart';
import '../widgets/sound_search_result.dart';
import '../widgets/search_history_widget.dart';
import '../models/trending_model.dart';
import '../providers/search_provider.dart';
import '../../feed/models/video_model.dart';

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


  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _searchFocus.addListener(_onFocusChange);
    
    // Load trending content
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SearchProvider>().initialize();
    });
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
    
    // Debounce search
    if (query.isNotEmpty && query.length >= 2) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted && _searchController.text == query) {
          final type = _selectedFilter == 'All' 
              ? 'all'
              : _selectedFilter.toLowerCase();
          context.read<SearchProvider>().search(query, type: type);
        }
      });
    } else {
      context.read<SearchProvider>().clearSearch();
    }
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
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        final videos = provider.trendingVideos;
        
        if (videos.isEmpty && !provider.isLoading) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No trending videos available'),
            ),
          );
        }
        
        if (provider.isLoading && videos.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        return MasonryGridView.count(
          padding: const EdgeInsets.all(2),
          crossAxisCount: 2,
          mainAxisSpacing: 2,
          crossAxisSpacing: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: videos.length,
          itemBuilder: (context, index) {
            final video = videos[index];
            return _buildVideoThumbnail(video, index);
          },
        );
      },
    );
  }

  Widget _buildVideoThumbnail(TrendingVideoModel video, int index) {
    return GestureDetector(
      onTap: () {
        // Navigate to video player
        // Can use video feed screen with specific video
      },
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: index % 3 == 0 ? 1.0 : 9 / 16,
            child: CachedNetworkImage(
              imageUrl: video.thumbnailUrl,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: Colors.grey[800],
                child: const Center(
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                color: Colors.grey[800],
                child: const Icon(Icons.error, color: Colors.white54),
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
                video.duration ?? '0:00',
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
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final results = provider.searchResults;
        if (results == null) {
          return const Center(
            child: Text('No results found'),
          );
        }
        
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Top Users
            if (results.users.isNotEmpty) ...[
              const Text(
                'Users',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...results.users.take(3).map((user) => _buildUserResult(user)),
              const SizedBox(height: 24),
            ],
            
            // Hashtags
            if (results.hashtags.isNotEmpty) ...[
              const Text(
                'Hashtags',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...results.hashtags.take(5).map((hashtag) => _buildHashtagResult(hashtag)),
              const SizedBox(height: 24),
            ],
            
            // Videos
            if (results.videos.isNotEmpty) ...[
              const Text(
                'Videos',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              _buildVideoGrid(results.videos),
            ],
          ],
        );
      },
    );
  }
  
  Widget _buildUserResult(TrendingUserModel user) {
    return UserSearchResultWidget(
      user: UserSearchResult(
        id: user.id,
        username: user.username,
        displayName: user.displayName ?? user.username,
        avatarUrl: user.avatar ?? '',
        followers: user.followers,
        isVerified: user.isVerified,
        isFollowing: user.isFollowing ?? false,
      ),
      onTap: () {
        // Navigate to user profile
        // context.push('/profile/${user.id}');
      },
      onFollow: () {
        // Follow/unfollow user
      },
    );
  }
  
  Widget _buildHashtagResult(TrendingHashtagModel hashtag) {
    return ListTile(
      leading: const Icon(Icons.tag),
      title: Text(
        hashtag.hashtag,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Text('${hashtag.videoCount} videos'),
      trailing: hashtag.isTrending
          ? const Icon(Icons.trending_up, color: Colors.orange)
          : null,
      onTap: () {
        // Navigate to hashtag page
        // context.push('/hashtag/${hashtag.hashtag.replaceAll('#', '')}');
      },
    );
  }

  Widget _buildUserResults() {
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final users = provider.searchResults?.users ?? [];
        
        if (users.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No users found'),
            ),
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            return _buildUserResult(user);
          },
        );
      },
    );
  }

  Widget _buildVideoResults() {
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        final videos = provider.searchResults?.videos ?? [];
        return _buildVideoGrid(videos);
      },
    );
  }

  Widget _buildVideoGrid(List<TrendingVideoModel> videos) {
    if (videos.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('No videos found'),
        ),
      );
    }
    
    return MasonryGridView.count(
      padding: const EdgeInsets.all(2),
      crossAxisCount: 3,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: videos.length,
      itemBuilder: (context, index) {
        return _buildVideoThumbnail(videos[index], index);
      },
    );
  }

  Widget _buildSoundResults() {
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final sounds = provider.searchResults?.sounds ?? [];
        
        if (sounds.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No sounds found'),
            ),
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: sounds.length,
          itemBuilder: (context, index) {
            final sound = sounds[index];
            return SoundSearchResultWidget(
              sound: SoundSearchResult(
                id: sound['id'] ?? sound['_id'] ?? '',
                name: sound['name'] ?? '',
                artist: sound['artist'] ?? '',
                duration: sound['duration']?.toString() ?? '0:00',
                usageCount: sound['usageCount'] ?? sound['usage_count'] ?? 0,
                thumbnailUrl: sound['thumbnailUrl'] ?? sound['thumbnail_url'] ?? '',
              ),
              onTap: () {},
              onUse: () {},
            );
          },
        );
      },
    );
  }

  Widget _buildHashtagResults() {
    return Consumer<SearchProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final hashtags = provider.searchResults?.hashtags ?? provider.trendingHashtags;
        
        if (hashtags.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No hashtags found'),
            ),
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: hashtags.length,
          itemBuilder: (context, index) {
            return _buildHashtagResult(hashtags[index]);
          },
        );
      },
    );
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

// Models (kept for backward compatibility with widgets)
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
