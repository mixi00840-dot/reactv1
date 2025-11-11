import 'models/user_profile_model.dart';

/// Mock profile data
class MockProfileData {
  static UserProfile getCurrentUserProfile() {
    return UserProfile(
      id: '1',
      username: '@johndoe',
      displayName: 'John Doe',
      bio: '✨ Content Creator | Tech Enthusiast\n🎥 Daily Videos & Posts\n🌍 Living my best life',
      avatarUrl: 'https://i.pravatar.cc/300?img=1',
      coverImageUrl: 'https://picsum.photos/800/300',
      followersCount: 125400,
      followingCount: 543,
      postsCount: 234,
      reelsCount: 89,
      likesCount: 1240000,
      isVerified: true,
      isPrivate: false,
      createdAt: DateTime.now().subtract(const Duration(days: 365)),
      wallet: WalletInfo(
        id: 'wallet_1',
        coinBalance: 12500,
        diamondBalance: 450,
        recentTransactions: _getMockTransactions(),
      ),
    );
  }

  static List<Transaction> _getMockTransactions() {
    return [
      Transaction(
        id: 't1',
        type: TransactionType.earnings,
        amount: 500,
        description: 'Video rewards',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        isIncome: true,
      ),
      Transaction(
        id: 't2',
        type: TransactionType.gift,
        amount: 1200,
        description: 'Gift from @janedoe',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        isIncome: true,
      ),
      Transaction(
        id: 't3',
        type: TransactionType.purchase,
        amount: 300,
        description: 'Coin package purchase',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        isIncome: false,
      ),
      Transaction(
        id: 't4',
        type: TransactionType.reward,
        amount: 750,
        description: 'Daily login bonus',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        isIncome: true,
      ),
      Transaction(
        id: 't5',
        type: TransactionType.gift,
        amount: 2500,
        description: 'Live stream gifts',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
        isIncome: true,
      ),
    ];
  }

  /// Mock posts grid data
  static List<String> getUserPostImages() {
    return List.generate(
      24,
      (index) => 'https://picsum.photos/400/400?random=$index',
    );
  }

  /// Mock reels grid data
  static List<String> getUserReelsThumbnails() {
    return List.generate(
      18,
      (index) => 'https://picsum.photos/400/600?random=${index + 100}',
    );
  }
}
