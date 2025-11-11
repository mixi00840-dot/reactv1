class LiveStream {
  final String id;
  final String hostId;
  final String hostName;
  final String hostAvatar;
  final String title;
  final String coverImage;
  final int viewerCount;
  final int totalViewers;
  final int likeCount;
  final int giftCount;
  final DateTime startedAt;
  final bool isLive;
  final List<String> tags;
  final bool isPkBattle;
  final String? pkOpponentId;

  LiveStream({
    required this.id,
    required this.hostId,
    required this.hostName,
    required this.hostAvatar,
    required this.title,
    required this.coverImage,
    required this.viewerCount,
    required this.totalViewers,
    required this.likeCount,
    required this.giftCount,
    required this.startedAt,
    this.isLive = true,
    this.tags = const [],
    this.isPkBattle = false,
    this.pkOpponentId,
  });

  String get duration {
    final now = DateTime.now();
    final diff = now.difference(startedAt);
    final hours = diff.inHours;
    final minutes = diff.inMinutes % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}

class LiveViewer {
  final String id;
  final String username;
  final String avatar;
  final int level;
  final bool isVip;
  final DateTime joinedAt;

  LiveViewer({
    required this.id,
    required this.username,
    required this.avatar,
    required this.level,
    this.isVip = false,
    required this.joinedAt,
  });
}

class LiveGift {
  final String id;
  final String name;
  final String icon;
  final int coins;
  final int diamonds;
  final String animation;
  final String rarity; // common, rare, epic, legendary

  LiveGift({
    required this.id,
    required this.name,
    required this.icon,
    required this.coins,
    required this.diamonds,
    required this.animation,
    this.rarity = 'common',
  });

  String get costDisplay {
    if (diamonds > 0) return '$diamonds 💎';
    return '$coins 🪙';
  }
}

class LiveMessage {
  final String id;
  final String userId;
  final String username;
  final String? userAvatar;
  final String message;
  final DateTime timestamp;
  final LiveMessageType type;
  final LiveGift? gift;
  final int? giftCount;

  LiveMessage({
    required this.id,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.message,
    required this.timestamp,
    this.type = LiveMessageType.text,
    this.gift,
    this.giftCount,
  });
}

enum LiveMessageType {
  text,
  gift,
  joined,
  system,
}

class PkBattle {
  final String id;
  final String host1Id;
  final String host1Name;
  final String host1Avatar;
  final int host1Score;
  final String host2Id;
  final String host2Name;
  final String host2Avatar;
  final int host2Score;
  final DateTime startTime;
  final Duration duration;
  final PkBattleStatus status;

  PkBattle({
    required this.id,
    required this.host1Id,
    required this.host1Name,
    required this.host1Avatar,
    this.host1Score = 0,
    required this.host2Id,
    required this.host2Name,
    required this.host2Avatar,
    this.host2Score = 0,
    required this.startTime,
    this.duration = const Duration(minutes: 5),
    this.status = PkBattleStatus.ongoing,
  });

  Duration get remainingTime {
    final elapsed = DateTime.now().difference(startTime);
    final remaining = duration - elapsed;
    return remaining.isNegative ? Duration.zero : remaining;
  }

  String get remainingTimeFormatted {
    final remaining = remainingTime;
    final minutes = remaining.inMinutes;
    final seconds = remaining.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  double get host1Progress => host1Score + host2Score > 0 
      ? host1Score / (host1Score + host2Score) 
      : 0.5;

  bool get isHost1Winning => host1Score > host2Score;
  bool get isHost2Winning => host2Score > host1Score;
  bool get isTied => host1Score == host2Score;
}

enum PkBattleStatus {
  waiting,
  ongoing,
  finished,
}
