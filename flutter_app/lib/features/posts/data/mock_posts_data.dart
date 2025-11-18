/// Mock data for posts/social content

final List<Map<String, dynamic>> mockPosts = [
  {
    'id': 'post1',
    'userId': 'user1',
    'username': 'fashionista_maya',
    'userAvatar': 'https://i.pravatar.cc/150?img=1',
    'caption':
        'New summer vibes! ☀️ #SummerFashion #OOTD #StyleInspiration',
    'imageUrl': 'https://picsum.photos/400/600?random=1',
    'likes': 1234,
    'comments': 56,
    'shares': 23,
    'createdAt': '2024-01-15T10:30:00Z',
    'isLiked': false,
    'isSaved': false,
  },
  {
    'id': 'post2',
    'userId': 'user2',
    'username': 'tech_guru_sam',
    'userAvatar': 'https://i.pravatar.cc/150?img=2',
    'caption':
        'Just unboxed the latest smartphone! Review coming soon 📱 #TechReview #Gadgets',
    'imageUrl': 'https://picsum.photos/400/600?random=2',
    'likes': 892,
    'comments': 34,
    'shares': 12,
    'createdAt': '2024-01-15T09:15:00Z',
    'isLiked': true,
    'isSaved': false,
  },
  {
    'id': 'post3',
    'userId': 'user3',
    'username': 'makeup_queen_lisa',
    'userAvatar': 'https://i.pravatar.cc/150?img=3',
    'caption':
        'Glam look for tonight 💄✨ Products linked in bio #MakeupTutorial #Beauty',
    'imageUrl': 'https://picsum.photos/400/600?random=3',
    'likes': 2341,
    'comments': 89,
    'shares': 45,
    'createdAt': '2024-01-15T08:00:00Z',
    'isLiked': true,
    'isSaved': true,
  },
  {
    'id': 'post4',
    'userId': 'user4',
    'username': 'fitness_mike',
    'userAvatar': 'https://i.pravatar.cc/150?img=4',
    'caption':
        'Leg day gains! 💪 Who else crushed their workout today? #Fitness #GymLife',
    'imageUrl': 'https://picsum.photos/400/600?random=4',
    'likes': 1567,
    'comments': 67,
    'shares': 28,
    'createdAt': '2024-01-14T18:45:00Z',
    'isLiked': false,
    'isSaved': true,
  },
  {
    'id': 'post5',
    'userId': 'user5',
    'username': 'chef_anna',
    'userAvatar': 'https://i.pravatar.cc/150?img=5',
    'caption':
        'Homemade pasta perfection 🍝 Recipe in my latest video! #Cooking #Foodie',
    'imageUrl': 'https://picsum.photos/400/600?random=5',
    'likes': 987,
    'comments': 42,
    'shares': 19,
    'createdAt': '2024-01-14T17:30:00Z',
    'isLiked': false,
    'isSaved': false,
  },
];

/// Mock stories data
final List<Map<String, dynamic>> mockStories = [
  {
    'id': 'story1',
    'userId': 'user1',
    'username': 'fashionista_maya',
    'userAvatar': 'https://i.pravatar.cc/150?img=1',
    'imageUrl': 'https://picsum.photos/400/700?random=11',
    'hasViewed': false,
    'createdAt': '2024-01-15T12:00:00Z',
  },
  {
    'id': 'story2',
    'userId': 'user2',
    'username': 'tech_guru_sam',
    'userAvatar': 'https://i.pravatar.cc/150?img=2',
    'imageUrl': 'https://picsum.photos/400/700?random=12',
    'hasViewed': true,
    'createdAt': '2024-01-15T11:30:00Z',
  },
  {
    'id': 'story3',
    'userId': 'user3',
    'username': 'makeup_queen_lisa',
    'userAvatar': 'https://i.pravatar.cc/150?img=3',
    'imageUrl': 'https://picsum.photos/400/700?random=13',
    'hasViewed': false,
    'createdAt': '2024-01-15T11:00:00Z',
  },
];

/// Mock data provider class for posts
class MockPostsData {
  static List<Map<String, dynamic>> getPosts() => mockPosts;
  
  static List<Map<String, dynamic>> getComments(String postId) => [
    {
      'id': 'comment1',
      'userId': 'user1',
      'username': 'fashionista_maya',
      'userAvatar': 'https://i.pravatar.cc/150?img=1',
      'text': 'Love this outfit! 😍',
      'createdAt': '2024-01-15T10:35:00Z',
    },
    {
      'id': 'comment2',
      'userId': 'user2',
      'username': 'tech_guru_sam',
      'userAvatar': 'https://i.pravatar.cc/150?img=2',
      'text': 'Great style! Where did you get that jacket?',
      'createdAt': '2024-01-15T10:40:00Z',
    },
  ];
}

/// Mock data provider class for stories
class MockStoriesData {
  static List<Map<String, dynamic>> getStories() => mockStories;
}