import 'models/live_stream.dart';
import 'models/live_stream_model.dart' as live_model;

/// Mock data for live streams
final List<LiveStream> mockLiveStreams = [
  LiveStream(
    id: 'live1',
    hostId: 'user1',
    hostUsername: 'fashionista_maya',
    hostAvatar: 'https://i.pravatar.cc/150?img=1',
    title: '🔥 New Summer Collection Showcase',
    description: 'Check out the hottest summer trends! 50% off today only!',
    thumbnailUrl: 'https://picsum.photos/400/300?random=1',
    status: 'live',
    viewerCount: 1234,
    likeCount: 5678,
    giftCount: 234,
    startedAt: DateTime.now().subtract(const Duration(minutes: 15)),
    createdAt: DateTime.now().subtract(const Duration(hours: 1)),
  ),
  LiveStream(
    id: 'live2',
    hostId: 'user2',
    hostUsername: 'tech_guru_sam',
    hostAvatar: 'https://i.pravatar.cc/150?img=2',
    title: 'Latest Gadgets Unboxing 📱',
    description: 'Unboxing the newest tech! Ask me anything!',
    thumbnailUrl: 'https://picsum.photos/400/300?random=2',
    status: 'live',
    viewerCount: 892,
    likeCount: 3421,
    giftCount: 156,
    startedAt: DateTime.now().subtract(const Duration(minutes: 25)),
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  ),
  LiveStream(
    id: 'live3',
    hostId: 'user3',
    hostUsername: 'makeup_queen_lisa',
    hostAvatar: 'https://i.pravatar.cc/150?img=3',
    title: '💄 Everyday Makeup Tutorial',
    description: 'Learn my 10-minute makeup routine!',
    thumbnailUrl: 'https://picsum.photos/400/300?random=3',
    status: 'live',
    viewerCount: 2341,
    likeCount: 8765,
    giftCount: 432,
    startedAt: DateTime.now().subtract(const Duration(minutes: 40)),
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
  ),
  LiveStream(
    id: 'live4',
    hostId: 'user4',
    hostUsername: 'fitness_mike',
    hostAvatar: 'https://i.pravatar.cc/150?img=4',
    title: '🏋️ Live Workout Session',
    description: 'Join my 30-minute HIIT workout!',
    thumbnailUrl: 'https://picsum.photos/400/300?random=4',
    status: 'pending',
    viewerCount: 0,
    likeCount: 0,
    giftCount: 0,
    scheduledAt: DateTime.now().add(const Duration(hours: 2)),
    createdAt: DateTime.now().subtract(const Duration(hours: 12)),
  ),
  LiveStream(
    id: 'live5',
    hostId: 'user5',
    hostUsername: 'chef_anna',
    hostAvatar: 'https://i.pravatar.cc/150?img=5',
    title: '🍳 Cooking Live: Italian Pasta',
    description: 'Making authentic Italian carbonara from scratch',
    thumbnailUrl: 'https://picsum.photos/400/300?random=5',
    status: 'ended',
    viewerCount: 1567,
    likeCount: 4532,
    giftCount: 287,
    startedAt: DateTime.now().subtract(const Duration(hours: 5)),
    endedAt: DateTime.now().subtract(const Duration(hours: 4)),
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
  ),
];

/// Mock gifts for live streams  
final List<Map<String, dynamic>> mockLiveGifts = [
  {
    'id': 'gift1',
    'name': 'Rose',
    'icon': '🌹',
    'coins': 10,
    'color': 0xFFFF4458,
  },
  {
    'id': 'gift2',
    'name': 'Heart',
    'icon': '❤️',
    'coins': 50,
    'color': 0xFFE91E63,
  },
  {
    'id': 'gift3',
    'name': 'Diamond',
    'icon': '💎',
    'coins': 100,
    'color': 0xFF2196F3,
  },
  {
    'id': 'gift4',
    'name': 'Crown',
    'icon': '👑',
    'coins': 500,
    'color': 0xFFFFD700,
  },
  {
    'id': 'gift5',
    'name': 'Rocket',
    'icon': '🚀',
    'coins': 1000,
    'color': 0xFF9C27B0,
  },
  {
    'id': 'gift6',
    'name': 'Trophy',
    'icon': '🏆',
    'coins': 2000,
    'color': 0xFFFF9800,
  },
];

/// Mock data provider class for live streaming
class MockLiveData {
  static List<LiveStream> getLiveStreams() => mockLiveStreams;
  
  static List<live_model.LiveMessage> getMockMessages() => [
    live_model.LiveMessage(
      id: 'msg1',
      userId: 'user1',
      username: 'viewer123',
      message: 'Amazing stream! 🔥',
      timestamp: DateTime.now(),
    ),
    live_model.LiveMessage(
      id: 'msg2',
      userId: 'user2',
      username: 'fashion_lover',
      message: 'Where did you get that top?',
      timestamp: DateTime.now(),
    ),
  ];
  
  static List<live_model.LiveViewer> getMockViewers() => [
    live_model.LiveViewer(
      id: 'viewer1',
      username: 'viewer123',
      avatar: 'https://i.pravatar.cc/150?img=10',
      level: 5,
      joinedAt: DateTime.now(),
    ),
    live_model.LiveViewer(
      id: 'viewer2',
      username: 'fashion_lover',
      avatar: 'https://i.pravatar.cc/150?img=11',
      level: 8,
      joinedAt: DateTime.now(),
    ),
  ];

  static List<dynamic> getGiftsList() => mockLiveGifts;

  static live_model.PkBattle getMockPkBattle() => live_model.PkBattle(
    id: 'pk1',
    host1Id: 'user1',
    host1Name: 'fashionista_maya',
    host1Avatar: 'https://i.pravatar.cc/150?img=1',
    host1Score: 150,
    host2Id: 'user2',
    host2Name: 'style_master',
    host2Avatar: 'https://i.pravatar.cc/150?img=2',
    host2Score: 120,
    startTime: DateTime.now().subtract(const Duration(minutes: 2)),
    status: live_model.PkBattleStatus.ongoing,
  );
  
  static List<Map<String, dynamic>> getLiveGifts() => mockLiveGifts;
}
