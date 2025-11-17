/// PKBattle Model - Live PK battles
/// Matches backend/src/models/PKBattle.js
enum PKBattleStatus {
  pending,
  active,
  completed,
  cancelled;

  static PKBattleStatus fromString(String value) {
    return PKBattleStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => PKBattleStatus.pending,
    );
  }
}

class PKParticipant {
  final String userId;
  final int score;
  final int giftValue;
  final int supporterCount;

  PKParticipant({
    required this.userId,
    this.score = 0,
    this.giftValue = 0,
    this.supporterCount = 0,
  });

  factory PKParticipant.fromJson(Map<String, dynamic> json) {
    return PKParticipant(
      userId: json['userId'],
      score: json['score'] ?? 0,
      giftValue: json['giftValue'] ?? 0,
      supporterCount: json['supporterCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'score': score,
      'giftValue': giftValue,
      'supporterCount': supporterCount,
    };
  }
}

class PKBattleModel {
  final String id;
  final String liveStreamId;
  final List<PKParticipant> participants;
  final PKBattleStatus status;
  final int durationMinutes;
  final DateTime? startTime;
  final DateTime? endTime;
  final String? winnerId;
  final Map<String, dynamic>? prizes;
  final Map<String, dynamic>? rules;
  final DateTime createdAt;
  final DateTime updatedAt;

  PKBattleModel({
    required this.id,
    required this.liveStreamId,
    required this.participants,
    this.status = PKBattleStatus.pending,
    this.durationMinutes = 10,
    this.startTime,
    this.endTime,
    this.winnerId,
    this.prizes,
    this.rules,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PKBattleModel.fromJson(Map<String, dynamic> json) {
    return PKBattleModel(
      id: json['_id'] ?? json['id'],
      liveStreamId: json['liveStream'] ?? json['liveStreamId'],
      participants: json['participants'] != null
          ? (json['participants'] as List)
              .map((p) => PKParticipant.fromJson(p))
              .toList()
          : [],
      status: PKBattleStatus.fromString(json['status'] ?? 'pending'),
      durationMinutes: json['durationMinutes'] ?? 10,
      startTime:
          json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      endTime: json['endTime'] != null ? DateTime.parse(json['endTime']) : null,
      winnerId: json['winner'],
      prizes: json['prizes'],
      rules: json['rules'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'liveStream': liveStreamId,
      'participants': participants.map((p) => p.toJson()).toList(),
      'status': status.name,
      'durationMinutes': durationMinutes,
      if (startTime != null) 'startTime': startTime!.toIso8601String(),
      if (endTime != null) 'endTime': endTime!.toIso8601String(),
      if (winnerId != null) 'winner': winnerId,
      if (prizes != null) 'prizes': prizes,
      if (rules != null) 'rules': rules,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == PKBattleStatus.active;
  bool get isCompleted => status == PKBattleStatus.completed;
  bool get hasWinner => winnerId != null;

  Duration? get timeRemaining {
    if (startTime == null || status != PKBattleStatus.active) return null;
    final endExpected = startTime!.add(Duration(minutes: durationMinutes));
    final remaining = endExpected.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }

  PKParticipant? getLeader() {
    if (participants.isEmpty) return null;
    return participants.reduce((a, b) => a.score > b.score ? a : b);
  }
}
