/// Mock profile data for testing and development

class MockProfileData {
  static Map<String, dynamic> getUserProfile() => {
    'id': 'user123',
    'username': 'user_demo',
    'email': 'user@example.com',
    'displayName': 'Demo User',
    'avatar': 'https://i.pravatar.cc/150?img=1',
    'bio': 'Flutter developer and content creator',
    'followers': 1234,
    'following': 567,
    'posts': 89,
    'isVerified': true,
    'createdAt': DateTime.now().subtract(const Duration(days: 365)).toIso8601String(),
  };

  static List<Map<String, dynamic>> getUserContent() => [
    {
      'id': 'content1',
      'type': 'video',
      'thumbnailUrl': 'https://picsum.photos/300/400?random=1',
      'likes': 1234,
      'views': 5678,
      'createdAt': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
    },
    {
      'id': 'content2', 
      'type': 'image',
      'thumbnailUrl': 'https://picsum.photos/300/400?random=2',
      'likes': 567,
      'views': 2341,
      'createdAt': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
    },
    {
      'id': 'content3',
      'type': 'video',
      'thumbnailUrl': 'https://picsum.photos/300/400?random=3',
      'likes': 890,
      'views': 3456,
      'createdAt': DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
    },
  ];

  static List<Map<String, dynamic>> getUserStats() => [
    {
      'label': 'Total Likes',
      'value': '12.3K',
      'icon': 'favorite',
    },
    {
      'label': 'Total Views',
      'value': '156K',
      'icon': 'visibility',
    },
    {
      'label': 'Engagement',
      'value': '8.9%',
      'icon': 'trending_up',
    },
  ];
}