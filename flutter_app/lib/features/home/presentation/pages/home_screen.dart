import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/content_provider.dart';
import '../../../../core/routing/app_routes.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(contentFeedProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final contentState = ref.watch(contentFeedProvider);
    final cartItemCount = ref.watch(cartItemCountProvider);
    final unreadNotifications = ref.watch(unreadNotificationsCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mixillo'),
        actions: [
          // Notifications
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push(AppRoutes.notifications),
              ),
              if (unreadNotifications > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      unreadNotifications > 99 ? '99+' : '$unreadNotifications',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          // Cart
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () => context.push(AppRoutes.cart),
              ),
              if (cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      cartItemCount > 99 ? '99+' : '$cartItemCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: contentState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.read(contentFeedProvider.notifier).refresh();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (contents) {
          if (contents.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.video_library, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No videos yet'),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      // Navigate to create
                    },
                    child: const Text('Create your first video'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(contentFeedProvider.notifier).refresh();
            },
            child: ListView.builder(
              controller: _scrollController,
              itemCount: contents.length + 1,
              itemBuilder: (context, index) {
                if (index == contents.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                final content = contents[index];
                return _buildContentCard(content);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildContentCard(dynamic content) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video thumbnail
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: Colors.grey.shade300,
              child: const Center(
                child: Icon(Icons.play_circle_outline, size: 64),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Caption
                Text(
                  content.caption ?? 'No caption',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 8),

                // Stats
                Row(
                  children: [
                    const Icon(Icons.visibility, size: 16),
                    const SizedBox(width: 4),
                    Text('${content.views ?? 0}'),
                    const SizedBox(width: 16),
                    const Icon(Icons.favorite, size: 16),
                    const SizedBox(width: 4),
                    Text('${content.likes ?? 0}'),
                    const SizedBox(width: 16),
                    const Icon(Icons.comment, size: 16),
                    const SizedBox(width: 4),
                    Text('${content.comments ?? 0}'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
