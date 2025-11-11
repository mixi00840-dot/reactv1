/// User profile data model
class UserProfile {
  final String id;
  final String username;
  final String displayName;
  final String bio;
  final String avatarUrl;
  final String coverImageUrl;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int reelsCount;
  final int likesCount;
  final bool isVerified;
  final bool isPrivate;
  final DateTime createdAt;
  final WalletInfo wallet;

  UserProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.bio,
    required this.avatarUrl,
    required this.coverImageUrl,
    required this.followersCount,
    required this.followingCount,
    required this.postsCount,
    required this.reelsCount,
    required this.likesCount,
    this.isVerified = false,
    this.isPrivate = false,
    required this.createdAt,
    required this.wallet,
  });
}

/// Wallet information
class WalletInfo {
  final String id;
  final int coinBalance;
  final int diamondBalance;
  final List<Transaction> recentTransactions;

  WalletInfo({
    required this.id,
    required this.coinBalance,
    required this.diamondBalance,
    required this.recentTransactions,
  });
}

/// Transaction model
class Transaction {
  final String id;
  final TransactionType type;
  final int amount;
  final String description;
  final DateTime createdAt;
  final bool isIncome;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
    required this.isIncome,
  });
}

/// Transaction types
enum TransactionType {
  purchase,
  gift,
  reward,
  withdrawal,
  refund,
  earnings,
}
