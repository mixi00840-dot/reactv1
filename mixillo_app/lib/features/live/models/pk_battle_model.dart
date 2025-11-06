class PKBattleModel {
  final String battleId;
  final PKBattleHost host1;
  final PKBattleHost host2;
  final PKBattleHost? host3; // For 2v2
  final PKBattleHost? host4; // For 2v2
  final int duration; // in seconds
  final String status; // 'pending', 'active', 'completed', 'cancelled'
  final DateTime? startedAt;
  final DateTime? endsAt;
  final DateTime? completedAt;
  final String? winnerId;
  final PKBattleStats stats;
  final BattleType type; // '1v1' or '2v2'

  PKBattleModel({
    required this.battleId,
    required this.host1,
    required this.host2,
    this.host3,
    this.host4,
    required this.duration,
    required this.status,
    this.startedAt,
    this.endsAt,
    this.completedAt,
    this.winnerId,
    required this.stats,
    this.type = BattleType.oneVsOne,
  });

  factory PKBattleModel.fromJson(Map<String, dynamic> json) {
    final hosts = json['hosts'] ?? [];
    final is2v2 = hosts.length == 4;
    
    return PKBattleModel(
      battleId: json['battleId'] ?? json['battle_id'] ?? '',
      host1: PKBattleHost.fromJson(json['host1'] ?? hosts[0] ?? {}),
      host2: PKBattleHost.fromJson(json['host2'] ?? hosts[1] ?? {}),
      host3: is2v2 && hosts.length > 2 
          ? PKBattleHost.fromJson(hosts[2] ?? {})
          : json['host3'] != null 
              ? PKBattleHost.fromJson(json['host3'])
              : null,
      host4: is2v2 && hosts.length > 3
          ? PKBattleHost.fromJson(hosts[3] ?? {})
          : json['host4'] != null
              ? PKBattleHost.fromJson(json['host4'])
              : null,
      duration: json['duration'] ?? 300,
      status: json['status'] ?? 'pending',
      startedAt: json['startedAt'] != null
          ? DateTime.parse(json['startedAt'].toString())
          : null,
      endsAt: json['endsAt'] != null
          ? DateTime.parse(json['endsAt'].toString())
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : null,
      winnerId: json['winner'] ?? json['winnerId'],
      stats: PKBattleStats.fromJson(json['stats'] ?? {}),
      type: is2v2 ? BattleType.twoVsTwo : BattleType.oneVsOne,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'battleId': battleId,
      'host1': host1.toJson(),
      'host2': host2.toJson(),
      if (host3 != null) 'host3': host3!.toJson(),
      if (host4 != null) 'host4': host4!.toJson(),
      'duration': duration,
      'status': status,
      'startedAt': startedAt?.toIso8601String(),
      'endsAt': endsAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'winnerId': winnerId,
      'stats': stats.toJson(),
      'type': type.name,
    };
  }

  List<PKBattleHost> get allHosts {
    final hosts = [host1, host2];
    if (host3 != null) hosts.add(host3!);
    if (host4 != null) hosts.add(host4!);
    return hosts;
  }

  int get totalScore {
    return allHosts.fold(0, (sum, host) => sum + host.score);
  }

  int? get remainingSeconds {
    if (endsAt == null) return null;
    final remaining = endsAt!.difference(DateTime.now()).inSeconds;
    return remaining > 0 ? remaining : 0;
  }

  bool get isActive => status == 'active';
  bool get isCompleted => status == 'completed';
}

class PKBattleHost {
  final String userId;
  final String streamId;
  final String username;
  final String? avatar;
  final int score;
  final List<PKBattleGift> gifts;
  final int viewerCount;
  final bool isWinner;

  PKBattleHost({
    required this.userId,
    required this.streamId,
    required this.username,
    this.avatar,
    this.score = 0,
    this.gifts = const [],
    this.viewerCount = 0,
    this.isWinner = false,
  });

  factory PKBattleHost.fromJson(Map<String, dynamic> json) {
    return PKBattleHost(
      userId: json['userId'] ?? json['user']?['_id'] ?? json['user']?['id'] ?? '',
      streamId: json['streamId'] ?? json['stream']?['_id'] ?? json['stream']?['id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? '@user',
      avatar: json['avatar'] ?? json['user']?['avatar'],
      score: json['score'] ?? 0,
      gifts: (json['gifts'] ?? []).map((g) => PKBattleGift.fromJson(g)).toList(),
      viewerCount: json['viewerCount'] ?? json['viewers'] ?? 0,
      isWinner: json['isWinner'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'streamId': streamId,
      'username': username,
      'avatar': avatar,
      'score': score,
      'gifts': gifts.map((g) => g.toJson()).toList(),
      'viewerCount': viewerCount,
      'isWinner': isWinner,
    };
  }

  PKBattleHost copyWith({
    String? userId,
    String? streamId,
    String? username,
    String? avatar,
    int? score,
    List<PKBattleGift>? gifts,
    int? viewerCount,
    bool? isWinner,
  }) {
    return PKBattleHost(
      userId: userId ?? this.userId,
      streamId: streamId ?? this.streamId,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      score: score ?? this.score,
      gifts: gifts ?? this.gifts,
      viewerCount: viewerCount ?? this.viewerCount,
      isWinner: isWinner ?? this.isWinner,
    );
  }
}

class PKBattleGift {
  final String giftId;
  final String giftName;
  final String? giftIcon;
  final int amount;
  final double value;
  final String senderId;
  final String senderUsername;
  final DateTime timestamp;

  PKBattleGift({
    required this.giftId,
    required this.giftName,
    this.giftIcon,
    required this.amount,
    required this.value,
    required this.senderId,
    required this.senderUsername,
    required this.timestamp,
  });

  factory PKBattleGift.fromJson(Map<String, dynamic> json) {
    return PKBattleGift(
      giftId: json['giftId'] ?? json['gift']?['_id'] ?? json['gift']?['id'] ?? '',
      giftName: json['giftName'] ?? json['gift']?['name'] ?? 'Gift',
      giftIcon: json['giftIcon'] ?? json['gift']?['icon'],
      amount: json['amount'] ?? 1,
      value: (json['value'] ?? 0).toDouble(),
      senderId: json['senderId'] ?? json['sender']?['_id'] ?? json['sender']?['id'] ?? '',
      senderUsername: json['senderUsername'] ?? json['sender']?['username'] ?? '@user',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'giftId': giftId,
      'giftName': giftName,
      'giftIcon': giftIcon,
      'amount': amount,
      'value': value,
      'senderId': senderId,
      'senderUsername': senderUsername,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class PKBattleStats {
  final int totalGifts;
  final double totalValue;
  final int totalViewers;
  final int peakViewers;

  PKBattleStats({
    this.totalGifts = 0,
    this.totalValue = 0.0,
    this.totalViewers = 0,
    this.peakViewers = 0,
  });

  factory PKBattleStats.fromJson(Map<String, dynamic> json) {
    return PKBattleStats(
      totalGifts: json['totalGifts'] ?? json['total_gifts'] ?? 0,
      totalValue: (json['totalValue'] ?? json['total_value'] ?? 0).toDouble(),
      totalViewers: json['totalViewers'] ?? json['total_viewers'] ?? 0,
      peakViewers: json['peakViewers'] ?? json['peak_viewers'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalGifts': totalGifts,
      'totalValue': totalValue,
      'totalViewers': totalViewers,
      'peakViewers': peakViewers,
    };
  }
}

enum BattleType {
  oneVsOne,
  twoVsTwo,
}

