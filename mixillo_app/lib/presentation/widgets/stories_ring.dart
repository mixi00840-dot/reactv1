import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/story.dart';
import '../providers/stories_providers.dart';
import '../screens/stories/stories_viewer_screen.dart';

/// Instagram-style stories ring at the top of home screen
/// Shows circular avatars with gradient ring for unviewed stories
class StoriesRing extends ConsumerStatefulWidget {
  const StoriesRing({super.key});

  @override
  ConsumerState<StoriesRing> createState() => _StoriesRingState();
}

class _StoriesRingState extends ConsumerState<StoriesRing> {
  @override
  void initState() {
    super.initState();
    // Load stories on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(storiesNotifierProvider.notifier).loadStories();
      ref.read(storiesNotifierProvider.notifier).loadMyStories();
    });
  }

  @override
  Widget build(BuildContext context) {
    final storiesState = ref.watch(storiesNotifierProvider);

    if (storiesState.isLoading && storiesState.storyGroups.isEmpty) {
      return const SizedBox(
        height: 100,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (storiesState.storyGroups.isEmpty && storiesState.currentUserStories.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        itemCount: storiesState.storyGroups.length + 1, // +1 for "Your Story"
        itemBuilder: (context, index) {
          if (index == 0) {
            // "Your Story" - first item
            return _buildYourStory(storiesState.currentUserStories);
          } else {
            final storyGroup = storiesState.storyGroups[index - 1];
            return _buildStoryAvatar(
              storyGroup: storyGroup,
              groupIndex: index - 1,
            );
          }
        },
      ),
    );
  }

  Widget _buildYourStory(List<Story> myStories) {
    return GestureDetector(
      onTap: () {
        if (myStories.isNotEmpty) {
          // View own stories
          final storyGroup = StoryGroup(
            user: StoryUser(
              id: 'me',
              username: 'Your Story',
              avatar: myStories.first.creator.avatar,
            ),
            stories: myStories,
            hasUnviewed: false,
          );

          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => StoriesViewerScreen(
                storyGroups: [storyGroup],
                initialGroupIndex: 0,
              ),
            ),
          );
        } else {
          // TODO: Open camera to create story
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Camera feature coming soon!')),
          );
        }
      },
      child: Container(
        width: 70,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Stack(
              children: [
                Container(
                  width: 66,
                  height: 66,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.grey.shade300,
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.person, size: 32, color: Colors.grey),
                  ),
                ),
                if (myStories.isEmpty)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(
                        Icons.add,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              myStories.isEmpty ? 'Your Story' : 'You',
              style: const TextStyle(fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryAvatar({
    required StoryGroup storyGroup,
    required int groupIndex,
  }) {
    return GestureDetector(
      onTap: () {
        final storiesState = ref.read(storiesNotifierProvider);
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => StoriesViewerScreen(
              storyGroups: storiesState.storyGroups,
              initialGroupIndex: groupIndex,
            ),
          ),
        );
      },
      child: Container(
        width: 70,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Container(
              width: 66,
              height: 66,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: storyGroup.hasUnviewed
                    ? const LinearGradient(
                        colors: [
                          Color(0xFFF58529),
                          Color(0xFFDD2A7B),
                          Color(0xFF8134AF),
                        ],
                        begin: Alignment.topRight,
                        end: Alignment.bottomLeft,
                      )
                    : null,
                border: !storyGroup.hasUnviewed
                    ? Border.all(color: Colors.grey.shade300, width: 2)
                    : null,
              ),
              padding: const EdgeInsets.all(3),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: CircleAvatar(
                  radius: 27,
                  backgroundImage: storyGroup.user.avatar != null
                      ? CachedNetworkImageProvider(storyGroup.user.avatar!)
                      : null,
                  child: storyGroup.user.avatar == null
                      ? Text(
                          storyGroup.user.username[0].toUpperCase(),
                          style: const TextStyle(fontSize: 20),
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              storyGroup.user.username,
              style: TextStyle(
                fontSize: 12,
                fontWeight: storyGroup.hasUnviewed
                    ? FontWeight.w600
                    : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
