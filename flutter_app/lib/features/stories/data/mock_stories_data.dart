import 'models/story_model.dart';

/// Mock stories data for testing
class MockStoriesData {
  static List<Story> getStories() {
    return [
      Story(
        id: '1',
        userId: '101',
        username: 'sarah_jones',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        items: [
          StoryItem(
            id: 's1_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=1',
            createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          ),
          StoryItem(
            id: 's1_2',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=2',
            createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 50)),
          ),
        ],
      ),
      Story(
        id: '2',
        userId: '102',
        username: 'mike_wilson',
        userAvatar: 'https://i.pravatar.cc/150?img=12',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        items: [
          StoryItem(
            id: 's2_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=3',
            createdAt: DateTime.now().subtract(const Duration(hours: 5)),
          ),
        ],
      ),
      Story(
        id: '3',
        userId: '103',
        username: 'emma_davis',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
        isViewed: true,
        items: [
          StoryItem(
            id: 's3_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=4',
            createdAt: DateTime.now().subtract(const Duration(hours: 8)),
            isViewed: true,
          ),
          StoryItem(
            id: 's3_2',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=5',
            createdAt: DateTime.now().subtract(const Duration(hours: 7, minutes: 45)),
            isViewed: true,
          ),
          StoryItem(
            id: 's3_3',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=6',
            createdAt: DateTime.now().subtract(const Duration(hours: 7, minutes: 30)),
            isViewed: true,
          ),
        ],
      ),
      Story(
        id: '4',
        userId: '104',
        username: 'alex_brown',
        userAvatar: 'https://i.pravatar.cc/150?img=8',
        createdAt: DateTime.now().subtract(const Duration(hours: 12)),
        items: [
          StoryItem(
            id: 's4_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=7',
            createdAt: DateTime.now().subtract(const Duration(hours: 12)),
          ),
        ],
      ),
      Story(
        id: '5',
        userId: '105',
        username: 'sophia_miller',
        userAvatar: 'https://i.pravatar.cc/150?img=9',
        createdAt: DateTime.now().subtract(const Duration(hours: 15)),
        isViewed: true,
        items: [
          StoryItem(
            id: 's5_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=8',
            createdAt: DateTime.now().subtract(const Duration(hours: 15)),
            isViewed: true,
          ),
          StoryItem(
            id: 's5_2',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=9',
            createdAt: DateTime.now().subtract(const Duration(hours: 14, minutes: 30)),
            isViewed: true,
          ),
        ],
      ),
      Story(
        id: '6',
        userId: '106',
        username: 'james_taylor',
        userAvatar: 'https://i.pravatar.cc/150?img=15',
        createdAt: DateTime.now().subtract(const Duration(hours: 18)),
        items: [
          StoryItem(
            id: 's6_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=10',
            createdAt: DateTime.now().subtract(const Duration(hours: 18)),
          ),
        ],
      ),
      Story(
        id: '7',
        userId: '107',
        username: 'olivia_garcia',
        userAvatar: 'https://i.pravatar.cc/150?img=20',
        createdAt: DateTime.now().subtract(const Duration(hours: 20)),
        isViewed: true,
        items: [
          StoryItem(
            id: 's7_1',
            type: StoryType.image,
            url: 'https://picsum.photos/1080/1920?random=11',
            createdAt: DateTime.now().subtract(const Duration(hours: 20)),
            isViewed: true,
          ),
        ],
      ),
    ];
  }
}
