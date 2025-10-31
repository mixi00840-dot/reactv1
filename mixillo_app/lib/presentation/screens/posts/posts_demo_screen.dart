import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'posts_grid_screen.dart';

/// Posts Demo Screen - Quick access to test Posts feature
/// Navigate here to see the Instagram-style grid feed
class PostsDemoScreen extends ConsumerWidget {
  const PostsDemoScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Posts Demo'),
          bottom: TabBar(
            isScrollable: false,
            tabs: const [
              Tab(icon: Icon(Icons.grid_on), text: 'Feed'),
              Tab(icon: Icon(Icons.video_library), text: 'Reels'),
              Tab(icon: Icon(Icons.trending_up), text: 'Trending'),
              Tab(icon: Icon(Icons.bookmark), text: 'Saved'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Feed (For You)
            const PostsGridScreen(),
            
            // Reels (Short videos)
            const PostsGridScreen(
              // Uses default feed but filters reels on backend
            ),
            
            // Trending Posts
            const PostsGridScreen(
              // Backend should have trending endpoint
            ),
            
            // Saved Posts
            const PostsGridScreen(
              // Fetches current user's saved posts
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () {
            _showFeatureInfo(context);
          },
          icon: const Icon(Icons.info_outline),
          label: const Text('Features'),
        ),
      ),
    );
  }

  void _showFeatureInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('✨ Posts Features'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('✅ 3-column Instagram grid'),
              SizedBox(height: 8),
              Text('✅ Video duration overlay'),
              SizedBox(height: 8),
              Text('✅ Multi-photo indicator'),
              SizedBox(height: 8),
              Text('✅ Likes/Comments stats'),
              SizedBox(height: 8),
              Text('✅ Pull-to-refresh'),
              SizedBox(height: 8),
              Text('✅ Infinite scroll pagination'),
              SizedBox(height: 8),
              Text('✅ Tap to view detail'),
              SizedBox(height: 8),
              Text('✅ Photo carousel (swipe)'),
              SizedBox(height: 8),
              Text('✅ Pinch-to-zoom'),
              SizedBox(height: 8),
              Text('✅ Like/Save with optimistic updates'),
              SizedBox(height: 8),
              Text('✅ Offline caching (15 min TTL)'),
              SizedBox(height: 8),
              Text('✅ Clean Architecture'),
              SizedBox(height: 16),
              Text(
                'Backend API Required:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text('• GET /api/content/feed'),
              Text('• GET /api/content/trending'),
              Text('• GET /api/content/:id'),
              Text('• POST /api/content/:id/like'),
              Text('• POST /api/content/:id/save'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it!'),
          ),
        ],
      ),
    );
  }
}
