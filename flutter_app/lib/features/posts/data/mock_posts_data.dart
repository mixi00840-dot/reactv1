import 'models/post_model.dart';

/// Mock posts data
class MockPostsData {
  static List<Post> getPosts() {
    return [
      Post(
        id: '1',
        userId: '101',
        username: 'sarah_jones',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        imageUrls: [
          'https://picsum.photos/1080/1080?random=1',
        ],
        caption: 'Beautiful sunset at the beach 🌅✨ #sunset #beach #nature #photography',
        hashtags: ['sunset', 'beach', 'nature', 'photography'],
        likes: 12543,
        comments: 234,
        shares: 45,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      Post(
        id: '2',
        userId: '102',
        username: 'mike_wilson',
        userAvatar: 'https://i.pravatar.cc/150?img=12',
        imageUrls: [
          'https://picsum.photos/1080/1080?random=2',
          'https://picsum.photos/1080/1080?random=3',
          'https://picsum.photos/1080/1080?random=4',
        ],
        caption: 'Weekend vibes 💯 Having the best time with friends! #weekend #friends #fun',
        hashtags: ['weekend', 'friends', 'fun'],
        likes: 8934,
        comments: 156,
        shares: 23,
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      ),
      Post(
        id: '3',
        userId: '103',
        username: 'emma_davis',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        imageUrls: [
          'https://picsum.photos/1080/1080?random=5',
          'https://picsum.photos/1080/1080?random=6',
        ],
        caption: 'New collection drop! 🔥 Which one is your favorite? Link in bio! #fashion #style #ootd',
        hashtags: ['fashion', 'style', 'ootd'],
        likes: 23456,
        comments: 567,
        shares: 89,
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
        isLiked: true,
      ),
      Post(
        id: '4',
        userId: '104',
        username: 'alex_brown',
        userAvatar: 'https://i.pravatar.cc/150?img=8',
        imageUrls: [
          'https://picsum.photos/1080/1080?random=7',
        ],
        caption: 'Morning coffee ☕ Perfect way to start the day #coffee #morning #goodvibes',
        hashtags: ['coffee', 'morning', 'goodvibes'],
        likes: 5678,
        comments: 89,
        shares: 12,
        createdAt: DateTime.now().subtract(const Duration(hours: 12)),
      ),
      Post(
        id: '5',
        userId: '105',
        username: 'sophia_miller',
        userAvatar: 'https://i.pravatar.cc/150?img=9',
        imageUrls: [
          'https://picsum.photos/1080/1080?random=8',
          'https://picsum.photos/1080/1080?random=9',
          'https://picsum.photos/1080/1080?random=10',
          'https://picsum.photos/1080/1080?random=11',
        ],
        caption: 'Throwback to last summer vacation 🏖️ Can\'t wait for the next adventure! #travel #vacation #memories',
        hashtags: ['travel', 'vacation', 'memories'],
        likes: 15234,
        comments: 345,
        shares: 67,
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        isBookmarked: true,
      ),
    ];
  }

  static List<Comment> getComments(String postId) {
    return [
      Comment(
        id: 'c1',
        userId: '201',
        username: 'john_doe',
        userAvatar: 'https://i.pravatar.cc/150?img=13',
        text: 'Amazing! 🔥',
        likes: 23,
        createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
      ),
      Comment(
        id: 'c2',
        userId: '202',
        username: 'jane_smith',
        userAvatar: 'https://i.pravatar.cc/150?img=16',
        text: 'Love this so much! Where did you take this photo?',
        likes: 12,
        createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      ),
      Comment(
        id: 'c3',
        userId: '203',
        username: 'david_lee',
        userAvatar: 'https://i.pravatar.cc/150?img=18',
        text: 'Incredible work! 👏👏',
        likes: 45,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        isLiked: true,
      ),
    ];
  }
}
